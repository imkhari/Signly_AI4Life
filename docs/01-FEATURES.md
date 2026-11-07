# 01 — FEATURES (MoSCoW)

Trạng thái: `TODO` · `DOING` · `DONE` · `NEEDS-CONFIRM` (cần người dùng xác nhận trước khi làm).

## Must Have (bắt buộc cho demo)
| ID | Tính năng | Chi tiết / tiêu chí nghiệm thu | Trạng thái |
|---|---|---|---|
| F-01 | Ghép cặp phiên | Y tá tạo phiên, hiển thị mã 6 ký tự; bệnh nhân vào bằng mã; cả hai nhận `SESSION_JOINED` | TODO |
| F-02 | Wizard bệnh nhân 4 bước | Phương thức → lý do/vị trí/mức đau/thời gian → dị ứng → xác nhận; nút Quay lại/Tiếp tục to, lưu tiến độ trong sessionStorage | TODO |
| F-03 | Sơ đồ cơ thể chạm | SVG trước/sau, ≥ 12 vùng chọn được, vùng chọn có màu + viền + nhãn chữ (không chỉ màu) | TODO |
| F-04 | Thanh mức đau 0–10 | Kéo + nút ±, kèm mặt cảm xúc, giá trị đọc to được bằng TTS | TODO |
| F-05 | Khai dị ứng | Có / Không / Không chắc; nếu Có → chọn nhóm (thuốc/thức ăn/khác) + nhập tên | TODO |
| F-06 | Rule-based Semantic Parser | Ánh xạ Ontology, phát hiện mâu thuẫn + thiếu trường (xem `03`) | TODO |
| F-07 | LLM sinh câu + Validator + Fallback | Theo `07`; timeout 4 s → template | TODO |
| F-08 | Đồng bộ WebSocket | 5 event lõi + helper (xem `02`); reconnect tự động | TODO |
| F-09 | Màn hình y tá | 2 vùng: Đã xác nhận (xanh) / Cần hỏi lại & Dị ứng (vàng/đỏ); mã tiếp nhận; STT = số thứ tự | TODO |
| F-10 | Xác nhận 2 chiều | Bệnh nhân xác nhận → y tá duyệt; thay đổi sau xác nhận → reset trạng thái xác nhận | TODO |
| F-11 | Gọi phiên dịch VRI | Nút trên cả hai màn hình → `REQUEST_INTERPRETER`; MVP: giả lập (mock) hiển thị trạng thái "Đang gọi…" | TODO |
| F-12 | Xóa dữ liệu theo phiên | `SESSION_RESET` xóa RAM backend + sessionStorage + tắt camera; kèm tự hết hạn (idle 10 phút) | TODO |
| F-13 | TTS tiếng Việt | `speechSynthesis` đọc bản tóm tắt / câu hỏi; nút bật/tắt; fallback khi không có giọng `vi-VN` | TODO |

## Should Have
| ID | Tính năng | Ghi chú | Trạng thái |
|---|---|---|---|
| F-20 | Camera VSL gloss rời rạc | MVP: giao diện camera + `GlossRecognizer` interface; bản mock (nút giả lập) → thật (MediaPipe Hands + phân loại ≤ 15 gloss) nếu kịp | NEEDS-CONFIRM (Q-05) |
| F-21 | Xuất hồ sơ cho bác sĩ | Nút "Xuất hồ sơ": in/PDF/JSON gồm STT, mã tiếp nhận, triệu chứng đã xác nhận, cảnh báo. Từ ghi chú tay | NEEDS-CONFIRM (Q-03) |
| F-22 | Câu hỏi bổ sung từ y tá | Y tá chọn câu hỏi mẫu (icon + chữ) → hiện lớn trên màn bệnh nhân + TTS; bệnh nhân trả lời bằng chạm | TODO |
| F-23 | Nhập chữ tự do + TTS | Ô nhập chữ; hệ thống đọc to cho y tá; qua Parser tìm từ khóa Ontology | TODO |
| F-24 | Chế độ chữ lớn / tương phản cao | Công tắc 1 chạm, nhớ trong phiên | TODO |

## Could Have
| ID | Tính năng | Ghi chú |
|---|---|---|
| F-30 | Chế độ Bác sĩ `/doctor` | Nhận hồ sơ + giao tiếp 2 chiều bằng cùng cơ chế (ghi chú tay). Cần chốt Q-03 |
| F-31 | Đa ngôn ngữ UI (EN) | Chỉ khi dư thời gian |
| F-32 | Nhật ký ẩn danh cho đánh giá | Chỉ số: thời gian hoàn tất, số lần gọi phiên dịch; KHÔNG chứa nội dung bệnh nhân |
| F-33 | PWA / cài lên tablet | |

## Won't Have (cố ý loại)
Chẩn đoán · gợi ý thuốc · lưu hồ sơ lâu dài · tài khoản đăng nhập · tích hợp HIS/EMR · nhận dạng VSL liên tục.

## Quy tắc ưu tiên khi trễ tiến độ
Giữ **F-01…F-13** chạy trơn tru > thêm tính năng Should. Cắt theo thứ tự: F-33 → F-31 → F-30 → F-20 (giữ mock) → F-24.
