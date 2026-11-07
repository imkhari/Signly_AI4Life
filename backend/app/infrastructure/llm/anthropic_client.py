from app.infrastructure.llm.base import LLMError


class AnthropicClient:
    def __init__(self, api_key: str, model: str = "claude-3-5-sonnet") -> None:
        self.api_key = api_key
        self.model = model

    async def generate(self, system: str, user: str, *, timeout_s: float = 4.0) -> str:
        raise LLMError("AnthropicClient is a stub in MVP. Use MockLLMClient or GeminiClient.")
