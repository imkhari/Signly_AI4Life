# Kịch bản trình bày AI4Care

Ngày chuẩn bị: 19/11/2026. AI4Care là tên làm việc, có thể sửa trên slide 2. Điền tên nhóm, ba thành viên và giảng viên nếu có trước khi nộp. Slide 1 giữ nhận diện và ngày có sẵn trong mẫu; nhóm cần đối chiếu lịch thực tế của mình.

## Bản ưu tiên: 3 phút demo + 2 phút hỏi đáp

Đây là thời lượng đã chốt tại Q-11, chưa có xác nhận mới từ ban tổ chức. Không cố đọc toàn bộ 12 slide trong 3 phút. Phụ lục 13–15 được ẩn trong trình chiếu và vẫn có trong PDF.

| Mốc | Nội dung và thao tác |
|---|---|
| 0:00–0:20 | Mở slide 1–2, giới thiệu vấn đề và đầu ra. |
| 0:20–0:35 | Chuyển app: điều dưỡng có mã, bệnh nhân nhập mã, chọn Chạm. |
| 0:35–1:10 | Chọn Đau / Nhức → vị trí Đầu → mức 6/10 → 2 giờ → dị ứng Không chắc chắn. |
| 1:10–1:35 | Kiểm tra phiếu. Minh họa nút sửa một mục nếu thao tác kịp. Bệnh nhân xác nhận. |
| 1:35–2:00 | Điều dưỡng thấy cảnh báo, nút duyệt đang khóa; ghi nhận cảnh báo rồi duyệt. Chỉ rõ số thứ tự bên bệnh nhân. |
| 2:00–2:15 | Mở phiếu bàn giao, đóng; kết thúc và xóa phiên. |
| 2:15–2:40 | Quay slide 8–9: AI ở đâu, replay offline và giới hạn camera. |
| 2:40–3:00 | Slide 10 và 12: ranh giới an toàn, bước kiểm chứng tiếp theo, kết thúc. |

### Lời nói gợi ý

“AI4Care hỗ trợ người Điếc và người khó khăn về lời nói khai thông tin tại quầy tiếp nhận. Đầu ra là phiếu lời khai được bệnh nhân và điều dưỡng kiểm tra.

Trong ca giả lập này, người bệnh chọn chỗ đau, mức đau, thời gian và chưa chắc về dị ứng. Thông tin cập nhật sang màn điều dưỡng. Trước khi xác nhận, người bệnh có thể sửa từng mục.

Ở đây nút duyệt vẫn khóa. Sau khi bệnh nhân xác nhận và điều dưỡng ghi nhận cảnh báo, hệ thống mới cho duyệt và cấp số thứ tự. Kết thúc phiên sẽ xóa dữ liệu phiên; phiếu đã in là bản do người vận hành quản lý.

Camera V2 dùng model đã học để gợi ý nhãn, nhưng còn ở trạng thái thử nghiệm. Kết quả 255 trên 300 là replay dữ liệu landmark offline, không phải độ chính xác webcam. Bản demo này dùng LLM mock; phần diễn đạt vẫn có validator và mẫu dự phòng.

Nhóm đã có nguyên mẫu quy trình hai màn hình. Bước tiếp theo là kiểm tra khả năng sử dụng với đúng người dùng và đánh giá camera trực tiếp. Hệ thống không chẩn đoán, kê đơn hay thay phiên dịch viên.”

## Bản đầy đủ: 7 phút

Thời lượng dưới đây là phương án bổ sung do nhóm chuẩn bị, không thay thế Q-11.

| Slide | Thời gian | Lời dẫn / ý chính |
|---|---:|---|
| 1 | 3 giây | Trang nhận diện cuộc thi; chuyển ngay sang sản phẩm. |
| 2 | 17 giây | AI4Care hỗ trợ giao tiếp ở bước tiếp nhận. Người bệnh xác nhận lời khai, điều dưỡng kiểm tra phiếu. |
| 3 | 20 giây | Bài toán thiết kế là diễn đạt và hỏi lại triệu chứng, dị ứng. Nhóm chưa có khảo sát bệnh viện nên chưa kết luận tác động. |
| 4 | 20 giây | Hai màn hình cùng một phiên, hai lượt kiểm tra; điểm thiết kế nằm ở luồng tiếp nhận có cấu trúc. |
| 5 | 20 giây | Nêu ca giả lập và chuyển sang app. Camera không phải điều kiện để hoàn tất luồng này. |
| 6 | 70 giây | Demo người bệnh chọn Đau, vùng Đầu, mức 6/10, 2 giờ, Không chắc dị ứng; kiểm tra và sửa phiếu rồi xác nhận. Ảnh slide là dự phòng. |
| 7 | 80 giây | Demo điều dưỡng đọc dữ liệu, chỉ ra khóa duyệt, ghi nhận cảnh báo và duyệt; xem số thứ tự, mở phiếu và reset. Ảnh slide phóng cảnh báo, ảnh đầy đủ trong screenshots. |
| 8 | 40 giây | Phân biệt model camera, parser theo luật và adapter LLM. LLM hiện mock, camera V2 thật nhưng chưa hoàn tất đánh giá. |
| 9 | 40 giây | 255/300 khớp câu trên replay; WER 9,50%; chưa có kết luận webcam, lỗi sốt còn tồn tại. |
| 10 | 35 giây | Guardrails, validator/fallback, tọa độ qua LAN và xóa phiên. Phiên dịch hiện mô phỏng. |
| 11 | 40 giây | Kế hoạch thử với người dùng và điều dưỡng; chỉ số cần đo, chưa tuyên bố cải thiện hiệu suất. |
| 12 | 35 giây | Chốt giá trị nguyên mẫu và điều kiện để tiến tới triển khai; mời trao đổi. |

Tổng: 420 giây. Speaker notes có nội dung bổ sung và nguồn. Phụ lục không nằm trong 7 phút.

## Chuẩn bị và dự phòng

- Mở `/nurse` và `/patient` ở hai tab/cửa sổ. Tạo phiên demo mới trước lượt thi. Dữ liệu dùng cho trình diễn là giả lập.
- Kiểm tra backend và frontend trước khi trình bày. Màn hình chiếu không lộ terminal, token hoặc cấu hình bí mật.
- Camera chỉ bổ sung khi đã có người biết ký, câu đã tập đúng và thiết bị đã thử. Hiện chưa có bằng chứng để cam kết kết quả camera trực tiếp. Không tự đặt động tác làm VSL.
- Nếu camera không ra gợi ý, nói “chưa nhận rõ” và chuyển Chạm. Không chạy lại nhiều lần rồi chỉ trình bày lần đúng như kết quả ổn định.
- Mất kết nối: chờ trạng thái kết nối lại; nếu chưa phục hồi thì dùng ảnh slide và nói rõ đang xem ảnh dự phòng.
- Lỗi LLM: mẫu cố định là đường dự phòng. Không giả vờ đang gọi LLM live.
- Yêu cầu phiên dịch là mô phỏng, chưa nối dịch vụ thật.
- Nếu không có thời gian, bỏ phần camera trực tiếp và mở phụ lục khi được hỏi.
