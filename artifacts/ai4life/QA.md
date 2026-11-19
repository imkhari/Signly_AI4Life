# Hỏi đáp dự kiến

**Vì sao cần AI khi đã có nút chạm?**
Chạm là đường nhập ổn định. AI camera là lựa chọn bổ sung cho người phù hợp, còn adapter LLM có thể diễn đạt khung thông tin thành câu ngắn. Giá trị cần kiểm chứng là hai phương thức này có giúp người dùng diễn đạt đúng và ít cần hỗ trợ hơn không; nhóm chưa có số đo đó. Không gọi thao tác Chạm là nhận diện AI.

**Khác ứng dụng dịch ký hiệu ở đâu?**
Nhóm tập trung vào tiếp nhận: danh mục thông tin có cấu trúc, sửa từng mục, bệnh nhân xác nhận và điều dưỡng duyệt. Đây là cách tích hợp theo quy trình, chưa phải bằng chứng thuật toán dịch VSL mới hoặc sản phẩm đầu tiên.

**Model hiện tại là gì, ai train?**
Weights V2 do nhóm cung cấp; pipeline hiện dùng greedy decoder tiếng Việt 442 token, PyTorch trong worker riêng. Không tuyên bố đã tự train lại V2 hoặc đã xác minh đầy đủ dữ liệu train gốc. Cấu hình train gốc chưa đầy đủ và CTC 374 lớp chưa có vocab được xác minh nên không dùng nhánh đó.

**Dataset có đủ tốt chưa?**
Đã replay 300 mẫu landmark test của S06, có nguồn extractor pin từ VSL-GH và báo cáo provenance. Đây không phải toàn bộ dataset train đã được thẩm định. Có 65 reference khác annotation công khai cần làm rõ, chưa có đánh giá người ký mới. Quyền sử dụng và điều kiện triển khai weights/dữ liệu gốc vẫn cần hoàn tất trước dùng rộng rãi.

**Con số 85% có nghĩa gì?**
255/300 chuỗi từ tiếng Việt khớp reference sau guard mất vai; WER cộng gộp 205/2157 = 9,50%, có giữ token dấu câu. Replay dùng NPY, chưa đo capture webcam, người ký mới hoặc hiệu quả giao tiếp. Không phải độ chính xác y tế. Ba clip replay dài hơn giới hạn camera và một clip bị từ chối chất lượng.

**Camera hiện đã ổn để thi chưa?**
Runtime đã tích hợp và kiểm tra kỹ thuật; chất lượng camera người thật chưa được xác minh theo tiêu chí nội bộ. Trạng thái CANDIDATE. Hai mẫu sốt còn nhận HO/ĐAU. Vì vậy luồng chính dùng Chạm, camera chỉ bổ sung sau diễn tập phù hợp.

**Đã có người thử chưa?**
Chưa có thử với người Điếc/người dùng mục tiêu hoặc điều dưỡng được ghi nhận. Một CSV camera cũ có một lượt quá giới hạn, không có response API; không tính là nhận đúng. Các ảnh và bài kiểm tra mới là thao tác phần mềm tự động với dữ liệu giả lập.

**Chưa kiểm chứng người dùng thì đã chứng minh được gì?**
Chứng minh được nguyên mẫu thực hiện luồng ghép nối, đồng bộ, sửa, xác nhận, xử lý điều kiện duyệt và reset trong môi trường kiểm tra. Chưa chứng minh người dùng hiểu icon, ký hiệu được nhận ổn định, giảm thời gian hay giảm sai sót tại bệnh viện.

**Nhận diện sai thì sao?**
Gợi ý phải qua Nhận và Áp dụng, rồi xác nhận toàn phiếu. Người bệnh có thể bỏ gợi ý, sửa bằng Chạm hoặc nhờ nhân viên. Những chặn kỹ thuật này không chứng minh mọi người dùng sẽ phát hiện mọi lỗi; cần thử tác vụ.

**LLM sinh thêm thông tin hoặc chẩn đoán thì sao?**
LLM chỉ nhận khung thông tin ẩn danh. Văn bản phải qua validator; lỗi, timeout hoặc bị chặn dùng mẫu cố định. Demo chính hiện dùng mock. Các guardrails kỹ thuật không thay thế thẩm định y tế.

**Ai chốt triệu chứng?**
Bệnh nhân xác nhận nội dung mình đã khai. Điều dưỡng hỏi lại, ghi nhận cảnh báo và duyệt tiếp nhận. Bác sĩ khám và quyết định chuyên môn. “Chốt” ở đây không phải chẩn đoán.

**Dữ liệu camera đi đâu?**
Video được xử lý ở trình duyệt. Sau một lượt câu, chuỗi 411 tọa độ thân/mặt/hai tay được gửi tới backend LAN. Không gửi video, không lưu dữ liệu camera phiên. Không nói “mọi dữ liệu đều chỉ nằm trên thiết bị” vì tọa độ có truyền qua mạng nội bộ.

**Dữ liệu có bị lưu không?**
Phiên nằm ở RAM backend và bộ nhớ phiên trình duyệt, được xóa khi reset. Phiếu in/PDF do người dùng chủ động xuất và CSV thử nội bộ đã tải là bản ngoài phiên; không tự xóa các bản đó. Không đưa dữ liệu định danh tới LLM.

**Không có Internet hoặc camera lỗi thì sao?**
Chạm và mock dùng máy chủ LAN; vẫn cần kết nối mạng nội bộ giữa các thiết bị. Camera cần localhost hoặc HTTPS, asset cục bộ và runtime model. Kiểm tra ngắt Internet ngoài trên thiết bị thật còn chờ; không khẳng định đã đạt offline hoàn toàn. TTS còn phụ thuộc giọng cài trên máy.

**Phiên dịch viên đã được tích hợp chưa?**
Chưa. MVP chỉ mô phỏng yêu cầu hỗ trợ, có hướng dẫn nhờ nhân viên tại quầy.

**Có triển khai ngay ở bệnh viện công được không?**
Chưa có cơ sở kết luận. Cần phối hợp xác minh quy trình, khả năng hiểu của người dùng, đánh giá VSL, điều kiện bảo mật và trách nhiệm vận hành. Chưa có HIS/EMR, quản trị người dùng hoặc lưu bệnh án trong phạm vi MVP.

**Giảm được bao nhiêu thời gian và chi phí?**
Chưa có số đo tác vụ hoặc chi phí vận hành. Cần so sánh cùng ca giả lập với cách làm hiện tại, ghi thời gian, lỗi chưa phát hiện và mức cần hỗ trợ. Độ trễ phần mềm hoặc số test xanh không trả lời được câu hỏi này.
