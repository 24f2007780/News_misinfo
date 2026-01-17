"""Extract claims node for fact checker."""

import logging
from typing import Any, Dict

from app.services.Claim_Handle import graph as claim_extractor_graph

from fact_checker.schemas import State

logger = logging.getLogger(__name__)


import logging
from typing import Any, Dict
from app.services.Claim_Handle import graph as claim_extractor_graph
from fact_checker.schemas import State

logger = logging.getLogger(__name__)

async def extract_claims(state: State) -> Dict[str, Any]:
    logger.info(f"Starting claim extraction (iteration {state.iteration_count if hasattr(state, 'iteration_count') else 1})")
    extractor_payload = {"answer_text": state.answer}

    try:
        extractor_result = await claim_extractor_graph.ainvoke(extractor_payload)
        validated_claims = extractor_result.get("validated_claims", [])
        logger.info(f"Extracted {len(validated_claims)} validated claims")

        # Update state with claims and increase iteration count
        if hasattr(state, 'iteration_count'):
            state.iteration_count += 1
        else:
            state.iteration_count = 1

        return {"extracted_claims": validated_claims}

    except Exception as e:
        logger.error(f"Claim extraction failed: {e}")
        return {"extracted_claims": []}
