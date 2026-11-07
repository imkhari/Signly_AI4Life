# P1 — BOOTSTRAP MONOREPO

**Mục tiêu**: khung dự án chạy được, công cụ chất lượng, CI.
**Đọc trước**: `AGENTS.md`, `05-TECH-STACK.md`, `08-ARCHITECTURE.md` §3–4–5, `DECISIONS.md`.
**Việc cần làm**
- `frontend/`: Vite + React + TypeScript; Tailwind v3.4; ESLint + Prettier; Vitest + Testing Library; cấu hình Playwright (chưa viết test); `@fontsource/be-vietnam-pro`; `lucide-react`; `react-router-dom`; router `/`, `/patient`, `/nurse` trang trống có tiêu đề.
- `backend/`: `pyproject.toml` (FastAPI, uvicorn[standard], pydantic v2, pydantic-settings, httpx; dev: pytest, pytest-asyncio, ruff, mypy); cây thư mục theo `08` §3 (file rỗng/`__init__.py`); `GET /api/health` trả `{status, llm_mode}`; `config.py` đọc `.env`.
- Gốc repo: `Makefile` (`setup`, `dev`, `check`, `demo`), `.gitignore`, `backend/.env.example`, `.github/workflows/ci.yml` (đã có, chỉnh cho khớp lệnh thực tế).
- Ghi phiên bản đã dùng vào `DECISIONS.md` (D-004) và chọn `uv` hay `pip`.
**Không làm**: không viết nghiệp vụ, không UI thật, không gọi LLM.
**DoD**: `make setup && make check` xanh trên máy sạch; `make dev` chạy cả hai; `/api/health` trả 200; CI xanh; README cập nhật cách chạy.

## PROMPT
```text
Thực hiện Phase P1 (Bootstrap monorepo) cho AI4Care.
Đọc trước: AGENTS.md, docs/05-TECH-STACK.md, docs/08-ARCHITECTURE.md (mục 3, 4, 5), docs/DECISIONS.md, docs/99-PROGRESS-LOG.md, docs/OPEN-QUESTIONS.md.

Việc cần làm: dựng frontend (Vite+React+TS+Tailwind 3.4+ESLint/Prettier+Vitest+Playwright config, font Be Vietnam Pro self-host, lucide-react, react-router với /, /patient, /nurse), backend (FastAPI, pydantic v2, pytest, ruff, mypy, cây thư mục theo docs/08 mục 3, GET /api/health, config.py), Makefile (setup/dev/check/demo), .gitignore, backend/.env.example, và chỉnh .github/workflows/ci.yml cho đúng lệnh thật.

Ràng buộc: không viết nghiệp vụ, không gọi LLM, không thêm dependency ngoài docs/05. Bắt đầu bằng kế hoạch ≤ 10 dòng. Nếu một quyết định (uv hay pip, phiên bản) chưa rõ, hãy chọn phương án đề xuất, ghi vào docs/DECISIONS.md và báo tôi.

Hoàn thành khi: make setup && make check xanh; make dev chạy cả hai server; /api/health trả 200; CI định nghĩa đúng. Cuối cùng cập nhật docs/99-PROGRESS-LOG.md và tóm tắt những gì đã làm + việc tiếp theo.
```
