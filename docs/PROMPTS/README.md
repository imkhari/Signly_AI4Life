# PROMPTS THEO GIAI ĐOẠN

Cách dùng: mở AI agent ở thư mục gốc repo → dán phần **PROMPT** của file phase tương ứng → agent tự đọc `AGENTS.md` + docs → làm → cập nhật `99-PROGRESS-LOG.md`. Không nhảy phase; phase sau phụ thuộc phase trước (cột *Cần*).

| Phase | File | Mục tiêu | Cần | Người chính |
|---|---|---|---|---|
| P0 | `P0-KICKOFF.md` | Agent đọc hiểu toàn bộ dự án, **phỏng vấn** chủ dự án, chốt câu hỏi mở | — | cả nhóm |
| P1 | `P1-BOOTSTRAP.md` | Khung monorepo, công cụ, CI, `make check` | P0 | A |
| P2 | `P2-BACKEND-DOMAIN.md` | Pydantic models, Ontology, Parser, state machine | P1 | A |
| P3 | `P3-AI-ORCHESTRATION.md` | LLM client, prompt, Validator, Fallback | P2 | A |
| P4 | `P4-REALTIME.md` | WebSocket hub, session, REST, xóa dữ liệu | P2 (P3 song song được) | A |
| P5 | `P5-FRONTEND-FOUNDATION.md` | Design system, i18n, types, socket client, hooks | P1 | B + C |
| P6 | `P6-PATIENT-UI.md` | Wizard bệnh nhân, BodyMap, PainSlider, TTS | P5 | B |
| P7 | `P7-NURSE-UI.md` | Bảng y tá, cảnh báo, câu hỏi, duyệt, xuất hồ sơ | P5 | C |
| P8 | `P8-VSL-TTS.md` | Camera VSL (mock-first), TTS hoàn thiện | P6 | C |
| P9 | `P9-INTEGRATION-DEMO.md` | E2E, đóng băng, kiểm toán an toàn/a11y, demo | P4, P6, P7 | cả nhóm |

## Khuôn mẫu mỗi file
`Mục tiêu` → `Đọc trước` → `Việc cần làm` → `Không làm` → `Tiêu chí hoàn thành (DoD)` → `PROMPT` (khối để dán).

## Quy tắc chung đã nằm trong mọi PROMPT
- Đọc `AGENTS.md`, `99-PROGRESS-LOG.md`, `OPEN-QUESTIONS.md` trước.
- Nếu thiếu/mâu thuẫn → hỏi lại tối đa 5 câu, mỗi câu kèm phương án đề xuất; không đoán.
- Lập kế hoạch ≤ 10 dòng, đợi xác nhận nếu chạm contract/an toàn.
- Viết test cùng code; `make check` xanh; cập nhật progress log + decisions.
