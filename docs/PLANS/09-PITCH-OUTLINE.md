# Gói E — Outline hồ sơ, bài nói và Q&A

Cập nhật 19/11/2026. Đây là outline để nhóm đưa vào deck, **chưa tạo PowerPoint hoặc bộ slide đã xuất**. Thời lượng hiện hành theo Q-11 là demo 3 phút + hỏi đáp 2 phút, chưa có xác nhận mới từ Ban tổ chức.

## Thông điệp

“AI4Care giúp người khó giao tiếp bằng lời khai thông tin ban đầu, xem và sửa cách hệ thống ghi nhận, rồi cùng điều dưỡng xác nhận trước khi bàn giao.”

Giả thuyết cần khảo sát: một luồng khai và kiểm tra thông tin trực quan có thể hữu ích ở quầy tiếp nhận. Chưa có thử tại bệnh viện hoặc người dùng mục tiêu để kết luận mức độ cần thiết, khả năng tiếp cận hay hiệu quả. Đề tài không nhận chẩn đoán hoặc kê đơn làm mục tiêu.

## Sáu slide nội dung

| Slide | Nội dung đưa lên | Bằng chứng / điều cần tránh |
|---|---|---|
| 1. Bài toán và người dùng | Nhóm hướng tới người Điếc và người khó giao tiếp bằng lời ở tiếp nhận ban đầu; cần tự kiểm tra điều đã khai | Gọi là mục tiêu thiết kế; không đưa số người gặp khó khăn hay mức giảm thời gian khi chưa khảo sát |
| 2. Một phiên hoàn chỉnh | Hỏi một mục → Chạm/ứng viên → sửa → phiếu → bệnh nhân xác nhận → điều dưỡng duyệt → STT → reset | Luồng đã có và E2E; dùng hình hai màn hình, không gọi là quy trình bệnh viện đã triển khai |
| 3. Vai trò AI và con người | MediaPipe lấy landmark; luật hiện tại gợi ý; LLM mock ở bản demo; validator/fallback; con người xác nhận | Tách tính năng chạy thật, mock và model mới đang chờ; không gán mock thành AI dịch VSL thật |
| 4. Chất lượng đã kiểm tra | 112 test backend, 73 frontend, 8/8 E2E localhost; sửa phiếu, hỏi dị ứng, cảnh báo, reset | Test phần mềm không phải accuracy hoặc hiệu quả bệnh viện; liệt kê cấu hình ngày/mốc code |
| 5. Bằng chứng còn thiếu | Camera có 2/5 clip âm tổng hợp nhận nhầm; người dùng nội bộ n=0; chưa có người dùng mục tiêu | Kèm kế hoạch C/D và bộ thử đã chuẩn bị; không trưng phần trăm tổng hợp như kết quả người thật |
| 6. Giá trị cần kiểm chứng và bước tiếp | Kiểm tra đủ/đúng dữ kiện, sửa đúng mục, hạn chế nhập lại; tiếp nhận model và thử theo người ký | Nêu là mục tiêu; đề nghị cơ hội thử cùng người dùng/điều dưỡng, không tuyên bố sản phẩm đã sẵn sàng bệnh viện |

Sáu slide dùng cho hồ sơ/Q&A. Với ba phút demo, chỉ mở slide mục tiêu lúc giới thiệu và slide giới hạn lúc kết thúc; dành phần chính cho thao tác theo `01-DEMO-SCRIPT.md`. Không cộng thêm bài đọc sáu slide vào ba phút.

## Bảng so sánh để nói đúng điểm khác biệt

Nguồn ngoài được xem ngày 19/11/2026. Cboard là ví dụ công cụ AAC, không phải một thử nghiệm đối chứng đã chạy với AI4Care.

| Phương án | Điều đã biết | Điều chưa thể kết luận |
|---|---|---|
| Cách viết/nhập chữ rồi đọc lại, do nhóm mô phỏng | Có thể dùng làm B trong thử nội bộ nếu nhóm thống nhất; hiện chưa chạy | Chưa xác minh đây là cách hiện hành ở bệnh viện; chưa có thời gian/lỗi để so sánh |
| Cboard | Ứng dụng AAC mã nguồn mở trên web, dùng ký hiệu/hình và text-to-speech cho người khó khăn về lời nói/ngôn ngữ. [Trang chính thức](https://www.cboard.io/en/) | Chưa thử cùng tác vụ tiếp nhận; không suy đoán từ trang giới thiệu rằng có hoặc không có mọi tính năng y tế |
| AI4Care hiện tại | Đã có thông tin có cấu trúc, sửa từng mục, hai vai trò xác nhận, cảnh báo theo luật và reset phiên; xem E2E trong repo | Chưa chứng minh dễ dùng hơn AAC hoặc cách giao tiếp thực tế; chưa có đánh giá VSL độc lập |

Điểm nhóm có thể bảo vệ là **thiết kế và triển khai luồng tiếp nhận có kiểm tra hai chiều**. Đây không phải bằng chứng “đầu tiên”, “duy nhất”, hoặc mọi công cụ khác không làm được. Bảng trên mô tả phạm vi và bằng chứng, không xếp hạng chất lượng.

## Sổ tuyên bố và bằng chứng

| Tuyên bố có thể nói | Dẫn chứng | Phạm vi |
|---|---|---|
| Có thể sửa thời gian mà vẫn giữ lý do chính và Ho đi kèm | `frontend/e2e/demo.spec.ts`, ca cuối | Dữ liệu giả lập, localhost |
| Trả lời câu hỏi dị ứng cập nhật phiếu và cần xác nhận | E2E dị ứng + backend intake guards | Câu hỏi tổng quát đã map; không phải hội thoại y khoa tự do |
| Bản demo có đường chặn output LLM độc hại | E2E mock độc hại và safety tests | Bộ ca đã kiểm, không phải bảo đảm mọi nội dung có thể phát sinh |
| Nhận diện camera chưa được chứng minh đủ tốt | `AI_model/evaluation/reports/synthetic.json`, báo cáo C và review model ngoài | Fixture và kiểm kê; không có accuracy người thật |
| Chưa biết có giảm thời gian hay sai dữ kiện cho người dùng | `docs/validation/RESULTS.md`: chưa thu lượt thử | Đây là giới hạn hiện tại |

## Câu trả lời ngắn cho ban giám khảo

**Model của nhóm đã nhận diện tốt chưa?** Chưa đủ bằng chứng trên người ký mới. Bản đang chạy gợi ý bằng luật; nhóm đã có công cụ kiểm tra và đang chờ bộ model mới đầy đủ để so sánh. Không dùng 60 gloss hay confidence làm accuracy.

**Vậy AI nằm ở đâu?** MediaPipe lấy landmark trong nhánh camera; pipeline diễn đạt được thiết kế qua LLM adapter, validator và fallback. Bản demo mặc định dùng LLM mock, nhóm trình bày rõ phần đó. Model học sâu mới chưa tích hợp; không gọi toàn bộ luồng Chạm là dịch VSL tự động.

**Nếu nhận sai thì sao?** Ứng viên cần bệnh nhân nhận/sửa trước khi cập nhật. Có thể chuyển sang Chạm, xem lại từng thẻ hoặc yêu cầu nhân viên hỗ trợ. Kiểm tra người dùng hiểu và phát hiện lỗi vẫn đang chờ thử.

**Ai chốt triệu chứng?** Bệnh nhân kiểm tra lời khai và xác nhận toàn phiếu; điều dưỡng xử lý phần cần hỏi lại/cảnh báo rồi duyệt tiếp nhận. Đây là chốt nội dung đã khai, không phải chốt bệnh hoặc chẩn đoán.

**Đã thử ở bệnh viện công chưa?** Chưa. Nhóm mới kiểm tra phần mềm và chuẩn bị thử nội bộ. Cần khảo sát quy trình và thử có sự phối hợp trước khi kết luận phù hợp triển khai.

**Giảm bao nhiêu thời gian?** Chưa có số đo tác vụ người dùng. Thời gian cập nhật DOM trong E2E là chỉ số phần mềm, không trả lời câu hỏi này.

**Có hỗ trợ người Điếc không đọc tốt tiếng Việt không?** Đây là điểm cần người dùng và người kiểm tra VSL đánh giá. Biểu tượng và câu ngắn chưa đủ để khẳng định dễ hiểu. Nhóm chưa có video câu hỏi VSL được kiểm tra.

**Nếu không có Internet?** Chạm + mock được thiết kế chạy qua LAN; hai thiết bị vẫn cần mạng nội bộ. Kiểm tra ngắt Internet ngoài trên thiết bị thật đang chờ; TTS phụ thuộc giọng của thiết bị.

**Có phiên dịch viên trực tiếp không?** MVP mô phỏng yêu cầu hỗ trợ, chưa kết nối dịch vụ phiên dịch thật.

**Dữ liệu camera có bị upload không?** Bản Signly hiện tại xử lý video trong trình duyệt và gửi tọa độ tay tới backend LAN theo Q-16. Bản repo model ngoài có đường upload video khác; chưa đưa đường đó vào sản phẩm.

**Sau cuộc thi cần gì?** Nhận đầy đủ model, kiểm tra nguồn/quyền, đánh giá theo người ký, thử tác vụ với đúng người dùng/điều dưỡng và kiểm chứng quy trình trước khi xem xét triển khai. Không hứa có thể thay model trong vài phút.
