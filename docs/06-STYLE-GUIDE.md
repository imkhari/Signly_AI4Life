# 06 — STYLE GUIDE (UI/UX + Accessibility)

## 1. Nguyên tắc thiết kế
1. **Hình trước chữ**: người Điếc có thể đọc tiếng Việt hạn chế → icon + màu + vị trí + chữ ngắn, đừng chỉ dùng chữ.
2. **Một việc mỗi màn hình**: mỗi bước wizard chỉ có một quyết định chính.
3. **Mục tiêu chạm lớn**: kiosk dùng tay, có thể run/đeo găng.
4. **Màu mang ý nghĩa trạng thái, không trang trí**: xanh = đã xác nhận, vàng = cần hỏi lại, đỏ = nguy cơ/khẩn cấp. Nút thường KHÔNG dùng ba màu này.
5. **Màn hình y tá = bảng điều khiển đọc nhanh**; màn hình bệnh nhân = sách tranh tương tác.
6. Không gắn nhãn chỉ bằng màu (hỗ trợ mù màu): luôn kèm icon + chữ.

## 2. Design tokens (đặt trong `tailwind.config.ts`)
| Token | Hex | Dùng cho | Tương phản trên nền |
|---|---|---|---|
| `ink` | `#10283C` | Chữ chính, tiêu đề | 14:1 trên `paper` |
| `paper` | `#FFFFFF` | Nền thẻ | — |
| `canvas` | `#EAF1F4` | Nền trang | — |
| `action` | `#0A6B8F` | Nút chính, liên kết, focus | ≥ 5.5:1 với chữ trắng |
| `ok` / `ok-bg` | `#17703F` / `#E3F4EA` | Đã xác nhận | ≥ 5:1 |
| `warn` / `warn-bg` | `#8A5200` / `#FFF1CF` | Cần hỏi lại | ≥ 5:1 |
| `danger` / `danger-bg` | `#B3261E` / `#FDE7E5` | Dị ứng / khẩn cấp | ≥ 5.5:1 |
| `mute` | `#4A6074` | Chữ phụ | ≥ 4.5:1 |
Chế độ **tương phản cao**: `ink` thuần `#000`, nền `#FFF`, viền 3 px, bỏ nền pastel.
Kiểm tra mọi cặp màu ≥ **WCAG AA (4.5:1)**; chữ lớn / thành phần UI ≥ 3:1.

## 3. Typography
- Một họ chữ: **Be Vietnam Pro**. Trọng số: 400 (thân), 600 (nhãn), 700 (tiêu đề).
- Kiosk bệnh nhân: nền tảng 20 px; tiêu đề bước 36–44 px; nút 24 px.
- Màn hình y tá: nền tảng 18 px; dữ liệu quan trọng 24–28 px.
- Độ dài dòng < 70 ký tự; `line-height` 1.5; câu hiển thị cho bệnh nhân ≤ 15 từ.
- Câu chữ: chủ động, động từ rõ ("Chọn chỗ đau", "Xác nhận"), không dùng "Gửi"/"Submit" chung chung; cùng một hành động giữ cùng một tên xuyên suốt luồng; lỗi nói rõ chuyện gì xảy ra và cách sửa, không xin lỗi chung chung.
- Toàn bộ chuỗi UI trong `src/i18n/vi.ts`, không rải chuỗi trong JSX.

## 4. Kích thước & bố cục
- Mục tiêu chạm tối thiểu **64×64 px** (kiosk), khoảng cách giữa các nút ≥ 12 px. (WCAG 2.5.5 yêu cầu 44 px; ta vượt mức cho kiosk.)
- Bố cục bệnh nhân: lưới thẻ lớn 2–3 cột; thanh tiến độ 4 bước luôn thấy; nút "Quay lại" bên trái, "Tiếp tục" bên phải dưới cùng, nút **"Gọi phiên dịch / nhân viên"** cố định góc trên phải ở mọi bước.
- Bố cục y tá (≥ 1024 px): 2 cột — trái **Đã xác nhận** (xanh), phải **Cần hỏi lại & Dị ứng** (vàng/đỏ); thanh đầu có STT, mã tiếp nhận, trạng thái kết nối.
- Responsive: breakpoint `sm 640 / md 768 / lg 1024 / xl 1280`; ưu tiên tablet ngang 1280×800 và dọc 800×1280; điện thoại chỉ cần dùng được.
- Bo góc: nút/thẻ tương tác 16 px; chip/nhãn 8 px (không dùng một bán kính cho mọi thứ).

## 5. Accessibility checklist (bắt buộc cho mọi component tương tác)
- [ ] Điều hướng bàn phím đầy đủ; focus ring rõ (3 px `action`, offset 2 px), không ẩn `outline`.
- [ ] `aria-label` tiếng Việt cho icon-only; `role`/`aria-live="polite"` cho vùng cập nhật thời gian thực trên màn y tá; `aria-live="assertive"` chỉ cho cảnh báo `critical`.
- [ ] Không phụ thuộc hover; không có thao tác chỉ làm được bằng kéo (thanh đau có nút ±).
- [ ] Không chỉ dùng màu; mọi trạng thái có icon + chữ.
- [ ] Tôn trọng `prefers-reduced-motion`: tắt hiệu ứng không cần thiết. Chuyển động chỉ để phản hồi hành động (chọn, xác nhận), không trang trí.
- [ ] Không có tự động chuyển bước gây mất kiểm soát; không timeout bất ngờ (cảnh báo trước 60 s khi sắp tự reset do idle).
- [ ] Hỗ trợ chữ lớn (công tắc A+) và tương phản cao (công tắc ◐) trên thanh trên cùng.
- [ ] Khối nội dung chính có `lang="vi"`.
- [ ] Hiển thị chữ phụ đề cho mọi âm thanh TTS (bệnh nhân Điếc không nghe được): mọi lời đọc đều có văn bản tương ứng trên màn hình.

## 6. Thành phần (design system `src/ui/`)
`BigIconButton` (icon 48 px + nhãn) · `StepProgress` · `BodyMap` (SVG, vùng có `<title>` và nhãn) · `PainSlider` (thanh + ±, mặt cảm xúc) · `AlertCard` (level → màu + icon) · `StatusPill` (Đã xác nhận / Chờ xác nhận / Cần hỏi lại) · `ConnectionBadge` · `TTSButton`.

## 7. Phong cách hình ảnh
Hình minh họa đơn giản, nét đều, một bộ icon thống nhất (Lucide). Sơ đồ cơ thể trung tính về giới/độ tuổi. Tránh ảnh chụp người thật và hình ảnh máu/me. Tránh các mẫu giao diện chung chung kiểu "thẻ giống hệt nhau + gradient"; để trọng tâm thị giác ở nơi bệnh nhân cần quyết định (sơ đồ cơ thể, thanh mức đau) và giữ phần còn lại tĩnh, yên.
