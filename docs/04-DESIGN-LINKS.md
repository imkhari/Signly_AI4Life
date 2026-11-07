# 04 — DESIGN & USER FLOWS

> Link Figma / ảnh mockup dán vào mục §6. Trong khi chưa có Figma, wireframe ASCII dưới đây là nguồn sự thật cho bố cục.

## 1. Sơ đồ route
`/` chọn vai trò · `/patient` · `/nurse` · `/doctor` (tùy chọn) · `/demo` (bảng điều khiển demo, chỉ `ENV=demo`).

## 2. Màn hình bệnh nhân — wizard 4 bước
```
[Gọi phiên dịch/nhân viên ☎]                                  [A+] [◐] [🔊]
Bước ●───○───○───○   1/4  Chọn cách nói với tôi
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│  👆 Chạm  │ │  ⌨ Viết  │ │  📷 Ký    │ │  🎤 Nói   │   (Nói chỉ hiện nếu bật F-voice)
│ chọn hình │ │  chữ     │ │  hiệu VSL │ │          │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
                                                    [Tiếp tục ▶]
```
**Bước 1 — Chọn phương thức**: chạm / viết chữ (có TTS) / camera VSL. Có thể đổi bất kỳ lúc nào.
**Bước 2 — Triệu chứng**: (a) lý do khám (lưới icon) → (b) nếu "Đau": sơ đồ cơ thể trước/sau, chạm vùng đau (nhiều vùng) → (c) thanh mức đau 0–10 → (d) thời gian bắt đầu (phút/giờ/ngày/tuần/tháng + số). Hiển thị tóm tắt nhỏ "Bạn đã chọn: …" ở dưới.
**Bước 3 — Dị ứng**: ba nút lớn **Không · Có · Không chắc**; nếu Có → nhóm (thuốc/thức ăn/khác) + nhập tên (bàn phím lớn).
**Bước 4 — Xác nhận**: hiện bản tóm tắt `nl_text_vi` chữ lớn + icon từng mục + nút 🔊 nghe; hai nút lớn **✔ Đúng** (xanh action) · **✎ Sửa** · **? Không chắc** (→ gợi ý gọi phiên dịch). Sau khi bấm Đúng: màn hình "Đã gửi cho y tá. Vui lòng chờ." + STT khi có.

Màn hình chờ/kết thúc: "Thông tin của bạn sẽ được xóa" + đếm ngược → `SESSION_RESET`.

## 3. Màn hình điều dưỡng
```
STT: 42   Mã: AC-0042   ● Đã kết nối    Trạng thái: Chờ bệnh nhân xác nhận    [☎ Gọi phiên dịch] [Xuất hồ sơ] [Kết thúc]
┌───────────────── ĐÃ XÁC NHẬN (xanh) ─────────────┐ ┌──────── CẦN HỎI LẠI / DỊ ỨNG (vàng/đỏ) ───────┐
│ ✔ Lý do khám: Đau                                 │ │ ⚠ Chưa khai dị ứng              [Hỏi lại ▾]   │
│ ✔ Vùng đau: Ngực                                  │ │ ⛔ Dị ứng: Penicillin (khai: Có) [Đã biết ✓]  │
│ ✔ Mức đau: 7/10                                   │ │ ⚠ Mâu thuẫn: đau=không, mức đau=3 [Hỏi lại]  │
│ ✔ Bắt đầu: 2 giờ trước                            │ └────────────────────────────────────────────────┘
│ Bản tóm tắt (nguồn: LLM | Mẫu cố định)            │ ┌──────── CÂU HỎI BỔ SUNG ──────────────────────┐
│ "Bạn bị đau ở ngực…"                              │ │ [Dị ứng thuốc?] [Đau bao lâu?] [Có sốt không?] │
└──────────────────────────────────────────────────┘ └────────────────────────────────────────────────┘
                                                                        [Duyệt phiếu ✔]
```
- Mục **chỉ chuyển sang xanh khi bệnh nhân đã xác nhận**; trước đó hiển thị dạng "Đang nhập…" xám.
- Cảnh báo `critical` nháy đỏ + âm báo ngắn + `aria-live=assertive`.
- Nút **Duyệt phiếu** khóa nếu còn alert `critical` chưa "Đã biết" (ack).
- Huy hiệu nguồn tóm tắt: `LLM` hoặc `Mẫu cố định` (để minh bạch với giám khảo).

## 4. Màn hình bác sĩ (tùy chọn, Q-03)
Danh sách hồ sơ đã xuất (STT, mã, triệu chứng) + nút "Trao đổi với bệnh nhân" dùng lại cùng cơ chế chạm/chữ/TTS. Chỉ làm nếu Q-03 xác nhận.

## 5. Trạng thái & lỗi cần thiết kế
Mất kết nối (banner vàng + tự thử lại) · LLM lỗi (không báo bệnh nhân; y tá thấy "Mẫu cố định") · Camera bị từ chối (hướng dẫn bật quyền + dùng chạm/chữ) · Không có giọng `vi-VN` (chỉ hiện phụ đề) · Hết phiên idle (cảnh báo 60 s trước khi reset).

## 6. Link thiết kế
- Figma: _(chưa có — dán link vào đây)_
- Ảnh tham khảo: _(chưa có)_
