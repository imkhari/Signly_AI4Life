# P0 — KICKOFF & PHỎNG VẤN

**Mục tiêu**: agent đọc hiểu toàn bộ dự án, nói lại hiểu biết của mình, liệt kê mâu thuẫn/thiếu, và hỏi chủ dự án trước khi viết dòng code nào.
**Đọc trước**: `AGENTS.md`, toàn bộ `docs/` (theo thứ tự 00 → 08, rồi `DECISIONS`, `OPEN-QUESTIONS`, `study/00-GLOSSARY`).
**Không làm**: không tạo code, không cài dependency.
**DoD**: `OPEN-QUESTIONS.md` được cập nhật; không còn câu hỏi `OPEN` loại Blocker; `99-PROGRESS-LOG.md` ghi kết quả.

## PROMPT
```text
Bạn là Tech Lead cho dự án AI4Care. Hãy làm theo đúng thứ tự:

1. Đọc AGENTS.md rồi đọc toàn bộ thư mục docs/ (00-PRD → 08-ARCHITECTURE, DECISIONS, OPEN-QUESTIONS, study/00-GLOSSARY, PLANS/, PROMPTS/).
2. Viết lại hiểu biết của bạn trong ≤ 15 dòng: dự án làm gì, ai dùng, ranh giới an toàn, luồng dữ liệu, thứ gì KHÔNG làm.
3. Liệt kê:
   a) Mâu thuẫn giữa các tài liệu (nêu file + mục).
   b) Chỗ còn thiếu/mơ hồ khiến bạn không thể viết code đúng.
   c) Rủi ro kỹ thuật lớn nhất 3 điều.
4. Hỏi tôi tối đa 5 câu quan trọng nhất (ưu tiên các mục OPEN loại Blocker trong docs/OPEN-QUESTIONS.md). Mỗi câu phải kèm phương án đề xuất của bạn và lý do một dòng, để tôi chỉ cần trả lời "ok" hoặc chọn.
5. Khi tôi trả lời: cập nhật docs/OPEN-QUESTIONS.md (OPEN → ANSWERED + câu trả lời), thêm dòng vào docs/DECISIONS.md, sửa các file docs bị ảnh hưởng, và ghi docs/99-PROGRESS-LOG.md.
6. Dừng. Không viết code. Chờ tôi bảo bắt đầu P1.
```
