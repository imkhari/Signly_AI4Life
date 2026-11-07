from app.application.ports import LLMClient
from app.config import settings
from app.infrastructure.llm.anthropic_client import AnthropicClient
from app.infrastructure.llm.base import LLMError, LLMTimeoutError
from app.infrastructure.llm.gemini_client import GeminiClient
from app.infrastructure.llm.mock import MockLLMClient
from app.infrastructure.llm.openai_client import OpenAIClient


def get_llm_client() -> LLMClient:
    provider = settings.LLM_PROVIDER.lower()
    if provider == "gemini":
        return GeminiClient(
            api_key=settings.LLM_API_KEY,
            model=settings.LLM_MODEL or "gemini-1.5-flash",
        )
    elif provider == "anthropic":
        return AnthropicClient(
            api_key=settings.LLM_API_KEY,
            model=settings.LLM_MODEL or "claude-3-5-sonnet-20241022",
        )
    elif provider == "openai":
        return OpenAIClient(
            api_key=settings.LLM_API_KEY,
            model=settings.LLM_MODEL or "gpt-4o-mini",
        )
    return MockLLMClient(mode="ok")


__all__ = [
    "LLMError",
    "LLMTimeoutError",
    "MockLLMClient",
    "GeminiClient",
    "AnthropicClient",
    "OpenAIClient",
    "get_llm_client",
]
