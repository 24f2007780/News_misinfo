import os
USE_LINKUP = os.getenv("USE_LINKUP") == "false"
"""
Simplified Fact Checker (Cost-Safe)
==================================

- Max 2 claims per input
- Free DuckDuckGo search
- Exactly 1 Gemini call per claim
- Frontend-ready JSON
"""

from typing import List
from datetime import datetime
from pydantic import BaseModel, Field
from ddgs import DDGS

from simplified_claim_handler import extract_claims
from simplified_claim_verifier import verify_claim_with_evidence

# ---------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------

class Evidence(BaseModel):
    title: str
    url: str
    snippet: str


class ClaimResult(BaseModel):
    claim: str
    verdict: str
    confidence: float
    reasoning: str
    sources: List[Evidence]


class FactCheckReport(BaseModel):
    input_text: str
    claims_checked: int
    results: List[ClaimResult]
    summary: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# ---------------------------------------------------------------------
# FREE SEARCH (DuckDuckGo)
# ---------------------------------------------------------------------

def search_evidence(query: str, max_results: int = 3) -> List[Evidence]:
    results = []

    with DDGS() as ddgs:
        for r in ddgs.text(query, max_results=max_results):
            results.append(
                Evidence(
                    title=r.get("title", ""),
                    url=r.get("href", ""),
                    snippet=r.get("body", ""),
                )
            )

    return results

# ---------------------------------------------------------------------
# FACT CHECK PIPELINE
# ---------------------------------------------------------------------

def fact_check_text(text: str) -> FactCheckReport:
    """
    End-to-end fact check with strict cost control.
    """

    # 🔒 HARD LIMIT: max 2 claims
    extraction = extract_claims(
        text,
        min_confidence=0.85,
        max_claims=2
    )

    if not extraction.claims:
        return FactCheckReport(
            input_text=text,
            claims_checked=0,
            results=[],
            summary="No verifiable factual claims detected."
        )

    results: List[ClaimResult] = []

    for claim in extraction.claims:
        # Skip weak / vague claims
        if len(claim.text.split()) < 7:
            continue

        evidence = search_evidence(claim.text, max_results=3)

        verdict = verify_claim_with_evidence(
            claim_text=claim.text,
            evidence=[
                {
                    "title": e.title,
                    "url": e.url,
                    "snippet": e.snippet
                }
                for e in evidence
            ]
        )

        results.append(
            ClaimResult(
                claim=claim.text,
                verdict=verdict["verdict"],
                confidence=verdict["confidence"],
                reasoning=verdict["reasoning"],
                sources=evidence
            )
        )

    summary = f"{len(results)} claim(s) checked."

    return FactCheckReport(
        input_text=text,
        claims_checked=len(results),
        results=results,
        summary=summary
    )

# ---------------------------------------------------------------------
# LOCAL TEST
# ---------------------------------------------------------------------

if __name__ == "__main__":
    sample = """
    Astronomical studies suggest that Saturn’s rings are relatively young,
    possibly forming within the last few hundred million years.
    """

    report = fact_check_text(sample)
    print(report.model_dump())
