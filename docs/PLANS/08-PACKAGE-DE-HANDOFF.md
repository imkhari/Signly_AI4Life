# Gói D/E — Bộ thử nội bộ và bàn giao bản demo

Ngày chuẩn bị và kiểm tra: 19/11/2026. Mốc sản phẩm đã kiểm tra: `ee95fb03270b3a77a68eca17382776e5066887e5`. Các thay đổi đợt này là tài liệu, không đổi schema, safety hoặc model.

**D đã có bộ thử, chưa có người thực hiện. E đã kiểm tra phần mềm localhost và chuẩn bị nội dung trình bày; chưa chốt sẵn sàng thi trên thiết bị thật.** Không chờ model mới để chạy luồng Chạm và rà soát khả năng sửa phiếu.

## Mở tài liệu theo công việc

| Việc | Tài liệu |
|---|---|
| Điều phối thử nội bộ | [Protocol](../validation/INTERNAL-TRIAL-PROTOCOL.md) |
| Ghi từng lượt | [Phiếu từng lượt](../validation/TRIAL-RECORD.md) |
| Tổng hợp số liệu | [CSV](../validation/trials.csv), hiện chỉ có header |
| Xem kết quả người thử | [Kết quả](../validation/RESULTS.md), hiện n=0 |
| Chuẩn bị bài nói và Q&A | [Outline](09-PITCH-OUTLINE.md) |
| Thao tác demo ba phút | [Kịch bản](01-DEMO-SCRIPT.md) |
| Khởi chạy hai thiết bị | [Triển khai](../DEPLOYMENT_GUIDE.md) |
| Tiếp nhận/đánh giá model | [Gói C](../../AI_model/evaluation/README.md) |

## E — Bằng chứng phần mềm lần chạy này

| Kiểm tra | Cách chạy | Quan sát |
|---|---|---|
| Lint, typecheck, test | `make check` | Qua 112 backend + 73 frontend |
| Build frontend | `cd frontend && npm run build` | Qua; còn cảnh báo bundle >500 kB |
| Luồng hai màn hình | `cd frontend && SIGNLY_CHROMIUM_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:e2e` | 8/8 E2E qua, 23,4 giây cho bộ test |
| Giữ dữ liệu khi sửa, câu trả lời điều dưỡng | E2E hiện có | Lý do chính/Ho/thời gian và câu trả lời dị ứng được đối chiếu giữa hai màn |
| Xác nhận, duyệt, reset | E2E + integration hiện có | Có ca STT, khóa duyệt, reset sessionStorage và mã cũ không ghép được |
| Fallback/validator | E2E mock độc hại + unit/safety | Có `validator_blocked`; ép mẫu từ /demo là đường riêng |
| Reconnect | E2E đóng WebSocket có chủ đích | Kết nối lại và gửi tiếp được; không phải thử ngắt Internet hay Wi-Fi thật |
| Bố cục | E2E 1024×768, 720×768; ảnh full-page | Không cuộn ngang trong ca kiểm; xem ảnh phiếu/điều dưỡng, các thẻ và nút sửa rõ; phải cuộn dọc để xem hết phiếu |

Môi trường: Chrome đã cài trên macOS, hai trang trong cùng máy/browser context; ENV=demo, LLM_PROVIDER=mock. Hai cặp server thử riêng 18080/15173 và 18081/15174 (mock độc hại), không thay phiên người dùng đang mở trên 8000/5173. Tất cả payload thử là giả lập. Không có camera người ký thật hoặc phiên dịch viên trực tuyến trong phép thử.

Ảnh lần chạy hiện tại ở `frontend/test-results`: `review-1024.png`, `review-720.png`, `patient-1024-large.png`, `patient-720-large.png`, `nurse-1024-large.png`, `nurse-720-large.png`, `camera-1024.png` trong các thư mục ca tương ứng. Thư mục này bị Git ignore và có thể bị lần chạy sau ghi lại; không coi tên file là bằng chứng đã test một phiên bản khác. Kết quả tóm tắt được giữ ở đây và trong progress log.

Năm lần đo click → DOM điều dưỡng trong E2E là 170, 165, 164, 164, 164 ms (trung vị 164, min–max 164–170 ms). Chỉ là thông số cập nhật một sự kiện localhost cùng máy; không phải thời gian khám, hiệu quả giao tiếp, latency camera hay kết quả người dùng. Không đưa chúng lên slide thành tuyên bố giảm chờ khám.

## Nội dung được trình diễn ở bản hiện tại

- Chạm, khai theo mục, giữ lý do chính khi thêm triệu chứng, sửa thẻ, xác nhận, điều dưỡng duyệt và STT.
- Câu hỏi dị ứng tổng quát có tương quan, yêu cầu rà soát/xác nhận lại.
- Giữ “chưa rõ”, hiển thị thiếu/mâu thuẫn, yêu cầu kiểm tra cảnh báo trước duyệt theo guardrails hiện có.
- LLM mock và fallback cố định; validator có bằng chứng test riêng. Yêu cầu hỗ trợ/phiên dịch là mô phỏng.
- Reset phiên. Camera chỉ phần thử nghiệm tùy chọn; không dùng làm điều kiện để hoàn tất luồng chính.

Chưa đưa lên sân khấu như năng lực đã chứng minh: dịch VSL liên tục, nhận 60 ký hiệu với accuracy xác định, nhận diện camera đã kiểm chứng thực tế, phiên dịch viên thật, chẩn đoán, giảm thời gian khám hoặc triển khai ở bệnh viện công. Gói C đã nhận/tích hợp V2 và replay, còn thiếu kiểm chứng webcam/người ký mới và có ca nhận nhầm; Gói D chưa có quan sát người thử.

## Checklist diễn tập cần nhóm điền

Giữ trống các ô chưa thực hiện. Người xác nhận dùng mã thành viên; không ghi dữ liệu bệnh nhân.

| Mục | Trạng thái hiện tại | Ngày / mã người xác nhận / thiết bị / kết quả |
|---|---|---|
| Ba lượt trọn luồng, mỗi lượt theo giới hạn 3 phút | Chờ | … |
| Hai thiết bị thật cùng LAN, đúng trình duyệt buổi thi | Chờ | … |
| Ngắt đường Internet bên ngoài, LAN vẫn hoạt động | Chờ | … |
| TTS có giọng phù hợp, dừng khi reset/chuyển màn | Chờ thiết bị thật | … |
| Camera/HTTPS/quyền truy cập nếu quyết định trình diễn | Chờ; không bắt buộc luồng chính | … |
| Xác nhận/reset rồi thử dùng lại mã cũ trên thiết bị | Chờ thiết bị thật | … |
| Video dự phòng đã quay và mở thử trên máy trình chiếu | Chờ | … |
| Các tuyên bố trên slide khớp bảng bằng chứng | Outline đã chuẩn bị; deck cuối chờ kiểm | … |

Phân vai theo Q-12: A kiểm backend/cấu hình, B thao tác bệnh nhân, C thao tác điều dưỡng và trình bày. Đây là phân công dự kiến, chưa xác nhận ai đã diễn tập.

## Quay video dự phòng và xử lý sự cố

Dùng ca T1-X giả lập theo kịch bản, hai màn đã ghép, font đủ lớn, đóng trang cá nhân và tắt thông báo ngoài. Nhóm tự ghi màn hình bằng công cụ máy đang có; gắn nhãn Chạm + LLM mock. Nếu quay camera/người thật, phải chốt phạm vi và sự đồng ý trước; bản dự phòng đề xuất chỉ ghi UI với dữ liệu mẫu. Không dựng video từ ảnh rồi gọi là một phiên demo thực.

Mở thử file video trên đúng máy, âm thanh/phụ đề dễ đọc và không cần truy cập link ngoài. Ghi tên file, ngày, mốc code, máy và người đã kiểm vào checklist. Chưa có file video được tạo trong đợt này.

Camera lỗi → Chuyển sang Chạm. Mất kết nối → chờ kết nối lại và rà lại dữ liệu, chưa duyệt phiếu cũ. Backend dừng → khởi chạy lại và tạo phiên mới. Nếu không thể khôi phục trong thời lượng, dùng video đã kiểm tra và nói rõ đang phát dự phòng. Giữ riêng một phiên mẫu cho nhánh safety, không giành kết nối vai trò với phiên chính.

## Điều kiện cập nhật sau này

Model mới đến không làm mất bộ thử này. Sau tích hợp vẫn phải chạy lại make check/build/E2E, kiểm tra cấu hình AI thật, đầu vào camera, dữ liệu truyền đi, xử lý thiếu model, từ chối ứng viên và luồng nhận/sửa/xác nhận. Nếu thay schema/privacy thì chốt tác động trước. Bằng chứng C/D/E ghi theo phiên bản; kết quả bản hiện tại không tự chuyển thành kết quả model mới.
