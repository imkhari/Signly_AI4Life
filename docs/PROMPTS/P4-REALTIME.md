# P4 — REALTIME: WEBSOCKET HUB + SESSION + REST

**Mục tiêu**: đồng bộ thời gian thực giữa `/patient`, `/nurse` (và `/doctor` nếu Q-03), xóa dữ liệu theo phiên.
**Đọc trước**: `02-API-CONTRACT.md` (toàn bộ), `08-ARCHITECTURE.md` §1–3, `07` §5, skill `add-ws-event`.
**Việc cần làm**
- `infrastructure/session_store_memory.py` (RAM, khóa theo `session_id`), `application/session_service.py` (tạo, ghép bằng pairing code hết hạn 10 phút, state machine, idle 10 phút → reset).
- `api/rest/`: `POST /api/sessions`, `POST /api/sessions/join`, `GET /api/ontology`, `/api/health`, `/api/dev/force-fallback` (chỉ `ENV=demo`).
- `api/ws/hub.py`: kết nối theo role, một kết nối mỗi role, broadcast, `seq`, buffer 100 event để replay theo `last_seq`, heartbeat PING/PONG, token phiên.
- `api/ws/handlers.py`: xử lý `INPUT_UPDATED` (parser → broadcast frame+alerts), `SUMMARY_REQUESTED` (orchestrator → `SUMMARY_READY`), `PATIENT_CONFIRMED`, `NURSE_QUESTION`, `NURSE_VERIFIED` (chỉ khi đã `patient_confirmed`), `REQUEST_INTERPRETER` (+ `INTERPRETER_STATUS` mock), `RECORD_EXPORTED` (nếu Q-03), `SESSION_RESET` (xóa RAM + đóng WS).
- Phân quyền theo role (ví dụ chỉ nurse gửi `NURSE_VERIFIED`).
- Tests tích hợp bằng `TestClient` với hai WebSocket: toàn bộ luồng happy path, reconnect/replay, role sai, idle wipe, đảm bảo log không chứa payload.
**Không làm**: không DB, không ghi đĩa, không auth tài khoản.
**DoD**: test tích hợp xanh; sau `SESSION_RESET` mọi truy cập session trả `SESSION_NOT_FOUND`; payload khớp 100% `docs/02`.

## PROMPT
```text
Thực hiện Phase P4 (Realtime) cho AI4Care. Điều kiện: P2 DONE (P3 nên xong hoặc dùng MockLLM).
Đọc trước: AGENTS.md, docs/02-API-CONTRACT.md (toàn bộ), docs/08-ARCHITECTURE.md, docs/07-SAFETY-GUARDRAILS.md (mục 5), .claude/skills/add-ws-event/SKILL.md, docs/OPEN-QUESTIONS.md (Q-03, Q-06).

Cài đặt session store trong RAM, SessionService (tạo/ghép phiên bằng pairing code 6 ký tự, idle 10 phút, wipe), REST sessions/join/ontology/health/dev-force-fallback, WebSocket hub (một kết nối mỗi role, seq, replay theo last_seq, heartbeat), và handlers cho mọi event trong docs/02 (INPUT_UPDATED, SUMMARY_REQUESTED, SUMMARY_READY, PATIENT_CONFIRMED, NURSE_QUESTION, NURSE_VERIFIED, REQUEST_INTERPRETER, INTERPRETER_STATUS, SESSION_RESET; RECORD_EXPORTED chỉ khi Q-03 ANSWERED là có).
Viết test tích hợp với hai WebSocket client cho toàn bộ luồng, phân quyền role, reconnect/replay, idle wipe.

Ràng buộc: payload phải khớp chính xác docs/02; nếu cần thay đổi contract thì DỪNG, đề xuất thay đổi và hỏi tôi. Không ghi nội dung bệnh nhân vào log. Bắt đầu bằng kế hoạch ≤ 10 dòng. Hoàn thành khi test tích hợp xanh và make check xanh; cập nhật docs/99-PROGRESS-LOG.md.
```
