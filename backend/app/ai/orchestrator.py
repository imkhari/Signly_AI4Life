import asyncio
import json
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field

from app.ai.fallback_template import render_fallback_template
from app.ai.redaction import redact_frame
from app.ai.validator import validate_summary_output
from app.application.ports import LLMClient
from app.domain.models import SemanticFrame, ValidatorResult
from app.infrastructure.llm.base import LLMTimeoutError

PROMPT_FILE = Path(__file__).resolve().parent / "prompts" / "summary_system_vi.txt"


def _load_system_prompt() -> str:
    with open(PROMPT_FILE, encoding="utf-8") as f:
        return f.read()


class SummaryResult(BaseModel):
    text_vi: str
    nl_source: Literal["llm", "fallback_template"] = "llm"
    fallback_reason: Literal["timeout", "llm_error", "validator_blocked"] | None = None
    validator: ValidatorResult = Field(default_factory=lambda: ValidatorResult(passed=True))
    tts_text: str = ""


async def orchestrate_summary(
    frame: SemanticFrame,
    llm_client: LLMClient,
    *,
    timeout_s: float = 4.0,
    force_fallback: bool = False,
) -> SummaryResult:
    """Điều phối toàn diện: Redaction -> Prompt -> LLM -> Validator -> Fallback."""
    if force_fallback:
        fallback_text = render_fallback_template(frame)
        return SummaryResult(
            text_vi=fallback_text,
            nl_source="fallback_template",
            fallback_reason="llm_error",
            validator=ValidatorResult(passed=True),
            tts_text=fallback_text,
        )

    system_prompt = _load_system_prompt()
    redacted_frame = redact_frame(frame)
    user_payload = redacted_frame.model_dump_json(exclude_none=False)

    try:
        raw_output = await asyncio.wait_for(
            llm_client.generate(system_prompt, user_payload, timeout_s=timeout_s),
            timeout=timeout_s + 0.5,
        )
    except (TimeoutError, LLMTimeoutError):
        fallback_text = render_fallback_template(frame)
        return SummaryResult(
            text_vi=fallback_text,
            nl_source="fallback_template",
            fallback_reason="timeout",
            validator=ValidatorResult(passed=True),
            tts_text=fallback_text,
        )
    except Exception:
        fallback_text = render_fallback_template(frame)
        return SummaryResult(
            text_vi=fallback_text,
            nl_source="fallback_template",
            fallback_reason="llm_error",
            validator=ValidatorResult(passed=True),
            tts_text=fallback_text,
        )

    # Post-LLM Validator
    report = validate_summary_output(raw_output, frame)
    if not report.passed:
        fallback_text = render_fallback_template(frame)
        return SummaryResult(
            text_vi=fallback_text,
            nl_source="fallback_template",
            fallback_reason="validator_blocked",
            validator=ValidatorResult(passed=False, violations=report.violations),
            tts_text=fallback_text,
        )

    try:
        parsed_data = json.loads(raw_output)
        nl_text = str(parsed_data.get("text_vi", "")).strip()
    except Exception:
        fallback_text = render_fallback_template(frame)
        return SummaryResult(
            text_vi=fallback_text,
            nl_source="fallback_template",
            fallback_reason="validator_blocked",
            validator=ValidatorResult(passed=False, violations=["JSON parse error"]),
            tts_text=fallback_text,
        )

    return SummaryResult(
        text_vi=nl_text,
        nl_source="llm",
        fallback_reason=None,
        validator=ValidatorResult(passed=True, violations=[]),
        tts_text=nl_text,
    )
