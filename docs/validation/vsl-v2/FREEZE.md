# Bản AI cho buổi thi — CANDIDATE

**Chưa đóng băng chất lượng.** Q-24 capture/guard và Q-25 tiêu chí nội bộ đã được duyệt, nhưng pilot cũ chỉ có1dòng hết thời gian, chưa có phép thử ca âm hợp lệ gọi API; bản mới chưa có lượt. Chưa đạt điều kiện chuyển sang tuyên bố model đã hoàn tất. Có thể tiếp tục hoàn thiện tài liệu chuẩn bị mà không gán số liệu chưa có.

## Phiên bản kỹ thuật

Profile kỹ thuật hiện tại: `695918d46c5e8cc1d00597558f12562b5fab1d711990609ecfcb7162603e929a`. PilotC52 cũ được giữ riêng với commit232333d; không trộn kết quả giữa hai cấu hình. Code camera/tool hiện tại: `1375640`; pilot ban đầu: `232333d`. Base commit trước M0–M5: `b4432d775052a72ea9ed5fb973b04ca5a2020378`. Fingerprint ràng buộc từng file code và policy; quyết định đóng băng chưa được đưa ra.

- Checkpoint: `AI_model/checkpoints/vsl_v2.pt`, SHA256 `d9010be34e0362d0f5fe84b522f19db0a74a4d79e16f437fd0d221e19a41e246`, không đổi weights.
- Decoder tiếng Việt442 token, greedy; CTC374 không xuất gloss. Norm2 vai9/10; mọi frame phải có hai điểm vai hợp lệ, không dùng width gần0.
- Resize toàn khung360×360 theo source đã pin, input không flip; preview giữ tỷ lệ video và lật gương. Extractor web khác legacy nguồn nên vẫn cần thử trực tiếp.
- Capture: Bắt đầu ký/Xong câu, một inference/câu, tối đa6giây/180frame, ít nhất24frame/800ms, không có gap>500ms, mất tracking/vai từ chối cả lượt. Không tự gửi đoạn câu bị cắt, không lặp cùng clip để tạo cảm giác ổn định.
- Điểm0,7 và guard hand motion/presence hiện có giữ nguyên, chưa hiệu chỉnh. JSON profile ở `frontend/public/vsl-validation-profile.json`, bản lưu `profiles/<profile-id>.json` ràng buộc code, policy và artifacts; chạy prepare trước buổi thử.
- Config train gốc/class order CTC và annotation65reference còn thiếu; không diễn giải replay thành xác minh nguồn train đầy đủ.

## Phạm vi dự kiến

Chỉ xem xét đau đầu (symptom), đau ngực (location), khó thở (symptom) ở điều kiện bình thường sau khi đạt phép thử. **Hiện chưa có ý nào được chứng minh chạy ổn định trên camera người thật.** Sốt giữ ca kiểm lỗi, không quảng bá nhận tốt; mức đau/thời gian dùng Chạm. Nhận → Lưu → bệnh nhân xác nhận toàn phiếu → điều dưỡng duyệt vẫn giữ nguyên. Chạm là luồng thi chính D-017.

## Điều kiện đổi trạng thái

`metrics.json` của bản mới đang n=0; pilot cũ có1lượt hết thời gian không đạt điều kiện đầu vào, tỷ lệ/latency null, số học chưa đạt. Để ghi FROZEN_FOR_INTERNAL_DEMO cần: đủ ma trận người/lượt đúng split, mỗi ý chính P03≥4/5,25ca âm không có gợi ý sai (tách tracking hợp lệ với đầu vào hỏng),p95≤5giây khi có gợi ý, sốt kiểm riêng, regression qua và nhóm xác nhận chưa dùng lượt cuối để tune. Các ca âm tracking hợp lệ phải thực sự có chuỗi đủ điều kiện gửi API; lỗi quá ngắn/mất vai không thay thế phép thử đó.

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
