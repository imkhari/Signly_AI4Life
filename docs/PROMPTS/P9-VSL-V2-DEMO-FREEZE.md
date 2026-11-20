# Prompt — Kiểm chứng và chốt camera V2 cho bản thi

Mục tiêu: hoàn tất phần kỹ thuật và tạo bằng chứng để quyết định phạm vi AI có thể trình diễn, trước khi đóng gói web app và hồ sơ. Trạng thái: tài liệu hướng dẫn; việc thử người thật và đóng băng model sẽ được thực hiện ở bước sau.

Cách dùng: mở chat trong repo, yêu cầu đọc file này và thực hiện lần lượt M0–M5. Agent làm các phần độc lập đã được phép, chuẩn bị đầy đủ công cụ trước khi cần nhóm tham gia thử camera.

## PROMPT

```text
Bạn đang làm việc trong repo Signly / AI4Care, sản phẩm dự thi AI4Life tại VKU.

MỤC TIÊU

Chốt một phiên bản camera AI có phạm vi, cấu hình, kết quả kiểm tra và giới hạn rõ ràng để nhóm tập demo. Ưu tiên kiểm chứng V2 hiện có, sửa lỗi có bằng chứng và đóng băng phiên bản. Sau mốc này mới chuyển sang hoàn thiện web app, báo cáo và slide.

Yêu cầu hiện tại tập trung vào nhánh AI. Chỉ sửa frontend/backend khi cần để đầu vào camera, nhận diện, đo lường, xác nhận và reset hoạt động đúng. Giữ luồng tiếp nhận B0/B1 đã hoàn thiện.

ĐỌC TRƯỚC VÀ CÁCH LÀM

1. Đọc AGENTS.md trước mọi thao tác; sau đó git status, docs/99-PROGRESS-LOG.md, OPEN-QUESTIONS.md, DECISIONS.md.
2. Đọc docs/02,03,05,06,07,08; docs/PLANS/11-VSL-V2-REVIEW-AND-ADOPTION.md; AI_model/vsl_v2/README.md, model-manifest.json và các báo cáo V2. Đọc kế hoạch 06 như lịch sử baseline, không áp request tay cũ vào camera holistic mới.
3. Kiểm tra mã thực tế: HolisticDetector.ts, VSLCameraView.tsx, GestureStabilizer.ts, useCamera.ts, REST client, backend/app/api/rest/vsl.py, backend/app/ai/vsl_v2.py, AI_model/vsl_v2/{engine,worker,evaluate,package}.py và tests liên quan.
4. Nêu kế hoạch tối đa 10 dòng trước khi viết code. Giữ thay đổi của người dùng. Không tạo thêm agent nếu chưa có chỉ dẫn cho phép.
5. Tận dụng các duyệt đã có: Q-23 cho phép camera holistic411 qua LAN, không lưu video/landmark phiên, allowlist và Nhận/Sửa; review checklist docs07 + tests thay skill safety-review bị thiếu. Torch/NumPy ở runtime riêng đã được duyệt. Không hỏi lại các quyết định này.
6. Theo AGENTS.md khi có tác động mới tới contract, safety, quyền riêng tư hoặc dependency: hoàn tất kiểm kê và đề xuất cụ thể có bằng chứng trước khi xin chốt; tiếp tục việc độc lập được phép. Đặc biệt, triển khai thay ngưỡng nhận/từ chối hoặc phạm vi allowlist cần rà tác động safety, không coi Q-23 là duyệt mọi giá trị tương lai.
7. Không coi yêu cầu thực hiện prompt này là duyệt lưu video/landmark người thật, dùng cloud/GPU trả phí, thêm dependency hoặc train kiến trúc mới.

TRẠNG THÁI ĐÃ BIẾT — KIỂM TRA LẠI TRƯỚC KHI SỬA

- V2 đã tích hợp; checkpoint compact tại AI_model/checkpoints/vsl_v2.pt, runtime tại AI_model/runtime/.venv. Backend không cần cài torch.
- Camera: 411 tọa độ thân/mặt/hai tay, model nhận 822 đặc trưng sau chuẩn hóa và vận tốc. Norm2 dùng vai ở vị trí subset9/10. Chỉ dùng decoder tiếng Việt442 token; CTC374 thiếu class order xác minh nên không xuất gloss.
- Config train gốc chưa có; kiến trúc tương thích được xác minh bằng tái hiện300/300 output greedy. Nạp weights_only, checksum và strict state.
- Trong300 reference được cung cấp:256 câu khớp, WER từ cộng gộp9,27%. Không gọi đây là accuracy webcam. Hai mẫu sốt nhận thành ho/đau đầu;65 reference khác annotation công khai.
- Guard chuyển động, điểm0,7, cửa sổ6giây/180frame, nhịp gọi API và ổn định hiện tại là cấu hình kỹ thuật sơ bộ. Kiểm lại code thay vì mặc định chúng đã phù hợp với câu ký hiệu động.
- TinyCTC đã dừng và dọn cache/môi trường train; giữ bằng chứng và checkpoint nhỏ. Không dựng lại baseline hoặc tải lại toàn bộ dataset nếu không cần cho phép thử cụ thể.
- Kiểm tra gần nhất:138 backend,76 frontend,5 runtime,11 E2E và build qua. Đếm lại theo phiên bản đang làm; không dùng số cũ như kết quả mới.
- Chỉ có người thử nội bộ theo Q-18. Chưa có thử camera với người ký VSL mới, hiệu quả người dùng mục tiêu hay thẩm định bệnh viện.

RANH GIỚI BẮT BUỘC

- Chỉ hỗ trợ lời khai triệu chứng; không chẩn đoán, gợi bệnh, kê đơn hoặc tự bổ sung dữ kiện.
- Kết quả decoder phải qua allowlist toàn câu và ngữ cảnh. Không đẩy câu tự do vào SemanticFrame/LLM/UI bệnh nhân.
- Không suy “đau bụng” thành bụng trên, “đau lưng” thành lưng dưới; phủ định/đa ý chưa biểu diễn được phải từ chối.
- Mức đau và thời gian dùng Chạm. Gợi ý vẫn phải Nhận → Lưu/Áp dụng → bệnh nhân xác nhận toàn phiếu → điều dưỡng duyệt.
- Thiếu runtime, input lỗi, không rõ hoặc ngoài phạm vi → UNKNOWN và đường chuyển Chạm/nhân viên. Không fallback hình học hoặc đáp án mẫu cho request V2.
- Không có bảng tra đáp án theo filename, video_id, sent_key, người thử hoặc expected label trong đường suy luận. Reference chỉ đi vào bộ chấm sau inference.
- Camera/video chỉ trong trình duyệt; tọa độ tạm qua LAN. Không lưu video, ảnh, landmark, câu tự do, thông tin sức khỏe thật hay định danh của người thử. Không log payload; reset xóa buffer, hủy request cũ và kết thúc worker.
- Dữ liệu thử dùng ca giả lập, người tham gia tự nguyện. Chỉ lưu kết quả rời rạc/timing cần thiết, mã lượt/người/thiết bị không chứa định danh. Không tự truy cập webcam khi không có người tham gia thao tác.

M0 — KIỂM KÊ VÀ TẠO MỐC ĐỐI CHIẾU

1. Lập bảng đã có / thiếu bằng chứng / lỗi tái hiện / phần cần nhóm thực hiện. Với mỗi lỗi ghi file, cách tái hiện, tác động và ưu tiên.
2. Xác nhận hash checkpoint/vocab/task asset, dependency, engine thực và CTC bị tắt xuất gloss. Không sửa manifest để bỏ qua checksum lỗi.
3. Kiểm tra benchmark/provenance: đâu là annotation nguồn, đâu là reference V2, split theo signer đã biết đến đâu. Không trộn65 reference khác nhau hoặc coi tương thích output là xác minh dữ liệu train.
4. Chạy kiểm tra phù hợp để có baseline. Nếu weights/preprocessing không đổi và báo cáo300 mẫu có thể truy vết, dùng báo cáo có sẵn cùng fixture nhỏ thay vì tải lại1,3GB chỉ để chạy lại kết quả đã biết.
5. Tạo docs/PLANS/12-VSL-V2-DEMO-FREEZE.md, ghi mốc code/hash, phạm vi, việc cần làm và tiêu chí đạt còn cần chốt.

M1 — CHỐT PHẠM VI VÀ THIẾT KẾ PHÉP THỬ

1. Xuất danh sách allowlist thực tế: câu được nhận, nhãn triệu chứng/vị trí, ngữ cảnh, trường hợp từ chối. Tách danh mục ontology60 mục khỏi tập con V2 đang hỗ trợ.
2. Đề xuất tập nhỏ3–5 ý cho vòng đầu dựa trên bằng chứng. Không tự gọi mọi câu là đã hỗ trợ ổn định; không hướng dẫn động tác hình học cũ như ký hiệu VSL chuẩn.
3. Xác định đáp án từng lượt trước khi thử. Có thể dùng reference công khai cho replay; cách ký người thật cần người biết VSL kiểm tra. Người nội bộ bắt chước chỉ tạo bằng chứng thử kỹ thuật nội bộ.
4. Chuẩn bị protocol, phiếu ghi và mẫu kết quả trống trong docs/validation/vsl-v2/. Ưu tiên các file README.md, TRIALS.csv, RESULTS.md. Thích ứng bộ thử hiện có để tránh trùng công cụ.
5. Đề xuất khởi đầu khả thi:3 người nội bộ, mỗi ý5 lượt/người ở điều kiện chuẩn; một vòng riêng cho thiếu sáng/lệch góc/đổi khoảng cách. Ca âm gồm tay nghỉ, động tác thông thường, ngoài danh mục, mất mặt/tay và ra/vào khung; phân biệt đầu vào không hợp lệ với đầu vào hợp lệ nhưng ngoài danh mục. Đây là kế hoạch đề xuất, không phải số mẫu đã thu hoặc bảo đảm thống kê.
6. Chia lượt phát triển/chọn ngưỡng và lượt đánh giá cuối trước khi chỉnh. Tách người giữa các phần nếu đủ người; nếu không đủ, công bố việc lặp người và giới hạn. Chỉ gọi “người ký mới độc lập với train” khi có căn cứ về tập train.
7. Lập bảng tiêu chí thử bản thi trước khi xem kết quả cuối: nhầm nhãn, tỷ lệ từ chối, nhầm trên ca âm, độ trễ, số mẫu/ý và điều kiện thiết bị. Đề xuất có lý do; không tự đặt90%/95% rồi coi là tiêu chuẩn y tế hoặc tiêu chuẩn cuộc thi. Ghi rõ mục nào cần chủ dự án chốt.

M2 — KIỂM ĐƯỜNG CAMERA VÀ SỬA LỖI CÓ BẰNG CHỨNG

Kiểm lần lượt và viết regression test cho lỗi thực sự:

- Crop vuông, input không lật gương, preview lật gương; thứ tự pose25/face70/tay trái21/tay phải21, tổng411; vai9/10; nhóm thiếu bằng0; tọa độ hữu hạn.
- Timestamp tăng, tốc độ lấy frame thực tế, nội suy gần30FPS, chuẩn hóa vai và vận tốc khớp norm2; tránh velocity giả do mất tracking hoặc group xuất hiện/biến mất.
- Độ dài cửa sổ, phần bắt đầu/kết thúc câu, khoảng nghỉ, đổi sang câu kế tiếp. Kiểm mô hình học cả câu nhưng app đang dùng cửa sổ trượt: có cắt mất đầu/cuối, ghép hai ý hoặc tiếp tục gợi ý từ câu trước không?
- Kiểm bộ ổn định có dùng nhiều kết quả tương thích theo thời gian và xóa chứng cứ cũ khi gián đoạn; không đánh đồng nhiều lần chạy cùng một clip với nhiều mẫu nhận diện độc lập. Không ép người ký giữ yên nếu câu cần chuyển động.
- Chỉ một request đang chờ, không queue không giới hạn, không stale result sau đổi ngữ cảnh/mất tay/reset/unmount. Kiểm cấp quyền camera muộn và reset lúc worker đang khởi động.
- Đo riêng bước xử lý có thể đo được; không ghi video/landmark để debug. Telemetry chẩn đoán chỉ số lượng frame, duration, presence, timing và lý do từ chối, bật tạm có kiểm soát và không ghi raw input.
- Nếu cần thay cách bắt đầu/kết thúc câu, ngưỡng hoặc allowlist: mô tả lỗi, phương án, tác động API/UI/safety, chuẩn bị test/diff và tuân thủ bước chốt của AGENTS.md. Không mở rộng sang giao diện tổng thể.

Chạy test phù hợp sau sửa. Khi công cụ đã sẵn sàng, đưa hướng dẫn cụ thể để nhóm tự mở app, ghép mã, bật camera, làm từng lượt và ghi kết quả. Nêu chính xác phần agent không thể tự kiểm vì thiếu người ký/thiết bị. Không điền kết quả từ video tổng hợp, fixture hoặc trí nhớ.

M3 — THỬ TRỰC TIẾP VÀ BÁO KẾT QUẢ

1. Dùng đúng thiết bị/trình duyệt demo. Ghi mã thiết bị, điều kiện ánh sáng/khoảng cách/góc, chế độ cohort và thời gian thử. Dừng phiên/reset giữa các lượt theo protocol đã chốt.
2. Mỗi lượt có: trial_id, participant_code, cohort, split, intent_id, context, condition, expected_label hoặc UNKNOWN, displayed_candidate hoặc UNKNOWN, outcome, candidate_latency_ms và ghi chú lỗi theo danh mục. Không thu tên, raw câu tự do hoặc landmark. Việc xác nhận của bệnh nhân được chấm riêng với nhãn model.
3. Agent tự động hóa xử lý bảng kết quả hợp lệ; các thao tác người thật do nhóm thực hiện. Nếu chưa có lượt, giữ n=0 và đánh dấu pending.
4. Với N lượt dương, báo riêng: đúng/N, sai/N, từ chối/N. Báo precision của các gợi ý được chấp nhận với mẫu số thực và tỷ lệ có gợi ý; không loại lượt từ chối rồi gọi phần còn lại là accuracy toàn tập.
5. Với ca âm, báo số lượt xuất hiện gợi ý triệu chứng không phù hợp / tổng lượt âm, tách từng loại. Ghi cả gợi ý sai từng xuất hiện trước khi bị bỏ, không chỉ nhãn cuối đẹp nhất.
6. Đơn vị chính là câu/lượt thử, không đếm hàng trăm frame là hàng trăm người/mẫu độc lập. Báo confusion matrix theo nhãn, theo người và điều kiện; macro-F1 chỉ khi tập và cách xử lý UNKNOWN được định nghĩa rõ.
7. Đo thời gian từ mốc protocol đã định (bắt đầu/kết thúc ký) đến ứng viên hiển thị; ghi mốc đó. Phân biệt landmark, HTTP/model, ổn định, hiển thị và thời gian người xác nhận. Báo median/p95 nếu đủ mẫu, số lượng mẫu và lượt timeout/từ chối; không tự gán latency cho lượt không có ứng viên.
8. Tách replay tiếng Việt, nhận nhãn qua camera và hiệu quả tác vụ hai màn hình thành các báo cáo khác nhau. Không so WER gloss TinyCTC trực tiếp với WER từ của V2.

M4 — PHÂN TÍCH LỖI, HIỆU CHỈNH VÀ QUYẾT ĐỊNH TRAIN

1. Ưu tiên tái hiện sốt→ho/đau đầu, nhãn sai khi nghỉ tay, câu cũ lặp lại, thiếu đầu/cuối câu và khác biệt giữa extractor dataset với Holistic Tasks web.
2. Phân loại nguyên nhân: capture/preprocess; timing/segmentation; model; mapping; stabilization/UI. Chỉ sửa lớp có bằng chứng gây lỗi.
3. Hiệu chỉnh trên phần phát triển/validation. Giữ checkpoint và cấu hình cũ làm đối chiếu; báo trước/sau trên cùng protocol và giữ các ca thất bại.
4. Chạy đánh giá cuối sau khi khóa cấu hình. Nếu dùng kết quả cuối để tiếp tục chọn ngưỡng/loại câu thì tập đó đã thành dữ liệu phát triển; cần lượt cuối mới để gọi là kiểm chứng độc lập.
5. Điểm token chưa được hiệu chỉnh không được hiển thị thành xác suất đúng. Ngưỡng cao không tự chứng minh OOD an toàn. Ghi trade-off giữa nhầm nhãn và từ chối.
6. Nếu vẫn không đạt, đề xuất giảm phạm vi camera hoặc giữ thử nghiệm/Chạm theo D-017, kèm bằng chứng và tác động. Không chọn vài clip đẹp rồi công bố model đã ổn.
7. Chỉ đề xuất fine-tune/train V2 khi lỗi đã được xác định thuộc model và có dữ liệu/annotation hợp lệ đủ để làm. Trước khi train lại cần làm rõ65 reference lệch, dữ liệu/quyền, split, source/config/vocab và tài nguyên. Chuẩn bị plan riêng có thể duyệt; không tự khôi phục TinyCTC hoặc chế dữ liệu gán nhãn.

M5 — ĐÓNG BĂNG VÀ BÀN GIAO

Chuẩn bị docs/validation/vsl-v2/FREEZE.md hoặc tài liệu tương đương:

- Mốc code, hash checkpoint/vocab/assets, norm/preprocess version, dependency, cửa sổ/timing/ngưỡng và trạng thái CTC.
- Danh sách ý/ngữ cảnh được phép demo và cần Chạm; điều kiện camera; hướng dẫn bắt đầu/kết thúc câu; lỗi đã biết.
- Kết quả có n và mẫu số, cohort, split, điều kiện, nguồn reference và tiêu chí đạt đã chốt. Ghi rõ “chưa có” cho phần thiếu.
- Lệnh setup/check/run, runtime worker, kiểm nguồn model thực, reset và khôi phục khi lỗi; checkpoint/bundle gốc giữ nguyên.
- Trạng thái: CANDIDATE khi thiếu lượt/tiêu chí hoặc chưa đạt; FROZEN_FOR_INTERNAL_DEMO khi đạt phạm vi thử nội bộ đã chốt; chỉ ghi kiểm chứng người ký VSL mới khi đã thực hiện và có bằng chứng riêng. Không có trạng thái ngầm “đã sẵn sàng bệnh viện”.
- Tách công việc kỹ thuật đã hoàn tất khỏi chất lượng đã kiểm chứng. Không tự nâng % tiến độ vì đã viết công cụ; nếu thiếu người ký, chỉ rõ việc còn chờ và người cần thực hiện.

Chỉ đề xuất chuyển sang hoàn thiện web app và báo cáo khi có bản AI cố định, phạm vi trung thực, quyết định demo có bằng chứng và danh sách giới hạn. Khi thiếu điều kiện đánh giá, bàn giao bộ công cụ/hướng dẫn hoàn chỉnh với trạng thái pending; không tuyên bố đã khóa model đạt chất lượng.

KIỂM TRA VÀ TÀI LIỆU

- Chạy make check và make check-v2 trước khi báo xong/commit.
- Nếu chạm frontend: build, E2E phù hợp; nếu chạm UI: chụp và xem ảnh720/1024px. Nếu chạm API/domain/safety: đồng bộ docs02/03/07 và tests theo AGENTS.md.
- Thêm test cho bug thực: mapping phủ định/ngoài danh mục, thiếu runtime, timestamp/crop/normalization, reset/cancellation, Nhận/Áp dụng. Không dùng test fake camera làm bằng chứng ký hiệu người thật.
- Cập nhật progress log; cập nhật DECISIONS/OPEN-QUESTIONS cho quyết định mới thật sự đã được chốt. Commit nhỏ Conventional Commits sau kiểm tra qua; không commit weights, secret, dữ liệu người thử hoặc đẩy remote khi chưa được yêu cầu.
- Không tạo slide hoặc báo cáo nộp cuối trong gói này. Báo cáo đánh giá model và bản đóng băng là đầu ra cần thiết của gói AI.

BÁO CÁO CUỐI CHO CHỦ DỰ ÁN

1. Đã sửa/hoàn tất gì và model thực đang chạy là gì.
2. Bảng kết quả replay/live/ca âm, mỗi bảng đúng cohort và mẫu số; phần chưa đo ghi pending.
3. Lỗi chính còn lại, ý nào dùng được để demo theo bằng chứng, ý nào cần Chạm.
4. Quyết định giữ V2/sửa pipeline/đề xuất train lại và căn cứ.
5. Trạng thái đóng băng, liên kết tài liệu/lệnh chạy và phần nhóm cần làm trực tiếp.
6. Có đủ điều kiện chuyển sang hoàn thiện web app/báo cáo hay chưa, dựa trên các tiêu chí đã chốt.

Bắt đầu bằng M0 và M1, rồi thực hiện các phần M2–M5 không phụ thuộc thông tin/duyệt còn thiếu. Không kết thúc ở việc chỉ nêu kế hoạch nếu các công cụ, kiểm tra hoặc sửa lỗi đã được phép vẫn có thể hoàn tất.
```
