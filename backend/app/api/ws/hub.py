import asyncio
import json
import logging
from typing import Any, Literal

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from app.api.ws.envelope import make_envelope
from app.api.ws.handlers import handle_ws_message
from app.application.session_service import session_service

logger = logging.getLogger("ai4care.ws")
router = APIRouter(tags=["websocket"])


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[str, dict[str, WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, session_id: str, role: str, websocket: WebSocket) -> None:
        async with self._lock:
            role_map = self._connections.setdefault(session_id, {})
            old_ws = role_map.get(role)
            if old_ws:
                try:
                    await old_ws.close(code=4001, reason="Duplicate connection for role")
                except Exception:
                    pass

            await websocket.accept()
            role_map[role] = websocket

    def disconnect(self, session_id: str, role: str, websocket: WebSocket) -> None:
        if session_id in self._connections:
            if self._connections[session_id].get(role) == websocket:
                del self._connections[session_id][role]
            if not self._connections[session_id]:
                del self._connections[session_id]

    async def broadcast(self, session_id: str, message: dict[str, Any]) -> None:
        role_map = self._connections.get(session_id, {})
        for _, ws in list(role_map.items()):
            try:
                await ws.send_json(message)
            except Exception:
                pass

    async def send_to_role(self, session_id: str, role: str, message: dict[str, Any]) -> None:
        ws = self._connections.get(session_id, {}).get(role)
        if ws:
            try:
                await ws.send_json(message)
            except Exception:
                pass

    async def close_session(self, session_id: str, code: int = 1000) -> None:
        async with self._lock:
            role_map = self._connections.pop(session_id, {})
            for _, ws in role_map.items():
                try:
                    await ws.close(code=code, reason="Session ended")
                except Exception:
                    pass


manager = ConnectionManager()


@router.websocket("/ws/{session_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    session_id: str,
    role: Literal["patient", "nurse", "doctor"] = Query(...),
    token: str = Query(...),
    last_seq: int | None = Query(default=None),
) -> None:
    session = await session_service.get_session(session_id)
    if not session:
        await websocket.close(code=4004, reason="Session not found")
        return

    valid_token = await session_service.verify_token(session_id, role, token)
    if not valid_token:
        await websocket.close(code=4003, reason="Forbidden / Invalid token")
        return

    await manager.connect(session_id, role, websocket)

    # Replay các event bị lỡ nếu client cung cấp last_seq
    if last_seq is not None:
        missed = session.get_events_since(last_seq)
        for event_dict in missed:
            try:
                await websocket.send_json(event_dict)
            except Exception:
                break

    # Phát event SESSION_JOINED cho tất cả thành viên trong phiên
    joined_payload = {
        "role": role,
        "pairing_code": session.pairing_code,
    }
    joined_envelope = make_envelope(
        event="SESSION_JOINED",
        session_id=session.session_id,
        seq=0,
        source="server",
        payload=joined_payload,
    )
    session.append_event(joined_envelope)
    await manager.broadcast(session.session_id, joined_envelope)

    try:
        while True:
            text = await websocket.receive_text()
            try:
                data = json.loads(text)
            except json.JSONDecodeError:
                continue

            await handle_ws_message(session, role, data, manager)
    except WebSocketDisconnect:
        manager.disconnect(session_id, role, websocket)
    except Exception as exc:
        logger.warning(
            "WebSocket unexpected error: %s",
            type(exc).__name__,
        )
        manager.disconnect(session_id, role, websocket)
