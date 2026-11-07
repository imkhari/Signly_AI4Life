# KỊCH BẢN LỜI THOẠI THUYẾT TRÌNH LIVE DEMO (3 PHÚT)
*Dành cho người nói (Speaker) và người thao tác màn hình (Demo Operator)*

---

### [0:00 – 0:25] MỞ ĐẦU: BÀI TOÁN & NỖI ĐAU THỰC TẾ
- **Người thao tác:** Mở sẵn 2 màn hình chia đôi: Bên trái `/patient` (Kiosk), Bên phải `/nurse` (Điều dưỡng).
- **Lời người nói:**
  > *"Kính thưa Ban Giám khảo, tại các bệnh viện Việt Nam, quầy tiếp nhận và sàng lọc luôn là nơi quá tải nhất. Với hơn 2.5 triệu người Điếc và người khó khăn về lời nói, đây thực sự là một cơn ác mộng: Điều dưỡng không biết ngôn ngữ ký hiệu, việc viết giấy thì chậm trễ và dễ gây hiểu nhầm thuật ngữ y tế, còn phiên dịch viên chuyên nghiệp thì cực kỳ khan hiếm.*
  > 
  > *Hôm nay, chúng tôi mang đến **AI4Care** — giải pháp trợ lý tiếp nhận đa phương thức hai chiều, giúp người Điếc giao tiếp tự chủ, chính xác và an toàn tuyệt đối ngay tại quầy tiếp nhận bệnh viện."*

---

### [0:25 – 1:10] BƯỚC 1: GHÉP CẶP & KHAI BÁO THỜI GIAN THỰC
- **Người thao tác:** 
  1. Chỉ vào góc trên màn hình Y tá: Đọc to mã ghép nối (ví dụ: `A3K9P2`).
  2. Bên Kiosk Bệnh nhân: Gõ mã 6 ký tự trên bàn phím cảm ứng ảo $\rightarrow$ Chấm xanh "Đã kết nối" sáng lên.
  3. Chọn phương thức: **"Chạm cảm ứng"**.
  4. Chạm vào **Ngực** trên Body Map SVG $\rightarrow$ Kéo mức đau **7/10** $\rightarrow$ Chọn **2 giờ trước**.
- **Lời người nói:**
  > *"Trước tiên, trạm Kiosk ghép nối trực tiếp với bàn làm việc điều dưỡng qua mã bảo mật phiên. Ngay khi bệnh nhân chạm vào vùng Ngực trên mô hình cơ thể và kéo mức đau 7/10, xin Ban Giám khảo chú ý màn hình bên phải của Điều dưỡng:*
  > 
  > *Dữ liệu nhảy sang **theo thời gian thực với độ trễ dưới 20 mili-giây** qua WebSocket. Điều dưỡng thấy ngay bệnh nhân đang khai gì ở trạng thái xám 'Đang nhập', hoàn toàn chủ động đón nhận thông tin mà không cần chờ bệnh nhân nộp phiếu."*

---

### [1:10 – 1:40] BƯỚC 2: KIỂM TOÁN AN TOÀN & BẮT XUNG ĐỘT (RULE ENGINE)
- **Người thao tác:** 
  1. Sang bước Dị ứng: Chọn nút **"Không dị ứng"**.
  2. Trong ô ghi chú gõ chữ: `penicillin`.
  3. Màn hình Y tá vang chuông cảnh báo + Thẻ đỏ nhấp nháy phát hiện mâu thuẫn.
  4. Người thao tác bấm "Đã ghi nhận" bên màn hình y tá.
- **Lời người nói:**
  > *"Một rủi ro y tế chết người là sự mâu thuẫn trong lời khai: Bệnh nhân bấm 'Không dị ứng', nhưng ở ô ghi chú lại nhập 'penicillin'.*
  > 
  > *Bộ Rule Engine độc lập của chúng tôi lập tức phát hiện xung đột Rule 10, phát chuông báo động và gắn cờ cảnh báo đỏ cho Điều dưỡng. Hệ thống tuân thủ nguyên tắc cốt lõi: **Không tự đoán khi mâu thuẫn**, mọi sự bất thường đều được giữ lại để nhân viên y tế kiểm tra."*

---

### [1:40 – 2:10] BƯỚC 3: GIỌNG ĐỌC TỰ NHIÊN & XÁC NHẬN 2 CHIỀU (TWO-WAY VERIFICATION)
- **Người thao tác:** 
  1. Bấm sang bước Xem tóm tắt.
  2. Bấm nút 🔊 **Nghe đọc** $\rightarrow$ Hệ thống đọc to: *"Bạn bị đau ở ngực, mức bảy trên mười, bắt đầu cách đây hai giờ..."*.
  3. Bệnh nhân bấm nút xanh to: **"Xác nhận thông tin đúng"**.
  4. Thẻ bên Y tá chuyển sang màu **XANH LÁ CÂY**.
- **Lời người nói:**
  > *"Tại bước tóm tắt, công nghệ Text-to-Speech tự nhiên hóa số liệu tiếng Việt đọc to kèm phụ đề trực quan cho người khiếm thính. Bệnh nhân bấm 'Xác nhận thông tin đúng'.*
  > 
  > *Ngay lập tức, thẻ dữ liệu bên điều dưỡng chuyển từ màu xám sang **Xanh lá cây**. Đây là cơ chế **Xác nhận 2 chiều** độc quyền: Nút duyệt phiếu của điều dưỡng chỉ được mở khóa khi cả bệnh nhân đã bấm xác nhận VÀ điều dưỡng đã xử lý hết các cảnh báo khẩn cấp."*

---

### [2:10 – 2:35] BƯỚC 4: DEMO AN TOÀN LLM & FAIL-SAFE GUARDRAILS
- **Người thao tác:** Mở tab `/demo`, bấm nút **"Ép Mẫu Dự Phòng (Force Fallback)"** $\rightarrow$ Quay lại màn hình Y tá chỉ vào huy hiệu nguồn: *"Mẫu cố định (Dự phòng)"*.
- **Lời người nói:**
  > *"Điểm khác biệt lớn nhất của AI4Care là tính **An toàn Y tế tuyệt đối**. Nếu mô hình AI gặp lỗi, mất mạng hoặc sinh ra câu chẩn đoán vi phạm quy tắc, bộ Post-LLM Validator với 8 luật độc lập sẽ chặn đứng và kích hoạt **Mẫu dự phòng cố định (Deterministic Fallback)** trong 4 giây. Điều dưỡng luôn biết rõ nguồn gốc văn bản qua huy hiệu minh bạch, đảm bảo zero ảo giác trong bệnh viện."*

---

### [2:35 – 3:00] BƯỚC 5: CẤP SỐ THỨ TỰ, XUẤT HỒ SƠ & BẢO MẬT RAM-ONLY
- **Người thao tác:** 
  1. Bên Y tá: Bấm **"Duyệt phiếu tiếp nhận ✔"**.
  2. Kiosk Bệnh nhân: Hiện **Số thứ tự khổng lồ (STT: 042)**.
  3. Bấm **"Xuất hồ sơ"** $\rightarrow$ Hiện bản in chuẩn 1 trang A4 (không có tên, SĐT, CCCD).
  4. Bấm **"Kết thúc phiên"** $\rightarrow$ Hai màn hình xóa sạch dữ liệu.
- **Lời người nói:**
  > *"Điều dưỡng bấm Duyệt $\rightarrow$ Kiosk cấp số thứ tự to rõ hướng dẫn bệnh nhân vào phòng khám. Hồ sơ được xuất ra dưới dạng phiếu tiếp nhận chuẩn y tế nhưng **hoàn toàn không chứa dữ liệu định danh cá nhân (Zero PII)**.*
  > 
  > *Và cuối cùng, khi phiên kết thúc, toàn bộ bộ nhớ RAM trên máy chủ và trình duyệt bị xóa sạch 100% theo đúng chuẩn Privacy-by-Design và Nghị định 13.*
  > 
  > *AI4Care không chỉ là công nghệ AI, mà là cầu nối nhân văn đưa tiếng nói của người yếu thế đến trái tim của ngành y tế. Xin cảm ơn Ban Giám khảo!"*

---

### 💡 BÍ KÍP XỬ LÝ KHI GIÁM KHẢO NGẮT LỜI HỎI:
1. **Nếu giám khảo hỏi: "Camera nhận diện ngôn ngữ ký hiệu đâu?"**
   $\rightarrow$ Người thao tác bấm vào nút đổi chế độ sang **"Ký hiệu VSL"** $\rightarrow$ Webcam hiện lên với khung nhận diện cử chỉ tay (Gloss toolbar 15 từ) và giải thích: *"Model chạy trực tiếp trên trình duyệt bằng Canvas/MediaPipe, bảo đảm không có bất kỳ frame hình ảnh nào bị tải lên mạng, bảo vệ quyền riêng tư tuyệt đối cho bệnh nhân."*
2. **Nếu hội trường mất kết nối Wi-Fi:**
   $\rightarrow$ Tự tin nói: *"Hệ thống của chúng tôi được thiết kế Offline-first. Mock LLM, Ontology cục bộ và toàn bộ WebSockets chạy hoàn hảo trên mạng nội bộ LAN của bệnh viện mà không cần Internet."*

