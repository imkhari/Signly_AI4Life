import logging
from datetime import UTC, datetime
from typing import Any

from app.ai.orchestrator import orchestrate_summary
from app.api.rest.vsl import clear_vsl_motion_buffer
from app.api.ws.envelope import make_envelope, make_error_envelope
from app.application.nurse_view_builder import build_nurse_view
from app.application.session_service import session_service
from app.domain.models import Flags, Timestamps, TriageSummary
from app.domain.parser import _create_alert, parse
from app.domain.state_machine import InvalidStateTransitionError
from app.infrastructure.llm import get_llm_client
from app.infrastructure.session_store_memory import SessionData

# Cấu hình logger an toàn (privacy-by-design): Không log payload chứa PII
logger = logging.getLogger("ai4care.ws")


async def handle_ws_message(
    session: SessionData,
    role: str,
    raw_message: dict[str, Any],
    hub: Any,
) -> None:
    session.touch()
    event_type = raw_message.get("event")
    payload = raw_message.get("payload", {})

    # Safe privacy logging: chỉ log event, session_id băm/cắt ngắn, role, không log payload
    masked_session_id = f"{session.session_id[:8]}..."
    logger.info("[WS_EVENT] event=%s session=%s role=%s", event_type, masked_session_id, role)

    # 1. Heartbeat PING
    if event_type == "PING":
        pong_event = make_envelope(
            event="PONG",
            session_id=session.session_id,
            seq=0,
            source="server",
            payload={},
        )
        await hub.send_to_role(session.session_id, role, pong_event)
        return

    # 2. INPUT_UPDATED (patient -> server -> all)
    if event_type == "INPUT_UPDATED":
        # Role check: patient (hoặc y tá trợ giúp)
        if role not in ["patient", "nurse", "doctor"]:
            err = make_error_envelope(
                session.session_id,
                session.current_seq,
                "FORBIDDEN_ROLE",
                "Bạn không có quyền cập nhật thông tin bệnh nhân",
            )
            await hub.send_to_role(session.session_id, role, err)
            return

        if session.status in ["nurse_verified", "exported", "reset"]:
            err = make_error_envelope(
                session.session_id, session.current_seq, "VALIDATION_ERROR",
                "Phiếu đã đóng chỉnh sửa. Vui lòng tạo phiên mới nếu cần sửa.",
            )
            await hub.send_to_role(session.session_id, role, err)
            return

        reply_to = payload.get("reply_to")
        if reply_to:
            pending = session.pending_question
            answer = payload.get("patch", {}).get("allergy", {}).get("has_allergy")
            if (
                role != "patient"
                or not pending
                or reply_to != pending["question_id"]
                or pending["template_code"] != "ASK_DRUG_ALLERGY"
                or (answer is not True and answer is not False and answer != "unsure")
                or set(payload.get("patch", {})) != {"allergy"}
            ):
                err = make_error_envelope(
                    session.session_id, session.current_seq, "VALIDATION_ERROR",
                    "Câu trả lời chưa khớp câu hỏi hiện tại. Vui lòng hỏi lại điều dưỡng.",
                )
                await hub.send_to_role(session.session_id, role, err)
                return

        patch = payload.get("patch", {})
        raw_input = payload.get("raw_input")
        step = "nurse_reply" if reply_to else payload.get("step", "")
        modality = payload.get("modality", "touch")

        if modality not in session.frame.modality:
            session.frame.modality.append(modality)

        parse_result = parse(
            session.frame,
            patch=patch,
            raw_input=raw_input,
            session_id=session.session_id,
        )
        session.frame = parse_result.frame
        if reply_to:
            session.pending_question = None

        try:
            session.state_machine.on_input_updated()
        except InvalidStateTransitionError:
            pass
        if session.status == "collecting":
            session.summary = None

        server_payload = {
            "frame": session.frame.model_dump(),
            "alerts": [a.model_dump() for a in parse_result.alerts],
            "completeness": parse_result.completeness,
            "step": step,
        }
        envelope = make_envelope(
            event="INPUT_UPDATED",
            session_id=session.session_id,
            seq=0,
            source="server",
            payload=server_payload,
        )
        session.append_event(envelope)
        await hub.broadcast(session.session_id, envelope)
        return

    # 3. SUMMARY_REQUESTED (patient -> server)
    if event_type == "SUMMARY_REQUESTED":
        if role not in ["patient", "nurse"]:
            err = make_error_envelope(
                session.session_id,
                session.current_seq,
                "FORBIDDEN_ROLE",
                "Chỉ bệnh nhân mới được yêu cầu tóm tắt",
            )
            await hub.send_to_role(session.session_id, role, err)
            return

        frame = session.frame
        result = await orchestrate_summary(
            frame,
            get_llm_client(),
            force_fallback=session.force_fallback,
        )
        try:
            if session.frame is not frame:
                raise InvalidStateTransitionError(session.status, "SUMMARY_READY")
            session.state_machine.on_summary_ready()
        except InvalidStateTransitionError:
            err = make_error_envelope(
                session.session_id,
                session.current_seq,
                "VALIDATION_ERROR",
                "Thông tin phiên đã thay đổi. Vui lòng mở lại bước tóm tắt.",
            )
            await hub.send_to_role(session.session_id, role, err)
            return

        nurse_view = build_nurse_view(session.frame)
        emergency_flag = any(a.level == "critical" for a in session.frame.conflicts)
        intake_code = session.intake_code or f"AC-{session.session_id[:4].upper()}"

        summary = TriageSummary(
            session_id=session.session_id,
            intake_code=intake_code,
            queue_number=session.queue_number,
            status=session.status,
            frame=session.frame,
            nl_text_vi=result.text_vi,
            nl_source=result.nl_source,
            fallback_reason=result.fallback_reason,
            validator=result.validator,
            alerts=session.frame.conflicts,
            nurse_view=nurse_view,
            flags=Flags(
                interpreter_requested=session.interpreter_requested,
                emergency_flag=emergency_flag,
            ),
            timestamps=Timestamps(
                created=datetime.fromtimestamp(session.created_at, UTC).isoformat()
            ),
        )
        session.summary = summary

        summary_ready_payload = {
            "summary": summary.model_dump(),
            "nl_text_vi": result.text_vi,
            "nl_source": result.nl_source,
            "fallback_reason": result.fallback_reason,
            "validator": result.validator.model_dump(),
            "tts_text": result.tts_text,
        }
        envelope = make_envelope(
            event="SUMMARY_READY",
            session_id=session.session_id,
            seq=0,
            source="server",
            payload=summary_ready_payload,
        )
        session.append_event(envelope)
        await hub.broadcast(session.session_id, envelope)
        return

    # 4. PATIENT_CONFIRMED (patient -> server -> all)
    if event_type == "PATIENT_CONFIRMED":
        if role != "patient":
            err = make_error_envelope(
                session.session_id,
                session.current_seq,
                "FORBIDDEN_ROLE",
                "Chỉ bệnh nhân mới được xác nhận phiếu",
            )
            await hub.send_to_role(session.session_id, role, err)
            return

        decision = payload.get("decision", "confirmed")
        if decision == "confirmed" and (
            any(a.code == "PAIN_FALSE_BUT_SEVERITY" for a in session.frame.conflicts)
            or session.pending_question is not None
        ):
            err = make_error_envelope(
                session.session_id, session.current_seq, "VALIDATION_ERROR",
                "Cần trả lời câu hỏi và sửa thông tin chưa khớp trước khi xác nhận.",
            )
            await hub.send_to_role(session.session_id, role, err)
            return

        try:
            session.state_machine.on_patient_confirmed(decision)
        except InvalidStateTransitionError:
            err = make_error_envelope(
                session.session_id,
                session.current_seq,
                "VALIDATION_ERROR",
                "Bản tóm tắt chưa sẵn sàng. Vui lòng kiểm tra lại thông tin.",
            )
            await hub.send_to_role(session.session_id, role, err)
            return

        if decision == "confirmed":
            if session.summary:
                session.summary.status = session.status
                session.summary.timestamps.patient_confirmed = datetime.now(UTC).isoformat()
        elif decision == "needs_edit":
            payload["confirmed_fields"] = []
        elif decision == "unsure":
            alert = _create_alert("PATIENT_UNSURE")
            session.frame.conflicts.append(alert)

        envelope = make_envelope(
            event="PATIENT_CONFIRMED",
            session_id=session.session_id,
            seq=0,
            source="patient",
            payload=payload,
        )
        session.append_event(envelope)
        await hub.broadcast(session.session_id, envelope)
        return

    # 5. NURSE_QUESTION (nurse -> server -> patient)
    if event_type == "NURSE_QUESTION":
        if role != "nurse":
            err = make_error_envelope(
                session.session_id,
                session.current_seq,
                "FORBIDDEN_ROLE",
                "Chỉ y tá mới được gửi câu hỏi bổ sung",
            )
            await hub.send_to_role(session.session_id, role, err)
            return

        if (
            session.status in ["nurse_verified", "exported", "reset"]
            or session.pending_question is not None
            or payload.get("template_code") not in ["ASK_DRUG_ALLERGY", "ASK_DRUG"]
            or not payload.get("question_id")
        ):
            err = make_error_envelope(
                session.session_id, session.current_seq, "VALIDATION_ERROR",
                "Câu hỏi chưa sẵn sàng. Hãy hoàn tất câu hỏi dị ứng hiện tại trước.",
            )
            await hub.send_to_role(session.session_id, role, err)
            return
        payload = {
            "question_id": payload["question_id"],
            "template_code": "ASK_DRUG_ALLERGY",
            "text_vi": "Bạn có dị ứng nào không?",
            "answer_type": "yes_no_unsure",
            "icon": "pill",
        }
        session.pending_question = payload
        if session.status in ["summary_ready", "patient_confirmed"]:
            session.state_machine.on_input_updated()
            session.summary = None

        envelope = make_envelope(
            event="NURSE_QUESTION",
            session_id=session.session_id,
            seq=0,
            source="nurse",
            payload=payload,
        )
        session.append_event(envelope)
        await hub.broadcast(session.session_id, envelope)
        return

    # 6. NURSE_VERIFIED (nurse -> server -> all)
    if event_type == "NURSE_VERIFIED":
        if role != "nurse":
            err = make_error_envelope(
                session.session_id,
                session.current_seq,
                "FORBIDDEN_ROLE",
                "Chỉ y tá mới được duyệt phiếu",
            )
            await hub.send_to_role(session.session_id, role, err)
            return

        # Ràng buộc an toàn: Chỉ duyệt được khi bệnh nhân đã xác nhận
        if session.status != "patient_confirmed":
            err = make_error_envelope(
                session.session_id,
                session.current_seq,
                "VALIDATION_ERROR",
                "Chỉ có thể duyệt sau khi bệnh nhân đã xác nhận phiếu",
                detail={"current_status": session.status},
            )
            await hub.send_to_role(session.session_id, role, err)
            return

        acknowledged = payload.get("acknowledged_alerts", [])
        if not isinstance(acknowledged, list) or any(
            not isinstance(code, str) for code in acknowledged
        ):
            acknowledged = []
        if session.pending_question is not None or any(
            alert.level == "critical" and alert.code not in acknowledged
            for alert in session.frame.conflicts
        ):
            err = make_error_envelope(
                session.session_id, session.current_seq, "VALIDATION_ERROR",
                "Cần giải quyết câu hỏi và xác nhận đã biết cảnh báo trước khi duyệt.",
            )
            await hub.send_to_role(session.session_id, role, err)
            return

        session.intake_code = payload.get("intake_code")
        session.queue_number = payload.get("queue_number")
        try:
            session.state_machine.on_nurse_verified()
        except InvalidStateTransitionError:
            pass

        if session.summary:
            session.summary.status = session.status
            session.summary.intake_code = session.intake_code or session.summary.intake_code
            session.summary.queue_number = session.queue_number
            session.summary.timestamps.nurse_verified = datetime.now(UTC).isoformat()

        envelope = make_envelope(
            event="NURSE_VERIFIED",
            session_id=session.session_id,
            seq=0,
            source="nurse",
            payload=payload,
        )
        session.append_event(envelope)
        await hub.broadcast(session.session_id, envelope)
        return

    # 7. RECORD_EXPORTED (nurse -> server -> all)
    if event_type == "RECORD_EXPORTED":
        if role not in ["nurse", "doctor"]:
            err = make_error_envelope(
                session.session_id,
                session.current_seq,
                "FORBIDDEN_ROLE",
                "Bạn không có quyền xuất hồ sơ",
            )
            await hub.send_to_role(session.session_id, role, err)
            return

        if session.status not in ("nurse_verified", "exported") or session.summary is None:
            err = make_error_envelope(
                session.session_id,
                session.current_seq,
                "VALIDATION_ERROR",
                "Chỉ xuất phiếu sau khi bệnh nhân xác nhận và điều dưỡng duyệt.",
            )
            await hub.send_to_role(session.session_id, role, err)
            return

        if session.status == "nurse_verified":
            try:
                session.state_machine.on_record_exported()
            except InvalidStateTransitionError:
                pass

        envelope = make_envelope(
            event="RECORD_EXPORTED",
            session_id=session.session_id,
            seq=0,
            source="nurse",
            payload=payload,
        )
        session.append_event(envelope)
        await hub.broadcast(session.session_id, envelope)
        return

    # 8. REQUEST_INTERPRETER (patient/nurse -> server -> all)
    if event_type == "REQUEST_INTERPRETER":
        session.interpreter_requested = True
        envelope = make_envelope(
            event="REQUEST_INTERPRETER",
            session_id=session.session_id,
            seq=0,
            source=role,
            payload=payload,
        )
        session.append_event(envelope)
        await hub.broadcast(session.session_id, envelope)

        # Mock phản hồi INTERPRETER_STATUS
        status_envelope = make_envelope(
            event="INTERPRETER_STATUS",
            session_id=session.session_id,
            seq=0,
            source="server",
            payload={"status": "connecting", "estimated_wait_seconds": 30},
        )
        session.append_event(status_envelope)
        await hub.broadcast(session.session_id, status_envelope)
        return

    # 9. SESSION_RESET (nurse/server -> all)
    if event_type == "SESSION_RESET":
        if role not in ["nurse", "server", "doctor"]:
            err = make_error_envelope(
                session.session_id,
                session.current_seq,
                "FORBIDDEN_ROLE",
                "Bệnh nhân không có quyền xóa phiên khám",
            )
            await hub.send_to_role(session.session_id, role, err)
            return

        session.state_machine.on_session_reset()
        clear_vsl_motion_buffer()
        session.pending_question = None
        reset_payload = {
            "reason": payload.get("reason", "completed"),
            "wipe": True,
        }
        envelope = make_envelope(
            event="SESSION_RESET",
            session_id=session.session_id,
            seq=0,
            source="server",
            payload=reset_payload,
        )
        session.append_event(envelope)
        await hub.broadcast(session.session_id, envelope)

        # Đóng toàn bộ kết nối WebSocket và xóa sạch dữ liệu khỏi RAM
        await hub.close_session(session.session_id, code=1000)
        await session_service.reset_session(session.session_id)
        return

    # Lỗi không rõ event
    err = make_error_envelope(
        session.session_id,
        session.current_seq,
        "VALIDATION_ERROR",
        f"Event '{event_type}' không được hỗ trợ",
    )
    await hub.send_to_role(session.session_id, role, err)
