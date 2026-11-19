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


## 7. Rà soát UI và ảnh demo 19/11/2026

Routes hiện có: `/`, `/patient`, `/nurse`, `/demo`, `/vsl-validation`. Không có màn bác sĩ; nhập giọng nói/nhập chữ như phương thức riêng chưa mở trong UI hiện tại. Màn chọn phương thức hiện chỉ có Chạm và camera VSL thử nghiệm.

Trang đầu chỉ chọn vai trò, hướng dẫn ghép và công cụ nội bộ trong details; đã bỏ kitchen sink và trạng thái mẫu. Header bệnh nhân xuống hàng khi cần; trước ghép ghi “Chưa ghép nối”. Ô/phím ghép mã không chuyển động kích thước. Trang thử chia chuẩn bị và thực hiện, giữ toàn bộ dữ liệu RAM và CSV.

Vùng duyệt điều dưỡng nằm sau bảng dữ liệu/cảnh báo; không dùng sticky đè nội dung. Modal có focus trap/restore, Escape và cuộn nội dung dài. Mã vùng/đơn vị trong phiếu điều dưỡng hiển thị tiếng Việt. Kết quả và ảnh đã kiểm xem `docs/PLANS/13-UI-AND-PITCH-REVIEW.md` và `artifacts/ai4life/screenshots/`.

Wireframe cũ ở trên giữ mô tả phạm vi dự kiến; các phần tùy chọn chưa triển khai không được trình bày thành tính năng đã có. Camera câu V2 theo contract hiện tại và Q-24; không dùng flow cửa sổ gloss cũ để mô tả bản hiện hành.


## Camera theo câu được chọn — Q-27

Màn chọn phương thức → camera ở lý do khám, không bắt chọn trước loại triệu chứng/vị trí → Bắt đầu ký → Xong câu → một thẻ gợi ý gồm lý do, tình trạng đau và vị trí nếu câu có → Dùng thông tin này / Sửa bằng Chạm / Bỏ gợi ý-Ký lại. Không có giỏ ghép từ trong ngữ cảnh intake. Gợi ý thay thế bản nháp có thông báo ảnh hưởng dữ liệu cũ.

Nhận gợi ý → Chạm để bổ sung: vị trí nếu thiếu, mức đau và thời gian khi có đau, triệu chứng đi kèm → dị ứng → kiểm toàn phiếu → điều dưỡng duyệt. Không có dữ liệu vẫn cho Chưa rõ; chưa hiển thị mức đau mặc định như kết quả AI. Trang validation giữ nhãn symptom/location phục vụ protocol cũ, không đại diện phép thử nhận cả phiếu mới.
