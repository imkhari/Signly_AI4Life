from typing import Literal

from app.domain.models import SessionStatus


class InvalidStateTransitionError(Exception):
    def __init__(self, current_state: SessionStatus, action: str) -> None:
        super().__init__(
            f"Không thể chuyển trạng thái từ '{current_state}' với hành động '{action}'"
        )
        self.current_state = current_state
        self.action = action


class SessionStateMachine:
    def __init__(self, initial_state: SessionStatus = "created") -> None:
        self._state: SessionStatus = initial_state

    @property
    def current_state(self) -> SessionStatus:
        return self._state

    def on_patient_joined(self) -> SessionStatus:
        if self._state == "created":
            self._state = "paired"
        return self._state

    def on_input_updated(self) -> SessionStatus:
        if self._state in ["paired", "collecting", "summary_ready", "patient_confirmed"]:
            self._state = "collecting"
        elif self._state == "created":
            raise InvalidStateTransitionError(self._state, "INPUT_UPDATED")
        return self._state

    def on_summary_ready(self) -> SessionStatus:
        if self._state in ["collecting", "summary_ready"]:
            self._state = "summary_ready"
        else:
            raise InvalidStateTransitionError(self._state, "SUMMARY_READY")
        return self._state

    def on_patient_confirmed(
        self, decision: Literal["confirmed", "needs_edit", "unsure"]
    ) -> SessionStatus:
        if self._state != "summary_ready":
            raise InvalidStateTransitionError(self._state, f"PATIENT_CONFIRMED_{decision}")

        if decision == "confirmed":
            self._state = "patient_confirmed"
        else:  # "needs_edit" or "unsure"
            self._state = "collecting"
        return self._state

    def on_nurse_verified(self) -> SessionStatus:
        if self._state == "patient_confirmed":
            self._state = "nurse_verified"
        else:
            raise InvalidStateTransitionError(self._state, "NURSE_VERIFIED")
        return self._state

    def on_record_exported(self) -> SessionStatus:
        if self._state == "nurse_verified":
            self._state = "exported"
        else:
            raise InvalidStateTransitionError(self._state, "RECORD_EXPORTED")
        return self._state

    def on_session_reset(self) -> SessionStatus:
        self._state = "reset"
        return self._state
