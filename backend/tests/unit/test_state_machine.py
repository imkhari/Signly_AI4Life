import pytest

from app.domain.state_machine import InvalidStateTransitionError, SessionStateMachine


def test_happy_path_state_transitions() -> None:
    sm = SessionStateMachine()
    assert sm.current_state == "created"

    # Patient joins
    sm.on_patient_joined()
    assert sm.current_state == "paired"

    # Patient updates input
    sm.on_input_updated()
    assert sm.current_state == "collecting"

    # Patient continues updating input
    sm.on_input_updated()
    assert sm.current_state == "collecting"

    # Summary is ready
    sm.on_summary_ready()
    assert sm.current_state == "summary_ready"

    # Patient confirms
    sm.on_patient_confirmed("confirmed")
    assert sm.current_state == "patient_confirmed"

    # Nurse verifies
    sm.on_nurse_verified()
    assert sm.current_state == "nurse_verified"

    # Record exported
    sm.on_record_exported()
    assert sm.current_state == "exported"

    # Reset
    sm.on_session_reset()
    assert sm.current_state == "reset"


def test_patient_needs_edit_reverts_to_collecting() -> None:
    sm = SessionStateMachine("summary_ready")
    sm.on_patient_confirmed("needs_edit")
    assert sm.current_state == "collecting"

    sm2 = SessionStateMachine("summary_ready")
    sm2.on_patient_confirmed("unsure")
    assert sm2.current_state == "collecting"


def test_input_update_after_patient_confirmed_reverts_to_collecting() -> None:
    sm = SessionStateMachine("patient_confirmed")
    sm.on_input_updated()
    assert sm.current_state == "collecting"


def test_invalid_state_transitions() -> None:
    # Cannot update input before paired
    sm = SessionStateMachine("created")
    with pytest.raises(InvalidStateTransitionError):
        sm.on_input_updated()

    # Cannot verify before patient confirmed
    sm_unconfirmed = SessionStateMachine("summary_ready")
    with pytest.raises(InvalidStateTransitionError):
        sm_unconfirmed.on_nurse_verified()

    # Cannot export before nurse verified
    sm_unverified = SessionStateMachine("patient_confirmed")
    with pytest.raises(InvalidStateTransitionError):
        sm_unverified.on_record_exported()

    # Cannot confirm when not summary_ready
    sm_collecting = SessionStateMachine("collecting")
    with pytest.raises(InvalidStateTransitionError):
        sm_collecting.on_patient_confirmed("confirmed")

    # Cannot trigger summary_ready from created state
    sm_created = SessionStateMachine("created")
    with pytest.raises(InvalidStateTransitionError):
        sm_created.on_summary_ready()
