# DECISIONS (ADR rút gọn)

Định dạng: `D-xxx · ngày · quyết định · lý do · trạng thái (FINAL | PROVISIONAL)`. `PROVISIONAL` = đang dùng mặc định chờ chủ dự án xác nhận (xem `OPEN-QUESTIONS.md`).

| ID | Ngày | Quyết định | Lý do | Trạng thái |
|---|---|---|---|---|
| D-001 | 2026-11-07 | `AGENTS.md` là điểm vào duy nhất; các file khác chỉ trỏ về nó | Tránh lệch nội dung giữa các công cụ AI (Q-01) | FINAL |
| D-002 | 2026-11-07 | Web app responsive, không làm app native trong MVP | Một codebase, dễ demo trên tablet/kiosk (Q-04) | FINAL |
| D-003 | 2026-11-07 | Không dùng database; dữ liệu trong RAM theo phiên | Privacy-by-design, đơn giản | FINAL |
| D-004 | 2026-11-07 | Phiên bản cố định tại P1: FastAPI 0.162, Pydantic 2.14, Uvicorn 0.54, Pytest 9.2, Ruff 0.17, Mypy 2.4; React 18.3, Vite 5.4, Tailwind 3.4.14, TS 5.6, Vitest 2.1 | Ổn định, khóa lockfile, không nâng version giữa chừng | FINAL |
| D-005 | 2026-11-07 | LLM luôn sau `LLMClient` interface; mặc định demo = mock có kịch bản | Demo không phụ thuộc mạng, có nút ép fallback (Q-08) | FINAL |
| D-006 | 2026-11-07 | "STT" = số thứ tự (`queue_number: int`) | Ghi chú tay "(số TT, mã, triệu chứng)", tránh nhầm STT=voice (Q-02) | FINAL |
| D-007 | 2026-11-07 | `null` ≠ `false` trong Semantic Frame | An toàn: chưa biết ≠ đã trả lời không | FINAL |
| D-008 | 2026-11-07 | Camera VSL: mock-first, chỉ gloss rời rạc (≤ 15 từ) | Rủi ro thời gian và hiệu năng; MediaPipe làm sau nếu kịp (Q-05) | FINAL |
| D-009 | 2026-11-07 | Xuất hồ sơ bằng `window.print()` phía client (in/PDF) | Không lưu server, không thêm dependency (Q-03) | FINAL |
| D-010 | 2026-11-07 | State FE: `useReducer` + Context, không Redux/Zustand | Đủ dùng, ít phụ thuộc | FINAL |
| D-011 | 2026-11-07 | Backend dùng `uv` trên CI và ưu tiên `uv` cục bộ; tự động fallback `venv + pip` | Tối ưu tốc độ cài đặt và tương thích mọi môi trường dev (Q-04) | FINAL |
| D-012 | 2026-11-07 | Tuyệt đối không lưu hoặc xuất thông tin định danh (PII) trên phiếu | Bảo vệ quyền riêng tư người bệnh; chỉ in STT, mã AC-xxxx, triệu chứng, cảnh báo (Q-14) | FINAL |
| D-013 | 2026-11-07 | Chuẩn hóa trạng thái phiên: `collecting` (thay vì `draft`), `needs_edit` | Đồng nhất giữa API Contract, WebSocket và TriageSummary model | FINAL |
