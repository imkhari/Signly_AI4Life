# 99 — PROGRESS LOG

> AI agent: đọc file này đầu mỗi phiên, **thêm mục mới ở đầu bảng** khi kết thúc phiên. Không xóa lịch sử.

## Trạng thái hiện tại
- Giai đoạn đang làm: **Sẵn sàng chuyển sang P3 (AI Orchestration) hoặc P5 (Frontend Foundation)**
- Phase đã DONE: **P0 (Kickoff & phỏng vấn)**, **P1 (Bootstrap monorepo)**, **P2 (Backend domain & Parser)**
- Blocker: **Không có**

## Nhật ký
| Ngày | Người/Agent | Phase | Việc đã làm | Việc tiếp theo | Ghi chú / vấn đề |
|---|---|---|---|---|---|
| 2026-11-07 | Tech Lead (Agent) | P2 | Hoàn thành Backend Domain: `models.py` (`null ≠ false`, severity 0..10), `events.py` (Envelope + 14 payload models), ontology JSON (11 lý do khám, 15 vùng cơ thể, 15 VSL gloss, tên thuốc) + `loader.py`, `rules_config.py`, `parser.py` (phủ 100% 13 quy tắc mâu thuẫn, completeness, red-flags), `state_machine.py`. Viết 31 unit tests đạt **99% test coverage** cho `domain/`. Mypy strict sạch 100%. | Bắt đầu Phase P3 (`P3-AI-ORCHESTRATION.md`) hoặc P5 (`P5-FRONTEND-FOUNDATION.md`) | DoD P2 đạt 100% |
| 2026-11-07 | Tech Lead (Agent) | P1 | Dựng xong khung Monorepo: Backend (FastAPI, pydantic v2, settings, health check test, ruff, mypy); Frontend (Vite, React 18, TS, Tailwind 3.4, `@fontsource/be-vietnam-pro`, Lucide, React Router, vitest); Makefile (setup, dev, check, demo); .gitignore; `.github/workflows/ci.yml`. Chạy `make check` xanh 100%. | Bắt đầu Phase P2 (`P2-BACKEND-DOMAIN.md`) | DoD P1 đạt 100% |
| 2026-11-07 | Tech Lead (Agent) | P0 | Hoàn tất đọc hiểu toàn bộ docs, phỏng vấn chốt toàn bộ 15 câu hỏi mở, cập nhật `OPEN-QUESTIONS.md`, `DECISIONS.md` (chốt D-001..D-013), đồng bộ tài liệu | Chờ lệnh bắt đầu Phase P1 (`P1-BOOTSTRAP.md`) | DoD của P0 đạt 100%, không còn blocker |
| 2026-11-07 | (bộ docs khởi tạo) | P0 | Tạo toàn bộ `docs/`, rules, skills | Chạy prompt `PROMPTS/P00-KICKOFF.md` | |
