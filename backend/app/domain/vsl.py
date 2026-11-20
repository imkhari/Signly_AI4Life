"""Controlled camera suggestions, distinct from a confirmed patient frame."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class IntakeSuggestion(BaseModel):
    model_config = ConfigDict(extra="forbid")

    chief_complaint_code: Literal["PAIN", "COUGH", "FEVER", "BREATH_DIFFICULTY"]
    pain_present: Literal[True] | None = None
    body_regions: list[
        Literal["HEAD", "CHEST", "ABDOMEN_UPPER", "ABDOMEN_LOWER", "NECK", "LOWER_BACK"]
    ] = Field(default_factory=list, max_length=1)

    @model_validator(mode="after")
    def validate_meaning(self) -> "IntakeSuggestion":
        if self.chief_complaint_code == "PAIN":
            if self.pain_present is not True:
                raise ValueError("Pain statement must explicitly assert pain")
        elif self.pain_present is not None or self.body_regions:
            raise ValueError("Other statements do not assert or deny pain")
        return self
