import secrets
import time
from typing import Any

from app.domain.models import SemanticFrame, SessionStatus, TriageSummary
from app.domain.state_machine import SessionStateMachine

PAIRING_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
PAIRING_CODE_LENGTH = 6
PAIRING_TTL_SECONDS = 600.0  # 10 phút


def generate_pairing_code() -> str:
    return "".join(secrets.choice(PAIRING_CHARS) for _ in range(PAIRING_CODE_LENGTH))


def generate_token() -> str:
    return secrets.token_urlsafe(24)


class SessionData:
    def __init__(self, session_id: str, pairing_code: str, token_nurse: str) -> None:
        self.session_id: str = session_id
        self.pairing_code: str = pairing_code
        self.token_nurse: str = token_nurse
        self.token_patient: str | None = None
        self.token_doctor: str | None = None

        self.created_at: float = time.time()
        self.last_activity: float = time.time()

        self.state_machine: SessionStateMachine = SessionStateMachine()
        self.frame: SemanticFrame = SemanticFrame(session_id=session_id)
        self.summary: TriageSummary | None = None

        self.current_seq: int = 0
        self.event_buffer: list[dict[str, Any]] = []

        self.force_fallback: bool = False
        self.interpreter_requested: bool = False
        self.queue_number: int | None = None
        self.intake_code: str | None = None

    @property
    def status(self) -> SessionStatus:
        return self.state_machine.current_state

    def touch(self) -> None:
        self.last_activity = time.time()

    def is_pairing_expired(self) -> bool:
        if self.token_patient is not None:
            return False
        return (time.time() - self.created_at) > PAIRING_TTL_SECONDS

    def is_idle_expired(self, max_idle_seconds: float = 600.0) -> bool:
        return (time.time() - self.last_activity) > max_idle_seconds

    def append_event(self, event_data: dict[str, Any]) -> int:
        self.current_seq += 1
        event_data["seq"] = self.current_seq
        self.event_buffer.append(event_data)
        if len(self.event_buffer) > 100:
            self.event_buffer.pop(0)
        self.touch()
        return self.current_seq

    def get_events_since(self, last_seq: int) -> list[dict[str, Any]]:
        return [e for e in self.event_buffer if e.get("seq", 0) > last_seq]


class InMemorySessionStore:
    def __init__(self) -> None:
        self._sessions: dict[str, SessionData] = {}
        self._pairing_map: dict[str, str] = {}

    async def create_session(self, session_id: str) -> SessionData:
        # Sinh pairing code duy nhất
        for _ in range(100):
            code = generate_pairing_code()
            if code not in self._pairing_map:
                break
        else:
            code = generate_pairing_code()

        token_nurse = generate_token()
        session = SessionData(
            session_id=session_id,
            pairing_code=code,
            token_nurse=token_nurse,
        )
        self._sessions[session_id] = session
        self._pairing_map[code] = session_id
        return session

    async def get_session(self, session_id: str) -> SessionData | None:
        return self._sessions.get(session_id)

    async def get_session_by_pairing_code(self, code: str) -> SessionData | None:
        code_upper = code.strip().upper()
        # Chuẩn hóa nếu người dùng nhập 0 thay O hoặc 1 thay I
        norm_code = code_upper.replace("0", "O").replace("1", "I")

        session_id = self._pairing_map.get(code_upper)
        if not session_id:
            # Thử tìm theo mã đã chuẩn hóa
            for p_code, s_id in self._pairing_map.items():
                if p_code.replace("0", "O").replace("1", "I") == norm_code:
                    session_id = s_id
                    code_upper = p_code
                    break

        if not session_id:
            return None
        session = self._sessions.get(session_id)
        if session and session.is_pairing_expired():
            self._pairing_map.pop(code_upper, None)
            self._sessions.pop(session_id, None)
            return None
        return session

    async def remove_session(self, session_id: str) -> None:
        session = self._sessions.pop(session_id, None)
        if session and session.pairing_code in self._pairing_map:
            del self._pairing_map[session.pairing_code]

    async def cleanup_idle_sessions(self, max_idle_seconds: float = 600.0) -> list[str]:
        expired_ids: list[str] = []
        for s_id, session in list(self._sessions.items()):
            if session.is_idle_expired(max_idle_seconds) or session.is_pairing_expired():
                expired_ids.append(s_id)
                del self._sessions[s_id]
                if session.pairing_code in self._pairing_map:
                    del self._pairing_map[session.pairing_code]
        return expired_ids


# Singleton instance cho memory store
session_store = InMemorySessionStore()
