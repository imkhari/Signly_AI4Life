# P9 — Tiếp nhận theo câu với V2

19/11/2026. Chủ dự án chọn tiếp tục V2 và luồng phù hợp model sau khi đối chiếu nhận diện câu/ký hiệu rời. Phạm vi lần này là gợi ý cả câu và cập nhật lời khai có kiểm tra, chưa triển khai các thay đổi phân luồng lâm sàng hoặc train model.

## Phạm vi thực hiện

1. Giữ checkpoint, extractor, allowlist câu và ngưỡng 0,7. Capture vẫn 6 giây/180 frame, 24 frame/800 ms, gap 500 ms và kiểm vai/tay.
2. Bổ sung context `intake` cho request frames V2, trả `intake_suggestion` có chief_complaint_code, pain_present và body_regions. Chỉ dữ liệu có trong toàn câu thuộc allowlist; không gửi câu decoder tự do về UI.
3. Một câu “tôi bị đau ngực” tạo một phiếu gợi ý PAIN/true/CHEST; “tôi bị ho” không phủ định đau. Bụng/lưng chung chung không tự chọn vùng trên/dưới. Không tách số, phủ định hoặc đa ý chưa hỗ trợ.
4. Camera mở đầu ở lý do khám dùng cả câu, hiện Nhận/Sửa bằng một nút dùng cả gợi ý. Chưa ghi vào draft/server trước khi bấm; đây chưa phải PATIENT_CONFIRMED.
5. Khi chấp nhận, cập nhật các trường đồng thời trong một onChange và một INPUT_UPDATED. Nếu thay lời khai đau/vị trí, xóa mức đau/thời gian cũ có thông báo, giữ dị ứng và các mục không liên quan. Không ghép thẻ từ nhiều câu thành nghĩa mới.
6. Dẫn tới phần còn thiếu bằng Chạm: tình trạng/vị trí khi chưa rõ, mức đau, thời gian; luôn có Chưa rõ. Sau đó dị ứng, xác nhận toàn phiếu và điều dưỡng duyệt như hiện tại.
7. Ngắt kết nối hoặc draft/frame thay đổi làm hủy request/gợi ý cũ. Reset/unmount tiếp tục dọn camera, tọa độ, request. Không đổi schema SemanticFrame 1.0 hoặc các event xác nhận/duyệt.
8. Trang validation giữ context symptom/location cũ để không đổi ý nghĩa nhãn lịch sử; profile mới tách phiên bản, 11 lượt ca âm giữ baseline, không diễn giải thành kiểm chứng luồng mới.

## Contract và kiểm tra

Pydantic/TypeScript cập nhật đồng thời field phản hồi camera, docs 02/03/07 bổ sung ngoại lệ intake có duyệt. Nhánh context cũ/hands tiếp tục tương thích; intake chỉ nhận frames. Thay đổi không thêm dependency/dịch vụ, không gửi video hoặc thêm lưu trữ.

Kiểm tra có: đau ngực→Đau+Ngực cùng lần ghi; câu thiếu vùng không bịa vùng; câu ho không biến đau thành Không; phủ định/đa ý/số ngoài allowlist→UNKNOWN; bỏ/ký lại không ghi; draft đổi/hủy/reset không nhận kết quả cũ; đổi vị trí không mang mức đau/thời gian cũ sang; đồng bộ điều dưỡng, xác nhận, critical ack và khóa sau duyệt. Dữ liệu tổng hợp/E2E phải ghi là mô phỏng. Chất lượng ký thật, video mẫu VSL và người dùng mục tiêu vẫn pending.

Không mở nhận diện hội thoại tự do, không thêm LLM trích xuất, không dùng LLM ghép câu camera và không chuyển sang model isolated. TTS/Chạm/phiếu trực quan và fallback hiện có tiếp tục sử dụng.


## Kết quả triển khai

Đã hoàn tất phạm vi kỹ thuật trên: 173 test backend, 96 test frontend (`make check`), 8 test runtime V2, build và 18 E2E qua. E2E dùng detector/response mô phỏng, WebSocket/phiếu/duyệt thật của app; kiểm đau+ngực cùng patch, không ghi trước nhận, bổ sung, hai bước xác nhận, bỏ gợi ý và fallback Chạm. Test lớp logic kiểm xóa detail cũ và câu ho không phủ định đau; lifecycle kiểm hủy request/gợi ý. Đã xem ảnh 720/1024; điều khiển/đồng hồ ghim khi cuộn không tự kéo trang.

Backend localhost8000 đã được khởi động lại với intake; frontend localhost5173 chạy.11ca âm cũ giữ riêng baseline4e4ebb và hash nguồn, profile mới0lượt live. Chưa có phép thử dương VSL mới hoặc thay đổi chất lượng model. Chưa cập nhật PPTX/ảnh slide; README bàn giao ghi rõ snapshot cũ.
