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
| Camera | MediaPipe xử lý khung hình **trên trình duyệt**. Camera tùy chọn gửi tọa độ 3D bàn tay tới backend LAN để gợi ý cử chỉ. Với V2 theo Q-23, chuỗi **411 tọa độ thân, mặt và hai tay** được gửi qua LAN; không gửi ảnh/video, không đưa tọa độ/câu decoder vào LLM, không lưu vào phiên hoặc log. Q-16 giữ tương thích cho client tay cũ; Q-23 duyệt mở rộng ngày 19/11/2026. |
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

## 8. Kiểm tra bổ sung B0/B1 ngày 19/11/2026

Chủ dự án duyệt triển khai B0+B1 trong Q-20. Backend kiểm critical ack trước duyệt, chặn xác nhận PAIN_FALSE_BUT_SEVERITY, và chặn cập nhật dữ liệu sau duyệt. Phiếu đã duyệt cần phiên mới nếu sửa. Mỗi phiên có một câu hỏi dị ứng tổng quát đang chờ, chỉ nhận câu trả lời gắn đúng question_id và cần xác nhận lại toàn phiếu.

Các thẻ rà soát có biểu tượng, nhãn và giá trị chưa rõ. Chọn riêng vị trí không tự khẳng định có đau; Q-27 cho phép cả câu khẳng định đau và vùng đi cùng nhau sau khi người bệnh nhận gợi ý. Giữ lời khai bổ sung xuyên suốt dữ liệu cấu trúc, diễn đạt và bàn giao. Test bổ sung kiểm tra bỏ sót/phủ định triệu chứng đi kèm để kích hoạt fallback. Các quy tắc cảnh báo y tế và ngưỡng severity giữ theo cấu hình đã chốt.

## 9. Review V2 và ngoại lệ skill — Q-23

File skill `safety-review` mà tài liệu nhắc tới không có tại `.claude/skills/safety-review/SKILL.md` hoặc nơi đã tìm. Chủ dự án duyệt **review bằng checklist docs07 + tests** thay thế cho đợt V2 ngày 19/11/2026 (D-024), không miễn các ranh giới y tế.

- Không hiển thị trực tiếp câu decoder. Allowlist toàn câu, kiểm ngữ cảnh và điểm hữu hạn; phủ định/đa ý/chẩn đoán/lời khuyên/không biết vùng cụ thể → từ chối, không suy diễn.
- V2 không dùng LLM sinh văn bản y tế. Sau khi bệnh nhân nhập/xác nhận, tóm tắt vẫn đi qua validator và fallback hiện có; không bỏ bước xác nhận/duyệt/cảnh báo critical.
- Các guard chuyển động và điểm ≥ 0,7 là ngưỡng kỹ thuật **chưa hiệu chỉnh**. Tay nghỉ/ngoài danh mục người thật chưa được kiểm chứng. Có lỗi sốt → ho/đau đầu trong replay, vì vậy không công bố đã sẵn sàng lâm sàng.
- Theo Q-24, buffer của một câu Bắt đầu ký/Xong câu tối đa6giây/180frame; tối thiểu24frame/800ms. Quá giới hạn, mất tay/vai hoặc gap>500ms thì từ chối cả lượt; không tự gửi prefix/câu ghép. Xóa buffer khi đổi câu hỏi, dừng camera, reset hoặc unmount. Chỉ một HTTP chờ; abort + generation guard chặn kết quả cũ. Camera được cấp quyền muộn sau đóng màn hình phải dừng track ngay.
- Worker chỉ giữ model lâu dài, không giữ request cuối trong vòng chờ. Reset kết thúc worker và tăng generation chặn kết quả đang chạy. Không ghi raw input, tọa độ, tên file bệnh nhân hoặc câu dịch vào log. Tệp đánh giá công khai và fixture không phải dữ liệu phiên.
- Review dùng test mapping phủ định/đa ý/chẩn đoán, malformed input, unavailable runtime, reset/cancellation, UI Nhận/Áp dụng và E2E luồng xác nhận/critical/fallback. Các quyền riêng tư LAN/HTTPS và thử người dùng thật vẫn cần diễn tập trên thiết bị mục tiêu.

## 10. Thử nội bộ Q-24/Q-25

Chủ dự án duyệt capture theo câu và trang `/vsl-validation`, dữ liệu thử giả lập. Chỉ mở camera sau khi người tham gia tự nguyện bấm bắt đầu. Hai vai ở mọi frame phải có dữ liệu hợp lệ để tránh chia cho độ rộng gần0; failure vẫn UNKNOWN. Điểm0,7/allowlist/weights không đổi. Nhận/Áp dụng/xác nhận hai chiều và các guard y tế giữ nguyên.

Trang thử không tạo phiên bệnh nhân. Chỉ lưu nhãn kiểm soát, mã P01/P02/P03-D01/D02, split/điều kiện và timing trong RAM; xuất CSV theo yêu cầu người thử, không video/ảnh/landmark/câu decoder/tên/tình trạng sức khỏe thật. Kết quả thử rời rạc tách khỏi dữ liệu phiên y tế và không gửi LLM; bản xuất cá nhân để thư mục local Git ignore. Không tự bật webcam bằng agent hoặc ghi kết quả mô phỏng thành người thật. Q-26 xác nhận nhóm chưa biết VSL; lượt dương chưa có reference ký được kiểm tra giữ pending.

Lượt E2E có `evidence=synthetic` được ghi nhãn và loại khỏi gate người thật. Không công bố đạt tiêu chí chỉ vì test tự động qua. CLI không tự đóng băng; cần kết quả đúng split và xác nhận đánh giá cuối chưa dùng để tune. Từ chối nhiều hơn là trade-off cần ghi, không che lượt lỗi.


## 11. Review luồng nhận cả câu V2 — Q-27

Chủ dự án chọn giữ V2 theo câu, kế hoạch14. Không đổi checkpoint, extractor, điểm0,7, giới hạn capture hoặc quy tắc cảnh báo y tế. Chỉ context intake mới tạo gợi ý nhiều trường từ toàn câu trong allowlist. Không mở dịch hội thoại hoặc suy luận lâm sàng. Câu không đủ thông tin vẫn hỏi bổ sung bằng Chạm; không biến câu ho thành “không đau”, không đoán vị trí cụ thể từ bụng/lưng chung chung.

Một gợi ý được kiểm tra như một đơn vị, không có giỏ ghép các từ từ nhiều câu. Trước khi nhận không ghi bản nháp hoặc server. Sau khi nhận, patch đồng thời các trường liên quan và xóa detail cũ nếu ý thay đổi, có thông báo trước; chưa xác nhận toàn phiếu. Ngắt kết nối hoặc phiếu đổi làm hủy gợi ý/request cũ. Mọi bước patient confirmation, Post-LLM Validator/fallback, critical ack và khóa sau duyệt tiếp tục tại backend như trước.

Review bằng checklist và tests theo Q-23: ánh xạ toàn câu, từ chối phủ định/đa ý, nhận/sửa/bỏ, patch đồng thời, xóa detail cũ, không phủ định dữ liệu chưa hỏi, stale response, đồng bộ hai màn và xác nhận/duyệt/reset. Các lượt tự động dùng đầu vào mô phỏng, không tính thành lượt VSL thật. Profile mới tách khỏi11ca âm profile4e4ebb; các kết quả cũ vẫn giữ baseline. Chưa có lượt dương được người biết VSL xác minh, trạng thái model vẫn CANDIDATE.

Theo Q-28, lỗi worker ở luồng intake phải hiển thị lựa chọn thử lại hoặc Chạm. Một phản hồi HTTP thành công có thể mang lỗi xử lý và không được tính là ca âm đạt. Chỉ báo mặt, vai và từng tay dùng các nhóm landmark của khung hình hiện tại để người thử chỉnh tư thế. Điều kiện bắt đầu và ngưỡng nhận diện giữ theo Q-24.

Q-29 đã được chủ dự án duyệt ngày20/11/2026. Lý do từ chối intake được ánh xạ sang mã kiểm soát và lời nhắc cố định. Câu decoder/điểm token không trả thêm ra UI, không ghi log hoặc vào phiếu. Điểm thiếu/không hợp lệ không được diễn giải thành model_score_low. Thông báo phrase_not_supported mô tả đầu ra nhận diện; chưa quy lỗi cho người ký. Ngưỡng0,7, guard chuyển động/vai/capture và bước Nhận/Sửa tiếp tục áp dụng.
