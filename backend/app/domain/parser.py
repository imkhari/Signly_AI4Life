from typing import Any

from pydantic import BaseModel, Field

from app.domain.models import (
    Alert,
    AllergyItem,
    Onset,
    SemanticFrame,
)
from app.domain.ontology.loader import (
    find_chief_complaint_by_code,
    find_drug_names_in_text,
)
from app.domain.rules_config import (
    ALERT_MESSAGES,
    BLEED_SYMPTOM_CODE,
    BREATH_DIFFICULTY_CODE,
    CHEST_REGION_CODE,
    CRITICAL_PAIN_SEVERITY,
    EMERGENCY_HELP_CODE,
    GLOSS_CONFIDENCE_THRESHOLD,
    HIGH_PAIN_SEVERITY,
)


class ParseResult(BaseModel):
    frame: SemanticFrame
    alerts: list[Alert] = Field(default_factory=list)
    completeness: float
    emergency_flag: bool = False


def _create_alert(code: str, field: str | None = None) -> Alert:
    config = ALERT_MESSAGES.get(
        code,
        {
            "level": "warning",
            "message_vi": f"Cảnh báo: {code}",
            "needs_nurse_ack": False,
        },
    )
    return Alert(
        code=code,
        level=config["level"],
        field=field,
        message_vi=config["message_vi"],
        needs_nurse_ack=config["needs_nurse_ack"],
    )


def _merge_patch(frame: SemanticFrame, patch: dict[str, Any]) -> None:
    if "chief_complaint" in patch and patch["chief_complaint"] is not None:
        cc_patch = patch["chief_complaint"]
        if "code" in cc_patch:
            frame.chief_complaint.code = cc_patch["code"]
            if cc_patch["code"]:
                ontology_item = find_chief_complaint_by_code(cc_patch["code"])
                if ontology_item and not cc_patch.get("label_vi"):
                    frame.chief_complaint.label_vi = ontology_item["label_vi"]
        if "label_vi" in cc_patch:
            frame.chief_complaint.label_vi = cc_patch["label_vi"]
        if "free_text" in cc_patch:
            frame.chief_complaint.free_text = cc_patch["free_text"]

    if "pain" in patch and patch["pain"] is not None:
        p_patch = patch["pain"]
        if "present" in p_patch:
            frame.pain.present = p_patch["present"]
        if "severity" in p_patch:
            frame.pain.severity = p_patch["severity"]
        if "body_regions" in p_patch and p_patch["body_regions"] is not None:
            frame.pain.body_regions = list(p_patch["body_regions"])
        if "onset" in p_patch:
            onset_patch = p_patch["onset"]
            if onset_patch is None:
                frame.pain.onset = None
            else:
                frame.pain.onset = Onset(
                    value=onset_patch.get("value"),
                    unit=onset_patch.get("unit"),
                )
        if "course" in p_patch:
            frame.pain.course = p_patch["course"]

    if "allergy" in patch and patch["allergy"] is not None:
        a_patch = patch["allergy"]
        if "has_allergy" in a_patch:
            frame.allergy.has_allergy = a_patch["has_allergy"]
        if "items" in a_patch and a_patch["items"] is not None:
            new_items: list[AllergyItem] = []
            for item in a_patch["items"]:
                if isinstance(item, AllergyItem):
                    new_items.append(item)
                elif isinstance(item, dict):
                    new_items.append(
                        AllergyItem(
                            category=item.get("category", "other"),
                            name=item.get("name", "").strip(),
                        )
                    )
            frame.allergy.items = new_items

    if "extra_symptoms" in patch and patch["extra_symptoms"] is not None:
        frame.extra_symptoms = list(patch["extra_symptoms"])

    if "modality" in patch and patch["modality"] is not None:
        for m in patch["modality"]:
            if m not in frame.modality:
                frame.modality.append(m)


def _check_conflicts(
    frame: SemanticFrame, raw_input: dict[str, Any] | None
) -> tuple[list[Alert], bool]:
    alerts: list[Alert] = []
    emergency_flag = False

    # 1. PAIN_FALSE_BUT_SEVERITY
    if frame.pain.present is False and frame.pain.severity is not None and frame.pain.severity > 0:
        alerts.append(_create_alert("PAIN_FALSE_BUT_SEVERITY", "pain.severity"))

    # 2. PAIN_TRUE_NO_SEVERITY
    if frame.pain.present is True and frame.pain.severity is None:
        alerts.append(_create_alert("PAIN_TRUE_NO_SEVERITY", "pain.severity"))

    # 3. PAIN_TRUE_NO_REGION
    if frame.pain.present is True and len(frame.pain.body_regions) == 0:
        alerts.append(_create_alert("PAIN_TRUE_NO_REGION", "pain.body_regions"))

    # 4. PAIN_FALSE_BUT_REGION
    if frame.pain.present is False and len(frame.pain.body_regions) > 0:
        alerts.append(_create_alert("PAIN_FALSE_BUT_REGION", "pain.body_regions"))

    # 5. ALLERGY_FALSE_BUT_ITEMS
    if frame.allergy.has_allergy is False and len(frame.allergy.items) > 0:
        alerts.append(_create_alert("ALLERGY_FALSE_BUT_ITEMS", "allergy.items"))

    # 6. ALLERGY_TRUE_NO_ITEMS
    if frame.allergy.has_allergy is True and len(frame.allergy.items) == 0:
        alerts.append(_create_alert("ALLERGY_TRUE_NO_ITEMS", "allergy.items"))

    # 7. ALLERGY_UNSURE
    if frame.allergy.has_allergy == "unsure":
        alerts.append(_create_alert("ALLERGY_UNSURE", "allergy.has_allergy"))

    # 8. MISSING_ALLERGY
    if frame.allergy.has_allergy is None:
        alerts.append(_create_alert("MISSING_ALLERGY", "allergy.has_allergy"))

    # 9. MISSING_ONSET
    if frame.pain.present is True and frame.pain.onset is None:
        alerts.append(_create_alert("MISSING_ONSET", "pain.onset"))

    # 10. TEXT_MENTIONS_DRUG_NOT_DECLARED
    text_to_scan = ""
    if frame.chief_complaint.free_text:
        text_to_scan += " " + frame.chief_complaint.free_text
    if raw_input and raw_input.get("text"):
        text_to_scan += " " + str(raw_input["text"])

    if text_to_scan:
        mentioned_drugs = find_drug_names_in_text(text_to_scan)
        if mentioned_drugs:
            declared_drug_names = [
                item.name.lower() for item in frame.allergy.items
            ]
            undeclared = [
                d for d in mentioned_drugs if not any(d in item for item in declared_drug_names)
            ]
            if undeclared:
                alerts.append(_create_alert("TEXT_MENTIONS_DRUG_NOT_DECLARED", "allergy"))

    # 11. LOW_CONFIDENCE_GLOSS
    if raw_input and "gloss" in raw_input and raw_input["gloss"]:
        glosses = raw_input["gloss"]
        if isinstance(glosses, list):
            for item in glosses:
                confidence = 1.0
                if isinstance(item, dict):
                    confidence = float(item.get("confidence", 1.0))
                if confidence < GLOSS_CONFIDENCE_THRESHOLD:
                    alerts.append(_create_alert("LOW_CONFIDENCE_GLOSS", "raw_input.gloss"))
                    break

    # 12. EMERGENCY_RED_FLAG
    is_red_flag = False
    if (
        frame.chief_complaint.code == BREATH_DIFFICULTY_CODE
        or BREATH_DIFFICULTY_CODE in frame.extra_symptoms
    ):
        is_red_flag = True

    if (
        frame.chief_complaint.code == BLEED_SYMPTOM_CODE
        or BLEED_SYMPTOM_CODE in frame.extra_symptoms
    ) and (frame.pain.severity is not None and frame.pain.severity >= HIGH_PAIN_SEVERITY):
        is_red_flag = True

    if (
        CHEST_REGION_CODE in frame.pain.body_regions
        and frame.pain.severity is not None
        and frame.pain.severity >= HIGH_PAIN_SEVERITY
    ):
        is_red_flag = True

    if frame.pain.severity == CRITICAL_PAIN_SEVERITY:
        is_red_flag = True

    if frame.chief_complaint.code == EMERGENCY_HELP_CODE:
        is_red_flag = True

    if is_red_flag:
        alerts.append(_create_alert("EMERGENCY_RED_FLAG", "emergency"))
        emergency_flag = True

    # 13. PATIENT_UNSURE
    if raw_input and raw_input.get("decision") == "unsure":
        alerts.append(_create_alert("PATIENT_UNSURE", "decision"))

    return alerts, emergency_flag


def _calculate_completeness_and_missing(frame: SemanticFrame) -> tuple[float, list[str]]:
    missing_fields: list[str] = []
    points = 0.0
    total_points = 5.5

    # 1. Chief Complaint (1.0 pt)
    if frame.chief_complaint.code is not None:
        points += 1.0
    else:
        missing_fields.append("chief_complaint.code")

    # 2. Pain section (max 2.5 pts)
    if frame.pain.present is not None:
        if frame.pain.present is False:
            points += 2.5
        else:
            points += 0.5
            if frame.pain.severity is not None:
                points += 1.0
            else:
                missing_fields.append("pain.severity")

            if len(frame.pain.body_regions) > 0:
                points += 0.5
            else:
                missing_fields.append("pain.body_regions")

            if frame.pain.onset is not None and frame.pain.onset.value is not None:
                points += 0.5
            else:
                missing_fields.append("pain.onset")
    else:
        missing_fields.append("pain.present")

    # 3. Allergy section (max 2.0 pts)
    if frame.allergy.has_allergy is not None:
        if frame.allergy.has_allergy is False or frame.allergy.has_allergy == "unsure":
            points += 2.0
        else:
            points += 1.0
            if len(frame.allergy.items) > 0:
                points += 1.0
            else:
                missing_fields.append("allergy.items")
    else:
        missing_fields.append("allergy.has_allergy")

    completeness = round(min(points / total_points, 1.0), 2)
    return completeness, missing_fields


def parse(
    frame_prev: SemanticFrame | None,
    patch: dict[str, Any] | None,
    raw_input: dict[str, Any] | None = None,
    session_id: str = "default-session",
) -> ParseResult:
    if frame_prev is None:
        frame = SemanticFrame(session_id=session_id)
    else:
        frame = frame_prev.model_copy(deep=True)

    if patch:
        _merge_patch(frame, patch)

    alerts, emergency_flag = _check_conflicts(frame, raw_input)
    completeness, missing_fields = _calculate_completeness_and_missing(frame)

    frame.conflicts = alerts
    frame.missing_fields = missing_fields

    return ParseResult(
        frame=frame,
        alerts=alerts,
        completeness=completeness,
        emergency_flag=emergency_flag,
    )
