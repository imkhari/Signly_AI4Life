# Đề xuất Q-33 — từ chối chuỗi hoàn toàn thiếu landmark mặt

Ngày 20/11/2026. **Chủ dự án đã duyệt “Duyệt Q-33 và triển khai” ngày20/11/2026; đã triển khai và kiểm lại theo phần cuối.** Phần kiểm nghiệm độc lập dùng quyền đã duyệt Q-23/Q-30–Q-32 và prompt hoàn thiện V2 của chủ dự án.

## Bằng chứng

Công cụ `AI_model/vsl_v2/robustness.py` chạy worker thật và mapping intake trên 4 NPY công khai đã ghim hash, 17 biến thể/mẫu. Báo cáo `AI_model/vsl_v2/reports/controlled-perturbations-2026-11-20.json`.

| Mẫu | Bản gốc qua worker | Sau xóa toàn bộ face70 ở mọi frame |
|---|---|---|
| SENT101, câu đích đau đầu | PAIN+HEAD | UNKNOWN, ngoài allowlist |
| SENT103, câu đích đau ngực | PAIN+CHEST | PAIN, thiếu vị trí |
| SENT105, câu đích sốt | COUGH, lỗi đã biết | PAIN, sai |
| SENT115, câu đích khó thở | BREATH_DIFFICULTY | COUGH, sai |

Các bản xóa mặt vẫn giữ vai/tay, guard hiện tại có thể cho qua. Đây là biến đổi tổng hợp trên dữ liệu đã xem, không phải 4 người hay 4 lượt webcam. Chưa tái lập nhầm FEVER trong batch người dùng, không quy nguyên nhân lượt đó là mất mặt. Xóa mặt ở một phần ba giữa làm hai mẫu từ chối; chưa có cơ sở chọn ngưỡng tỷ lệ frame hoặc yêu cầu mặt ở mọi frame.

## Thay đổi cụ thể đề xuất

1. Sau chuẩn bị sequence trong worker, nếu **toàn bộ nhóm face70, tất cả frame, đều bằng0**, từ chối trước decoder, trả reason nội bộ `no_face_landmarks`.
2. Backend intake ánh xạ sang UNKNOWN/gợi ý null và mã cố định `suggested_next_step=face_not_tracked`. Context cũ vẫn UNKNOWN theo cơ chế hiện có.
3. UI nhắc cố định “Chưa theo dõi được khuôn mặt trong lượt ký. Đưa mặt vào khung rồi thử lại hoặc dùng Chạm.” Bảng thử/CSV cho thêm mã kiểm soát này, vẫn reason unknown và cùng cách chấm từ chối.
4. Không chặn một frame thiếu mặt hoặc đặt ngưỡng phần trăm chưa hiệu chỉnh. Không đo mức chất lượng khuôn mặt từ việc một điểm khác0; điều kiện này chỉ phát hiện toàn nhóm thiếu hoàn toàn.
5. Giữ checkpoint, extractor, normalization, thời gian capture, điểm0,7, allowlist, Nhận/Sửa và xác nhận hai phía. Không sửa nhãn Sốt thành Đau hoặc ép vị trí.
6. Thêm tests cho chuỗi không mặt không gọi decoder, chuỗi có mặt không bị gate này chặn, mã UI/CSV có kiểm soát và legacy không đổi; chạy make check,check-v2,build,E2E liên quan; tạo profile mới và giữ baseline cũ.

## Lợi ích và giới hạn để duyệt

Gate sẽ từ chối các chuỗi hoàn toàn thiếu dữ liệu mặt trước khi model có thể đưa gợi ý sai. Đây là kiểm tính đầy đủ đầu vào, không bảo đảm ký đúng hoặc model đúng, không chữa lỗi sốt gốc và không chứng minh sửa được ca webcam. Có thể tăng tỷ lệ từ chối khi thiết bị không bắt mặt; người dùng còn Chạm/nhân viên. Chưa được phép coi camera ổn định sau gate.

Không thêm dependency, ảnh/video/landmark lưu phiên, trường request hoặc schema SemanticFrame. Cần duyệt vì đổi điều kiện nhận diện và mã phản hồi API. Sau câu trả lời duyệt, triển khai gate sau guard chuyển động hiện có để giữ ưu tiên phản hồi cũ.

## Phạm vi triển khai sau duyệt

Worker chặn hoàn toàn thiếu mặt sau guard hiện diện/chuyển động tay, trước decode. Bộ chấm giữ từ chối ở ca dương; ca âm negative_valid bị face_not_tracked là unmeasurable, không đạt ca âm tracking hợp lệ. Đây là hệ quả kiểm đầu vào, không nới tiêu chí Q-25. Không tự bổ sung loại thử mới hoặc tính missing-face thay cho25ca âm yêu cầu.

## Kết quả sau triển khai

Cùng68probe và đúng4nguồn/hash.4biến thể toàn mặt thiếu đềuUNKNOWN/face_not_tracked, thay cho3gợi ý sai+1UNKNOWN. Các64biến thể khác giữ nhãn/mã như trước. Mẫu sốt gốc vẫnCOUGH sai. Endpoint thật localhost xác nhận mẫu ngực xóa mặt không tạo gợi ý. make check200backend+115frontend,18runtime,build và26E2E qua. Profile9e377812 có0lượt webcam mới, tiếp tụcCANDIDATE.
