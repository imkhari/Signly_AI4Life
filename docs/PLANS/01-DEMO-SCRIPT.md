# KỊCH BẢN DEMO (≈ 3 phút + Q&A)

**Chuẩn bị**: `ENV=demo`, hai màn hình (`/patient`, `/nurse`), LLM mock có kịch bản, đã ghép cặp sẵn một phiên "sạch".

| Thời gian | Hành động | Thông điệp |
|---|---|---|
| 0:00–0:20 | Giới thiệu vấn đề: người Điếc tại quầy tiếp nhận, thiếu phiên dịch | Bài toán thực tế |
| 0:20–1:10 | Bệnh nhân: chọn "Chạm" → Đau → chạm **ngực** → kéo **7/10** → "2 giờ trước". Y tá thấy dữ liệu **hiện dần thời gian thực** (xám "Đang nhập…") | Đồng bộ tức thì |
| 1:10–1:30 | Bệnh nhân khai dị ứng **Không** nhưng gõ ô ghi chú "penicillin" → y tá thấy **cảnh báo mâu thuẫn** (đỏ/vàng) | Parser phát hiện mâu thuẫn, không đoán |
| 1:30–2:00 | Bấm "Xong" → bản tóm tắt tiếng Việt + 🔊 đọc to → bệnh nhân **Xác nhận** → mục chuyển **xanh** ở màn y tá | Xác nhận 2 chiều |
| 2:00–2:20 | **Demo an toàn**: bật `force-fallback` / kịch bản LLM "độc hại" (có chẩn đoán) → Validator chặn → huy hiệu "Mẫu cố định" | Guardrail + fail-safe |
| 2:20–2:40 | Y tá gửi câu hỏi bổ sung (icon) → bệnh nhân trả lời; bệnh nhân bấm "Không chắc" → **Gọi phiên dịch** | Con người luôn có đường thoát |
| 2:40–3:00 | Y tá **Duyệt phiếu** → **Xuất hồ sơ** (STT, mã, triệu chứng) → **Kết thúc** → cả hai màn hình xóa sạch | Privacy-by-design |

**Câu hỏi giám khảo thường gặp & trả lời ngắn**
- *AI có chẩn đoán không?* Không. Rule-based parser + LLM chỉ diễn đạt lại; Validator chặn chẩn đoán/kê đơn; bác sĩ quyết định.
- *LLM lỗi thì sao?* Timeout 4 s → mẫu cố định; y tá được báo.
- *Dữ liệu đi đâu?* RAM theo phiên, xóa khi kết thúc; LLM chỉ nhận frame ẩn danh; camera xử lý trên trình duyệt.
- *Độ chính xác nhận dạng VSL?* MVP nhận dạng gloss rời rạc; mọi kết quả đều được bệnh nhân xác nhận; có phiên dịch VRI dự phòng.
