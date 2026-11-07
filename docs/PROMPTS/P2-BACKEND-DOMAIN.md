# P2 — BACKEND DOMAIN & PARSER

**Mục tiêu**: lõi nghiệp vụ thuần Python: models, Ontology, Parser phát hiện mâu thuẫn/thiếu, state machine.
**Đọc trước**: `03-DATA-MODEL.md` (toàn bộ), `02-API-CONTRACT.md` §2–4 và §6, `07-SAFETY-GUARDRAILS.md` §4, `.claude/rules/backend-python.md`.
**Việc cần làm**
- `domain/models.py`: `SemanticFrame`, `TriageSummary`, `Alert`, enum; Pydantic v2, `null ≠ false`, validate khoảng (severity 0–10).
- `domain/events.py`: Envelope + payload model cho 5 event lõi và event phụ (xem `02`).
- `domain/ontology/*.json` + `loader.py` (theo `03` §4) + `drug_names.json` (từ điển nhỏ).
- `domain/rules_config.py`: ngưỡng, red-flag, từ khóa (cấu hình, không hard-code).
- `domain/parser.py`: `parse(frame_prev, patch, raw_input) -> ParseResult(frame, alerts, completeness)` thực hiện **toàn bộ bảng mâu thuẫn** ở `03` §3, ánh xạ từ khóa/synonym/gloss → Ontology.
- `domain/state_machine.py`: trạng thái phiên theo `02` §6.
- Test `tests/unit/`: mỗi mã mâu thuẫn ≥ 1 test dương + 1 test âm; test `null` không bị ép `false`; test red-flag.
**Không làm**: không FastAPI/WebSocket, không LLM, không I/O.
**DoD**: coverage `domain/` ≥ 90%; mypy strict sạch cho `domain/`; bảng mâu thuẫn `03` §3 được phủ 100%; không import `fastapi`/`httpx` trong `domain/`.

## PROMPT
```text
Thực hiện Phase P2 (Backend domain & Parser) cho AI4Care. Điều kiện: P1 đã DONE.
Đọc trước: AGENTS.md, docs/03-DATA-MODEL.md (toàn bộ), docs/02-API-CONTRACT.md (mục 2-4, 6), docs/07-SAFETY-GUARDRAILS.md (mục 4), .claude/rules/backend-python.md, docs/OPEN-QUESTIONS.md (đặc biệt Q-02, Q-07).

Hãy cài đặt trong backend/app/domain: models.py (SemanticFrame, TriageSummary, Alert), events.py, ontology JSON + loader, rules_config.py, parser.py, state_machine.py.
Parser phải thực hiện đầy đủ bảng quy tắc mâu thuẫn ở docs/03 mục 3 (ví dụ pain.present=false nhưng severity>0; allergy.has_allergy=false nhưng có tên thuốc), phát hiện trường thiếu, tính completeness, và cờ EMERGENCY_RED_FLAG từ cấu hình. null KHÔNG BAO GIỜ bị ép thành false.
Viết test đơn vị tương ứng (mỗi mã mâu thuẫn ≥ 1 test đúng + 1 test sai).

Ràng buộc: domain/ thuần Python, không import fastapi/httpx, không I/O. Mypy strict sạch. Nếu bạn thấy cần đổi schema, DỪNG và hỏi tôi, vì thay đổi sẽ chạm docs/02 và docs/03.
Bắt đầu bằng kế hoạch ≤ 10 dòng. Hoàn thành khi coverage domain ≥ 90%, make check xanh, rồi cập nhật docs/99-PROGRESS-LOG.md.
```
