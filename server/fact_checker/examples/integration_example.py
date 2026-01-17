"""Integration example showing how to use Google evidence retriever in the fact-checking pipeline.

This example demonstrates:
1. How to replace Exa with Google Cloud Platform services
2. Integration with the existing claim verification workflow
3. Batch evidence retrieval for multiple claims
"""

import asyncio
import logging
import sys
import os
import json

# Add the parent directory to the path to import the fact_checker modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fact_checker.config import Config
from app.services.Claim_Handle.agent import graph as claim_extractor_graph
from app.services.Claim_Handle.schemas import State as ClaimExtractorState
from app.services.Claim_Verification.agent import graph as claim_verifier_graph
from app.services.Claim_Verification.schemas import ClaimVerifierState

from app.services.utils.logging import setup_logging
setup_logging(level=os.getenv("LOG_LEVEL", "INFO"), log_file_path="logs/fact_checker.log")
logger = logging.getLogger(__name__)


class EnhancedClaimVerifier:
    """Thin orchestrator that calls Claim_Handle and Claim_Verification graphs."""
    
    def __init__(self):
        """Initialize the enhanced claim verifier."""
        # Validate configuration
        if not Config.validate_gcp_config():
            raise ValueError("GCP configuration is incomplete. Please check your environment variables.")
        
        logger.info("Enhanced claim verifier initialized successfully (graphs mode)")
    
    # -------- Content-focused helpers (discount style) --------
    def _factual_nucleus_sampling(self, sentences: list) -> list:
        """Keep sentences with higher factual density (entities, numbers, dates)."""
        def score(s: str) -> int:
            import re
            return sum([
                len(re.findall(r"\b[A-Z][a-z]+\b", s)),  # Proper nouns
                len(re.findall(r"\d", s)),                # Numbers/dates
                1 if "according to" in s.lower() or "report" in s.lower() else 0,
            ])
        pairs = [(s.strip(), score(s)) for s in sentences if s and s.strip()]
        pairs.sort(key=lambda x: x[1], reverse=True)
        k = max(1, len(pairs) // 2)
        return [s for s, _ in pairs[:k]]

    def _extract_atomic_claims(self, text: str) -> list:
        """Very lightweight atomic-claim extraction: split and filter declaratives."""
        import re
        parts = re.split(r"(?<=[.!?])\s+", text.strip())
        return [p for p in parts if len(p.split()) >= 6 and not p.endswith("?")]

    def _verdict_from_analysis(self, analysis: dict) -> tuple[str, str, str]:
        # Conservative thresholds: be strict to label True
        if analysis["relevance_score"] < 0.4 or analysis.get("total_sources", 0) < 2:
            return ("Fake/Unverifiable", "LOW", "Insufficient, low-relevance evidence")
        if analysis["credibility_score"] < 0.7:
            return ("Uncertain", "MEDIUM", "Credibility too low for support")
        return ("Real/Supported", "HIGH", f"Credibility {analysis['credibility_score']}")

    def _log_case(self, perspective: str, news: str, rationale: str, prediction: str, ground_truth: str = "Unknown"):
        print("\n" + ("-" * 80))
        print(f"{perspective}")
        print(f"News: {news}")
        print(f"LLM Rationale: {rationale}")
        print(f"Prediction: {prediction}    Ground Truth: {ground_truth}")

    async def extract_claims(self, text: str) -> list:
        state = ClaimExtractorState(answer_text=text)
        result = await claim_extractor_graph.ainvoke(state)
        return result.get("validated_claims", [])

    async def verify_claims(self, validated_claims: list) -> list:
        verdicts = []
        for vc in validated_claims:
            v_state = ClaimVerifierState(
                claim=vc,
                query=None,
                all_queries=[],
                evidence=[],
                verdict=None,
                iteration_count=0,
                intermediate_assessment=None,
            )
            out = await claim_verifier_graph.ainvoke(v_state)
            verdicts.append(out.get("verdict"))
        return verdicts

    async def run(self, text: str) -> dict:
        validated_claims = await self.extract_claims(text)
        verdicts = await self.verify_claims(validated_claims)
        return {"validated_claims": validated_claims, "verdicts": verdicts}
    
    def _analyze_evidence(self, claim: str, evidence: list) -> dict:
        """Analyze the retrieved evidence for relevance and credibility.
        
        Args:
            claim: The original claim
            evidence: List of evidence documents
            
        Returns:
            Analysis results
        """
        if not evidence:
            return {
                "relevance_score": 0.0,
                "credibility_score": 0.0,
                "source_diversity": 0,
                "summary": "No evidence found"
            }
        
        # Calculate relevance scores
        relevance_scores = [doc.get("similarity_score", 0.0) for doc in evidence]
        avg_relevance = sum(relevance_scores) / len(relevance_scores) if relevance_scores else 0.0
        
        # Calculate source diversity
        unique_sources = len(set(doc.get("display_link", doc.get("link", "")) for doc in evidence))
        
        # Simple credibility scoring (in a real system, you'd want more sophisticated logic)
        credibility_score = min(1.0, avg_relevance * 0.8 + (unique_sources / len(evidence)) * 0.2)
        
        return {
            "relevance_score": round(avg_relevance, 4),
            "credibility_score": round(credibility_score, 4),
            "source_diversity": unique_sources,
            "total_sources": len(evidence),
            "summary": f"Found {len(evidence)} evidence sources with {unique_sources} unique domains"
        }
    
    def _generate_verdict(self, claim: str, evidence: list, analysis: dict) -> dict:
        """Generate a verification verdict based on evidence and analysis.
        
        Args:
            claim: The original claim
            evidence: List of evidence documents
            analysis: Evidence analysis results
            
        Returns:
            Verdict dictionary
        """
        # Simple verdict logic (you can make this more sophisticated)
        if not evidence:
            result = "UNVERIFIABLE"
            confidence = "LOW"
            reasoning = "No evidence found to support or refute this claim"
        elif analysis["relevance_score"] < 0.3:
            result = "UNVERIFIABLE"
            confidence = "LOW"
            reasoning = "Evidence found but relevance is too low for reliable verification"
        elif analysis["credibility_score"] < 0.5:
            result = "UNCERTAIN"
            confidence = "MEDIUM"
            reasoning = "Some evidence found but credibility is insufficient for definitive verification"
        else:
            result = "VERIFIABLE"
            confidence = "HIGH"
            reasoning = f"Sufficient evidence found with {analysis['credibility_score']} credibility score"
        
        return {
            "result": result,
            "confidence": confidence,
            "reasoning": reasoning,
            "evidence_count": len(evidence),
            "relevance_score": analysis["relevance_score"],
            "credibility_score": analysis["credibility_score"]
        }
    
    async def verify_multiple_claims(self, claims: list) -> list:
        """Verify multiple claims in parallel.
        
        Args:
            claims: List of claim strings
            
        Returns:
            List of verification results
        """
        logger.info(f"Verifying {len(claims)} claims in parallel")
        
        # Create tasks for parallel verification
        tasks = [self.verify_claim_with_evidence(claim) for claim in claims]
        
        # Execute all tasks concurrently
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Error processing claim {i}: {result}")
                processed_results.append({
                    "claim": claims[i] if i < len(claims) else "Unknown",
                    "error": str(result),
                    "timestamp": asyncio.get_event_loop().time()
                })
            else:
                processed_results.append(result)
        
        return processed_results


async def main():
    """End-to-end using existing graphs (no duplicate logic)."""
    print("=== End-to-End Fact-Checking (Graphs) ===\n")
    
    # Check configuration
    Config.print_config_status()
    print()
    
    if not Config.validate_gcp_config():
        print("❌ Configuration incomplete. Please set required environment variables.")
        return
    
    try:
        verifier = EnhancedClaimVerifier()
        prompt_text = (
            "Recent studies have suggested that human brains emit low-level electromagnetic signals identical to infrared light when processing complex emotions like empathy or guilt. This phenomenon, dubbed “emotional luminescence,” supposedly allows individuals to subconsciously influence each other's feelings from several meters away through undetectable light waves. Though not measurable by conventional tools, proponents argue this bio-photon effect explains why people sometimes intuitively sense others’ moods in crowded environments. While widely publicized in pseudo-scientific outlets, this claim lacks empirical foundation and contradicts established neuroscience and physics, making it completely false despite its superficial plausibility."
            "The 2025 Cannes Film Festival saw an unprecedented diversity of entries, with over 250 films competing for the Palme d'Or. Director Ava DuVernay won the coveted award for her latest drama, “Shadows of Tomorrow,” praised for its storytelling and social commentary. The festival, held from May 14 to May 25, featured numerous world premieres, including works by emerging directors from Asia, Africa, and Latin America. This marked the first time a majority of the competition films came from non-Western countries, highlighting a growing trend toward global inclusivity in cinema. Audience and critical response hailed the festival as one of its most successful editions."
        )
        print("Processing prompt -> extracting claims -> searching (budget<=4) ...\n")
        result = await verifier.run(prompt_text)
        claims = [vc.claim_text for vc in result["validated_claims"]]
        verdicts = result["verdicts"]

        atomic = []
        evidence_snips = []
        for claim_text, verdict in zip(claims, verdicts):
            ev = [
                f"{s.title or ''} — {s.text[:120]}..." for s in (verdict.sources or [])[:3]
            ] if verdict and getattr(verdict, "sources", None) else None
            atomic.append({"claim": claim_text, "truthfulness_score": None, "evidence": ev})
            if ev:
                evidence_snips.extend([s.text for s in verdict.sources[:1]])

        json_output = {
            "prompt": prompt_text,
            "llm_response": prompt_text,
            "atomic_claims": atomic,
            "search_queries": [],
            "evidence_texts": evidence_snips[:5] or None,
        }

        print("\nJSON output (compact):")
        print(json.dumps(json_output, ensure_ascii=False, indent=2))
        print("\n✅ Completed end-to-end verification with graphs.")
    except Exception as e:
        logger.error(f"Error in main: {e}")
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    asyncio.run(main())
