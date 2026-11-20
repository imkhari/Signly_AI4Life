# Thử kỹ thuật camera V2 — Q-24/Q-25

Trạng thái **CANDIDATE**. Luồng sản phẩm Q-27 dùng cả câu để gợi ý nhiều trường; trang thử gửi cùng context intake và chấm gợi ý có cấu trúc sau khi hiển thị. Các bản xuất cũ vẫn đọc được bằng snapshot profile tương ứng. Profile hiện tại 7537ba3f đã có 5 lượt CSV phát triển P01 cho câu đích đau ngực, 0 đúng, 1 nhầm Sốt và 4 từ chối; chưa có lượt cuối. Xem RESULTS.md và metrics.json. Có11ca âm profile4e4ebb được giữ nguyên tại baseline (5tay nghỉ+5cử động thông thường+1vẫy chào,cả11UNKNOWN), không chuyển thành kết quả luồng nhận cả câu. Chưa có lượt dương được xác minh cách ký VSL hoặc thử cuối. Hiện nhóm chưa biết VSL (Q-26); thử kỹ thuật nội bộ không chứng minh khả năng dùng VSL hoặc hiệu quả bệnh viện.

## Mở bộ thử

```bash
make prepare-vsl-validation
make demo
```

Mở `http://localhost:5173/vsl-validation`. Route này sử dụng đúng component camera của màn bệnh nhân, không cần ghép phiên và không tạo phiếu bệnh nhân. Chỉ khi người tham gia đồng ý và bấm **Bắt đầu lượt thử** mới mở camera. Không ghi video, ảnh, landmark hoặc câu decoder; chỉ nhãn/timing/mã thử nằm trong RAM. Tải CSV trước khi đóng/tải lại trang. Khi đổi profile, trang chặn bắt đầu lượt mới; xuất kết quả rồi tải lại để tách phiên bản. Các câu trả lời thật của bệnh nhân không thuộc phép thử này.

Mã người P01/P02 dùng phát triển; P03 để cuối sau khóa cấu hình. Không dùng lượt P03 để tiếp tục chỉnh rồi gọi đó là đánh giá độc lập. D01/D02 là mã máy, không nhập tên người, email, địa chỉ hoặc thông tin sức khỏe. Mức biết VSL để `Chưa biết / đang tập` theo tình hình hiện tại. Ghi điều kiện bình thường trước; stress thiếu sáng/lệch góc/đổi khoảng cách báo riêng.

## Buổi đầu — không cần biết VSL

1. Chọn **P01**, D01, **Ánh sáng bình thường**, **Tay nghỉ trong khung**.
2. Chọn đồng ý rồi bấm **Bắt đầu lượt thử**, cho phép camera.
3. Đưa thân trên và bàn tay vào khung, đủ sáng. Chờ nút **Bắt đầu ký** mở. Nút còn khóa nghĩa là chưa theo dõi được vai/tay; điều chỉnh khoảng cách/góc, không tự coi là lỗi model.
4. Bấm **Bắt đầu ký**. Giữ bàn tay nghỉ, không khai triệu chứng, đến khi đồng hồ hiện **Còn 3 giây** thì bấm **Xong câu**; mỗi lượt tối đa6giây/180frame, cần ít nhất24frame và800ms. Không quá thời gian để tránh thử thành ca sai đầu vào.
5. Đáp án lượt này là **UNKNOWN/không có gợi ý**. Nếu hiện PAIN/COUGH/FEVER hoặc vị trí đi kèm thì là gợi ý sai; ghi nguyên kết quả. Không bấm Nhận nếu không đúng ý.
6. Trang giữ vị trí camera khi lượt dừng; bấm Xem kết quả khi muốn xem bảng. Nhìn hàng T0001: nhãn, kết quả và timing được tự ghi. Bấm **Lượt tiếp theo** rồi lặp đủ5lượt, không xóa lượt lỗi. Cuối nhóm5lượt bấm **Tải kết quả CSV**. Giữ cùng trang để mã T không bị lặp giữa các lần xuất.
7. Nếu hủy lượt, hệ thống ghi `aborted`, không coi là ca âm đạt. Nếu thiếu vai/quá ngắn/đứt tracking, giữ dòng lỗi; trường hợp đó không đủ chứng cứ cho ca âm tracking hợp lệ. Không sửa loại ca sau khi xem kết quả để làm đẹp số.

Có thể tiếp tục ca âm mà không cần VSL:

| Mã | Cách thực hiện | Đáp án / giới hạn |
|---|---|---|
| NEG_REST | Tay nghỉ trong khung, không có ý khai triệu chứng | UNKNOWN; tracking hợp lệ và có request mới tính đủ ca âm hợp lệ |
| NEG_MOTION | Chỉnh áo hoặc cử động tay thông thường, không khai triệu chứng | UNKNOWN; không gán động tác này là một ký hiệu VSL chuẩn |
| NEG_OUTSIDE | Cử động không mang ý khai triệu chứng, ví dụ vẫy chào thông thường | UNKNOWN trong thử kỹ thuật; chưa phải tập VSL ngoài từ vựng đã được chuyên gia xác minh |
| NEG_MISSING | Bắt đầu khi thấy vai/tay, sau đó rời khung hoặc che mất điểm vai | Từ chối; báo riêng ca đầu vào không hợp lệ |
| NEG_GAP | Bắt đầu rồi làm gián đoạn tracking, sau đó trở lại | Từ chối cả lượt; báo riêng ca gián đoạn, không dùng lại câu cũ |

Không tắt hoặc đổi camera thật giữa chừng chỉ để tạo dữ liệu. Nếu phép thử nào không thực hiện được trên thiết bị, giữ pending và ghi điều kiện; không biến khung hình tổng hợp thành lượt người thật.

## Lượt dương và sốt

Ba mã lượt giữ tên lịch sử. Trang mới chấm đau đầu bằng PAIN+HEAD, đau ngực bằng PAIN+CHEST và khó thở bằng BREATH_DIFFICULTY. PAIN mọi trường hợp yêu cầu có đau; các lý do khác giữ tình trạng đau chưa hỏi. Thiếu hoặc sai vị trí ở ca đau ngực được ghi là gợi ý sai, kể cả khi người bệnh bỏ gợi ý. FEVER_DIAGNOSTIC là sốt, đang có lỗi nhận thành Ho/Đau và phải báo riêng.

**Chưa có người biết VSL kiểm cách ký nên lượt dương còn pending.** Không tự thay câu bằng chạm đầu/ngực hoặc sờ trán rồi gọi là VSL. Nếu nhóm tập theo tài liệu/video, phải nêu nguồn và có người biết VSL kiểm tra trước khi coi nhãn tham chiếu là đúng. Chỉ bắt chước nội bộ vẫn không chứng minh hiệu quả với người Điếc.

Kế hoạch bình thường: P01/P02 mỗi ý5lượt để phân tích; P03 mỗi ý5lượt sau khóa. Có9loại lượt, nên toàn bộ kế hoạch là135lượt (90phát triển +45cuối), đây là kế hoạch, không tự coi các lượt là đã thực hiện. Điều kiện stress đo thêm trên phần phát triển trước, không trộn với điều kiện chuẩn.

## Chấm và giữ bằng chứng

File `TRIALS.csv` trong repo chỉ có header. Bản xuất cá nhân để trong `docs/validation/vsl-v2/local/` (Git ignore). Nhãn tham chiếu và mã người chỉ dùng trong bộ chấm frontend sau inference, không được đưa vào POST `/api/vsl/predict`.

```bash
make summarize-vsl-trials VSL_TRIALS=docs/validation/vsl-v2/local/vsl-v2-trials.csv
```

CLI từ chối cột thừa, giá trị không kiểm soát, trùng trial_id, sai split/đáp án, NaN/timing không hợp lệ hoặc trộn cấu hình. Các lần xuất cùng trang là snapshot tích lũy; dùng bản đầy đủ mới nhất, không nối chúng rồi tính lặp. Nếu cần nhiều trang/lần thử, giữ riêng các bộ và hỏi cách gộp mã, không tự đổi người/mã để né kiểm tra.

`make prepare-vsl-validation` tạo fingerprint của code inference/capture, policy, checkpoint/vocab/assets và lockfiles; snapshot nằm trong `profiles/`. Chạy trước buổi thử và không sửa code giữa lượt cuối. Nếu cần chấm cấu hình cũ:

```bash
backend/.venv/bin/python -m AI_model.vsl_v2.trials summarize \
  --profile docs/validation/vsl-v2/profiles/<profile-id>.json \
  --input docs/validation/vsl-v2/local/vsl-v2-trials.csv \
  --output /tmp/vsl-v2-old-profile-metrics.json
```

Kết quả gồm đúng/sai/từ chối trên toàn bộ lượt dương; precision gợi ý theo lượt; ca âm hợp lệ và không hợp lệ tách theo `kind`; confusion và chia theo người/điều kiện/máy/split. Lượt hủy báo riêng và không được dùng để qua tiêu chí. Theo dõi cả gợi ý sai từng xuất hiện, không chỉ nhãn cuối.

Latency là **Xong câu → DOM đã cập nhật gợi ý**, không phải thời gian bệnh nhân ký hay xác nhận. Không có ứng viên thì `candidate_latency_ms` để trống. `response_latency_ms` báo riêng, không biến lượt không gọi API thành latency0. P95 dùng nearest-rank, median dùng định nghĩa thông thường; luôn báo n nhỏ. `worker_state` là quan sát GET status trước lượt (ready/not_ready/unknown), không phải bảo đảm không có thay đổi đồng thời; dùng để tách chi phí khởi động.

Tham số `?evidence=synthetic` chỉ dùng trong E2E, có nhãn mô phỏng và không được tính vào số người/lượt thật. CLI không tự đóng băng dù đạt số học; vẫn cần regression và xác nhận kỷ luật lượt cuối. `FREEZE.md` ghi trạng thái cuối cùng.


## Khi lượt dừng hoặc không tải được CSV

Lỗi capture giữ nguyên màn camera, hiện lý do và “Lượt đã dừng sau … giây; chưa gửi nhận diện.” Đây là dừng trước suy luận, không phải đồng hồ tiếp tục chạy ngầm. Bấm Xem kết quả khi muốn tới bảng. Giữ ít nhất một bàn tay trong khung khi dùng tay còn lại bấm chuột/nút; hai vai vẫn phải được nhìn rõ. Không tự quy một lỗi tracking thành model nhận sai ký hiệu.

Bấm Tải kết quả CSV để hiện thêm ô Nội dung CSV để sao chép. Nếu không có tệp tải xuống, bấm Sao chép CSV hoặc chọn toàn bộ trong ô và sao chép thủ công, dán vào tệp văn bản `.csv`. Không đóng/tải lại trang cho tới khi giữ được bản xuất, trừ khi chủ dự án chấp nhận mất phần chi tiết chưa xuất. Không suy từ ảnh kết quả thành số frame/timing chưa biết.

Các bản xuất khác trang/lần mở được giữ thành nhóm nguồn riêng. Nếu mãTtrùng giữa hai nhóm, kiểm CSV từng nhóm trước rồi tổng hợp theo(batch_id,trial_id), ghi hash nguồn; không sửa mã gốc hoặc ghép CSV để bỏ qua kiểm tra trùng. Snapshot tích lũy mới của cùng nhóm thay bản cũ, không cộng lặp. Baseline4e4ebb có provenance của rest-batch-01, motion-batch-01 và outside-batch-01; CSV nguồn nằm local Git ignore.

Lỗi worker, mạng hoặc đầu vào không đủ điều kiện ghi `unmeasurable`. Riêng lượt cố ý làm mất tracking được chấm đúng khi thấy lý do mất vai hoặc tracking bị gián đoạn. UNKNOWN với reason unknown cho biết pipeline không trả gợi ý, có thể guard đã từ chối trước decoder.

## Chẩn lỗi mất theo dõi và phím kết thúc câu

Ngày 20/11/2026, thêm hướng dẫn cụ thể khi mất cả hai bàn tay, khi khung hình tới trễ và khi timestamp không tăng. Những chi tiết này chỉ nằm ở thông báo UI trong RAM. CSV tiếp tục dùng reason tracking_gap theo định dạng cũ. Điều kiện từ chối giữ theo Q-24. Số frame, thời gian thu và thời gian phản hồi tiếp tục được xuất bằng các cột đã có.

Sau Bắt đầu ký, tiêu điểm chuyển tới vùng điều khiển mà không cuộn trang. Nhấn phím cách để Xong câu, hoặc dùng nút Xong câu. Phím tắt chỉ hoạt động trong lượt đang thu, bỏ qua phím lặp và ô nhập/nút thao tác khác. Nhờ người cùng nhóm nhấn phím cách khi xong giúp người ký giữ tay trong khung. Thử nội bộ chưa có VSL reference được người biết VSL xác minh vẫn ghi mức learning.

## Đọc thông báo sau suy luận — Q-29

Chuyển động tay chưa đủ rõ nghĩa là guard đã từ chối trước decoder. Điểm nhận diện chưa đạt ngưỡng nghĩa là model đã chạy nhưng điểm token dưới0,7. Đầu ra nhận diện chưa khớp câu được hỗ trợ nghĩa là câu model tạo ra chưa khớp allowlist. Dòng cuối chưa xác định người ký thực hiện đúng hay sai. Khi cần chẩn lỗi, ghi nguyên dòng hướng dẫn sau lượt thử. CSV vẫn ghi UNKNOWN/unknown để tương thích định dạng hiện có; hướng dẫn cụ thể chỉ nằm trong UI. Kết quả của phiên trước khi sửa API giữ theo snapshot profile cũ.

## Khi webcam có hình nhưng bộ nhận diện chưa mở được

Lỗi “Không thể mở nhận diện” thuộc bước nạp detector. Bấm Thử lại nhận diện để tạo lại detector và webcam. Lần khởi tạo bị hủy được dọn trước khi bắt đầu lần mới; không chấp nhận kết quả cũ sau đóng màn hình. Sau bản sửa khởi tạo, tải lại tab một lần để bỏ runtime WASM đang lỗi từ bản trước. Khi chỉ lỗi quyền hoặc thiết bị camera, giao diện giữ nút Bật lại Camera và hướng dẫn quyền truy cập.
