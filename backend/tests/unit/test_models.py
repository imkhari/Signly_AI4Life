import pytest

from app.domain.models import (
    Allergy,
    ChiefComplaint,
    Onset,
    Pain,
    SemanticFrame,
    TriageSummary,
)


def test_null_not_coerced_to_false() -> None:
    pain = Pain()
    assert pain.present is None
    assert pain.present is not False

    allergy = Allergy()
    assert allergy.has_allergy is None
    assert allergy.has_allergy is not False

    frame = SemanticFrame(session_id="test-session")
    assert frame.pain.present is None
    assert frame.allergy.has_allergy is None


def test_severity_validation() -> None:
    # Valid values
    assert Pain(severity=0).severity == 0
    assert Pain(severity=10).severity == 10
    assert Pain(severity=5).severity == 5
    assert Pain(severity=None).severity is None

    # Invalid values
    with pytest.raises(ValueError, match="severity must be between 0 and 10"):
        Pain(severity=-1)

    with pytest.raises(ValueError, match="severity must be between 0 and 10"):
        Pain(severity=11)


def test_triage_summary_creation() -> None:
    frame = SemanticFrame(
        session_id="session-123",
        chief_complaint=ChiefComplaint(code="PAIN", label_vi="Đau"),
        pain=Pain(
            present=True,
            severity=7,
            body_regions=["CHEST"],
            onset=Onset(value=2, unit="hour"),
        ),
        allergy=Allergy(has_allergy=False),
    )
    summary = TriageSummary(
        session_id="session-123",
        intake_code="AC-0001",
        queue_number=1,
        status="summary_ready",
        frame=frame,
        nl_text_vi="Bạn bị đau ngực mức 7/10.",
    )
    assert summary.session_id == "session-123"
    assert summary.intake_code == "AC-0001"
    assert summary.queue_number == 1
    assert summary.flags.emergency_flag is False
    assert summary.validator.passed is True
