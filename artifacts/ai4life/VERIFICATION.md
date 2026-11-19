# Kiểm tra bộ slide học thuật

Cập nhật 19/11/2026. Bản trình bày 16 slide chính + 5 phụ lục ẩn, demo ở slide 16. Giữ template và font nguồn; chuyển nội dung kỹ thuật ra phần chính và bổ sung dữ liệu/protocol/giới hạn.

## Phần mềm được kiểm

`make check` chạy trong đợt làm slide: 173 test backend + 96 frontend qua, lint/type qua. App/model không đổi trong đợt này. Kết quả8 runtime,build,18 E2E tại code 0094d98 lấy từ nhật ký kỹ thuật đã có; không tuyên bố đã chạy lại toàn bộ E2E chỉ để sửa slide.

Hai ảnh cận cảnh mới được chụp qua trình duyệt với app backend thật/LLM mock nhưng camera, detector và response model mô phỏng, dữ liệu sức khỏe giả lập. Không bật webcam, không ghi kết quả người thật, không đổi profile hoặc nhập thêm trial.

## Kiểm tra file trình bày

- Package/relationship hợp lệ;21 slide,16hiện và 5ẩn; ghi chú thuyết trình cho từng trang.
- Kích thước1280×720; kiểm tọa độ ngoài trang, bullet geometry và heading fit theo bộ kiểm chuẩn.
- Có12bảng PowerPoint native sửa được ở slide 3,4,5,8,9,10,11,12,14,18,19,21. Hai sơ đồ slide 6–7 là đối tượng và connector native.
- Bảng kết quả slide 9 có 255 + 44 + 1=300, kiểm contract số học rõ. WER/85,00% đối chiếu trực tiếp báo cáo nguồn; không dùng kiểm số học để thay xác minh dữ liệu.
- Font policy đối chiếu deck nguồn: UTM Swiss Condensed và UTM Swiss 721 Black Condensed, dùngRegular/Bold/Black theo face đã cung cấp; không đóng góiTTF.
- Đã nhập lại chính file cuối, render đủ 21 trang và xem từng trang. Đối chiếu trước/sau với template, sửa chữ tràn/nhãn đường nối và phóng cận cảnh ảnh để đọc được.
- PDF đồng bộ21 trang là ảnh render cố định, gồm phụ lục; không có lớp chữ để tìm kiếm. Bản sửa nội dung và notes làPPTX.
- Chưa mở trong Microsoft PowerPoint, thử máy chiếu hoặc diễn tập bấm giờ trên máy thi. Tài nguyên font, hyperlinklocalhost và chế độ phụ lục ẩn cần kiểm tại đó.

## Kiểm chứng nội dung

Nguồn/bằng chứng được đối chiếu trongEVIDENCE.md vànotes. Replay, ca âm nội bộ, E2Emôphỏng, điện thoại chưa đo và người dùng chưa thử được ghi riêng. Không thêm số liệu hiệu quả bệnh viện, accuracy webcam hoặc tốc độ điện thoại. Model giữ CANDIDATE; code/profile/checkpoint và guard không đổi.

## Nhóm cần hoàn thành

Mở file vớifont đã cài; bổ sung thông tin thành viên nếu cần; đối chiếu lịch thi trong nền mẫu. Diễn tập luồngChạm trong3 phút hoặc thời lượngBTC xác nhận. Điện thoại/HTTPS LAN, kýVSL đúng, người dùng/điều dưỡng và video dự phòng còn chờ; không tính thành phần đã kiểm chứng.
