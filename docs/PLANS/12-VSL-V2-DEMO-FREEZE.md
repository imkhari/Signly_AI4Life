# M0–M5 — Kiểm chứng và chốt camera V2

Ngày 19/11/2026. Mốc đầu: `b4432d775052a72ea9ed5fb973b04ca5a2020378`. Trạng thái **CANDIDATE**, chưa có lượt camera người thật. Thực hiện theo `docs/PROMPTS/P9-VSL-V2-DEMO-FREEZE.md`.

## Kế hoạch

1. Xác minh artifacts, provenance và baseline đã có.
2. Kiểm lỗi pipeline bằng landmark công khai/tổng hợp, ghi rõ nguồn.
3. Chuẩn bị protocol, bảng kết quả và CLI tổng hợp không cần lưu camera.
4. Xin chốt các thay đổi M2 ảnh hưởng safety và tiêu chí thử nội bộ.
5. Triển khai phần đã duyệt, viết regression và kiểm tra trình duyệt.
6. Hướng dẫn từng lượt camera và thu kết quả rời rạc do nhóm xác nhận.
7. Phân tích trên phần phát triển, giữ phần đánh giá cuối riêng.
8. Chỉ đóng băng khi đạt phạm vi đã chốt; thiếu dữ liệu giữ pending.

## M0 — Kiểm kê

| Mục | Bằng chứng | Trạng thái / tác động |
|---|---|---|
| V2 compact | SHA256 `d9010be34e0362d0f5fe84b522f19db0a74a4d79e16f437fd0d221e19a41e246` | Khớp manifest, không đổi weights |
| Translation vocab442 | SHA256 `f43f686da08fcab6ade5fa5bffec1379e24e7032c5b4ef7709a302e3ff2b5dcb` | Hash file JSON, thứ tự token được kiểm trong package |
| Holistic task | SHA256 `e2dab61191e2dcd0a15f943d8e3ed1dce13c82dfa597b9dd39f562975a50c3f8` | Khớp asset manifest |
| Runtime | Python3.15.2, Torch2.15.0, NumPy2.5.5, môi trường riêng | Có lock; backend không cài torch |
| Decoder / CTC | Greedy tiếng Việt; CTC374 không xuất gloss | Không có class order CTC đã xác minh |
| Replay đã mở | 300 output tái hiện;256/300 câu khớp reference | Dữ liệu đã xem, không dùng làm test cuối mới hoặc chọn ngưỡng rồi gọi độc lập |
| Annotation | 65 reference khác metadata công khai; thiếu config train gốc | Chưa đủ căn cứ fine-tune; tương thích hành vi không xác minh toàn bộ dữ liệu train |
| Camera/người ký | Chưa có lượt | Pending; không suy từ E2E/fixture |

## M2 — Phát hiện và phương án có thể duyệt

| ID | Tái hiện / file | Tác động | Xử lý |
|---|---|---|---|
| F01 | `worker.prepare_sequence`:24 frame đúng30FPS thành23 do `int(22.999999...)` | Mất một frame do sai số số thực | Sửa số học về lưới30FPS với epsilon chỉ bù roundoff, giữ floor ở thời lượng thực; regression |
| F02 | `engine.preprocess`: một frame có vai hợp lệ, chín frame tiếp theo mất pose vẫn được chấp nhận; max đặc trưng1.025.839 | Chuẩn hóa bằng gần0, đầu vào không đáng tin | Đề xuất từ chối cả chuỗi nếu bất kỳ frame thiếu một trong hai vai hoặc width≤1e-5; không đổi công thức norm2 cho input hợp lệ |
| F03 | Client cửa sổ trượt gửi prefix; fixture công khai SENT101 ở36frame đã ra ĐAU dù đầy đủ70frame | Chưa có ranh giới một câu; có thể gửi khi người ký chưa xong/ghép ý | Đề xuất Bắt đầu ký → Xong câu → một suy luận trên câu hoàn chỉnh |
| F04 | SENT105 đầy đủ69frame vẫn “tôi bị ho” thay reference sốt | Lỗi model đã biết, không thể giải bằng sửa lấy camera đơn thuần | Giữ ca sai; thử sốt ở mục chẩn đoán lỗi, chưa đưa vào tập trình diễn được xác nhận |
| F05 | Thiếu benchmark ca âm/camera; extractor web khác dataset legacy | Chưa có bằng chứng ngưỡng phù hợp | Chuẩn bị phép thử người thật, chưa chỉnh confidence/motion |

F02 là probe sửa đổi có chủ đích từ landmark công khai, không phải lỗi quan sát trên webcam. F03 là probe prefix của clip đã biết, không chứng minh mọi câu sẽ sai. Báo cáo tái lập sẽ lưu nguồn và hash, không đưa expected label vào inference.

### Q-24 đã duyệt — capture một câu

- Camera chỉ gửi sau **Bắt đầu ký → Xong câu**, một kết quả/câu rồi Nhận/Sửa và Áp dụng như cũ. Bỏ yêu cầu lặp ba kết quả cửa sổ trượt cho camera câu; không gọi lặp cùng clip là ba mẫu độc lập.
- Giữ ngưỡng điểm0,7, guard hiện diện/chuyển động và giới hạn180frame/6giây. Nếu vượt giới hạn, tracking đứt>500ms hoặc chuỗi không đủ24frame/800ms, từ chối lượt thay vì tự gửi đoạn câu bị cắt. Không đổi công thức normalization/vocabulary/checkpoint.
- Backend/worker từ chối chuỗi có frame mất vai theo F02. Lỗi → UNKNOWN, giữ đường Chạm; không thay quy tắc cảnh báo y tế.
- Chuẩn bị trang thử nội bộ `/vsl-validation`, sử dụng chính camera production, mã P01–P03/D01, đáp án chỉ nằm ở bộ chấm. Chỉ xuất nhãn/timing/mã thử khi người dùng yêu cầu, không video/landmark/câu dịch/session bệnh nhân. Không có endpoint lưu trial trên backend.
- Đồng bộ docs02/03/07 và test; review checklist Q-23. Cần duyệt trước thay đổi capture/điều kiện từ chối.

### Q-25 đã duyệt — tiêu chí thử nội bộ

Đây là mục tiêu engineering cho bản thi, **không phải tiêu chuẩn y tế hoặc của ban tổ chức**. Chốt trước lượt đánh giá cuối:

- Ba ý chính: đau đầu (`symptom→ĐAU`), đau ngực (`location→NGỰC`) và khó thở (`symptom→KHÓ-THỞ`). Sốt là ca chẩn đoán lỗi bắt buộc, báo riêng và không giấu kết quả.
- P01/P02 phát triển; P03 đánh giá cuối sau khóa cấu hình. Mỗi ý5lượt/người điều kiện chuẩn; không gọi người nội bộ bắt chước là người dùng VSL độc lập.
- Mỗi ý ở P03 có ít nhất4/5 lượt đúng, tính cả từ chối trong mẫu số; mọi nhãn sai phải ghi rõ. Nếu không đạt, giữ CANDIDATE cho ý đó.
- P03 có25lượt âm (5loại×5); mục tiêu không có gợi ý sai xuất hiện. Tách động tác ngoài danh mục nhưng tracking hợp lệ khỏi mất landmark/gián đoạn, không gọi tất cả là OOD hợp lệ.
- P95 từ bấm Xong câu đến gợi ý hiển thị≤5giây ở lượt có gợi ý; báo cả cold start, warm, timeout và tỷ lệ từ chối. Mẫu nhỏ, không suy ra bảo đảm cho người dùng mới.
- Bộ kiểm tra regression, không đưa raw decoder/ngoài ontology vào phiếu, Nhận/Áp dụng và reset phải qua. Nếu dùng test cuối để sửa tiếp, cần lượt cuối mới.

Chủ dự án đã duyệt Q-24/Q-25; Q-26 xác nhận chưa biết VSL. Đã thực hiện capture theo câu, guard vai, công cụ chấm và trang thử. Các lượt trực tiếp còn pending, không coi chuẩn bị công cụ là đạt tiêu chí.

## Bàn giao M3–M5

Tài liệu/thử rời rạc tại `docs/validation/vsl-v2/`. `FREEZE.md` giữ CANDIDATE cho tới khi đủ tiêu chí và kết quả thật. Việc nhóm ký trước camera là phần bắt buộc người tham gia thực hiện. Chưa quyết định train lại V2; ưu tiên sửa pipeline trước, đo rồi phân loại nguyên nhân.

## Cập nhật kiểm nguồn và đánh giá sau sửa

F06: extractor thật tại commit đã pin gọi cv2.resize toàn khung360×360, không center-crop. Đã sửa input web theo nguồn, preview giữ tỷ lệ video; lưu snapshot và hash extractor trong vendor chỉ để đối chiếu. Không cần thêm OpenCV/MediaPipe Python.

Để kiểm guard mới, chỉ tải300landmark test53.059.044byte vào thư mục tạm, khớp SHA256 từng file với manifest đã giữ. Replay sau guard có255/300câu đúng,WER205/2157=9,50%,từ chối1mẫu SENT280;299output còn lại khớp file kèm model.3clip dài hơn180frame. Đây là chẩn đoán/replay tập đã mở, không phải benchmark camera mới hoặc tập cuối độc lập.

M0/M1 và phần kỹ thuật M2 hoàn tất; M3 có protocol/trang thử/CSV/CLI nhưng n=0; M4 đã phân loại lỗi/sửa pipeline, chưa tune hoặc train lại; M5 có FREEZE.md ở CANDIDATE. Người nội bộ bắt đầu từ5lượt tay nghỉ theo README, lượt dương chờ cách ký được kiểm tra.

## Pilot đầu tiên trước cập nhật UI

Người dùng báo5lượt không gợi ý. CSV xuất thực có1lượt P01/NEG_REST,121frame,reason sequence_limit,không có response API. Lượt này chưa đủ điều kiện ca âm tracking hợp lệ; không tính5lượt qua và không tạo4dòng còn thiếu. Bản xuất đã sao lưu ở local Git ignore, gắn profilec52feba0f7a7b2c247b191389e6ab8f1148ee2538da9d09823b42b135028eab0. Cần hướng dẫn/đếm ngược trước khi đo tiếp.

F07 (source review): trước sửa, chưa có frame đầu vẫn có thể chấp nhận frame tới trễ hơn500ms và làm mất đầu câu. Bản mới chặn khoảng trễ đầu bằng cùng maxGap500ms; có regression. Pilot hết6giây cũng dẫn đến thêm đếm ngược/scroll camera và chặn tiếp tục khi profile đổi. Không đổi model/allowlist/điểm0,7. CSV C52 đã sao lưu trước cập nhật.
