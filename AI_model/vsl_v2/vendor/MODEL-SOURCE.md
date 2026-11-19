# Nguồn module kiến trúc

Module `slt_model.py` lấy từ VSL-GH, commit `6c351e63c0b2cf1b5e2e8056bb3bf2d6f31dc90a`:
https://github.com/nguyentheanh822/Vietnamese-Sign-Language-Translation/blob/6c351e63c0b2cf1b5e2e8056bb3bf2d6f31dc90a/source/models/slt_model.py

Giữ LICENSE MIT của tác giả kèm theo. Loại phương thức beam search vì runtime dùng greedy; giữ tên module/tensor để nạp strict checkpoint. Các thay đổi định dạng không đổi kiến trúc.

Trọng số V2 do chủ dự án cung cấp trong `VSL_Checkpoints_v2`, không phải trọng số từ repo kiến trúc này. Không đưa trọng số hoặc optimizer lên Git. CTC head có 374 đầu ra nhưng chưa có vocab đi kèm để xác minh; runtime chỉ dùng decoder tiếng Việt 442 token.

Extractor tham chiếu được lưu nguyên văn ở `extract_keypoints.source.txt` (chỉ đọc, không import/chạy), cùng commit và LICENSE MIT. SHA256 `243a94fe188379987dfcca26d6e6b80c6a4cd0bcb8cc94f6f23a5800482fe4e9`. Hàm nguồn gọi `cv2.resize(frame, (360,360))`, không center-crop, không flip; camera đã được sửa để giữ toàn khung theo nguồn. Holistic Tasks web và extractor legacy vẫn là hai implementation khác nhau cần đánh giá trực tiếp.
