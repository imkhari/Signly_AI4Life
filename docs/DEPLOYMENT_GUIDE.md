# HƯỚNG DẪN TRIỂN KHAI & DEMO QUA MẠNG LAN (AI4Care)

Tài liệu hướng dẫn cấu hình và vận hành hệ thống AI4Care trong môi trường trình diễn thực tế (Demo Day), hỗ trợ mô hình 2 thiết bị độc lập (Kiosk Bệnh nhân trên iPad/Máy tính bảng và Màn hình Điều dưỡng trên Laptop) kết nối qua mạng cục bộ (LAN/Wi-Fi).

---

## 1. Nguyên tắc cốt lõi (Privacy & Local First)

1. **Quyền riêng tư tuyệt đối (Privacy-by-Design)**: Không dùng các dịch vụ tunnel công cộng (như ngrok, cloudflared) làm luồng mặc định để tránh truyền dữ liệu hay hình ảnh ra máy chủ bên ngoài. Mọi giao tiếp diễn ra 100% trong mạng LAN nội bộ.
2. **Quy định Camera trên trình duyệt**: Các trình duyệt hiện đại (Chrome, Safari, Edge) chỉ cho phép API `navigator.mediaDevices.getUserMedia` hoạt động trên `localhost` hoặc kết nối bảo mật **HTTPS**. Khi mở ứng dụng từ thiết bị di động (iPad/Tablet) qua IP mạng LAN, **bắt buộc phải bật HTTPS local**.
3. **Mô hình AI Hybrid (VSL Engine)**:
   - Mặc định MVP: Chạy Động cơ Nhận diện Hình học Không gian 3D & Chuỗi chuyển động 16-frame tối ưu hoá cho Edge (<1ms độ trễ), nhận diện 35 từ vựng/cử chỉ y tế.
   - Server Tier: Sẵn sàng tải trọng số PyTorch Deep Learning (VTN Checkpoint 208MB) khi môi trường server có cài đặt `torch`.

---

## 2. Cách chạy Demo Local & Demo HTTPS qua LAN

### Cách 1: Chạy 1 máy tính cục bộ (Localhost)
Phù hợp khi test nhanh trên máy tính phát triển:
```bash
make setup      # Cài dependencies backend & frontend
make dev        # Backend :8000 (HTTP) và Frontend :5173 (HTTP)
```
- Mở bệnh nhân: `http://localhost:5173/patient`
- Mở điều dưỡng: `http://localhost:5173/nurse`

---

### Cách 2: Chạy 2 thiết bị qua mạng LAN bằng HTTPS (Kịch bản Demo chính)
Sử dụng 1 máy tính làm Server điều phối (Laptop) và 1 iPad/Tablet làm Kiosk Bệnh nhân.

#### Bước 1: Lấy địa chỉ IP mạng LAN của máy chủ
- **Trên macOS**:
  ```bash
  ipconfig getifaddr en0
  # hoặc nếu dùng Wi-Fi phụ:
  ipconfig getifaddr en1
  # Ví dụ output: 192.168.1.15
  ```
- **Trên Linux**: `hostname -I | awk '{print $1}'`
- **Trên Windows**: `ipconfig` (tìm dòng IPv4 Address của Wireless LAN)

#### Bước 2: Cấu hình file môi trường backend
Mở `backend/.env` (hoặc tạo từ `backend/.env.example`):
```env
ENV=demo
HOST=0.0.0.0
PORT=8000
CORS_ORIGINS=["http://localhost:5173","https://localhost:5173","https://192.168.1.15:5173"]
```
*(Thay `192.168.1.15` bằng IP thực tế của máy chủ)*.

#### Bước 3: Khởi chạy Backend & Frontend HTTPS
Chạy lệnh demo HTTPS tích hợp sẵn:
```bash
# Terminal 1: Chạy Backend lắng nghe toàn mạng LAN
make dev-backend

# Terminal 2: Chạy Frontend hỗ trợ HTTPS tự ký (qua @vitejs/plugin-basic-ssl)
cd frontend && npm run dev:https
# Hoặc dùng make target:
make demo-https
```
Terminal sẽ hiển thị đường dẫn truy cập mạng LAN:
```
➜  Local:   https://localhost:5173/
➜  Network: https://192.168.1.15:5173/
```

#### Bước 4: Mở trên thiết bị Bệnh nhân (iPad/Tablet)
1. Kết nối iPad vào **cùng mạng Wi-Fi** với máy chủ.
2. Mở trình duyệt Safari hoặc Chrome trên iPad, truy cập:
   `https://192.168.1.15:5173/patient`
3. **Xử lý cảnh báo chứng chỉ tự ký (Self-signed Certificate)**:
   - Trên **Chrome**: Bấm **Nâng cao (Advanced)** ➔ Bấm **Tiếp tục truy cập 192.168.1.15 (không an toàn)**.
   - Trên **Safari (iOS)**: Bấm **Hiển thị chi tiết (Show Details)** ➔ Bấm **truy cập trang web này (visit this website)** ➔ Bấm xác nhận **Truy cập trang web**.
4. **Cấp quyền Camera**:
   - Trình duyệt sẽ hiện popup: *"https://192.168.1.15:5173 muốn sử dụng Camera của bạn"*.
   - Bấm **Cho phép (Allow)**.
   - Màn hình camera VSL sẽ xuất hiện cùng khung xương ngón tay MediaPipe được xử lý hoàn toàn trên thiết bị (Offline 100%).

#### Bước 5: Mở trên màn hình Điều dưỡng (Laptop/PC)
1. Mở tab mới trên máy chủ: `https://localhost:5173/nurse` (hoặc `http://localhost:5173/nurse`).
2. Nhấn nút **Tạo phiên mới** (hoặc nhận mã ghép Kiosk tự động).
3. Nhập mã Kiosk vào iPad hoặc xác nhận phiên để bắt đầu đồng bộ thời gian thực qua WebSocket.

---

## 3. Cơ chế dự phòng khi lỗi mạng hoặc lỗi Camera (Fallback Strategy)

| Tình huống sự cố | Cách hệ thống tự động xử lý | Thao tác của người thuyết trình |
|---|---|---|
| **iPad không cấp được quyền Camera** (hoặc camera bị hỏng) | Giao diện hiện banner cảnh báo rõ ràng và hiển thị nút lớn **"Chuyển sang Chạm"**. | Bấm **"Chuyển sang Chạm"** ➔ Tiếp tục khai báo bằng Chạm màn hình (Body Map + Trắc nghiệm) mà không gián đoạn demo. |
| **Chứng chỉ HTTPS bị chặn bởi chính sách MDM của công ty** | Chạy màn hình `/patient` ngay trên chính máy chủ Laptop qua `https://localhost:5173/patient` (localhost được trình duyệt miễn trừ HTTPS). | Thao tác camera trực tiếp trên webcam máy chủ. |
| **Mất kết nối WebSocket tới Backend** | Frontend tự động chuyển sang chế độ lưu trữ cục bộ (`sessionStorage`), hiển thị badge "Chờ Kiosk kết nối" và nút "Thử lại". | Bấm "Thử lại" hoặc kiểm tra backend terminal. |
| **Mất kết nối Internet** | Toàn bộ mô hình Mock LLM, Ontology y tế cục bộ và MediaPipe WASM nội bộ (`public/wasm`) tiếp tục hoạt động bình thường 100% offline. | Không cần làm gì, hệ thống được thiết kế Offline-first. |

---

## 4. Kiểm tra sức khỏe hệ thống (Health Check API)

Hệ thống cung cấp endpoint chuyên dụng để kiểm tra trạng thái engine VSL:
```bash
curl -X GET http://localhost:8000/api/vsl/status
```
Phản hồi mẫu:
```json
{
  "status": "ready",
  "has_torch": false,
  "is_model_loaded": false,
  "model_source": "heuristic",
  "active_engine": "3D_Spatial_Geometry_16Frame",
  "checkpoint_path": ".../AI_model/weights/vsl_model.pt",
  "checkpoint_exists": true,
  "checkpoint_size_mb": 208.57,
  "supported_gestures_count": 35,
  "latency_ms_benchmark": 0.06,
  "note": "MVP uses high-precision edge 3D geometry engine (<1ms). PyTorch checkpoint (208MB) is optional for server tier."
}
```

---

## 5. Checklist kiểm tra trước giờ Demo (T-30 phút)

- [x] Chạy `make check` xanh hoàn toàn (100% test backend & frontend passed, 0 error, 0 warning).
- [x] Chạy `npm run build` trong `frontend/` thành công.
- [x] Kiểm tra IP mạng LAN bằng `ipconfig getifaddr en0`.
- [x] Chạy thử `npm run dev:https` trên máy chủ và truy cập thử từ iPad/điện thoại qua HTTPS.
- [x] Xác nhận quyền Camera được cấp trên iPad; kiểm tra khung xương bàn tay MediaPipe hiển thị mượt mà.
- [x] Thử nghiệm bộ lọc ổn định cử chỉ: Giữ tay yên trước camera $\ge 0.8$s để xuất hiện candidate và thanh tiến trình giữ cử chỉ.
- [x] Bấm nút **"Chuyển sang Chạm"** để kiểm tra tính năng dọn dẹp sạch MediaStream (camera tắt đèn, không bị leak track).
- [x] Kiểm tra nút **Reset phiên** trên màn hình Điều dưỡng: Xóa sạch bộ nhớ RAM backend, reset camera và xóa sạch session ID.
- [x] Chuẩn bị sẵn bản ghi video demo dự phòng của luồng tiếp nhận hoàn chỉnh.
