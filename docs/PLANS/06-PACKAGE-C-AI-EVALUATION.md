# Gói C — Kiểm kê AI và bộ đánh giá camera

> Báo cáo lịch sử trước khi nhận V2. Trạng thái mới và đánh giá V2 xem `11-VSL-V2-REVIEW-AND-ADOPTION.md`; không dùng mô tả thiếu model bên dưới làm trạng thái hiện tại.

Ngày thực hiện: 19/11/2026. Phạm vi theo `P9-AI4LIFE-VALIDATION.md`, Gói C mục 6 và Q-19: chưa có dữ liệu người ký hợp lệ, hoàn tất kiểm kê và công cụ bằng dữ liệu tổng hợp. **Chưa hoàn tất đánh giá VSL với người thật, chưa huấn luyện model mới.**

## 1. Kết luận để chọn tính năng trình diễn

Giữ luồng thi chính Chạm + xác nhận hai chiều theo D-017. Camera là phần thử nghiệm tùy chọn, mỗi ứng viên vẫn cần bệnh nhân nhận hoặc sửa trước khi cập nhật lời khai. Kết quả dưới đây chưa đủ để tuyên bố dịch VSL, nhận diện 60 ký hiệu, hoặc có độ chính xác trên người Điếc. Các tỷ lệ confidence hiện có chưa được hiệu chỉnh bằng dữ liệu nên không diễn giải thành xác suất đúng.

Năng lực AI trọng tâm đề xuất cho vòng tiếp theo: nhận **một nhóm nhỏ ký hiệu rời rạc theo câu hỏi**, có khả năng từ chối tay nghỉ và cử chỉ ngoài danh mục. Chưa chọn kiến trúc mới hay thêm thư viện. Sáu nhãn trong fixture là mục tiêu kiểm thử phần mềm, cần người kiểm tra VSL xác nhận trước khi trở thành danh mục thu dữ liệu. Không mở rộng sang dịch câu hay chẩn đoán.

## 2. Bằng chứng kiểm kê

| Thành phần | Kiểm tra trong repo | Ý nghĩa |
|---|---|---|
| `AI_model/data/medical_vsl_30.json` | 60 mục từ vựng, 31 mục có liên kết Voya | Danh mục/mapping, không phải tập huấn luyện |
| `AI_model/data/voya_labels.json` | 4.363 nhãn | Chưa có bằng chứng đây là thứ tự lớp của checkpoint |
| Hai checkpoint `.pth` | Mỗi tệp 208.375.131 byte, 265 tensor, cùng SHA-256 | Hai bản sao của cùng trọng số, không phải hai model để so sánh |
| Lớp cuối | `classifier.fc.weight = [199, 1024]`, bias `[199]` | 199 đầu ra; không thể dùng danh mục 4.363 nhãn làm class order khi chưa xác minh |
| Lớp nối | `bottle_mm.weight = [1024, 1130]` | Cần đúng đặc trưng/preprocessing từ lúc huấn luyện; chưa có tài liệu xác minh |
| Engine hiện tại | Nhánh hình học chọn gloss; PyTorch không import được trong môi trường chạy kiểm tra | Không phải model học sâu đang chọn nhãn |
| Nhánh checkpoint tùy chọn | Đệm zero 1.130 chiều, đưa tọa độ tay và hai đại lượng chuyển động vào, gọi bottle/classifier để cộng tối đa 0,04 confidence | Không khôi phục pipeline huấn luyện và không dùng lớp dự đoán để chọn gloss |
| `FullVTNModel` | Có khai báo các module ảnh/chuỗi nhưng không có `forward` đầy đủ | Sự hiện diện của ResNet/attention trong mã không chứng minh pipeline đó đang nhận diện |
| Nguồn và quyền trọng số | Chưa có nguồn, giấy phép, thứ tự 199 lớp và quy trình huấn luyện được xác minh | Chưa đủ căn cứ tích hợp làm classifier chính |
| Dữ liệu người ký | Chưa được cung cấp theo Q-19 | Chưa đo tổng quát hóa theo người ký, điều kiện camera hoặc VSL thực |

SHA-256 chung của hai checkpoint: `ef7c0098a5afa29769bba8816f206502039468d3c17433ecbbdd80f8c7a77e9f`.

Kiểm kê metadata dùng bộ đọc chỉ cho phép một số cấu trúc tensor, không import PyTorch hay dựng tensor để lấy kích thước. Định dạng khác được báo `unsupported`, không tự chạy mã checkpoint. Nếu máy khác không có trọng số, báo cáo không có checkpoint thay vì giả lập là đã đọc.

## 3. Những gì đã triển khai

- `AI_model/evaluation/checkpoint_audit.py`: hash, kích thước và metadata trọng số.
- `AI_model/evaluation/synthetic_cases.py`: 11 clip tọa độ tự tạo, mỗi clip 5 frame tại 0/180/360/540/720 ms; không có người thật, không có xác nhận ngôn ngữ ký hiệu.
- `AI_model/evaluation/evaluate.py`: kiểm tra manifest, rò rỉ người ký và clip giữa các tập; chạy baseline hình học; xuất chỉ số theo nhãn, ca sai và hash nguồn/dataset.
- `AI_model/evaluation/replay_stabilizer.cjs`: chạy chính `GestureStabilizer.ts` qua TypeScript đã cài trong frontend. Dùng cùng cấu hình camera, không viết lại thuật toán bằng Python.
- Chế độ `--candidate`: chấm dự đoán model khác trên đúng test clip và cùng chính sách lấy ứng viên ổn định đầu tiên; không tự huấn luyện hay tạo kết quả model.
- Test hồi quy cho chỉ số, từ chối dữ liệu rò rỉ, metadata checkpoint, tính đầy đủ của dự đoán và replay bộ lọc thực. `make check` bao gồm lint công cụ mới.

Kiểm chứng: `make check` qua **95 test backend + 73 test frontend**, frontend build qua; riêng 11 test công cụ chạy độc lập cũng qua. CI backend được bổ sung Node 20 và cài dependency frontend từ lockfile hiện có để chạy replay, chưa chạy GitHub Actions từ phiên làm việc này. Build còn cảnh báo bundle trên 500 kB như trước.

Cấu hình camera được tách ra dùng chung, giữ nguyên hành vi: giữ ít nhất **500 ms**, ít nhất 3 frame, confidence ≥ 0,70, cooldown 2.000 ms. Đây là cấu hình đang truyền tại màn camera; mặc định riêng của lớp và mô tả lịch sử 800 ms không phải cấu hình camera hiện hành.

## 4. Kết quả fixture tổng hợp

Đầu ra máy đọc được: `AI_model/evaluation/reports/synthetic.json`. Sáu clip mục tiêu là NGỰC, BỤNG, SỐT, MỨC-1, MỨC-2, MỨC-5. Năm clip âm là tay rỗng, điểm trùng, tay ngoài khung, tư thế nghỉ tự tạo và tư thế ngoài danh mục tự tạo. Các tư thế dương cũng được viết theo luật hiện tại; độ khó rất thấp, có thiên lệch theo triển khai.

| Chỉ số | Nhãn frame cuối | Ứng viên ổn định đầu tiên |
|---|---:|---:|
| Clip khớp nhãn kỳ vọng | 9/11 | 9/11 |
| Clip có nhận nhãn | 8/11 | 8/11 |
| Clip bị từ chối | 3/11 | 3/11 |
| Nhận nhầm trên clip âm | 2/5 | 2/5 |
| Macro-F1 | 0,75 | 0,75 |

Macro-F1 tính cả hai nhãn dự đoán ngoài sáu nhãn mục tiêu (ĐAU, TAI), loại UNKNOWN; vẫn báo riêng nhận nhầm và từ chối. Precision/recall/F1 cùng số mẫu từng nhãn ở JSON. Không dùng tỷ lệ trên 11 fixture làm độ chính xác model thực tế.

Hai lỗi tái hiện:

1. `synthetic-rest_proxy`: mong UNKNOWN, thực tế ĐAU.
2. `synthetic-unlisted_proxy`: mong UNKNOWN, thực tế TAI.

Cả hai vẫn phát ứng viên sau 540 ms trong lịch frame tổng hợp. Bộ lọc thời gian giữ được một dự đoán sai ổn định; nó không xác minh ý nghĩa ký hiệu. Ca ngoài danh mục được chạy ở ngữ cảnh `general`; kết quả chưa qua bộ lọc tab UI và chưa được bệnh nhân chấp nhận.

540 ms là thời gian mô phỏng đến ứng viên, **không phải độ trễ trọn luồng**. `offline_frame_latency_ms` là thời gian xử lý offline trên máy chạy, có overhead đồng hồ kiểm thử; chưa đo camera, MediaPipe, HTTP, UI và thao tác xác nhận. Hai cột sử dụng hai chính sách quyết định khác nhau (frame cuối/ứng viên đầu), không phải hai model được so sánh công bằng.

## 5. Cách chạy lại

Từ thư mục gốc, sau khi đã cài dependency backend/frontend theo dự án:

```bash
make evaluate-vsl
make check
```

Chỉ kiểm kê, không chạy fixture:

```bash
backend/.venv/bin/python -m AI_model.evaluation.evaluate --output /tmp/vsl-audit.json
```

Đánh giá manifest khác đã được phép sử dụng; đường dẫn dưới đây là ví dụ, không phải dữ liệu đã có:

```bash
backend/.venv/bin/python -m AI_model.evaluation.evaluate \
  --dataset /path/to/approved-manifest.json \
  --candidate /path/to/candidate-predictions.json \
  --output /tmp/vsl-comparison.json
```

Manifest JSON gồm `kind` (`synthetic` hoặc `consented_landmarks`), `provenance`, `license_or_consent`, và `clips`. Mỗi clip gồm:

| Trường | Nội dung |
|---|---|
| `clip_id` | Mã duy nhất, không chứa danh tính |
| `signer_id` | Mã người ký ẩn danh phục vụ kiểm tra chia tập |
| `split` | `train`, `validation` hoặc `test` |
| `expected` | Gloss chuẩn, hoặc `UNKNOWN` cho clip âm |
| `context_step` | `symptom`, `location`, `severity` hoặc `general` |
| `frames` | Danh sách `{timestamp_ms, hands}` tăng thời gian; `hands` theo cấu trúc inference hiện có, mỗi tay có đúng 21 `{x, y, z}` hữu hạn |
| `negative_kind` | Tùy chọn; phân loại tay nghỉ/ngoài danh mục để phân tích lỗi |

Với dữ liệu người thật, manifest phải khai báo đủ ba tập để công cụ kiểm tra người ký/clip trùng giữa các tập; chỉ chạy inference trên test. Kiểm tra trùng nội dung bắt được chuỗi tọa độ giống hệt, không thay thế truy vết nguồn/video gốc. Trường giấy phép là khai báo, không phải công cụ tự xác minh sự đồng ý. Nhãn do người dùng nhập cũng cần kiểm duyệt.

Tệp dự đoán model ứng viên có dạng:

```json
{
  "model_name": "ten-model-va-phien-ban",
  "decision_policy": "first_stable_candidate",
  "training_signers": ["train-001"],
  "predictions": [
    {"clip_id": "test-001", "predicted": "UNKNOWN"}
  ]
}
```

Phải có đúng một dự đoán mỗi test clip, dùng UNKNOWN khi từ chối. Công cụ lấy nhãn thật từ manifest, từ chối dự đoán thiếu/trùng và danh sách người huấn luyện đụng validation/test. Dự đoán, danh sách người huấn luyện và chính sách do người cung cấp khai báo; cần kiểm toán runner ứng viên trước khi gọi đây là bằng chứng độc lập. Hiện **chưa có model ứng viên để so sánh**.

## 6. Phần đang chờ để đánh giá AI thực

Đây là đề xuất chuẩn bị, chưa tiến hành thu/lưu dữ liệu nghiên cứu:

1. Xác minh người kiểm tra VSL và nhu cầu tiếp nhận; chốt nhóm gloss nhỏ có ý nghĩa. Lập phương án đồng ý, quyền sử dụng, lưu trữ và xóa dữ liệu riêng để chủ dự án duyệt theo docs/07 trước khi thu.
2. Xác minh nguồn/giấy phép checkpoint, thứ tự lớp, preprocessing và mã huấn luyện. Nếu không khôi phục được, chọn phương án khác trong một phạm vi triển khai được duyệt; không nối nhãn bằng suy đoán.
3. Chia theo người ký trước xử lý dữ liệu. Mọi clip, đoạn cắt và bản tăng cường của cùng người/video giữ cùng tập. Ghi thiết bị, tay trái/phải, ánh sáng, góc nhìn, điều kiện che khuất và clip âm.
4. Dùng validation chọn model/ngưỡng. Trước khi mở test cuối, chốt số người/mẫu mỗi nhãn, cách lấy ứng viên, ngân sách độ trễ và giới hạn nhận nhầm/từ chối; chưa có số liệu để đặt ngưỡng đạt một cách có căn cứ. Không tối ưu theo 11 fixture này hoặc test cuối.
5. So baseline hình học với model trên cùng test clip/ngữ cảnh, cùng quy tắc từ chối và chính sách ổn định. Báo precision/recall theo nhãn, macro-F1, coverage/rejection, nhận nhầm trên tay nghỉ/ngoài danh mục và khoảng dao động theo người ký. Giữ cả các ca sai.
6. Đo riêng camera → ứng viên hiển thị → bệnh nhân xác nhận trên thiết bị demo. Thời gian hoàn thành phiên và chất lượng bàn giao thuộc Gói D; không suy từ latency offline.

Phần có thể bàn giao ngay là bộ kiểm kê, runner, kiểm tra rò rỉ, fixture, báo cáo và quy trình trên. Độ tin cậy VSL thực tế và lựa chọn model học từ dữ liệu còn chờ những bằng chứng này.

## 7. Bổ sung sau khi review model ngoài

Đã thêm bộ kiểm kê package theo manifest/hash, kiểm tra khai báo nguồn dự đoán, WER chuỗi gloss và 12 ca replay thời gian. Hướng dẫn, giới hạn và kết quả tại `AI_model/evaluation/README.md`. Bộ kiểm tra ghi nhận 11/12 ca khớp; ca gián đoạn 10 giây vẫn phát ứng viên, chưa sửa hành vi production. Các công cụ chỉ chuẩn bị đánh giá/tích hợp, không chứng minh model mới đã chạy hoặc tốt hơn. make check qua 112 backend + 73 frontend.
