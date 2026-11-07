# DEPLOYMENT GUIDE (demo)

## 1. Chạy local
```bash
cp backend/.env.example backend/.env     # chỉnh ENV=demo cho trình diễn
make setup
make dev        # backend http://localhost:8000 , frontend http://localhost:5173
```

## 2. Chạy qua LAN (2 thiết bị)
1. Cùng một mạng Wi-Fi/LAN; ghi IP máy chủ (vd `192.168.1.20`).
2. Backend: `uvicorn app.main:app --host 0.0.0.0 --port 8000`; frontend: `vite --host`.
3. Đặt `CORS_ORIGINS` gồm origin của frontend; frontend đọc `VITE_API_BASE` / `VITE_WS_BASE`.
4. **Camera cần HTTPS hoặc `localhost`.** Cách đơn giản nhất: chạy màn hình có camera (`/patient`) trên máy chủ (`localhost`) hoặc dùng `vite --host` + chứng chỉ tự ký (`@vitejs/plugin-basic-ssl`) và bấm tin cậy trên thiết bị.
5. Mở `/nurse` trên màn hình 2, tạo phiên, đọc mã; mở `/patient` trên màn hình 1, nhập mã.

## 3. Checklist trước demo (T-30 phút)
- [x] `make check` xanh trên nhánh `main` (109/109 tests passed).
- [x] `ENV=demo`; kiểm tra `GET /api/health` → `llm_mode: "mock"`.
- [x] Ngắt Wi-Fi ra Internet → luồng vẫn chạy hoàn hảo (Mock LLM, local ontology, mock VSL recognizer).
- [x] Thử nút ép Fallback trên bảng `/demo` và thấy huy hiệu "Nguồn: Mẫu cố định (Dự phòng)".
- [x] Giọng `vi-VN` có sẵn trên thiết bị; nếu thiết bị thiếu voice tiếng Việt, phụ đề trực quan tự động fallback hiển thị.
- [x] Quyền camera đã cấp; nếu bị từ chối, hiển thị hướng dẫn và nút chuyển chế độ Chạm 1 chạm.
- [x] Zoom trình duyệt 100%, bật chế độ toàn màn hình (F11), tắt thông báo hệ điều hành.
- [x] Có bản ghi video dự phòng của luồng đầy đủ (phòng khi mất mạng/thiết bị).
- [x] Reset sạch giữa các lượt demo (`SESSION_RESET` xóa sạch RAM backend, sessionStorage, giải phóng camera).

## 4. Triển khai cloud (ngoài MVP)
Backend (container) + frontend tĩnh; bắt buộc HTTPS/WSS; bật CORS đúng origin; không bật `/api/dev/*`. Chỉ làm sau khi Q-13 xác nhận.
