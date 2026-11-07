# P5 — FRONTEND FOUNDATION (design system, types, socket, hooks)

**Mục tiêu**: nền tảng dùng chung cho `/patient` và `/nurse`; làm được **không cần backend** nhờ fake server.
**Đọc trước**: `06-STYLE-GUIDE.md`, `02-API-CONTRACT.md`, `03-DATA-MODEL.md`, `08-ARCHITECTURE.md` §4, `.claude/rules/frontend-react.md`, `.claude/rules/accessibility-ui.md`.
**Việc cần làm**
- Tokens trong `tailwind.config.ts` (màu, cỡ chữ, kích thước chạm ≥ 64 px) theo `06`; chế độ chữ lớn + tương phản cao (class trên `<html>`, lưu sessionStorage).
- `src/ui/`: `Button`, `BigIconButton`, `Card`, `StatusPill`, `AlertCard`, `StepProgress`, `ConnectionBadge`, `Modal`, `TTSButton` (chỉ UI), kèm test render + a11y cơ bản.
- `src/i18n/vi.ts`: toàn bộ chuỗi UI (không rải chuỗi trong JSX).
- `src/types/`: `frame.ts`, `events.ts`, `summary.ts` khớp `docs/02` + `docs/03`.
- `services/ws/socketClient.ts`: kết nối, envelope, `seq`, reconnect backoff 0.5→5 s, heartbeat, replay `last_seq`; `services/api/rest.ts`; `services/storage/sessionStore.ts` (**chỉ sessionStorage**, có `wipe()`).
- `hooks/`: `useSessionSocket`, `useIdleReset` (cảnh báo 60 s trước khi reset), `useTTS`.
- `mocks/fakeServer.ts`: giả lập backend (phát `INPUT_UPDATED`, `SUMMARY_READY`…) để B và C làm song song.
- `state/SessionContext.tsx` + reducers khung.
**Không làm**: chưa làm màn hình nghiệp vụ; không `localStorage`; không thêm thư viện state.
**DoD**: Storybook không bắt buộc; trang `/` có "bảng mẫu thành phần" (kitchen sink) để xem; test xanh; kiểm tra tương phản các cặp màu theo `06`.

## PROMPT
```text
Thực hiện Phase P5 (Frontend foundation) cho AI4Care. Điều kiện: P1 DONE.
Đọc trước: AGENTS.md, docs/06-STYLE-GUIDE.md, docs/02-API-CONTRACT.md, docs/03-DATA-MODEL.md, docs/08-ARCHITECTURE.md (mục 4), .claude/rules/frontend-react.md, .claude/rules/accessibility-ui.md, docs/OPEN-QUESTIONS.md (Q-10, Q-15).

Dựng: design tokens theo style guide (kích thước chạm >= 64px, chế độ chữ lớn và tương phản cao), thư viện src/ui, src/i18n/vi.ts, src/types khớp contract, socketClient (reconnect, seq, heartbeat), rest client, sessionStore CHỈ dùng sessionStorage có wipe(), các hook useSessionSocket/useIdleReset/useTTS, SessionContext, và mocks/fakeServer để làm UI không cần backend. Thêm trang kitchen-sink tại / để xem các thành phần.

Ràng buộc: tiếng Việt cho mọi chuỗi UI; không localStorage; không thêm thư viện state; mọi thành phần tương tác đạt checklist accessibility trong docs/06 mục 5; không dùng chỉ màu để biểu thị trạng thái. Bắt đầu bằng kế hoạch ≤ 10 dòng. Hoàn thành khi make check xanh; cập nhật docs/99-PROGRESS-LOG.md.
```
