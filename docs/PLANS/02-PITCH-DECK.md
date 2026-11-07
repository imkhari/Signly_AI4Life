# DÀN Ý SLIDE THUYẾT TRÌNH AI4CARE (Cuộc thi AI4Life - 5 phút)

## Slide 1: Bìa & Khởi động (30 giây)
- **Tên dự án:** AI4Care — Trợ lý Tiếp nhận Đa phương thức cho Người Điếc và Khó khăn về Lời nói tại Bệnh viện.
- **Slogan:** *"Xóa bỏ rào cản giao tiếp đầu tiên tại quầy tiếp nhận y tế bằng AI nhân văn & an toàn."*
- **Đội thi:** [Tên nhóm 3 người] — Cuộc thi AI4Life.
- **Điểm nhấn:** Multimodal Intake (Touch, VSL Sign Language, Natural TTS, Voice-ready) · Privacy-by-Design · Zero Hallucination Guardrails.

---

## Slide 2: Nỗi đau & Bối cảnh thực tế (45 giây)
- **Số liệu:** Việt Nam có hơn **2.5 triệu người khuyết tật thính giác và ngôn ngữ**.
- **Thực trạng tại bệnh viện:**
  - Quầy sàng lọc/tiếp nhận luôn quá tải, ồn ào; điều dưỡng không biết Ngôn ngữ ký hiệu Việt Nam (VSL).
  - Người Điếc gặp khó khăn trong đọc viết tiếng Việt (vốn từ ngữ y tế trừu tượng); viết giấy tốn thời gian, dễ hiểu nhầm.
  - Thiếu hụt trầm trọng phiên dịch viên chuyên nghiệp (VRI).
- **Hậu quả:** Sai sót trong phân loại bệnh ban đầu, chậm trễ cấp cứu, tạo tâm lý sợ hãi khi đi khám bệnh.

---

## Slide 3: Giải pháp AI4Care (60 giây)
- **Mô hình tiếp nhận 2 chiều đồng bộ thời gian thực:**
  1. **Phía Bệnh nhân (Kiosk thông minh):**
     - Đa phương thức: Chạm trực quan (Body Map SVG + Pain Slider Wong-Baker) hoặc Ký hiệu VSL qua Camera (On-device Vision).
     - Giọng đọc tự nhiên (TTS) chuẩn hóa số liệu tiếng Việt kèm phụ đề trực quan tương phản cao.
  2. **Phía Điều dưỡng (Bảng điều khiển Live):**
     - Cập nhật từng thao tác của bệnh nhân theo thời gian thực (WebSocket < 20ms).
     - Tự động phát hiện xung đột và cảnh báo đỏ (Red-flag/Allergy conflict rule engine).
     - Đặt câu hỏi bổ sung 1 chạm, điều phối phiên dịch VRI khi có nghi ngờ.
  3. **Xác nhận 2 chiều (Two-way Verification):** Chỉ duyệt khi cả bệnh nhân và điều dưỡng đồng thuận.

---

## Slide 4: Kiến trúc Công nghệ & Ranh giới An toàn Y tế (60 giây)
- **Công nghệ cốt lõi:**
  - FastAPI (Backend) + WebSocket Event Replay Buffer + Vite React & TailwindCSS (Frontend).
  - LLM Orchestration (Gemini 1.5 Flash / Fallback Engine) + Rule-based Deterministic Parser.
  - On-device VSL Gloss Recognition (bảo mật luồng video nội bộ trình duyệt).
- **3 Ranh giới an toàn tuyệt đối:**
  1. **KHÔNG Chẩn đoán / KHÔNG Kê đơn:** Chỉ chuẩn hóa triệu chứng thành Semantic Frame.
  2. **Fail-Safe Post-LLM Validator (V1–V8):** Bắt 100% từ khóa chẩn đoán/thuốc/liều; Timeout 4s tự động chuyển sang Mẫu dự phòng cố định.
  3. **Privacy-by-Design (Nghị định 13/2023/NĐ-CP):** Không lưu Database lâu dài (RAM-only session); ẩn danh hoàn toàn (Zero PII); Xóa sạch 100% sau phiên.

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
  - Giảm thời gian tiếp nhận từ 10–15 phút xuống dưới 2 phút.
  - Đảm bảo bình đẳng y tế cho cộng đồng người Điếc và yếu thế.
- **Lộ trình tương lai (Post-MVP):**
  - Mở rộng tập từ vựng VSL (Bắc - Trung - Nam) qua hợp tác với Hội Người Điếc Việt Nam.
  - Tích hợp chuẩn FHIR/HL7 kết nối trực tiếp hệ thống HIS/EMR của bệnh viện.
  - Kết nối cổng phiên dịch VRI từ xa (Video Remote Interpreting) khi gặp ca bệnh phức tạp.

---

## Slide 7: Lời cảm ơn & Q&A
- **Thông điệp kết luận:** *"AI4Care — Công nghệ vì sự sống, đưa tiếng nói của người yếu thế đến trái tim y tế."*
- **Sẵn sàng trả lời câu hỏi của Ban Giám khảo!**
