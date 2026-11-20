# Camera V2 — runtime thử nghiệm

Được chủ dự án duyệt Q-23. Camera mới dùng **mô hình học sâu V2**, không dùng luật hình học để chọn nhãn. Video xử lý tại trình duyệt; chuỗi 411 tọa độ thân/mặt/tay gửi trong LAN. Chỉ các câu trong allowlist được gợi ý theo ngữ cảnh, context intake (Q-27) gợi ý cả lý do và thông tin đau liên quan, bệnh nhân bấm Dùng thông tin này rồi bổ sung Chạm và xác nhận toàn phiếu. Context symptom/location cũ giữ Nhận → Áp dụng. Mức đau/thời gian dùng Chạm. Không chẩn đoán hay tự ghi câu dịch vào hồ sơ.

## Chạy trên máy này

```bash
make check-v2
make demo
```

Máy này đã có checkpoint compact `AI_model/checkpoints/vsl_v2.pt` và môi trường `AI_model/runtime/.venv`. Không cài Torch vào `backend/.venv`. Backend gọi worker riêng qua stdin/stdout JSON; worker nạp model lần đầu có thể mất vài giây. Thiếu runtime/checkpoint, câu ngoài allowlist hoặc lỗi → UNKNOWN; không fallback sang heuristic hay câu mẫu theo filename.

Trên máy mới:

```bash
make setup
make setup-v2
AI_model/runtime/.venv/bin/python -m AI_model.vsl_v2.package \
  --source VSL_Checkpoints_v2/checkpoint_best.pt
make check-v2
make demo
```

Lock được kiểm trên Python 3.15.2/ARM64. Máy khác cần wheel tương thích; không tự nâng/hạ phiên bản lock để sửa lỗi. Không commit weights hoặc thư mục V2 gốc. Package command yêu cầu nguồn đúng SHA256, output mới tên `vsl_v2.pt`, không ghi đè, bỏ optimizer và kiểm SHA256 compact khớp manifest. Đã kiểm đóng gói lại cho hash giống hệt. Giữ bundle gốc để truy vết, không cần nó khi chạy app.

`GET /api/vsl/status`: xem `primary_camera_engine`, `v2_runtime_available`, `v2_worker_ready`; các field cũ được ghi rõ chỉ mô tả client `hands` cũ. `60` là danh mục chung của ontology. Điểm token chưa hiệu chỉnh, không hiển thị thành xác suất nhận đúng.

## Kiến trúc và nguồn

`model-manifest.json` ghi hash nguồn/runtime, epoch72, norm_version2, input822 (411 tọa độ chuẩn hóa + vận tốc), encoder4/decoder3, hidden256, attention8, FFN1024. Loader nạp weights_only và strict state. Config train gốc chưa được gửi; nhead8 và normalization vai9/10 được xác minh bằng **tái hiện 300/300 output greedy** trong bundle.

Mã kiến trúc và danh mục từ tiếng Việt từ [VSL-GH commit 6c351e6](https://github.com/nguyentheanh822/Vietnamese-Sign-Language-Translation/tree/6c351e63c0b2cf1b5e2e8056bb3bf2d6f31dc90a), MIT, giữ `vendor/LICENSE`. `translation-vocabulary.json` chứa đúng thứ tự 442 token đã xác minh hành vi. **Không dùng CTC374 để xuất gloss** vì chưa có class order tương ứng được xác minh. Vocab gloss232 của nguồn công khai không được tráo vào head374.

Các chỉ số pose25/face70/hands21+21 theo `source/extract_keypoints.py` của cùng nguồn. Resize toàn bộ khung hình về360×360 theo source extractor đã pin, không center-crop hoặc lật input; preview giữ tỷ lệ video và lật gương. Theo Q-32, camera thử đã chuyển sang Holistic Web legacy0.5.1675471629 sau phép so sánh một video công khai. Tác động trên webcam thật vẫn cần đánh giá.

Asset Tasks được giữ để đối chiếu, lấy từ [model MediaPipe chính thức](https://storage.googleapis.com/mediapipe-models/holistic_landmarker/holistic_landmarker/float16/1/holistic_landmarker.task), cùng package `@mediapipe/tasks-vision` đã có. Xem [ví dụ chính thức](https://github.com/google-ai-edge/mediapipe-samples-web/blob/main/src/tasks/holistic-landmarker.ts). Nạp WASM và model từ server nội bộ, GPU lỗi thử CPU, không CDN. Hash asset ở `asset-manifest.json`.

## Bằng chứng chất lượng và giới hạn

`reports/greedy-replay.json` lưu từng dự đoán từ suy luận lại NPY, reference chỉ được dùng sau inference. 300/300 output giống bundle; **256/300 câu khớp reference (85,33%)**, WER từ cộng gộp **9,27%**, trung bình WER theo câu **10,695%**. Header accuracy85,667% trong bundle không khớp danh sách output. Median forward/decode20,87ms trên máy này **không gồm** MediaPipe, HTTP, buffer, chờ ổn định hoặc xác nhận. Beam4 kém hơn: 91/300 câu đúng, không dùng.

Hai ca sốt bị nhận thành ho/đau đầu. 65/300 reference khác annotation công khai, chưa biết phiên bản annotation train chính xác. Đây là tập câu đóng, một người ký test; chưa có đánh giá webcam, signer mới độc lập, hiệu chỉnh OOD, kiểm VSL/chuyên gia hoặc triển khai bệnh viện. Không quảng bá con số replay thành accuracy camera. Camera thi vẫn tùy chọn theo D-017; Chạm là luồng chính.

Q-24 chuyển camera sang Bắt đầu ký/Xong câu, một inference/câu rồi Nhận/Áp dụng; không nhận prefix hoặc lặp cùng clip. Guards chuyển động/tay hiện diện và điểm0,7 chỉ là ngưỡng kỹ thuật sơ bộ. Buffer tối đa6giây/180frame, ít nhất24frame/800ms, một HTTP đang chờ; mất tay/vai, gián đoạn>500ms, quá giới hạn hoặc đổi màn hình xóa buffer và hủy kết quả cũ. Request được nội suy gần30FPS, model không nhận filename/reference. `SESSION_RESET` kill worker, không giữ request cuối khi chờ. Triệu chứng chỉ được chuyển thành nhãn cố định trong `backend/app/ai/vsl_v2.py`.

## Tái lập replay

Dữ liệu tải tạm đã dọn (2,06GiB gồm môi trường train cũ). Nếu cần lại, clone nguồn VSL-GH đúng commit trên vào một thư mục riêng và lấy `data/keypoints/*_F.npy`, giữ LICENSE. Không chạy script tải về. Metadata nguồn SHA256 `d54f48cc8ea8a3df2644fec27567e3f7be4511d4ec867911e3a8c0b72537a380`; manifest các landmark và kiểm 4200 Git blobs đã lưu trong `AI_model/evaluation/reports/tiny-ctc-evidence/`. 2100 gloss annotation rỗng đã bị loại khi train Tiny, không được coi là nhãn blank hợp lệ.

```bash
AI_model/runtime/.venv/bin/python -m AI_model.vsl_v2.evaluate \
  --landmarks-root /path/to/vslgh/data/keypoints \
  --provided VSL_Checkpoints_v2/test_greedy_predictions.json \
  --output /tmp/v2-replay.json
```

Hai fixture NPZ nhỏ trong `tests/fixtures` là landmark nguồn công khai, tệp gốc ghi ở `source.json`, chịu MIT như nguồn. Chúng kiểm đúng một ca và giữ rõ một ca sai; không phải dữ liệu bệnh nhân. `make check-v2` kiểm checksum, normalization, replay, nghỉ tay và resampling. `make check` kiểm contract/mapping/lifecycle/luồng safety mà không cần Torch trong backend. E2E có ca dùng assets thật và khung hình trống tổng hợp, chặn mạng ngoài; không gọi đây là kiểm thử VSL người thật.

TinyTemporalCTC đã dừng. Báo cáo cuối/evidence giữ tại `AI_model/evaluation/reports/tiny-ctc-*`, checkpoint nhỏ `AI_model/checkpoints/archive/tiny_ctc_baseline.pt`. Mã train khôi phục từ Git `4e71f8d`, không dùng trong runtime.

## M0–M5 và thử trực tiếp

Sau guard mất vai, replay300clip có255câu đúng (85,00%),WER từ205/2157=9,50%,từ chối1clip SENT280.299output còn lại giống baseline; lỗi sốt vẫn còn. Xem `reports/post-guard-replay.json`. Đã chỉ tải lại300NPY (~50,6MiB), khớp hash từng file, không tải lại toàn bộ dataset. Đây là dữ liệu đã mở, không độc lập và không có capture web.

`make prepare-vsl-validation`, mở `/vsl-validation` và làm theo `docs/validation/vsl-v2/README.md`. Có CSV rời rạc và CLI `trials.py`, snapshot cấu hình theo hash; không nhận tọa độ trong CSV. Các kết quả tổng hợp và bản candidate tại RESULTS.md/FREEZE.md. Batch webcam kỹ thuật profile7537ba3f có5lượt đau ngực,0đúng/1nhầm Sốt/4từ chối, giữ ở baselines/. Bản xuất mới thêm mã Q-29 và chưa có lượt mới; chưa hiệu chỉnh ngưỡng hoặc đóng băng chất lượng; không train lại khi chưa có căn cứ và dữ liệu phù hợp.

Tái lấy đúng300NPY test, kiểm hash và không tải video:

```bash
backend/.venv/bin/python -m AI_model.vsl_v2.fetch_test_subset --output /tmp/vsl-v2-300
```

`pipeline-after.json` kiểm8câu thuộc allowlist qua worker với timestamp giả định30FPS; không thay thế video có FPS đã xác minh hoặc camera thật.

Camera hiện tại dùng JS/WASM/model từ frontend/public/models/holistic-legacy, pin @mediapipe/holistic0.5.1675471629 theo Q-32. asset-manifest.json ghi legacy_files và checksum. Cấu hình, số liệu và giới hạn phép đo tại docs/validation/vsl-v2/EXTRACTOR-COMPARISON.md.

## Kiểm chứng phần còn lại — Q-33

Đợt20/11/2026 có4NPY ghim hash,17biến thể/mẫu, tái lập so3extractor trên cùng110ảnh và kiểm HTTP thật. Q-33 chặn hoàn toàn thiếu face70 trước decoder, intake trả face_not_tracked; không đổi checkpoint/điểm/normalization và không chặn mất mặt tạm thời. Báo cáo/bảng bằng chứng tại docs/validation/vsl-v2/READINESS-REVIEW.md. Batch webcam đau ngực0/5đúng vẫn giữ; chưa chứng minh cải thiện webcam. Chưa có mẫu ký trọn câu được xác minh, chưa đạt Q-25.

fetch_test_subset nay hỗ trợ --clip lặp để tải đúng4mẫu thay vì toàn300; chỉ nhận ID trong replay đã ghim và kiểm SHA256. robustness.py chỉ nhận4ID định trước, không nhận dữ liệu người dùng, không ghi raw tọa độ hoặc decoder; report cũ không ghi đè. Đây là công cụ chẩn độ nhạy, không phải benchmark accuracy.
