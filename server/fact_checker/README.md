# Google Cloud Platform Evidence Retriever for Fact-Checking

This module provides a **drop-in replacement for Exa** in your fact-checking pipeline using Google Cloud Platform (GCP) native services. It combines Google's powerful search capabilities with semantic relevance ranking to deliver high-quality evidence retrieval.

## 🚀 Features

- **Google Custom Search API**: Access to Google-quality web search results
- **Vertex AI Embeddings**: Semantic relevance using Google's state-of-the-art embedding models
- **Intelligent Re-ranking**: Combines search relevance with semantic similarity
- **Fallback Support**: Works even without full GCP setup
- **Async Support**: Built for high-performance fact-checking pipelines
- **Easy Integration**: Drop-in replacement for existing Exa implementations

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────────┐    ┌─────────────────┐
│   Fact Claim    │───▶│ Google Custom Search│───▶│ Vertex AI       │
│                 │    │ API                 │    │ Embeddings      │
└─────────────────┘    └─────────────────────┘    └─────────────────┘
                                │                          │
                                ▼                          ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │ Web Results     │───▶│ Semantic        │
                       │ (Title, Link,   │    │ Re-ranking      │
                       │  Snippet)       │    │ (Cosine Similarity)
                       └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │ Ranked Evidence │
                                              │ (Top-K Results) │
                                              └─────────────────┘
```

## 📋 Prerequisites

### 1. Google Cloud Platform Setup

1. **Create a GCP Project** (or use existing)
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Enable Required APIs**
   - Google Custom Search API
   - Google Generative AI API (for embeddings with Gemini)

3. **Create Custom Search Engine**
   - Go to [Programmable Search Engine](https://programmablesearchengine.google.com/)
   - Create a new search engine
   - Note down your **Search Engine ID (cx)**

4. **Get API Key**
   - Go to [Google Cloud Console > APIs & Services > Credentials](https://console.cloud.google.com/apis/credentials)
   - Create an API key
   - Restrict it to Custom Search API

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in your project root:

```bash
# Google Cloud Platform Configuration
GCP_SEARCH_API_KEY=your_google_custom_search_api_key_here
GCP_CUSTOM_SEARCH_ENGINE_ID=your_custom_search_engine_id_here
GCP_PROJECT_ID=your_gcp_project_id_here
GCP_LOCATION=us-central1

# Evidence Retrieval Settings
DEFAULT_SEARCH_RESULTS=10
DEFAULT_TOP_K=5

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/fact_checker.log
```

### Quick Setup

Run the configuration helper:

```bash
python config.py
```

This will:
- Create a `.env.template` file
- Validate your current configuration
- Show what's missing

## 🔧 Usage

### Basic Usage

```python
from fact_checker.nodes.google_evidence_retriever import GoogleEvidenceRetriever

# Initialize retriever
retriever = GoogleEvidenceRetriever()

# Retrieve evidence for a claim
evidence = retriever.retrieve_evidence(
    query="Hittite beekeeping archaeology Turkey large bee species",
    top_k=3
)

# Process results
for doc in evidence:
    print(f"Title: {doc['title']}")
    print(f"Snippet: {doc['snippet']}")
    print(f"Link: {doc['link']}")
    print(f"Similarity: {doc['similarity_score']}")
```

### Integration with Existing Pipeline

```python
from fact_checker.nodes.google_evidence_retriever import create_evidence_retriever
from fact_checker.config import Config

# Create configured retriever
retriever = create_evidence_retriever(
    api_key=Config.GCP_SEARCH_API_KEY,
    cx=Config.GCP_CUSTOM_SEARCH_ENGINE_ID,
    project_id=Config.GCP_PROJECT_ID
)

# Use in your verification workflow
async def verify_claim(claim_text: str):
    evidence = retriever.retrieve_evidence(claim_text, top_k=5)
    # Process evidence and generate verdict
    return analyze_evidence(evidence)
```

### Batch Processing

```python
# Verify multiple claims in parallel
claims = [
    "Claim 1 text...",
    "Claim 2 text...",
    "Claim 3 text..."
]

results = retriever.batch_retrieve(claims, top_k=3)
```

## 🔍 How It Works

### 1. Web Search
- Uses Google Custom Search API to find relevant web pages
- Retrieves title, link, snippet, and display link
- Configurable number of results (max 10 per request)

### 2. Semantic Embedding
- **With Vertex AI**: Uses `textembedding-gecko` model for high-quality embeddings
- **Fallback**: Simple TF-IDF based approach when GCP unavailable
- Generates vector representations of query and documents

### 3. Re-ranking
- Calculates cosine similarity between query and document embeddings
- Sorts results by relevance score
- Returns top-k most semantically relevant results

### 4. Evidence Quality
- Relevance scoring (0.0 to 1.0)
- Source diversity analysis
- Credibility assessment based on multiple factors

## 📊 Performance Comparison

| Feature | Exa | Google Evidence Retriever |
|---------|-----|---------------------------|
| **Search Quality** | Excellent | Excellent (Google-powered) |
| **Semantic Relevance** | High | High (Gemini) |
| **Cost** | Per-query pricing | GCP pricing (often lower) |
| **Latency** | Fast | Fast |
| **Customization** | Limited | High (GCP ecosystem) |
| **Integration** | API-based | Native GCP integration |

## 🚨 Error Handling

The retriever includes comprehensive error handling:

- **API Failures**: Graceful fallback and logging
- **Rate Limiting**: Automatic retry logic
- **Invalid Queries**: Safe error responses
- **Network Issues**: Timeout handling and retries

## 🔧 Customization

### Custom Search Engine Settings

Configure your Custom Search Engine for specific domains or content types:

1. **Site Restrictions**: Limit to specific websites
2. **Language Settings**: Target specific languages
3. **Safe Search**: Control content filtering
4. **Image Search**: Enable image results if needed

### Embedding Model Selection

```python
# Use different Vertex AI embedding models
from google.cloud.aiplatform import TextEmbeddingModel

# Available models:
# - textembedding-gecko (recommended)
# - textembedding-gecko-multilingual
# - textembedding-gecko-001 (legacy)
```

### Similarity Metrics

```python
# Custom similarity calculation
def custom_similarity(vec1, vec2):
    # Implement your own similarity metric
    return your_calculation(vec1, vec2)

# Override in retriever
retriever.calculate_similarity = custom_similarity
```

## 📈 Monitoring and Logging

### Log Levels

- **INFO**: Normal operation, evidence retrieval
- **WARNING**: Configuration issues, fallback usage
- **ERROR**: API failures, embedding errors

### Metrics

Track performance with built-in metrics:

- Search response times
- Embedding generation latency
- Similarity score distributions
- Error rates by query type

## 🔒 Security Considerations

- **API Key Security**: Store keys in environment variables
- **Rate Limiting**: Respect GCP API quotas
- **Data Privacy**: No data stored permanently
- **Access Control**: Use IAM for GCP service access

## 🆘 Troubleshooting

### Common Issues

1. **"API key not valid"**
   - Check API key restrictions
   - Verify Custom Search API is enabled

2. **"Search Engine ID not found"**
   - Verify your Custom Search Engine ID
   - Check if search engine is active

3. **"Vertex AI not available"**
   - Install `google-cloud-aiplatform`
   - Verify project ID and location
   - Check IAM permissions

4. **"No search results"**
   - Verify search query format
   - Check Custom Search Engine settings
   - Review API quotas

### Debug Mode

Enable detailed logging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)

# Or set in environment
LOG_LEVEL=DEBUG
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: This README
- **Issues**: GitHub Issues
- **GCP Support**: [Google Cloud Support](https://cloud.google.com/support)

## 🔄 Migration from Exa

### Step 1: Install Dependencies
```bash
pip install google-cloud-aiplatform google-auth requests
```

### Step 2: Update Configuration
```python
# Old Exa code
from exa import Exa
exa = Exa(api_key="your_key")

# New Google code
from fact_checker.nodes.google_evidence_retriever import GoogleEvidenceRetriever
retriever = GoogleEvidenceRetriever()
```

### Step 3: Update API Calls
```python
# Old Exa
results = exa.search(query, num_results=5)

# New Google
results = retriever.retrieve_evidence(query, top_k=5)
```

### Step 4: Test and Validate
- Run with small test queries
- Compare result quality
- Adjust similarity thresholds if needed

---

**Ready to replace Exa with Google Cloud Platform?** 🚀

Start with the configuration setup and run the integration example to see it in action!
