# Đối chiếu đầu vào V2 trên cùng video

Ngày20/11/2026. Công cụ đã chạy với một video công khai. Kiểm tính tương thích đầu vào; thử webcam của nhóm tiếp tục là phần chưa hoàn tất.

## Nguồn đã kiểm

| Nguồn | Kết quả truy cập | Cách dùng |
|---|---|---|
| QIPEDC /dictionary, API tìm kiếm công khai /dictionary/getAll | Tìm “đau” có7mục, D0356 là “đau bụng”, video MP4 truy cập được | Một mẫu kỹ thuật để so extractor |
| QIPEDC tìm đau ngực/đau đầu/khó thở/ngực | Trả0mục ở lần kiểm này | Chưa có mẫu các câu đích từ nguồn này |
| Từ điển ký hiệu y khoa, mục7565 | Chỉ mục tìm kiếm ghi “đau như bị đè nén (ngực)”, biến thể TP.HCM, mục video. Máy chủ chặn truy cập trực tiếp403 | Chưa xác minh động tác hoặc phát video |
| Swarthmore Hanoi Sign Language Talking Dictionary | Có video iframe và tên người ký, bản quyền thuộc cộng đồng; chưa chốt câu y tế đích | Nguồn xem tham khảo |
| VSL-GH commit6c351e6 | Có source extractor/landmark/chú thích. Chưa có video gốc các câu đích | Đối chiếu recipe và giữ provenance |

Nguồn xem:

- [QIPEDC — Video4000từ](https://qipedc.moet.gov.vn/dictionary)
- [Video đau bụng D0356](https://qipedc.moet.gov.vn/videos/D0356.mp4)
- [Ký hiệu y khoa mục7565](https://tudienngonngukyhieu.com/tu-ngu/dau-nhu-bi-de-nen-nguc-7565)
- [Từ điển Hà Nội](https://talkingdictionary.swarthmore.edu/vietnamese_sign/?lang=en)
- [Source VSL-GH đã ghim](https://github.com/nguyentheanh822/Vietnamese-Sign-Language-Translation/blob/6c351e63c0b2cf1b5e2e8056bb3bf2d6f31dc90a/source/extract_keypoints.py)

## Phép đo đã triển khai

legacy_extract.py đọc chỉ số pose/face từ AST của source đã ghim. Dùng MediaPipe0.10.21 Holistic Python với resize360×360, model_complexity1, smoothing và confidence0,5 theo recipe. Phiên bản thư viện lúc tạo landmark gốc chưa được xác minh đầy đủ.

Mỗi ảnh RGB360×360 được mã hóa PNG lossless trước khi đưa vào Holistic Python. Cùng ảnh đó được giải mã vào ImageBitmap và đưa qua HolisticDetector.detectFrame của app Web. Hai phía dùng cùng thứ tự ảnh. Worker V2 nhận timestamps theo FPS nguồn cho cả hai chuỗi. MediaPipe legacy tự quản lý nhịp graph của nó. Bản Web legacy Q-31 cũng được cấp cùng ảnh để đo riêng.

Báo cáo chỉ lưu hash video, số frame/FPS, chênh tọa độ theo nhóm và gợi ý kiểm soát. Tệp tọa độ trung gian trong /tmp được xóa khi hoàn tất hoặc thất bại. Script chỉ dành cho video tham chiếu công khai. Phép đo không ghi vào TRIALS.csv/metrics.

~~~bash
# App localhost5173 phải đang chạy. Chọn video tham chiếu công khai đã kiểm nguồn.
SIGNLY_CHROMIUM_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' node AI_model/vsl_v2/compare-video.mjs /tmp/signly-qipedc-D0356.mp4 /tmp/extractor-report.json
~~~

Browser dùng model task/WASM cục bộ. Các chuỗi được đưa vào cùng worker, checkpoint, normalization và ánh xạ intake của dự án. CLI giới hạn300frame theo worker. Probe này không mô phỏng guard capture của trình duyệt.

## Diễn giải ban đầu

Mẫu công khai đau bụng có110frame ở29,97FPS. Holistic Python tạo đầu vào khiến V2 trả PAIN/true, vị trí chưa rõ. Tasks Web tạo đầu vào khiến V2 bị từ chối với phrase_not_supported. Kết quả đã tái hiện cả ở cách tua video và cách cấp cùng ảnh RGB. Các nhóm tọa độ có khác biệt, số frame có tay cũng khác.

Đây là bằng chứng một khác biệt đầu vào có thể thay đổi kết quả của V2. Nó chưa xác định nguyên nhân của từng lượt người dùng ký đau ngực hoặc nhầm Đầu. Chưa đo được accuracy trên nhiều người và câu. Lấy báo cáo JSON làm kết quả của lượt chạy cụ thể. Chưa dùng mẫu đơn này để điều chỉnh ngưỡng.

Mẫu VSL trọn câu đau ngực/đau đầu/khó thở còn chờ nguồn phù hợp và kiểm tra bởi người biết VSL.

## Kết quả ba bộ trích xuất

| Bộ trích xuất | Gợi ý từ cùng V2 | Chênh XYZ thân trung bình so với Python |
|---|---|---|
| Holistic Python0.10.21 | PAIN, có đau, vùng chưa rõ | Mốc so sánh |
| Holistic Tasks Web hiện có | UNKNOWN, phrase_not_supported | 0,07995 |
| Holistic Web legacy0.5.1675471629 | PAIN, có đau, vùng chưa rõ | 0,00535 |

Báo cáo máy đọc tại AI_model/vsl_v2/reports/extractor-comparison-qipedc-D0356.json. Các giá trị là sai khác tọa độ theo hệ MediaPipe. Chưa phải độ chính xác nhận diện hoặc sai số vị trí cơ thể theo mét. Kết quả chỉ trên một video công khai.

Đề xuất tích hợp có thể duyệt: thay extractor camera bằng Web legacy đã kiểm, phục vụ JS/WASM/model nội bộ, giữ mapping411/timestamp/resize, guard capture và bước nhận gợi ý hiện có. Nạp lỗi thì hướng dẫn dùng Chạm. Sau tích hợp cần kiểm lifecycle/giải phóng camera, khả năng chạy offline, thời gian phản hồi và thử lặp câu Ngực/Đầu bằng người ký theo mẫu được xác minh. Cần chủ dự án chốt vì đổi extractor camera production tác động đầu vào nhận diện; kết quả hiện tại đủ để thử tiếp, chưa đủ kết luận ổn định.

## Đã tích hợp camera thử theo Q-32

Chủ dự án duyệt tích hợp ngày20/11/2026. HolisticDetector dùng Web legacy và TasksHolisticDetector chỉ dùng đối chiếu. Công cụ compare-video.mjs nay chạy chính lớp camera production cho nhánh legacy_web. Báo cáo extractor-comparison-qipedc-D0356-production.json tái hiện PAIN ở Python/production legacy và UNKNOWN ở Tasks trên cùng110ảnh. Tệp JS/WASM/model cục bộ có checksum trong asset-manifest.json. Nạp lỗi dùng Chạm. Chưa có kết quả webcam ở profile mới.
