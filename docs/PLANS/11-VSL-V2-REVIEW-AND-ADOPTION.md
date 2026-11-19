# VSL_Checkpoints_v2 — Kiểm tra, chọn dùng và dọn thử nghiệm

> Bản M2 mới xem kế hoạch12: capture theo câu, resize toàn khung đúng nguồn, guard mất vai và replay sau sửa255/300. Các số256/300 bên dưới là baseline trước M2.

Ngày 19/11/2026. Chủ dự án cung cấp thư mục V2 và yêu cầu dùng nếu phù hợp hơn, dọn phần thử nghiệm không cần thiết. Chọn **V2 greedy làm ứng viên nhận diện chính**, dừng hướng huấn luyện TinyCTC. Chưa coi đây là mô hình đã được kiểm chứng sử dụng lâm sàng.

## Bằng chứng đã kiểm tra

- `checkpoint_best.pt` là epoch 72, norm_version=2. Model state nạp `weights_only=True` và strict, không chạy mã từ checkpoint.
- Input 822, hidden 256, encoder 4 lớp, decoder 3 lớp, FFN 1024; đầu ra dịch tiếng Việt 442 token, CTC head 374 lớp.
- Kiến trúc lấy từ VSL-GH commit `6c351e63...`, giữ LICENSE MIT. Vocab tiếng Việt 442 token của nguồn công khai khớp thứ tự builder nguồn; nhead=8, vai vị trí 9/10 được xác minh bằng tái hiện **300/300 dự đoán greedy** kèm bộ V2. Config train gốc chưa được cung cấp; đây là xác minh tương thích hành vi, không giả là đọc được mọi tham số từ weights.
- 374 đầu ra CTC chưa có class order được xác minh, **không dùng CTC head để xuất gloss**. Runtime chỉ giải mã câu tiếng Việt, không gán nhãn Voya hoặc vocab TinyCTC vào head này.
- Bản đóng gói runtime bỏ optimizer và checkpoint trung gian, còn khoảng 28,1 MiB tại `AI_model/checkpoints/vsl_v2.pt`. Giữ hash nguồn, metadata, vocab trong package.

## Đọc đúng các số chất lượng

Tính từ file greedy 300 mẫu do người cung cấp gửi: 256/300 câu khớp chuỗi từ (85,33%); WER cộng gộp 200/2.157 token = 9,27%; trung bình WER từng câu = 10,695%. Số 85,667% trong header không khớp danh sách dự đoán. Beam4 yếu hơn greedy trong chính bộ file này (91/300 câu khớp), không mặc định beam search là tốt hơn.

Các con số trên là câu tiếng Việt dựa trên reference người cung cấp, không phải accuracy gloss, không phải camera trực tiếp. 65/300 reference không khớp token với metadata VSL-GH công khai đang có; cần đúng phiên bản annotation trước khi mở rộng benchmark hoặc huấn luyện lại. Không coi metadata công khai và bộ reference V2 là một bản giống hệt nhau.

TinyCTC tự train có 26/150 chuỗi gloss khớp, WER gloss 54,45%. Hai bài toán/đơn vị khác nhau nên không lấy 9,27% và 54,45% để tính mức cải thiện trực tiếp. Chọn V2 vì đã có decoder dùng được, có checkpoint và tái hiện được hành vi, thay vì tiếp tục tối ưu baseline mới còn yếu.

Các lỗi liên quan demo: hai câu “tôi bị sốt” bị nhận thành “tôi bị ho” và “tôi bị đau đầu”. Các ca đau đầu/bụng/ngực và khó thở có ví dụ khớp trong tập này nhưng phần lớn chỉ một người ký và ít mẫu mỗi ý. Chưa có đánh giá tay nghỉ/ngoài danh mục thật, ngưỡng từ chối được hiệu chỉnh hoặc kiểm tra VSL độc lập. Không đưa phần trăm này lên slide như độ chính xác bệnh viện.

## Nhánh V2 offline đã chuẩn bị

`AI_model/vsl_v2` có kiến trúc, chuẩn hóa norm_version=2, loader checksum/strict, CLI nhận NPY và harness replay. Inference chỉ đọc landmark được đưa vào, không có dictionary đáp án, sent_key, fallback 96% hoặc thay đầu vào theo tên file. Mean token probability là điểm chưa hiệu chỉnh, không phải xác suất đúng.

## Phạm vi tích hợp camera — Q-23 đã duyệt

1. Dùng HolisticLandmarker trong MediaPipe tasks-vision đã có. Tạo chuỗi 411 tọa độ/frame: thân người, mặt và hai tay; xử lý video trong trình duyệt, **chỉ gửi tọa độ qua LAN**, không upload video và không lưu landmark phiên.
2. Mở rộng POST `/api/vsl/predict` nhận chuỗi frame có timestamp, đồng bộ Pydantic/TypeScript/docs02/03/test; giữ tương thích request bàn tay cũ. Cập nhật docs07 vì Q-16 trước đây mới chốt tọa độ tay.
3. V2 chạy trong môi trường Torch riêng. Câu decoder không đi thẳng vào hồ sơ. Chỉ gợi ý nhãn thuộc ontology theo ngữ cảnh, từ chối câu ngoài allowlist/phủ định không biểu diễn được, vẫn bắt buộc Nhận/Sửa rồi xác nhận hai chiều. Chạm tiếp tục dùng cho mức đau/thời gian hoặc mục không nhận được.
4. Không gán confidence thành accuracy, không dịch câu tự do rồi tự thêm dữ kiện, không thay quy tắc cảnh báo/duyệt. Bộ camera vẫn là tùy chọn thử nghiệm; luồng thi chính Chạm theo D-017.
5. Chạy unit/safety/E2E/build và kiểm release camera/reset. Chưa coi test trình duyệt bằng giả lập là kiểm chứng người ký thật.

`docs/07` nhắc skill safety-review nhưng file `.claude/skills/safety-review/SKILL.md` không có trong repo hoặc nơi đã tìm. Chủ dự án đã cho phép review thủ công theo toàn bộ checklist docs07 và tests thay cho file skill bị thiếu, trước các thay đổi UI/privacy. Không bỏ ranh giới y tế trong AGENTS.md.

## Phạm vi dọn

- Bỏ mã train/infer TinyCTC đang hoạt động và các smoke run, giữ báo cáo baseline và một checkpoint nhỏ để đối chiếu/khôi phục.
- Dọn dataset/cache tải tạm khi replay V2 đã hoàn tất; giữ nguồn/version/hash và cách lấy lại. Không cần giữ 1,3 GB dữ liệu trong bản demo runtime.
- Tái sử dụng dependency đã duyệt trong môi trường runtime riêng, dọn môi trường train cũ sau khi môi trường mới chạy và kiểm tra qua.
- Giữ công cụ đánh giá chung, tài liệu D/E và luồng tiếp nhận B. Đây là phần vẫn cần cho thi, không bị thay thế bởi model V2.
- Giữ bộ V2 gốc người dùng cung cấp để truy vết. Không tự xóa các checkpoint gốc của người khác chỉ vì không được chọn làm runtime.

Sau khi dọn, ghi đúng những đường dẫn đã bỏ và dung lượng giải phóng; không ghi xóa thành công trước khi thực hiện. Q-23 đã chốt; camera dùng nhánh V2, không fallback hình học. Đã dọn 2.213.251.643 byte (~2,06 GiB) thuộc `AI_model/training/`; giữ đầy đủ các bằng chứng/bản gốc nêu trên. Chi tiết `AI_model/vsl_v2/reports/cleanup.json`.

## Kiểm chứng tích hợp đã hoàn tất

- `make check`: 138 backend + 76 frontend, lint/typecheck đều qua.
- `make check-v2`: 5 ca runtime qua, gồm checksum, normalization, giữ ca nhận nhầm thật và tay nghỉ.
- Frontend build qua; 11 E2E qua, gồm luồng xác nhận hai màn, fallback độc hại, nạp holistic offline và nhả stream tổng hợp khi chuyển Chạm ở720/1024px. Đã xem ảnh hai kích thước; đây không phải kiểm VSL người thật.
- Smoke API thật qua TestClient và backend local8000: fixture SENT101 → ĐẦU, nguồn `vsl_v2_learned_translation`; worker được dọn khi shutdown. Kiểm cả cancellation và reset trong lúc tạo worker.
- Đóng gói lại từ checkpoint gốc tái tạo đúng hash compact; bản gốc giữ nguyên. Không có filename/reference lookup trong suy luận.
- Giao diện VSL đưa camera lên trước, chuyển Chạm phục hồi lựa chọn thủ công. Không tự điền vùng bụng/lưng cụ thể nếu câu chưa nói rõ; không dịch số sang mức đau/thời gian.

Còn chờ: camera với người ký mới, tập âm thật và hiệu chỉnh ngưỡng, xác minh VSL/annotation, diễn tập HTTPS LAN và thử nội bộ. Không đánh dấu Gói C đã kiểm chứng chất lượng sử dụng thực tế.
