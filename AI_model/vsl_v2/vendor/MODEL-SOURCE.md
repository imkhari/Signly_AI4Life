# Nguồn module kiến trúc

Module `slt_model.py` lấy từ VSL-GH, commit `6c351e63c0b2cf1b5e2e8056bb3bf2d6f31dc90a`:
https://github.com/nguyentheanh822/Vietnamese-Sign-Language-Translation/blob/6c351e63c0b2cf1b5e2e8056bb3bf2d6f31dc90a/source/models/slt_model.py

Giữ LICENSE MIT của tác giả kèm theo. Loại phương thức beam search vì runtime dùng greedy; giữ tên module/tensor để nạp strict checkpoint. Các thay đổi định dạng không đổi kiến trúc.

Trọng số V2 do chủ dự án cung cấp trong `VSL_Checkpoints_v2`, không phải trọng số từ repo kiến trúc này. Không đưa trọng số hoặc optimizer lên Git. CTC head có 374 đầu ra nhưng chưa có vocab đi kèm để xác minh; runtime chỉ dùng decoder tiếng Việt 442 token.
