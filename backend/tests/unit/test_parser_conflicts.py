from app.domain.models import AllergyItem, SemanticFrame
from app.domain.parser import parse


def test_rule_1_pain_false_but_severity() -> None:
    # Positive: pain=False but severity > 0 -> ALERT
    res_pos = parse(
        None,
        {"pain": {"present": False, "severity": 4}},
    )
    assert any(a.code == "PAIN_FALSE_BUT_SEVERITY" for a in res_pos.alerts)

    # Negative: pain=False and severity=0 -> NO ALERT
    res_neg1 = parse(
        None,
        {"pain": {"present": False, "severity": 0}},
    )
    assert not any(a.code == "PAIN_FALSE_BUT_SEVERITY" for a in res_neg1.alerts)

    # Negative: pain=True and severity=4 -> NO ALERT
    res_neg2 = parse(
        None,
        {"pain": {"present": True, "severity": 4}},
    )
    assert not any(a.code == "PAIN_FALSE_BUT_SEVERITY" for a in res_neg2.alerts)


def test_rule_2_pain_true_no_severity() -> None:
    # Positive: pain=True but severity is None -> ALERT
    res_pos = parse(
        None,
        {"pain": {"present": True, "severity": None, "body_regions": ["HEAD"]}},
    )
    assert any(a.code == "PAIN_TRUE_NO_SEVERITY" for a in res_pos.alerts)

    # Negative: pain=True and severity=6 -> NO ALERT
    res_neg = parse(
        None,
        {"pain": {"present": True, "severity": 6, "body_regions": ["HEAD"]}},
    )
    assert not any(a.code == "PAIN_TRUE_NO_SEVERITY" for a in res_neg.alerts)


def test_rule_3_pain_true_no_region() -> None:
    # Positive: pain=True but body_regions is empty -> ALERT
    res_pos = parse(
        None,
        {"pain": {"present": True, "severity": 5, "body_regions": []}},
    )
    assert any(a.code == "PAIN_TRUE_NO_REGION" for a in res_pos.alerts)

    # Negative: pain=True and body_regions has ["CHEST"] -> NO ALERT
    res_neg = parse(
        None,
        {"pain": {"present": True, "severity": 5, "body_regions": ["CHEST"]}},
    )
    assert not any(a.code == "PAIN_TRUE_NO_REGION" for a in res_neg.alerts)


def test_rule_4_pain_false_but_region() -> None:
    # Positive: pain=False but body_regions has items -> ALERT
    res_pos = parse(
        None,
        {"pain": {"present": False, "body_regions": ["CHEST"]}},
    )
    assert any(a.code == "PAIN_FALSE_BUT_REGION" for a in res_pos.alerts)

    # Negative: pain=False and body_regions is empty -> NO ALERT
    res_neg = parse(
        None,
        {"pain": {"present": False, "body_regions": []}},
    )
    assert not any(a.code == "PAIN_FALSE_BUT_REGION" for a in res_neg.alerts)


def test_rule_5_allergy_false_but_items() -> None:
    # Positive: has_allergy=False but items not empty -> ALERT (critical)
    res_pos = parse(
        None,
        {
            "allergy": {
                "has_allergy": False,
                "items": [{"category": "drug", "name": "penicillin"}],
            }
        },
    )
    alert = next(a for a in res_pos.alerts if a.code == "ALLERGY_FALSE_BUT_ITEMS")
    assert alert.level == "critical"
    assert alert.needs_nurse_ack is True

    # Negative: has_allergy=False and items is empty -> NO ALERT
    res_neg = parse(
        None,
        {"allergy": {"has_allergy": False, "items": []}},
    )
    assert not any(a.code == "ALLERGY_FALSE_BUT_ITEMS" for a in res_neg.alerts)


def test_rule_6_allergy_true_no_items() -> None:
    # Positive: has_allergy=True but items empty -> ALERT
    res_pos = parse(
        None,
        {"allergy": {"has_allergy": True, "items": []}},
    )
    assert any(a.code == "ALLERGY_TRUE_NO_ITEMS" for a in res_pos.alerts)

    # Negative: has_allergy=True and items has element -> NO ALERT
    res_neg = parse(
        None,
        {
            "allergy": {
                "has_allergy": True,
                "items": [{"category": "food", "name": "hải sản"}],
            }
        },
    )
    assert not any(a.code == "ALLERGY_TRUE_NO_ITEMS" for a in res_neg.alerts)


def test_rule_7_allergy_unsure() -> None:
    # Positive: has_allergy="unsure" -> ALERT (critical)
    res_pos = parse(
        None,
        {"allergy": {"has_allergy": "unsure"}},
    )
    alert = next(a for a in res_pos.alerts if a.code == "ALLERGY_UNSURE")
    assert alert.level == "critical"
    assert alert.needs_nurse_ack is True

    # Negative: has_allergy=False -> NO ALERT
    res_neg = parse(
        None,
        {"allergy": {"has_allergy": False}},
    )
    assert not any(a.code == "ALLERGY_UNSURE" for a in res_neg.alerts)


def test_rule_8_missing_allergy() -> None:
    # Positive: has_allergy=None -> ALERT
    res_pos = parse(
        None,
        {"allergy": {"has_allergy": None}},
    )
    assert any(a.code == "MISSING_ALLERGY" for a in res_pos.alerts)

    # Negative: has_allergy=False -> NO ALERT
    res_neg = parse(
        None,
        {"allergy": {"has_allergy": False}},
    )
    assert not any(a.code == "MISSING_ALLERGY" for a in res_neg.alerts)


def test_rule_9_missing_onset() -> None:
    # Positive: pain=True but onset=None -> ALERT (info)
    res_pos = parse(
        None,
        {"pain": {"present": True, "severity": 5, "body_regions": ["HEAD"], "onset": None}},
    )
    assert any(a.code == "MISSING_ONSET" for a in res_pos.alerts)

    # Negative: pain=True and onset provided -> NO ALERT
    res_neg = parse(
        None,
        {
            "pain": {
                "present": True,
                "severity": 5,
                "body_regions": ["HEAD"],
                "onset": {"value": 2, "unit": "hour"},
            }
        },
    )
    assert not any(a.code == "MISSING_ONSET" for a in res_neg.alerts)


def test_rule_10_text_mentions_drug_not_declared() -> None:
    # Positive: text mentions aspirin, allergy items has nothing -> ALERT
    res_pos = parse(
        None,
        {"chief_complaint": {"code": "PAIN", "free_text": "Tôi có uống aspirin"}},
        raw_input={"text": "tôi uống aspirin"},
    )
    assert any(a.code == "TEXT_MENTIONS_DRUG_NOT_DECLARED" for a in res_pos.alerts)

    # Negative: text mentions aspirin, but declared in allergy -> NO ALERT
    res_neg = parse(
        None,
        {
            "chief_complaint": {"code": "PAIN", "free_text": "Tôi có uống aspirin"},
            "allergy": {
                "has_allergy": True,
                "items": [{"category": "drug", "name": "aspirin"}],
            },
        },
    )
    assert not any(a.code == "TEXT_MENTIONS_DRUG_NOT_DECLARED" for a in res_neg.alerts)


def test_rule_11_low_confidence_gloss() -> None:
    # Positive: gloss confidence < 0.6 -> ALERT
    res_pos = parse(
        None,
        {},
        raw_input={"gloss": [{"gloss": "ĐAU", "confidence": 0.45}]},
    )
    assert any(a.code == "LOW_CONFIDENCE_GLOSS" for a in res_pos.alerts)

    # Negative: gloss confidence >= 0.6 -> NO ALERT
    res_neg = parse(
        None,
        {},
        raw_input={"gloss": [{"gloss": "ĐAU", "confidence": 0.85}]},
    )
    assert not any(a.code == "LOW_CONFIDENCE_GLOSS" for a in res_neg.alerts)


def test_rule_12_emergency_red_flag() -> None:
    # 1. Breath difficulty
    res_breath = parse(None, {"chief_complaint": {"code": "BREATH_DIFFICULTY"}})
    assert res_breath.emergency_flag is True
    assert any(a.code == "EMERGENCY_RED_FLAG" for a in res_breath.alerts)

    # 2. Chest pain with severity >= 8
    res_chest = parse(
        None,
        {"pain": {"present": True, "severity": 8, "body_regions": ["CHEST"]}},
    )
    assert res_chest.emergency_flag is True

    # 3. Bleeding with severity >= 8
    res_bleed = parse(
        None,
        {
            "chief_complaint": {"code": "BLEED"},
            "pain": {"present": True, "severity": 9, "body_regions": ["ARM_L"]},
        },
    )
    assert res_bleed.emergency_flag is True

    # 4. Severity == 10 anywhere
    res_10 = parse(
        None,
        {"pain": {"present": True, "severity": 10, "body_regions": ["LEG_R"]}},
    )
    assert res_10.emergency_flag is True

    # 5. Emergency help code
    res_help = parse(None, {"chief_complaint": {"code": "EMERGENCY_HELP"}})
    assert res_help.emergency_flag is True

    # Negative: Mild pain on arm
    res_mild = parse(
        None,
        {
            "chief_complaint": {"code": "PAIN"},
            "pain": {"present": True, "severity": 4, "body_regions": ["ARM_L"]},
        },
    )
    assert res_mild.emergency_flag is False
    assert not any(a.code == "EMERGENCY_RED_FLAG" for a in res_mild.alerts)


def test_rule_13_patient_unsure() -> None:
    # Positive: patient marked unsure -> ALERT
    res_pos = parse(None, {}, raw_input={"decision": "unsure"})
    assert any(a.code == "PATIENT_UNSURE" for a in res_pos.alerts)

    # Negative: confirmed -> NO ALERT
    res_neg = parse(None, {}, raw_input={"decision": "confirmed"})
    assert not any(a.code == "PATIENT_UNSURE" for a in res_neg.alerts)


def test_completeness_calculation() -> None:
    # Empty frame
    res_empty = parse(None, {})
    assert res_empty.completeness == 0.0

    # Full complete frame
    res_full = parse(
        None,
        {
            "chief_complaint": {"code": "PAIN"},
            "pain": {
                "present": True,
                "severity": 7,
                "body_regions": ["CHEST"],
                "onset": {"value": 2, "unit": "hour"},
            },
            "allergy": {
                "has_allergy": True,
                "items": [{"category": "drug", "name": "aspirin"}],
            },
        },
    )
    assert res_full.completeness == 1.0
    assert len(res_full.frame.missing_fields) == 0

    # Frame with no pain and no allergy
    res_no_pain = parse(
        None,
        {
            "chief_complaint": {"code": "FEVER"},
            "pain": {"present": False},
            "allergy": {"has_allergy": False},
        },
    )
    assert res_no_pain.completeness == 1.0


def test_patch_merging_with_existing_frame() -> None:
    initial = SemanticFrame(
        session_id="session-1",
        extra_symptoms=["FEVER"],
        modality=["touch"],
    )
    res = parse(
        initial,
        {
            "chief_complaint": {"code": "PAIN"},  # tests auto label_vi lookup from code
            "pain": {"present": True, "severity": 6, "onset": None, "course": "constant"},
            "allergy": {
                "items": [
                    AllergyItem(category="drug", name="penicillin"),  # test isinstance(AllergyItem)
                ]
            },
            "modality": ["text"],
            "extra_symptoms": ["FEVER", "COUGH"],
        },
    )
    assert res.frame.chief_complaint.label_vi == "Đau"
    assert res.frame.pain.present is True
    assert res.frame.pain.severity == 6
    assert res.frame.pain.onset is None
    assert res.frame.pain.course == "constant"
    assert len(res.frame.allergy.items) == 1
    assert "text" in res.frame.modality
    assert "COUGH" in res.frame.extra_symptoms
