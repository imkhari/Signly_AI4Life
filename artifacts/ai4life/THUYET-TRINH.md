# Kịch bản trình bày AI4Care — bản học thuật

Cập nhật 19/11/2026. Bộ slide có 16 trang chính và 5 phụ lục ẩn. **Demo ở slide 16, cuối phần chính.** Tên làm việc AI4Care, nhóm IDK; tên thành viên và GVHD do nhóm bổ sung khi nộp.

## Thời lượng

Q-11 vẫn chốt 3 phút demo + 2 phút hỏi đáp. Bản đầy đủ dưới đây là phương án 7 phút để tập hoặc dùng khi ban tổ chức xác nhận thời lượng phù hợp; không thay thể lệ. Không đọc đủ 16 slide trong3 phút. Thời gian là phân bổ dự kiến, chưa phải kết quả bấm giờ diễn tập.

## Bản đầy đủ 7 phút

| Slide | Nội dung | Thời gian dự kiến |
|---|---|---|
| 1 | AI4Care — Hỗ trợ giao tiếp trong tiếp nhận y tế | 5 giây |
| 2 | Bài toán giao tiếp tại quầy tiếp nhận | 15 giây |
| 3 | Mục tiêu và phạm vi nghiên cứu | 15 giây |
| 4 | Giải pháp: một câu tạo một gợi ý có cấu trúc | 20 giây |
| 5 | Điểm khác biệt nằm ở quy trình tiếp nhận | 20 giây |
| 6 | Kiến trúc: xử lý trong trình duyệt và máy chủ LAN | 25 giây |
| 7 | Phương pháp nhận diện câu với V2 | 25 giây |
| 8 | Dữ liệu và thiết kế đánh giá | 25 giây |
| 9 | Kết quả replay model trên 300 mẫu | 35 giây |
| 10 | Kiểm tra phần mềm và bằng chứng camera | 20 giây |
| 11 | Hiệu năng trên điện thoại thật | 15 giây |
| 12 | An toàn, quyền riêng tư và đạo đức | 25 giây |
| 13 | Giới hạn và nguy cơ sai lệch kết luận | 20 giây |
| 14 | Kế hoạch kiểm chứng theo từng điều kiện | 20 giây |
| 15 | Đóng góp hiện tại và tiêu chí trình diễn | 15 giây |
| 16 | Demo trực tiếp: một phiên tiếp nhận | 120 giây |

Tổng 420 giây, gồm 300 giây trình bày và 120 giây demo. Sau demo kết thúc phần trình chiếu chính; chỉ mở A1–A5 khi được hỏi. Các nguồn đầy đủ nằm trong speaker notes và EVIDENCE.md.

## Bản rút gọn 3 phút, giữ demo cuối

| Mốc | Slide / thao tác | Lời dẫn |
|---|---|---|
| 0: 00–0: 05 | 1 | AI4Care hỗ trợ giao tiếp ban đầu tại quầy tiếp nhận. |
| 0: 05–0: 15 | 2 | Người bệnh cần diễn đạt; điều dưỡng cần thông tin để hỏi lại. |
| 0: 15–0: 30 | 4 | Một câu có thể gợi ý cả lý do và vị trí; người bệnh kiểm trước khi dùng. |
| 0: 30–0: 45 | 9 | 255/300 là replay landmark offline; chưa là kết quả webcam. |
| 0: 45–1: 00 | 12 | Xác nhận hai phía, validator/fallback và dữ liệu theo phiên. |
| 1: 00–1: 10 | 13 | Camera VSL, điện thoại và hiệu quả người dùng cần kiểm chứng tiếp. |
| 1: 10–3: 00 | 16 + app | Demo ca giả lập dưới đây. |

Đây là kịch bản cần tập trước để chốt số thao tác. Nếu không đủ thời gian, bỏ thao tác mở phiếu bàn giao; giữ kiểm phiếu, xác nhận, điều kiện duyệt và xóa phiên.

## Demo ca giả lập khoảng 2 phút

Chuẩn bị hai cửa sổ `/nurse` và `/patient`, phiên mới, màn hình không có dữ liệu cá nhân. Chạy localhost trên máy demo; điện thoại cần HTTPS/cấu hình LAN đã kiểm riêng. LLM của bản này là mock. Yêu cầu phiên dịch là mô phỏng.

1. Điều dưỡng lấy mã, người bệnh ghép mã và chọn Chạm.
2. Chọn Đau/Nhức. Mở tab Vị trí đau, chọn Ngực.
3. Mở tab Mức đau, chọn 5/10 và Nhận câu trả lời. Mở Bắt đầu từ khi nào, chọn 2giờ.
4. Tiếp tục, chọn Không chắc chắn về dị ứng; yêu cầu tóm tắt.
5. Kiểm từng mục trên phiếu và sửa nếu cần. Nói rõ nội dung là lời khai, chưa phải chẩn đoán.
6. Chỉ nút duyệt đang khóa bên điều dưỡng. Người bệnh bấm Đúng, xác nhận; điều dưỡng vẫn phải ghi nhận cảnh báo cần hỏi lại trước khi duyệt.
7. Điều dưỡng duyệt; kiểm số thứ tự trên màn bệnh nhân. Ghi nhận cảnh báo không có nghĩa đã xử lý y khoa.
8. Nếu còn thời gian mở phiếu bàn giao. Kết thúc phiên, xác nhận xóa và kiểm màn bệnh nhân về ghép mã.

**Nhánh camera tùy chọn:** chỉ dùng khi cách ký đã được người biết VSL xác minh và diễn tập trên đúng thiết bị. Luồng mới là Bắt đầu ký / Xong câu / kiểm cả gợi ý / Dùng thông tin này hoặc Sửa / bổ sung Chạm / xác nhận toàn phiếu. Hiện chưa có ca dương được xác minh, không tự tạo động tác hoặc cam kết camera ổn định. Ảnh A1 dùng detector và response mô phỏng, phải giới thiệu đúng là ảnh minh họa cơ chế.

## Khi có sự cố

Camera không rõ: chuyển Chạm và nói đúng trạng thái. Mất kết nối: chờ phục hồi rồi kiểm dữ liệu; không duyệt phiếu cũ. App chưa khôi phục: mở ảnh A1 để giải thích cơ chế, nói rõ đang dùng ảnh minh họa và đây là ca giả lập khác. Chưa có video dự phòng đã quay/kiểm trên máy thi. Không gọi ảnh mô phỏng là camera thật hoặc LLM mock là LLM live.

## Ghi chú chi tiết

Speaker notes của 21 trang có giải thích phương pháp, giới hạn và nguồn. Bản văn bản nằm trong NOI-DUNG-CHI-TIET.md. Tập nói theo ý chính, không đọc toàn bộ notes.
