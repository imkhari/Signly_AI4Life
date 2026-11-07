# P9 — TÍCH HỢP, KIỂM TOÁN & DEMO

**Mục tiêu**: demo chạy trơn tru, an toàn, lặp lại được, kể cả khi mất mạng.
**Đọc trước**: `PLANS/00-MVP-2-WEEKS.md`, `PLANS/01-DEMO-SCRIPT.md`, `DEPLOYMENT_GUIDE.md`, skills `safety-review`, `demo-check`.
**Việc cần làm**
- E2E Playwright với 2 trang (`/nurse`, `/patient`): happy path; mâu thuẫn dị ứng; LLM mock "toxic" → Fallback; `REQUEST_INTERPRETER`; `SESSION_RESET` xóa sạch; mất kết nối → reconnect.
- Chế độ `ENV=demo`: LLM mock có kịch bản, trang/lệnh `/demo` (nếu cần) để ép Fallback, dữ liệu mẫu, reset 1 nút.
- Kiểm toán an toàn (skill `safety-review`) và a11y (axe + duyệt tay checklist `06` §5); sửa lỗi.
- Hiệu năng: đo độ trễ `INPUT_UPDATED` < 200 ms (LAN); không rò rỉ camera/timer.
- Hoàn thiện `README.md`, `DEPLOYMENT_GUIDE.md`, kịch bản demo; quay video dự phòng; chạy `demo-check`.
**Không làm**: không thêm tính năng mới sau ngày 12 (đóng băng).
**DoD**: 3 lần demo liên tiếp không lỗi, kể cả ngắt Internet; `make check` + E2E xanh; checklist `DEPLOYMENT_GUIDE` §3 hoàn tất.

## PROMPT
```text
Thực hiện Phase P9 (Tích hợp, kiểm toán, demo) cho AI4Care. Điều kiện: P4, P6, P7 DONE (P8 tùy chọn).
Đọc trước: AGENTS.md, docs/PLANS/00-MVP-2-WEEKS.md, docs/PLANS/01-DEMO-SCRIPT.md, docs/DEPLOYMENT_GUIDE.md, docs/07-SAFETY-GUARDRAILS.md, docs/06-STYLE-GUIDE.md (mục 5), .claude/skills/safety-review/SKILL.md, .claude/skills/demo-check/SKILL.md.

Viết E2E Playwright với hai trang: happy path, mâu thuẫn dị ứng, LLM toxic -> Fallback, REQUEST_INTERPRETER, SESSION_RESET xóa sạch (RAM + sessionStorage + camera), mất kết nối -> reconnect. Hoàn thiện ENV=demo (LLM mock có kịch bản, ép Fallback bằng một thao tác, dữ liệu mẫu, reset một nút). Chạy kiểm toán an toàn và a11y, sửa lỗi tìm thấy. Đo độ trễ INPUT_UPDATED. Hoàn thiện README và DEPLOYMENT_GUIDE theo thực tế.

Ràng buộc: KHÔNG thêm tính năng mới; chỉ sửa lỗi, ổn định, và tài liệu. Báo cáo cuối: danh sách mục DEPLOYMENT_GUIDE mục 3 đã đạt/chưa đạt, và các rủi ro còn lại. Cập nhật docs/99-PROGRESS-LOG.md.
```
