# Bản AI cho buổi thi — CANDIDATE

**Mức B cho sân khấu.** Diễn tập bằng landmark công khai với worker thật đã đi hết hai màn hình. Chạm là luồng chính. **Chưa đóng băng chất lượng.** Luồng Q-27 theo câu mới có0lượt live.11ca âm của profile4e4ebb được giữ ở baseline cùng nguồn/nhóm/hash:5tay nghỉ,5cử động thông thường và1vẫy chào kỹ thuật, cả11UNKNOWN. Chưa có lượt dương VSL hoặc thử cuối. Không gộp kết quả cũ vào cấu hình mới, không coi ca âm của1người là kiểm chứng nhận diện.
## Phiên bản kỹ thuật

Profile kỹ thuật hiện tại được ghi trong `frontend/public/vsl-validation-profile.json` và snapshot `profiles/`. Profile4e4ebb cũ giữ riêng11lượt; pilotC52 riêng1lượt không đạt đầu vào. Q-27 thay ánh xạ gợi ý cả câu và UI, giữ weights. Fingerprint ràng buộc code và policy; chưa đưa ra quyết định đóng băng.

- Checkpoint: `AI_model/checkpoints/vsl_v2.pt`, SHA256 `d9010be34e0362d0f5fe84b522f19db0a74a4d79e16f437fd0d221e19a41e246`, không đổi weights.
- Decoder tiếng Việt442 token, greedy; CTC374 không xuất gloss. Norm2 vai9/10; mọi frame phải có hai điểm vai hợp lệ, không dùng width gần0.
- Resize toàn khung360×360 theo source đã pin, input không flip; preview giữ tỷ lệ video và lật gương. Camera hiện dùng Web legacy theo Q-32; vẫn cần thử trực tiếp theo profile mới.
- Capture: Bắt đầu ký/Xong câu, một inference/câu, tối đa6giây/180frame, ít nhất24frame/800ms, không có gap>500ms, mất tracking/vai từ chối cả lượt. Không tự gửi đoạn câu bị cắt, không lặp cùng clip để tạo cảm giác ổn định.
- Điểm0,7 và guard hand motion/presence hiện có giữ nguyên, chưa hiệu chỉnh. JSON profile ở `frontend/public/vsl-validation-profile.json`, bản lưu `profiles/<profile-id>.json` ràng buộc code, policy và artifacts; chạy prepare trước buổi thử.
- Config train gốc/class order CTC và annotation65reference còn thiếu; không diễn giải replay thành xác minh nguồn train đầy đủ.

## Phạm vi dự kiến

Chỉ xem xét đau đầu (PAIN+HEAD), đau ngực (PAIN+CHEST), khó thở (BREATH_DIFFICULTY) ở điều kiện bình thường sau khi đạt phép thử. **Hiện chưa có ý nào được chứng minh chạy ổn định trên camera người thật.** Sốt giữ ca kiểm lỗi, không quảng bá nhận tốt; mức đau/thời gian dùng Chạm. Context intake: kiểm cả gợi ý → Dùng thông tin này → bổ sung bằng Chạm → bệnh nhân xác nhận toàn phiếu → điều dưỡng duyệt. Trang thử dùng cùng context intake. Chạm là luồng thi chính D-017.

## Điều kiện đổi trạng thái

`metrics.json` của bản mới đang n=0; baseline4e4ebb giữ11ca âm phát triển; pilot cũ có1lượt hết thời gian không đạt điều kiện đầu vào, tỷ lệ/latency null, số học chưa đạt. Để ghi FROZEN_FOR_INTERNAL_DEMO cần: đủ ma trận người/lượt đúng split, mỗi ý chính P03≥4/5,25ca âm không có gợi ý sai (tách tracking hợp lệ với đầu vào hỏng),p95≤5giây khi có gợi ý, sốt kiểm riêng, regression qua và nhóm xác nhận chưa dùng lượt cuối để tune. Các ca âm tracking hợp lệ phải thực sự có chuỗi đủ điều kiện gửi API; lỗi quá ngắn/mất vai không thay thế phép thử đó.

Đạt số học không tự thành kiểm chứng VSL/người dùng mục tiêu. Nếu sửa cấu hình sau lượt cuối, giữ snapshot cũ và thử cuối mới; không ghi đè kết quả thất bại. Ghi rõ cohort nội bộ đang học theo Q-26.

## Chạy và khôi phục

```bash
make check
make check-v2
make prepare-vsl-validation
make demo
```

Xem `/api/vsl/status`: `primary_camera_engine` V2, runtime_available và worker_ready (sau lần gọi đầu). Thiếu runtime/input lỗi → UNKNOWN, không fallback hình học. Reset/dừng camera xóa buffer và hủy request cũ; SESSION_RESET kết thúc worker. Trang thử không tạo phiếu bệnh nhân; kết quả rời rạc tự nguyện trong RAM và tải CSV theo yêu cầu, không lưu video/landmark/câu dịch.

Khi camera không phù hợp chuyển Chạm/nhân viên. Bundle V2 gốc và checkpoint baseline nhỏ giữ nguyên. Thử offline/bug đã hoàn tất không thay thế lượt trực tiếp ở README. Chưa chốt fine-tune; chỉ lập plan train nếu có nguyên nhân thuộc model và dữ liệu/nguồn hợp lệ.

Kiểm kỹ thuật đợt này:160test backend,86frontend,8runtime,build và13E2E qua. CSV round-trip synthetic1lượt bị loại khỏi số người thật. API localhost8000 fixture công khai hợp lệ→ĐẦU, mất vai→UNKNOWN; trang thử và profile qua proxy5173 hoạt động. Các số này không điền vào bảng người thử.

Sau pilot có thêm đếm ngược và cuộn đến camera, đồng thời chặn mất đoạn đầu nếu frame đầu đến trễ>500ms. Snapshot mới khác C52; chỉ đo các lượt mới sau tải lại trang. CSV cũ đã giữ riêng, không xóa hoặc sửa kết quả để qua tiêu chí.

Chủ dự án cho biết chưa có thời gian thử lại. Phần thử trực tiếp tiếp theo để pending; không có yêu cầu thao tác thêm trong đợt bàn giao này.

## Cập nhật giao diện và slide 19/11/2026

Profile đổi do bố cục trang thử nội bộ được chia bước; weights, tiền xử lý, ngưỡng và capture giữ nguyên. Snapshot cd9f061656b9fdda84fe71dd2b162e66b8efd35972aded51df1dd1332c6d87a4 giữ tại profiles/, không trộn kết quả. Bản mới vẫn0lượt trực tiếp và CANDIDATE. Ảnh app trong artifacts/ai4life là dữ liệu giả lập từ kiểm thử phần mềm, không phải người dùng thật.

## Sửa gián đoạn thao tác thử camera

Profile 4e4ebb4bedf313ca4c449c07608cdcd8fe1adfa34a89547157bf4c921d9ad48f thêm kiểm độ mới của tracking trước bắt đầu theo maxGap500ms đã duyệt, giữ lỗi tại camera và xuất CSV thủ công. Snapshot 695918d46c5e8cc1d00597558f12562b5fab1d711990609ecfcb7162603e929a giữ riêng. Weights,500ms,6giây,180frame,24frame/800ms,ngưỡng0,7 và mọi guard giữ nguyên. Có1ảnh báo lượt gián đoạn được chủ dự án cho giữ; không có CSV/timing/profile xác minh và không tính vào gate. Bản mới0lượt trực tiếp; CANDIDATE.

## Bổ sung CSV tay nghỉ hợp lệ

Đã kiểm1lượt P01/NEG_REST của profile4e4ebb từ nội dung người dùng sao chép, không từ ảnh. Đủ điều kiện ca âm theo protocol:103frame,5219,90ms,response107,60ms,UNKNOWN,worker ready. `metrics.json` mới có1live_internal và0positive, không có gợi ý sai trong lượt đó; p95candidate vẫnnull. CSV cá nhân Git ignore, không lưu ảnh camera. Nội dung0lượt trong các mục lịch sử phía trên là snapshot trước khi nhận CSV này. Weights/threshold không đổi, CANDIDATE.

## Snapshot tích lũy5lượt

Người dùng gửi đầy đủT0001–T0005 cùng profile4e4ebb. Kiểm T0001 khớp bản1lượt trước, dùng snapshot5lượt thay cho snapshot1lượt khi tổng hợp, không cộng thành6. Cả5đủ điều kiện ca âm theo protocol vàUNKNOWN;0dương/0lượt cuối, p95gợi ý vẫnnull. Các đoạn n=1 phía trên là lịch sử. Tiếp theo thử NEG_MOTION nội bộ; không đổi policy/weights.

## Hai lượt cử động thông thường

Đã kiểm2NEG_MOTION củaP01:65/79frame,3248,50/3938,40ms,UNKNOWN,response198,50/105,50ms. Tổng7ca âm hợp lệ (5tay nghỉ+2motion),0dương/0cuối,không gợi ý sai trong các lượt này. Hai CSV có mãTtrùng nhưng thuộc nhóm khác; kiểm từng bộ riêng, giữ mã gốc, tổng hợp theo(batch_id,trial_id) và ghi SHA nguồn ở batch_provenance. Không cộng snapshot cũ lặp. CANDIDATE; chưa hoàn thành kiểm nhận diệnVSL.

## Snapshot NEG_MOTION đủ5lượt

Đã so hai dòng đầu khớp CSV2lượt và chỉ dùng snapshot5lượt thay thế cho tổng hợp. Tổng10ca âm hợp lệ (5NEG_REST+5NEG_MOTION),cả10UNKNOWN,0gợi ý sai trong nhóm;0dương/0lượt cuối. Không tính bản1rest hoặc2motion cũ lần nữa. Thử này của1người nội bộ/D01, không phải accuracyVSL. CANDIDATE; tiếp ca vẫy chào thông thường theo NEG_OUTSIDE kỹ thuật đã nêu trong README.

## Lượt NEG_OUTSIDE đầu tiên

Đã đối chiếu1CSV vẫy chào:92frame,4646,50ms,UNKNOWN,response198,10ms,worker ready. Snapshot nguồn riêng ngoài nhóm rest/motion, giữ mãT0001 gốc và hash nguồn. Tổng11ca âm hợp lệ,0gợi ý sai trong nhóm,0dương/0cuối,p95gợi ý null. Đây là vẫy chào thông thường của người đang học, không phải tậpVSL OOD được kiểm tra. CANDIDATE.


## Lịch sử kỹ thuật Q-27 ngày 19/11

Profile mới: `509264a98b707ebdb6c80c1656dcaa075e3ce5e7afd38a7c36fa1ce5e96105dd`.173test backend+96frontend,8runtime,build và18E2E qua; có luồng gợi ý cả câu, patch đồng thời, hỏi bổ sung và xác nhận hai phía. E2E camera mô phỏng không điền vào số người/lượt thật. Model giữ nguyên checkpoint; trạng thái CANDIDATE, metrics mới0live. Baseline4e4ebb giữ nguyên11ca âm cùng provenance, không bị xóa hoặc chuyển thành bằng chứng cho bản mới.

## Camera legacy theo Q-32

Profile hiện tại 0663da036379803b7c9bfd76caa9b4a36ebdb6ec623f739758bf509f1bf9a2c5 có0lượtCSV. Giữ trọng số V2, chuyển extractor sang Web legacy đã được duyệt. CANDIDATE; ảnh gợi ý Ngực và lời báo Đầu trước đây thuộc phiên bản trước. Không chuyển chúng thành kết quả bản mới.
