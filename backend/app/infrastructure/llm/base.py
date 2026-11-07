class LLMError(Exception):
    """Lỗi khi gọi LLM API."""


class LLMTimeoutError(LLMError):
    """Timeout khi gọi LLM API."""
