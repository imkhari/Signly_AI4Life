import re

from app.domain.models import SemanticFrame

# Regex patterns for Vietnamese PII
PHONE_PATTERN = re.compile(r"(?:\+84|0)(?:3|5|7|8|9)[0-9]{8}\b|\b0[0-9]{9}\b")
CCCD_PATTERN = re.compile(r"\b[0-9]{12}\b|\b(?:CCCD|CMND)[:\s]*[0-9]{9,12}\b", re.IGNORECASE)
EMAIL_PATTERN = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
NAME_INTRO_PATTERN = re.compile(
    r"\b(?:tôi tên là|tên tôi là|tên là)\s+([A-ZÀ-Ỹa-zà-ỹ\s]{2,30})", re.IGNORECASE
)


def redact_text(text: str | None) -> str | None:
    if not text:
        return text

    redacted = text
    redacted = EMAIL_PATTERN.sub("[REDACTED_EMAIL]", redacted)
    redacted = PHONE_PATTERN.sub("[REDACTED_PHONE]", redacted)
    redacted = CCCD_PATTERN.sub("[REDACTED_CCCD]", redacted)
    redacted = NAME_INTRO_PATTERN.sub("tôi là [REDACTED_NAME]", redacted)
    return redacted


def redact_frame(frame: SemanticFrame) -> SemanticFrame:
    """Tạo bản sao ẩn danh của SemanticFrame trước khi chuyển đến LLM."""
    frame_copy = frame.model_copy(deep=True)
    if frame_copy.chief_complaint.free_text:
        frame_copy.chief_complaint.free_text = redact_text(frame_copy.chief_complaint.free_text)
    return frame_copy
