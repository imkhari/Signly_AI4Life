# AGENTS.md — AI4Care (điểm vào duy nhất cho mọi AI agent)

> Đọc file này TRƯỚC KHI làm bất cứ việc gì. File ngắn có chủ đích; chi tiết nằm trong `docs/`.

## 1. Dự án là gì (3 câu)
AI4Care là trợ lý AI đa phương thức giúp **người Điếc (VSL) và người khó khăn về lời nói** giao tiếp ban đầu tại **quầy tiếp nhận/sàng lọc bệnh viện**.
Hệ thống **chỉ** thu thập triệu chứng → chuẩn hóa thành *Semantic Frame* → sinh bản tóm tắt an toàn → xác nhận 2 chiều (bệnh nhân & y tá) → chuyển tiếp phiên dịch khi không chắc chắn.
Sản phẩm tham gia cuộc thi **AI4Life**, nhóm 3 người, demo trước ban giám khảo, MVP trong 2 tuần.

## 2. Ranh giới tuyệt đối (KHÔNG BAO GIỜ vi phạm)
1. KHÔNG chẩn đoán, KHÔNG gợi ý bệnh, KHÔNG kê đơn / liều thuốc, KHÔNG thay bác sĩ hay phiên dịch viên.
2. KHÔNG lưu dữ liệu bệnh nhân lâu dài: chỉ bộ nhớ phiên, xóa sạch khi kết thúc phiên (`SESSION_RESET`).
3. KHÔNG tự "đoán" khi thiếu/mâu thuẫn dữ liệu → đánh dấu `uncertain` và đẩy cảnh báo cho y tá.
4. KHÔNG gửi dữ liệu định danh (tên, CCCD, SĐT) tới LLM. Chỉ gửi Semantic Frame đã ẩn danh.
5. Mọi văn bản do LLM sinh ra PHẢI đi qua Post-LLM Validator; lỗi/timeout → Fallback Template cố định.
Chi tiết: `docs/07-SAFETY-GUARDRAILS.md`.

## 3. Bản đồ tài liệu (đọc theo nhu cầu)
| Cần biết | Đọc |
|---|---|
| Mục tiêu, người dùng, phạm vi | `docs/00-PRD.md` |
| Tính năng + ưu tiên (Must/Should/Could) | `docs/01-FEATURES.md` |
| WebSocket events + REST | `docs/02-API-CONTRACT.md` |
| Semantic Frame, Ontology, TriageSummary | `docs/03-DATA-MODEL.md` |
| Luồng màn hình, wireframe | `docs/04-DESIGN-LINKS.md` |
| Công nghệ, phiên bản, lý do chọn | `docs/05-TECH-STACK.md` |
| Màu, chữ, accessibility, copy tiếng Việt | `docs/06-STYLE-GUIDE.md` |
| Guardrails y tế + quyền riêng tư | `docs/07-SAFETY-GUARDRAILS.md` |
| Kiến trúc + cấu trúc thư mục | `docs/08-ARCHITECTURE.md` |
| Thuật ngữ (STT, VSL, VRI, gloss…) | `docs/study/00-GLOSSARY.md` |
| Quyết định đã chốt | `docs/DECISIONS.md` |
| Câu hỏi CHƯA được trả lời | `docs/OPEN-QUESTIONS.md` |
| Kế hoạch 2 tuần + từng giai đoạn | `docs/PLANS/` |
| Prompt theo giai đoạn | `docs/PROMPTS/` |
| Tiến độ hiện tại | `docs/99-PROGRESS-LOG.md` |

## 4. Quy trình làm việc bắt buộc
1. Đọc `docs/99-PROGRESS-LOG.md` + `docs/OPEN-QUESTIONS.md` để biết đang ở đâu và điều gì còn mở.
2. Đọc file trong `docs/` liên quan tới nhiệm vụ. Nếu tài liệu **mâu thuẫn** hoặc **thiếu**, DỪNG và hỏi người dùng (xem §5) thay vì đoán.
3. Lập kế hoạch ngắn (≤10 dòng) trước khi viết code; chờ xác nhận nếu thay đổi chạm contract (`02`, `03`) hoặc safety (`07`).
4. Làm đúng phạm vi giai đoạn hiện tại (`docs/PROMPTS/PX-*.md`). Không làm trước các giai đoạn sau.
5. Viết test cùng lúc với code. Chạy `make check` (lint + type + test) trước khi báo xong.
6. Cập nhật `docs/99-PROGRESS-LOG.md` và, nếu có quyết định mới, `docs/DECISIONS.md`.
7. Commit nhỏ theo Conventional Commits: `feat(parser): ...`, `fix(ws): ...`, `docs: ...`.

## 5. Khi nào PHẢI hỏi lại người dùng
- Câu trả lời ảnh hưởng tới contract (schema/event), an toàn y tế, hoặc quyền riêng tư.
- Hai tài liệu nói khác nhau, hoặc một mục trong `OPEN-QUESTIONS.md` đang `OPEN` mà bạn cần nó.
- Cần chọn thư viện/dịch vụ ngoài `docs/05-TECH-STACK.md`.
- Cách hỏi: tối đa 5 câu, đánh số, mỗi câu kèm **phương án đề xuất** để người dùng chỉ cần trả lời "ok" hoặc chọn. Ghi câu trả lời vào `OPEN-QUESTIONS.md` (đổi `OPEN` → `ANSWERED`) và `DECISIONS.md`.

## 6. Lệnh thường dùng (Makefile được tạo ở phase P1)
```bash
make setup      # cài dependencies (frontend + backend)
make dev        # chạy backend :8000 + frontend :5173
make check      # lint + typecheck + test (bắt buộc xanh trước khi commit)
make demo       # chạy chế độ demo (mock LLM, mock VSL, dữ liệu mẫu)
```

## 7. Quy ước chung
- Ngôn ngữ: **UI + tài liệu = tiếng Việt**; **tên biến/hàm/commit = tiếng Anh**; comment code = tiếng Anh ngắn gọn.
- Thay đổi schema = cập nhật đồng thời: Pydantic (`backend/app/domain`), TypeScript (`frontend/src/types`), `docs/02`, `docs/03`, test.
- Không thêm dependency khi chưa cần; không commit secret (`.env` nằm trong `.gitignore`).
- Mọi component tương tác phải đạt checklist accessibility trong `docs/06-STYLE-GUIDE.md`.
