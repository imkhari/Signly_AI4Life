# P3 — AI ORCHESTRATION (LLM + VALIDATOR + FALLBACK)

**Mục tiêu**: sinh bản tóm tắt tiếng Việt an toàn; mọi lỗi đều có đường lui.
**Đọc trước**: `07-SAFETY-GUARDRAILS.md` (toàn bộ), `03-DATA-MODEL.md` §5, `.claude/rules/safety-medical.md`, skill `safety-review`.
**Việc cần làm**
- `application/ports.py`: `LLMClient` Protocol (`async generate(system, user, *, timeout_s) -> str`).
- `infrastructure/llm/`: `mock.py` (chế độ `ok` | `toxic` | `timeout` | `error`, chọn bằng cấu hình/tham số), adapter thật cho **một** provider đã chốt ở Q-08 (qua `httpx`), các provider khác để stub rõ ràng.
- `ai/prompts/summary_system_vi.txt` đúng bản chuẩn ở `07` §2.
- `ai/redaction.py`: che SĐT/CCCD/email/tên riêng dạng pattern trong `free_text` trước khi gửi LLM.
- `ai/validator.py`: V1–V8 đúng bảng `07` §3; trả `ValidatorReport{passed, violations[]}`.
- `ai/fallback_template.py`: theo `03` §5.
- `ai/orchestrator.py`: redaction → build prompt → `asyncio.wait_for(timeout=4s)` → validator → fallback; trả `SummaryResult{text_vi, nl_source, fallback_reason, validator}`.
- `tests/safety/`: ≥ 30 câu độc hại phải bị chặn (chẩn đoán, kê đơn, liều, trấn an, thêm dữ kiện, tên thuốc không khai), ≥ 15 câu hợp lệ phải qua; test timeout/error/JSON hỏng → fallback; test `null` → "Chưa rõ".
**Không làm**: không WebSocket; không lưu prompt/response; không gửi dữ liệu định danh; không hard-code tên model.
**DoD**: toàn bộ test an toàn xanh; orchestrator không bao giờ ném lỗi ra ngoài (luôn trả kết quả); `make check` xanh.

## PROMPT
```text
Thực hiện Phase P3 (AI orchestration) cho AI4Care. Điều kiện: P2 DONE.
Đọc trước: AGENTS.md, docs/07-SAFETY-GUARDRAILS.md (toàn bộ), docs/03-DATA-MODEL.md (mục 5), .claude/rules/safety-medical.md, .claude/skills/safety-review/SKILL.md, docs/OPEN-QUESTIONS.md (Q-07, Q-08).

Cài đặt: LLMClient Protocol; MockLLMClient (các chế độ ok/toxic/timeout/error); một adapter provider thật (provider theo Q-08; nếu Q-08 còn OPEN thì chỉ làm mock + stub và hỏi tôi); system prompt đúng bản chuẩn; redaction; Validator V1-V8; Fallback Template; Orchestrator có timeout 4 giây và không bao giờ ném lỗi.
Viết tests/safety với >= 30 câu độc hại phải bị chặn và >= 15 câu hợp lệ phải qua, cùng test timeout/lỗi/JSON hỏng.

Ràng buộc cứng: không chẩn đoán/kê đơn dù chỉ trong ví dụ test hiển thị cho người dùng; không log nội dung bệnh nhân; model và provider lấy từ cấu hình. Chạy skill safety-review trước khi báo xong. Bắt đầu bằng kế hoạch ≤ 10 dòng. Cuối cùng cập nhật docs/99-PROGRESS-LOG.md.
```
