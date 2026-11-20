# Kết quả camera V2

## Hoàn tất đợt diễn tập nhanh sau sửa Web legacy

Ngày20/11/2026, sau3lượt tay nghỉ và3lượt chỉnh áo không có gợi ý, người dùng thử lại câu đau ngực theo hướng dẫn và trả lời “có ok có hiện”. Trong ngữ cảnh câu hỏi yêu cầu Có đau/Ngực, ghi thêm1lượt trả đúng gợi ý theo lời báo. Tổng ca đau ngực sau sửa có4lượt tự báo đúng:3liên tiếp ban đầu và1lượt sau nhóm âm. Các lượt này không bao gồm ảnh Ngực đúng hoặc nhầm Đầu từ phiên bản trước.

Tổng đợt diễn tập tự báo gồm4lượt đau ngực đúng gợi ý,3lượt ca bụng có PAIN/vùng chưa rõ,3lượt tay nghỉ và3lượt chỉnh áo không có gợi ý. Ca bụng chưa xác nhận được câu decoder hoặc vị trí. Chưa có CSV, profile của trang, mã người/máy/lượt, timing hoặc xác minh VSL. Không tính accuracy, không tăng metrics và không tuyên bố đạt Q-25.

Kết quả hỗ trợ tiếp tục diễn tập kịch bản đau ngực với cùng người và thiết bị. Chất lượng model vẫn CANDIDATE, kiểm chứng đầy đủ còn cần các câu đích khác, split/người thử và ca âm theo protocol. Kết quả người dùng báo đã đi hết hai màn hình trước đó được giữ như xác nhận diễn tập, chưa phải đánh giá hiệu quả bệnh viện.

## Ba lượt chỉnh áo không có gợi ý theo lời người dùng

Ngày20/11/2026, sau hướng dẫn chỉnh áo/cử động thông thường trong khung khoảng3giây, người dùng báo “3 lượt chỉnh áo đều không có gợi ý triệu chứng”. Ghi thêm3lượt diễn tập không thấy gợi ý; tổng6lượt âm tự báo sau bản sửa gồm3tay nghỉ và3chỉnh áo. Chưa có CSV, reason, số frame/timing hoặc profile của trang nên chưa xác nhận đủ điều kiện NEG_MOTION theo protocol. Không cộng vào metrics hoặc11lượt baseline cũ. Chưa kết luận camera không có false positive ở người/điều kiện khác.

## Ba lượt tay nghỉ không có gợi ý theo lời người dùng

Ngày20/11/2026, sau hướng dẫn giữ tay nghỉ trong khung khoảng3giây rồi kết thúc câu, người dùng báo “3 lượt tay nghỉ đều k có triệu chứng”. Ghi3lượt diễn tập tay nghỉ không thấy gợi ý. Chưa nhận nguyên thông báo từ chối, CSV, frame_count, timing hoặc profile của trang. Chưa xác định guard đã từ chối trước decoder hay có đủ đầu vào hợp lệ để tính NEG_REST theo protocol. Giữ metrics.json theo CSV đã có, không cộng với11lượt âm baseline cũ. Bước diễn tập kế tiếp là cử động thông thường không khai triệu chứng.

## Ba lượt ca đau bụng trả Có đau, vùng chưa rõ

Ngày20/11/2026, sau hướng dẫn thử ca đau bụng theo video QIPEDC D0356, người dùng báo3lượt đều hiện Đau/Nhức, Có đau, Chưa rõ — cần chọn thêm. Đây là3kết quả tự báo khớp gợi ý có cấu trúc mong đợi của ánh xạ câu đau bụng chung. Người thử được hướng dẫn xác nhận rồi chọn vùng bụng bằng Chạm.

Không xác nhận được câu decoder cụ thể từ gợi ý này: PHRASES cũng ánh xạ câu đau lưng chung sang cùng PAIN/true/vùng rỗng. Vì vậy ghi là3lượt có gợi ý đau với vùng chưa rõ, chưa tính nhận đúng vị trí bụng hoặc dịch đúng cả câu. Chưa có CSV/mã lượt/timing/profile hay người biết VSL kiểm động tác. Giữ metrics theo CSV hiện có, không suy accuracy hoặc kết luận đạt Q-25.

## Ba lượt đúng Ngực liên tiếp do người dùng báo

Ngày20/11/2026, sau một lượt dán gợi ý PAIN/true/CHEST, người dùng được hướng dẫn thử thêm2lượt cùng câu. Người dùng trả lời “2 lần và đều ok”. Ghi thêm2lượt đúng theo lời báo, tổng3lượt liên tiếp sau bản sửa khởi tạo Web legacy. Không tính lượt đầu lần nữa hoặc chuyển các lượt khác phiên bản vào nhóm này.

Ba lượt này là diễn tập nội bộ tự báo, cùng câu và người thử theo ngữ cảnh. Chưa có CSV, mã lượt, profile trên trang, timing hoặc người biết VSL xác minh. metrics.json giữ theo nguồn CSV hiện có. Kết quả hỗ trợ tiếp tục diễn tập đau ngực trong cùng điều kiện; trạng thái CANDIDATE và tiêu chí Q-25 chưa được xác nhận đạt. Các lượt UNKNOWN/nhầm Đầu trước sửa tiếp tục được giữ trong lịch sử.

## Người dùng báo gợi ý đúng Ngực sau sửa khởi tạo

Ngày20/11/2026, sau khi sửa khởi tạo và khởi chạy lại app, người dùng nói đã nhận diện được. Khi được hỏi kết quả cụ thể, người dùng dán đầy đủ gợi ý Đau/Nhức, Có đau và vị trí Ngực cho ca đang thử “Tôi bị đau ngực”. Đây là một kết quả đúng theo câu đích trong diễn tập do người dùng báo, sau tích hợp Web legacy.

Chưa có CSV, trial_id, timing, profile của trang đang mở hoặc xác minh động tác VSL. Không cộng lượt này vào metrics.json, không suy tỷ lệ đúng hoặc bỏ qua các lượt từ chối/nhầm Đầu trước đây. Cần giữ kết quả các lượt lặp tiếp theo, kể cả sai và từ chối. CANDIDATE; chưa kết luận ổn định chỉ từ lượt đúng này.

## Lỗi khởi tạo trong trình duyệt của ứng dụng

Ngày20/11/2026, người dùng gửi ảnh có webcam phía sau lớp lỗi “Không thể mở nhận diện”. Đọc console tab bệnh nhân thấy WebAssembly báo Module.arguments và Assertion failed. Nút Bật lại Camera khi đó chỉ gọi start của webcam, nên không khởi tạo lại detector đã lỗi.

Đã tuần tự hóa các lần khởi tạo Emscripten, kiểm AbortSignal trước tạo graph và sau initialize, dọn lần bị hủy trước lần tiếp theo. UI có nút Thử lại nhận diện để tạo detector mới, đăng ký lại callback và mở lại stream. Nội dung lỗi phân biệt nạp nhận diện với cấp quyền webcam.

make check186backend+112frontend, build và9E2E camera qua. E2E kiểm khởi tạo rồi đóng ngay/chồng với lần mới. Một bộ thử tạm bằng canvas trống đã chạy ngay trong trình duyệt IAB của người dùng: hiện “Nạp thành công411tọa độ”, console không có warn/error trong phép thử. Trang thử tạm đã được gỡ. Agent không mở webcam hoặc tạo lượt ký thật.

Profile `7537ba3f6f6d867590635bf1018667544340706a956dc4d38671443b75dd470a` có0CSV. Người dùng cần tải lại tab bệnh nhân để bỏ trạng thái WASM lỗi cũ rồi thử webcam. Kết quả khung trống chứng minh khởi tạo trong trình duyệt đó, chưa chứng minh nhận đúng câu người ký.

## Camera Web legacy đã tích hợp

Theo Q-32, camera dùng Holistic Web legacy0.5.1675471629 với toàn bộ JS/WASM/model cục bộ. Profile `0663da036379803b7c9bfd76caa9b4a36ebdb6ec623f739758bf509f1bf9a2c5` có0lượtCSV. Adapter xử lý gửi bất đồng bộ một lần, bỏ callback cũ sau stop, chờ send hoàn tất trước close và dọn canvas.

make check186backend+109frontend,11runtime,build và8E2E camera qua. E2E thực nạp legacy/WASM khi chặn HTTPS bên ngoài, xử lý khung tổng hợp, giải phóng stream và kiểm luồng gợi ý/xác nhận hai phía với response mô phỏng. Công cụ so cùng110ảnh công khai đã dùng chính HolisticDetector production và V2 thật, tiếp tục trả PAIN/true/chưa rõ vùng. Camera người ký thật vẫn chờ thử. Kết quả mẫu đau bụng không kết luận cho câu đau ngực.

## Đã tái hiện khác biệt extractor trên video công khai

Ngày20/11/2026, theo Q-30/Q-31, chạy cùng110ảnh RGB của video QIPEDC D0356 “đau bụng” qua Holistic Python0.10.21, Tasks Web hiện có và Holistic Web legacy. Cùng V2/worker/mapper, Python và Web legacy trả PAIN/true, chưa rõ vùng. Tasks Web trả UNKNOWN/phrase_not_supported. ChênhXYZ thân trung bình so với Python lần lượt0,07995 và0,00535.

Báo cáo và cách tái lập tại EXTRACTOR-COMPARISON.md và AI_model/vsl_v2/reports/extractor-comparison-qipedc-D0356.json. Bộ trích xuất Web hiện tại vẫn dùng trong camera production. Chỉ refactor phương thức detectFrame để công cụ đo dùng chính resize/task/mapping của app. Các lượt webcam trước vẫn giữ nguyên bằng chứng, không suy ra nguyên nhân riêng cho từng lượt từ một mẫu mới này. Các câu đích chưa có video tham chiếu được kiểm tra.

## Lượt lặp hiển thị vị trí Đầu

Ngày20/11/2026, sau khi được đề nghị lặp câu “Tôi bị đau ngực”, người dùng dán gợi ý Đau/Nhức, Có đau, vị trí Đầu. Theo câu đích của đợt thử đang tiếp diễn, đây là gợi ý sai vị trí. Câu đích được suy từ ngữ cảnh hướng dẫn lặp, chưa được xác nhận lại riêng trong tin nhắn kết quả. Giữ lời báo này cùng ảnh Ngực đúng trước đó. Hướng dẫn bỏ gợi ý, giữ các lượt tiếp theo kể cả sai hoặc từ chối.

Thông báo gợi ý cho biết đã có đầu ra được hệ thống chấp nhận, nhưng chưa phân biệt được nguyên nhân từ cách ký, tracking hoặc model. Chưa có video VSL được xác minh, CSV, timing hoặc fingerprint của lượt. Chưa tính tỷ lệ đúng trên các tin nhắn rời rạc. Chất lượng nhận vị trí qua webcam còn chưa ổn định trong diễn tập; trạng thái CANDIDATE.

## Ảnh gợi ý đau ngực do người dùng gửi

Ngày20/11/2026, sau khi thử ca “Tôi bị đau ngực”, người dùng gửi ảnh màn bệnh nhân hiển thị Đau/Nhức, Có đau và vị trí Ngực. Ảnh cũng thể hiện gợi ý đang chờ Dùng thông tin này, mức đau/thời gian cần nhập bằng Chạm. Đây là bằng chứng UI đã hiển thị đủ gợi ý cho ca đang diễn tập.

Chỉ ghi nhận mô tả từ ảnh trong hội thoại. Chưa có trial_id, fingerprint trên trang, frame_count, timing, CSV, xác minh động tác VSL hoặc ảnh xác nhận điều dưỡng của cùng lượt. Không suy ra accuracy, số lần thử, tốc độ hoặc đã đạt Q-25. TRIALS.csv và metrics.json tiếp tục phản ánh bản xuất đã có. Tiếp theo hoàn tất phiếu giả lập và xác nhận hai phía, sau đó thử lặp có ghi kết quả. Model vẫn CANDIDATE.

## Q-29 — lý do từ chối đã triển khai

Profile `480d15a6d436cbe61bcf9673f7a62c7234cfbff12c10ffb3d528007615f90912` có 0 lượt CSV. Theo duyệt của chủ dự án, API intake trả mã cố định khi guard chuyển động từ chối, điểm model hữu hạn dưới0,7 hoặc câu giải mã không khớp allowlist. UI hiển thị lời nhắc tương ứng, giữ UNKNOWN và gợi ý null. Phản hồi lạ tiếp tục dùng thông báo chung.

make check qua186backend+105frontend,8runtime,build và5E2E nhận cả câu/trang thử qua. Backend localhost8000 đã nạp bản mới, frontend5173 đang phục vụ profile mới. Replay mẫu SENT103 qua worker thật trả PAIN/true/CHEST. Lặp frame đầu của chính mẫu này thành chuỗi tĩnh tổng hợp trả UNKNOWN/hand_motion_unclear. Hai probe là replay/tổng hợp, không ghi vào số liệu webcam. Phiên RAM thử nghiệm trước khi restart cần ghép lại.

Lời báo Chưa nhận rõ trước cập nhật vẫn giữ ở mục dưới, chưa xác định được nguyên nhân cụ thể. Chờ một lượt mới với lý do đã triển khai. Trạng thái CANDIDATE.

## Lời báo sau khi thử lại

Ngày 20/11/2026, sau hướng dẫn thử câu đau ngực và kết thúc bằng phím cách, người dùng chọn “Chưa nhận rõ”. Đây là lời báo trên màn bệnh nhân. Không có CSV, số frame, timing, fingerprint của trang đang mở hoặc xác nhận VSL. Không tạo thêm dòng TRIALS.csv hoặc cộng vào metrics.

Theo đường mã UI, thông báo này xuất hiện sau khi nhận phản hồi HTTP mà không có gợi ý được frontend chấp nhận. Nó có thể xảy ra khi guard chuyển động từ chối, điểm model dưới ngưỡng, câu giải mã ngoài allowlist hoặc phản hồi gợi ý bị frontend từ chối. Chưa có đủ dữ liệu để xác định nguyên nhân của lượt vừa báo. Thông báo này khác lỗi capture dừng ở 3,2 giây trước đây.

Đề xuất tại thời điểm ghi nhận, sau đó được duyệt Q-29 và triển khai ở mục trên: bổ sung mã lý do vào trường suggested_next_step đã có của intake. Ba trường hợp cần phân biệt là chuyển động chưa rõ, điểm model dưới ngưỡng và đầu ra ngoài allowlist. Chỉ trả mã kiểm soát, không đưa câu decoder tự do ra UI. Giữ checkpoint, ngưỡng, danh mục câu và bước Nhận/Sửa. Thay đổi semantics phản hồi cần chốt theo AGENTS.md §5.

## Chẩn lỗi thao tác ngày 20/11/2026

Profile hiện tại `d90c3a1d29f800c41df2357bee6dbfb77ca0f9d6b0fab89d216a55bcdca6d32a` có 0 lượt CSV. UI phân biệt mất cả hai bàn tay với khung hình trễ và timestamp lỗi. Phím cách kết thúc câu đang thu, tiêu điểm chuyển tới vùng điều khiển để tránh kích hoạt nút cũ sau Ký lại. Không có thay đổi checkpoint hoặc ngưỡng capture.

make check qua 178 backend + 101 frontend. 8 runtime, build và 8 E2E camera qua. E2E dùng camera/response mô phỏng và kiểm cả lần ký lại bằng phím cách, bỏ gợi ý, Nhận và duyệt hai phía, mất tracking, lật gương và CSV. Mẫu công khai SENT103 đã được chạy lại qua worker thật tại localhost và tiếp tục trả PAIN/true/CHEST. Đây là replay cùng mẫu đã dùng trước đây. Phần bàn tay của hình động và lời hướng dẫn tự dựng chưa được người biết VSL xác minh, chỉ dùng để tập kỹ thuật.

Đang chờ người thử thực hiện lại trên webcam và gửi thông báo. CANDIDATE, mức B giữ theo kết quả đã có.

## Cập nhật khung xem camera

Profile eb2d8c37 có 0 lượt CSV. Ở profile 371d8f14, màn bệnh nhân đã hiển thị một lần gián đoạn theo dõi sau 3,2 giây trước khi gửi nhận diện. Chỉ quan sát được thông báo, không có bản xuất hoặc phép đo chất lượng câu ký. Baseline CSV cũ giữ nguyên. Khung xem đã được tăng kích thước để người thử canh tay. Quyết định sân khấu vẫn ở mức B.

## Ngày 20/11/2026 — kiểm tra trước khi mở camera cho người thử

**Phương án B.** Chạm là luồng chính cho sân khấu. Bản thử `371d8f141d6b2639b94c7f179a1c27462070332a19812a7fc4cb1f1951a42928` đang có 0 lượt webcam. Chưa có câu nào đạt tiêu chí Q-25 qua camera hay số đo p95 ra gợi ý trên thiết bị thi.

| Bằng chứng | Quan sát | Phạm vi |
|---|---|---|
| Replay đã có trên 300 landmark S06 | 255 câu khớp hoàn toàn, WER 205/2157 ≈ 9,50% | Tập đã xem, còn lỗi sốt. |
| Replay riêng mẫu đau ngực | Mẫu công khai SENT103_S06_R01_F, 76 frame × 411, SHA256 `8f73c2603bc609b9c363d475090371850039c00698c57ed4a47223d1445afd88` khớp manifest. POST qua web app tới worker V2 thật trả PAIN/true/CHEST. | Cùng mẫu trong tập 300, không cộng thêm một ca độc lập. |
| Diễn tập hai màn hình trên localhost | Phát lại 76 frame thay detector vào camera của bệnh nhân. Một request duy nhất đi tới worker thật. Bệnh nhân nhận Đau + Ngực, chọn 5/10 và 2 giờ bằng Chạm, xác nhận và nhận STT sau khi điều dưỡng duyệt. | Chrome, stream mô phỏng, LLM mock, phiếu giả lập. Không đo hiệu năng webcam/điện thoại. |
| Kiểm tra phần mềm | 178 backend, 99 frontend, 8 runtime, build và 17 E2E liên quan qua (gồm ca replay bổ sung). Có ca bỏ gợi ý, lỗi worker, tracking, mất frame, đồng hồ và kiểm lật gương video/canvas với tay trái mô phỏng. | Các ca camera mô phỏng không ghi vào số lượt người thật. |
| Webcam nội bộ | Pilot c52feba0 có 1 lượt quá thời gian. 4e4ebb4b có 11 ca âm hợp lệ. 509264a9 và bản hiện tại đều có 0 lượt. | Không có lượt dương VSL được xác minh hoặc lượt cuối P03. |

Bộ thử dùng cùng context intake trên mọi ý. Đáp án chỉ dùng sau khi gợi ý hiển thị. Lỗi worker có lý do riêng kể cả khi API trả HTTP 200. Thời gian ký, phản hồi HTTP và thời gian tới gợi ý tách riêng. Có thể đối chiếu phiên bản cũ qua snapshot và baseline gốc.

Nguồn VSL-GH đã ghim có chú thích “Tôi bị đau ngực.” và landmark. Cây tệp đầy đủ của commit không có video MP4/MOV/WEBM/AVI. Trong dự án chưa có clip hướng dẫn câu này hoặc xác nhận động tác từ người biết VSL. Lượt đầu chỉ thử thiết bị ở NEG_REST. [Chú thích SENT103](https://github.com/nguyentheanh822/Vietnamese-Sign-Language-Translation/blob/6c351e63c0b2cf1b5e2e8056bb3bf2d6f31dc90a/data/annotations/SENT103_S06_R01_F.txt)

## Lịch sử Q-27

Đã chuyển11lượt live profile4e4ebb sang `baselines/4e4ebb4bedf313ca4c449c07608cdcd8fe1adfa34a89547157bf4c921d9ad48f.json`, giữ nguyên nguồn/nhóm/hash. Không xóa bằng chứng và không coi đó là lượt thử luồng intake mới. `metrics.json` hiện dành cho profile mới,0lượt live; các mục bên dưới là lịch sử. Chưa có lượt dương được xác minh VSL, CANDIDATE. E2E nhận cả câu là mô phỏng detector/response, chỉ kiểm luồng và an toàn cập nhật.

## Cập nhật mới nhất — 11ca âm kỹ thuật hợp lệ

Đã đối chiếu CSV NEG_OUTSIDE đầu tiên: T0001/P01/phát triển/learning/D01/normal,worker ready,92frame,4646,50ms,UNKNOWN/unknown,response198,10ms. Theo hướng dẫn trước đó, đây là vẫy chào thông thường không khai triệu chứng; không phải bộVSL ngoài từ vựng được chuyên gia xác minh. CSV ở `local/P01-outside-batch-01-4e4ebb.csv` (Git ignore), kiểm riêng cùng profile4e4ebb.

Tổng hiện tại11ca âm hợp lệ:5tay nghỉ+5cử động thông thường+1vẫy chào;0gợi ý sai trong nhóm,0dương/0cuối. Nhóm outside có mãT0001 riêng, không đổi mã hoặc cộng lặp bản nguồn cũ. metrics có3batch_provenance và SHA từng snapshot nguồn. CANDIDATE; không suy từ các lượt UNKNOWN rằng decoder đã chạy hoặc nhận đúngVSL.

## Snapshot5tay nghỉ + 5cử động thông thường

Đã nhận snapshot NEG_MOTION đầy đủT0001–T0005 củaP01/phát triển/D01/normal/profile4e4ebb, cả5worker ready. Frame65/79/78/85/90, thời gian ghi3248,50/3938,40/3851,60/4312,70/4509,90ms; cả5UNKNOWN/unknown, response198,50/105,50/204,50/202,30/196,90ms (trung vị198,50ms). Cả5đủ điều kiện ca âm theo protocol, không có gợi ý sai. CSV mới ở `local/P01-motion-five-4e4ebb.csv` (Git ignore), hai dòng đầu đã so khớp bản2lượt cũ; chỉ tính snapshot5lượt, không cộng thành7motion.

Mã T0001/T0002 trùng mã của nhóm tay nghỉ nhưng thuộc bản xuất khác. Đã kiểm từng CSV riêng bằng read_trials; tổng hợp dùng khóa nội bộ(batch_id,trial_id), không đổi mã gốc hoặc nối CSV để né kiểm tra trùng. `batch_provenance` trong metrics lưu nhãn nhóm, số dòng và SHA256 từng bản nguồn. Dùng snapshot tay nghỉ đầy đủ5lượt, không cộng thêm snapshot1lượt cũ.

Tổng hiện tại:10ca âm tracking hợp lệ (5NEG_REST+5NEG_MOTION),0gợi ý sai,0lượt dương và0lượt cuối. Đây là thử phát triển một người nội bộ/một thiết bị; không phải accuracyVSL, không suy decoder đã chạy, không có p95gợi ý. CANDIDATE.

## Nhóm5lượt tay nghỉ đã đối chiếu

Đã nhận nội dung CSV trực tiếp qua chat, giữ nguyên giá trị và kiểm bằng `read_trials`/`summarize` cho profile `4e4ebb4bedf313ca4c449c07608cdcd8fe1adfa34a89547157bf4c921d9ad48f`. Bản tích lũy mới nhất ở `local/P01-rest-five-4e4ebb.csv` (Git ignore); bản1lượt ban đầu vẫn giữ riêng, không cộng lặp T0001, không lưu ảnh/video hoặc landmark. Không ghi lại ảnh camera người dùng đính kèm.

| Mục | Kết quả |
|---|---|
| Lượt / nhóm | T0001–T0005, P01, internal/development, đang học VSL, D01, bình thường |
| Ca thử | NEG_REST / tay nghỉ, cả5lượt worker báo ready |
| Đầu vào | Lần lượt103/92/95/99/100frame; thời gian ghi4,642–5,220giây |
| Phản hồi | Cả5UNKNOWN, reason=unknown;103,90–215,90ms, trung vị197,90ms |
| Gợi ý sai |0trong5lượt này |
| Phân loại theo protocol |5ca âm tracking hợp lệ đã gửi,0lượt dương |

Đây là bằng chứng pipeline không gợi ý triệu chứng trong5lượt tay nghỉ nội bộ của1người, một thiết bị. Không chứng minh decoder đã chạy (guard có thể từ chối trước decode), không phải phép đo tốc độ model đơn lẻ, không có mẫu độ trễ gợi ý và không kết luận accuracy VSL. Không gộp với ảnh lỗi tracking trước đó hoặc CSV profileC52. T0001 trùng snapshot1lượt chỉ tính một lần; dùng bản tích lũy5lượt mới nhất. Model vẫn CANDIDATE, chưa đạt tiêu chí thử cuối.

## Lịch sử trước lượt hợp lệ của profile4e4ebb

Ngày19/11/2026. Người dùng báo5lượt không có gợi ý; CSV nhận thực có **1lượt P01/NEG_REST**, thuộc phát triển, bị `sequence_limit`, không có response API. Chưa đủ điều kiện ca âm tracking hợp lệ. Không suy ra4lượt còn thiếu hoặc tính5/5 đúng.

| Nguồn | Lượt | Kết quả | Phạm vi |
|---|---:|---|---|
| Lời báo qua chat |5|Không có gợi ý theo người báo|Chưa đối chiếu đủ CSV/timing |
| CSV profileC52 đã nhập |1|UNKNOWN, sequence_limit;0request phản hồi|0ca âm hợp lệ được gửi API; không phải model xử lý đúng tay nghỉ |
| Cấu hình mới có đếm ngược |0|Chờ thử lại|Chưa có latency/accuracy trực tiếp |
| Người biết VSL/người dùng mục tiêu |0|Chưa có|Không có kết luận VSL/bệnh viện |

Bản xuất cá nhân giữ ở `local/` Git ignore; báo cáo tổng hợp cũ trong `baselines/<profile-id>.json`. `metrics.json` theo profile mới chưa có lượt, giữ riêng để không trộn các phiên bản. Qua pilot đã thêm đếm ngược và cuộn đến camera; người dùng cần bấm Xong câu sau khoảng3giây, trước giới hạn6giây. Không tự gửi khi hết giờ.

## Replay offline, không trộn với camera

| Phiên bản | Mẫu | Khớp câu | WER từ cộng gộp | Từ chối chất lượng |
|---|---:|---:|---:|---:|
| V2 baseline trước M2 | 300 |256/300 (85,33%)|200/2157 =9,27%|0|
| Sau guard mất vai M2 |300|255/300 (85,00%)|205/2157 =9,50%|1|

Weights không đổi. Sau guard, SENT280 bị từ chối vì đầu vào mất vai;299output còn lại tái hiện file người cung cấp. Ba clip dài hơn180frame của cửa sổ camera; replay decoder vẫn dùng giới hạn300frame như model. Đây là replay NPY đã biết của một người ký test, không có capture web, framing mới hoặc người ký độc lập.

Ở8reference thuộc exact allowlist triệu chứng của baseline:5đúng,1từ chối,2sai; hai sai là sốt→HO/ĐAU. Không coi các reference ngoài exact allowlist là tập âm OOD. Có65reference khác annotation công khai, chưa đủ căn cứ train lại.

Báo cáo: `AI_model/vsl_v2/reports/greedy-replay.json`, `post-guard-replay.json`, `freeze-baseline-audit.json`. Probe prefix/mất pose tại `pipeline-probes.json` là chẩn đoán trên dữ liệu công khai/sửa đổi có chủ đích, không phải webcam.

## Kết luận M4

- Đã xác định/sửa lỗi crop khác extractor nguồn, roundoff làm mất frame, normalization chấp nhận chuỗi mất vai và ranh giới câu chưa rõ.
- Chuyển sang câu có bắt đầu/kết thúc theo Q-24; giữ điểm0,7, allowlist, weights và norm2 trên đầu vào hợp lệ. Chưa hiệu chỉnh ngưỡng từ dữ liệu người thật.
- Lỗi sốt còn tồn tại trong decoder. Chưa chứng minh sửa camera đã khắc phục lỗi model; chưa đề xuất train ngay.
- Cần dữ liệu phát triển trực tiếp trước khi chỉnh tiếp; phần đánh giá cuối phải giữ riêng. Trạng thái CANDIDATE, chưa đạt mốc đóng băng theo Q-25.

## Trạng thái bàn giao

Sau khi được hướng dẫn thử lại1lượt, chủ dự án cho biết chưa có thời gian. Chưa nhận thêm CSV mới. Bản camera/tool commit1375640 đã sẵn sàng, kết quả bản mới giữ0lượt nhập; pilot cũ1lượt hết giờ được giữ riêng. Không tổng hợp5lượt từ lời báo thành5bản ghi hoặc đánh giá model khi chưa có response API.


## Lượt báo lỗi qua ảnh sau khi hoàn thiện UI

Người dùng gửi ảnh T0001/P01/NEG_REST/UNKNOWN với thông báo hình theo dõi bị gián đoạn và “Chưa đủ điều kiện đo”. Chưa tải được CSV trong trình duyệt tích hợp. Người dùng cho phép cập nhật trang và giữ bằng chứng từ ảnh; không thể khôi phục số frame, thời gian hay profile từ ảnh. Báo cáo rời rạc: `AI_model/vsl_v2/reports/tracking-gap-pilot-summary.json`. Không tự tạo dòng CSV, không gán timing/request count và không tính là ca âm model nhận đúng.

Code xác định auto-scroll xuống kết quả được gọi khi `locked` bật sau mọi kết quả, gồm lỗi capture; vì vậy timer đang ghi bị thay bằng trạng thái dừng và nằm ngoài tầm nhìn. Đã bỏ cuộn tự động khi kết thúc/lỗi, giữ lý do và thời gian dừng cạnh camera, thêm liên kết Xem kết quả do người dùng bấm. Trước bắt đầu kiểm ảnh theo dõi còn mới theo cùng giới hạn500ms; không đổi giới hạn capture hoặc bỏ qua lỗi tay/vai. Nguyên nhân cụ thể gây mất tracking trên thiết bị người dùng vẫn cần thử lại; không khẳng định đã sửa chất lượng nhận diện.

Nút tải CSV vẫn giữ, có thêm ô CSV và sao chép thủ công khi trình duyệt không tải được. Dữ liệu chỉ hiện sau thao tác xuất, không thêm lưu trữ/backend/telemetry. Profile mới tách phiên bản, bản mới vẫn0lượt trực tiếp nhập từ CSV.
