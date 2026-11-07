
import httpx

from app.infrastructure.llm.base import LLMError, LLMTimeoutError


class GeminiClient:
    def __init__(self, api_key: str, model: str = "gemini-2.5-flash") -> None:
        self.api_key = api_key
        self.model = model or "gemini-2.5-flash"

    async def generate(self, system: str, user: str, *, timeout_s: float = 4.0) -> str:
        if not self.api_key:
            raise LLMError("Gemini API key is not configured")

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        payload = {
            "system_instruction": {"parts": [{"text": system}]},
            "contents": [{"parts": [{"text": user}]}],
            "generationConfig": {
                "temperature": 0.0,
                "maxOutputTokens": 200,
                "responseMimeType": "application/json",
            },
        }

        try:
            async with httpx.AsyncClient(timeout=timeout_s) as client:
                response = await client.post(url, json=payload)
                if response.status_code != 200:
                    raise LLMError(f"Gemini API error ({response.status_code}): {response.text}")

                data = response.json()
                candidates = data.get("candidates", [])
                if not candidates:
                    raise LLMError("No candidates returned from Gemini")

                parts = candidates[0].get("content", {}).get("parts", [])
                if not parts:
                    raise LLMError("Empty content in Gemini response")

                return str(parts[0].get("text", ""))
        except httpx.TimeoutException as e:
            raise LLMTimeoutError(f"Gemini API timed out after {timeout_s}s") from e
        except TimeoutError as e:
            raise LLMTimeoutError(f"Gemini API timed out after {timeout_s}s") from e
        except Exception as e:
            if isinstance(e, LLMError):
                raise
            raise LLMError(f"Lỗi kết nối Gemini API: {e}") from e
