# Bằng chứng dùng trong bộ slide

Chuẩn bị 19/11/2026. Chỉ dùng bằng chứng trong repo; không dùng số liệu thị trường hoặc tác động bệnh viện chưa có nguồn. Không coi tài liệu pitch cũ là kết quả nghiên cứu.

| Nội dung | Slide | Nguồn có thể kiểm tra trong repo | Giới hạn |
|---|---|---|---|
| Bài toán và phạm vi tiếp nhận | 2–3 | `AGENTS.md`, `docs/00-PRD.md` | Bài toán thiết kế, chưa phải khảo sát bệnh viện. |
| Luồng xác nhận hai chiều | 4–7 | `docs/02-API-CONTRACT.md`, `docs/03-DATA-MODEL.md`, `frontend/e2e/demo.spec.ts`, `frontend/e2e/presentation.spec.ts` | Kiểm tra phần mềm, chưa chứng minh dễ hiểu với người dùng. |
| Model camera V2 tùy chọn | 8, 14 | `AI_model/vsl_v2/README.md`, `backend/app/ai/vsl_v2.py`, `AI_model/vsl_v2/model-manifest.json` | Greedy tiếng Việt, lọc câu qua allowlist, không dịch VSL tổng quát. |
| LLM mock và parser theo luật | 8 | `docs/DECISIONS.md` D-005/D-017, `backend/app/ai/`, `docs/05-TECH-STACK.md` | Máy chủ demo dùng `llm_mode=mock`; không mô tả là LLM live. |
| 255/300 khớp câu | 9 | `AI_model/vsl_v2/reports/post-guard-replay.json`: `metrics.exact_matches=255`, `metrics.clips=300` | Sau guard mất vai; replay NPY test của S06, không webcam. |
| WER 9,50% | 9 | Cùng báo cáo: 205 edits / 2157 reference tokens | Từ tiếng Việt, giữ token dấu câu; không là WER gloss CTC. |
| Một mẫu mất vai bị từ chối | 9 | `rejected_clips=1` trong cùng báo cáo | 299 output còn lại tái hiện output được cung cấp; không kết luận tổng quát hóa. |
| Giới hạn replay | Notes 9, 14 | `docs/validation/vsl-v2/RESULTS.md`, `freeze-baseline-audit.json` | 3 clip dài hơn 180 frame camera; 65 reference khác annotation công khai. |
| Hai mẫu sốt còn sai | 9 | `docs/validation/vsl-v2/RESULTS.md`, `pipeline-after.json` | Có đầu ra HO/ĐAU. Không quảng bá sốt nhận tốt. |
| Camera CANDIDATE | 9 | `docs/validation/vsl-v2/FREEZE.md`, `metrics.json`, `RESULTS.md` | Một lượt CSV cũ quá giới hạn, không response API; bản mới chưa có lượt trực tiếp. |
| Safety/privacy | 10 | `docs/07-SAFETY-GUARDRAILS.md`, `docs/02-API-CONTRACT.md`, tests safety/integration | Guardrails kỹ thuật, chưa được thẩm định lâm sàng. Phiếu đã xuất không tự xóa. |
| Thử người dùng, đo thời gian | 11 | `docs/validation/RESULTS.md`, Q-18/Q-26 | Là kế hoạch; chưa có người dùng mục tiêu/điều dưỡng tham gia được ghi nhận. |
| Kiến trúc | 13 | `docs/08-ARCHITECTURE.md`, `docs/05-TECH-STACK.md` đối chiếu code | MVP không có database, HIS/EMR hoặc dịch vụ phiên dịch thật. |

## Nguồn ảnh

Tất cả ảnh UI trong `screenshots/` được chụp từ app chạy thật bằng trình duyệt tự động và dữ liệu giả lập. `frontend/e2e/presentation.spec.ts` tái hiện luồng. Không có người bệnh thật, tên, số điện thoại hoặc video camera.

- Slide 6: `patient-body-focus.png`, chụp vùng sơ đồ và lựa chọn từ DOM. Bản đầy đủ: `patient-body.png`.
- Slide 7: `nurse-alert-focus.png`, chụp cảnh báo dị ứng chưa chắc. Bản đầy đủ: `nurse-alerts.png`.
- Các ảnh `before/` là trang trước khi chỉnh, chụp cùng môi trường demo; không dùng để chứng minh kiểm chứng người dùng.
- Ảnh lỗi camera nếu có được ghi rõ là mô phỏng quyền bị từ chối. Không dùng để tính kết quả model.

## Model và profile

Checkpoint runtime SHA256: `d9010be34e0362d0f5fe84b522f19db0a74a4d79e16f437fd0d221e19a41e246`. Không đổi weights trong lần làm UI/slide này.

Profile trang thử mới: `695918d46c5e8cc1d00597558f12562b5fab1d711990609ecfcb7162603e929a`. Profile thay do chia bố cục trang thử; không thay capture, pipeline hoặc tiêu chí. Snapshot cũ vẫn giữ trong `docs/validation/vsl-v2/profiles/`; không trộn kết quả. Số lượt trực tiếp mới vẫn bằng 0.

Weights do nhóm cung cấp; metadata train gốc chưa đủ để tuyên bố đã xác minh đầy đủ nguồn/quyền cho triển khai rộng. Không coi license mã nguồn VSL-GH là license cho toàn bộ weights và dữ liệu train.

## Template và font

Nguồn: `/Users/mac/Downloads/Template Slide AI4Life.pptx`, 4 slide, 1280×720 / 12192000×6858000 EMU. Dùng bản nhập, giữ nền nhận diện/master/layout, nhân bản layout để thêm nội dung. Slide 1 giữ nền gốc và thêm dòng tên sản phẩm vào vùng trống.

Ba file TTF có hai family thực tế:
- `UTM Swiss Condensed.ttf`: UTM Swiss Condensed, Regular.
- `UTM Swiss CondensedBold.ttf`: UTM Swiss Condensed, Bold.
- `UTM Swiss 721 Black Condensed.ttf`: UTM Swiss 721 Black Condensed, Regular.

Đã kiểm name table và cmap: có glyph cho chuỗi thử tiếng Việt, gồm chữ hoa/thường có dấu. Đã đăng ký cả ba face trong tiến trình render và kiểm hình xuất. PPTX tham chiếu đúng family; không đính kèm hoặc phân phối ba file TTF. Các bit embedding fsType=8 chỉ là metadata kỹ thuật, không dùng thay cho giấy phép.

Không có số liệu tiết kiệm thời gian, chi phí hoặc kết quả bệnh viện trong deck. Notes từng slide chỉ tới nguồn tương ứng. Kiểm tra phần mềm cuối cùng nằm ở `VERIFICATION.md` và báo cáo rà soát UI trong `docs/PLANS/13-UI-AND-PITCH-REVIEW.md`.
