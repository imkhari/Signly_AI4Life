import logging
from typing import Any

import pytest
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

from app.main import app

client = TestClient(app)


def _setup_session() -> tuple[str, str, str, str]:
    """Helper tạo phiên và lấy (session_id, pairing_code, token_nurse, token_patient)."""
    create_res = client.post("/api/sessions")
    assert create_res.status_code == 201
    c_data = create_res.json()
    session_id = c_data["session_id"]
    pairing_code = c_data["pairing_code"]
    token_nurse = c_data["token_nurse"]

    join_res = client.post("/api/sessions/join", json={"pairing_code": pairing_code})
    assert join_res.status_code == 200
    token_patient = join_res.json()["token_patient"]

    return session_id, pairing_code, token_nurse, token_patient


def test_ws_full_happy_path_and_ram_wipe() -> None:
    session_id, pairing_code, token_nurse, token_patient = _setup_session()

    # 1. Nurse connects
    with client.websocket_connect(f"/ws/{session_id}?role=nurse&token={token_nurse}") as ws_nurse:
        # Nurse receives SESSION_JOINED (nurse)
        ev = ws_nurse.receive_json()
        assert ev["event"] == "SESSION_JOINED"
        assert ev["payload"]["role"] == "nurse"

        # 2. Patient connects
        with client.websocket_connect(
            f"/ws/{session_id}?role=patient&token={token_patient}"
        ) as ws_patient:
            # Patient receives SESSION_JOINED (patient)
            ev_pat = ws_patient.receive_json()
            assert ev_pat["event"] == "SESSION_JOINED"
            assert ev_pat["payload"]["role"] == "patient"

            # Nurse also receives SESSION_JOINED (patient)
            ev_nurse_see_pat = ws_nurse.receive_json()
            assert ev_nurse_see_pat["event"] == "SESSION_JOINED"
            assert ev_nurse_see_pat["payload"]["role"] == "patient"

            # 3. Patient sends INPUT_UPDATED
            input_patch: dict[str, Any] = {
                "step": "pain_details",
                "modality": "touch",
                "patch": {
                    "chief_complaint": {"code": "PAIN", "free_text": None},
                    "pain": {
                        "present": True,
                        "severity": 7,
                        "body_regions": ["CHEST"],
                        "onset": {"value": 2, "unit": "hour"},
                    },
                    "allergy": {"has_allergy": False},
                },
            }
            ws_patient.send_json({"event": "INPUT_UPDATED", "payload": input_patch})

            # Both receive INPUT_UPDATED
            ev_pat_input = ws_patient.receive_json()
            assert ev_pat_input["event"] == "INPUT_UPDATED"
            assert ev_pat_input["payload"]["completeness"] == 1.0
            assert ev_pat_input["payload"]["frame"]["pain"]["severity"] == 7

            ev_nurse_input = ws_nurse.receive_json()
            assert ev_nurse_input["event"] == "INPUT_UPDATED"
            assert ev_nurse_input["payload"]["completeness"] == 1.0

            # 4. Patient sends SUMMARY_REQUESTED
            ws_patient.send_json(
                {
                    "event": "SUMMARY_REQUESTED",
                    "payload": {"language": "vi", "reading_level": "simple"},
                }
            )

            # Both receive SUMMARY_READY
            ev_pat_summary = ws_patient.receive_json()
            assert ev_pat_summary["event"] == "SUMMARY_READY"
            assert ev_pat_summary["payload"]["validator"]["passed"] is True
            assert "nl_text_vi" in ev_pat_summary["payload"]

            ev_nurse_summary = ws_nurse.receive_json()
            assert ev_nurse_summary["event"] == "SUMMARY_READY"

            # 5. Patient sends PATIENT_CONFIRMED
            ws_patient.send_json(
                {
                    "event": "PATIENT_CONFIRMED",
                    "payload": {
                        "decision": "confirmed",
                        "corrections": [],
                        "confirmed_fields": ["chief_complaint", "pain", "allergy"],
                    },
                }
            )

            ev_pat_conf = ws_patient.receive_json()
            assert ev_pat_conf["event"] == "PATIENT_CONFIRMED"
            ev_nurse_conf = ws_nurse.receive_json()
            assert ev_nurse_conf["event"] == "PATIENT_CONFIRMED"

            # 6. Nurse sends NURSE_VERIFIED
            ws_nurse.send_json(
                {
                    "event": "NURSE_VERIFIED",
                    "payload": {
                        "intake_code": "AC-0042",
                        "queue_number": 42,
                        "verified_by": "nurse-station-1",
                        "acknowledged_alerts": [],
                    },
                }
            )

            ev_pat_ver = ws_patient.receive_json()
            assert ev_pat_ver["event"] == "NURSE_VERIFIED"
            assert ev_pat_ver["payload"]["queue_number"] == 42
            ev_nurse_ver = ws_nurse.receive_json()
            assert ev_nurse_ver["event"] == "NURSE_VERIFIED"

            # 7. Nurse sends RECORD_EXPORTED
            ws_nurse.send_json(
                {
                    "event": "RECORD_EXPORTED",
                    "payload": {
                        "format": "pdf",
                        "include": ["queue_number", "intake_code"],
                        "target": "doctor",
                    },
                }
            )
            assert ws_patient.receive_json()["event"] == "RECORD_EXPORTED"
            assert ws_nurse.receive_json()["event"] == "RECORD_EXPORTED"

            # 8. Nurse sends SESSION_RESET
            ws_nurse.send_json(
                {
                    "event": "SESSION_RESET",
                    "payload": {"reason": "completed", "wipe": True},
                }
            )
            ev_pat_reset = ws_patient.receive_json()
            assert ev_pat_reset["event"] == "SESSION_RESET"
            assert ev_pat_reset["payload"]["wipe"] is True

            ev_nurse_reset = ws_nurse.receive_json()
            assert ev_nurse_reset["event"] == "SESSION_RESET"

    # 9. Verify RAM wipe (Không lưu lâu dài)
    res_join = client.post("/api/sessions/join", json={"pairing_code": pairing_code})
    assert res_join.status_code == 404
    assert res_join.json()["detail"]["code"] == "SESSION_NOT_FOUND"


def test_ws_role_authorization_and_safety_checks() -> None:
    session_id, _, token_nurse, token_patient = _setup_session()

    with client.websocket_connect(f"/ws/{session_id}?role=nurse&token={token_nurse}") as ws_nurse:
        _ = ws_nurse.receive_json()  # SESSION_JOINED

        with client.websocket_connect(
            f"/ws/{session_id}?role=patient&token={token_patient}"
        ) as ws_patient:
            _ = ws_patient.receive_json()  # SESSION_JOINED
            _ = ws_nurse.receive_json()  # SESSION_JOINED

            # Check 1: Patient tries NURSE_VERIFIED -> Error FORBIDDEN_ROLE
            ws_patient.send_json(
                {
                    "event": "NURSE_VERIFIED",
                    "payload": {
                        "intake_code": "AC-99",
                        "queue_number": 99,
                        "verified_by": "hacker",
                    },
                }
            )
            err_pat = ws_patient.receive_json()
            assert err_pat["event"] == "ERROR"
            assert err_pat["payload"]["code"] == "FORBIDDEN_ROLE"

            # Check 2: Patient tries SESSION_RESET -> Error FORBIDDEN_ROLE
            ws_patient.send_json({"event": "SESSION_RESET", "payload": {}})
            err_pat2 = ws_patient.receive_json()
            assert err_pat2["event"] == "ERROR"
            assert err_pat2["payload"]["code"] == "FORBIDDEN_ROLE"

            # Check 3: Nurse tries to verify BEFORE patient confirms -> Error VALIDATION_ERROR
            ws_nurse.send_json(
                {
                    "event": "NURSE_VERIFIED",
                    "payload": {
                        "intake_code": "AC-01",
                        "queue_number": 1,
                        "verified_by": "nurse-1",
                    },
                }
            )
            err_nurse = ws_nurse.receive_json()
            assert err_nurse["event"] == "ERROR"
            assert err_nurse["payload"]["code"] == "VALIDATION_ERROR"


def test_ws_heartbeat_ping_pong() -> None:
    session_id, _, token_nurse, _ = _setup_session()

    with client.websocket_connect(f"/ws/{session_id}?role=nurse&token={token_nurse}") as ws:
        _ = ws.receive_json()  # SESSION_JOINED
        ws.send_json({"event": "PING"})
        pong = ws.receive_json()
        assert pong["event"] == "PONG"


def test_ws_interpreter_request_and_status() -> None:
    session_id, _, token_nurse, token_patient = _setup_session()

    with client.websocket_connect(
        f"/ws/{session_id}?role=patient&token={token_patient}"
    ) as ws_patient:
        _ = ws_patient.receive_json()  # SESSION_JOINED

        ws_patient.send_json(
            {
                "event": "REQUEST_INTERPRETER",
                "payload": {
                    "reason": "low_confidence",
                    "requested_by": "patient",
                    "urgency": "urgent",
                    "language": "VSL",
                },
            }
        )

        ev_req = ws_patient.receive_json()
        assert ev_req["event"] == "REQUEST_INTERPRETER"
        assert ev_req["payload"]["urgency"] == "urgent"

        ev_status = ws_patient.receive_json()
        assert ev_status["event"] == "INTERPRETER_STATUS"
        assert ev_status["payload"]["status"] == "connecting"


def test_ws_reconnect_replay_missed_events() -> None:
    session_id, _, token_nurse, token_patient = _setup_session()

    with client.websocket_connect(f"/ws/{session_id}?role=nurse&token={token_nurse}") as ws_nurse:
        _ = ws_nurse.receive_json()  # seq 1 (SESSION_JOINED)

        # Nurse sends NURSE_QUESTION
        ws_nurse.send_json(
            {
                "event": "NURSE_QUESTION",
                "payload": {
                    "question_id": "q1",
                    "template_code": "ASK_DRUG",
                    "text_vi": "Bạn có dị ứng thuốc không?",
                },
            }
        )
        _ = ws_nurse.receive_json()  # seq 2 (NURSE_QUESTION)

        # Now patient connects with last_seq=1 -> must replay seq 2
        with client.websocket_connect(
            f"/ws/{session_id}?role=patient&token={token_patient}&last_seq=1"
        ) as ws_patient:
            replayed = ws_patient.receive_json()
            assert replayed["event"] == "NURSE_QUESTION"
            assert replayed["seq"] == 2


def test_ws_invalid_token_rejected() -> None:
    session_id, _, _, _ = _setup_session()
    with pytest.raises(WebSocketDisconnect) as exc_info:
        with client.websocket_connect(f"/ws/{session_id}?role=patient&token=WRONG_TOKEN"):
            pass
    assert exc_info.value.code == 4003


def test_ws_privacy_logging_no_pii(caplog: pytest.LogCaptureFixture) -> None:
    caplog.set_level(logging.INFO, logger="ai4care.ws")
    session_id, _, _, token_patient = _setup_session()

    sensitive_text = "Tôi tên Nguyễn Văn A số điện thoại 0912345678"
    with client.websocket_connect(f"/ws/{session_id}?role=patient&token={token_patient}") as ws:
        _ = ws.receive_json()
        ws.send_json(
            {
                "event": "INPUT_UPDATED",
                "payload": {
                    "step": "chief_complaint",
                    "patch": {"chief_complaint": {"code": "OTHER", "free_text": sensitive_text}},
                },
            }
        )
        _ = ws.receive_json()

    # Verify log does NOT contain sensitive patient PII
    for record in caplog.records:
        assert "0912345678" not in record.message
        assert "Nguyễn Văn A" not in record.message
