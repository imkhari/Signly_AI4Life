import uuid
from typing import Literal

from app.infrastructure.session_store_memory import SessionData, generate_token, session_store


class SessionService:
    def __init__(self) -> None:
        self.store = session_store

    async def create_session(self) -> tuple[str, str, str]:
        """Tạo phiên khám mới từ phía y tá.

        Trả về (session_id, pairing_code, token_nurse).
        """
        session_id = str(uuid.uuid4())
        session = await self.store.create_session(session_id)
        return session.session_id, session.pairing_code, session.token_nurse

    async def join_session(self, pairing_code: str) -> tuple[str, str] | None:
        """Bệnh nhân nhập mã ghép 6 ký tự để ghép vào phiên.

        Trả về (session_id, token_patient) hoặc None nếu mã sai/hết hạn.
        """
        session = await self.store.get_session_by_pairing_code(pairing_code)
        if not session:
            return None

        # Nếu chưa có token_patient thì sinh mới
        if not session.token_patient:
            session.token_patient = generate_token()
            # Chuyển trạng thái sang paired
            if session.status == "created":
                session.state_machine.on_patient_joined()

        session.touch()
        return session.session_id, session.token_patient

    async def verify_token(
        self, session_id: str, role: Literal["patient", "nurse", "doctor"], token: str
    ) -> bool:
        """Xác thực token tương ứng với role trong phiên."""
        session = await self.store.get_session(session_id)
        if not session:
            return False

        if role == "nurse":
            return session.token_nurse == token
        elif role == "patient":
            return session.token_patient == token
        elif role == "doctor":
            # Nếu chưa có token doctor thì cấp khi khớp hoặc demo
            if not session.token_doctor:
                session.token_doctor = token
            return session.token_doctor == token
        return False

    async def get_session(self, session_id: str) -> SessionData | None:
        return await self.store.get_session(session_id)

    async def reset_session(self, session_id: str, reason: str = "completed") -> bool:
        """Xóa sạch dữ liệu phiên khỏi RAM."""
        session = await self.store.get_session(session_id)
        if not session:
            return False
        await self.store.remove_session(session_id)
        return True

    async def set_force_fallback(self, session_id: str, force: bool) -> bool:
        session = await self.store.get_session(session_id)
        if not session:
            return False
        session.force_fallback = force
        return True


session_service = SessionService()
