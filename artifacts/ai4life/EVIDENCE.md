# Bằng chứng và nguồn của bộ slide học thuật

Cập nhật 19/11/2026. Phần chính16 slide, demo cuối. Không dùng phần trăm tiến độ ước lượng trong hội thoại làm kết quả nghiên cứu. Các lợi ích người dùng/bệnh viện chưa đo được trình bày thành giả thuyết hoặc kế hoạch.

## Bảng đối chiếu

| Nội dung | Slide | Nguồn | Giới hạn |
|---|---|---|---|
| Bài toán, mục tiêu và phạm vi | 1–3 | AGENTS.md, docs/00-PRD.md, Q-18/Q-26 | Chưa có khảo sát bệnh viện hoặc kiểm người dùng mục tiêu. |
| Nhận một câu thành gợi ý nhiều trường | 4, A1 | docs/PLANS/14-V2-SENTENCE-INTAKE.md; backend/app/ai/vsl_v2.py; frontend/e2e/vsl-sentence-intake.spec.ts | Ví dụ cơ chế, không chứng minh nhận đúng VSL qua camera. |
| Điểm thiết kế theo quy trình | 5 | PRD, contract; Cboard[R1] | So sánh phạm vi công bố, chưa benchmark hoặc xác minh ưu thế thị trường. |
| Kiến trúc và V2 | 6–7 | docs/05,08; model-manifest.json; engine.py; HolisticDetector.ts; SentenceCapture.ts | Config suy từ weights/replay; train provenance gốc còn thiếu. |
| Dữ liệu đánh giá | 8, A2 | post-guard-replay.json; freeze-baseline-audit.json; VSL-GH[R3] |300 NPY/S06;65 reference khác metadata;3clip dài hơn giới hạn camera. |
|255/300 khớp câu; 85,00% | 9 | metrics.exact_matches=255, metrics.clips=300 | Mẫu số toàn 300, bao gồm mẫu bị từ chối; không phải accuracy webcam. |
|44không khớp +1từ chối | 9 |255khớp,1rejected;300 - 255 - 1 = 44 | Các loại trong bảng không trùng nhau. Bảng tổng300 được kiểm số học. |
|WER 9,50% | 9, A2 |205 edits/2157reference_tokens;144 S+31 D+30 I | Theo từ tiếng Việt, giữ dấu câu; không phải WER gloss hoặc trung bình WER từng câu. |
|Hai ca sốt sai | 9,13 | docs/validation/vsl-v2/RESULTS.md; pipeline-after.json | Có đầu ra Ho/Đau; giữ nguyên lỗi, không quảng bá sốt nhận tốt. |
|173 backend + 96 frontend qua | 10 | make check tại code 0094d98; đợt làm slide chạy lại cùng code và qua | Kiểm phần mềm, không thay đánh giá người dùng. |
|8 runtime + 18 E2E | 10 | Nhật ký code 0094d98; vsl_v2/tests và frontend/e2e | Kết quả đợt kỹ thuật trước; đợt chỉ làm slide không chạy lạiE2E. Camera trong E2E nhận cả câu dùng mô phỏng. |
|11 ca âm baseline 4e4ebb | 10 | docs/validation/vsl-v2/baselines/4e4ebb4bedf313ca4c449c07608cdcd8fe1adfa34a89547157bf4c921d9ad48f.json | Một người nội bộ đang họcVSL: 5tay nghỉ+5motion+1vẫy chào,11UNKNOWN; có thể bị chặn trước decoder. |
|Bản 509264a9 mới 0 live | 10 | metrics.json và frontend/public/vsl-validation-profile.json | Chưa có ca dương VSL xác minh hoặc thử cuối; không cộng11 lượt cũ sang. |
|Hiệu năng điện thoại | 11, A3 | Chưa có kết quả; protocol trong phụ lục | Chỉ kế hoạch đo FPS/độ trễ/lạnh-nóng/lỗi; không điền số laptop. |
|An toàn và đạo đức | 12 | docs/07; WHO 2021[R4] | Seed cảnh báo chưa được thẩm định; tham chiếu WHO không chứng nhận sản phẩm. |
|Giới hạn và kế hoạch kiểm chứng | 13–14 | Q-25, kế hoạch12/14; docs/validation/RESULTS.md | Tiêu chí kỹ thuật mẫu nhỏ, không chuẩn y tế; người dùng/điều dưỡng chưa tham gia. |
|Đóng góp và demo | 15–16 | Code; D-017/D-028; frontend/e2e/demo.spec.ts | Ca giả lập, Chạm và LLM mock; phiên dịch mô phỏng, camera tùy chọn. |

## Tài liệu tham khảo công khai

- [R1] Cboard, mô tả AAC bằng biểu tượng và text-to-speech: https://www.cboard.io/en/ . Không suy rằng sản phẩm không có mọi tính năng khác ngoài phần mô tả đã đối chiếu.
- [R2] Google AI Edge, MediaPipe Holistic Landmarker: https://developers.google.com/edge/mediapipe/solutions/vision/holistic_landmarker .137điểm là subset ứng dụng chọn, không là toàn bộ outputHolistic.
- [R3] VSL-GH, README và LICENSE tại commit 6c351e63c0b2cf1b5e2e8056bb3bf2d6f31dc90a: https://github.com/nguyentheanh822/Vietnamese-Sign-Language-Translation/tree/6c351e63c0b2cf1b5e2e8056bb3bf2d6f31dc90a . Đã tải/đối chiếu raw 19/11/2026, README 4482 byte và LICENSE 1079 byte; copyright (c) 2026 VSL-GH Dataset Authors, MIT theo nguồn. Chưa có thông tin thư mục paper đủ để tự tạo tác giả hoặc DOI.
- [R4] World Health Organization (2021), *Ethics and governance of artificial intelligence for health*, ISBN 9789240029200: https://www.who.int/publications/i/item/9789240029200 . Dùng tham chiếu về đạo đức/quyền con người và trách nhiệm.
- [R5] AI4Care repository, code 0094d98 và các tệp báo cáo/protocol nêu trong bảng. Đây là nguồn số liệu dự án, không là nghiên cứu đã phản biện độc lập.

## Model và phiên bản

Checkpoint runtime SHA256: `d9010be34e0362d0f5fe84b522f19db0a74a4d79e16f437fd0d221e19a41e246`. Không đổi weights, capture, threshold, contract, safety hoặc profile trong đợt chỉ làm slide.

Profile hiện tại: `509264a98b707ebdb6c80c1656dcaa075e3ce5e7afd38a7c36fa1ce5e96105dd`. Baseline11 ca âm giữ riêng `4e4ebb4bedf313ca4c449c07608cdcd8fe1adfa34a89547157bf4c921d9ad48f`. Nguồn train/weights và consent gốc chưa xác minh đủ để tuyên bố triển khai rộng; license mã nguồn không tự giải quyết quyền đối với mọi weights/video.

## Hình ảnh và template

Ảnh A1 lấy từ app đang chạy, nhưng camera dùng canvas, detector và response model mô phỏng. Chỉ chứng minh cách hiển thị gợi ý và phiếu. Không có người bệnh thật, video hay landmark được lưu. `screenshots/PROVENANCE-SENTENCE.json` ghi loại bằng chứng và hash ảnh. Các ảnh cũ khác trong thư mục giữ lịch sử và không dùng làm phép thử người dùng mới.

Giữ nền nhận diện và master/layout từ deck/template đã cung cấp. Nguồn gốc template: `/Users/mac/Downloads/Template Slide AI4Life.pptx`,1280×720/12192000×6858000EMU. Giữ ba ảnh nền gốc nguyên byte. Ba face font được tham chiếu: UTM Swiss Condensed Regular, Bold và UTM Swiss 721 Black Condensed; không phân phối TTF. Tên nhóm IDK theo ảnh thông tin cuộc thi mà chủ dự án cung cấp; các tên thành viên khác không được tự bổ sung.
