# Nội dung và ghi chú học thuật

16 slide chính; demo cuối ở16. Phụ lục 17–21ẩn trong trình chiếu. Các mốc giờ là dự kiến; chưa có diễn tập bấm giờ.

## Slide 1 — AI4Care — Hỗ trợ giao tiếp trong tiếp nhận y tế

Bản đầy đủ 7 phút: 5 giây. Giới thiệu nhóm IDK và AI4Care, nguyên mẫu hỗ trợ người Điếc sử dụng VSL và người khó khăn về lời nói khai thông tin tại quầy tiếp nhận. Đầu ra là phiếu lời khai được kiểm tra hai phía. Giữ nguyên nhận diện, logo và ngày có trong template ban tổ chức; ngày trên nền chưa thay thế lịch thi xác nhận riêng. Bài trình bày đi từ vấn đề đến giải pháp, phương pháp, bằng chứng và kế hoạch kiểm chứng; demo đặt cuối. Nhóm đã có phần mềm hoạt động, nhưng khả năng nhận VSL qua camera và hiệu quả với người dùng mục tiêu vẫn cần đánh giá. Nguồn: AGENTS.md; docs/00-PRD.md; template AI4Life do chủ dự án cung cấp.

## Slide 2 — Bài toán giao tiếp tại quầy tiếp nhận

Bản đầy đủ 7 phút: 15 giây. Bối cảnh lựa chọn là trao đổi ban đầu tại quầy tiếp nhận hoặc sàng lọc, trước khi bác sĩ khám. Người Điếc và người khó khăn về lời nói có nhu cầu khác nhau; không mặc định mọi người Điếc đều đọc tiếng Việt hoặc dùng cùng biến thể ký hiệu. Người bệnh cần diễn đạt triệu chứng và dị ứng, còn điều dưỡng cần thông tin để hỏi lại và tiếp nhận. Khoảng trống trên slide là bài toán thiết kế của nhóm, chưa phải kết quả khảo sát tại một bệnh viện. Chưa có số liệu về quy mô nhu cầu, thời gian chờ hoặc chi phí. Cần khảo sát để xác định nơi giải pháp thực sự phù hợp. Nguồn: docs/00-PRD.md; Q-18 và Q-26 trong docs/OPEN-QUESTIONS.md.

## Slide 3 — Mục tiêu và phạm vi nghiên cứu

Bản đầy đủ 7 phút: 15 giây. Mục tiêu kỹ thuật là chuyển lời khai thành Semantic Frame, diễn đạt bằng tóm tắt an toàn và cho phép kiểm tra, sửa, xác nhận. Giả thuyết cần nghiên cứu là phiếu có cấu trúc và xác nhận hai phía có thể giúp giảm thông tin bị hiểu sai. Giả thuyết chưa có số đo với người dùng mục tiêu. Cần đánh giá mức khớp giữa ý định người khai và phiếu, khả năng hoàn thành tác vụ, lỗi còn tồn tại sau xác nhận và mức cần hỗ trợ. Accuracy của model không thay thế các chỉ số quy trình đó. MVP chỉ hỗ trợ tiếp nhận ban đầu; không chẩn đoán, gợi ý bệnh, kê đơn hoặc thay phiên dịch viên. Nguồn: AGENTS.md; docs/00, 03, 07; docs/validation/INTERNAL-TRIAL-PROTOCOL.md.

## Slide 4 — Giải pháp: một câu tạo một gợi ý có cấu trúc

Bản đầy đủ 7 phút: 20 giây. V2 giải mã một chuỗi khung hình thành câu tiếng Việt. Backend chỉ ánh xạ toàn câu thuộc danh mục được kiểm soát. Nếu decoder trả đúng “tôi bị đau ngực”, gợi ý chứa PAIN, pain_present=true và CHEST. Đây là ví dụ cơ chế, không phải kết quả nhận đúng VSL qua webcam. Trước khi bấm Dùng thông tin này, gợi ý chưa được ghi vào phiếu. Người bệnh kiểm cả gợi ý rồi dùng hoặc sửa; mức đau và thời gian tiếp tục hỏi bằng Chạm. Câu ho không phủ định đau; câu bụng/lưng chung chung không tự chọn vùng trên hoặc dưới. Sau khi bổ sung, người bệnh xác nhận toàn phiếu rồi điều dưỡng duyệt. Nguồn: docs/PLANS/14-V2-SENTENCE-INTAKE.md; docs/02, 03; backend/app/ai/vsl_v2.py; frontend/e2e/vsl-sentence-intake.spec.ts.

## Slide 5 — Điểm khác biệt nằm ở quy trình tiếp nhận

Bản đầy đủ 7 phút: 20 giây. Cboard là tham chiếu về AAC: ứng dụng mã nguồn mở dùng biểu tượng và text-to-speech cho người khó khăn về ngôn ngữ hoặc lời nói. Đây là tham chiếu phạm vi công bố, không phải benchmark hoặc đánh giá đầy đủ tính năng Cboard. AI4Care tập trung tích hợp Chạm và gợi ý V2 vào phiếu tiếp nhận, cùng bước sửa, xác nhận bệnh nhân và kiểm tra của điều dưỡng. Đóng góp được trình bày là thiết kế và tích hợp hệ thống; nhóm chưa chứng minh thuật toán dịch mới, ưu thế định lượng so với ứng dụng khác hoặc hiệu quả tại bệnh viện. Tham chiếu [R1]: https://www.cboard.io/en/ . Nguồn phạm vi AI4Care: docs/00-PRD.md; docs/02-API-CONTRACT.md; docs/DECISIONS.md D-017, D-020, D-028.

## Slide 6 — Kiến trúc: xử lý trong trình duyệt và máy chủ LAN

Bản đầy đủ 7 phút: 25 giây. Hai trình duyệt đồng bộ phiếu và trạng thái qua WebSocket với FastAPI. MediaPipe Holistic và tài nguyên WASM/task chạy cục bộ trong trình duyệt; video không gửi tới máy chủ. Sau một câu, REST gửi 411 tọa độ mỗi frame tới FastAPI và worker V2 riêng trên máy chủ LAN. Gợi ý quay lại người bệnh; chỉ sau chấp nhận mới tạo INPUT_UPDATED cho phiếu. Parser kiểm thiếu, mâu thuẫn và cảnh báo seed. Adapter LLM diễn đạt từ frame ẩn danh, sau đó Post-LLM Validator kiểm đầu ra; lỗi dùng mẫu cố định. Demo cấu hình LLM mock. Không có database hoặc tích hợp HIS/EMR. Các mũi tên của sơ đồ diễn tả kênh xử lý chính; worker V2 là thành phần máy chủ, không chạy trên điện thoại. [R2]: https://developers.google.com/edge/mediapipe/solutions/vision/holistic_landmarker . Nguồn: docs/05, 08 và code hiện hành.

## Slide 7 — Phương pháp nhận diện câu với V2

Bản đầy đủ 7 phút: 25 giây. V2 dùng encoder-decoder theo chuỗi và greedy decoder tiếng Việt 442 token. Đầu vào lấy pose25, face70 và 21 điểm mỗi bàn tay: 137 điểm, mỗi điểm ba tọa độ thành 411. Sau chuẩn hóa vai và nối vận tốc, tensor có 822 chiều. Dạng weights cho thấy d_model=256, 8 head, 4 encoder và 3 decoder; config train gốc chưa đầy đủ nên phân biệt suy luận cấu hình với xác minh quy trình huấn luyện. CTC374 chưa có class mapping được xác minh, chưa dùng cho nhận từ rời. Client tối đa 6 giây/180 frame, tối thiểu 24 frame/800 ms; thiếu vai hoặc gap trên 500 ms từ chối cả lượt. Sau decode chỉ nhận toàn câu trong allowlist với điểm trung bình token hữu hạn từ 0,7. Điểm đó chưa được hiệu chỉnh thành xác suất nhận đúng. Nguồn: model-manifest.json; engine.py; SentenceCapture.ts; backend/app/ai/vsl_v2.py.

## Slide 8 — Dữ liệu và thiết kế đánh giá

Bản đầy đủ 7 phút: 25 giây. Bộ replay gồm 300 tệp landmark NPY góc trước của S06; hash đầu vào được đối chiếu. Nguồn tham chiếu VSL-GH có metadata và khai báo MIT tại commit 6c351e6. Split công bố của nguồn không tự chứng minh checkpoint được cung cấp đã giữ S06 độc lập hoàn toàn, vì train provenance còn thiếu. Phép chấm hiện dùng reference kèm checkpoint; audit phát hiện 65 reference lệch metadata công khai. Ba clip dài hơn cửa sổ 180 frame của camera và một clip mất vai bị từ chối. Tách đánh giá decoder offline, ánh xạ allowlist và camera end-to-end. Không gộp thành một accuracy chung. [R3]: https://github.com/nguyentheanh822/Vietnamese-Sign-Language-Translation/tree/6c351e63c0b2cf1b5e2e8056bb3bf2d6f31dc90a . Nguồn phép đo: post-guard-replay.json; freeze-baseline-audit.json.

## Slide 9 — Kết quả replay model trên 300 mẫu

Bản đầy đủ 7 phút: 35 giây. Kết quả sau guard mất vai là 255/300 câu khớp hoàn toàn reference, tương đương 85,00% trên toàn bộ 300 mẫu. Còn 44 đầu ra không khớp và một mẫu bị từ chối. WER cộng gộp bằng 205 lỗi chỉnh sửa trên 2.157 reference token, tức 9,5039%; gồm 144 thay thế, 31 xóa và 30 thêm. Giữ mẫu số toàn bộ 300, không loại lượt từ chối để tăng tỷ lệ. Phép đo replay landmark đã trích chưa bao gồm camera web, thao tác capture, allowlist và xác nhận. Chưa xác minh đủ tính độc lập người ký. Hai mẫu sốt còn decode thành Ho/Đau và phải giữ trong phân tích lỗi. Nguồn: AI_model/vsl_v2/reports/post-guard-replay.json; docs/validation/vsl-v2/RESULTS.md.

## Slide 10 — Kiểm tra phần mềm và bằng chứng camera

Bản đầy đủ 7 phút: 20 giây. Tại mốc code 0094d98, make check qua 173 test backend và 96 frontend; thêm 8 test runtime V2, build và 18 E2E. Những bài này kiểm contract, patch Đau+Ngực đồng thời, không ghi trước nhận, hủy kết quả cũ, validator/fallback, xác nhận, duyệt và reset. E2E nhận cả câu dùng detector và response mô phỏng, không chứng minh model nhận đúng. Baseline profile4e4ebb có 11 ca âm nội bộ của một người đang học VSL: 5 tay nghỉ, 5 cử động thường, 1 vẫy chào; tất cả UNKNOWN. Guard có thể từ chối trước decoder nên không suy accuracy model. Profile mới509264a9 có 0 lượt live, chưa có ca dương VSL được xác minh hoặc thử cuối. Nguồn: docs/99-PROGRESS-LOG.md; frontend/e2e/vsl-sentence-intake.spec.ts; baseline 4e4ebb; metrics.json.

## Slide 11 — Hiệu năng trên điện thoại thật

Bản đầy đủ 7 phút: 15 giây. Điện thoại dự kiến đảm nhiệm camera và trích tọa độ, còn model V2 chạy trên máy chủ LAN. Cần đo cả chi phí MediaPipe, truyền mạng và suy luận; chưa có bằng chứng model chạy hoàn toàn on-device. Hiện không có số liệu điện thoại thật được ghi nhận, vì vậy bảng giữ Chưa đo. Ghi model máy, chip, OS, trình duyệt, camera, độ phân giải, mạng và cấu hình máy chủ. Tách lượt khởi động lạnh và nóng. Độ trễ gợi ý tính từ Xong câu đến DOM hiện gợi ý; chỉ lấy mẫu có gợi ý và báo số mẫu, lỗi/timeout riêng. Bổ sung FPS trích điểm, RAM và nhiệt khi chạy lâu. Không dùng forward offline trên laptop thay cho độ trễ điện thoại. Nguồn: DEPLOYMENT_GUIDE.md; docs/validation/vsl-v2/README.md; phụ lục A3.

## Slide 12 — An toàn, quyền riêng tư và đạo đức

Bản đầy đủ 7 phút: 25 giây. Phạm vi là ghi nhận lời khai, không chẩn đoán, gợi ý bệnh, kê đơn hoặc thay phiên dịch viên. Người bệnh quyết định dùng gợi ý, có thể sửa hoặc chuyển Chạm; điều dưỡng kiểm trước duyệt. Cảnh báo hiện là seed nội bộ chưa thẩm định lâm sàng. Video ở trình duyệt; 411 tọa độ thân/mặt/tay truyền LAN, không ghi vào log hoặc lưu dài hạn. Tọa độ vẫn cần bảo vệ, không gọi là vô danh tuyệt đối. Chỉ frame ẩn danh tới LLM, mọi văn bản qua validator và fallback. SESSION_RESET xóa bộ nhớ phiên; bản in/PDF đã xuất thuộc người vận hành. Cần kiểm khả năng hiểu và đồng ý tham gia với đúng người dùng. WHO 2021 là tham chiếu về quyền con người và trách nhiệm, không chứng nhận sản phẩm. [R4]: https://www.who.int/publications/i/item/9789240029200 . Nguồn cơ chế: docs/07-SAFETY-GUARDRAILS.md.

## Slide 13 — Giới hạn và nguy cơ sai lệch kết luận

Bản đầy đủ 7 phút: 20 giây. Các giới hạn gồm tính hợp lệ dữ liệu, phép đo và khả năng tổng quát hóa. Reference kèm checkpoint lệch metadata công khai ở 65 mẫu; chưa đủ config và nguồn train gốc. Replay gồm 300 clip của một người ký, ba clip dài hơn giới hạn camera; quá trình trích điểm và capture web chưa tương đương bộ offline. Chưa có ca dương VSL camera được người biết VSL xác minh, thử với người dùng mục tiêu/điều dưỡng hoặc đo điện thoại. Chưa đo giảm lỗi, thời gian tiếp nhận hay mức hỗ trợ. Điểm0,7 chưa hiệu chỉnh và sốt còn lỗi, nên giữ trạng thái CANDIDATE. Số test qua chỉ mô tả hành vi phần mềm trong môi trường đã thử. Nguồn: audit; FREEZE.md; docs/validation/RESULTS.md; Q-18/Q-26.

## Slide 14 — Kế hoạch kiểm chứng theo từng điều kiện

Bản đầy đủ 7 phút: 20 giây. Bước đầu là xác minh cách ký với nguồn hoặc người biết VSL cho các ý đau đầu, đau ngực và khó thở. Nhóm hiện đang học, không tự đặt động tác rồi gọi là VSL. P01/P02 dành phát triển và P03 giữ thử cuối; không dùng lượt cuối để chỉnh rồi gọi là độc lập. Q-25 đặt mục tiêu nội bộ: mỗi ý chính cuối ít nhất 4/5 đúng, 25 ca âm không xuất hiện gợi ý sai, p95 gợi ý không quá 5 giây; sốt kiểm riêng. Đây là tiêu chí kỹ thuật mẫu nhỏ, không phải chuẩn y tế. Tiếp theo đo thiết bị, HTTPS và LAN thật; cuối cùng thử tác vụ giả lập với người dùng mục tiêu và điều dưỡng khi có phối hợp. Đo hiểu đúng phiếu, lỗi sau xác nhận và khả năng hoàn thành. Nguồn: kế hoạch12/14; validationProtocol.json; INTERNAL-TRIAL-PROTOCOL.md.

## Slide 15 — Đóng góp hiện tại và tiêu chí trình diễn

Bản đầy đủ 7 phút: 15 giây. Đóng góp hiện có là nguyên mẫu tích hợp. Một câu V2 được chuyển thành gợi ý đa trường có kiểm soát; Chạm bổ sung phần chưa hỗ trợ. Phiếu hai màn hình có sửa và xác nhận, cảnh báo và điều kiện duyệt được kiểm trong các bài test. Không tuyên bố thuật toán SOTA hoặc hiệu quả lâm sàng. Bản trình diễn dùng LLM mock và hỗ trợ phiên dịch mô phỏng, được nói rõ. Giá trị với người Điếc và hiệu năng điện thoại vẫn cần nghiên cứu. Sau kết luận này chuyển sang demo ở slide 16, kết thúc phần chính. Phụ lục ẩn chỉ mở khi được hỏi. Nguồn: code tại0094d98; docs/99-PROGRESS-LOG.md; D-017/D-028; FREEZE.md.

## Slide 16 — Demo trực tiếp: một phiên tiếp nhận

Bản đầy đủ 7 phút: 120 giây. Đây là slide cuối phần chính. Mở điều dưỡng lấy mã, nhập ở màn bệnh nhân và chọn Chạm. Dùng ca giả lập đau ngực, mức 5/10, bắt đầu2giờ, chưa chắc về dị ứng. Người bệnh kiểm và sửa phiếu nếu cần rồi xác nhận. Điều dưỡng thấy nút duyệt khóa trước xác nhận và trước ghi nhận cảnh báo critical. Ghi nhận rằng cần hỏi lại theo quy trình; sau đó duyệt, kiểm số thứ tự bên bệnh nhân, mở phiếu và kết thúc phiên. Ghi nhận cảnh báo không phải xác nhận đã xử lý y khoa. Camera chỉ thêm nếu cách ký được người biết VSL xác minh và đã diễn tập; nếu chưa nhận rõ thì chuyển Chạm. Hiện chưa có ca dương xác minh, không cam kết camera ổn định. Nguồn: frontend/e2e/demo.spec.ts; vsl-sentence-intake.spec.ts; D-017/D-028.

## Slide 17 — Phụ lục A1 · Giao diện nhận cả câu và kiểm phiếu

Phụ lục ẩn; chỉ mở khi hỏi đáp. Các ảnh là giao diện app chạy thật với ca giả lập, nhưng camera dùng canvas, detector và response model được mô phỏng. Chúng minh họa cơ chế gợi ý Đau+Ngực và phiếu sau bổ sung Chạm, không phải kết quả nhận đúng VSL. Trước Dùng thông tin này chưa ghi vào phiếu; sau nhận chỉ cập nhật thông tin đã gợi ý. Mức đau và thời gian do người dùng chọn thêm. Khi thay lý do, tình trạng hoặc vị trí đau, chi tiết cũ bị xóa để hỏi lại; dị ứng được giữ. Gợi ý bị hủy khi draft/frame hoặc kết nối đổi. Ảnh không có người bệnh thật, video hoặc landmark lưu lại. Nguồn: capture-provenance.json; các ảnh sentence-*-synthetic.png; frontend/e2e/vsl-sentence-intake.spec.ts.

## Slide 18 — Phụ lục A2 · Cách tính chỉ số và nguồn dữ liệu

Phụ lục ẩn; chỉ mở khi hỏi đáp. Exact match lấy mẫu số toàn300, gồm mẫu từ chối. WER cộng gộp trên token từ tiếng Việt, có giữ dấu câu; không dùng trung bình WER từng câu. S là thay thế, D là xóa, I là thêm và N là số token tham chiếu. 205 lỗi gồm 144 S+31 D+30 I trên2.157 token. README VSL-GH công bố6người ký,300 nội dung câu, hai góc máy; trainS01–04/valS05/testS06. Đây là thông tin của nguồn, không tự xác minh quy trình train checkpoint V2. Các filelist và metadata nguồn từng có khác biệt, không trộn hai protocol. MIT nguồn công khai không tự chứng minh quyền weights và đồng ý từng video. Chưa có thông tin thư mục đầy đủ cho paper nên không tự tạo tác giả/DOI. Nguồn: replay; README/LICENSE pin6c351e6 [R3].

## Slide 19 — Phụ lục A3 · Biểu mẫu đo trên điện thoại thật

Phụ lục ẩn; chỉ mở khi hỏi đáp. Đây là biểu mẫu dự kiến, chưa có lượt điện thoại thật. Ghi máy/chip, OS, trình duyệt, RAM, camera, độ phân giải, nguồn điện, LAN và cấu hình máy chủ. Dùng HTTPS hoặc localhost đúng yêu cầu quyền camera. Tách lạnh/nóng và giữ mọi lượt lỗi, hủy, timeout. Đề xuất ít nhất30 lượt mỗi điều kiện để báo p95 cùng số mẫu, cần nhóm chốt điều kiện thiết bị trước khi đo; đây là kế hoạch kỹ thuật, không phải kết quả hoặc thay tiêu chí Q-25. Timestamps dùng cho nhãn/timing, không lưu video hoặc landmark phiên y tế. Độ trễ từ Xong câu đến DOM; tách FPS trích điểm, round-trip và forward model. Báo p50/p95 trên mẫu có gợi ý và số lỗi; lượt không gọi API không được gán latency0. Nguồn: protocol nội bộ và SentenceCapture.ts.

## Slide 20 — Phụ lục A4 · Tài liệu tham khảo

Phụ lục ẩn; chỉ mở khi hỏi đáp. [R1] Cboard. Mô tả ứng dụng AAC bằng biểu tượng và text-to-speech: https://www.cboard.io/en/ . [R2] Google AI Edge. MediaPipe Holistic Landmarker: https://developers.google.com/edge/mediapipe/solutions/vision/holistic_landmarker . 137 điểm là subset AI4Care chọn, không phải toàn bộ đầu ra MediaPipe. [R3] VSL-GH. README/LICENSE tại commit 6c351e63c0b2cf1b5e2e8056bb3bf2d6f31dc90a: https://github.com/nguyentheanh822/Vietnamese-Sign-Language-Translation/tree/6c351e63c0b2cf1b5e2e8056bb3bf2d6f31dc90a . Đã đối chiếu bản raw 19/11/2026. [R4] World Health Organization (2021). Ethics and governance of artificial intelligence for health. ISBN 9789240029200: https://www.who.int/publications/i/item/9789240029200 . [R5] AI4Care, code 0094d98; báo cáo replay, protocol, baseline 4e4ebb và profile 509264a9. Không tự tạo DOI hoặc paper chưa xác minh.

## Slide 21 — Phụ lục A5 · Câu hỏi phản biện và trả lời

Phụ lục ẩn; chỉ mở khi hỏi đáp. Trả lời theo mức bằng chứng. Model đã ổn định? Chưa có ca dương VSL camera được xác minh; mới có replay và kiểm phần mềm. V2 nhận từ hay câu? Giải mã chuỗi câu; CTC374 chưa dùng. Nhận nhầm xử lý thế nào? Bỏ gợi ý, Chạm hoặc nhờ nhân viên; không tự ghi kết luận. Model chạy hết trên điện thoại? Chưa, V2 chạy trên máy chủ LAN. Đã thử bệnh viện? Chưa. Khác AAC? Tập trung tích hợp phiếu tiếp nhận và xác nhận, chưa chứng minh ưu thế toàn thị trường. LLM/phiên dịch live? Demo dùng mock và yêu cầu hỗ trợ mô phỏng. Nguồn train/weights? Đã pin hash ở mức tái lập, nhưng chưa đầy đủ train provenance và consent. Nguồn: QA.md; EVIDENCE.md; FREEZE.md.
