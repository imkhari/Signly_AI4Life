from app.infrastructure.llm.base import LLMError


class OpenAIClient:
    def __init__(self, api_key: str, model: str = "gpt-4o-mini") -> None:
        self.api_key = api_key
        self.model = model

    async def generate(self, system: str, user: str, *, timeout_s: float = 4.0) -> str:
        raise LLMError("OpenAIClient is a stub in MVP. Use MockLLMClient or GeminiClient.")
