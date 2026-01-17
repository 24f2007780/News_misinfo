"""Unified LLM model instances and factory functions.

Provides access to configured language model instances for all modules.
"""

from langchain_core.language_models.chat_models import BaseChatModel
#from langchain_google_vertexai import ChatVertexAI
from langchain_google_genai import ChatGoogleGenerativeAI

from .settings import settings


def get_llm(
    model_name: str = "gemini-2.5-flash-lite",
    temperature: float = 0.0,
    completions: int = 1,
) -> BaseChatModel:
    """Get LLM with specified configuration.

    Args:
        model_name: The model to use
        temperature: Temperature for generation
        completions: How many completions we need (affects temperature for diversity)

    Returns:
        Configured LLM instance
    """
    # Use higher temp when doing multiple completions for diversity
    if completions > 1 and temperature == 0.0:
        temperature = 0.2

    # Use Gemini via Google Generative AI API
    # Requires GOOGLE_API_KEY in environment (mapped to settings.gemini_api_key)
    if not settings.gemini_api_key:
        raise ValueError("GOOGLE_API_KEY must be set for Gemini (Generative AI API)")

    return ChatGoogleGenerativeAI(
        model=model_name,
        temperature=temperature,
        api_key=settings.gemini_api_key.get_secret_value(),
        max_retries=3,
        timeout=30,
    )


def get_default_llm() -> BaseChatModel:
    """Get default LLM instance."""
    return get_llm()