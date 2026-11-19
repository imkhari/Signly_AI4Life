# Đề xuất tự huấn luyện model nhận diện của nhóm

> Lịch sử phương án tự train, **đã dừng và thay bằng V2** theo kế hoạch 11/Q-23. Train 30 epoch hoàn thành, test 26/150 chuỗi gloss đúng, WER 54,45%. Mã ở Git `4e71f8d`; báo cáo/evidence giữ tại `AI_model/evaluation/reports/tiny-ctc-*`, checkpoint nhỏ ở `AI_model/checkpoints/archive/`. Các lệnh/đường dẫn training bên dưới là lịch sử, đã dọn khỏi cây runtime.

Ngày 19/11/2026. Chủ dự án yêu cầu lấy commit mới nhất, chọn “Tìm dataset và đề xuất model riêng”, sau đó duyệt triển khai qua Q-22. **Đã lấy code tham chiếu, cài môi trường riêng, kiểm dữ liệu và chạy smoke; đang thực hiện lượt train baseline. Chưa thay model trong app.** Kết quả cuối được ghi riêng sau khi run hoàn tất.

## 1. Commit đã lấy về

- Repo bạn cung cấp: `https://github.com/longlephanhai/AI4Life.git`.
- GitHub master mới nhất vẫn là `52d9a0ef6c62453dea134767d901ce695aff0910`, không có commit mới hơn lần review.
- Đã fetch vào remote/ref `ai4life-upstream/master`, tạo nhánh tham chiếu `codex/ai4life-upstream`.
- Worktree sparse riêng tại `/tmp/signly-ai4life-latest`, checkout backend, README và .gitignore; phần lịch sử/cây file còn lại truy cập qua Git. Worktree này ở detached HEAD, không phải nhánh để sửa sản phẩm.
- `main` và `origin` của Signly giữ nguyên. Chưa merge/cherry-pick hai backend có contract khác nhau. Có thể xem bằng `git show ai4life-upstream/master:backend/ai_engine.py`.

Commit đó vẫn không chứa source model/train hoặc dataset. Vì vậy không có lệnh train hợp lệ từ chính repo này để chạy ngay.

## 2. Nguồn công khai đề xuất

[VSL-GH — Vietnamese-Sign-Language-Translation](https://github.com/nguyentheanh822/Vietnamese-Sign-Language-Translation), commit đã kiểm `6c351e63c0b2cf1b5e2e8056bb3bf2d6f31dc90a`.

Repo có `source/train.py`, `source/models/slt_model.py`, các baseline, vocab, metadata và landmark. README khai báo MIT cho dự án và dataset; đã đọc [LICENSE](https://github.com/nguyentheanh822/Vietnamese-Sign-Language-Translation/blob/6c351e63c0b2cf1b5e2e8056bb3bf2d6f31dc90a/LICENSE). Giữ thông báo tác giả và license khi sử dụng. Đây là khai báo của nguồn công khai, chưa phải xác minh độc lập nguồn gốc từng video hay sự đồng ý của người ký. Không khẳng định bạn trong nhóm đã sử dụng hoặc sở hữu nguồn này.

Đã đọc metadata và cây Git, không chỉ dựa vào số lượng trong README. Bảng sau là metadata gốc trước kiểm nhãn rỗng:

| Tập từ dataset.json | Số mẫu chính diện | Người ký suy từ ID | Có đường dẫn .npy tương ứng trong Git |
|---|---:|---|---:|
| Train | 3.600 | S01–S04 | 3.600 |
| Validation | 300 | S05 | 300 |
| Test | 300 | S06 | 300 |

Tổng metadata 4.200 ID, không trùng ID; cây Git có 6.030 `.npy` nên không tự đưa mọi file tìm thấy vào train. Một mẫu `SENT001_S01_R01_F.npy` đã tải kiểm header: float32, shape `[143, 411]`, 235.220 byte, là dữ liệu NPY thực chứ không phải LFS pointer. Chưa tải/kiểm shape, finite, chất lượng hay nguồn gốc toàn bộ landmark.

SHA-256 metadata đã đọc: `d54f48cc8ea8a3df2644fec27567e3f7be4511d4ec867911e3a8c0b72537a380`.

Đếm thô có 232 token train nhưng một token là chuỗi rỗng, còn 231 gloss hợp lệ. Ba trăm mã câu trong metadata gốc đều xuất hiện ở train/test: giao thức này thử **người ký mới trên danh mục câu có sẵn**, không chứng minh hiểu câu chưa thấy. Không có nhóm blob NPY byte-identical vắt qua các split trong những ID metadata, nhưng kiểm hash Git không loại hết trùng nguồn/augmentation hoặc rò rỉ ngữ nghĩa.

**Bổ sung sau khi tải kiểm đủ 4.200 NPY:** 2.100 dòng có gloss rỗng, được quarantine có ID/lý do, không tự sửa nhãn hoặc coi là ví dụ âm. Tập dùng train thực tế còn **1.800/150/150**. Mọi file NPY đã đối chiếu khớp Git blob nguồn; SHA-256 manifest landmark là `dd99222278714ea8000ee64b32850487e814a49c92abfef12eb1eac3dcd86a4d`. Đây là kiểm tính toàn vẹn file, chưa xác minh độc lập ý nghĩa ký hiệu hay sự đồng ý người ký.

## 3. Vấn đề phải xử lý trước train

1. `data/splits/*.txt` có 1.800/150/150 ID, không khớp 3.600/300/300 trong [dataset.json](https://github.com/nguyentheanh822/Vietnamese-Sign-Language-Translation/blob/6c351e63c0b2cf1b5e2e8056bb3bf2d6f31dc90a/data/dataset.json). Đề xuất dùng manifest lấy từ metadata, kiểm lại người ký theo ID và khóa hash; không trộn hai giao thức. 2.100 dòng thiếu trường signer_id nên cần ghi rõ cách suy từ tên, không tự bỏ các dòng đó.
2. [extract_keypoints.py](https://github.com/nguyentheanh822/Vietnamese-Sign-Language-Translation/blob/6c351e63c0b2cf1b5e2e8056bb3bf2d6f31dc90a/source/extract_keypoints.py) lưu vai ở vị trí 9/10 trong subset pose, trong khi [dataset.py](https://github.com/nguyentheanh822/Vietnamese-Sign-Language-Translation/blob/6c351e63c0b2cf1b5e2e8056bb3bf2d6f31dc90a/source/data/dataset.py) dùng 11/12. Runner riêng phải dùng layout đúng và gắn phiên bản preprocessing; không sao chép phép chuẩn hóa sai.
3. `train.py` dựng translation vocab từ toàn metadata. Đề xuất không dùng decoder dịch câu ở baseline đầu; mọi vocab/thống kê học được lấy từ train. Không dùng test để chọn epoch/ngưỡng.
4. `config_phase2.yaml` đặt ctc_weight=0, không phù hợp mục tiêu baseline nhận gloss bằng CTC. Runner nguồn còn thiên về CUDA và import nhiều architecture. Không chạy nguyên shell script nguồn hoặc kỳ vọng cấu hình đó phù hợp Mac.
5. Các lớp y tế có support rất nhỏ: BỤNG-ĐAU, NGỰC-ĐAU, THỞ-KHÓ đều chỉ 12 train/1 val/1 test; HO có 12/1/**0**. Không được báo recall HO trên test này hoặc coi kết quả một mẫu là bằng chứng đủ tin cậy. Các gloss ĐAU-BỤNG và BỤNG-ĐAU phải giữ nguyên nhãn khi train, chỉ gộp khi có mapping được rà soát.

## 4. Model riêng đề xuất: TinyTemporalCTC

Chọn baseline nhỏ, học chuỗi landmark và phát gloss; chưa thêm decoder tự sinh câu. Đây là lựa chọn để đo trước, chưa chứng minh tốt hơn luật hoặc Transformer.

```text
137 điểm × 3 tọa độ, theo thời gian
→ chuẩn hóa vai đúng layout, giữ mask mất điểm
→ ghép tọa độ và vận tốc: 822 chiều/frame
→ Linear(822, 128) + LayerNorm
→ BiGRU: 2 lớp, hidden 64 mỗi chiều
→ Linear(128, số gloss train + CTC blank)
→ CTC decode → chuỗi gloss và trạng thái từ chối cần hiệu chỉnh
```

Sau lọc nhãn: 231 gloss train + blank = 232 đầu ra. Không dùng bảng Voya 4.363 nhãn để ghép class order. Model khởi tạo thực có 284.520 tham số.

Thư viện đề xuất: **PyTorch + NumPy**, config JSON bằng thư viện chuẩn, không cần PyYAML hoặc các module Mamba/Conformer. Tài liệu API: [GRU](https://docs.pytorch.org/docs/stable/generated/torch.nn.GRU.html), [CTCLoss](https://docs.pytorch.org/docs/stable/generated/torch.nn.CTCLoss.html). CTC cần kiểm chiều dài đầu vào/nhãn và token lặp; không che mẫu không hợp lệ bằng cách ghi loss=0 rồi tính như train thành công.

Tạo môi trường riêng ở `AI_model/training/.venv`, không cài torch vào venv backend vì có thể tự kích hoạt nhánh checkpoint cũ của demo. Máy đang dùng ARM64, 16 GiB RAM, 8 CPU; bắt đầu CPU FP32 để đo tương thích. Chưa hứa MPS/CUDA chạy được hoặc thời gian train cụ thể.

## 5. Phạm vi triển khai đề xuất sau khi duyệt

| Bước | Công việc | Điều kiện hoàn thành |
|---|---|---|
| A | Pin source/metadata/license, tải đúng landmark có trong manifest | Hash, shape 411, dữ liệu hữu hạn, không thiếu file; thống kê mọi mẫu loại |
| B | Runner riêng, vocab train-only, preprocessing dùng chung train/infer | Test layout/mask/CTC, seed và checkpoint metadata đầy đủ |
| C | Smoke train trên tối đa 64 mẫu train và 16 validation, 2 epoch | Loss hữu hạn, gradient và checkpoint hoạt động; đây chưa phải model đánh giá |
| D | Train đủ 1.800 mẫu có nhãn hợp lệ, validation 150 | Batch 4, max 300 frame, AdamW lr 1e-3; tối đa 30 epoch, patience 5 theo validation WER, seed 42; đo thời gian epoch trước khi mở rộng |
| E | Đóng checkpoint/ngưỡng trước test, chạy test 150 mẫu hợp lệ | WER, lỗi thêm/bỏ/thay, đúng chuỗi, support từng gloss, clip sai và latency offline; không tự nhận là accuracy camera |
| F | Đề xuất adapter và thử camera thật | Chốt contract/privacy nếu thay đầu vào; giữ bước Nhận/Sửa và luồng Chạm |

Batch/epoch/lr là cấu hình thử ban đầu, có thể chỉnh bằng train/validation trước test; không phải tiêu chuẩn đạt. Mọi bước chạy ghi source commit, dataset hash, split hash, preprocessing version, class order, config và seed. Checkpoint xuất là kết quả train riêng, không mang tên hoặc số liệu của model bạn trong nhóm.

Train/eval không đọc đáp án theo mã SENT hoặc tên video trong đường inference, không thay đầu vào bằng `.npy` khác và không dùng fallback 96%. Đầu ra CTC chưa tự ghi vào SemanticFrame hoặc sinh chẩn đoán; tích hợp là bước riêng.

Nguồn này chưa cung cấp benchmark webcam ngoài danh mục/tay nghỉ đã được kiểm tra. Sau train vẫn cần đánh giá từ chối với dữ liệu hợp lệ và kiểm tra VSL; chưa hứa 60 gloss, dịch tự do hoặc dùng trong bệnh viện. So với luật phải dùng cùng video/mục tiêu và protocol, không so WER với 9/11 fixture hiện có.

## 6. Các nguồn khác đã xem

- [VieSign-10K/SI447](https://zenodo.org/records/23610105): có mô tả giao thức theo người ký, nhưng chưa xác minh đủ điều khoản cấp phép từ phần metadata hiển thị; chưa chọn hoặc tải gói 5,9 GB.
- [VSL400](https://www.nature.com/articles/s41597-026-08040-2): mô tả công bố cho biết video qua controlled access/Data Usage Agreement; không coi quyền truy cập bài báo là quyền tải toàn bộ video ngay.

Ưu tiên VSL-GH để thử baseline vì có mã, metadata và landmark công khai phù hợp đầu vào; chọn nguồn này không có nghĩa dữ liệu đã được kiểm toán đầy đủ hoặc tự động đủ cho bài thi.

## 7. Cần chốt

Q-21 và Q-22 đã được chủ dự án trả lời. Phạm vi được duyệt là **TinyTemporalCTC + PyTorch/NumPy trong venv riêng, tải landmark VSL-GH theo manifest và chạy smoke/train/đánh giá như trên**, chưa tích hợp vào app. Không dùng tài khoản GPU cloud hoặc dịch vụ ngoài. Chi tiết chạy và đầu ra ở `AI_model/training/README.md`.
