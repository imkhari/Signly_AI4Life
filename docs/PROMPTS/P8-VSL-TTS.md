# P8 — CAMERA VSL (mock-first) & TTS HOÀN THIỆN

**Mục tiêu**: đường vào bằng ký hiệu VSL rời rạc, minh bạch về độ tin cậy; TTS chắc chắn.
**Đọc trước**: `OPEN-QUESTIONS` Q-05, `03` §4 (gloss), `07` §5 (camera/privacy), `01-FEATURES.md` F-13, F-20.
**Việc cần làm**
- `services/vsl/GlossRecognizer.ts` (interface: `start(video) / stop() / onGloss(cb: (g: {gloss, confidence}) => void)`), `MockRecognizer` (nút bấm giả lập gloss + kịch bản), `MediaPipeRecognizer` (chỉ khi Q-05 = nhận dạng thật và P0–P7 xong; ≤ 15 gloss; chạy trên trình duyệt).
- `hooks/useCamera`: xin quyền, xử lý từ chối (hướng dẫn + dùng chạm/chữ), **dừng track + giải phóng khi rời màn hình hoặc `SESSION_RESET`**.
- UI chế độ camera trong `ChooseMode`/`Symptoms`: khung hình, chip gloss nhận được kèm độ tin cậy; gloss < 0.6 hiển thị "Chưa chắc — chọn lại" (alert `LOW_CONFIDENCE_GLOSS`); bệnh nhân **xác nhận từng gloss** trước khi thành `INPUT_UPDATED` (`modality: vsl_gloss`).
- TTS: chọn giọng `vi-VN` nếu có; nếu không có giọng, chỉ hiển thị phụ đề + thông báo cho y tá; hàng đợi nói, nút dừng; đọc số tự nhiên ("bảy trên mười").
- Test: mock recognizer, hủy camera khi reset, fallback khi không có giọng.
**Không làm**: không upload video/khung hình; không nhận dạng câu liên tục; không lưu ảnh.
**DoD**: demo được bằng MockRecognizer; (nếu thật) chạy ≥ 10 gloss ổn định trong điều kiện ánh sáng phòng demo; camera luôn tắt sau reset.

## PROMPT
```text
Thực hiện Phase P8 (Camera VSL + TTS) cho AI4Care. Điều kiện: P6 DONE.
Đọc trước: AGENTS.md, docs/OPEN-QUESTIONS.md (Q-05), docs/03-DATA-MODEL.md (mục 4, gloss), docs/07-SAFETY-GUARDRAILS.md (mục 5), docs/01-FEATURES.md (F-13, F-20), docs/04-DESIGN-LINKS.md.

Cài đặt GlossRecognizer interface, MockRecognizer (nút giả lập gloss + kịch bản demo), useCamera (quyền, từ chối, dừng track khi rời màn hình hoặc SESSION_RESET), UI chế độ camera hiển thị chip gloss kèm độ tin cậy, bệnh nhân phải xác nhận từng gloss trước khi gửi INPUT_UPDATED (modality vsl_gloss), gloss < 0.6 hiện "Chưa chắc — chọn lại". Hoàn thiện TTS: chọn giọng vi-VN, fallback phụ đề khi không có giọng, hàng đợi + nút dừng, đọc số tự nhiên.
Chỉ làm MediaPipeRecognizer nếu Q-05 đã ANSWERED là nhận dạng thật; nếu chưa, chỉ làm Mock và hỏi tôi.

Ràng buộc: không upload video hay khung hình; chỉ gửi gloss + confidence; camera phải tắt sau reset. Bắt đầu bằng kế hoạch ≤ 10 dòng; viết test; make check xanh; cập nhật docs/99-PROGRESS-LOG.md.
```
