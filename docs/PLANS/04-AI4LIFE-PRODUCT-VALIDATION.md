# Kế hoạch hoàn thiện và kiểm chứng AI4Care cho Danang AI4Life

Ngày lập 19/11/2026. Trạng thái đề xuất để chủ dự án chọn phạm vi triển khai.

## 1. Mục tiêu sản phẩm

AI4Care giúp người Điếc và người khó giao tiếp bằng lời khai triệu chứng tại quầy tiếp nhận, kiểm tra lại thông tin và bàn giao cho điều dưỡng. Kết quả của một phiên là phiếu lời khai đã được bệnh nhân xác nhận, các mục còn chưa rõ và quyết định tiếp nhận của điều dưỡng.

Phần AI cần được đánh giá qua khả năng hỗ trợ hoàn thành nhiệm vụ này. Cử chỉ, vị trí cơ thể và mức đau đều là đầu vào của lời khai. Thẩm định y tế và quyết định chuyên môn thuộc nhân viên y tế.

## 2. Căn cứ và trạng thái hiện tại

Tỷ trọng do chủ dự án cung cấp gồm độc đáo 10%, công nghệ phù hợp 10%, tính năng 10%, hiệu quả 20%, chất lượng 30%, hồ sơ 10%, trình bày 10%. Các hướng dẫn chi tiết trong ghi chú là tư vấn tham khảo. Cần xác nhận thể lệ và thời lượng chính thức trước khi khóa slide.

Hiện repo có luồng Chạm → tóm tắt → bệnh nhân xác nhận → điều dưỡng duyệt → STT → reset. Kết quả đã ghi nhận là 79 test backend, 68 test frontend, 6 ca E2E chạy ba lượt và build qua. Đây là mốc tham chiếu, cần chạy lại khi triển khai.

Camera sử dụng MediaPipe trên trình duyệt và luật hình học tại backend LAN. Danh mục có 60 gloss, 31 liên kết nhãn Voya. Số mục và số test hiện tại chưa đủ để xác lập chất lượng nhận diện trên người ký mới. Chưa có số liệu thử người dùng hay thử quy trình tại bệnh viện trong repo.

P9 hiện hành là sửa lỗi và kiểm chứng demo. Các hạng mục bổ sung tính năng dưới đây là đề xuất mở rộng, cần được chủ dự án chọn trước khi viết code. Thay đổi contract, safety hoặc cách thu thập dữ liệu cần xác nhận theo AGENTS.md.

## 3. Phạm vi ưu tiên

| Mức | Hạng mục | Kết quả cần thấy |
|---|---|---|
| Ưu tiên 1 | Khảo sát nhiệm vụ và xác nhận bằng hình ảnh | Người dùng hiểu hệ thống đang ghi điều gì, sửa được ý sai |
| Ưu tiên 1 | Hỏi và trả lời từng mục theo ngữ cảnh | Câu trả lời được gắn đúng trường và giữ nguyên ý đã xác nhận |
| Ưu tiên 1 | Đo hiệu quả và chất lượng | Có số mẫu, cách đo, cách so sánh và kết quả tái lập |
| Ưu tiên 2 | Nhóm nhỏ ký hiệu được kiểm tra và đánh giá | Có kết quả trên người ký mới, có từ chối khi chưa đủ căn cứ |
| Ưu tiên 2 | Câu hỏi hai chiều dễ hiểu | Điều dưỡng hỏi được, bệnh nhân trả lời được, nội dung cập nhật đúng |
| Sau khi có bằng chứng | Video câu hỏi VSL, gọi lượt trực quan | Đưa vào khi khảo sát cho thấy đây là trở ngại cần giải quyết |

LLM mock tiếp tục là cấu hình dự phòng đã kiểm thử. Nhánh AI thật muốn được trình diễn cần có đánh giá riêng, ghi rõ cấu hình và đường fallback.

## 4. Luồng sản phẩm đề xuất

1. Chọn cách giao tiếp phù hợp. Hình ảnh và chạm luôn sẵn sàng, camera là lựa chọn theo khả năng sử dụng.
2. Hiện một câu hỏi và hình minh họa, ví dụ chọn lý do đến khám.
3. Thu một câu trả lời từ chạm hoặc camera. Camera chỉ tạo ứng viên thuộc phạm vi câu hỏi đang hiển thị.
4. Hiện thẻ gợi ý để bệnh nhân chọn Nhận, Sửa hoặc Chưa rõ. Sau Nhận, cập nhật trường tương ứng.
5. Hỏi tiếp thông tin còn thiếu trong nhóm câu hỏi đã rà soát. Ví dụ vị trí, mức đau, thời điểm bắt đầu và dị ứng.
6. Cho phép bổ sung triệu chứng đi kèm bằng thao tác rõ ràng. Bảo toàn lý do khám chính đã chọn. Mỗi trường có cách sửa cụ thể.
7. Hiện phiếu bằng các thẻ hình ảnh và câu ngắn. Bệnh nhân kiểm tra toàn bộ, chọn Đúng hoặc quay lại sửa.
8. Điều dưỡng nhận nội dung đã xác nhận, xem phần cần hỏi lại và duyệt theo guardrails. Sau thay đổi, nội dung liên quan phải được kiểm tra lại.
9. Hiện kết quả tiếp nhận. Kết thúc phiên xóa dữ liệu theo chính sách hiện có.

Ví dụ dùng trong thiết kế là ca giả lập đau bụng, mức đau do bệnh nhân chọn, bắt đầu hai giờ trước. Lượt hỏi thời gian và lượt hỏi mức đau phải gán số hai vào hai trường khác nhau. Mục chưa trả lời giữ trạng thái chưa rõ. Chọn vùng cơ thể cần một thao tác xác nhận ý nghĩa trước khi ghi có đau.

Các trường hợp phải thiết kế trước gồm thêm HO sau ĐAU, đổi số giờ, trả lời KHÔNG khi hỏi dị ứng, ứng viên ngoài ngữ cảnh, sửa sau xác nhận, cùng triệu chứng ở nhiều vị trí và mất kết nối giữa hai thao tác. Những ý chưa biểu diễn được bằng schema hiện tại cần bản đề xuất contract để chủ dự án chốt.

## 5. Lộ trình đề xuất cho nhóm ba người

Ước lượng 8–10 ngày làm việc kể từ khi có đủ người phối hợp và dữ liệu hợp lệ. Lịch này là phương án phân bổ, chưa phải hạn thi đã xác nhận. Một số bước phụ thuộc người dùng và điều dưỡng, cần đặt lịch sớm.

| Mốc | Công việc | Đầu ra và điều kiện chuyển bước |
|---|---|---|
| A, nửa ngày | Kiểm kê repo và xác nhận phạm vi | Bảng đã có / thiếu / cần quyết định, bản đề xuất UX và contract nếu cần |
| B, 1–2 ngày | Khảo sát và thiết kế tác vụ | Mô tả nhiệm vụ chính, luồng thực tế, ca giả lập và tiêu chí đánh giá |
| C, 2–3 ngày | Hỏi đáp theo ngữ cảnh và xác nhận trực quan | Một ca chạy hết, sửa từng ý được, test các trường hợp biên |
| D, 2–3 ngày nếu có dữ liệu | Đánh giá và cải thiện một năng lực AI | Baseline, tập đánh giá độc lập, báo cáo lỗi và quyết định dùng AI |
| E, 1 ngày | Thử tác vụ với người dùng | Kết quả có số mẫu, số lần trợ giúp, sai lệch và phản hồi |
| F, 1–2 ngày | Sửa lỗi, khóa phiên bản và diễn tập | Kiểm thử qua, checklist thiết bị thật, hồ sơ và video dự phòng |

Phân công theo Q-12. A phụ trách dữ liệu, backend và đánh giá AI. B phụ trách trải nghiệm bệnh nhân và xác nhận. C phụ trách điều dưỡng, E2E và demo. Cả nhóm phối hợp khảo sát và diễn tập. Đây là phân công thành viên dự kiến trong kế hoạch, việc giao cho agent cần theo quyền đã được cấp trong phiên làm việc.

Nếu chỉ còn 2–3 ngày, ưu tiên sửa lỗi hiện hữu, đánh giá khả năng hiểu và sửa phiếu, thu bằng chứng thử nghiệm nhỏ và hoàn thiện bài trình bày. Mở rộng model phụ thuộc khả năng có dữ liệu và thời gian đánh giá.

## 6. Khảo sát có thể tiến hành ngay

Mục tiêu đề xuất là 5–8 người dùng mục tiêu, 2–3 điều dưỡng và một người dùng thành thạo hoặc phiên dịch viên VSL. Đây là thử nghiệm ban đầu, số người thực tế phải ghi đúng.

Câu hỏi cho người dùng gồm cách họ đang giao tiếp khi khám, khâu khó nhất, mức độ hiểu biểu tượng và câu chữ, cách phát hiện thông tin bị hiểu sai, cách họ muốn sửa và yêu cầu người hỗ trợ. Hỏi cách giao tiếp ưa thích trước khi chọn phương án thử.

Câu hỏi cho điều dưỡng gồm vị trí có thể dùng thiết bị, người phụ trách hỗ trợ, dữ liệu tối thiểu cần bàn giao, thông tin hay phải hỏi lại và cách phiếu có thể dùng trong quy trình hiện tại. Xác minh cả cách gọi số và xuất phiếu.

Dùng ca giả lập và hướng dẫn thử thống nhất. Lưu kết quả tổng hợp, số lượt và nhận xét đã ẩn danh. Việc thu clip, landmark hoặc dữ liệu nghiên cứu từ người thật cần phương án xin đồng ý, lưu trữ và xóa được chủ dự án phê duyệt trước, phù hợp ranh giới dữ liệu phiên trong AGENTS.md.

## 7. Đánh giá AI và dataset

Chọn một năng lực AI trọng tâm sau khi biết nhiệm vụ người dùng. Với camera, đề xuất một nhóm 6–10 ký hiệu có ý nghĩa trong luồng hỏi đáp, được kiểm tra bởi người dùng VSL. Với LLM, phạm vi có thể là trích xuất lời khai hoặc đề xuất câu hỏi từ tập câu hỏi đã rà soát. Mọi văn bản LLM vẫn qua validator và fallback.

Kiểm kê nguồn, quyền sử dụng, video/landmark thực có, nhãn và cách tiền xử lý. Giữ toàn bộ clip của cùng người trong cùng nhóm chia dữ liệu. Nếu dữ liệu quá ít, ghi giới hạn và dùng đánh giá tách người ký phù hợp. Tránh dùng các frame cùng clip ở cả train và test.

Đánh giá nhãn camera ở hai mức. Mức đầu đo trên cùng một tập đầu vào để so luật hiện tại với phương án AI. Mức thứ hai đo trọn luồng với camera, độ trễ và bộ ổn định. Ghi precision/recall theo ký hiệu, macro-F1, số trường hợp từ chối và tỷ lệ nhận nhầm trên tay nghỉ, ngoài danh mục hoặc ngoài khung. Báo cả tỷ lệ mẫu được hệ thống chấp nhận để việc từ chối nhiều không làm kết quả đẹp giả tạo.

Với trích xuất, đo từng trường, đặc biệt phủ định, đơn vị thời gian, nhiều triệu chứng và dữ kiện được thêm ngoài đầu vào. Tập câu thử gồm câu rõ, câu thiếu, mâu thuẫn và yêu cầu vượt phạm vi. Phương án hỏi lại cần đánh giá chọn đúng câu đã cho phép và số lượt hỏi dư.

Chốt tiêu chí chấp nhận sau baseline và trước khi xem kết quả trên tập test cuối. Ghi số mẫu, thiết bị, phiên bản, cách chia tập, phiên bản dữ liệu và lệnh chạy. Khi chưa có dữ liệu, tạo cấu trúc báo cáo và ca tổng hợp phục vụ phần mềm, ghi rõ đánh giá người thật đang chờ.

## 8. Đo hiệu quả sử dụng

So sánh cách đang dùng được xác nhận qua khảo sát với luồng đề xuất trên cùng loại tác vụ. Với thử lặp trên cùng người, dùng ca tương đương và đổi thứ tự trải nghiệm để giảm ảnh hưởng luyện tập. So sánh AI và luật với giao diện giữ tương đương khi mục tiêu là xác định đóng góp AI.

| Chỉ số | Cách đo |
|---|---|
| Hoàn thành | Số lượt có phiếu được hai bên kiểm tra / tổng lượt |
| Thông tin đúng | Số trường khớp ca giả lập được giao; ghi cả trường bỏ sót và ghi sai |
| Sửa thành công | Số lượt bệnh nhân sửa đúng mục được cố ý cho sai / tổng lượt thử sửa |
| Trợ giúp | Số lần người hướng dẫn phải can thiệp và lý do |
| Thời gian | Từ bắt đầu tác vụ đến kết quả đã xác nhận; ghi riêng thời gian hệ thống và thao tác |
| Hiểu giao diện | Người dùng chỉ đúng ý của từng thẻ, câu hỏi và trạng thái |
| Tải công việc | Điều dưỡng có cần nhập lại, hỏi lại hoặc đổi màn hình bao nhiêu lần |

Báo tử số, mẫu số, thời gian trung vị và khoảng dao động. Với thử nghiệm nhỏ, mô tả kết quả quan sát và giới hạn. Kết quả từ người thử nội bộ được ghi riêng với người dùng mục tiêu.

## 9. Tiêu chí nghiệm thu và hồ sơ

- Luồng chính qua các bước từ ghép cặp đến phiếu đã duyệt và reset. Các câu trả lời được gắn đúng mục. Sửa lời khai có hành vi xác nhận lại phù hợp.
- Test hồi quy phủ nhiều triệu chứng, phủ định theo ngữ cảnh, số và đơn vị, sửa sau xác nhận, dữ liệu cũ, reconnect, timeout, lỗi LLM và privacy.
- Chạy make check, build và E2E phù hợp với thay đổi. Duyệt UI theo docs/06 trên tablet và hai cửa sổ trình chiếu.
- Báo cáo AI có nguồn dữ liệu, cách chia tập, baseline, kết quả và ví dụ lỗi hoặc ghi rõ phần đang chờ.
- Báo cáo người dùng có số mẫu, tác vụ, cách đo và phản hồi. Người phụ trách xác nhận các kiểm tra thiết bị thật.
- Ba lần diễn tập trên hai thiết bị, thử ngắt Internet ngoài khi LAN vẫn hoạt động và quay video dự phòng.
- Slide dành thời lượng cho chất lượng và hiệu quả. Chuẩn bị bản demo ba phút theo Q-11 hiện hành. Điều chỉnh thời lượng khi Ban tổ chức xác nhận.

Thông điệp đề xuất cho bài thi là hỗ trợ bệnh nhân truyền đạt đúng điều muốn nói, tự sửa cách hệ thống hiểu và giúp điều dưỡng nhận thông tin đã xác nhận.

## 10. Các quyết định cần chốt khi bắt đầu triển khai

Hạn thi và số ngày còn lại; khả năng tiếp cận người dùng/điều dưỡng; có dữ liệu VSL hợp lệ hay chưa; phạm vi phần AI thật; và gói cải tiến được phép triển khai ngoài P9. Chỉ hỏi thông tin còn thiếu sau khi kiểm tra repo và lịch sử trao đổi.

Các đề xuất thay schema hoặc thu dữ liệu nghiên cứu cần hồ sơ tác động và xác nhận theo AGENTS.md trước khi thực hiện phần phụ thuộc. Bản kế hoạch này ghi định hướng, chưa thay contract hay chính sách dữ liệu đang áp dụng.
