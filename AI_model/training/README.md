# TinyTemporalCTC — Huấn luyện riêng, chưa tích hợp vào demo

Phạm vi được duyệt ở Q-22/D-023: PyTorch/NumPy trong venv riêng, landmark công khai VSL-GH, smoke train rồi train và đánh giá. Model này được khởi tạo mới; không dùng checkpoint của bạn trong nhóm hoặc checkpoint VTN 199 lớp cũ.

## Đầu vào và nguồn

Nguồn: [VSL-GH](https://github.com/nguyentheanh822/Vietnamese-Sign-Language-Translation), commit `6c351e63c0b2cf1b5e2e8056bb3bf2d6f31dc90a`. Giấy phép nguồn là MIT theo README/LICENSE của tác giả, cần giữ thông báo tác giả khi sử dụng. Chưa xác minh độc lập nguồn gốc/sự đồng ý từng người ký. Không sử dụng dữ liệu bệnh nhân của ứng dụng.

Metadata gốc có 4.200 mẫu chính diện. Kiểm tra đầy đủ phát hiện 2.100 mẫu có gloss rỗng (`[""]`), chia 1.800 train/150 val/150 test. Chúng được **loại rõ lý do**, không coi là clip âm hoặc tự điền nhãn. Sau lọc còn **1.800 train, 150 validation, 150 test**, người ký S01–S04/S05/S06 tách nhau. Vocab train có 231 gloss hợp lệ + CTC blank = 232 đầu ra.

`dataset-audit.json` của mỗi run ghi số bị loại và ID/lý do, số nhận vào, layout, metadata hash. Các file `.npy` phải có 411 chiều, hữu hạn và đủ frame; trùng byte qua split, trùng ID, thiếu file hoặc thiếu vai hợp lệ sẽ dừng kiểm tra. Hai ID gốc có khoảng trắng cuối được ghi/đối chiếu theo đúng tên file; không tự tìm clip khác thay vào. Metadata pin hash cố định để tránh train nhầm bộ khác.

Các câu và điều kiện quay của dataset không đại diện toàn bộ giao tiếp VSL hay môi trường bệnh viện. Test chỉ có một người ký S06 và cùng danh mục câu với train. HO không có target trong test. Không coi một model train được trên nguồn này là đã đáp ứng camera demo.

## Kiến trúc và xử lý

`411 tọa độ → chuẩn hóa vai đúng vị trí 9/10 → ghép vận tốc thành 822 chiều → projection 128 + LayerNorm → BiGRU 2 lớp × hidden 64 mỗi chiều → CTC 232 lớp`.

284.520 tham số ở vocab hiện tại. Giữ mask mất điểm, không tính bước nhảy vận tốc qua frame mất điểm. Frame thiếu vai được nội suy tâm/tỷ lệ từ frame có vai; toàn clip không có vai bị từ chối. Clip dài hơn 300 frame được lấy mẫu đều cả chuỗi để giữ hai đầu, không chặt bỏ cuối câu. CTC kiểm cả số frame cần thêm cho nhãn lặp; lỗi không được giấu bằng loss=0.

Model dùng packed sequences để padding không làm đổi đầu ra phần hợp lệ. Vocab chỉ lấy từ train; đầu vào inference không đọc sentence ID, nhãn tham chiếu hoặc dịch câu theo tên file. Không có decoder tự sinh câu, fallback đáp án 96% hay chọn `.npy` theo mã SENT.

## Môi trường

Đã dùng Python 3.15.2, PyTorch 2.15.0, NumPy 2.5.5 trên CPU ARM64, 16 GiB RAM. `requirements-lock.txt` ghi dependency đúng lần cài. Cài trong `AI_model/training/.venv`, **không cài vào backend/.venv** để tránh kích hoạt nhánh torch cũ trong ứng dụng.

```bash
python3 -m venv AI_model/training/.venv
AI_model/training/.venv/bin/python -m pip install -r AI_model/training/requirements-lock.txt
make check-train
```

Với hệ điều hành/Python khác cần xác minh wheel tương thích; chưa kiểm CUDA hoặc MPS. Data và runs bị Git ignore, không commit dataset, trọng số hoặc venv.

## Lấy đúng dữ liệu

Mốc dữ liệu nằm ở `AI_model/training/data/vslgh`. Để tái lập trên máy khác, clone nguồn vào đó và checkout đúng commit. Chỉ cần LICENSE, README, metadata và landmark chính diện; vẫn phải tải hai tên file có dấu cách trong metadata:

```bash
git clone --filter=blob:none --no-checkout https://github.com/nguyentheanh822/Vietnamese-Sign-Language-Translation.git AI_model/training/data/vslgh
git -C AI_model/training/data/vslgh sparse-checkout set --no-cone '/LICENSE' '/README.md' '/data/dataset.json' '/data/keypoints/*_F.npy' '/data/keypoints/SENT151_S04_R02_F .npy' '/data/keypoints/SENT151_S04_R01_F .npy'
git -C AI_model/training/data/vslgh checkout 6c351e63c0b2cf1b5e2e8056bb3bf2d6f31dc90a
```

Giữ LICENSE trong bản dữ liệu. Đừng tự chạy shell script của repo tải về. Runner riêng không import mã nguồn từ thư mục dataset.

## Chạy

Smoke test hai epoch, không mở test:

```bash
AI_model/training/.venv/bin/python -m AI_model.training.train \
  --data AI_model/training/data/vslgh --output AI_model/training/runs/my-smoke \
  --epochs 2 --train-limit 64 --val-limit 16
```

Lần train đầy đủ đã khởi chạy với:

```bash
AI_model/training/.venv/bin/python -m AI_model.training.train \
  --data AI_model/training/data/vslgh --output AI_model/training/runs/baseline-01 \
  --epochs 30 --patience 5 --evaluate-test
```

Mỗi output phải là thư mục mới để không ghi đè bằng chứng. Mặc định batch 4, CPU 4 thread, AdamW lr=1e-3, seed 42. Validation WER chọn checkpoint; early stop sau 5 epoch không cải thiện, tối đa 30. Test chỉ chạy sau khi đã chọn best checkpoint. Khi có kết quả test, không đổi cấu hình rồi dùng lại test đó như một phép thử độc lập mới.

## Đầu ra và giới hạn

- `best.pt`: weights + class order + config, epoch và validation WER; nạp với weights_only và strict state matching.
- `config.json`, `vocabulary.json`, `history.json`, `dataset-audit.json`: thông tin tái lập và lịch sử học.
- `validation.json`, `test.json`: WER, lỗi thêm/bỏ/thay, exact sequence, các clip sai. Test chỉ có khi bật flag phù hợp và không dùng limit smoke.
- `summary.json`: chỉ xuất khi run hoàn thành. Không coi checkpoint giữa chừng là run đã xong.
- Run baseline có thêm bản sao ba file nguồn lúc bắt đầu và `source-sha256.json`.

WER là số lỗi token / tổng token tham chiếu, không phải accuracy; có thể lớn hơn 1. Exact sequence là số clip khớp toàn chuỗi. Thời gian báo là forward/decode offline theo batch trên CPU, không gồm webcam, MediaPipe, mạng, preprocessing hoặc bệnh nhân xác nhận. Chưa có ngưỡng từ chối hiệu chỉnh bằng tay nghỉ/cử chỉ ngoài danh mục.

Chạy inference thực từ file landmark cụ thể:

```bash
AI_model/training/.venv/bin/python -m AI_model.training.predict \
  --checkpoint AI_model/training/runs/baseline-01/best.pt \
  --landmarks /path/to/observed-landmarks.npy
```

Đây là gloss thô, có thể sai hoặc vượt phạm vi sản phẩm. Không tự diễn giải lâm sàng, sinh tóm tắt bệnh nhân, ghi vào SemanticFrame hay hiện confidence như xác suất đúng. Trước tích hợp cần mapping/allowlist được rà soát, test người ký mới và ca âm, đo trọn luồng camera và chốt contract/privacy nếu đổi đầu vào. Luồng Chạm và engine demo hiện tại giữ nguyên.
