# Kết quả camera V2

## Cập nhật mới nhất — nhóm5lượt tay nghỉ hợp lệ

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
