# 03 — DATA MODEL (Semantic Frame, Ontology, TriageSummary)

> Không có database. Dữ liệu sống trong **RAM backend theo phiên** và **sessionStorage frontend**. Xóa khi `SESSION_RESET`.

## 1. SemanticFrame (`schema_version: "1.0"`)
```jsonc
{
  "schema_version": "1.0",
  "session_id": "uuid",
  "modality": ["touch"],                 // touch | text | vsl_gloss | voice (có thể nhiều)
  "chief_complaint": {
    "code": "PAIN",                      // mã Ontology; null nếu chưa chọn
    "label_vi": "Đau",
    "free_text": null                    // chuỗi bệnh nhân nhập, chỉ dùng nội bộ
  },
  "pain": {
    "present": true,                     // true | false | null (chưa trả lời)
    "severity": 7,                       // 0..10 | null
    "body_regions": ["CHEST"],           // mã vùng cơ thể trong Ontology
    "onset": { "value": 2, "unit": "hour" },   // unit: minute|hour|day|week|month | null
    "course": null                       // sudden|gradual|constant|comes_and_goes | null
  },
  "allergy": {
    "has_allergy": false,                // true | false | "unsure" | null
    "items": []                          // [{ "category": "drug|food|other", "name": "penicillin" }]
  },
  "extra_symptoms": [],                  // mã Ontology (FEVER, COUGH, BREATH_DIFFICULTY, ...)
  "uncertain_fields": [],                // tên trường Parser/đầu vào không chắc chắn
  "field_confidence": { "pain.severity": 1.0 },   // 0..1; touch=1.0, gloss theo mô hình
  "conflicts": [],                       // xem §3
  "missing_fields": ["allergy.has_allergy"]
}
```
Quy tắc:
- `null` nghĩa là **chưa biết**, khác `false` nghĩa là **bệnh nhân đã trả lời "không"**. Không bao giờ ép `null → false`.
- Mọi trường do bệnh nhân nhập qua cảm ứng có `field_confidence = 1.0`; qua gloss/văn bản lấy từ nguồn nhận dạng.
- Không có trường định danh (tên, ngày sinh, CCCD, SĐT) trong frame.

## 2. TriageSummary
```jsonc
{
  "session_id": "uuid",
  "intake_code": "AC-0042",              // mã tiếp nhận hiển thị cho y tá
  "queue_number": 42,                    // STT = số thứ tự; null cho tới khi y tá/hệ thống gán
  "status": "summary_ready",             // collecting|summary_ready|patient_confirmed|nurse_verified|exported
  "frame": { "...SemanticFrame..." },
  "nl_text_vi": "Bạn bị đau ở ngực...",
  "nl_source": "llm",                    // llm | fallback_template
  "fallback_reason": null,
  "validator": { "passed": true, "violations": [] },
  "alerts": [ /* Alert[] */ ],
  "nurse_view": {
    "confirmed": [ { "label_vi": "Đau ngực", "detail": "mức 7/10, 2 giờ trước" } ],
    "needs_attention": [ { "level": "warning", "message_vi": "Chưa khai dị ứng" } ]
  },
  "flags": { "interpreter_requested": false, "emergency_flag": false },
  "timestamps": { "created": "iso8601", "patient_confirmed": null, "nurse_verified": null }
}
```
`Alert`: `{ "code": str, "level": "info"|"warning"|"critical", "field": str|null, "message_vi": str, "needs_nurse_ack": bool }`.

## 3. Quy tắc mâu thuẫn & thiếu dữ liệu (Parser)
| Mã | Điều kiện | Mức | Hành động |
|---|---|---|---|
| `PAIN_FALSE_BUT_SEVERITY` | `pain.present == false` và `severity > 0` | warning | Hỏi lại bệnh nhân; chặn `PATIENT_CONFIRMED` tới khi sửa |
| `PAIN_TRUE_NO_SEVERITY` | `pain.present == true` và `severity is null` | warning | Thiếu trường |
| `PAIN_TRUE_NO_REGION` | `present == true` và `body_regions == []` | warning | Thiếu trường |
| `PAIN_FALSE_BUT_REGION` | `present == false` và có `body_regions` | warning | Mâu thuẫn |
| `ALLERGY_FALSE_BUT_ITEMS` | `has_allergy == false` và `items` không rỗng | critical | Mâu thuẫn nguy cơ cao; y tá phải ack |
| `ALLERGY_TRUE_NO_ITEMS` | `has_allergy == true` và `items == []` | warning | Hỏi tên chất gây dị ứng |
| `ALLERGY_UNSURE` | `has_allergy == "unsure"` | critical | Y tá phải hỏi lại, gợi ý phiên dịch |
| `MISSING_ALLERGY` | `has_allergy is null` | warning | Thiếu trường |
| `MISSING_ONSET` | `pain.present == true` và `onset is null` | info | Thiếu trường |
| `TEXT_MENTIONS_DRUG_NOT_DECLARED` | `free_text` chứa tên thuốc (từ điển) nhưng `allergy.items` không có | warning | Hỏi xác nhận |
| `LOW_CONFIDENCE_GLOSS` | gloss có confidence < 0.6 | warning | Hiện cho bệnh nhân chọn lại; gợi ý phiên dịch |
| `EMERGENCY_RED_FLAG` | khớp danh sách red-flag (xem `07` §4) | critical | Đặt `emergency_flag`, đề xuất `REQUEST_INTERPRETER urgent` và gọi nhân viên NGAY |
| `PATIENT_UNSURE` | bệnh nhân chọn "không chắc" ở bước xác nhận | warning | Gợi ý phiên dịch |

Ngưỡng và danh sách red-flag là **cấu hình** (`backend/app/domain/rules_config.py`), không hard-code trong logic. Cần chuyên gia y tế rà soát trước demo (Q-07).

## 4. Ontology (seed MVP)
Lưu tại `backend/app/domain/ontology/*.json`, phục vụ qua `GET /api/ontology`.
Mỗi mục: `{ "code", "label_vi", "icon", "synonyms_vi": [], "vsl_gloss": [] }`.

**Lý do khám (`chief_complaint`)**: `PAIN` Đau · `FEVER` Sốt · `COUGH` Ho · `BREATH_DIFFICULTY` Khó thở · `DIZZY` Chóng mặt · `NAUSEA_VOMIT` Buồn nôn/Nôn · `INJURY` Chấn thương · `BLEED` Chảy máu · `RASH` Nổi mẩn · `CHECKUP` Khám định kỳ · `OTHER` Khác.

**Vùng cơ thể (`body_regions`)**: `HEAD` · `NECK` · `CHEST` · `UPPER_BACK` · `ABDOMEN_UPPER` · `ABDOMEN_LOWER` · `LOWER_BACK` · `ARM_L` · `ARM_R` · `HAND_L` · `HAND_R` · `LEG_L` · `LEG_R` · `FOOT_L` · `FOOT_R` (SVG có mặt trước/sau).

**Thời gian (`onset.unit`)**: `minute` · `hour` · `day` · `week` · `month`.

**Dị ứng — nhóm**: `drug` Thuốc · `food` Thức ăn · `other` Khác. Từ điển tên thuốc phổ biến (chỉ để **phát hiện** mention, không để tư vấn): `backend/app/domain/ontology/drug_names.json`.

**Gloss VSL (`vsl_gloss`)**: danh sách gloss rời rạc MVP (≤ 15) ví dụ `ĐAU`, `SỐT`, `HO`, `NGỰC`, `BỤNG`, `ĐẦU`, `KHÓ-THỞ`, `DỊ-ỨNG`, `KHÔNG`, `CÓ`, `HÔM-NAY`, `HAI`, `GIỜ`, `NGÀY`. Bảng gloss cuối cùng cần xác nhận với người dùng VSL (Q-05).

## 5. Fallback Template (khi LLM lỗi/timeout/bị Validator chặn)
Ghép câu cố định từ frame, không dùng LLM:
```
Bạn đến khám vì: {chief_complaint.label_vi}.
{nếu pain.present}: Bạn đau ở {body_regions → "ngực, bụng"}. Mức đau: {severity}/10. Bắt đầu cách đây {onset}.
{nếu pain.present == false}: Bạn không đau.
Dị ứng: {Không / Có: <items> / Chưa rõ}.
```
Tên template + test: `backend/app/ai/fallback_template.py`.

## 6. Lưu ý đồng bộ
Pydantic (`backend/app/domain/models.py`) ⇄ TypeScript (`frontend/src/types/frame.ts`) phải khớp 1-1 về tên trường. Dùng `pydantic → JSON Schema → json-schema-to-typescript` nếu kịp; nếu không, sửa tay và thêm test hợp đồng (`tests/contract/`).
