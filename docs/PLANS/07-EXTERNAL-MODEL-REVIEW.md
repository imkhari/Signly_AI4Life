# Đánh giá bản cập nhật AI4Life của nhóm

Ngày kiểm tra: 19/11/2026. Repo: https://github.com/longlephanhai/AI4Life. Nhánh `master`, commit `52d9a0ef6c62453dea134767d901ce695aff0910`. Đọc bản sao riêng trong `/tmp/signly-ai4life-model-review`, không tích hợp vào app hiện tại.

**Kết luận: pipeline dự kiến tiến bộ hơn về thiết kế, nhưng chưa đủ thành phần và bằng chứng để xác nhận model nhận diện tốt hơn. Gói C vẫn chưa hoàn tất đánh giá người ký độc lập.**

## So với engine hiện tại

| Mục | Signly hiện tại | Bản được gửi |
|---|---|---|
| Chọn nhãn | Luật hình học, checkpoint tùy chọn chỉ tăng confidence | Có mã gọi `SLTModel.encode`, CTC gloss và `greedy_decode` câu |
| Đầu vào | Landmark bàn tay và lịch sử chuyển động | 25 điểm pose + 70 điểm mặt + 42 điểm tay = 137 điểm, 411 tọa độ/frame; cộng vận tốc thành 822 chiều |
| Chuỗi thời gian | Luật chuyển động và bộ lọc ổn định | Chuẩn hóa vai, nội suy tay, resample 30 FPS, EMA; chia đoạn theo khoảng nghỉ và cửa sổ trượt |
| Từ chối | Hình học, confidence và bộ lọc frontend | Có nhánh thiếu tay, ít chuyển động, confidence thấp, so sánh OOD feature bank nếu có bank |
| Khả năng chạy lại model học sâu | Chưa có classifier được xác minh | Không đủ file để khởi tạo SLTModel từ repo được gửi |
| Bằng chứng độ chính xác người thật | Chưa có | Không thấy test độc lập, chia người ký hoặc báo cáo đánh giá trong cây Git của commit này |

Các điểm bên phải là hành vi được viết trong mã gọi model, không xác nhận được chất lượng encoder/decoder hoặc sự khớp với dữ liệu huấn luyện vì phần định nghĩa model và artifacts không được đưa lên Git.

## Phát hiện cần xử lý trước khi dùng làm bằng chứng thi

### 1. Thiếu phần model thực để chạy và kiểm chứng

`backend/ai_engine.py` cần `checkpoint_best.pt`, `AI/source/models/slt_model.py`, `AI/source/utils/vocab.py`, `AI/source/config/config_phase2.yaml`, hai vocab và có thể OOD bank. Cây Git không chứa chúng; `.gitignore` loại `AI` và `model`. `backend/requirements.txt` chỉ khai báo FastAPI, Uvicorn, Pydantic và python-multipart, chưa mô tả đủ môi trường torch/numpy/mediapipe/OpenCV/PyYAML.

Đã import riêng module engine trong bản sao: `is_ready=False`, không tìm thấy checkpoint/config/vocab/model source. Đây là kiểm tra trạng thái bản Git, không kết luận máy của bạn trong nhóm cũng thiếu những file này.

### 2. Nhánh tham chiếu có thể báo recognized 96% khi không chạy model

`backend/ai_engine.py:604–613`: khi model chưa sẵn sàng hoặc suy luận ném lỗi, nếu có `sent_key` trong `REF_DICT`, trả thẳng gloss/translation tham chiếu với confidence cố định 0,96. Endpoint `/api/sample-keypoints/{sample_id}` truyền tiền tố câu vào nhánh này (`backend/main.py:904`).

Đã tái hiện bằng dữ liệu hoàn toàn tổng hợp: thêm một bản ghi `SENT999` vào dictionary trong RAM rồi gọi `predict_keypoints([], sent_key='SENT999')` khi `is_ready=False`; vẫn nhận `is_recognized=True`, confidence 0,96 và nội dung tham chiếu. Không dùng dữ liệu bệnh nhân, không sửa repo của bạn trong nhóm. Probe này chứng minh đường fallback, không phải phép đo accuracy.

Ngoài ra, `/api/recognize` có đường `sample_id` trả nhãn mẫu với 0,96 (`backend/main.py:169–173`). Cần gắn rõ chế độ mẫu, tách khỏi điểm số suy luận. Nhánh này còn dùng `extracted_frames`/`diagnostics` khi chưa gán ở đường sample (`main.py:247–248`), có nguy cơ lỗi biến cục bộ; nhận xét từ đọc mã, chưa chạy toàn backend.

### 3. Một số video có thể được thay đầu vào theo tên file

`backend/ai_engine.py:628–650`: nếu tên chứa `SENTxxx` và clip ít frame hoặc không thấy đủ tay, code tìm `.npy` cùng mã câu rồi thay landmark trích xuất bằng file có sẵn. Đây có thể hữu ích để xem skeleton mẫu, nhưng kết quả không đo video vừa upload. Cần vô hiệu hóa trong benchmark/live và ghi nguồn đầu vào rõ ràng. Nhánh quay webcam tạo tên `live_gesture_...`, không khẳng định mọi video đều bị thay.

### 4. Confidence và bộ lọc OOD chưa chứng minh khả năng từ chối

Ngưỡng xác suất decoder 0,38, confidence tổng hợp 0,40 và similarity OOD 0,64/0,70 là các giá trị trong mã; chưa thấy đánh giá trên validation/test để chứng minh lựa chọn. Không có OOD bank thì nhánh kiểm bank bị bỏ qua. Nếu CTC không cho gloss, chương trình có thể suy gloss lại từ câu decoder (`ai_engine.py:403–414`), nên gloss hiển thị không phải lúc nào cũng là nhận diện trực tiếp từ hình ảnh.

Không so trực tiếp confidence 0,96/0,40 với 0,70 ở Signly: cách tính và nhiệm vụ khác nhau, chưa được hiệu chỉnh.

### 5. Cần xác minh checkpoint và quyền dữ liệu

`load_state_dict(..., strict=False)` tại `ai_engine.py:178` chưa kiểm `missing_keys`/`unexpected_keys` trước khi báo sẵn sàng. Cần xác minh kiến trúc, vocab order, preprocessing, phiên bản chuẩn hóa và nguồn checkpoint. Chưa có manifest người ký, giấy phép, cách chia tập hoặc nguồn OOD bank để kiểm tra rò rỉ.

### 6. Cách truyền camera khác chính sách hiện tại

`camera-stage.tsx:658–663` tạo file video rồi upload; `main.py:178–180` ghi file tạm và xóa ở `finally`. Signly hiện duyệt gửi landmark qua LAN theo Q-16, không phải chuyển sang upload video. Nếu tích hợp cách này, phải chốt cập nhật privacy/contract theo AGENTS.md trước; hiện chưa thay đổi hành vi Signly.

## Gói bằng chứng cần nhận từ thành viên phụ trách AI

1. Checkpoint + SHA-256, mã `SLTModel`/`Vocab`, config, vocab đúng thứ tự, môi trường dependency và lệnh chạy. Có thể chuyển riêng nếu không được công khai dữ liệu/trọng số.
2. Nguồn dữ liệu và quyền sử dụng; manifest chia train/validation/test theo người ký và nguồn clip. OOD bank chỉ từ nguồn được phép và không chứa test.
3. Runner thuần suy luận, tắt fallback ground truth và thay `.npy` theo tên; báo `engine_source`, nguồn đầu vào, checkpoint hash và trạng thái OOD thật.
4. Test cùng các video mới chưa thấy khi train, gồm ký hiệu đúng, tay nghỉ, ngoài danh mục và câu chưa trọn. Với mô hình chuỗi, báo thêm WER gloss và lỗi thêm/bỏ/thay dữ kiện trong câu, ngoài các chỉ số Gói C. Chốt ngưỡng ở validation trước test.
5. Để so với Signly: trích cả đầu vào tay cho baseline và holistic cho model từ cùng video, giữ chung mục tiêu/gloss và tiêu chí chấp nhận. Không đệm giả pose/mặt cho 11 fixture bàn tay hiện có để gọi là benchmark công bằng. Đo latency camera đến kết quả riêng trên thiết bị thi.

Chưa có các artifacts trên nên không chạy inference model học sâu, không báo accuracy/độ tăng chất lượng, không tích hợp hay thay dependency. Có thể giữ sản phẩm hiện tại và thử model như một nhánh ứng viên sau khi hoàn tất các điều kiện này.
