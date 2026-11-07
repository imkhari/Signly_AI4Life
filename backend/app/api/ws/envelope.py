from datetime import UTC, datetime
from typing import Any


def make_envelope(
    event: str,
    session_id: str,
    seq: int,
    source: str,
    payload: Any,
) -> dict[str, Any]:
    return {
        "event": event,
        "session_id": session_id,
        "seq": seq,
        "ts": datetime.now(UTC).isoformat(),
        "source": source,
        "payload": payload,
    }


def make_error_envelope(
    session_id: str,
    seq: int,
    code: str,
    message_vi: str,
    detail: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return make_envelope(
        event="ERROR",
        session_id=session_id,
        seq=seq,
        source="server",
        payload={
            "code": code,
            "message_vi": message_vi,
            "detail": detail or {},
        },
    )
