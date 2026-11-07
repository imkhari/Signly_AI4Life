# 05 — TECH STACK

Phiên bản: dùng **bản ổn định mới nhất tại thời điểm P0**, ghi lại trong lockfile và `DECISIONS.md` (D-004). Không nâng phiên bản chính giữa chừng.

## Frontend
| Hạng mục | Lựa chọn | Lý do |
|---|---|---|
| Framework | React + TypeScript + Vite | Nhanh, nhóm quen, HMR tốt cho demo |
| Style | Tailwind CSS **v3.4** | Ổn định, nhiều tài liệu cho AI agent; token trong `tailwind.config.ts` |
| Icon | `lucide-react` | Yêu cầu đề bài; bundle cục bộ |
| Font | **Be Vietnam Pro** qua `@fontsource` (self-host) | Thiết kế cho tiếng Việt, hiển thị dấu rõ, chạy offline |
| Routing | `react-router-dom` | `/patient`, `/nurse`, `/doctor`, `/` (chọn vai trò) |
| State | `useReducer` + Context + custom hooks | Đủ cho wizard; tránh thêm thư viện |
| Realtime | WebSocket gốc, bọc trong `socketClient.ts` | Yêu cầu đề bài; tự viết reconnect/seq |
| TTS | `window.speechSynthesis` | Yêu cầu đề bài |
| Camera | `navigator.mediaDevices.getUserMedia` + Canvas | Yêu cầu đề bài |
| VSL | `GlossRecognizer` interface; bản thật dùng MediaPipe Hands (`@mediapipe/tasks-vision`) | Chạy trên trình duyệt, không upload video |
| Xuất hồ sơ | `window.print()` + print stylesheet → "Lưu PDF" | Không thêm dependency |
| Test | Vitest + Testing Library; Playwright cho E2E | |
| Lint | ESLint + Prettier + `tsc --noEmit` | |

## Backend
| Hạng mục | Lựa chọn |
|---|---|
| Ngôn ngữ | Python 3.11+ |
| Web | FastAPI + Uvicorn (`uvicorn[standard]` cho WebSocket) |
| Validation | Pydantic v2, `pydantic-settings` |
| HTTP client (LLM) | `httpx` (async, timeout rõ ràng) |
| LLM | Interface `LLMClient`; adapter cho Anthropic / OpenAI / Gemini + `MockLLMClient`. Chọn bằng `LLM_PROVIDER`, model bằng `LLM_MODEL` (không hard-code) |
| Test | pytest, pytest-asyncio, `fastapi.testclient` |
| Lint/Type | ruff, mypy (strict cho `domain/` và `ai/`) |
| Đóng gói | `uv` + `pyproject.toml` (chốt tại P0, D-011) |

## DevOps
- `Makefile` ở gốc: `setup`, `dev`, `check`, `demo`.
- GitHub Actions: lint + test cho frontend và backend (`.github/workflows/ci.yml`).
- Biến môi trường: `.env.example` (không commit `.env`): `ENV`, `LLM_PROVIDER`, `LLM_MODEL`, `LLM_API_KEY`, `LLM_TIMEOUT_S=4`, `SESSION_IDLE_MINUTES=10`, `CORS_ORIGINS`.
- Triển khai demo: chạy local trên laptop + 2 màn hình/2 tablet cùng mạng LAN; chi tiết `DEPLOYMENT_GUIDE.md`.

## Quyết định "web hay app?" (từ ghi chú tay)
Chọn **Web App responsive (PWA-ready)**: một codebase chạy trên tablet/kiosk/máy tính/điện thoại, không cần cài đặt, dễ demo. App native chỉ xét sau MVP (Q-04).
