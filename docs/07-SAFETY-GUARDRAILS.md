# 07 — SAFETY & PRIVACY GUARDRAILS

> File quan trọng nhất. Mọi thay đổi chạm prompt LLM, Validator, copy hiển thị cho bệnh nhân, hoặc cách lưu dữ liệu phải qua skill `safety-review`.

## 1. Nguyên tắc
1. AI chỉ **diễn đạt lại** thông tin bệnh nhân đã khai. Không thêm, không suy luận, không đánh giá.
2. Thiếu hoặc mâu thuẫn → **nói rõ là thiếu/mâu thuẫn** và để y tá hỏi lại.
3. Fail-safe: mọi lỗi → Fallback Template + cảnh báo cho y tá; không bao giờ để trống hay đoán.
4. Con người luôn có đường thoát: nút "Gọi phiên dịch/nhân viên" luôn hiện trên cả hai màn hình.

## 2. System Prompt cho LLM (bản chuẩn — lưu ở `backend/app/ai/prompts/summary_system_vi.txt`)
```
Bạn là bộ diễn đạt lại thông tin tiếp nhận ban đầu tại quầy bệnh viện cho người Điếc và người khó khăn về lời nói.
Bạn KHÔNG phải bác sĩ, y tá hay dược sĩ.

NHIỆM VỤ: Chuyển Semantic Frame (JSON) thành 1 đoạn tiếng Việt ngắn, đơn giản (tối đa 4 câu, mỗi câu ≤ 15 từ), ngôi thứ hai "Bạn", để bệnh nhân xác nhận.

QUY TẮC BẮT BUỘC:
1. CHỈ dùng thông tin có trong JSON. Không thêm chi tiết nào.
2. KHÔNG chẩn đoán, KHÔNG nêu tên bệnh, KHÔNG nói "có thể là", "nghi ngờ", "dấu hiệu của".
3. KHÔNG kê đơn, KHÔNG gợi ý thuốc, liều dùng, cách điều trị hay tự chăm sóc.
4. KHÔNG đánh giá mức độ nguy hiểm, KHÔNG trấn an ("không sao", "đừng lo").
5. Trường có giá trị null nghĩa là CHƯA BIẾT: viết "Chưa rõ: <tên trường>". Không tự điền.
6. Nếu có conflicts, viết một câu: "Thông tin chưa khớp, y tá sẽ hỏi lại bạn." và không giải quyết mâu thuẫn.
7. Chỉ nhắc tên thuốc nếu nó nằm trong allergy.items của JSON, và chỉ như một chất bệnh nhân khai bị dị ứng.
8. Chỉ trả về JSON: {"text_vi": "..."} — không markdown, không lời dẫn.

Dữ liệu: {{frame_json}}
```
Cấu hình gọi: `temperature=0`, `max_tokens=200`, `timeout=4s`, 0 retry (hoặc 1 retry nếu còn < 2 s).

## 3. Post-LLM Validator (`backend/app/ai/validator.py`)
Chạy theo thứ tự; vi phạm bất kỳ → `passed=false` → Fallback Template (`fallback_reason=validator_blocked`).
| # | Kiểm tra | Cách làm |
|---|---|---|
| V1 | Đúng định dạng | JSON hợp lệ, có `text_vi` kiểu string, ≤ 400 ký tự, ≤ 4 câu |
| V2 | Không chẩn đoán | Regex/từ khóa (không phân biệt hoa/thường, bỏ dấu): `chẩn đoán`, `có thể là`, `nghi ngờ`, `dấu hiệu của`, `bị bệnh`, `mắc bệnh`, `viêm`, `ung thư`, `nhồi máu`, `đột quỵ`, `tiểu đường`, `huyết áp cao`, `covid`, `lao`, `suy `, `hội chứng`, `diagnos`, `likely`, `probably` |
| V3 | Không kê đơn/điều trị | `nên uống`, `hãy uống`, `dùng thuốc`, `liều`, `\d+\s?(mg|ml|mcg|g)\b`, `viên`, `tiêm`, `truyền`, `kê đơn`, `điều trị`, `phẫu thuật`, `nghỉ ngơi`, `chườm`, `paracetamol`, `ibuprofen` … (từ `drug_names.json`) |
| V4 | Tên thuốc chỉ hợp lệ khi echo dị ứng | Tên thuốc có trong văn bản nhưng không có trong `frame.allergy.items` → vi phạm |
| V5 | Không trấn an/đánh giá | `không sao`, `đừng lo`, `nhẹ thôi`, `nghiêm trọng`, `nguy hiểm`, `khẩn cấp` (khẩn cấp do hệ thống, không do LLM) |
| V6 | Không thêm dữ kiện | Mọi số trong văn bản phải ∈ tập số trong frame; mọi vùng cơ thể nhắc tới phải ∈ `body_regions` (so khớp qua từ đồng nghĩa Ontology) |
| V7 | Phản ánh thiếu/mâu thuẫn | Nếu `missing_fields` hoặc `conflicts` không rỗng → văn bản phải chứa "Chưa rõ" hoặc "chưa khớp" |
| V8 | Ngôn ngữ | Chủ yếu tiếng Việt (≥ 90% ký tự chữ cái là Latin có dấu/không dấu tiếng Việt) |

Test bắt buộc: bộ test `tests/safety/` gồm ≥ 30 câu "độc hại" mẫu (chẩn đoán, kê đơn, trấn an, thêm dữ kiện) **phải bị chặn**, và ≥ 15 câu hợp lệ **phải qua**.

## 4. Cờ khẩn cấp (red-flag) — chỉ chuyển tiếp, không đánh giá
Rule-based trong Parser, KHÔNG dùng LLM. Khi khớp: `emergency_flag=true`, alert `critical`, màn hình y tá nháy đỏ + âm báo, màn hình bệnh nhân hiện "Đang gọi nhân viên hỗ trợ ngay" (không giải thích y khoa).
Danh sách seed (cần chuyên gia y tế rà soát — Q-07): `BREATH_DIFFICULTY`; `BLEED` kèm mức đau ≥ 8; `CHEST` kèm `severity ≥ 8`; bất kỳ vùng nào `severity == 10`; bệnh nhân bấm nút "Cần giúp ngay".

## 5. Quyền riêng tư (Privacy-by-design)
| Yêu cầu | Cách thực hiện |
|---|---|
| Không lưu lâu dài | Backend giữ dữ liệu trong `dict` RAM theo `session_id`; không ghi đĩa, không DB, log không chứa nội dung bệnh nhân |
| Frontend | Chỉ `sessionStorage`; không `localStorage`, không cookie theo dõi |
| Xóa sạch | `SESSION_RESET` (hoàn tất / idle 10 phút / thủ công) → xóa RAM, sessionStorage, dừng camera + TTS, revoke object URL |
| Camera | Xử lý khung hình **trên trình duyệt**; không upload video; chỉ gửi gloss + confidence |
| LLM | Chỉ gửi `SemanticFrame` đã ẩn danh; `free_text` bị loại hoặc che (`[REDACTED]`) nếu chứa số điện thoại/CCCD/email (regex) |
| Log | Chỉ ghi: `session_id` băm, event, thời gian, kết quả validator. Không ghi payload |
| Hiển thị | Hiển thị rõ cho bệnh nhân: "Thông tin sẽ bị xóa khi kết thúc" |
| Xuất hồ sơ | Tạo file phía client; sau xuất, nhắc y tá lưu đúng nơi theo quy định bệnh viện (ngoài phạm vi hệ thống) |

## 6. Ngôn từ hiển thị cho bệnh nhân (UX safety)
- Dùng câu ngắn, chủ động, không thuật ngữ y khoa.
- Không dùng màu đỏ cho nút bình thường (đỏ dành cho khẩn cấp/cảnh báo).
- Nhãn "Đã xác nhận" chỉ hiện sau `PATIENT_CONFIRMED`.
- Luôn có dòng: "Hệ thống chỉ ghi lại thông tin bạn khai. Bác sĩ sẽ khám và quyết định."

## 7. Checklist review an toàn (dùng cho PR)
- [ ] Không có chuỗi nào trong UI/prompt/template đưa ra chẩn đoán, lời khuyên, liều lượng.
- [ ] `null` không bị ép thành `false`.
- [ ] Mọi đường lỗi đều có Fallback + cảnh báo.
- [ ] Không log nội dung bệnh nhân; không `localStorage`.
- [ ] Test an toàn mới được thêm cho mọi quy tắc mới.
- [ ] Đường thoát "Gọi phiên dịch/nhân viên" vẫn hiện ở mọi bước.
