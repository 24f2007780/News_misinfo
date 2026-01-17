__all__ = [
    # LLM utilities
    "call_llm_with_structured_output",
    "process_with_voting",
    # LLM models
    "get_llm",
    "get_default_llm",
    # Settings
    "settings",
    # Text utilities
    "remove_following_sentences",
    # Token utilities
    "truncate_evidence_for_token_limit",
    "estimate_token_count",
    # Logging helpers
    "setup_logging",
    "get_logger",
]


def __getattr__(name):
    if name in ("call_llm_with_structured_output", "process_with_voting", "truncate_evidence_for_token_limit", "estimate_token_count"):
        from .llm import (
            call_llm_with_structured_output,
            process_with_voting,
            truncate_evidence_for_token_limit,
            estimate_token_count,
        )
        return {
            "call_llm_with_structured_output": call_llm_with_structured_output,
            "process_with_voting": process_with_voting,
            "truncate_evidence_for_token_limit": truncate_evidence_for_token_limit,
            "estimate_token_count": estimate_token_count,
        }[name]
    if name in ("get_llm", "get_default_llm"):
        from .models import get_llm, get_default_llm
        return {"get_llm": get_llm, "get_default_llm": get_default_llm}[name]
    if name == "settings":
        from .settings import settings
        return settings
    if name == "remove_following_sentences":
        from .text import remove_following_sentences
        return remove_following_sentences
    if name in ("setup_logging", "get_logger"):
        from .logging import setup_logging, get_logger
        return {"setup_logging": setup_logging, "get_logger": get_logger}[name]
    raise AttributeError(name)