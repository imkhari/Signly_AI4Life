# KỊCH BẢN DEMO (≈ 3 phút + Q&A)

**Chuẩn bị**: `ENV=demo`, hai màn hình (`/patient`, `/nurse`), LLM mock có kịch bản, đã ghép cặp sẵn một phiên "sạch".

| Thời gian | Hành động | Thông điệp |
|---|---|---|
| 0:00–0:20 | Giới thiệu vấn đề: người Điếc tại quầy tiếp nhận, thiếu phiên dịch | Bài toán thực tế |
| 0:20–1:10 | Bệnh nhân: Mở camera VSL (hoặc chọn "Chạm") → Thử cử chỉ (áp tay ngực / sốt trán / khó thở) → Thanh tiến trình giữ yên $\ge 0.8$s hiển thị → Bấm "Nhận" ✔. Y tá thấy dữ liệu **hiện dần thời gian thực** (xám "Đang nhập…") | Nhận dạng VSL trực tiếp + Xác nhận chủ động |
| 1:10–1:30 | Bệnh nhân khai dị ứng **Không** nhưng gõ ô ghi chú "penicillin" → y tá thấy **cảnh báo mâu thuẫn** (đỏ/vàng) | Parser phát hiện mâu thuẫn, không đoán |
| 1:30–2:00 | Bấm "Xong" → bản tóm tắt tiếng Việt + 🔊 đọc to → bệnh nhân **Xác nhận** → mục chuyển **xanh** ở màn y tá | Xác nhận 2 chiều |
| 2:00–2:20 | **Demo an toàn**: bật `force-fallback` / kịch bản LLM "độc hại" (có chẩn đoán) → Validator chặn → huy hiệu "Mẫu cố định" | Guardrail + fail-safe |
| 2:20–2:40 | Y tá gửi câu hỏi bổ sung (icon) → bệnh nhân trả lời; bệnh nhân bấm "Không chắc" → **Gọi phiên dịch** | Con người luôn có đường thoát |
| 2:40–3:00 | Y tá **Duyệt phiếu** → **Xuất hồ sơ** (STT, mã, triệu chứng) → **Kết thúc** → cả hai màn hình xóa sạch camera và phiên | Privacy-by-design |

---

## Câu hỏi giám khảo thường gặp & trả lời chuẩn xác (Q&A)

- **AI có chẩn đoán hoặc kê đơn thuốc không?**
  *Trả lời:* Tuyệt đối không. AI4Care tuân thủ ranh giới an toàn y tế nghiêm ngặt: hệ thống chỉ trích xuất triệu chứng thô thành Semantic Frame chuẩn hóa. Bộ lọc Post-LLM Validator quét và tự động tiêu hủy bất kỳ văn bản nào chứa từ ngữ chẩn đoán hoặc gợi ý thuốc, kích hoạt mẫu câu fallback an toàn ngay lập tức. Bác sĩ chuyên khoa tại phòng khám là người duy nhất đưa ra quyết định y khoa.

- **Mô hình nhận dạng ký hiệu VSL hoạt động như thế nào và có dùng Deep Learning không?**
  *Trả lời:*
  - Trong bản trình diễn MVP, hệ thống sử dụng **Động cơ Hình học Không gian 3D & Chuỗi chuyển động 16-frame** chạy trực tiếp trên thiết bị (Edge) với độ trễ cực thấp (<1ms) cho 35 từ vựng/cử chỉ y tế thiết yếu. Hệ thống tích hợp **bộ lọc ổn định cử chỉ $\ge 0.8$ giây** để loại bỏ false positive (vẫy tay, chuyển động ngẫu nhiên).
  - Về mặt kiến trúc, backend đã tích hợp sẵn module tải trọng số **PyTorch Video Transformer Network (Checkpoint 208MB)** cho server tier. Khi server có cài đặt `torch`, hệ thống có thể chuyển mạch sang mô hình Deep Learning. Tuy nhiên, nhóm không tuyên bố 100% deep learning trong bản demo MVP mà trình bày rõ ràng: hệ thống vận hành bền bỉ với fallback hình học 3D, không phụ thuộc tải mạng hay gói thư viện nặng.
  - Quan trọng nhất: Camera xử lý 100% offline trên thiết bị (không gửi video/ảnh lên server), và AI không bao giờ tự ý lưu triệu chứng vào hồ sơ — bệnh nhân bắt buộc phải chủ động bấm "Nhận" (✓).

- **LLM lỗi hoặc mất mạng thì hệ thống xử lý thế nào?**
  *Trả lời:* Hệ thống thiết kế Offline-first và Fail-safe. Khi LLM vượt quá timeout 4 giây hoặc mất kết nối mạng, hệ thống tự động fallback về bộ Template tiếng Việt cố định đã được kiểm duyệt an toàn, đồng thời thông báo rõ ràng cho y tá ("Nguồn: Mẫu cố định dự phòng").

- **Dữ liệu bệnh nhân được bảo vệ như thế nào?**
  *Trả lời:* Theo nguyên tắc Privacy-by-design:
  - Dữ liệu định danh (Họ tên, CCCD, SĐT) không bao giờ gửi tới LLM hay server bên ngoài.
  - Toàn bộ dữ liệu phiên chỉ lưu trong bộ nhớ RAM tạm thời và bị xóa sạch vĩnh viễn ngay khi điều dưỡng bấm "Kết thúc phiên" (`SESSION_RESET`).
  - Toàn bộ luồng camera stream được giải phóng và đóng track triệt để khi rời màn hình hoặc đổi chế độ.

- **Nếu nhận dạng sai hoặc bệnh nhân không biết ký hiệu chuẩn thì sao?**
  *Trả lời:* Hệ thống luôn hiển thị 4 thẻ hướng dẫn trực quan (Đau ngực, Sốt cao, Đau bụng, Khó thở) và nút **"Chuyển sang Chạm"** dễ bấm trên mọi màn hình. Ngoài ra, bệnh nhân luôn có nút khẩn cấp **"Gọi phiên dịch / nhân viên y tế"** để kết nối trực tiếp với con người.
