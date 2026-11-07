# P7 — NURSE UI (`/nurse`)

**Mục tiêu**: bảng đọc nhanh cho điều dưỡng: xác nhận (xanh) / cảnh báo (vàng-đỏ), hỏi lại, duyệt, xuất hồ sơ.
**Đọc trước**: `04-DESIGN-LINKS.md` §3, `06-STYLE-GUIDE.md`, `01-FEATURES.md` (F-09…F-12, F-21, F-22), `OPEN-QUESTIONS` Q-02, Q-03, Q-14.
**Việc cần làm**
- `NursePage`: tạo phiên (`POST /api/sessions`), hiển thị pairing code lớn + QR tùy chọn, trạng thái kết nối, STT + mã tiếp nhận (STT nhập tay hoặc tự tăng trong demo).
- `SummaryBoard` 2 vùng: `ConfirmedPanel` (chỉ chuyển xanh **sau** `PATIENT_CONFIRMED`; trước đó xám "Đang nhập…") và `AlertsPanel` (vàng/đỏ, `critical` nháy + `aria-live=assertive` + âm báo ngắn tắt được).
- Huy hiệu nguồn tóm tắt `LLM` / `Mẫu cố định`.
- `QuestionPicker`: câu hỏi mẫu (icon + chữ) → `NURSE_QUESTION`.
- Nút **Duyệt phiếu** (khóa nếu còn alert `critical` chưa "Đã biết") → `NURSE_VERIFIED`.
- **Gọi phiên dịch** → `REQUEST_INTERPRETER` + hiển thị `INTERPRETER_STATUS` (mock).
- **Xuất hồ sơ** (nếu Q-03): print stylesheet gọn 1 trang: STT, mã, triệu chứng đã xác nhận, cảnh báo — **không định danh** (Q-14); sau xuất nhắc lưu đúng quy định bệnh viện.
- **Kết thúc phiên** → `SESSION_RESET` + xác nhận trước khi xóa.
- Test với `fakeServer`: màu/trạng thái theo từng giai đoạn, khóa nút Duyệt, đường lỗi.
**Không làm**: không lưu bệnh nhân; không hiển thị chẩn đoán/gợi ý điều trị; không thêm thông tin định danh.
**DoD**: quan sát toàn bộ luồng từ bệnh nhân trong < 1 s; không có màu duy nhất mang nghĩa; điều hướng bàn phím đầy đủ.

## PROMPT
```text
Thực hiện Phase P7 (Nurse UI) cho AI4Care. Điều kiện: P5 DONE (dùng fakeServer nếu backend chưa xong).
Đọc trước: AGENTS.md, docs/04-DESIGN-LINKS.md (mục 3), docs/06-STYLE-GUIDE.md, docs/01-FEATURES.md, docs/02-API-CONTRACT.md, docs/OPEN-QUESTIONS.md (Q-02, Q-03, Q-14).

Xây /nurse: tạo phiên và hiển thị pairing code; thanh trên có STT (số thứ tự), mã tiếp nhận, trạng thái kết nối; SummaryBoard 2 vùng: "Đã xác nhận" màu xanh (chỉ sau PATIENT_CONFIRMED, trước đó hiển thị xám "Đang nhập") và "Cần hỏi lại / Dị ứng" vàng-đỏ (critical nháy, aria-live assertive, âm báo ngắn có thể tắt); huy hiệu nguồn tóm tắt LLM hoặc Mẫu cố định; QuestionPicker gửi NURSE_QUESTION; nút Duyệt phiếu (khóa khi còn cảnh báo critical chưa ack) gửi NURSE_VERIFIED; nút Gọi phiên dịch; Xuất hồ sơ bằng print stylesheet (nếu Q-03 đã ANSWERED là có; nếu chưa, làm và đánh dấu ASSUMPTION Q-03); Kết thúc phiên gửi SESSION_RESET có hộp xác nhận.

Ràng buộc: không định danh trên hồ sơ xuất; không chẩn đoán/gợi ý điều trị; không chỉ dùng màu; chuỗi UI nằm trong i18n/vi.ts. Bắt đầu bằng kế hoạch ≤ 10 dòng; viết test với fakeServer; hoàn thành khi make check xanh và cập nhật docs/99-PROGRESS-LOG.md.
```
