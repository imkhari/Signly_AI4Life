# Prompt lập phạm vi và triển khai kiểm chứng AI4Care

Chủ dự án có thể dán prompt dưới đây vào chat làm việc với repo. Phần mở đầu tạo đầu ra để chốt phạm vi cải tiến. Các thay đổi vượt P9 và thay đổi contract/safety phải theo AGENTS.md.

```text
Bạn đang làm việc trong repo Signly / AI4Care, sản phẩm dự thi Danang AI4Life tại VKU, Đại học Đà Nẵng.

Mục tiêu là giúp người Điếc và người khó giao tiếp bằng lời hoàn thành một phiên khai triệu chứng, kiểm tra và sửa thông tin, rồi bàn giao phiếu đã xác nhận cho điều dưỡng. Tối ưu theo chất lượng 30%, hiệu quả 20%, độc đáo 10%, công nghệ 10%, tính năng 10%, hồ sơ 10%, trình bày 10%, theo thông tin chủ dự án cung cấp.

ĐỌC VÀ XÁC ĐỊNH PHẠM VI

Đọc AGENTS.md, docs/99-PROGRESS-LOG.md, docs/OPEN-QUESTIONS.md, docs/DECISIONS.md và docs/PLANS/04-AI4LIFE-PRODUCT-VALIDATION.md. Đọc docs/00, 01, 02, 03, 05, 06, 07, 08, prompt P9 hiện hành và kịch bản demo theo phần liên quan. Kiểm tra git status và giữ các thay đổi đang có của người dùng.

Nêu kế hoạch tối đa 10 dòng trước khi viết code. Bắt đầu bằng kiểm kê bằng chứng và đề xuất phạm vi. Chỉ triển khai gói cải tiến mà chủ dự án đã chọn. Kiểm tra lịch sử trao đổi để tận dụng xác nhận đã có. Nếu phải thay contract, safety, thu dữ liệu nghiên cứu hoặc dùng thư viện ngoài stack, chuẩn bị bản đề xuất cụ thể và xin xác nhận theo AGENTS.md. Tiếp tục các việc độc lập đã được phép trong khi chờ.

RANH GIỚI SẢN PHẨM

- Giới hạn ở lời khai, chuẩn hóa thông tin, hỏi lại, xác nhận và bàn giao. Tuân thủ toàn bộ ranh giới y tế trong AGENTS.md.
- Dữ liệu phiên theo chính sách xóa hiện có. Payload LLM được ẩn danh. Mọi văn bản LLM đi qua validator và fallback.
- Q-16 đã cho phép camera tùy chọn gửi tọa độ bàn tay tới backend LAN. Nếu đề xuất lưu clip hoặc landmark nghiên cứu, cần phương án xin đồng ý, lưu trữ và xóa riêng để chủ dự án phê duyệt trước.
- LLM mock là cấu hình demo dự phòng. Báo rõ provider và engine thực khi đánh giá hoặc trình diễn AI thật.
- Giữ Chạm sử dụng được trong toàn bộ luồng. Dùng dữ liệu giả lập cho test và demo.

GÓI A — KIỂM KÊ VÀ THIẾT KẾ TRƯỚC KHI SỬA

1. Chạy kiểm tra phù hợp để xác nhận trạng thái hiện tại. Đọc normal entry points của PatientPage, useWizard, SymptomsStep, VSLCameraView, NurseQuestionModal, useSessionSocket, SessionContext, WebSocket handlers, parser, state machine, redaction và inference engine.
2. Theo dõi một câu trả lời từ UI đến SemanticFrame, bản tóm tắt, xác nhận và màn điều dưỡng. Kiểm tra đặc biệt việc nhãn đến sau ghi đè lý do khám, việc chọn vị trí tự bật có đau và việc câu trả lời bổ sung của bệnh nhân có thực sự được áp dụng.
3. Lập bảng đã có / lỗi / đề xuất mới. Với mỗi mục, ghi tệp, hành vi quan sát, ca tái hiện và tiêu chí cuộc thi được cải thiện.
4. Vẽ luồng hỏi một ý → gợi ý → nhận/sửa/chưa rõ → cập nhật → rà soát toàn bộ → xác nhận → điều dưỡng duyệt. Phác thảo thẻ thông tin và trạng thái bằng hình ảnh cùng câu ngắn.
5. Đối chiếu cách biểu diễn với schema hiện tại. Nêu rõ đề xuất nào cần thay đổi. Nếu cần, trình bày ví dụ dữ liệu cũ/mới, event bị ảnh hưởng, cách tương thích và các file/test phải cập nhật. Chờ xác nhận cho phần đó.
6. Liệt kê thông tin thực sự còn thiếu, tối đa năm câu hỏi đánh số và có phương án đề xuất. Gồm hạn thi, người dùng thử, dữ liệu hợp lệ và lựa chọn gói triển khai.

Đầu ra gói A là đề xuất có thể duyệt, bảng tác vụ và danh sách quyết định. Ghi đúng phần đã được phép, phần còn chờ.

GÓI B — LUỒNG HỎI ĐÁP VÀ XÁC NHẬN, SAU KHI CHỐT PHẠM VI

1. Mỗi màn/lượt có một câu hỏi rõ, một mục đang trả lời và cách sửa mục đó. Tái sử dụng component, state và ontology hiện có.
2. Cho camera biết ngữ cảnh câu hỏi khi contract hiện có hỗ trợ. Chỉ áp dụng câu trả lời phù hợp với mục hiện tại. Ứng viên chưa nhận giữ ở vùng gợi ý.
3. Thực hiện quy tắc biểu diễn đã được duyệt cho lý do khám chính, triệu chứng đi kèm, vị trí, mức đau, thời gian và dị ứng. Bảo toàn mục đã xác nhận khi thêm ý mới.
4. Hiển thị số và đơn vị cùng nhau. Mục chưa trả lời hoặc đang mâu thuẫn có trạng thái dễ hiểu. Giữ ngữ nghĩa null, false, phủ định và chưa rõ theo data model đã chốt.
5. Ở cuối phiên, dùng thẻ hình ảnh để rà soát từng ý. Cho sửa một mục và thấy kết quả cập nhật trước khi xác nhận lại. Trạng thái đã xác nhận dựa trên phản hồi backend.
6. Rà soát câu hỏi bổ sung hai chiều. Câu trả lời phải đi vào dữ liệu theo mapping đã chốt hoặc hiển thị rõ cần điều dưỡng xử lý. Dùng các câu hỏi thuộc tập đã rà soát.
7. Tôn trọng docs/06 về bàn phím, focus, kích thước chạm, chữ lớn, tương phản, giảm chuyển động và thông báo trạng thái. UI/tài liệu tiếng Việt.

Các ca nghiệm thu tối thiểu
- ĐAU → BỤNG → mức đau chọn bằng chạm → HAI → GIỜ, số hai nằm đúng mục thời gian.
- Số hai ở lượt mức đau được gắn vào mức đau.
- Thêm HO giữ nguyên lý do khám chính theo thiết kế đã duyệt.
- Chọn vùng cơ thể cần xác nhận ý nghĩa trước khi ghi có đau.
- KHÔNG khi hỏi dị ứng chỉ tác động mục dị ứng.
- Thiếu thời gian giữ chưa rõ, ứng viên ngoài ngữ cảnh có cách sửa hoặc từ chối.
- Sửa sau xác nhận hủy trạng thái xác nhận theo contract.
- Bấm nhanh, nhập lại, mất kết nối, replay và reset giữ trạng thái nhất quán.

Viết test cho lỗi cụ thể. Chạy make check, build và Playwright phù hợp. Ghi ảnh màn hình ở 1024×768 và 720×768, xem ảnh và sửa vấn đề trước khi nghiệm thu.

GÓI C — AI VÀ BẰNG CHỨNG CHẤT LƯỢNG

1. Kiểm kê dữ liệu, quyền sử dụng, checkpoint, engine đang chạy và nhánh chọn nhãn. Phân biệt danh mục gloss, fixture tổng hợp, dữ liệu huấn luyện và tập đánh giá độc lập.
2. Dựa trên khảo sát và dữ liệu hợp lệ, đề xuất một năng lực AI trọng tâm. Ưu tiên nhóm nhỏ ký hiệu hoặc xử lý lời khai trong phạm vi biểu diễn đã chốt. Chọn model/thư viện theo stack và quyền đã có.
3. So với baseline luật hiện tại trên cùng đầu vào. Với camera, chia dữ liệu theo người ký và giữ cùng clip trong cùng tập. Chốt tiêu chí đánh giá trước tập test cuối.
4. Đo precision/recall theo ký hiệu, macro-F1, tỷ lệ chấp nhận, từ chối, nhận nhầm trên tay nghỉ/ngoài danh mục và độ trễ trọn luồng. Với trích xuất, đo chính xác từng trường, phủ định, đơn vị và dữ kiện thêm ngoài đầu vào.
5. Báo số mẫu, điều kiện, cách chia tập, lệnh chạy và ví dụ lỗi. Tạo đầu ra đánh giá có thể tái lập trong cấu trúc repo phù hợp.
6. Khi thiếu dữ liệu hoặc người ký, hoàn tất phần kiểm kê, công cụ kiểm thử và mẫu báo cáo bằng dữ liệu tổng hợp được ghi nhãn rõ. Đánh dấu đánh giá người thật đang chờ. Tiếp tục các phần đã được phép khác.

GÓI D — THỬ NGƯỜI DÙNG VÀ HIỆU QUẢ

1. Chuẩn bị hướng dẫn thử bằng ca giả lập, mẫu đồng ý phù hợp và bảng ghi kết quả tổng hợp theo quyền đã được cấp. Đề xuất ban đầu 5–8 người dùng mục tiêu, 2–3 điều dưỡng và người kiểm tra VSL.
2. So sánh với cách giao tiếp hiện tại được xác nhận qua khảo sát. Dùng tác vụ tương đương và đổi thứ tự khi cùng người thử nhiều phương án.
3. Đo hoàn thành, trường thông tin đúng/sai/thiếu, sửa thành công, trợ giúp, thời gian, mức hiểu UI và số thao tác điều dưỡng phải làm lại.
4. Báo mẫu thực tế, tử số/mẫu số, trung vị và khoảng dao động. Ghi kết quả người dùng mục tiêu riêng với thử nội bộ. Bổ sung giới hạn của mẫu nhỏ.
5. Các việc cần người thật do nhóm thực hiện. Chuẩn bị sẵn tài liệu và chỉ rõ dữ liệu cần họ cung cấp. Không suy diễn số liệu khảo sát từ test phần mềm.

GÓI E — KHÓA BẢN THI VÀ BÀN GIAO

1. Sửa các lỗi ảnh hưởng nhiệm vụ chính rồi chạy các kiểm tra bắt buộc. Broaden hoặc lặp lại test khi thay đổi, lỗi hay mục chưa rõ đòi hỏi.
2. Diễn tập trọn phiên trên hai thiết bị. Thử ngắt Internet bên ngoài, giữ LAN. Ghi lại ai đã kiểm tra, thiết bị, ngày và kết quả. Quay video dự phòng qua thao tác nhóm được phép thực hiện.
3. Cập nhật slide outline, kịch bản và Q&A bằng kết quả thật. Dùng Q-11 về thời lượng hiện hành cho tới khi có xác nhận từ Ban tổ chức. Nêu rõ tính năng đang chạy, mock, giới hạn và hạng mục đang chờ.
4. Chuẩn bị bảng so sánh ngắn với cách hiện tại và sản phẩm tương tự, có nguồn nếu dùng thông tin bên ngoài. Liên kết mỗi tuyên bố hiệu quả với bằng chứng.
5. Cập nhật progress log và quyết định đã chốt. Commit nhỏ theo Conventional Commits sau khi kiểm tra qua.

BÁO CÁO CUỐI

Nêu kết quả công việc người dùng hoàn thành được, thay đổi chính, kết quả test/đánh giá có mẫu số, file tài liệu và lệnh chạy. Liệt kê các mục chưa xác minh, phần cần người dùng/điều dưỡng thực hiện và đề xuất tính năng đủ bằng chứng để đưa lên sân khấu. Giữ nguyên các giới hạn trong hồ sơ và bài nói.
```
