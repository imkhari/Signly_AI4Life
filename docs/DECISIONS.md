# DECISIONS (ADR rút gọn)

Định dạng: `D-xxx · ngày · quyết định · lý do · trạng thái (FINAL | PROVISIONAL)`. `PROVISIONAL` = đang dùng mặc định chờ chủ dự án xác nhận (xem `OPEN-QUESTIONS.md`).

| ID | Ngày | Quyết định | Lý do | Trạng thái |
|---|---|---|---|---|
| D-001 | 2026-11-07 | `AGENTS.md` là điểm vào duy nhất; các file khác chỉ trỏ về nó | Tránh lệch nội dung giữa các công cụ AI (Q-01) | FINAL |
| D-002 | 2026-11-07 | Web app responsive, không làm app native trong MVP | Một codebase, dễ demo trên tablet/kiosk (Q-04) | FINAL |
| D-003 | 2026-11-07 | Không dùng database; dữ liệu trong RAM theo phiên | Privacy-by-design, đơn giản | FINAL |
| D-004 | 2026-11-07 | Phiên bản cố định tại P1: FastAPI 0.162, Pydantic 2.14, Uvicorn 0.54, Pytest 9.2, Ruff 0.17, Mypy 2.4; React 18.3, Vite 5.4, Tailwind 3.4.14, TS 5.6, Vitest 2.1 | Ổn định, khóa lockfile, không nâng version giữa chừng | FINAL |
| D-005 | 2026-11-07 | LLM luôn sau `LLMClient` interface; mặc định demo = mock có kịch bản | Demo không phụ thuộc mạng, có nút ép fallback (Q-08) | FINAL |
| D-006 | 2026-11-07 | "STT" = số thứ tự (`queue_number: int`) | Ghi chú tay "(số TT, mã, triệu chứng)", tránh nhầm STT=voice (Q-02) | FINAL |
| D-007 | 2026-11-07 | `null` ≠ `false` trong Semantic Frame | An toàn: chưa biết ≠ đã trả lời không | FINAL |
| D-008 | 2026-11-07 | Camera VSL: mock-first, chỉ gloss rời rạc (≤ 15 từ) | Rủi ro thời gian và hiệu năng; MediaPipe làm sau nếu kịp (Q-05) | FINAL |
| D-009 | 2026-11-07 | Xuất hồ sơ bằng `window.print()` phía client (in/PDF) | Không lưu server, không thêm dependency (Q-03) | FINAL |
| D-010 | 2026-11-07 | State FE: `useReducer` + Context, không Redux/Zustand | Đủ dùng, ít phụ thuộc | FINAL |
| D-011 | 2026-11-07 | Backend dùng `uv` trên CI và ưu tiên `uv` cục bộ; tự động fallback `venv + pip` | Tối ưu tốc độ cài đặt và tương thích mọi môi trường dev (Q-04) | FINAL |
| D-012 | 2026-11-07 | Tuyệt đối không lưu hoặc xuất thông tin định danh (PII) trên phiếu | Bảo vệ quyền riêng tư người bệnh; chỉ in STT, mã AC-xxxx, triệu chứng, cảnh báo (Q-14) | FINAL |
| D-013 | 2026-11-07 | Chuẩn hóa trạng thái phiên: `collecting` (thay vì `draft`), `needs_edit` | Đồng nhất giữa API Contract, WebSocket và TriageSummary model | FINAL |
| D-014 | 2026-11-08 | Mở rộng danh mục từ vựng VSL lên 46 gloss nguyên tử (thêm 7 từ tự nhiên: `VAI`, `RĂNG`, `MẮT`, `TAI`, `TIM-ĐẬP-NHANH`, `NGỨA`, `LẠNH`) | Tăng độ phong phú cho bài test/demo y tế, đồng bộ 100% giữa dataset, ontology và frontend | FINAL |
| D-015 | 2026-11-08 | Phân tầng nhận diện VSL Spatial Zoning: ưu tiên vùng tiếp xúc giải phẫu trước số đếm; giữ Mock cho `/demo` và CI | Chống tình trạng cử chỉ số cướp hết các cử chỉ triệu chứng, bảo toàn phương án dự phòng khi demo | FINAL |
| D-016 | 2026-11-08 | Mở rộng danh mục từ vựng VSL lên 60 gloss y tế nguyên tử (+14 gloss: `CHẢY-MÁU`, `CHẤN-THƯƠNG`, `BỎNG`, `TIÊU-CHẢY`, `HO-RA-MÁU`, `GÁY`, `ĐẦU-GỐI`, `CỔ-TAY`, `HÔNG`, `MÔNG`, `LIÊN-TỤC`, `TỪNG-CƠN`, `VỪA-MỚI`, `KHÁM`) | Đáp ứng đầy đủ các tình huống tiếp nhận cấp cứu và khám bệnh thường gặp; phân bổ 5 nhóm chuẩn hóa, đồng bộ 1-1 backend, ontology, dataset và frontend | FINAL |

| D-017 | 2026-11-19 | Luồng thi chính dùng Chạm + LLM mock, camera tùy chọn và yêu cầu phiên dịch mô phỏng | Phạm vi được người dùng chốt trong yêu cầu hoàn thiện demo | FINAL |
| D-018 | 2026-11-19 | MediaPipe xử lý ảnh trong trình duyệt, camera tùy chọn gửi tọa độ bàn tay tới backend LAN | Chủ dự án xác nhận Q-16, đồng bộ docs/07 với triển khai | FINAL |

| D-019 | 2026-11-19 | Ưu tiên thứ tự công việc theo mức ảnh hưởng vì thời gian gấp, đánh giá với người thử nội bộ, camera còn chờ dữ liệu người ký hợp lệ | Chủ dự án trả lời Q-17, Q-18, Q-19. Ngày thi cụ thể chưa có, dữ liệu thử nội bộ được ghi đúng phạm vi | FINAL |

| D-020 | 2026-11-19 | Triển khai B0+B1 dùng schema 1.0, kiểm điều kiện duyệt tại backend, khóa chỉnh sau duyệt, câu hỏi dị ứng tương quan và phiếu trực quan | Chủ dự án duyệt Q-20. B2 tri-state từng triệu chứng và revision để ở bước phát triển tiếp | FINAL |
| D-021 | 2026-11-19 | Triển khai Gói C theo mục 6: kiểm kê, công cụ và báo cáo tổng hợp; đánh giá VSL theo người ký vẫn chờ dữ liệu hợp lệ | Chủ dự án yêu cầu làm Gói C; Q-19 xác nhận chưa có dữ liệu. Không thêm model/thư viện hay thu dữ liệu nghiên cứu. Camera tiếp tục tùy chọn theo D-017 | FINAL |
| D-022 | 2026-11-19 | Fetch repo AI4Life vào ref/nhánh riêng và tìm nguồn dữ liệu công khai để đề xuất tự train | Chủ dự án yêu cầu lấy commit và trả lời Q-21. Mới cho phép tìm/đề xuất; thư viện và chạy train cụ thể chờ Q-22 | FINAL |
| D-023 | 2026-11-19 | Huấn luyện TinyTemporalCTC riêng bằng PyTorch/NumPy, dùng landmark VSL-GH theo manifest, smoke trước train đủ và đánh giá; chưa tích hợp app | Chủ dự án duyệt Q-22. Môi trường riêng, không tự kích hoạt torch trong backend demo | FINAL |
| D-024 | 2026-11-19 | Ưu tiên V2 greedy và tích hợp camera holistic thử nghiệm; 411 tọa độ thân/mặt/tay gửi LAN, không video/lưu; allowlist theo ngữ cảnh và xác nhận; review docs07 + tests thay skill thiếu | Chủ dự án cung cấp V2, yêu cầu chọn dùng/dọn thử nghiệm và duyệt Q-23. Chạm vẫn là luồng thi chính; không sử dụng CTC 374 lớp khi chưa xác minh vocab | FINAL |
| D-025 | 2026-11-19 | Capture theo câu với Bắt đầu ký/Xong câu; từ chối vượt giới hạn, đứt tracking/mất vai; trang thử nội bộ chỉ lưu kết quả rời rạc và timing | Chủ dự án duyệt Q-24 sau khuyến nghị dựa trên probe prefix/mất pose; không đổi weights, allowlist, điểm0,7 hoặc guard y tế | FINAL |
| D-026 | 2026-11-19 | Tiêu chí thử nội bộ Q-25; cohort nội bộ chưa biết VSL, không coi là kiểm chứng VSL | Chủ dự án duyệt Q-25 và trả lời Q-26. Phân P01/P02 phát triển và P03 cuối; sốt giữ ca lỗi bắt buộc; tiêu chí là mục tiêu engineering mẫu nhỏ | FINAL |

| D-027 | 2026-11-19 | Hoàn thiện UI P9 và tạo bộ slide theo template AI4Life +3facefont đã tải; giữ model/contract/safety, dùng Chạm và LLM mock, Q-11 vẫn3phút+2phútQ&A | Chủ dự án yêu cầu thực hiện prompt UI+slide. Thêm bản7phút và phụ lục là phương án chuẩn bị, không thay thời lượng đã chốt | FINAL |
| D-028 | 2026-11-19 | Tiếp tục V2 theo câu; camera mở đầu tạo một phiếu gợi ý nhiều trường, người bệnh đồng ý trước khi ghi; giữ SemFrame1.0, model/guard và xác nhận toàn phiếu | Chủ dự án chọn V2 theo hướng phù hợp model (Q-27); phạm vi kế hoạch14, chưa train isolated hoặc sửa phân luồng lâm sàng | FINAL |
