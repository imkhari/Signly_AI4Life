# Mẫu đối chiếu còn cần trước khi thử dương tiếp

Ưu tiên **một câu “Tôi bị đau ngực”**. Chưa cần người dùng ký lại5lượt hoặc thực hiện toàn ma trận.

## Nhóm cần cung cấp hoặc nhờ xác minh

Một trong hai phương án:

1. Link video gốc trọn câu, có nguồn và nhãn, được phép xem tham khảo; nếu muốn tải/chạy qua extractor thì cần điều kiện sử dụng cho phép. Tốt nhất là đúng mẫu/biến thể mà người train V2 đã dùng. Có NPY tương ứng giúp đối chiếu, nhưng NPY một mình không hướng dẫn được cách ký.
2. Người biết VSL kiểm cách ký trực tiếp cho thành viên nội bộ, xác nhận ý nghĩa trọn câu và biến thể vùng miền. Không cần quay hoặc lưu người tham gia; quyền hiện tại chỉ cho kết quả rời rạc trong RAM/CSV tự nguyện.

Thông tin tối thiểu cần trả lời bằng văn bản:

| Mục | Cần biết |
|---|---|
| Ý định | Có đúng lời khai đau ngực, hay chỉ tên bộ phận/từ đau? |
| Phạm vi ký | Trọn câu và ranh giới bắt đầu/kết thúc |
| Nguồn | URL/đơn vị phát hành hoặc xác minh trực tiếp; không cần tên riêng người thử |
| Biến thể | Vùng VSL nếu nguồn biết; chưa biết thì ghi chưa biết |
| Quyền | Chỉ được xem, được tải phân tích, hoặc chưa có quyền |
| Xác minh | Đã được người biết VSL kiểm hay mới tập bắt chước |

Không tự ghép “TÔI” + “NGỰC” + “ĐAU” theo trật tự tiếng Việt rồi gọi là VSL chuẩn. Chú thích nguồn ghi NGỰC-ĐAU là nhãn chú thích, không đủ để tự mô tả động tác tay. Không dùng ASL/BSL thay VSL hoặc chọn video chỉ vì model dự đoán đúng.

## Mẫu tin nhắn để nhóm tự gửi nếu cần

> Nhóm cần đối chiếu camera V2 cho câu “Tôi bị đau ngực”. Bạn có link video gốc trọn câu hoặc có thể kiểm giúp cách ký VSL không? Nhóm cần biết nguồn, biến thể nếu có, và quyền xem/phân tích. Hiện nhóm chỉ có landmark/chú thích, chưa có video câu này, nên chưa xác định được cách ký hay model gây lỗi. Không cần dữ liệu bệnh nhân thật.

Agent không tự gửi tin nhắn hoặc liên hệ người khác.

## Khi có mẫu đã kiểm

Chỉ thử1lượt phát triển P01 ở trang validation sau khi tải lại profile mới. Mặt, hai vai và bàn tay đang ký trong khung; ký theo mẫu đã kiểm, kết thúc ngay khi ký xong bằng Xong câu/phím cách, không cố chờ đủ6giây. Giữ CSV có diagnostic_code, cả sai hoặc từ chối. Nếu chưa có mẫu đủ rõ, không bắt đầu đợt thử dương mới.
