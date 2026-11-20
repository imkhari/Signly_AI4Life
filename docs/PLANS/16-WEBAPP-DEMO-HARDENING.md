# P9 — Hoàn thiện web app cho demo

Ngày20/11/2026. Theo yêu cầu hoàn thiện web app; giữ model/profile/threshold và luồng tiếp nhận hiện có. Không thêm dependency.

| Mục | Bằng chứng kiểm code | Xử lý |
|---|---|---|
| Idle | Effect phụ thuộc showWarning/onTimeout; vừa hiện cảnh báo lại reset;3regression đã tái hiện thất bại | Giữ deadline10phút/cảnh báo60giây như docs06, callback mới nhất và cleanup |
| TTS | Các hook ghi đè onvoiceschanged, callback cũ có thể xóa câu mới, unmount một nút hủy giọng nút khác | Listener riêng, ownership và generation, không đổi nội dung đọc |
| Sao chép mã | Ghi dấu thành công trước Promise clipboard, không bắt lỗi | Chỉ báo thành công sau hoàn tất, lỗi có hướng dẫn nhập mã; nút đủ64px |
| Lỗi máy chủ | Màn điều dưỡng còn hiện backend8000/make dù docs13 đã yêu cầu lời dễ hiểu | Dùng copy thử lại/nhờ người phụ trách, không lộ stack/lệnh |
| Xuất phiếu | Nút mở/in khi chưa xác nhận/duyệt; phiếu ghi Đã xác nhận dù có thể là dữ liệu nháp; handler không chặn state | Q-35 cần duyệt trước sửa semantics |
| LAN/HTTPS | Có basicSsl và proxy đã duyệt, chưa có kiểm kết nối HTTPS | Kiểm qua hai browser context cô lập, ghi rõ chưa phải2thiết bị thật |

## Q-35 — đề xuất xuất phiếu sau duyệt

**Chờ duyệt.** Bệnh nhân phải xác nhận rồi điều dưỡng duyệt theo luồng hiện có. Chỉ state nurse_verified hoặc exported mới được xuất/in. Nút xuất khóa trước duyệt, mất kết nối hoặc không có summary; hiển thị lý do. Kiểm lại điều kiện khi bấm in, không chỉ khi mở modal; không in nháp dưới nhãn Đã xác nhận. Backend từ chối RECORD_EXPORTED ở state khác bằng ERROR/VALIDATION_ERROR, không tạo event hoặc đổi state. Giữ xuất lại phiếu đã duyệt. Không đổi schema/event, không thêm lưu trữ/PII hoặc thay số thứ tự.

Nếu mất kết nối trong lúc mở modal, chặn in và yêu cầu kết nối lại. Dữ liệu thực tế vẫn chỉ từ phiên đã duyệt. Browser print do người dùng yêu cầu, bản xuất ngoài RAM vẫn theo docs07. Review bằng docs07+tests thay skill safety-review đang thiếu như đợt trước, cần chủ dự án xác nhận phạm vi này.

Kiểm tra bắt buộc sau duyệt: giả lập xuất trước xác nhận/sau xác nhận chưa duyệt bị chặn; state đã duyệt được xuất lại; modal không in khi mất điều kiện; backend bảo vệ nếu bỏ qua UI. Các sửa độc lập khác vẫn tiếp tục trong lúc chờ.

## Phát hiện thêm khi kiểm ranh giới phiên

Nút Tạo mã mới đang gọi createSession trực tiếp khi phiên cũ còn mở; INIT_SESSION giữ frame và metadata cũ. Sửa cách triển khai để nút này đi qua modal kết thúc/xóa hiện có và INIT_SESSION luôn khởi tạo dữ liệu trống, giữ riêng tùy chọn trợ năng. Đây là khôi phục tính cô lập phiên theo docs07, không thêm event hoặc thay điều kiện xác nhận. Theo dõi SESSION_JOINED đã có để không báo bệnh nhân đang nhập khi chưa có bệnh nhân nối vào.

## Q-36 — đề xuất dọn phiên bị bỏ lại khi không còn kết nối

**Chờ duyệt.** Backend có hàm cleanup_idle_sessions nhưng lifespan hiện không chạy nó. Không gọi thẳng hàm đó theo heartbeat vì có thể xóa một phiên đang có người thao tác; chưa có giao thức phân biệt thao tác UI và PING đầy đủ.

Đề xuất tối thiểu: chỉ dọn phiên đã **không còn bất kỳ WebSocket nào** liên tục10phút (SESSION_IDLE_MINUTES hiện có), kiểm mỗi30giây. Kết nối lại trước hạn hủy mốc bỏ phiên. Không xóa phiên còn kết nối, không sửa TTL ghép mã hoặc nội dung payload. Bộ theo dõi chỉ giữ ID và mốc thời gian, không giữ frame/summary; xóa cả mã ghép khi xóa RAM và hủy task khi shutdown. Không đụng worker đang phục vụ phiên khác. Tài liệu nêu độ trễ chu kỳ tối đa30giây, không hứa xóa server ngay khi mạng mất.

Ở client, khi idle hết hạn nhưng không gửi được SESSION_RESET, xóa dữ liệu cục bộ và ngắt socket như ranh giới phiên hiện có. Không ghi rằng server đã nhận reset; server chỉ được xóa khi nhận sự kiện hoặc theo điều kiện dọn phiên nêu trên. Phiên còn điều dưỡng kết nối vẫn cần điều dưỡng kết thúc nếu bệnh nhân đã rời mạng.

Q-36 cần chốt vì bổ sung điều kiện xóa RAM và cách phục hồi khi mất mạng. Dùng docs07+tests để review. Test đồng hồ giả: không kết nối đủ hạn bị xóa, còn kết nối giữ nguyên, reconnect bắt đầu lại hạn, pairing code bị thu hồi, task được hủy khi shutdown; không dùng thời gian chờ10phút thật trong unit tests.
