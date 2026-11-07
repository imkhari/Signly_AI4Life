# AI4Care

Trợ lý AI đa phương thức hỗ trợ giao tiếp y tế ban đầu tại quầy tiếp nhận/sàng lọc bệnh viện cho **người Điếc (VSL)** và **người khó khăn về lời nói** — dự án dự thi **AI4Life**.

> Hệ thống **không chẩn đoán, không kê đơn, không thay bác sĩ/phiên dịch viên**. Chỉ thu thập triệu chứng ban đầu → chuẩn hóa → tóm tắt an toàn → xác nhận 2 chiều → chuyển tiếp người thật khi không chắc chắn.

## Hướng dẫn chạy nhanh (Development & Demo)

### 1. Yêu cầu hệ thống
- Python 3.11+ (khuyên dùng Python 3.12)
- Node.js 20+ (hoặc Node.js 22+) & npm 10+
- `make`

### 2. Cài đặt môi trường
```bash
make setup
```
Lệnh trên sẽ tự động:
- Khởi tạo virtualenv tại `backend/.venv`, cài đặt FastAPI, Pydantic v2, Uvicorn, Pytest, Ruff, Mypy.
- Tự động sao chép `backend/.env.example` thành `backend/.env`.
- Cài đặt toàn bộ dependencies frontend trong `frontend/node_modules`.

### 3. Kiểm tra chất lượng (CI / Pre-commit)
```bash
make check
```
Chạy toàn bộ kiểm tra:
- **Backend**: `ruff check`, `mypy app tests`, `pytest`.
- **Frontend**: `eslint`, `tsc --noEmit`, `vitest`.

### 4. Khởi chạy ứng dụng
```bash
# Chạy cả backend (:8000) và frontend (:5173) đồng thời
make dev

# Hoặc chạy riêng lẻ từng service
make dev-backend     # Backend FastAPI: http://localhost:8000 (Swagger: /docs, Health: /api/health)
make dev-frontend    # Frontend Vite: http://localhost:5173

# Chạy chế độ Demo (Mock LLM, kịch bản mẫu)
make demo
```

## Cấu trúc thư mục Monorepo
```
AGENTS.md            # Điểm vào duy nhất cho mọi AI agent (CLAUDE.md, GEMINI.md… trỏ về đây)
Makefile             # Quản lý 4 lệnh cốt lõi: setup, dev, check, demo
backend/             # FastAPI backend (Clean Architecture)
  ├── app/           # api, application, domain, ai, infrastructure
  ├── tests/         # unit, safety, integration, contract
  └── pyproject.toml # Cấu hình dependencies, ruff, mypy, pytest
frontend/            # React + Vite + TypeScript + Tailwind CSS 3.4
  ├── src/           # features (patient, nurse), ui, hooks, state, services, i18n
  ├── tests/         # vitest unit tests
  └── e2e/           # playwright end-to-end tests
docs/                # Toàn bộ tài liệu thiết kế, API contract, Guardrails, kế hoạch 2 tuần
```

Chi tiết triển khai demo: `docs/DEPLOYMENT_GUIDE.md`.
