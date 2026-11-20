# Kiểm chứng phần còn lại camera V2 — 20/11/2026

**Kết luận hiện tại: CANDIDATE, chưa đủ điều kiện đóng băng nhận diện webcam.** Kỹ thuật đã kiểm trên dữ liệu công khai và mô phỏng; mẫu ký trọn câu được xác minh và các lượt cuối Q-25 còn thiếu. Không có lượt webcam mới trong đợt này, không cập nhật accuracy hoặc phần trăm hoàn thành.

## Bằng chứng quyết định

| Phép đo | Kết quả | Có thể kết luận |
|---|---|---|
| Batch CSV thật đã nhận, profile7537ba3f, P01/D01 đang tập | Đau ngực0/5đúng,1FEVER sai,4từ chối | Chưa ổn định trong batch này; chưa xác minh cách ký hoặc nguyên nhân |
| Worker và HTTP thật,4NPY công khai ghim hash | Đầu/Ngực/Khó thở đúng gợi ý; mẫu sốt SENT105 thành Ho | Pipeline có thể xử lý mẫu nguồn; lỗi model sốt vẫn có |
|17biến thể×4NPY đã xem | FPS15/20/24 và biến đổi thời lượng0,75–1,5giữ nhãn ở các mẫu; xóa toàn mặt làm3gợi ý sai trước Q-33 | Có độ nhạy với dữ liệu mặt; chưa xác định lỗi webcam hoặc chọn ngưỡng |
| Sau gate Q-33 trên cùng68probe | Cả4mẫu xóa toàn mặt bị từ chối; các biến thể còn lại giữ nhãn so với trước | Đã chặn lỗi đầu vào xác định; chưa tăng accuracy webcam |
| Cùng110ảnh RGB từ video đau bụng D0356 | Python và Web legacy production trả PAIN/vùng chưa rõ; Tasks trả UNKNOWN | Tái lập khác biệt extractor trên1video, không chứng minh nhận đúng3câu đích |
| Tests phần mềm | Xem mục kiểm tra và báo cáo liên kết | Chứng minh hành vi được kiểm; không thay người thử |

Báo cáo có biến thể vượt giới hạn capture hoặc worker; các dòng đó có cờ/giới hạn riêng. Lưới timestamp của NPY giả định30FPS; video gốc không có để kiểm FPS. Các endpoint hold chỉ lặp frame đầu/cuối, không phải quay tay nghỉ thật. Một mẫu sốt sai gốc không được chữa bằng gate thiếu mặt.

## Đường dữ liệu đã đối chiếu

1. Camera production dùng Web legacy, selfieMode=false, modelComplexity1, smoothing/confidence0,5 theo recipe. Assets cục bộ khớp hash; không tải CDN.
2. Resize toàn khung360×360 trước extractor; chỉ preview/overlay lật gương. Pose25/face70/tay trái21/tay phải21, đúng411giá trị và thứ tự nguồn; vai subset9/10.
3. Capture một lượt Bắt đầu/Xong câu, không lấy prefix hoặc tự kéo dài. Giữ6giây/180frame/24frame/800ms/gap500ms và guard vai/tay. Thiếu mặt tạm thời chưa bị gate Q-33 chặn.
4. Worker resample gần30FPS theo timestamp thực. Norm2 lấy trung điểm/độ rộng hai vai, tạo vận tốc thành822feature, không padding giả một cuộc hội thoại. Một request/câu, input không chứa đáp án, mã người hoặc tên mẫu.
5. Decoder greedy442token, CTC374 không xuất gloss. Điểm0,7 chưa hiệu chỉnh; allowlist toàn câu, gợi ý gồm lý do/đau/vị trí. Không trả câu decoder tự do về UI.
6. Q-33 sau guard chuyển động kiểm toàn nhóm mặt rỗng suốt chuỗi, từ chối trước decoder. API intake UNKNOWN/gợi ý null/face_not_tracked; context cũ UNKNOWN.
7. UI/CSV chỉ mã cố định; mã lạ bị bỏ hoặc parser từ chối. CSV cũ vẫn đọc được. Ca âm valid nhưng thiếu toàn mặt unmeasurable; lượt dương từ chối vẫn trong mẫu số.
8. Bệnh nhân Nhận/Sửa trước ghi; mức đau/thời gian dùng Chạm, xác nhận toàn phiếu rồi điều dưỡng duyệt. Stale response/disconnect/reset dùng guard hiện có; không lưu input camera hoặc đưa decoder vào LLM.

## Nguồn mẫu đã kiểm lại

- [VSL-GH](https://github.com/nguyentheanh822/Vietnamese-Sign-Language-Translation), commit6c351e6. Git tree API không bị truncated và không có tệp mp4/mov/webm/avi. Có4NPY đã kiểm hash và4annotation câu, chưa có video gốc câu đích. MIT theo nguồn đã ghim; không suy class order/train config V2 từ README công khai.
- [QIPEDC](https://qipedc.moet.gov.vn/dictionary), tìm kiếm chính endpoint của biểu mẫu. Đau ngực/đau đầu/khó thở/ngực đều0mục ở lần kiểm; đau7mục, thở2mục, sốt1mục, chủ yếu từ rời. Không coi “thở” là câu khó thở. Không tìm thấy giấy phép cho phép tái phân phối/train; không bổ sung video vào app.
- [Dự án250ký hiệu y khoa](https://tudienngonngukyhieu.com/phan-loai/du-an-250-ky-hieu-y-khoa-60). Trang chỉ mục đọc được, trang chi tiết/tra cứu cần thiết chưa truy cập được qua công cụ (403/cache miss). Chưa xem và xác minh động tác câu đích; không vượt chặn hoặc lấy ảnh/video thay thế.
- [Hanoi Sign Language Talking Dictionary](https://talkingdictionary.swarthmore.edu/vietnamese_sign/?lang=en). Có tên người ký và video/phrases tham khảo. Nội dung thuộc cộng đồng, không phân phối hoặc sao chép nếu chưa có phép. Các kết quả đã xem chưa cung cấp trọn3câu đích; chưa tải media hoặc dùng benchmark/train.

Đây là phạm vi tìm kiếm đã thực hiện, không khẳng định trên Internet không tồn tại mẫu. Bước tối thiểu cần nhóm hỗ trợ ở [REFERENCE-REQUEST.md](REFERENCE-REQUEST.md). Không tự hướng dẫn động tác từ tọa độ.

## Ma trận yêu cầu của prompt

| Yêu cầu | Trạng thái / bằng chứng |
|---|---|
| G1.1 checksum/runtime/worker | Đã kiểm manifest/assets, audit report và check-v2; worker thật qua HTTP |
| G1.2 đúng frontend/backend đang phục vụ | Profile9e377812, backend đã nạp Q-33, probe thiếu mặt trả mã mới; cần tải lại tab trước thử |
| G1.3 toàn đường camera→xác nhận | Đối chiếu code, compare-video, HTTP public replay và E2E mô phỏng; chưa end-to-end ký thật đạt |
| G1.4 resize/mirror/layout/missing/FPS/padding | Code nguồn và68probe; video RGB D0356; các giới hạn nêu trên |
| G1.5 diagnostic/UI/CSV/cũ | Tests API/camera/CLI, E2E đủ mã và worker error; nhãn mong đợi không đi vào request |
| G1.6 replay mẫu nguồn |4NPY qua worker và HTTP, video cùng110ảnh qua3extractor; không cộng metrics người thử |
| G1.7 giả thuyết/nguyên nhân | Bảng phép đo ở trên; không xác định nguyên nhân batch webcam cũ |
| G2.1–2.4 tìm/xác minh nguồn/quyền/trọn câu | Đã tìm và ghi nguồn; chưa có video câu đích đủ căn cứ, không ghép từ hoặc đổi ngôn ngữ ký hiệu |
| G2.5 yêu cầu tối thiểu tới nhóm | REFERENCE-REQUEST.md đã chuẩn bị; xác minh VSL còn pending |
| G2.6 không lưu dữ liệu phiên | Không mở webcam; chỉ báo cáo rời rạc từ public/synthetic, không video/landmark người dùng |
| G3.1 cùng ảnh Python/Web | extractor-recheck report, cùng video/hash/110ảnh/FPS29,97 |
| G3.2 tốc độ/chờ/FPS/mất điểm |68probe, code/hashes và giới hạn; không tune trên test đã mở |
| G3.3–3.4 phân nhóm/ưu tiên nhầm FEVER | Chưa tái lập FEVER của batch; đã phân biệt extractor, model sốt→ho, mất mặt và dữ liệu mẫu |
| G3.5–3.6 sửa có duyệt/tests | Q-33/D-034 và kế hoạch15; từ chối toàn mặt thiếu, giữ các guard khác |
| G3.7–3.10 không ép đáp án/hạ ngưỡng/train thiếu dữ liệu/xóa lỗi | Không đổi checkpoint/threshold; preserve baseline/hash/batch sai; chưa có căn cứ train lại |
| G4.1 chuẩn bị app/worker | Đã chạy backend8000/frontend5173, mẫu công khai qua worker thật |
| G4.2–4.4 hướng dẫn/ký/xong câu/từng ca | REFERENCE-REQUEST.md; chỉ triển khai khi có mẫu VSL đủ rõ, hiện pending |
| G4.5–4.9 CSV/cả lỗi/loại lỗi kỹ thuật/dừng khi lỗi/không tự gán VSL | Công cụ/guard/tests đã chuẩn bị; chưa có lượt webcam mới để chấm |
| G5 phân split/người cuối | P01/P02 phát triển, P03 cuối theo policy; chưa có P03 |
| G5 ba ý≥4/5,25âm,sốt riêng,p95 | Chưa đạt, numeric_criteria_met=false; không thay bằng replay/E2E |
| G5 mẫu nhỏ/phạm vi/pending | Giữ CANDIDATE, chưa có hiệu quả người dùng mục tiêu/điện thoại/bệnh viện |
| G6.1–6.8 nhận→sửa→chạm→xác nhận→duyệt→reset | E2E mô phỏng qua; diễn tập ký thật hai người với camera vẫn pending |
| G6 sai/stale/disconnect/timeout/reset/fallback | Tests lifecycle/mapping/integration và E2E; chưa thử mạng/thiết bị thật |
| G6 thiết bị demo/điện thoại/HTTPS LAN/offline | localhost có bằng chứng; chặn HTTPS ngoài kiểm assets thực; chưa có điện thoại/HTTPS LAN/ngắt Internet thật |
| Ranh giới y tế/quyền riêng tư | Review docs07 theo Q-23, không decoder/landmark→LLM, không tự ghi lời khai, không media phiên |
| Bàn giao hồ sơ/commit/checks | RESULTS/FREEZE/progress/decisions và báo cáo; xem kết quả kiểm tra cuối đợt |

## Phạm vi trình diễn hiện tại

- Camera chỉ là tính năng thử nghiệm có thể cho gợi ý; chưa có câu nào được chứng minh đạt Q-25 trên webcam. Không quảng bá “dịch VSL chính xác” hoặc đọc điểm token thành xác suất đúng.
- Dùng Chạm khi sai/không rõ và giữ xác nhận hai phía theo D-017. Replay công khai hoặc màn camera mô phỏng phải giới thiệu đúng là replay/mô phỏng.
- Tiếp theo ưu tiên1mẫu câu đau ngực đã được kiểm. Không bắt người dùng làm lại toàn bộ135lượt khi mẫu ký còn chưa rõ.
- Chưa train lại. Muốn fine-tune phải có dữ liệu, nhãn/quyền, split và kế hoạch phù hợp; thiếu các yếu tố đó thì không thể hứa cải thiện bằng train.

## Báo cáo tái lập

- `AI_model/vsl_v2/reports/artifacts-recheck-2026-11-20.json`.
- `AI_model/vsl_v2/reports/controlled-perturbations-2026-11-20.json` trước Q-33.
- `AI_model/vsl_v2/reports/controlled-perturbations-q33-2026-11-20.json` sau Q-33.
- `AI_model/vsl_v2/reports/extractor-recheck-2026-11-20.json`.
- `AI_model/vsl_v2/reports/http-recheck-2026-11-20.json` và `http-recheck-q33-2026-11-20.json`.

~~~bash
backend/.venv/bin/python -m AI_model.vsl_v2.fetch_test_subset --output /tmp/vsl-audit-four --clip SENT101_S06_R01_F --clip SENT103_S06_R01_F --clip SENT105_S06_R01_F --clip SENT115_S06_R01_F
AI_model/runtime/.venv/bin/python -m AI_model.vsl_v2.robustness --landmarks-root /tmp/vsl-audit-four --output /tmp/vsl-audit-four-report.json
~~~

CLI từ chối ghi đè report đã có và chỉ nhận4ID/hash công khai được định trước; không dùng công cụ này cho dữ liệu người tham gia. Ghi rõ timestamp30FPS giả định của NPY. Đầu ra chỉ nhãn/mã/thống kê, không raw tọa độ.

## Kiểm tra cuối đợt

make check qua200backend+115frontend; make check-v2 qua18runtime; build qua; toàn bộ26E2E qua (gồm6mã phản hồi/worker/lạ và ca âm thiếu mặt). Bằng chứng kiểm phần mềm/public nằm trong AI_model/vsl_v2/reports/verification-2026-11-20.json. Profile/source hashes được đối chiếu lại với file và profile HTTP5173; backend8000 trả V2/worker ready. Probe HTTP mẫu ngực xóa mặt trả face_not_tracked, gợi ý null. Các screenshots slide bị E2E tạo lại đã khôi phục bản gốc, không đổi slide/PPTX/PDF.

Nguồn gốc batchCSV5lượt thất bại được kiểm lại sau thay đổi và vẫn0đúng/1sai/4từ chối; không hồi suy diagnostic. 0lượt webcam mới,0lượt cuối mới. Chưa thể kết luận động tác người dùng sai hoặc model đã được sửa hết. Kết luận bàn giao là chưa đủ đóng băng, cần nguồn ký trọn câu và phép thử thật theo protocol.
