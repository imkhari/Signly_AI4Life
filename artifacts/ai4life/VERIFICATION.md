# Kiểm tra bàn giao — 19/11/2026

## Web app

- `make check`: ruff + mypy + ESLint + TypeScript, 160 test backend và 87 test frontend qua.
- Build frontend qua.
- Playwright: 15 E2E qua, gồm luồng hai màn hình, sửa thông tin, câu hỏi dị ứng, xác nhận, critical ack, duyệt/cấp số, reset, reconnect, fallback khi LLM mock độc hại, camera synthetic và giải phóng stream.
- Bài kiểm tra bàn giao đi từng bước qua 1280×800, 1024×800, 720×800 và 390×800, chụp ảnh app, kiểm không tràn ngang. Bộ E2E cũ kiểm thêm 1024×768 và 720×768.
- Chữ lớn + tương phản cao kiểm ở màn chọn phương thức, màu nút được kiểm từ computed style. Modal có test vòng Tab, Escape, khôi phục focus và cuộn nền.
- Có lượt mô phỏng camera bị từ chối quyền, hiển thị lỗi và chuyển Chạm; không truy cập camera thật.
- Ảnh và test đều dùng dữ liệu giả lập. Không đo người dùng, hiểu biết VSL, hiệu quả lâm sàng hoặc độ chính xác webcam.

## PowerPoint và PDF

- 15 trang: 12 trang chính và 3 phụ lục được đánh dấu ẩn trong PPTX; PDF có đủ15trang.
- Có15phần speaker notes; tiêu đề/nội dung/sơ đồ là đối tượng text chỉnh sửa được; ảnh và nền giữ dạng ảnh.
- Kiểm cấu trúc gói PPTX, quan hệ tài nguyên, kích thước 12192000×6858000EMU, font đã chỉ định và geometry qua công cụ finalization.
- Đã import lại đúng file cuối và render đủ15trang; đã xem từng trang, đối chiếu mẫu và sửa lỗi chữ/font/ảnh không hiển thị từ bản dựng đầu.
- Ba ảnh nền nguồn được giữ nguyên byte trong package đầu ra; master/layout và nhận diện mẫu được giữ. Dòng tên AI4Care thêm tại vùng trống slide mở đầu.
- Kiểm metadata ba TTF và chuỗi glyph tiếng Việt, dùng đúng family Regular/Bold/Black khi render; không đóng gói TTF.
- PDF dự phòng tạo từ render slide. Đã kiểm số trang/kích thước và render PDF để đối chiếu; bản tìm kiếm/chỉnh chữ là PPTX, không phải PDF này.
- Chưa mở trong Microsoft PowerPoint, chưa thử máy chiếu, chưa xác nhận thời lượng bằng diễn tập thật.

## Phạm vi giữ nguyên và phần cần nhóm làm

Không đổi backend/contract, validator/LLM prompt, model/checkpoint, tiền xử lý, ngưỡng, capture hoặc policy. Profile đổi vì bố cục trang thử nội bộ có hash nguồn; không có lượt trực tiếp mới được nhập. Model vẫn CANDIDATE.

Cần điền nhóm/thành viên/GVHD, cài font trên máy PowerPoint và diễn tập. Chưa có video dự phòng, thử ký thật, thử người dùng/điều dưỡng, LAN hai thiết bị/HTTPS hoặc ngắt Internet ngoài trên thiết bị thật. Những việc này không được tính vào kết quả lần bàn giao.
