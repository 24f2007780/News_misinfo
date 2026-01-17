"""
Simplified Claim Verifier
------------------------
- ONE Gemini call per claim
- NEVER crashes on bad output
- Logs all Gemini responses
"""

import os
import json
from dotenv import load_dotenv
from google import genai
from datetime import datetime
load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
MODEL_NAME = os.getenv("MODEL_NAME", "gemini-2.5-flash")

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

def _safe_parse_json(text: str) -> dict:
    """
    Parse JSON safely from Gemini output.
    NEVER raises.
    """
    if not text or not text.strip():
        return {}

    # Try direct parse
    try:
        return json.loads(text)
    except Exception:
        pass

    # Try extracting JSON object
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(text[start : end + 1])
        except Exception:
            pass

    return {}


def verify_claim_with_evidence(claim_text: str, evidence: list) -> dict:
    evidence_block = "\n".join(
        f"- {e['title']}: {e['snippet']}"
        for e in evidence
    )

    prompt = f"""
You are a professional fact-checker.

Claim:
"{claim_text}"

Evidence:
{evidence_block}

Rules:
- Use ONLY the evidence provided
- Be conservative
- If evidence is weak or indirect, choose Insufficient Information

Return ONLY valid JSON:
{{
  "verdict": "Supported | Refuted | Insufficient Information",
  "confidence": number between 0 and 1,
  "reasoning": "short explanation"
}}
"""

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt
    )

    raw = (response.text or "").strip()

    # 🔒 LOG EVERYTHING
    log_gemini_response(
        stage="claim_verification",
        prompt=prompt,
        response_text=raw
    )

    data = _safe_parse_json(raw)

    # 🔒 GUARANTEED SAFE FALLBACK
    if not data or "verdict" not in data:
        return {
            "verdict": "Insufficient Information",
            "confidence": 0.0,
            "reasoning": "The model response could not be parsed reliably."
        }

    return {
        "verdict": data.get("verdict", "Insufficient Information"),
        "confidence": float(data.get("confidence", 0.0)),
        "reasoning": data.get("reasoning", "").strip()
    }
