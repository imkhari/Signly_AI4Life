# 00 — PRD: AI4Care

## 1. Vấn đề
Người Điếc và người khó khăn về lời nói gặp rào cản lớn ở bước đầu tiên tại bệnh viện: quầy tiếp nhận/sàng lọc. Phiên dịch viên VSL khan hiếm; viết tay chậm và dễ sai; y tá không có công cụ chuẩn hóa thông tin ban đầu.

## 2. Giải pháp
Một **trạm Kiosk hai màn hình đối diện** (web app responsive):
- Màn hình bệnh nhân `/patient`: chạm icon, chọn vị trí đau trên sơ đồ cơ thể, kéo mức đau 0–10, chọn thời gian, khai dị ứng, nhập chữ (kèm TTS), hoặc làm ký hiệu VSL rời rạc trước camera.
- Màn hình điều dưỡng `/nurse`: nhận phiếu tóm tắt thời gian thực, thấy rõ phần đã xác nhận (xanh) và phần cần hỏi lại / dị ứng (vàng/đỏ), gửi câu hỏi bổ sung hoặc gọi phiên dịch VRI.
- Hồ sơ đã duyệt được **xuất** cho bác sĩ (STT, mã tiếp nhận, triệu chứng).

## 3. Người dùng (3 vai trò)
| Vai trò | Mô tả | Màn hình |
|---|---|---|
| Bệnh nhân (Điếc / khó nói) | Mô tả triệu chứng bằng nhiều cách: chạm, chữ, giọng nói (nếu có thể), ký hiệu VSL | `/patient` |
| Điều dưỡng / y tá tiếp nhận | Xem phiếu, xác minh, hỏi lại, gọi phiên dịch, xuất hồ sơ | `/nurse` |
| Bác sĩ | Nhận hồ sơ đã xuất; vẫn có thể dùng cùng cách giao tiếp để trao đổi với bệnh nhân (xem F-12, trạng thái: **cần xác nhận**) | `/doctor` (tùy chọn) |

> Nguồn: bản gốc đề bài + ghi chú tay của chủ dự án. Mục "bác sĩ" đến từ ghi chú tay, xem `OPEN-QUESTIONS.md` Q-03.

## 4. Luồng chính (happy path)
1. Y tá mở `/nurse` → tạo/nhận **mã ghép cặp** (pairing code) → bệnh nhân mở `/patient` nhập/quét mã (hoặc kiosk tự ghép).
2. Bệnh nhân chọn phương thức → lý do khám → vị trí cơ thể → mức đau → thời gian → dị ứng.
3. Mỗi thay đổi → `INPUT_UPDATED` → backend chạy Parser → y tá thấy cập nhật thời gian thực.
4. Bệnh nhân bấm "Xong" → backend tạo Semantic Frame → LLM sinh câu tự nhiên → Validator → `SUMMARY_READY`.
5. Bệnh nhân đọc/nghe bản tóm tắt → **Xác nhận** hoặc **Sửa** → `PATIENT_CONFIRMED`.
6. Y tá duyệt → `NURSE_VERIFIED` (hoặc gửi câu hỏi bổ sung / `REQUEST_INTERPRETER`).
7. Y tá xuất hồ sơ cho bác sĩ → kết thúc → `SESSION_RESET` xóa sạch dữ liệu.

## 5. Phạm vi
**Trong phạm vi (MVP):** luồng trên; Parser rule-based; LLM + Validator + Fallback; WebSocket đồng bộ; TTS tiếng Việt; camera VSL ở mức gloss rời rạc (mock-first); xuất hồ sơ; xóa dữ liệu theo phiên.
**Ngoài phạm vi:** chẩn đoán; kê đơn; phân loại cấp cứu chính thức; lưu hồ sơ bệnh án; nhận dạng VSL liên tục (câu dài); tích hợp HIS/EMR thật; đăng nhập tài khoản.

## 6. Nguyên tắc sản phẩm
1. **An toàn trước tiện lợi**: nghi ngờ → hỏi lại / gọi người.
2. **Xác nhận 2 chiều**: không có thông tin nào được xem là "đã xác nhận" nếu bệnh nhân chưa xác nhận.
3. **Con người quyết định**: AI chỉ tóm tắt; y tá duyệt; bác sĩ chẩn đoán.
4. **Riêng tư mặc định**: không lưu, không định danh gửi LLM.
5. **Không chỉ dựa vào chữ viết**: người Điếc có thể đọc tiếng Việt hạn chế → ưu tiên icon, hình, màu, câu ngắn.

## 7. Tiêu chí thành công của demo
- Chạy trọn luồng ≤ 3 phút, không lỗi, kể cả khi LLM bị ngắt (Fallback chạy).
- Thể hiện được ≥ 1 cảnh báo mâu thuẫn và 1 cảnh báo dị ứng trên màn hình y tá.
- Thể hiện `REQUEST_INTERPRETER` và `SESSION_RESET`.
- Giám khảo thấy rõ guardrail: LLM bị ép trả lời có chẩn đoán → Validator chặn → Fallback.
