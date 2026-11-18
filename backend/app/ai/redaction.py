import re

from app.domain.models import SemanticFrame
from app.domain.ontology.loader import find_chief_complaint_by_code, load_drug_names

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
    complaint = frame_copy.chief_complaint
    if complaint.free_text:
        complaint.free_text = redact_text(complaint.free_text)
    canonical = find_chief_complaint_by_code(complaint.code) if complaint.code else None
    if complaint.label_vi:
        complaint.label_vi = canonical["label_vi"] if canonical else redact_text(complaint.label_vi)

    known_drugs = {name.casefold() for name in load_drug_names()}
    for item in frame_copy.allergy.items:
        redacted = redact_text(item.name)
        if redacted != item.name and redacted is not None:
            item.name = redacted
        elif item.name.casefold() not in known_drugs:
            item.name = "[REDACTED]"
    frame_copy.extra_symptoms = [redact_text(value) or "" for value in frame_copy.extra_symptoms]
    for alert in frame_copy.conflicts:
        alert.message_vi = redact_text(alert.message_vi) or ""
    return frame_copy
