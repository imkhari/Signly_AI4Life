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
| `/patient` | Kiosk Bệnh nhân | Wizard 4 bước (Chạm / gợi ý cử chỉ camera), BodyMap SVG 15 vùng, PainSlider 0–10, khai dị ứng, tóm tắt AI + TTS đọc kèm phụ đề, cấp STT lớn |
| `/nurse` | Bàn Điều dưỡng | Ghép mã 6 ký tự, Bảng đọc 2 vùng (chuyển xanh sau BN xác nhận), cảnh báo cờ đỏ khẩn nháy âm thanh, ack alert, gửi câu hỏi phụ, khóa duyệt STT, xuất phiếu bàn giao PDF không PII |
| `/demo` | Bảng Giám khảo | Dữ liệu mẫu trong tab bệnh nhân đã ghép, ép mẫu cố định, RTT /health. Tab điều dưỡng có quyền reset. |

## Chuyển đổi giữa Chế độ Demo (Mock) và Model Thật (Live Gemini)

AI4Care sử dụng kiến trúc Adapter (`LLMClient` Protocol). Mặc định hệ thống chạy chế độ `LLM_PROVIDER=mock` hoàn toàn offline.

Để kết nối Google Gemini thật:
1. Mở file `backend/.env`
2. Cập nhật:
   ```env
   LLM_PROVIDER=gemini
   GEMINI_API_KEY=AIzaSy... (điền API key của bạn)
   ```
3. Khởi động lại backend. Mọi cơ chế bảo vệ: ẩn danh PII, Post-LLM Validator (V1..V8), và Fallback Template 4s được kiểm tra qua bộ test an toàn. Kiểm tra payload trước khi dùng provider thật.

## Camera tùy chọn

Camera hiện dùng V2 learned translation trong môi trường riêng. MediaPipe lấy 411 tọa độ thân/mặt/hai tay tại trình duyệt rồi gửi qua LAN theo Q-23, không gửi video/lưu tọa độ phiên. Bắt đầu ký → Xong câu để nhận một gợi ý, bắt buộc Nhận → Áp dụng → xác nhận toàn phiếu; mức đau/thời gian dùng Chạm.

Máy hiện tại đã có runtime và checkpoint. Trên máy mới cần `make setup-v2`, đóng gói checkpoint do nhóm cung cấp theo [README V2](AI_model/vsl_v2/README.md), rồi `make check-v2`. Không cài torch vào backend. `GET /api/vsl/status` cho biết trạng thái V2; thiếu runtime trả UNKNOWN, không âm thầm dùng hình học.

Replay baseline300mẫu có256câu đúng,WER9,27%; sau guard mất vai có255/300câu đúng,WER9,50%,từ chối1clip. Đây là tập câu đóng của người cung cấp, không phải accuracy webcam/bệnh viện. Có hai mẫu sốt nhận nhầm. Camera vẫn thử nghiệm; danh mục 60 gloss không phải cam kết nhận đúng 60 ký hiệu.

Bản thi dùng Chạm + LLM mock. Xem [kịch bản](docs/PLANS/01-DEMO-SCRIPT.md) và [checklist](docs/DEPLOYMENT_GUIDE.md).

Thử kỹ thuật tại `/vsl-validation` sau `make prepare-vsl-validation`; hướng dẫn ở [protocol](docs/validation/vsl-v2/README.md). Pilot nhận1lượt vượt giới hạn chưa gọi API; bản mới có đếm ngược chờ thử lại, AI giữ CANDIDATE; không dùng test mô phỏng thành bằng chứng người thật.

### Kiểm thử

Chạy make check, rồi npm run build và npm run test:e2e trong frontend.
Playwright khởi chạy riêng backend mock :18080 và frontend :15173.
Biến SIGNLY_CHROMIUM_PATH cho phép chọn Chrome đã cài. Ảnh UI và trace nằm trong frontend/test-results/.
