from datetime import UTC, datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

ModalityType = Literal["touch", "text", "vsl_gloss", "voice"]
OnsetUnit = Literal["minute", "hour", "day", "week", "month"]
CourseType = Literal["sudden", "gradual", "constant", "comes_and_goes"]
AllergyCategory = Literal["drug", "food", "other"]
AlertLevel = Literal["info", "warning", "critical"]
SessionStatus = Literal[
    "created",
    "paired",
    "collecting",
    "summary_ready",
    "patient_confirmed",
    "nurse_verified",
    "exported",
    "reset",
]


class ChiefComplaint(BaseModel):
    code: str | None = None
    label_vi: str | None = None
    free_text: str | None = None


class Onset(BaseModel):
    value: int | None = None
    unit: OnsetUnit | None = None


class Pain(BaseModel):
    present: bool | None = None
    severity: int | None = None
    body_regions: list[str] = Field(default_factory=list)
    onset: Onset | None = None
    course: CourseType | None = None

    @field_validator("severity")
    @classmethod
    def validate_severity_range(cls, v: int | None) -> int | None:
        if v is not None and not (0 <= v <= 10):
            raise ValueError("severity must be between 0 and 10")
        return v


class AllergyItem(BaseModel):
    category: AllergyCategory
    name: str


class Allergy(BaseModel):
    has_allergy: bool | Literal["unsure"] | None = None
    items: list[AllergyItem] = Field(default_factory=list)


class Alert(BaseModel):
    code: str
    level: AlertLevel
    field: str | None = None
    message_vi: str
    needs_nurse_ack: bool = False


class SemanticFrame(BaseModel):
    schema_version: str = "1.0"
    session_id: str
    modality: list[str] = Field(default_factory=lambda: ["touch"])
    chief_complaint: ChiefComplaint = Field(default_factory=ChiefComplaint)
    pain: Pain = Field(default_factory=Pain)
    allergy: Allergy = Field(default_factory=Allergy)
    extra_symptoms: list[str] = Field(default_factory=list)
    uncertain_fields: list[str] = Field(default_factory=list)
    field_confidence: dict[str, float] = Field(default_factory=dict)
    conflicts: list[Alert] = Field(default_factory=list)
    missing_fields: list[str] = Field(default_factory=list)


class NurseConfirmedItem(BaseModel):
    label_vi: str
    detail: str


class NurseAttentionItem(BaseModel):
    level: AlertLevel
    message_vi: str


class NurseView(BaseModel):
    confirmed: list[NurseConfirmedItem] = Field(default_factory=list)
    needs_attention: list[NurseAttentionItem] = Field(default_factory=list)


class Flags(BaseModel):
    interpreter_requested: bool = False
    emergency_flag: bool = False


class Timestamps(BaseModel):
    created: str = Field(
        default_factory=lambda: datetime.now(UTC).isoformat()
    )
    patient_confirmed: str | None = None
    nurse_verified: str | None = None


class ValidatorResult(BaseModel):
    passed: bool
    violations: list[str] = Field(default_factory=list)


class TriageSummary(BaseModel):
    session_id: str
    intake_code: str
    queue_number: int | None = None
    status: SessionStatus = "summary_ready"
    frame: SemanticFrame
    nl_text_vi: str
    nl_source: Literal["llm", "fallback_template"] = "llm"
    fallback_reason: Literal["timeout", "llm_error", "validator_blocked"] | None = None
    validator: ValidatorResult = Field(
        default_factory=lambda: ValidatorResult(passed=True)
    )
    alerts: list[Alert] = Field(default_factory=list)
    nurse_view: NurseView = Field(default_factory=NurseView)
    flags: Flags = Field(default_factory=Flags)
    timestamps: Timestamps = Field(default_factory=Timestamps)

