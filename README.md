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

## Các Màn Hình & Tính Năng Trọng Tâm

| Route | Vai trò | Chức năng chính |
|---|---|---|
| `/` | Trang chủ / Trợ năng | Chọn vai trò, công tắc chữ lớn (A+), tương phản cao (◐), nút gọi nhân viên khẩn |
| `/patient` | Kiosk Bệnh nhân | Wizard 4 bước (Touch / Chữ / Ký hiệu VSL), BodyMap SVG 15 vùng, PainSlider 0–10, khai dị ứng, tóm tắt AI + TTS đọc kèm phụ đề, cấp STT lớn |
| `/nurse` | Bàn Điều dưỡng | Ghép mã 6 ký tự, Bảng đọc 2 vùng (chuyển xanh sau BN xác nhận), cảnh báo cờ đỏ khẩn nháy âm thanh, ack alert, gửi câu hỏi phụ, khóa duyệt STT, xuất phiếu bàn giao PDF không PII |
| `/demo` | Bảng Giám khảo | Nạp kịch bản cấp cứu đau ngực, mâu thuẫn dị ứng, ép lỗi LLM Fallback, đo độ trễ LAN (<20ms), nút reset 1 chạm |

## Chuyển đổi giữa Chế độ Demo (Mock) và Model Thật (Live Gemini)

AI4Care sử dụng kiến trúc Adapter (`LLMClient` Protocol). Mặc định hệ thống chạy chế độ `LLM_PROVIDER=mock` hoàn toàn offline.

Để kết nối Google Gemini thật:
1. Mở file `backend/.env`
2. Cập nhật:
   ```env
   LLM_PROVIDER=gemini
   GEMINI_API_KEY=AIzaSy... (điền API key của bạn)
   ```
3. Khởi động lại backend. Mọi cơ chế bảo vệ: ẩn danh PII, Post-LLM Validator (V1..V8), và Fallback Template 4s vẫn tự động hoạt động bảo vệ 100%.

## Động cơ Nhận diện Ký hiệu Ngôn ngữ (VSL Recognition Engine)

AI4Care tích hợp module nhận dạng ngôn ngữ ký hiệu chuyên biệt cho y tế ban đầu:
- **MVP Edge Engine (Mặc định)**: Sử dụng động cơ Hình học Không gian 3D & Chuỗi chuyển động 16-frame tối ưu cho Edge (<1ms độ trễ), nhận diện 35 từ vựng/cử chỉ y tế thiết yếu.
- **Bộ lọc ổn định cử chỉ (Anti-false-positive)**: Yêu cầu bệnh nhân giữ cử chỉ ổn định tối thiểu $\ge 0.8$ giây và độ tin cậy $\ge 70\%$, hiển thị thanh tiến trình trực quan trước khi đưa vào danh sách chờ. Bệnh nhân luôn phải chủ động bấm "Nhận" (✓) để xác nhận vào hồ sơ.
- **Kiến trúc PyTorch Server Tier**: Backend tích hợp sẵn module tải trọng số PyTorch Deep Learning (VTN Checkpoint 208MB). Nếu môi trường server không cài PyTorch nặng, hệ thống tự động fallback mượt mà sang động cơ hình học 3D mà không gây gián đoạn.
- **Demo 2 thiết bị qua HTTPS mạng LAN**:
  ```bash
  make demo-https   # Frontend bật HTTPS tự ký, cho phép truy cập camera từ iPad/Tablet qua mạng LAN
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
