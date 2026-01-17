from datetime import datetime
from operator import add
from typing import List, Optional, Annotated
from pydantic import BaseModel, Field
from app.services.Claim_Verification.schemas import Verdict
from app.services.Claim_Handle.schemas import ValidatedClaim


class FactCheckReport(BaseModel):
    answer: str = Field(description="The text to extract claims from")
    claims_verified: int = Field(description="Number of claims that were verified")
    verified_claims: List[Verdict] = Field(description="Results for each verified claim")
    summary: str = Field(description="A concise summary of the fact-checking results")
    timestamp: datetime = Field(default_factory=datetime.now, description="When the fact-check was performed")

class State(BaseModel):
    answer: str = Field(description="The text to extract claims from")
    extracted_claims: List[ValidatedClaim] = Field(default_factory=list, description="Claims extracted from the text")
    verification_results: Annotated[List[Verdict], add] = Field(default_factory=list, description="Verification results for each claim")
    final_report: Optional[FactCheckReport] = Field(default=None, description="The final fact-checking report")
    iteration_count: int = Field(default=0, description="Current iteration number")
    all_queries: List[str] = Field(default_factory=list, description="All search queries made across iterations")
    cumulative_evidence: Annotated[List[str], add] = Field(default_factory=list, description="All gathered evidence snippets across iterations")
