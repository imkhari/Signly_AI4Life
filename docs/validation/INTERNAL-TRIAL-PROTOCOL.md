# Gói D — Bộ thử tác vụ nội bộ

Chuẩn bị ngày 19/11/2026 theo Q-18: hiện chỉ có người thử nội bộ. **Chưa thực hiện thử người dùng; số lượt quan sát hiện bằng 0.** Tài liệu này không xác nhận khả năng sử dụng với người Điếc hoặc hiệu quả ở bệnh viện.

## Chuẩn bị và lời giới thiệu

Dùng ca giả lập dưới đây, Chạm + LLM mock, một màn bệnh nhân và một màn điều dưỡng. Một người điều phối/ghi chép, một người đóng vai bệnh nhân, một người đóng vai điều dưỡng; có thể đổi vai giữa ba thành viên. Không coi người đóng vai là người dùng mục tiêu hay điều dưỡng thật.

Lời giới thiệu để đọc trước thử:

> Đây là thử nội bộ bản demo, không phải khám bệnh. Chỉ dùng thông tin trên thẻ giả lập, không nhập thông tin sức khỏe hay danh tính thật. Bạn có thể dừng bất kỳ lúc nào. Nhóm ghi mã lượt, thời gian và số lỗi để sửa sản phẩm; buổi thử này không ghi âm, quay hình hay lưu camera/landmark. Bạn có đồng ý tham gia lượt thử nội bộ này không?

Chỉ bắt đầu khi người thử đồng ý; ghi Có/Không ở phiếu, không cần tên hoặc chữ ký. Đây là lời giới thiệu nội bộ, không phải mẫu chấp thuận nghiên cứu với bệnh nhân. Nếu mở rộng đối tượng hoặc muốn thu hình/landmark, cần phương án được duyệt riêng theo docs/07 trước khi làm.

Khởi chạy theo `docs/DEPLOYMENT_GUIDE.md`. Reset phiên trước mỗi lượt, kiểm tra mã cũ không còn ghép được và chỉ giữ một kết nối mỗi vai trò. Người quan sát có đồng hồ, phiếu `TRIAL-RECORD.md` và ca được giao. Cho xem thao tác ghép cặp một lần trong lượt làm quen; không tính lượt đó vào kết quả đo.

## Ca giả lập và đáp án

### T1-X — Khai và bàn giao thông tin

Thẻ đưa người thử: “Lý do đến khám là đau. Có đau ở bụng trên, mức 3/10, bắt đầu 2 giờ trước. Có ho đi kèm. Không dị ứng. Hãy khai, xem lại và bàn giao phiếu.”

Đáp án chấm, đúng **7 mục**:

| Mục | Giá trị cần thấy trên phiếu và màn điều dưỡng |
|---|---|
| Lý do chính | PAIN / Đau |
| Có đau | true / Có đau |
| Vị trí | ABDOMEN_UPPER / Bụng trên |
| Mức đau | 3/10 |
| Bắt đầu | 2 + hour / 2 giờ |
| Đi kèm | COUGH / Ho; không ghi đè lý do chính |
| Dị ứng | has_allergy=false / Không dị ứng |

Thời gian: bắt đầu khi giao thẻ và cho thao tác; kết thúc khi điều dưỡng duyệt và bệnh nhân thấy STT. Ghi riêng gián đoạn/hỏng thiết bị, không lặng lẽ loại lượt chậm.

**T1-Y tương đương để đổi thứ tự:** giữ nguyên mọi giá trị, chỉ đổi vùng thành HEAD / Đầu. Cặp X/Y giúp giảm nhớ đáp án, không phải hai tập dữ liệu lâm sàng tương đương đã được thẩm định.

### T2-X/T2-Y — Phát hiện và sửa một mục sai

Điều phối chuẩn bị phiếu như T1-X/T1-Y với thời gian đang là **2 giờ**, chưa xác nhận. Thẻ người thử ghi **1 giờ**, các mục khác giữ nguyên. Chỉ yêu cầu “Hãy kiểm tra phiếu theo thẻ, sửa nếu cần và xác nhận”, không chỉ sẵn nút cần bấm.

Đáp án: vẫn đúng 7 mục, riêng thời gian thành 1 + hour; lý do và Ho không mất. Nếu bắt đầu ở phiếu đã xác nhận, việc sửa phải yêu cầu xác nhận lại. Dùng phiên chưa được điều dưỡng duyệt vì bản đã duyệt khóa sửa.

Đo T2 riêng từ lúc thấy phiếu sai đến khi phiếu đúng được xác nhận lại. Không gộp thời gian T2 với T1. Ghi phát hiện sai tự nhiên và sửa thành công thành hai quan sát riêng; chỉ nhắc “sai ở thời gian” khi đã tính một lần trợ giúp.

### T3 — Giữ đúng thông tin chưa rõ

Thẻ: “Đau ở đầu. Chưa biết mức đau, chưa nhớ lúc bắt đầu và chưa chắc có dị ứng. Không thêm triệu chứng đi kèm.”

Đáp án 7 mục: PAIN; has_pain=true; HEAD; severity=null; onset chưa rõ; extras=[]; has_allergy=null. Các null đúng theo thẻ được chấm **đúng**, không tính là bỏ sót. Hệ thống phải thể hiện cần hỏi lại, không đổi “chưa rõ dị ứng” thành “không dị ứng”. Nếu duyệt ca này, điều dưỡng phải xử lý/ack cảnh báo theo guardrails hiện tại; không dùng phép thử để yêu cầu hệ thống tự suy đoán.

### T4 — Câu hỏi điều dưỡng

Dùng phiên giả lập riêng. Điều dưỡng hỏi dị ứng tổng quát bằng nút có sẵn. Người thử chọn Có, rồi sửa thẻ dị ứng để thêm Penicillin theo thẻ giả lập. Đối chiếu cả hai màn, yêu cầu xác nhận lại trước duyệt. Chấm thao tác theo checklist thay vì so thời gian với T1: câu hỏi xuất hiện; phản hồi vào đúng mục; tên được giữ; có tóm tắt mới; chưa xác nhận thì chưa duyệt; sau duyệt không sửa được. Không gửi câu hỏi ngoài tập hiện có.

## Cách so sánh và tổ chức lượt

Phương án A là AI4Care Chạm + mock. Phương án B đề xuất nội bộ là người bệnh viết/nhập nội dung trên trang trống, người đóng vai điều dưỡng đọc và chép vào bảy mục rồi đưa lại để kiểm tra. B **chưa được xác nhận là quy trình đang dùng ở bệnh viện**; không gọi nó là baseline bệnh viện.

Trước khi so, hỏi người phụ trách: hiện nhóm đang mô phỏng cách giao tiếp nào, thông tin nào cần hỏi lại và ai quyết định phiếu đã xong? Ghi câu trả lời không có danh tính vào phiếu. Nếu chưa thống nhất B, chỉ thử A và để bảng so sánh chờ; không tự gán thời gian cho B.

Lịch đề xuất, chưa có ai thực hiện:

| Mã nội bộ | Thứ tự T1 | Ca | Thứ tự T2 |
|---|---|---|---|
| P01 | A → B | X → Y | B → A |
| P02 | B → A | X → Y | A → B |
| P03 | A → B | Y → X | B → A |

Không cần đủ ba người để bắt đầu, báo đúng số người/lượt thực tế. T3/T4 chạy sau phần đo so sánh để tránh dạy trước thao tác sửa. Giữ cùng cách tính thời gian và chấm bảy mục cho A/B. Với mẫu nội bộ nhỏ, chỉ mô tả quan sát, không kiểm định hay khẳng định hiệu quả cho cộng đồng.

## Chỉ số và quy tắc ghi

- Hoàn thành: phiếu đã được hai bên kiểm tra, đúng đáp án và được duyệt/STT ở T1. T2 hoàn thành khi sửa đúng và xác nhận lại. Ghi không hoàn thành, không bỏ khỏi mẫu số.
- Mỗi mục: đúng, sai hoặc thiếu; tổng bằng 7 cho T1/T2/T3. Thời gian là một mục gồm cả số và đơn vị. Chưa rõ khi đáp án yêu cầu rõ là thiếu; chưa rõ đúng thẻ T3 là đúng.
- Sửa: phát hiện mục sai? sửa thành công? có mất thông tin khác không? Ghi cả số lần trợ giúp.
- Trợ giúp: một lần người hướng dẫn nói/chỉ thao tác khi người thử đang mắc. Ghi lý do, không nhập thông tin thật vào ghi chú.
- Hiểu UI: yêu cầu chỉ và giải thích bốn ý — lý do chính, thời gian, trạng thái xác nhận, cách sửa. Ghi đúng/4; không suy diễn là đã hiểu VSL.
- Điều dưỡng: số lần phải nhập/sửa lại; số lần hỏi lại. Không tính hành động duyệt bắt buộc là công việc làm lại.
- Thời gian: giây; báo trung vị và min–max theo từng tác vụ/phương án, kèm n. Không ghi 0 cho dữ liệu chưa đo. Đếm người riêng với số lượt, không gọi sáu lượt của ba người là sáu người.

Điền một `TRIAL-RECORD.md` mỗi lượt rồi tổng hợp vào `trials.csv`. Header có sẵn, chưa có hàng quan sát. `RESULTS.md` hiện để chờ. Chỉ giữ mã P01/T01 và số liệu tác vụ; không ghi tên, thông tin liên hệ, lời khai sức khỏe thật, ảnh/video hoặc payload phiên. Reset dữ liệu app khi kết thúc mỗi lượt.

Thử nội bộ không thay thế kiểm tra với người Điếc, điều dưỡng thật, phiên dịch viên VSL hoặc diễn tập hai thiết bị tại địa điểm thi.
