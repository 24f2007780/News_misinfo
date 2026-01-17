"""Google Cloud Platform native evidence retriever for fact-checking.

This module provides a drop-in replacement for Exa using:
- Google Programmable Search Engine (Custom Search JSON API) for web results
- Vertex AI Embeddings for semantic relevance
- Custom re-ranking for optimal evidence retrieval
"""

import os
import logging
import requests
from typing import List, Dict, Optional
from datetime import datetime, timezone
import json
import numpy as np

# Optional imports for Generative AI (Gemini) embeddings
try:
    from google import genai  # type: ignore
    _HAS_GENAI = True
except Exception:
    _HAS_GENAI = False
    logging.warning("Google Generative AI SDK not available. Install with: pip install google-genai")

# Optional async HTTP client
try:
    import httpx  # type: ignore
    _HAS_HTTPX = True
except Exception:
    _HAS_HTTPX = False

logger = logging.getLogger(__name__)


class GoogleEvidenceRetriever:
    """Evidence retriever using Google Cloud Platform services."""
    
    def __init__(
        self, 
        api_key: Optional[str] = None, 
        cx: Optional[str] = None,
        project_id: Optional[str] = None,
        location: str = "us-central1"
    ):
        """Initialize the Google evidence retriever.
        
        Args:
            api_key: Google Custom Search API key
            cx: Custom Search Engine ID
            project_id: GCP project ID for Vertex AI
            location: GCP location for Vertex AI services
        """
        self.api_key = api_key or os.getenv("GCP_SEARCH_API_KEY")
        self.cx = cx or os.getenv("GCP_CUSTOM_SEARCH_ENGINE_ID")
        self.project_id = project_id or os.getenv("GCP_PROJECT_ID")
        self.location = location
        
        if not self.api_key:
            raise ValueError("Google Custom Search API key is required")
        if not self.cx:
            raise ValueError("Custom Search Engine ID is required")
        
        # Initialize Gemini embeddings client if available
        self._genai_client = None
        if _HAS_GENAI and os.getenv("GOOGLE_API_KEY"):
            try:
                self._genai_client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
                logger.info("Gemini client initialized for embeddings")
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini client: {e}")
                self._genai_client = None
        else:
            logger.info("Using fallback embedding method (simple vector)")
        # Simple file cache
        self.cache_path = os.getenv("GCP_SEARCH_CACHE", os.path.join("logs", ".google_search_cache.json"))
        os.makedirs(os.path.dirname(self.cache_path) or ".", exist_ok=True)
        self._cache = self._load_cache()
    
    def search_web(self, query: str, num_results: int = 10) -> List[Dict]:
        """Query Google Custom Search and retrieve snippets.
        
        Args:
            query: Search query string
            num_results: Number of results to retrieve
            
        Returns:
            List of search results with title, link, and snippet
        """
        # Cache first
        cache_key = f"sync::{query}::{num_results}"
        if cache_key in self._cache:
            return self._cache[cache_key]

        # Enforce daily API quota before making a request
        if not _quota_manager.can_consume(1):
            logger.warning("Daily API quota reached. Skipping Google Custom Search call.")
            return []

        url = "https://www.googleapis.com/customsearch/v1"
        params = {
            "q": query, 
            "key": self.api_key, 
            "cx": self.cx, 
            "num": min(num_results, 10)  # Google CSE max is 10 per request
        }
        
        try:
            # Basic retry/backoff for transient errors
            for attempt in range(2):
                try:
                    response = requests.get(url, params=params, timeout=30)
                    response.raise_for_status()
                    results = response.json()
                    break
                except requests.exceptions.HTTPError as he:  # 429/5xx
                    if attempt == 0 and (response.status_code >= 500 or response.status_code == 429):
                        import time as _t
                        _t.sleep(1.5)
                        continue
                    raise
            
            hits = []
            for item in results.get("items", []):
                hits.append({
                    "title": item.get("title", ""),
                    "link": item.get("link", ""),
                    "snippet": item.get("snippet", ""),
                    "display_link": item.get("displayLink", ""),
                    "source": "google_custom_search"
                })
            
            # Consume 1 unit for this successful API call
            _quota_manager.consume(1)
            logger.info(f"Retrieved {len(hits)} results for query: {query}")
            # Cache and persist
            self._cache[cache_key] = hits
            self._save_cache()
            return hits
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error in Google Custom Search: {e}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error in search: {e}")
            return []

    async def search_web_async(self, query: str, num_results: int = 10) -> List[Dict]:
        """Async version using httpx if available; falls back to sync in thread.

        Returns the same structure as search_web.
        """
        cache_key = f"async::{query}::{num_results}"
        if cache_key in self._cache:
            return self._cache[cache_key]

        if not _quota_manager.can_consume(1):
            logger.warning("Daily API quota reached. Skipping Google Custom Search call.")
            return []

        if not _HAS_HTTPX:
            # Fallback: run sync in thread to avoid blocking loop
            import asyncio as _asyncio
            loop = _asyncio.get_running_loop()
            hits = await loop.run_in_executor(None, lambda: self.search_web(query, num_results))
            # search_web already consumes quota/cache, so return
            return hits

        url = "https://www.googleapis.com/customsearch/v1"
        params = {"q": query, "key": self.api_key, "cx": self.cx, "num": min(num_results, 10)}
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.get(url, params=params)
                resp.raise_for_status()
                results = resp.json()
            hits: List[Dict] = []
            for item in results.get("items", []):
                hits.append({
                    "title": item.get("title", ""),
                    "link": item.get("link", ""),
                    "snippet": item.get("snippet", ""),
                    "display_link": item.get("displayLink", ""),
                    "source": "google_custom_search"
                })
            _quota_manager.consume(1)
            logger.info(f"Retrieved {len(hits)} results for query: {query}")
            self._cache[cache_key] = hits
            self._save_cache()
            return hits
        except Exception as e:
            logger.error(f"Async Google Custom Search error: {e}")
            return []
    
    def embed_text(self, text: str) -> Optional[List[float]]:
        """Generate embedding for text using Gemini or fallback method.
        
        Args:
            text: Text to embed
            
        Returns:
            Embedding vector or None if failed
        """
        if not text or len(text.strip()) == 0:
            return None
            
        try:
            if self._genai_client:
                # Use Gemini text-embedding-004
                resp = self._genai_client.models.embed_content(
                    model="text-embedding-004",
                    contents=text,
                )
                return resp.embeddings.values if hasattr(resp, "embeddings") else resp["embedding"]["values"]
            else:
                # Fallback: simple TF-IDF like approach
                return self._simple_embedding(text)
        except Exception as e:
            logger.warning(f"Falling back to simple embedding: {e}")
            return self._simple_embedding(text)

    
    def _simple_embedding(self, text: str) -> List[float]:
        """Simple fallback embedding method using word frequency."""
        import re
        from collections import Counter
        
        # Simple text preprocessing
        words = re.findall(r'\b\w+\b', text.lower())
        word_freq = Counter(words)
        
        # Create a simple vector (this is a basic fallback)
        # In production, you'd want a proper embedding model
        max_freq = max(word_freq.values()) if word_freq else 1
        vector = [word_freq.get(word, 0) / max_freq for word in sorted(word_freq.keys())]
        
        return vector if vector else [0.0]
    
    def calculate_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors.
        
        Args:
            vec1: First vector
            vec2: Second vector
            
        Returns:
            Similarity score between 0 and 1
        """
        if not vec1 or not vec2:
            return 0.0
            
        # Pad vectors to same length if needed
        max_len = max(len(vec1), len(vec2))
        vec1_padded = vec1 + [0.0] * (max_len - len(vec1))
        vec2_padded = vec2 + [0.0] * (max_len - len(vec2))
        
        try:
            # Calculate cosine similarity
            dot_product = sum(a * b for a, b in zip(vec1_padded, vec2_padded))
            norm1 = np.linalg.norm(vec1_padded)
            norm2 = np.linalg.norm(vec2_padded)
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
                
            return dot_product / (norm1 * norm2)
        except Exception as e:
            logger.error(f"Error calculating similarity: {e}")
            return 0.0
    
def rerank(self, query: str, docs: List[Dict]) -> List[Dict]:
    if not docs:
        return []

    query_embedding = self.embed_text(query)
    if not query_embedding:
        return docs

    scored = []

    domain_boosts = {
        ".gov": 0.08,
        ".edu": 0.06,
        ".org": 0.02,
    }

    def dtype_boost(link: str) -> float:
        link = (link or "").lower()
        b = 0.0
        if link.endswith(".pdf"):
            b += 0.02
        if "wikipedia.org" in link:
            b += 0.01
        return b

    seen_links = set()
    for doc in docs:
        link = doc.get("link")
        if not link or link in seen_links:
            continue
        seen_links.add(link)

        doc_embedding = self.embed_text(doc.get("snippet", ""))
        if doc_embedding:
            similarity = self.calculate_similarity(query_embedding, doc_embedding)
            if similarity < 0.3:
                continue  # filter out low similarity

            display_link = (doc.get("display_link") or link).lower()
            prior = 0.0
            for suffix, boost in domain_boosts.items():
                if suffix in display_link:
                    prior = max(prior, boost)

            db = dtype_boost(link)
            scored.append((similarity + prior + db, doc))
        else:
            scored.append((0.0, doc))

    scored.sort(key=lambda x: x[0], reverse=True)

    reranked = []
    for score, doc in scored:
        doc_with_score = doc.copy()
        doc_with_score["similarity_score"] = round(score, 4)
        reranked.append(doc_with_score)

    logger.info(f"Re-ranked {len(reranked)} documents after filtering and deduplication")
    return reranked
    
    def retrieve_evidence(
        self, 
        query: str, 
        top_k: int = 5,
        search_results: int = 10
    ) -> List[Dict]:
        """Complete evidence retrieval pipeline.
        
        Args:
            query: Search query for fact verification
            top_k: Number of top results to return
            search_results: Number of initial search results to retrieve
            
        Returns:
            List of top-k most relevant evidence documents
        """
        logger.info(f"Retrieving evidence for query: {query}")
        
        # Step 1: Web search
        hits = self.search_web(query, num_results=search_results)
        if not hits:
            logger.warning("No search results found")
            return []
        
        # Step 2: Semantic re-ranking
        reranked = self.rerank(query, hits)
        
        # Step 3: Return top-k results
        top_results = reranked[:top_k]
        
        logger.info(f"Retrieved {len(top_results)} evidence documents")
        return top_results

    async def retrieve_evidence_async(
        self,
        query: str,
        top_k: int ,
        search_results: int = 10,
    ) -> List[Dict]:
        """Async wrapper using async search when possible."""
        logger.info(f"Retrieving evidence (async) for query: {query}")
        hits = await self.search_web_async(query, num_results=search_results)
        if not hits:
            logger.warning("No search results found (async)")
            return []
        reranked = self.rerank(query, hits)
        return reranked[:top_k]
    
    def batch_retrieve(self, queries: List[str], top_k: int = 3) -> Dict[str, List[Dict]]:
        """Retrieve evidence for multiple queries in batch.
        
        Args:
            queries: List of search queries
            top_k: Number of top results per query
            
        Returns:
            Dictionary mapping queries to evidence lists
        """
        results = {}
        for query in queries:
            try:
                evidence = self.retrieve_evidence(query, top_k=top_k)
                results[query] = evidence
            except Exception as e:
                logger.error(f"Error retrieving evidence for query '{query}': {e}")
                results[query] = []
        
        return results


class _DailyQuotaManager:
    """Simple file-backed daily quota manager.

    - Uses env GCP_DAILY_QUERY_LIMIT (default 100)
    - Stores counts in logs/.google_quota.json
    - Resets automatically when date changes
    """

    def __init__(self) -> None:
        self.limit = int(os.getenv("GCP_DAILY_QUERY_LIMIT", "100"))
        self.store_path = os.getenv("GCP_QUOTA_STORE", os.path.join("logs", ".google_quota.json"))
        os.makedirs(os.path.dirname(self.store_path) or ".", exist_ok=True)
        self.state = self._load_state()

    def _today_str(self) -> str:
        return datetime.now(timezone.utc).strftime("%Y-%m-%d")

    def _load_state(self) -> Dict[str, int]:
        try:
            if os.path.exists(self.store_path):
                with open(self.store_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
            else:
                data = {}
        except Exception:
            data = {}
        # Reset count if date changed
        today = self._today_str()
        if data.get("date") != today:
            data = {"date": today, "used": 0}
        return data

    def _save_state(self) -> None:
        try:
            with open(self.store_path, "w", encoding="utf-8") as f:
                json.dump(self.state, f)
        except Exception as e:
            logger.warning(f"Failed to persist quota state: {e}")

    def can_consume(self, amount: int) -> bool:
        if self.limit <= 0:
            return True
        today = self._today_str()
        if self.state.get("date") != today:
            self.state = {"date": today, "used": 0}
        return (self.state.get("used", 0) + amount) <= self.limit

    def consume(self, amount: int) -> None:
        if self.limit <= 0:
            return
        today = self._today_str()
        if self.state.get("date") != today:
            self.state = {"date": today, "used": 0}
        self.state["used"] = int(self.state.get("used", 0)) + int(amount)
        self._save_state()


_quota_manager = _DailyQuotaManager()

    # ----- Simple persistent cache -----
def _safe_read_json(path: str) -> Dict:
    try:
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception:
        return {}
    return {}

def _today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")

def _maybe_reset_cache(cache: Dict) -> Dict:
    if cache.get("date") != _today():
        return {"date": _today(), "data": {}}
    return cache

    # Methods bound to instance
def GoogleEvidenceRetriever__load_cache(self) -> Dict:
    raw = _safe_read_json(self.cache_path)
    raw = _maybe_reset_cache(raw or {})
    return raw.get("data", {})

def GoogleEvidenceRetriever__save_cache(self) -> None:
    try:
        payload = {"date": _today(), "data": self._cache}
        with open(self.cache_path, "w", encoding="utf-8") as f:
            json.dump(payload, f)
    except Exception as e:
        logger.warning(f"Failed to persist search cache: {e}")

# Bind helpers to class to avoid cluttering global namespace
setattr(GoogleEvidenceRetriever, "_load_cache", GoogleEvidenceRetriever__load_cache)
setattr(GoogleEvidenceRetriever, "_save_cache", GoogleEvidenceRetriever__save_cache)


# Convenience function for easy integration
def create_evidence_retriever(
    api_key: Optional[str] = None,
    cx: Optional[str] = None,
    project_id: Optional[str] = None,
    location: Optional[str] = None,
) -> GoogleEvidenceRetriever:
    """Create a configured evidence retriever instance.
    
    Args:
        api_key: Google Custom Search API key
        cx: Custom Search Engine ID
        project_id: GCP project ID
        
    Returns:
        Configured GoogleEvidenceRetriever instance
    """
    return GoogleEvidenceRetriever(
        api_key=api_key,
        cx=cx,
        project_id=project_id,
        location=location or "us-central1",
    )


# Example usage and testing
if __name__ == "__main__":
    # Set up logging
    logging.basicConfig(level=logging.INFO)
    
    # Test the retriever
    try:
        retriever = create_evidence_retriever()
        query = "Hittite beekeeping archaeology Turkey large bee species"
        evidence = retriever.retrieve_evidence(query, top_k=3)
        
        print(f"\n--- Evidence for: {query} ---")
        for i, e in enumerate(evidence, 1):
            print(f"\n{i}. {e['title']}")
            print(f"   Snippet: {e['snippet']}")
            print(f"   Link: {e['link']}")
            print(f"   Similarity: {e.get('similarity_score', 'N/A')}")
            
    except Exception as e:
        print(f"Error: {e}")
        print("Make sure to set environment variables:")
        print("- GCP_SEARCH_API_KEY: Your Google Custom Search API key")
        print("- GCP_CUSTOM_SEARCH_ENGINE_ID: Your Custom Search Engine ID")
        print("- GCP_PROJECT_ID: Your GCP project ID (optional, for Vertex AI)")
