# 02 — API CONTRACT (WebSocket + REST)

> Nguồn sự thật cho giao tiếp giữa `/patient`, `/nurse` (và `/doctor` nếu có) với FastAPI. Đổi contract = cập nhật Pydantic + TypeScript + file này + test.

## 1. Kết nối
- WebSocket: `ws://<host>:8000/ws/{session_id}?role=patient|nurse|doctor&token=<session_token>`
- `session_id`: UUID v4. `pairing_code`: 6 ký tự A–Z/2–9 (bỏ ký tự dễ nhầm `O,0,I,1`), hết hạn sau 10 phút nếu chưa ghép.
- Mỗi session có tối đa 1 `patient`, 1 `nurse`, 0–1 `doctor`. Kết nối thứ hai cùng role → đóng kết nối cũ (code 4001).
- Heartbeat: client gửi `PING` mỗi 20 s; server trả `PONG`. Mất > 60 s → đánh dấu `disconnected`, giữ dữ liệu phiên 2 phút để reconnect.
- Reconnect: client gửi lại `last_seq` trong query → server phát lại các event bị lỡ (buffer 100 event).

## 2. Envelope chung (mọi event)
```json
{
  "event": "INPUT_UPDATED",
  "session_id": "b0f1c1a2-...",
  "seq": 17,
  "ts": "2026-11-07T08:30:12.123Z",
  "source": "patient",
  "payload": { }
}
```
| Trường | Kiểu | Ghi chú |
|---|---|---|
| `event` | enum | xem §3 |
| `seq` | int | server gán, tăng dần theo phiên |
| `source` | `patient` \| `nurse` \| `doctor` \| `server` | |
| `payload` | object | theo từng event |

Lỗi: `{"event":"ERROR","payload":{"code":"VALIDATION_ERROR","message_vi":"...","detail":{}}}`. Mã lỗi: `VALIDATION_ERROR`, `SESSION_NOT_FOUND`, `FORBIDDEN_ROLE`, `LLM_FALLBACK_USED` (thông tin, không phải lỗi), `RATE_LIMITED`.

## 3. Danh sách event
| Event | Hướng | Khi nào |
|---|---|---|
| `SESSION_JOINED` | server → all | Có client vào phiên |
| `INPUT_UPDATED` | patient → server → all | Bệnh nhân đổi bất kỳ ô nhập |
| `SUMMARY_REQUESTED` | patient → server | Bệnh nhân bấm "Xong" |
| `SUMMARY_READY` | server → all | Parser + LLM + Validator xong |
| `PATIENT_CONFIRMED` | patient → server → all | Bệnh nhân xác nhận / sửa |
| `NURSE_QUESTION` | nurse → server → patient | Y tá gửi câu hỏi bổ sung |
| `NURSE_VERIFIED` | nurse → server → all | Y tá duyệt phiếu |
| `RECORD_EXPORTED` | nurse → server → all | Y tá xuất hồ sơ cho bác sĩ (NEEDS-CONFIRM Q-03) |
| `REQUEST_INTERPRETER` | patient/nurse → server → all | Gọi phiên dịch VRI / nhân viên |
| `INTERPRETER_STATUS` | server → all | `requested` → `connecting` → `connected` → `ended` (MVP: mock) |
| `SESSION_RESET` | nurse/server → all | Kết thúc & xóa dữ liệu |
| `PING` / `PONG` | both | Heartbeat |
| `ERROR` | server → client | Lỗi |

## 4. Payload từng event

### 4.1 `INPUT_UPDATED` (patient → server → all)
Client gửi **phần thay đổi** (patch). Server gộp vào frame hiện tại, chạy Parser, rồi broadcast.
```json
// Client → Server
{
  "event": "INPUT_UPDATED",
  "payload": {
    "step": "pain_details",
    "modality": "touch",
    "patch": {
      "chief_complaint": { "code": "PAIN", "free_text": null },
      "pain": { "present": true, "severity": 7, "body_regions": ["CHEST"], "onset": { "value": 2, "unit": "hour" } },
      "allergy": null
    },
    "raw_input": { "type": "touch", "text": null, "gloss": null }
  }
}
// Server → All (sau khi parse)
{
  "event": "INPUT_UPDATED",
  "source": "server",
  "payload": {
    "frame": { "...SemanticFrame đầy đủ, xem 03-DATA-MODEL.md..." },
    "alerts": [
      { "code": "MISSING_ALLERGY", "level": "warning", "field": "allergy", "message_vi": "Chưa khai dị ứng" }
    ],
    "completeness": 0.7,
    "step": "pain_details"
  }
}
```
- `modality` ∈ `touch` | `text` | `vsl_gloss` | `voice`.
- `raw_input.text` chỉ dùng cho tìm từ khóa Ontology; **không** gửi nguyên văn tới LLM nếu chứa định danh (xem `07`).
- `raw_input.gloss`: mảng gloss `["ĐAU","NGỰC","HAI","GIỜ"]` + `confidence` từng gloss.

### 4.2 `SUMMARY_REQUESTED` (patient → server)
```json
{ "event": "SUMMARY_REQUESTED", "payload": { "language": "vi", "reading_level": "simple" } }
```

### 4.3 `SUMMARY_READY` (server → all)
```json
{
  "event": "SUMMARY_READY",
  "source": "server",
  "payload": {
    "summary": { "...TriageSummary, xem 03-DATA-MODEL.md..." },
    "nl_text_vi": "Bạn bị đau ở ngực, mức 7/10, bắt đầu cách đây 2 giờ. Bạn không bị dị ứng.",
    "nl_source": "llm",
    "validator": { "passed": true, "violations": [] },
    "tts_text": "Bạn bị đau ở ngực, mức bảy trên mười..."
  }
}
```
- `nl_source` ∈ `llm` | `fallback_template`. Khi `fallback_template`, kèm `fallback_reason` ∈ `timeout` | `llm_error` | `validator_blocked`.
- Câu viết ở ngôi thứ hai cho bệnh nhân (xác nhận): "Bạn …". Bản cho y tá dùng `summary.nurse_view`.

### 4.4 `PATIENT_CONFIRMED` (patient → server → all)
```json
{
  "event": "PATIENT_CONFIRMED",
  "payload": {
    "decision": "confirmed",
    "corrections": [],
    "confirmed_fields": ["chief_complaint", "pain", "allergy"]
  }
}
```
- `decision` ∈ `confirmed` | `needs_edit` | `unsure`.
- `needs_edit` → server đặt `status = draft`, bệnh nhân quay lại wizard, `confirmed_fields` rỗng.
- `unsure` → server tự sinh alert `PATIENT_UNSURE` + gợi ý bật `REQUEST_INTERPRETER` phía y tá.

### 4.5 `NURSE_QUESTION` (nurse → server → patient)
```json
{
  "event": "NURSE_QUESTION",
  "payload": {
    "question_id": "q-allergy-drug",
    "template_code": "ASK_DRUG_ALLERGY",
    "text_vi": "Bạn có dị ứng thuốc nào không?",
    "answer_type": "yes_no_unsure",
    "icon": "pill"
  }
}
```
Bệnh nhân trả lời bằng `INPUT_UPDATED` có `reply_to: "q-allergy-drug"`.

### 4.6 `NURSE_VERIFIED` (nurse → server → all)
```json
{
  "event": "NURSE_VERIFIED",
  "payload": {
    "intake_code": "AC-0042",
    "queue_number": 42,
    "verified_by": "nurse-station-1",
    "notes": null,
    "acknowledged_alerts": ["MISSING_ALLERGY"]
  }
}
```
- Chỉ hợp lệ khi `status == patient_confirmed`. Nếu chưa → `ERROR: VALIDATION_ERROR`.
- `queue_number` = **STT (số thứ tự)** do y tá nhập hoặc server gán tự tăng trong demo.

### 4.7 `RECORD_EXPORTED` (NEEDS-CONFIRM Q-03)
```json
{
  "event": "RECORD_EXPORTED",
  "payload": { "format": "pdf", "include": ["queue_number","intake_code","confirmed_symptoms","alerts"], "target": "doctor" }
}
```
File được tạo **phía client** từ dữ liệu phiên (không lưu trên server).

### 4.8 `REQUEST_INTERPRETER`
```json
{
  "event": "REQUEST_INTERPRETER",
  "payload": {
    "reason": "low_confidence",
    "requested_by": "patient",
    "urgency": "normal",
    "language": "VSL"
  }
}
```
- `reason` ∈ `low_confidence` | `patient_unsure` | `nurse_request` | `conflict_unresolved` | `emergency_flag`.
- `urgency` ∈ `normal` | `urgent`. `emergency_flag` ép `urgent`.

### 4.9 `SESSION_RESET`
```json
{ "event": "SESSION_RESET", "payload": { "reason": "completed", "wipe": true } }
```
- `reason` ∈ `completed` | `timeout` | `manual` | `error`.
- Server: xóa frame, summary, buffer event, đóng WS (code 1000). Client: `sessionStorage.clear()`, dừng camera/TTS, về màn hình chờ.

## 5. REST (phụ trợ)
| Method | Path | Mô tả |
|---|---|---|
| POST | `/api/sessions` | Tạo phiên (y tá). Trả `{session_id, pairing_code, token_nurse}` |
| POST | `/api/sessions/join` | Bệnh nhân ghép cặp `{pairing_code}` → `{session_id, token_patient}` |
| GET | `/api/health` | `{status, llm_mode: "live"|"mock"}` |
| GET | `/api/ontology` | Ontology dạng JSON (icon, nhãn, vùng cơ thể) cho frontend |
| POST | `/api/dev/force-fallback` | (chỉ `ENV=demo`) ép LLM lỗi để minh họa Fallback |

## 6. Quy tắc trạng thái phiên
```
created → paired → collecting → summary_ready → patient_confirmed → nurse_verified → exported? → reset
                       ↑______________ needs_edit ______________|
```
- Mọi `INPUT_UPDATED` sau `patient_confirmed` đưa trạng thái về `collecting` và xóa dấu xác nhận.
- `REQUEST_INTERPRETER` không đổi trạng thái chính; thêm cờ `interpreter_requested = true`.
