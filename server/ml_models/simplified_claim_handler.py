# simplified_claim_handler.py
#   └── ONLY: text → minimal factual claims (1–2 max)

# simplified_fact_checker.py
#   └── ONLY: orchestrates pipeline
#        - extraction
#        - search
#        - verification
#        - report

# simplified_claim_verifier.py
#   └── ONLY: claim + evidence → Gemini verdict

# Load environment variables


import os, json
from typing import List
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai
from datetime import datetime
load_dotenv()
LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)

LOG_FILE = os.path.join(LOG_DIR, "gemini_responses.log")


def log_gemini_response(stage: str, prompt: str, response_text: str):
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write("\n" + "=" * 80 + "\n")
        f.write(f"Timestamp: {datetime.utcnow().isoformat()} UTC\n")
        f.write(f"Stage: {stage}\n\n")
        f.write("PROMPT:\n")
        f.write(prompt.strip() + "\n\n")
        f.write("RESPONSE:\n")
        f.write(response_text.strip() + "\n")
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
MODEL_NAME = os.getenv("MODEL_NAME", "gemini-2.5-flash")


class Claim(BaseModel):
    text: str
    confidence: float


class ClaimExtractionResponse(BaseModel):
    claims: List[Claim]

def safe_parse_json(text: str) -> dict:
    try:
        # Try direct parse
        return json.loads(text)
    except Exception:
        pass

    # Try extracting JSON block
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(text[start:end+1])
        except Exception:
            pass

        return {
            "verdict": "Insufficient Information",
            "confidence": 0.0,
            "reasoning": "Model response could not be parsed reliably."
        }

    return safe_parse_json(raw)

def extract_claims(
    text: str,
    min_confidence: float = 0.85,
    max_claims: int = 2,
) -> ClaimExtractionResponse:
    """
    Extract AT MOST max_claims factual claims.
    """

    prompt = f"""
Extract at most {max_claims} clear, factual, verifiable claims from the text.

Rules:
- Prefer fewer claims over many
- Do NOT split unless strictly necessary
- Exclude opinions, speculation, or hypotheticals

Return ONLY valid JSON:
{{
  "claims": [
    {{
      "text": "claim",
      "confidence": 0.0
    }}
  ]
}}

Text:
{text}
"""

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt
    )

    raw = response.text.strip()
    log_gemini_response(
    stage="claim_extraction",
    prompt=prompt,
    response_text=raw
)



    data = safe_parse_json(raw)

    claims = [
        Claim(text=c["text"], confidence=float(c["confidence"]))
        for c in data.get("claims", [])
        if float(c.get("confidence", 0)) >= min_confidence
    ][:max_claims]

    return ClaimExtractionResponse(claims=claims)
