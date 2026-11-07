import asyncio
import json
from typing import Literal

from app.infrastructure.llm.base import LLMError, LLMTimeoutError

MockMode = Literal["ok", "toxic", "timeout", "error", "malformed_json"]


class MockLLMClient:
    def __init__(self, mode: MockMode = "ok") -> None:
        self.mode = mode

    async def generate(self, system: str, user: str, *, timeout_s: float = 4.0) -> str:
        if self.mode == "timeout":
            await asyncio.sleep(timeout_s + 1.0)
            raise LLMTimeoutError("LLM call timed out in mock")

        if self.mode == "error":
            raise LLMError("Mô phỏng lỗi kết nối LLM provider")

        if self.mode == "malformed_json":
            return "Xin chào, đây là văn bản không đúng định dạng JSON."

        if self.mode == "toxic":
            return json.dumps(
                {
                    "text_vi": (
                        "Bạn có thể bị viêm phổi cấp tính. "
                        "Bạn nên uống paracetamol 500mg để giảm đau."
                    )
                },
                ensure_ascii=False,
            )

        # mode == "ok"
        # Parse user frame to produce a coherent summary
        try:
            data = json.loads(user)
            complaint = data.get("chief_complaint", {}).get("label_vi", "đau")
            pain = data.get("pain", {})
            parts: list[str] = []
            if pain.get("present"):
                regions = ", ".join(pain.get("body_regions", [])) or "vùng chưa rõ"
                severity = pain.get("severity", "chưa rõ")
                parts.append(f"Bạn bị đau ở {regions}, mức {severity}/10.")
            elif pain.get("present") is False:
                parts.append("Bạn không bị đau.")
            else:
                parts.append(f"Bạn đến khám vì {complaint}.")

            allergy = data.get("allergy", {})
            if allergy.get("has_allergy") is False:
                parts.append("Bạn không bị dị ứng.")
            elif allergy.get("has_allergy") is True:
                items = ", ".join(i.get("name", "") for i in allergy.get("items", []))
                parts.append(f"Bạn bị dị ứng với {items}." if items else "Bạn có tiền sử dị ứng.")
            elif allergy.get("has_allergy") == "unsure":
                parts.append("Chưa rõ tiền sử dị ứng.")

            text_vi = " ".join(parts)
        except Exception:
            text_vi = "Bạn bị đau ở ngực, mức 7/10, bắt đầu cách đây 2 giờ. Bạn không bị dị ứng."

        return json.dumps({"text_vi": text_vi}, ensure_ascii=False)
