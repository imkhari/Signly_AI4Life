# P9 — Rà soát UI và bộ slide AI4Life

19/11/2026. Theo prompt người dùng đính kèm, phạm vi là hoàn thiện UI hiện có và tạo bộ PowerPoint/PDF theo template. Không đổi schema/events, model, pipeline, ngưỡng, capture hoặc điều kiện xác nhận/duyệt. Không train, không thêm dependency runtime hoặc dịch vụ mới.

## Kiểm kê và sửa

| Màn/trạng thái | Bằng chứng đã xác minh | Ảnh hưởng | Xử lý | Ưu tiên |
|---|---|---|---|---|
| `/` | Code và ảnh trước có kitchen sink, trạng thái kết nối mẫu và nội dung hỗ trợ không gắn phiên | Người xem dễ nhầm mẫu UI là sản phẩm/điều phối thật | Trang gọn hai vai trò; công cụ trong details; giúp trước ghép chỉ dẫn nhờ nhân viên, không phát thông báo giả | P1 |
| Bệnh nhân / ghép mã | Code các phím cao48px; chuyển kích thước ô mã bằng transition-all gây tràn tạm thời ở390px | Khó chạm, khó xem màn nhỏ | Phím cao64px, hàng số5cột, chữ tự xuống hàng; bỏ animation kích thước; trạng thái trước ghép ghi đúng chưa ghép | P1 |
| Bệnh nhân / header | Code một hàng, nút trợ năng48px | Chật ở màn nhỏ, mục tiêu chạm nhỏ | Header wrap, nút trợ năng64px, giữ trợ giúp mọi bước | P1 |
| Triệu chứng / chọn phương thức | Tên bước2 trong i18n vẫn “Chi tiết đau” dù có nhiều triệu chứng | Không khớp bước đang làm | Tên bước Triệu chứng, câu chọn phương thức ngắn, giữ Chạm và camera thử nghiệm | P2 |
| Bệnh nhân / xác nhận | Phiếu đã có sửa từng mục và đồng bộ giữ bản nháp | Không cần thay semantics | Giữ hành vi, kiểm toàn luồng sửa/xác nhận bằng E2E hiện có; kiểm bốn kích thước | P1 |
| Bệnh nhân / chờ, đã duyệt | Code có mã tiếp nhận fallback AC-0042 và lời hứa cấp số ngay | Có thể hiển thị mã không từ server | Bỏ mã giả, dùng dấu chờ khi chưa có mã; lời chờ trung tính và phân biệt đã duyệt | P1 |
| Điều dưỡng / cảnh báo | E2E chụp dữ liệu thật giả lập phát hiện nút Đã biết tràn phải390px | Mất thao tác quan trọng | Nội dung có min-width0/wrap, mã cảnh báo ngắt dòng, nút xuống hàng khi thiếu chỗ | P1 |
| Điều dưỡng / phiếu | Code hiển thị CHEST/hour; một số class brand/status chưa có token Tailwind | Dữ liệu khó đọc và màu thiếu | Map vùng/đơn vị tiếng Việt; alias brand/status về đúng bảng màu style guide | P1 |
| Điều dưỡng / duyệt | Thanh duyệt order-first/sticky trước thông tin | Quyết định nổi trước phần cần kiểm tra | Đưa vùng duyệt sau bảng thông tin; giữ điều kiện khóa và backend guard | P2 |
| Điều dưỡng / lỗi | Thông báo hướng dẫn xem terminal/chạy make | Người vận hành không biết xử lý | Copy thử lại/nhờ phụ trách, giữ chi tiết lỗi máy chủ hiện có | P2 |
| Modal dùng chung | Code chưa trap/restore focus, nội dung không giới hạn chiều cao | Tab ra nền, khó xem phiếu trên màn nhỏ | Focus ban đầu, vòng Tab, Escape, khôi phục focus, khóa cuộn nền và cuộn nội dung; test hành vi | P1 |
| Tương phản cao | CSS cũ đổi biến nhưng Tailwind dùng màu hex cố định | Nút có thể vẫn nền màu/chữ trắng | Override màu rõ cho bề mặt/chữ, trạng thái chọn có viền/gạch chân; không chuyển màu trung gian | P1 |
| `/demo` | Header dài, mô tả quá rộng | Khó đọc ở màn nhỏ | Header wrap, nhãn rõ công cụ nội bộ/ca giả lập; giữ quyền và ENV guard | P2 |
| `/vsl-validation` | Code/ảnh cấu hình và kết quả liên tiếp chưa chia bước | Khó định hướng thao tác | Chia chuẩn bị và thực hiện; giữ RAM, CSV, profile gate và loại synthetic | P2 |
| Camera | Kiểm code và E2E hiện có về loading/capture/gợi ý/chuyển Chạm/cleanup, kiểm thêm từ chối quyền mô phỏng | Cần luôn có đường thoát | Không đổi pipeline, timer hoặc ngưỡng; dùng lại component, kiểm nhãn lỗi và nút Chạm | P1 |

Ảnh trước/sau ở `artifacts/ai4life/screenshots/`; đây là ảnh ca giả lập, không phải thử tác vụ người bệnh. Không kết luận thiết kế đã được người Điếc hiểu hoặc đạt WCAG qua kiểm toán độc lập.

## Safety review theo checklist đã được duyệt

Q-23 cho phép dùng docs07 + tests thay skill safety-review bị thiếu. Yêu cầu lần này trực tiếp cho phép sửa UI/copy trong ranh giới giữ contract/safety; không mở thêm quyết định safety.

- Không có thay đổi backend/domain, validator, prompt LLM hoặc API/event/schema.
- Không thay logic xác nhận/duyệt, tri-state, critical ack hoặc khóa sau duyệt.
- Không thêm lưu dữ liệu, định danh, request LLM hoặc telemetry.
- Model/weights/capture/allowlist/ngưỡng không thay đổi.
- Copy bỏ thông báo điều phối giả, mã tiếp nhận giả và hứa hẹn cấp số ngay; chỉ dẫn theo trạng thái hiện có.
- Phiếu in và CSV đã tải là bản ngoài phiên, ghi đúng giới hạn trong tài liệu bàn giao.
- Không tự thu camera thật, không ghi lượt model từ thao tác tự động.

Trang validation đổi bố cục làm fingerprint nguồn đổi, vì thế đã tạo snapshot mới và giữ các snapshot cũ; metrics mới vẫn0lượt và CANDIDATE. Không tự đánh giá lại chất lượng model.

## Bộ slide

`artifacts/ai4life/README.md` là điểm vào. Có12slide chính và3phụ lục; template/master/layout gốc giữ nhận diện, nội dung và sơ đồ là native text editable. Slide1 giữ nền mở đầu, thêm dòng AI4Care trong vùng trống; slide2 có placeholder thông tin nhóm chưa biết. Dùng cả ba face font đã tải, không phân phối TTF. Từng trang đã render và xem, sửa ảnh từ toàn màn quá nhỏ thành crop DOM trọng tâm. Kiểm cấu trúc package/font/số slide bằng công cụ rồi import lại bản cuối.

PDF là bản xem cố định từ hình render chính xác, do công cụ PDF trực tiếp thiếu module runtime; không âm thầm thay font. PPTX vẫn sửa được, PDF có thể xuất lại với chữ tìm kiếm trong PowerPoint khi cài font.

Kịch bản ưu tiên theo Q-11:3phút demo+2phút hỏi đáp. Bản7phút là phương án thêm, không đổi thời lượng đã chốt. Số liệu chỉ dùng replay255/300,WER9,50% sau guard và giữ đầy đủ caveat. Không thêm số liệu hiệu quả, triển khai, độ chính xác webcam hoặc thử người dùng.

## Giới hạn còn lại

Cần nhóm điền tên, mở file với font trên máy chiếu và diễn tập thời lượng. Chưa có thử người dùng mục tiêu/điều dưỡng, camera ký thật, LAN hai thiết bị/HTTPS và ngắt Internet ngoài trên thiết bị thật. Chưa có video dự phòng; có ảnh slide. Các việc này không được ghi là đã xong trong lần hoàn thiện UI/slide.
