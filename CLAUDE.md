@AGENTS.md

# Ghi chú riêng cho Claude Code
- Rules nằm ở `.claude/rules/` (rule có `paths:` chỉ nạp khi chạm file tương ứng).
- Skills nằm ở `.claude/skills/`: `phase-runner`, `add-ws-event`, `add-ontology-term`, `new-wizard-step`, `safety-review`, `demo-check`.
- Bắt đầu mỗi phiên làm việc bằng: "Đọc AGENTS.md và docs/99-PROGRESS-LOG.md, rồi cho tôi biết trạng thái hiện tại."
- Dùng plan mode cho mọi thay đổi chạm `docs/02-API-CONTRACT.md`, `docs/03-DATA-MODEL.md`, `docs/07-SAFETY-GUARDRAILS.md`.
