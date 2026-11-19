# Kịch bản demo AI4Care — 3 phút và 2 phút hỏi đáp

Cập nhật ngày 19/11/2026. Điều kiện chuẩn bị: hai màn hình đã ghép cặp, dữ liệu giả lập, ENV=demo, LLM_PROVIDER=mock. Luồng chính dùng Chạm. Camera tùy chọn cần diễn tập với người ký và thiết bị thật. Ba phút là thời lượng mục tiêu theo Q-11, chưa có ba lượt diễn tập trên hai thiết bị xác nhận đạt thời lượng. Xem bộ D/E ở `08-PACKAGE-DE-HANDOFF.md` và outline/Q&A ở `09-PITCH-OUTLINE.md`.

## Luồng chính

| Mốc | Người thao tác | Lời dẫn |
|---|---|---|
| 0:00–0:20 | Hiện màn bệnh nhân và điều dưỡng đã ghép. | AI4Care hỗ trợ khai triệu chứng tại quầy tiếp nhận. Hai bên kiểm tra thông tin trước khi duyệt. |
| 0:20–1:05 | Chạm → Đau / Nhức → tab Vị trí đau, chọn Có đau và Bụng trên → tab Mức đau, chọn 3/10 → tab thời gian, chọn 2 giờ → tab Triệu chứng đi kèm, chọn Ho → Tiếp tục → Không dị ứng → Tiếp tục. | Thông tin xuất hiện phía điều dưỡng khi bệnh nhân khai. Trạng thái hiện tại là đang nhập. |
| 1:05–1:40 | Chờ phiếu mới, chỉ vào thẻ lý do chính và Ho đi kèm. Bấm Sửa ở thẻ thời gian, đổi 2 giờ thành 1 giờ rồi đi lại tới phiếu và bấm Đúng, xác nhận. | Bệnh nhân kiểm tra lại trước khi xác nhận. Có thể bấm Sửa lại để điều chỉnh. |
| 1:40–2:10 | Điều dưỡng kiểm tra và bấm Duyệt phiếu tiếp nhận. Chỉ vào STT phía bệnh nhân. Có thể mở bản in nếu còn thời gian. | Điều dưỡng duyệt rồi hệ thống hiển thị số thứ tự. |
| 2:10–2:30 | Kết thúc phiên → Xác nhận xóa & Làm mới. Kiểm tra bệnh nhân trở về nhập mã. | Kết thúc phiên xóa dữ liệu tiếp nhận khỏi kho phiên của ứng dụng. |
| 2:30–3:00 | Dùng phiên riêng đã chuẩn bị, chọn một nhánh an toàn dưới đây. | Nêu cấu hình và trạng thái thật của nhánh đang minh họa. |

Ca Đau cần thêm vị trí, mức đau và thời điểm bắt đầu. Cảnh báo critical yêu cầu điều dưỡng kiểm tra và xác nhận đã biết trước khi duyệt.

## Nhánh minh họa

### Bệnh nhân chưa chắc

Ở bước tóm tắt, bấm Không chắc. Hệ thống gửi yêu cầu hỗ trợ mô phỏng và đưa bệnh nhân về triệu chứng. Nút duyệt giữ khóa. Muốn tiếp tục, đóng hộp thoại, rà soát dữ liệu, tạo tóm tắt mới và xác nhận lại. Cảnh báo dị ứng critical cần được điều dưỡng kiểm tra và xác nhận đã biết.

### Mâu thuẫn dị ứng và mẫu cố định

1. Dùng phiên riêng đã ghép. Trong chính tab bệnh nhân, chuyển địa chỉ từ /patient sang /demo. Giữ tab điều dưỡng để quan sát.
2. Chờ nút mở. Bấm Kích hoạt Mâu thuẫn Dị ứng. Chờ phản hồi điều phối và thẻ TEXT_MENTIONS_DRUG_NOT_DECLARED phía điều dưỡng.
3. Bấm Bật ép mẫu cố định. Chờ phản hồi bản tóm tắt dùng mẫu cố định, chỉ vào huy hiệu nguồn phía điều dưỡng.
4. Điều dưỡng kết thúc phiên. Dữ liệu mẫu phục vụ quan sát rule engine.

Tab /demo độc lập chưa ghép sẽ khóa thao tác phiên. Mỗi vai trò có một kết nối. Nút ép mẫu đi thẳng vào fallback. Test mock độc hại tại backend kiểm chứng đường Post-LLM Validator.

### Camera tùy chọn

Ký hiệu VSL → Tiếp tục → cử chỉ đã diễn tập → Nhận → Áp dụng. Kiểm tra dữ liệu được áp dụng trước khi khai dị ứng và xác nhận. Nếu gợi ý chưa phù hợp, bấm Chuyển sang Chạm.

## Q&A

- **AI thực hiện phần nào?** MediaPipe lấy landmark tại trình duyệt. Bộ luật hình học tại backend LAN gợi ý cử chỉ rời rạc. Buổi thi dùng LLM mock, có validator và mẫu dự phòng.
- **PyTorch làm gì?** Khi checkpoint tải được, nhánh hiện tại cộng điểm điều chỉnh vào điểm của nhãn luật. Xem /api/vsl/status để biết trạng thái tải.
- **60 gloss nghĩa là gì?** Có 60 mục ánh xạ, trong đó 31 mục liên kết nhãn Voya. Đánh giá trên người ký độc lập còn chờ diễn tập.
- **Chất lượng model đã được đo chưa?** Có báo cáo fixture tổng hợp và 12 ca bộ lọc thời gian, chưa có accuracy VSL người thật. Model từ repo bạn trong nhóm chưa đủ source/trọng số/config/vocab để chạy; chưa thay engine hiện tại.
- **Hiệu quả người dùng ra sao?** Chưa thu lượt thử nội bộ hay người dùng mục tiêu. Bộ protocol/phiếu ở docs/validation đã sẵn sàng, chưa có số liệu giảm thời gian hoặc sai thông tin.
- **Dữ liệu camera đi đâu?** Ảnh/video xử lý trong trình duyệt. Tọa độ 3D gửi tới backend LAN theo Q-16.
- **Có phiên dịch viên trực tiếp?** MVP mô phỏng trạng thái yêu cầu hỗ trợ.
- **Mất Internet thì sao?** Hai thiết bị vẫn cần kết nối LAN tới máy chủ. Trước thi phải thử ngắt đường Internet bên ngoài và chạy lại Chạm + mock.
- **Độ trễ bao nhiêu?** Dùng số đo click → DOM điều dưỡng làm tham khảo localhost. RTT /health là phép đo HTTP riêng. Cần đo lại trên LAN.
- **Vai trò y tế?** Thu thập thông tin, phát hiện thiếu/mâu thuẫn và yêu cầu nhân viên kiểm tra. Danh sách cảnh báo seed cần chuyên gia y tế rà soát.

## Câu hỏi điều dưỡng trong B1

Điều dưỡng có thể bấm câu hỏi tiền sử dị ứng tổng quát. Có / Không / Chưa rõ cập nhật phiếu theo question_id, bản nháp bệnh nhân nhận lại cùng dữ liệu. Cần xem tóm tắt mới và bệnh nhân xác nhận lại trước duyệt. Mỗi phiên có một câu hỏi đang chờ. Phiếu sau duyệt khóa chỉnh, cần phiên mới nếu sửa.
