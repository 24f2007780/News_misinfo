import logging

from dotenv import load_dotenv
from langgraph.graph import END, StateGraph
from langgraph.graph.state import CompiledStateGraph
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fact_checker.nodes import (
    claim_verifier_node,
    dispatch_claims_for_verification,
    extract_claims,
    generate_report_node,
)
from fact_checker.schemas import State
import asyncio


load_dotenv()
from ..utils.logging import setup_logging, get_logger

# Centralized logging config
setup_logging(level=os.getenv("LOG_LEVEL", "INFO"), log_file_path='logs/fact_checker.log')
logger = get_logger(__name__)


def create_graph() -> CompiledStateGraph:
    """Set up the main fact checker workflow graph.

    The pipeline follows these steps:
    1. Extract claims from input text
    2. Distribute claims for parallel verification
    3. Generate final report
    """
    workflow = StateGraph(State)

    # Add nodes
    workflow.add_node("extract_claims", extract_claims)
    workflow.add_node("claim_verifier", claim_verifier_node)
    workflow.add_node("generate_report_node", generate_report_node)

    # Set entry point
    workflow.set_entry_point("extract_claims")

    # Connect the nodes in sequence
    workflow.add_conditional_edges(
        "extract_claims", dispatch_claims_for_verification, ["claim_verifier", END]
    )
    workflow.add_edge("claim_verifier", "generate_report_node")

    # Set finish point
    workflow.set_finish_point("generate_report_node")

    return workflow.compile()


graph = create_graph()

async def check_those_facts():
    # This is where you put the text you want to check
    # "1. Archaeologists in Turkey report that ancient bee rituals suggest some insects may have been large enough for carrying, a finding linked by a few researchers to the Hittites trade practices."
    # "2. A Swiss innovator in the 1920s experimented with shells in pocket watches, though it remains disputed whether these were literal biological shells or decorative mechanical modifications."
    # "3. Some medieval records mention candles made with pressed flowers being restricted in churches, though it isn’t clear whether the concern was about excessive smoke or ritual symbolism."
    input_data = {
        "answer": (
            "Astronomical studies have indicated that the massive ring system around one of the outer planets is geologically youthful, with evidence pointing to formation only in the last few hundred million years."
        )
    }

    # This will store our final report when it's ready
    final_report = None

    # The graph.astream gives you a play-by-play of what's happening
    # You could use graph.ainvoke() instead if you just want the final result
    async for event in graph.astream(input_data):
        for key, value in event.items():
            logger.info(f"Node: {key} completed!")
            if key == "generate_report_node":  # Last step
                final_report = value.get("final_report")

    # Log the final report
    if final_report:
        logger.info("\n--- FACT-CHECK REPORT ---")
        logger.info(f"Answer: {final_report.answer}")
        logger.info(f"Summary: {final_report.summary}")
        logger.info(f"Timestamp: {final_report.timestamp}")
        logger.info("\n--- Verified Claims ---")
        for verdict in final_report.verified_claims:
            logger.info(f"  Claim: {verdict.claim_text}")
            logger.info(f"    Verdict: {verdict.result.value}")
            logger.info(f"    Reasoning: {verdict.reasoning}")
            if verdict.sources:
                logger.info(f"    Sources: {', '.join(verdict.sources)}")
            logger.info("  ---")
    else:
        logger.warning("Fact checking did not produce a final report.")

# Let's run it!
if __name__ == "__main__":
    asyncio.run(check_those_facts())