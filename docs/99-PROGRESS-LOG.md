# 99 — PROGRESS LOG

> AI agent: đọc file này đầu mỗi phiên, **thêm mục mới ở đầu bảng** khi kết thúc phiên. Không xóa lịch sử.

## Trạng thái hiện tại
- Giai đoạn đang làm: **Sẵn sàng chuyển sang P5 (Frontend Foundation)**
- Phase đã DONE: **P0 (Kickoff & phỏng vấn)**, **P1 (Bootstrap monorepo)**, **P2 (Backend domain & Parser)**, **P3 (AI Orchestration & Safety Guardrails)**, **P4 (Realtime WebSocket & Session REST)**
- Blocker: **Không có**

## Nhật ký
| Ngày | Người/Agent | Phase | Việc đã làm | Việc tiếp theo | Ghi chú / vấn đề |
|---|---|---|---|---|---|
| 2026-11-07 | Tech Lead (Agent) | P4 | Hoàn thành Realtime Hub & Session REST: `session_store_memory.py` (RAM singleton, pairing code 6 ký tự TTL 10m, buffer 100 events), `session_service.py`, REST endpoints (`POST /api/sessions`, `POST /api/sessions/join`, `GET /api/ontology`, `POST /api/dev/force-fallback`), WebSocket Hub (`/ws/{session_id}` 1 client/role, replay qua `last_seq`, heartbeat PING/PONG), WebSocket Handlers (11 event types: `INPUT_UPDATED`, `SUMMARY_REQUESTED`, `SUMMARY_READY`, `PATIENT_CONFIRMED`, `NURSE_QUESTION`, `NURSE_VERIFIED`, `RECORD_EXPORTED`, `REQUEST_INTERPRETER`, `INTERPRETER_STATUS`, `SESSION_RESET`), phân quyền role và guardrails y tế. Viết 11 integration tests phủ toàn bộ luồng happy path 2 websockets, role authorization, replay, RAM wipe, privacy logging không lộ PII. `make check` xanh 100%. | Bắt đầu Phase P5 (`P5-FRONTEND-FOUNDATION.md`) | DoD P4 đạt 100% |
| 2026-11-07 | Tech Lead (Agent) | P3 | Hoàn thành AI Orchestration: `LLMClient` Protocol, `MockLLMClient` (5 chế độ), `GeminiClient` (httpx), `redaction.py` (che SĐT, CCCD, Email), `validator.py` (V1..V8 chặn chẩn đoán, kê đơn, trấn an, bịa dữ kiện), `fallback_template.py`, `orchestrator.py` (fail-safe timeout 4s). Viết bộ test an toàn (35 câu độc hại bị chặn, 16 câu hợp lệ qua, test fallback). Test coverage `domain/` + `ai/` đạt **98%**. | Bắt đầu Phase P4 (`P4-REALTIME.md`) hoặc P5 (`P5-FRONTEND-FOUNDATION.md`) | DoD P3 đạt 100% |
| 2026-11-07 | Tech Lead (Agent) | P2 | Hoàn thành Backend Domain: `models.py` (`null ≠ false`, severity 0..10), `events.py` (Envelope + 14 payload models), ontology JSON (11 lý do khám, 15 vùng cơ thể, 15 VSL gloss, tên thuốc) + `loader.py`, `rules_config.py`, `parser.py` (phủ 100% 13 quy tắc mâu thuẫn, completeness, red-flags), `state_machine.py`. Viết 31 unit tests đạt **99% test coverage** cho `domain/`. Mypy strict sạch 100%. | Bắt đầu Phase P3 (`P3-AI-ORCHESTRATION.md`) | DoD P2 đạt 100% |
| 2026-11-07 | Tech Lead (Agent) | P1 | Dựng xong khung Monorepo: Backend (FastAPI, pydantic v2, settings, health check test, ruff, mypy); Frontend (Vite, React 18, TS, Tailwind 3.4, `@fontsource/be-vietnam-pro`, Lucide, React Router, vitest); Makefile (setup, dev, check, demo); .gitignore; `.github/workflows/ci.yml`. Chạy `make check` xanh 100%. | Bắt đầu Phase P2 (`P2-BACKEND-DOMAIN.md`) | DoD P1 đạt 100% |
| 2026-11-07 | Tech Lead (Agent) | P0 | Hoàn tất đọc hiểu toàn bộ docs, phỏng vấn chốt toàn bộ 15 câu hỏi mở, cập nhật `OPEN-QUESTIONS.md`, `DECISIONS.md` (chốt D-001..D-013), đồng bộ tài liệu | Chờ lệnh bắt đầu Phase P1 (`P1-BOOTSTRAP.md`) | DoD của P0 đạt 100%, không còn blocker |
| 2026-11-07 | (bộ docs khởi tạo) | P0 | Tạo toàn bộ `docs/`, rules, skills | Chạy prompt `PROMPTS/P00-KICKOFF.md` | |
