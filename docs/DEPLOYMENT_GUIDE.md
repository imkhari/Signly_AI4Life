# Triển khai và kiểm tra trước buổi thi

Cập nhật ngày 19/11/2026. Luồng thi chính dùng Chạm + LLM mock. Mỗi phiên có một màn bệnh nhân và một màn điều dưỡng. Dùng dữ liệu giả lập khi diễn tập.

## 1. Chạy cục bộ

Chạy `make setup`, rồi `make demo`. Mở /nurse và /patient trên http://localhost:5173. Điều dưỡng tạo mã sáu ký tự, bệnh nhân nhập mã. Chờ cả hai màn Đã kết nối. Xem docs/PLANS/01-DEMO-SCRIPT.md để thao tác.

## 2. Hai thiết bị qua LAN

Chạy `make demo-https`. Frontend HTTPS cổng 5173, backend cổng 8000. Hai thiết bị cùng Wi-Fi. Lấy IP bằng `ipconfig getifaddr en0`, mở https://<IP>:5173/nurse và https://<IP>:5173/patient. Chấp nhận chứng chỉ thử nghiệm nếu trình duyệt và chính sách thiết bị cho phép.

Camera cần secure context. Thử đúng tablet, trình duyệt và mạng buổi thi. Nếu thiết bị từ chối camera, chọn Chạm.

## 3. Checklist có bằng chứng

### Tự động trên localhost

- [x] make check qua.
- [x] Frontend npm run build qua.
- [x] Playwright npm run test:e2e qua. Tự chạy backend mock :18080 và frontend :15173.
- [x] Bấm nhanh dị ứng tạo tóm tắt chứa lựa chọn mới nhất.
- [x] Sửa → tóm tắt mới → xác nhận → duyệt → STT phía bệnh nhân.
- [x] Mâu thuẫn dị ứng qua /demo trong tab bệnh nhân có cảnh báo phía điều dưỡng.
- [x] Ép mẫu cố định có phản hồi SUMMARY_READY.
- [x] Test backend mock độc hại có validator_blocked.
- [x] Không chắc → hỗ trợ mô phỏng → giữ khóa duyệt.
- [x] WebSocket kết nối lại sau khi bị đóng.
- [x] Reset đưa bệnh nhân về nhập mã, xóa sessionStorage bệnh nhân, mã cũ không ghép được.
- [x] Backend integration xác nhận kho phiên RAM đã xóa.
- [x] Xem ảnh UI 1024×768 và 720×768 với chữ lớn.
- [x] Tách click → DOM điều dưỡng khỏi RTT HTTP /health.

Kết quả ngày 19/11/2026 được ghi trong 99-PROGRESS-LOG.md. Bộ E2E còn chạy máy chủ mock độc hại riêng trên cổng 18081 và frontend 15174. Trên macOS có thể chạy E2E bằng Chrome đã cài với biến SIGNLY_CHROMIUM_PATH trỏ tới /Applications/Google Chrome.app/Contents/MacOS/Google Chrome. Ảnh UI và trace nằm trong frontend/test-results.

Lần kiểm tra Gói E trên mốc ee95fb0: make check qua 112 backend + 73 frontend, build qua và 8/8 E2E qua. Đây là hai trang trên cùng máy, chưa phải hai thiết bị LAN. Xem `docs/PLANS/08-PACKAGE-DE-HANDOFF.md` để biết phạm vi bằng chứng và checklist nhóm cần ký nhận. Bộ thử nội bộ ở `docs/validation/INTERNAL-TRIAL-PROTOCOL.md`, hiện chưa có lượt quan sát.

### Thiết bị thật cần người thao tác xác nhận

- [ ] Ba lần liên tiếp trọn luồng ba phút trên đúng hai thiết bị.
- [ ] Ngắt Internet bên ngoài, giữ LAN và chạy lại.
- [ ] HTTPS và quyền camera trên tablet, nếu chọn camera.
- [ ] Camera thật và TTS dừng khi đổi chế độ hoặc kết thúc phiên.
- [ ] Điền bảng cử chỉ dưới đây trước khi chọn camera live.
- [ ] Video dự phòng đã quay và mở thử trên máy trình chiếu.

Ghi ngày và người diễn tập cho từng mục. Hạng mục chưa có bằng chứng giữ trạng thái chờ kiểm tra.

## 4. Camera và dữ liệu đánh giá

MediaPipe xử lý ảnh tại trình duyệt. Tọa độ 3D gửi tới backend LAN theo Q-16. Luật hình học chọn nhãn. Nếu checkpoint tải được, nhánh PyTorch cộng điểm điều chỉnh.

medical_vsl_30.json có 60 mục và 31 liên kết tới bảng 4.363 nhãn Voya. Repo có fixture tổng hợp và checkpoint cục bộ. Chưa có clip người thật gán nhãn hoặc tập test tách người ký để đánh giá nhận diện thực. Regression từ chối landmark trùng điểm đã được thêm. Tay nghỉ và động tác ngoài danh mục cần đánh giá thực nghiệm.

Gói C hiện có công cụ và báo cáo tái lập **bằng fixture tổng hợp**, gồm precision/recall theo nhãn và 12 ca ổn định thời gian; chưa có báo cáo trên người ký thật. Chi tiết ở `AI_model/evaluation/README.md`. Hai clip âm tự tạo vẫn nhận nhầm; một ca dự đoán gián đoạn dài vẫn phát ứng viên. Bộ model mới còn thiếu file, chưa tích hợp vào bản demo.

| Cử chỉ | Người ký / đã tập? | Thiết bị, ánh sáng, khoảng cách | Nhãn mong đợi | Số lượt | Đúng | Nhầm | Từ chối |
|---|---|---|---|---|---|---|---|
| Chạm ngực | Chờ diễn tập | Chờ diễn tập | NGỰC / ĐAU theo ca | — | — | — | — |
| Áp trán | Chờ diễn tập | Chờ diễn tập | SỐT | — | — | — | — |
| Tay nghỉ | Chờ diễn tập | Chờ diễn tập | UNKNOWN | — | — | — | — |
| Ngoài danh mục / rời khung | Chờ diễn tập | Chờ diễn tập | UNKNOWN | — | — | — | — |

Thêm người chưa tập trước, nhờ người dùng hoặc phiên dịch viên VSL kiểm tra cách gọi cử chỉ. Ghi từng lượt nhận nhầm. Camera live tiếp tục chờ diễn tập.

## 5. Khôi phục khi có lỗi

- Mất WebSocket. Chờ Đã kết nối, kiểm tra lại tóm tắt mới. Bản nháp chờ gửi được giữ trong bộ nhớ trang để thử lại.
- Lỗi xác nhận. Đọc thông báo, bấm Sửa lại, rà soát dữ liệu rồi mở tóm tắt lại.
- Nút /demo khóa. Dùng chính tab bệnh nhân đã ghép cho dữ liệu mẫu, tab điều dưỡng để reset.
- Camera lỗi. Chọn Chuyển sang Chạm.
- Backend dừng. Khởi chạy lại, tạo phiên và ghép cặp mới.

## 6. Thao tác B0/B1 sau cập nhật

Trong triệu chứng, chọn tab theo mục muốn khai. Lý do chính giữ nguyên khi thêm mục trong tab Triệu chứng đi kèm. Tab vị trí yêu cầu bệnh nhân trả lời Có đau trước khi chọn trên body map. Mức đau và thời gian có mục Chưa rõ. Số từ camera chỉ áp dụng vào tab đang mở, đơn vị thời gian chọn bằng Chạm.

Phiếu rà soát có sáu thẻ và nút Sửa mục này. Sửa trước duyệt cần xem lại tóm tắt và xác nhận lại. Điều dưỡng hỏi dị ứng tổng quát bằng nút hiện có, người bệnh trả lời tại hộp thoại. Sau duyệt, sửa dữ liệu bị backend từ chối và cần tạo phiên mới. B2 về phủ định từng triệu chứng và revision từng trường còn là đề xuất.
