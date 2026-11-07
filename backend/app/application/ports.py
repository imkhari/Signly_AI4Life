from typing import Protocol


class LLMClient(Protocol):
    async def generate(self, system: str, user: str, *, timeout_s: float = 4.0) -> str:
        """Sinh văn bản từ LLM với system prompt và user prompt."""
        ...
