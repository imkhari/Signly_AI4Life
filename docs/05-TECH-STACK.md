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

## Runtime camera V2 — được duyệt Q-22/Q-23

PyTorch 2.15.0 + NumPy 2.5.5 và dependency pin tại `AI_model/runtime/requirements-lock.txt`, môi trường **riêng** `AI_model/runtime/.venv` (máy kiểm thử Python 3.15.2 ARM64). Backend dùng stdlib subprocess/JSON-lines, không cài torch vào backend để tránh kích hoạt nhánh model cũ. `make setup-v2`, `make check-v2`; máy/OS/Python khác phải kiểm wheel tương thích, không tự đổi lockfile.

HolisticLandmarker dùng `@mediapipe/tasks-vision` hiện có, model task và WASM phục vụ tại `/models` và `/wasm`. Không fallback CDN. GPU không được thì thử CPU cục bộ. Kiến trúc MIT và nguồn/hash ở `AI_model/vsl_v2/vendor/` và model manifest; weights V2 do chủ dự án cung cấp giữ ngoài Git.

## Môi trường kiểm extractor — Q-30/Q-31

MediaPipe Python0.10.21, OpenCV contrib4.11.0.86 và NumPy1.26.4 trong AI_model/extractor-runtime/.venv (Python3.12). Dependency đầy đủ pin trong requirements-lock.txt cùng thư mục. @mediapipe/holistic0.5.1675471629 được tải vào AI_model/extractor-runtime/web để kiểm thêm bản Web legacy. Chỉ chạy offline trên video tham chiếu công khai. Công cụ Playwright tận dụng dependency frontend hiện có và HolisticDetector.detectFrame của app.
