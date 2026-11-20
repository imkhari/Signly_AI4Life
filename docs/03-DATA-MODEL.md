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

## 7. Quy ước B1 được duyệt ngày 19/11/2026

Giữ schema_version 1.0. chief_complaint giữ lý do chính, extra_symptoms giữ mã các triệu chứng đi kèm hiện diện. Xóa mã khỏi extra_symptoms nghĩa là bỏ lựa chọn, chưa biểu diễn một câu trả lời phủ định có cấu trúc. Chạm hoặc camera theo context symptom/location chỉ tác động mục đang hỏi; ngoại lệ intake theo Q-27 được mô tả bên dưới. Chọn vị trí giữ nguyên pain.present, chỉ câu trả lời rõ về đau mới đặt true/false.

Phiếu trực quan cho sửa lý do chính, tình trạng/vị trí đau, mức đau, thời gian, triệu chứng đi kèm và dị ứng. Nhận ứng viên là chọn giá trị. PATIENT_CONFIRMED tiếp tục xác nhận toàn phiếu. Sửa trước duyệt hủy xác nhận toàn phiếu, tạo summary mới. Sau duyệt giữ phiếu chỉ xem và cần phiên mới để sửa.

Triệu chứng đi kèm phải hiện trong phiếu, nurse_view, tóm tắt/fallback và bản in. Validator từ chối đầu ra bỏ sót hoặc phủ định nhãn extra_symptoms đã khai và chuyển sang fallback. Mức độ bao phủ ngôn ngữ của validator vẫn được đánh giá bằng test cụ thể.

Câu trả lời dị ứng có reply_to trỏ tới câu hỏi còn hiệu lực. Có dị ứng nhưng chưa có tên vẫn là mục cần hỏi lại. B1 dùng câu hỏi dị ứng tổng quát để ánh xạ đúng allergy.has_allergy.

## 8. Gợi ý từ V2 — Q-23

Schema SemanticFrame vẫn **1.0**. `HolisticFrame` chỉ là đầu vào tạm cho REST, không phải trường lưu trong frame/phiếu. Decoder V2 có 442 token tiếng Việt; CTC head 374 lớp thiếu class order xác minh nên bị tắt xuất gloss. Chỉ nhãn có sẵn trong ontology được gợi ý theo ngữ cảnh, không thêm slot hoặc suy đoán dữ kiện.

Ví dụ “tôi bị đau đầu” → symptom ĐAU hoặc location ĐẦU; “tôi bị đau bụng” chỉ gợi ý ĐAU, **không tự chọn ABDOMEN_UPPER** vì chưa biết bụng trên/dưới. “tôi bị đau lưng” không tự chọn LOWER_BACK. Câu phủ định hoặc đa ý chưa biểu diễn an toàn → UNKNOWN, dùng Chạm/hỏi nhân viên. Không lấy số từ câu dịch để điền mức đau/thời gian. Chọn Nhận vẫn chưa xác nhận toàn phiếu.

Q-24: một câu có Bắt đầu ký/Xong câu tạo tối đa một gợi ý; không tự áp dụng kết quả. Shape SemanticFrame vẫn1.0. Kết quả thử camera được giữ riêng dưới schema trial của công cụ nội bộ, không ghi vào SemanticFrame hay gửi tới LLM.


## 8. Gợi ý theo cả câu V2 — Q-27

`IntakeSuggestion` là dữ liệu chuyển tiếp của REST camera (`backend/app/domain/vsl.py`, `frontend/src/types/vsl.ts`), không phải field mới của SemanticFrame1.0. Một câu hợp lệ ánh xạ đồng thời lý do và thông tin đau được khẳng định rõ. PAIN/true/CHEST chỉ được ghi cùng nhau khi người bệnh bấm Dùng thông tin này; chưa đặt dấu PATIENT_CONFIRMED.

Câu ho/sốt/khó thở không chứa phủ định đau: pain_present=null, không false. Bụng/lưng chung chung chưa có mã vùng tương ứng trong ontology: danh sách rỗng, hỏi tiếp bằng hình. Mức đau/thời gian vẫn null cho đến khi người dùng chọn; không trích số tự do hoặc ghép nhãn từ các câu. Nếu thay thông tin liên quan, xóa mức đau/thời gian cũ để hỏi lại, giữ dị ứng và triệu chứng khác. Một câu nhiều ý hoặc phủ định chưa được hỗ trợ vẫn UNKNOWN.

Sau gợi ý: vị trí/tình trạng đau nếu thiếu → mức đau khi có đau → thời gian → triệu chứng đi kèm → dị ứng → toàn phiếu → điều dưỡng. Có Chưa rõ; dữ liệu thiếu tiếp tục do parser đánh dấu uncertain/missing, không tự hoàn thành.

Q-28 bổ sung ý nghĩa `worker_unavailable` của trường hướng dẫn trong phản hồi camera intake. Lỗi này không tạo gợi ý, không ghi Semantic Frame và không đưa dữ liệu vào LLM.

Q-29 mở rộng tập mã kiểm soát của suggested_next_step trong phản hồi camera intake: hand_motion_unclear, model_score_low và phrase_not_supported. Các trường gợi ý ngữ nghĩa vẫn để null khi bị từ chối. CSV thử nội bộ tiếp tục dùng reason unknown, chỉ hiển thị lời hướng dẫn cụ thể trong RAM của UI.
