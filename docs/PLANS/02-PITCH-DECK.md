# DÀN Ý SLIDE THUYẾT TRÌNH AI4CARE (Cuộc thi AI4Life - 3 phút demo + 2 phút Q&A)

> **BẢN CŨ — chỉ tham khảo.** Không dùng các nhận định về quá tải, tác động y tế, camera theo luật hoặc hiệu quả chưa đo ở dưới làm bằng chứng. Deck hiện tại dùng V2 tùy chọn, LLM mock và nguồn kiểm chứng tại `artifacts/ai4life/EVIDENCE.md`; xem `artifacts/ai4life/README.md` để mở file.

## Slide 1: Bìa & Khởi động (30 giây)
- **Tên dự án:** AI4Care — Trợ lý Tiếp nhận Đa phương thức cho Người Điếc và Khó khăn về Lời nói tại Bệnh viện.
- **Slogan:** *"Xóa bỏ rào cản giao tiếp đầu tiên tại quầy tiếp nhận y tế bằng AI nhân văn & an toàn."*
- **Đội thi:** [Tên nhóm 3 người] — Cuộc thi AI4Life.
- **Điểm nhấn:** Chạm, TTS và camera gợi ý cử chỉ tùy chọn · Privacy-by-Design · Validator và mẫu dự phòng.

---

## Slide 2: Nỗi đau & Bối cảnh thực tế (45 giây)
- **Số liệu:** Chờ bổ sung nguồn và phạm vi thống kê trước khi đưa số liệu vào slide.
- **Thực trạng tại bệnh viện:**
  - Quầy sàng lọc/tiếp nhận luôn quá tải, ồn ào; điều dưỡng không biết Ngôn ngữ ký hiệu Việt Nam (VSL).
  - Người Điếc gặp khó khăn trong đọc viết tiếng Việt (vốn từ ngữ y tế trừu tượng); viết giấy tốn thời gian, dễ hiểu nhầm.
  - Thiếu hụt trầm trọng phiên dịch viên chuyên nghiệp (VRI).
- **Hậu quả:** Sai sót trong phân loại bệnh ban đầu, chậm trễ cấp cứu, tạo tâm lý sợ hãi khi đi khám bệnh.

---

## Slide 3: Giải pháp AI4Care (60 giây)
- **Mô hình tiếp nhận 2 chiều đồng bộ thời gian thực:**
  1. **Phía Bệnh nhân (Kiosk thông minh):**
     - Đa phương thức: Chạm trực quan (Body Map SVG + thang mức đau 0–10) hoặc gợi ý cử chỉ camera (MediaPipe trình duyệt, luật tại backend LAN).
     - Giọng đọc tự nhiên (TTS) chuẩn hóa số liệu tiếng Việt kèm phụ đề trực quan tương phản cao.
  2. **Phía Điều dưỡng (Bảng điều khiển Live):**
     - Cập nhật từng thao tác của bệnh nhân theo thời gian thực (WebSocket, dùng số đo localhost/LAN đã kiểm tra).
     - Tự động phát hiện xung đột và cảnh báo đỏ (Red-flag/Allergy conflict rule engine).
     - Đặt câu hỏi bổ sung 1 chạm, mô phỏng yêu cầu phiên dịch khi cần hỗ trợ.
  3. **Xác nhận 2 chiều (Two-way Verification):** Chỉ duyệt khi cả bệnh nhân và điều dưỡng đồng thuận.

---

## Slide 4: Kiến trúc Công nghệ & Ranh giới An toàn Y tế (60 giây)
- **Công nghệ cốt lõi:**
  - FastAPI (Backend) + WebSocket Event Replay Buffer + Vite React & TailwindCSS (Frontend).
  - LLM Orchestration (mock trong buổi thi / mẫu cố định) + Rule-based Deterministic Parser.
  - MediaPipe giữ ảnh/video tại trình duyệt, tọa độ bàn tay gửi backend LAN theo Q-16.
- **3 Ranh giới an toàn tuyệt đối:**
  1. **KHÔNG Chẩn đoán / KHÔNG Kê đơn:** Chỉ chuẩn hóa triệu chứng thành Semantic Frame.
  2. **Fail-Safe Post-LLM Validator (V1–V8):** Kiểm tra đầu ra bằng bộ luật; lỗi hoặc timeout có mẫu cố định. Báo kết quả của bộ test đã chạy.
  3. **Quản lý dữ liệu phiên:** Kho phiên backend trong RAM, xóa khi kết thúc. Rà soát payload LLM và phiếu xuất theo guardrails.

---

## Slide 5: Live Demo Trải nghiệm 2 Chiều (90 giây)
- *Trình diễn trực tiếp trên 2 màn hình (Kiosk Bệnh nhân & Màn hình Y tá):*
  - **Tình huống:** Bệnh nhân Điếc đau ngực cấp 7/10 $\rightarrow$ Thao tác trên Body Map $\rightarrow$ Y tá nhận dữ liệu live.
  - **Tình huống an toàn:** Phát hiện mâu thuẫn dị ứng thuốc $\rightarrow$ Cảnh báo chuông + thẻ đỏ.
  - **Tình huống Fail-Safe:** Ép Fallback LLM $\rightarrow$ Hệ thống vẫn mượt mà chuyển mẫu dự phòng với huy hiệu minh bạch nguồn tin.
  - **Kết thúc:** Duyệt phiếu $\rightarrow$ Cấp số thứ tự (STT) siêu to $\rightarrow$ Xuất hồ sơ chuẩn y tế không PII $\rightarrow$ Reset xóa sạch phiên.

---

## Slide 6: Tác động Xã hội & Lộ trình Tương lai (45 giây)
- **Tác động xã hội:**
  - Giảm thời gian tiếp nhận từ 10–13 phút demo + 2 phút Q&A xuống dưới 2 phút.
  - Đảm bảo bình đẳng y tế cho cộng đồng người Điếc và yếu thế.
- **Lộ trình tương lai (Post-MVP):**
  - Mở rộng tập từ vựng VSL (Bắc - Trung - Nam) qua hợp tác với Hội Người Điếc Việt Nam.
  - Tích hợp chuẩn FHIR/HL7 kết nối trực tiếp hệ thống HIS/EMR của bệnh viện.
  - Kết nối cổng phiên dịch VRI từ xa (Video Remote Interpreting) khi gặp ca bệnh phức tạp.

---

## Slide 7: Lời cảm ơn & Q&A
- **Thông điệp kết luận:** *"AI4Care — Công nghệ vì sự sống, đưa tiếng nói của người yếu thế đến trái tim y tế."*
- **Sẵn sàng trả lời câu hỏi của Ban Giám khảo!**

