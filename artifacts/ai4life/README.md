# Bộ slide học thuật AI4Care — AI4Life

Bản cập nhật 19/11/2026 theo yêu cầu đặt demo cuối, trình bày học thuật, chi tiết và chuyên nghiệp. File chính `AI4Care_AI4Life.pptx`: **16 slide chính + 5 phụ lục ẩn**, demo ở slide 16. Giữ nhận diện template và ba face font UTM đã tải.

## Mở và sử dụng

- `AI4Care_AI4Life.pptx`: chữ, bảng và sơ đồ sửa được; có ghi chú thuyết trình và nguồn từng trang.
- `AI4Care_AI4Life.pdf`:21 trang xem cố định, gồm phụ lục; là ảnh render, không phải PDF để tìm kiếm hoặc sửa chữ.
- `THUYET-TRINH.md`: bản đầy đủ 7 phút, đường rút gọn 3 phút và thao tác demo; Q-11 vẫn 3 phút + 2 phút hỏi đáp.
- `NOI-DUNG-CHI-TIET.md`: nội dung giải thích và nguồn cho 21 slide.
- `QA.md`, `EVIDENCE.md`, `VERIFICATION.md`: phản biện, bảng bằng chứng và phạm vi kiểm tra.
- `screenshots/`: ảnh app với ca giả lập. Các ảnh `sentence-*-synthetic.png` dùng detector/response mô phỏng, không phải kết quả VSL thật; có provenance riêng.

## Cấu trúc phần chính

1. Mở đầu: 1.
2. Vấn đề, mục tiêu và phạm vi: 2–3.
3. Giải pháp và điểm khác biệt: 4–5.
4. Kiến trúc và phương pháp V2: 6–7.
5. Dữ liệu và đánh giá: 8–10.
6. Hiệu năng trên điện thoại thật: 11, hiện ghi “Chưa đo”.
7. An toàn, quyền riêng tư và đạo đức: 12.
8. Giới hạn, kế hoạch kiểm chứng và đóng góp: 13–15.
9. Demo trực tiếp: 16, cuối phần chính.

Phụ lục A1–A5: giao diện theo câu, công thức/nguồn dữ liệu, biểu mẫu đo điện thoại, tài liệu tham khảo và câu hỏi phản biện.

## Font, tên nhóm và trình chiếu

Cài bằng Font Book ba file đã tải: UTM Swiss Condensed, CondensedBold và UTM Swiss 721 Black Condensed. Hai tên family trong PowerPoint là `UTM Swiss Condensed` (Regular/Bold) và `UTM Swiss 721 Black Condensed`. File chỉ tham chiếu font; không phân phối TTF. Giữ nền gốc/template, không sửa file nguồn trong Downloads.

Đã dùng tên nhóm IDK theo thông tin được cung cấp. Tên làm việc AI4Care có thể đổi; nhóm bổ sung tên thành viên/GVHD khi nộp. Ngày trên slide 1 thuộc nền template, cần đối chiếu lịch thi thật. Cần mở trong PowerPoint trên máy thi để kiểm font, liên kết mở localhost và máy chiếu; chưa có phép thử trong PowerPoint thật được ghi nhận.

## Trạng thái bằng chứng

Replay: 255/300 khớp câu, WER 9,50%, một mẫu mất vai bị từ chối; dữ liệu 300 NPY/S06, chưa là accuracy webcam. Baseline 4e4ebb có 11 ca âm nội bộ, bản 509264a9 mới 0 live và chưa có ca dương VSL xác minh. Điện thoại thật, người dùng mục tiêu, điều dưỡng và hiệu quả bệnh viện chưa đo. Model giữ CANDIDATE; không đổi weights khi làm slide.

Demo mặc định dùng Chạm, LLM mock và ca giả lập. Camera chỉ thêm sau khi ký đúng được xác minh và diễn tập. Chưa có video dự phòng, diễn tập hai thiết bị HTTPS LAN hoặc ngắt Internet ngoài trên thiết bị thật. Các ô Chưa đo cần cập nhật bằng số liệu thực, không điền số ước lượng.
