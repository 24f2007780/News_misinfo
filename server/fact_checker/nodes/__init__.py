"""Node components for the fact checker workflow.

Import-light to avoid pulling heavy deps unless explicitly requested.
"""

__all__ = [
    "extract_claims",
    "dispatch_claims_for_verification",
    "claim_verifier_node",
    "generate_report_node",
    "GoogleEvidenceRetriever",
    "create_evidence_retriever",
]


def __getattr__(name):
    if name == "extract_claims":
        from .extract_claims import extract_claims
        return extract_claims
    if name == "dispatch_claims_for_verification":
        from .dispatch_claims import dispatch_claims_for_verification
        return dispatch_claims_for_verification
    if name == "claim_verifier_node":
        from .claim_verifier import claim_verifier_node
        return claim_verifier_node
    if name == "generate_report_node":
        from .generate_report import generate_report_node
        return generate_report_node
    if name in ("GoogleEvidenceRetriever", "create_evidence_retriever"):
        from .google_evidence_retriever import GoogleEvidenceRetriever, create_evidence_retriever
        return {"GoogleEvidenceRetriever": GoogleEvidenceRetriever, "create_evidence_retriever": create_evidence_retriever}[name]
    raise AttributeError(name)
