import pytest

from app.ai.fallback_template import render_fallback_template
from app.ai.orchestrator import orchestrate_summary
from app.ai.redaction import redact_frame, redact_text
from app.domain.models import Allergy, AllergyItem, ChiefComplaint, Onset, Pain, SemanticFrame
from app.infrastructure.llm.mock import MockLLMClient


def test_redaction_pii() -> None:
    # Phone numbers
    t1 = "Số điện thoại của tôi là 0912345678 và +84987654321"
    r1 = redact_text(t1)
    assert "0912345678" not in str(r1)
    assert "+84987654321" not in str(r1)
    assert "[REDACTED_PHONE]" in str(r1)

    # CCCD
    t2 = "CCCD của tôi là 012345678901 và CMND 123456789"
    r2 = redact_text(t2)
    assert "012345678901" not in str(r2)
    assert "[REDACTED_CCCD]" in str(r2)

    # Email
    t3 = "Email liên hệ: benhnhan@gmail.com"
    r3 = redact_text(t3)
    assert "benhnhan@gmail.com" not in str(r3)
    assert "[REDACTED_EMAIL]" in str(r3)

    # Name introduction
    t4 = "Tôi tên là Nguyễn Văn An cần khám bệnh"
    r4 = redact_text(t4)
    assert "Nguyễn Văn An" not in str(r4)
    assert "[REDACTED_NAME]" in str(r4)

    # Redact frame
    frame = SemanticFrame(
        session_id="s1",
        chief_complaint=ChiefComplaint(
            code="PAIN",
            free_text="Tôi tên là Lê Văn B, SĐT 0901234567 bị đau bụng",
        ),
    )
    frame_redacted = redact_frame(frame)
    assert "0901234567" not in str(frame_redacted.chief_complaint.free_text)
    assert "Lê Văn B" not in str(frame_redacted.chief_complaint.free_text)


def test_fallback_template_rendering() -> None:
    # Null fields -> "Chưa rõ"
    frame_empty = SemanticFrame(session_id="empty")
    rendered_empty = render_fallback_template(frame_empty)
    assert "Chưa rõ: lý do khám." in rendered_empty
    assert "Chưa rõ: tình trạng đau." in rendered_empty
    assert "Dị ứng: Chưa rõ." in rendered_empty

    # Full frame
    frame_full = SemanticFrame(
        session_id="full",
        chief_complaint=ChiefComplaint(code="PAIN", label_vi="Đau"),
        pain=Pain(
            present=True,
            severity=7,
            body_regions=["CHEST"],
            onset=Onset(value=2, unit="hour"),
        ),
        allergy=Allergy(
            has_allergy=True,
            items=[AllergyItem(category="drug", name="penicillin")],
        ),
    )
    rendered_full = render_fallback_template(frame_full)
    assert "Bạn đến khám vì: Đau." in rendered_full
    assert "Ngực" in rendered_full
    assert "7/10" in rendered_full
    assert "2 giờ" in rendered_full
    assert "penicillin" in rendered_full


@pytest.mark.asyncio
async def test_orchestrator_happy_path() -> None:
    frame = SemanticFrame(
        session_id="happy",
        chief_complaint=ChiefComplaint(code="PAIN", label_vi="Đau"),
        pain=Pain(present=True, severity=6, body_regions=["CHEST"]),
        allergy=Allergy(has_allergy=False),
    )
    client = MockLLMClient(mode="ok")
    result = await orchestrate_summary(frame, client, timeout_s=1.0)
    assert result.nl_source == "llm"
    assert result.fallback_reason is None
    assert result.validator.passed is True
    assert "Bạn" in result.text_vi


@pytest.mark.asyncio
async def test_orchestrator_timeout_fallback() -> None:
    frame = SemanticFrame(
        session_id="timeout",
        chief_complaint=ChiefComplaint(code="PAIN", label_vi="Đau"),
    )
    client = MockLLMClient(mode="timeout")
    result = await orchestrate_summary(frame, client, timeout_s=0.2)
    assert result.nl_source == "fallback_template"
    assert result.fallback_reason == "timeout"
    assert "Đau" in result.text_vi


@pytest.mark.asyncio
async def test_orchestrator_error_fallback() -> None:
    frame = SemanticFrame(
        session_id="error",
        chief_complaint=ChiefComplaint(code="FEVER", label_vi="Sốt"),
    )
    client = MockLLMClient(mode="error")
    result = await orchestrate_summary(frame, client, timeout_s=1.0)
    assert result.nl_source == "fallback_template"
    assert result.fallback_reason == "llm_error"
    assert "Sốt" in result.text_vi


@pytest.mark.asyncio
async def test_orchestrator_toxic_blocked_fallback() -> None:
    frame = SemanticFrame(
        session_id="toxic",
        chief_complaint=ChiefComplaint(code="COUGH", label_vi="Ho"),
    )
    client = MockLLMClient(mode="toxic")
    result = await orchestrate_summary(frame, client, timeout_s=1.0)
    assert result.nl_source == "fallback_template"
    assert result.fallback_reason == "validator_blocked"
    assert result.validator.passed is False
    assert len(result.validator.violations) > 0


@pytest.mark.asyncio
async def test_orchestrator_malformed_json_fallback() -> None:
    frame = SemanticFrame(
        session_id="malformed",
        chief_complaint=ChiefComplaint(code="PAIN", label_vi="Đau"),
    )
    client = MockLLMClient(mode="malformed_json")
    result = await orchestrate_summary(frame, client, timeout_s=1.0)
    assert result.nl_source == "fallback_template"
    assert result.fallback_reason == "validator_blocked"
    assert result.validator.passed is False


@pytest.mark.asyncio
async def test_orchestrator_never_raises_exception() -> None:
    # Client that raises strange non-standard exception
    class BrokenClient:
        async def generate(self, system: str, user: str, *, timeout_s: float = 4.0) -> str:
            raise RuntimeError("Fatal memory crash or unexpected driver failure")

    frame = SemanticFrame(session_id="broken")
    # Must not raise RuntimeError
    result = await orchestrate_summary(frame, BrokenClient(), timeout_s=1.0)
    assert result.nl_source == "fallback_template"
    assert result.fallback_reason == "llm_error"
