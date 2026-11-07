# P6 — PATIENT UI (`/patient`)

**Mục tiêu**: wizard 4 bước cho bệnh nhân, thân thiện người Điếc, tối ưu kiosk cảm ứng.
**Đọc trước**: `04-DESIGN-LINKS.md` §2, `06-STYLE-GUIDE.md`, `01-FEATURES.md` (F-01…F-05, F-10, F-13, F-23, F-24), skill `new-wizard-step`.
**Việc cần làm**
- `PatientPage` + `useWizard` (reducer: `step`, `draftFrame`, `modality`, điều hướng, lưu sessionStorage) + nhập mã ghép cặp.
- Bước 1 `ChooseMode`; bước 2 `Symptoms` (lưới lý do khám, `BodyMap` SVG trước/sau ≥ 12 vùng chọn nhiều, `PainSlider` 0–10 có ±, thời gian bắt đầu); bước 3 `Allergy` (Không/Có/Không chắc + nhóm + tên); bước 4 `Confirm` (chữ lớn + icon + 🔊 + Đúng/Sửa/Không chắc).
- Mỗi thay đổi → gửi `INPUT_UPDATED` (patch, debounce 150 ms); nhận frame + alerts từ server và hiển thị cảnh báo mâu thuẫn *dễ hiểu* cho bệnh nhân (không thuật ngữ).
- Nút "Gọi phiên dịch / nhân viên" cố định mọi bước → `REQUEST_INTERPRETER`.
- Nhận `NURSE_QUESTION` → hiện modal lớn + TTS + trả lời bằng chạm.
- Màn hình chờ/kết thúc + đếm ngược `SESSION_RESET`.
- Test: reducer, từng bước, a11y (vitest-axe nếu dùng), luồng với `fakeServer`.
**Không làm**: camera VSL (P8); không tự điền giá trị thiếu; không hiển thị mức độ nghiêm trọng hay lời khuyên.
**DoD**: hoàn thành luồng chỉ bằng chạm trong ≤ 60 s; điều hướng bàn phím đầy đủ; bấm Đúng ở bước 4 phát `PATIENT_CONFIRMED`; Sửa quay lại giữ dữ liệu.

## PROMPT
```text
Thực hiện Phase P6 (Patient UI) cho AI4Care. Điều kiện: P5 DONE (backend P4 có thể chưa xong, dùng fakeServer).
Đọc trước: AGENTS.md, docs/04-DESIGN-LINKS.md (mục 2), docs/06-STYLE-GUIDE.md, docs/01-FEATURES.md, docs/02-API-CONTRACT.md (INPUT_UPDATED, SUMMARY_READY, PATIENT_CONFIRMED, NURSE_QUESTION, REQUEST_INTERPRETER), .claude/skills/new-wizard-step/SKILL.md, docs/OPEN-QUESTIONS.md (Q-09, Q-10).

Xây màn hình /patient: nhập mã ghép cặp; wizard 4 bước (chọn phương thức; triệu chứng gồm lưới lý do, BodyMap SVG trước/sau với >= 12 vùng chọn nhiều, PainSlider 0-10 có nút +/-, thời gian bắt đầu; dị ứng Không/Có/Không chắc; xác nhận bản tóm tắt có nút nghe). Mỗi thay đổi gửi INPUT_UPDATED (debounce 150 ms). Nút "Gọi phiên dịch / nhân viên" cố định ở mọi bước. Nhận NURSE_QUESTION và trả lời bằng chạm. Màn hình chờ và SESSION_RESET.
Dùng useWizard (useReducer) và custom hook kết nối WebSocket có sẵn từ P5.

Ràng buộc: chữ ngắn, câu chủ động, không thuật ngữ y khoa; không chỉ dùng màu; mục tiêu chạm >= 64px; mọi lời đọc TTS đều có phụ đề; không tự điền trường thiếu; không đưa lời khuyên/đánh giá nghiêm trọng. Chưa làm camera VSL. Bắt đầu bằng kế hoạch ≤ 10 dòng; viết test; hoàn thành khi make check xanh và cập nhật docs/99-PROGRESS-LOG.md.
```
