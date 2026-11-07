# Thuật ngữ & kiến thức nền

| Thuật ngữ | Nghĩa trong dự án |
|---|---|
| **VSL** | Ngôn ngữ ký hiệu Việt Nam (Vietnamese Sign Language) |
| **Người Điếc (Deaf, viết hoa D)** | Thuộc cộng đồng văn hóa-ngôn ngữ ký hiệu; tiếng Việt viết có thể là ngôn ngữ thứ hai → ưu tiên hình ảnh, câu ngắn |
| **Gloss** | Nhãn chữ đại diện cho một ký hiệu, ví dụ `ĐAU`, `NGỰC`. Gloss ≠ bản dịch đầy đủ; VSL có ngữ pháp riêng |
| **Gloss rời rạc** | Nhận dạng từng ký hiệu riêng lẻ (MVP), không phải câu liên tục |
| **VRI** | Video Remote Interpreting — phiên dịch viên từ xa qua video |
| **Kiosk** | Trạm tự phục vụ cảm ứng đặt tại quầy |
| **Quầy tiếp nhận / sàng lọc (triage desk)** | Nơi ghi nhận lý do khám ban đầu; *không* phải nơi chẩn đoán |
| **Semantic Frame** | Cấu trúc JSON chuẩn hóa thông tin bệnh nhân khai (xem `03`) |
| **Ontology** | Danh mục mã chuẩn: lý do khám, vùng cơ thể, thời gian, dị ứng, gloss |
| **Rule-based Parser** | Bộ phân tích theo luật (không dùng ML) ánh xạ đầu vào → Ontology, phát hiện mâu thuẫn/thiếu |
| **Post-LLM Validator** | Bộ kiểm duyệt đầu ra LLM, chặn chẩn đoán/kê đơn/thêm dữ kiện |
| **Fallback Template** | Câu ghép cố định từ frame khi LLM lỗi hoặc bị chặn |
| **STT** | (Giả định, Q-02) **Số thứ tự** của bệnh nhân. Tránh nhầm với *speech-to-text* |
| **Mã tiếp nhận (intake code)** | Mã phiếu dạng `AC-0042` |
| **Pairing code** | Mã 6 ký tự ghép màn hình bệnh nhân với màn hình y tá |
| **Red-flag** | Dấu hiệu cần chuyển nhân viên ngay; hệ thống chỉ **chuyển tiếp**, không đánh giá |
| **Xác nhận 2 chiều** | Bệnh nhân xác nhận nội dung → y tá duyệt phiếu |
| **Privacy-by-design** | Thiết kế để không lưu dữ liệu nhạy cảm ngoài phạm vi phiên |

## Tài liệu nên đọc thêm (nhóm tự bổ sung vào đây)
- Hướng dẫn giao tiếp với người Điếc trong cơ sở y tế (nguồn: _chưa thêm_).
- WCAG 2.2 (mục 1.4 Distinguishable, 2.5 Input Modalities).
- Quy định bảo vệ dữ liệu cá nhân hiện hành tại Việt Nam (nhóm tự tra cứu; hệ thống không lưu dữ liệu nên giảm rủi ro).
