from datetime import UTC, datetime
from typing import Any, Generic, Literal, TypeVar

from pydantic import BaseModel, Field

from app.domain.models import Alert, SemanticFrame, TriageSummary, ValidatorResult

EventType = Literal[
    "SESSION_JOINED",
    "INPUT_UPDATED",
    "SUMMARY_REQUESTED",
    "SUMMARY_READY",
    "PATIENT_CONFIRMED",
    "NURSE_QUESTION",
    "NURSE_VERIFIED",
    "RECORD_EXPORTED",
    "REQUEST_INTERPRETER",
    "INTERPRETER_STATUS",
    "SESSION_RESET",
    "PING",
    "PONG",
    "ERROR",
]

EventSource = Literal["patient", "nurse", "doctor", "server"]


class SessionJoinedPayload(BaseModel):
    role: Literal["patient", "nurse", "doctor"]
    pairing_code: str | None = None


class InputUpdatedClientPayload(BaseModel):
    step: str
    modality: Literal["touch", "text", "vsl_gloss", "voice"] = "touch"
    patch: dict[str, Any] = Field(default_factory=dict)
    raw_input: dict[str, Any] | None = None
    reply_to: str | None = None


class InputUpdatedServerPayload(BaseModel):
    frame: SemanticFrame
    alerts: list[Alert] = Field(default_factory=list)
    completeness: float
    step: str


class SummaryRequestedPayload(BaseModel):
    language: str = "vi"
    reading_level: str = "simple"


class SummaryReadyPayload(BaseModel):
    summary: TriageSummary
    nl_text_vi: str
    nl_source: Literal["llm", "fallback_template"] = "llm"
    fallback_reason: Literal["timeout", "llm_error", "validator_blocked"] | None = None
    validator: ValidatorResult = Field(default_factory=lambda: ValidatorResult(passed=True))
    tts_text: str


class PatientConfirmedPayload(BaseModel):
    decision: Literal["confirmed", "needs_edit", "unsure"]
    corrections: list[str] = Field(default_factory=list)
    confirmed_fields: list[str] = Field(default_factory=list)


class NurseQuestionPayload(BaseModel):
    question_id: str
    template_code: str
    text_vi: str
    answer_type: Literal["yes_no_unsure", "single_choice", "free_text"] = "yes_no_unsure"
    icon: str | None = None


class NurseVerifiedPayload(BaseModel):
    intake_code: str
    queue_number: int
    verified_by: str
    notes: str | None = None
    acknowledged_alerts: list[str] = Field(default_factory=list)


class RecordExportedPayload(BaseModel):
    format: Literal["pdf", "print", "json"] = "pdf"
    include: list[str] = Field(
        default_factory=lambda: [
            "queue_number",
            "intake_code",
            "confirmed_symptoms",
            "alerts",
        ]
    )
    target: Literal["doctor"] = "doctor"


class RequestInterpreterPayload(BaseModel):
    reason: Literal[
        "low_confidence",
        "patient_unsure",
        "nurse_request",
        "conflict_unresolved",
        "emergency_flag",
    ]
    requested_by: Literal["patient", "nurse"]
    urgency: Literal["normal", "urgent"] = "normal"
    language: Literal["VSL"] = "VSL"


class InterpreterStatusPayload(BaseModel):
    status: Literal["requested", "connecting", "connected", "ended"]
    estimated_wait_seconds: int | None = None


class SessionResetPayload(BaseModel):
    reason: Literal["completed", "timeout", "manual", "error"] = "completed"
    wipe: bool = True


class ErrorPayload(BaseModel):
    code: Literal[
        "VALIDATION_ERROR",
        "SESSION_NOT_FOUND",
        "FORBIDDEN_ROLE",
        "LLM_FALLBACK_USED",
        "RATE_LIMITED",
    ]
    message_vi: str
    detail: dict[str, Any] = Field(default_factory=dict)


PayloadT = TypeVar("PayloadT")


class EventEnvelope(BaseModel, Generic[PayloadT]):
    event: EventType
    session_id: str
    seq: int
    ts: str = Field(default_factory=lambda: datetime.now(UTC).isoformat())
    source: EventSource
    payload: PayloadT
