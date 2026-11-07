# KẾ HOẠCH MVP 2 TUẦN (nhóm 3 người)

Giả định phân công (Q-12): **A** = backend + AI · **B** = màn hình bệnh nhân · **C** = màn hình y tá + camera/TTS + demo. Mỗi phase có prompt tương ứng trong `docs/PROMPTS/`.

## Nguyên tắc
1. Tích hợp sớm: **mốc M1 (cuối ngày 5)** phải có luồng `INPUT_UPDATED` chạy thật giữa hai trình duyệt.
2. Đóng băng tính năng vào **ngày 12**; ngày 13–14 chỉ sửa lỗi, luyện demo, quay video dự phòng.
3. Giữ Must (F-01…F-13) chạy trơn tru > thêm Should. Cắt theo thứ tự trong `01-FEATURES.md`.

## Lịch
| Ngày | A (Backend/AI) | B (Patient UI) | C (Nurse UI/Demo) | Phase |
|---|---|---|---|---|
| 0 | Trả lời `OPEN-QUESTIONS`, chạy P0 | cùng A | cùng A | P0 |
| 1 | Bootstrap monorepo, CI, Makefile (cả nhóm review) | | | P1 |
| 2–3 | Models, Ontology, Parser, state machine + test | Design tokens, `ui/`, i18n, router | `socketClient`, hooks, fake server | P2, P5 |
| 4 | LLM client + mock, prompt, redaction | `BodyMap` SVG, `PainSlider` | Khung `NursePage`, `AlertCard` | P3, P6, P7 |
| 5 | Validator + Fallback + test an toàn; **WS Hub + sessions REST** | Wizard bước 1–2 | Nối WS thật; hiển thị frame thời gian thực | P3, P4 |
| **5 (cuối ngày)** | **M1: INPUT_UPDATED end-to-end** | | | |
| 6–7 | Hoàn thiện event còn lại, idle wipe, replay | Bước 3 (dị ứng), bước 4 (xác nhận) + TTS | Bảng 2 vùng, câu hỏi bổ sung, duyệt phiếu | P4, P6, P7 |
| 8 | Test tích hợp WS, endpoint dev/force-fallback | Hoàn thiện a11y, chế độ chữ lớn/tương phản | Xuất hồ sơ (print/PDF), gọi phiên dịch (mock) | P6, P7 |
| **8 (cuối ngày)** | **M2: luồng đầy đủ patient → nurse chạy được** | | | |
| 9–10 | Hỗ trợ lỗi, kịch bản LLM mock demo | Camera VSL UI (mock) | `GlossRecognizer`, MediaPipe nếu kịp | P8 |
| 11 | E2E Playwright (cả nhóm) | | | P9 |
| 12 | **Đóng băng tính năng**; audit a11y + an toàn | | | P9 |
| 13 | Luyện demo ×3, quay video dự phòng, README | | | P9 |
| 14 | Demo / buffer | | | |

## Mốc nghiệm thu
| Mốc | Điều kiện | Cách kiểm |
|---|---|---|
| M0 | Docs chốt, câu hỏi Blocker đã trả lời | `OPEN-QUESTIONS` không còn Blocker |
| M1 (ngày 5) | Hai trình duyệt ghép cặp; chạm ở `/patient` → `/nurse` cập nhật < 1 s | Chạy tay + test tích hợp |
| M2 (ngày 8) | Luồng đầy đủ tới `NURSE_VERIFIED`; Fallback chạy khi LLM lỗi | Chạy tay + E2E cơ bản |
| M3 (ngày 12) | Tất cả Must DONE; `make check` xanh; không lỗi console | CI |
| M4 (ngày 13) | Demo trọn vẹn ×3 liên tiếp không lỗi, cả khi ngắt mạng | Rehearsal |

## Rủi ro & giảm thiểu
| Rủi ro | Khả năng | Giảm thiểu |
|---|---|---|
| Nhận dạng VSL không chính xác | Cao | Mock-first; chỉ ≤ 15 gloss; luôn cho bệnh nhân xác nhận gloss; có đường chạm/chữ thay thế |
| LLM chậm/lỗi lúc demo | Trung bình | Timeout 4 s → Fallback; mock có kịch bản; nút ép Fallback để trình diễn |
| Mất mạng/Wi-Fi hội trường | Trung bình | Chạy local; font/icon self-host; mock LLM; video dự phòng |
| Camera cần HTTPS | Trung bình | Chạy `localhost` hoặc chứng chỉ tự ký; thử trước |
| Giọng `vi-VN` không có trên thiết bị | Trung bình | Phụ đề luôn hiển thị; kiểm tra thiết bị trước |
| Phạm vi phình to | Cao | Quy tắc đóng băng ngày 12; Won't Have |
| Lệch schema giữa FE/BE | Trung bình | Test hợp đồng; thay đổi schema theo skill `add-ws-event` |
| Ban giám khảo hỏi "AI có chẩn đoán không?" | Cao | Demo Validator chặn câu độc hại; nhấn mạnh con người quyết định |
