from app.domain.events import (
    EventEnvelope,
    InputUpdatedClientPayload,
    NurseQuestionPayload,
    PatientConfirmedPayload,
    SessionJoinedPayload,
    SessionResetPayload,
)


def test_event_envelope_creation() -> None:
    payload = SessionJoinedPayload(role="patient", pairing_code="ABCDEF")
    envelope = EventEnvelope(
        event="SESSION_JOINED",
        session_id="session-456",
        seq=1,
        source="server",
        payload=payload,
    )
    assert envelope.event == "SESSION_JOINED"
    assert envelope.session_id == "session-456"
    assert envelope.seq == 1
    assert envelope.payload.role == "patient"
    assert envelope.payload.pairing_code == "ABCDEF"


def test_input_updated_payload() -> None:
    payload = InputUpdatedClientPayload(
        step="pain_details",
        modality="touch",
        patch={"pain": {"severity": 8}},
    )
    assert payload.step == "pain_details"
    assert payload.patch["pain"]["severity"] == 8


def test_patient_confirmed_payload() -> None:
    payload = PatientConfirmedPayload(
        decision="confirmed",
        confirmed_fields=["chief_complaint", "pain"],
    )
    assert payload.decision == "confirmed"
    assert len(payload.confirmed_fields) == 2


def test_nurse_question_payload() -> None:
    payload = NurseQuestionPayload(
        question_id="q-1",
        template_code="ASK_DRUG",
        text_vi="Bạn có dị ứng thuốc không?",
    )
    assert payload.question_id == "q-1"
    assert payload.answer_type == "yes_no_unsure"


def test_session_reset_payload() -> None:
    payload = SessionResetPayload(reason="completed", wipe=True)
    assert payload.reason == "completed"
    assert payload.wipe is True

