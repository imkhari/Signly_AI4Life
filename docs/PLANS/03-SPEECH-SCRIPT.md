# Lời thoại demo ba phút

Dùng thao tác theo 01-DEMO-SCRIPT.md. Người nói chờ trạng thái thật của màn hình.

## Mở đầu

“AI4Care hỗ trợ người Điếc và người gặp khó khăn khi giao tiếp bằng lời khai triệu chứng tại quầy tiếp nhận. Hai màn hình bệnh nhân và điều dưỡng được ghép trong cùng phiên.”

## Khai và kiểm tra lại

“Bệnh nhân chọn biểu tượng và các thông tin phù hợp. Điều dưỡng thấy dữ liệu cập nhật và biết bệnh nhân vẫn đang nhập. Bản tóm tắt giúp bệnh nhân kiểm tra lại. Nếu cần sửa, họ quay lại trước khi xác nhận.”

## Duyệt và kết thúc

“Sau xác nhận của bệnh nhân, điều dưỡng rà soát thông tin và cảnh báo rồi duyệt phiếu. Số thứ tự xuất hiện phía bệnh nhân. Khi kết thúc, hệ thống xóa dữ liệu của phiên tiếp nhận.”

## Chọn một nhánh minh họa

- Hỗ trợ. “Khi bệnh nhân chưa chắc, họ có thể yêu cầu người hỗ trợ. MVP mô phỏng trạng thái yêu cầu phiên dịch để trình diễn đường chuyển tiếp.”
- Mẫu cố định. “Chúng tôi ép dùng mẫu cố định trong phiên minh họa này. Các test backend kiểm tra riêng tình huống mock sinh nội dung vi phạm và validator chặn.”
- Camera đã diễn tập. “MediaPipe xử lý ảnh tại trình duyệt. Tọa độ bàn tay gửi tới backend LAN để bộ luật gợi ý cử chỉ. Bệnh nhân kiểm tra rồi chọn Nhận và Áp dụng.”

Đọc Q&A trong 01-DEMO-SCRIPT.md. Báo rõ cấu hình mock, giới hạn đánh giá camera và trạng thái mô phỏng phiên dịch. Dùng số đo của đúng môi trường trình diễn.
