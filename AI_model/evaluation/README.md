# Công cụ Gói C: đánh giá và tiếp nhận model

Các công cụ ở đây chạy offline. Chưa có checkpoint/source/vocab hợp lệ của model mới để chạy suy luận hoặc đánh giá người ký độc lập. Kiểm tra file, test phần mềm và kiểm tra khai báo nguồn dự đoán không thay thế đánh giá nhận diện thực.

## Lệnh dùng ngay

Từ thư mục gốc, dùng dependency backend và frontend hiện có của dự án:

```bash
make evaluate-vsl
make evaluate-vsl-stability
make check
```

- `reports/synthetic.json`: 11 clip tọa độ tự tạo, baseline hình học và bộ ổn định frontend thật; kết quả 9/11 khớp, nhận nhầm 2/5 clip âm. Không phải accuracy VSL người thật.
- `reports/stability.json`: 12 chuỗi **dự đoán** tự tạo, không chạy nhận diện. 11/12 ca khớp kỳ vọng. Có hash fixture và nguồn bộ lọc để truy vết.
- `reports/external-package.json`: kiểm kê bằng template trên bản sao repo ngoài đã review ở commit `52d9a0e`. Thiếu sáu nhóm file bắt buộc và OOD bank tùy chọn; không có kết quả runtime.

Kiểm chứng đợt này: **112 test backend + 73 test frontend qua**, lint và typecheck qua. Không đổi mã nhận diện hay camera production, không thêm dependency.

## 1. Khi bạn phụ trách AI gửi bộ model

Gửi cả file mã nguồn phụ thuộc và hướng dẫn môi trường, không chỉ riêng checkpoint. Cấu trúc template:

```text
model/checkpoint_best.pt
model/ood_reference_bank.pt                 # tùy chọn
AI/source/models/slt_model.py
AI/source/utils/vocab.py
AI/source/config/config_phase2.yaml
AI/data/gloss_vocab.txt
AI/data/trans_vocab.txt
```

Đây là các điểm vào tối thiểu được wrapper của repo ngoài tham chiếu; có đủ chúng vẫn chưa chứng minh mọi import phụ thuộc đã có. Không cần chuyển dữ liệu bệnh nhân hay toàn bộ tập huấn luyện để kiểm tra file.

1. Giải nén bộ model vào một thư mục riêng.
2. Sao chép `model-package.template.json` sang manifest riêng. Điền `model_name`, nguồn `provenance`, quyền dùng `license_or_permission`, và mô tả preprocessing (thứ tự điểm, chuẩn hóa, FPS, vận tốc, phiên bản).
3. Điền đường dẫn tương đối từ thư mục bộ model và SHA-256 do thành viên cung cấp cho từng file. Có thể dùng `shasum -a 256 đường-dẫn-file` trên máy gửi. Nếu đặt checkpoint ở đường dẫn khác, sửa manifest; công cụ không đoán file nào là bản mới nhất.
4. Chạy:

```bash
make inspect-vsl-package \
  MODEL_PACKAGE=/path/to/unpacked-package \
  MODEL_MANIFEST=/path/to/filled-manifest.json
```

Đầu ra: `reports/model-package.json`. Exit code **2** nghĩa là thiếu file/metadata/hash hoặc checksum không khớp; báo cáo vẫn được ghi nếu manifest đọc được. Exit code 0 chỉ xác nhận các file được khai báo đã khớp hash. `runtime_status` vẫn là `not_tested`, `recognition_quality` vẫn là `not_evaluated`.

Công cụ không import source, giải tuần tự trọng số, cài thư viện hay tự bật engine. Metadata quyền sử dụng do người cung cấp khai báo, chưa phải xác minh pháp lý. OOD bank vắng được báo thiếu; không suy diễn rằng bộ lọc OOD đang hoạt động. Dependency, nguồn trọng số, vocab order và tính tương thích kiến trúc cần smoke test riêng sau khi có gói thật. Việc thêm dependency/thay contract hoặc luồng camera vẫn theo AGENTS.md.

## 2. Chấm dự đoán và kiểm tra nguồn khai báo

`evaluate.py --candidate` trước đây chấm nhãn theo clip. Bổ sung `--checkpoint-sha256` để kiểm tra khai báo nguồn; dùng hash lấy từ kiểm kê bộ model. Ví dụ:

```bash
backend/.venv/bin/python -m AI_model.evaluation.evaluate \
  --dataset /path/to/approved-manifest.json \
  --candidate /path/to/predictions.json \
  --checkpoint-sha256 HASH_64_KY_TU_HEX_THUONG \
  --output /tmp/vsl-comparison.json
```

Giá trị `HASH_64_KY_TU_HEX_THUONG` là chỗ thay bằng hash thật, không phải giá trị hợp lệ để chạy. Schema manifest clip và `decision_policy=first_stable_candidate` giữ như báo cáo Gói C trước. Candidate có thêm:

```json
{
  "model_name": "ten-va-phien-ban",
  "checkpoint_sha256": "hash-thuc-te-64-ky-tu-hex-thuong",
  "decision_policy": "first_stable_candidate",
  "training_signers": ["train-001"],
  "predictions": [
    {
      "clip_id": "test-001",
      "predicted": "NGỰC",
      "engine_source": "learned_model",
      "input_source": "observed_landmarks",
      "predicted_glosses": ["TÔI", "ĐAU", "NGỰC"]
    }
  ]
}
```

Ở chế độ có hash, thiếu khai báo nguồn, `reference`/`mock` hay input lấy mẫu theo tên file đều bị từ chối. Hash khác checkpoint kỳ vọng cũng bị từ chối. Cần đủ đúng một dự đoán cho mỗi test clip, không trùng người ký với validation/test.

**Đây là kiểm tra lời khai trong file, không phải chứng minh runner thực sự chạy model.** Không có attestation hay trace inference độc lập; người xuất dự đoán vẫn có thể khai sai. Vì thế báo cáo luôn giữ `runtime_independently_verified=false`. Trước benchmark thật phải xem runner, tắt fallback đáp án, tắt thay `.npy` theo tên và ghi nguồn checkpoint/input ở nơi chạy suy luận. Không có flag hash thì `source_declarations_checked=false`; không lấy kết quả chế độ này làm bằng chứng đã kiểm nguồn.

`predicted` vẫn là nhãn mục tiêu theo clip cho phép so baseline; không tự chọn một từ trong câu decoder để điền trường này. Với model dịch chuỗi, cần quy tắc đối sánh mục tiêu được chốt trước khi test.

## 3. Đánh giá chuỗi gloss

Nếu tất cả test clip có thêm `expected_glosses`, candidate phải có `predicted_glosses` cho mọi clip. Ví dụ ở manifest:

```json
{"expected_glosses": ["TÔI", "ĐAU", "NGỰC"]}
```

Runner báo số thay thế/bỏ/thêm token, WER cộng gộp, số chuỗi khớp hoàn toàn, số clip âm phát ra gloss và danh sách lỗi. Clip âm dùng `expected_glosses=[]`; từ chối dùng `predicted_glosses=[]`.

WER = tổng thao tác sửa / tổng token tham chiếu, có thể lớn hơn 1. Nếu toàn bộ tham chiếu rỗng, WER là null và số clip âm phát gloss vẫn được báo. So token chính xác, không tự sửa dấu, ghép từ hoặc suy gloss từ câu. Nếu nhiều cách căn chỉnh có cùng chi phí, thuật toán ưu tiên thay thế rồi bỏ rồi thêm; WER không đổi nhưng phân bố loại lỗi có thể phụ thuộc cách căn chỉnh.

WER chưa đo đúng phủ định, thời gian, vị trí, mức đau hoặc độ an toàn của câu dịch. Chất lượng dữ kiện cần bộ ca riêng có người kiểm tra, không suy từ WER thấp.

## 4. Kết quả bộ kiểm tra thời gian

12 ca gồm giữ đủ/ngắn, ít frame, confidence thấp, vẫy tay, chuyển tiếp, mất tay, đổi nhãn, cooldown, lặp lại sau cooldown, số bị nhiễu một frame và gián đoạn phân phối dữ liệu.

Ca `delivery_gap` đưa cùng nhãn tại 0, 10.000 và 11.000 ms: kỳ vọng chưa phát ứng viên vì không có bằng chứng giữ liên tục; thực tế phát NGỰC tại 11.000 ms. Bộ lọc hiện tính từ lần thấy đầu và số lần nhận, chưa có giới hạn khoảng cách giữa các dự đoán. Đây là ca phần mềm với dự đoán tự tạo, không phải quan sát từ người ký hoặc mạng thật.

Đã giữ nguyên kết quả sai trong báo cáo, chưa sửa ngưỡng hay hành vi camera. Nếu xử lý lỗi này, cần chọn khoảng cách tối đa dựa trên cadence camera đo được, kiểm tra reconnect/reset và xác nhận ảnh hưởng hành vi theo AGENTS.md. Bộ test đánh giá xác nhận báo cáo trung thực; nó không biến một ca không đạt thành ca đạt để làm xanh test.

## Phần còn chờ

Nhận gói model đầy đủ → xác minh nguồn/quyền và smoke test runtime → chuẩn bị tích hợp phù hợp contract/privacy → chạy model trên dữ liệu chia người ký hợp lệ → so baseline và đo camera thật. Không kết luận đã thay model hay hoàn tất Gói C từ các công cụ mới này. Xem thêm `docs/PLANS/06-PACKAGE-C-AI-EVALUATION.md` và `07-EXTERNAL-MODEL-REVIEW.md`.
