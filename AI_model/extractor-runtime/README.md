# Môi trường kiểm extractor

Được chủ dự án duyệt Q-30/Q-31. Python3.12, môi trường riêng, chỉ kiểm video công khai.

~~~bash
backend/.venv/bin/python -m venv AI_model/extractor-runtime/.venv
AI_model/extractor-runtime/.venv/bin/python -m pip install -r AI_model/extractor-runtime/requirements-lock.txt
npm install --prefix AI_model/extractor-runtime/web --no-save --package-lock=false --ignore-scripts @mediapipe/holistic@0.5.1675471629
~~~

Môi trường đã kiểm có MediaPipe0.10.21, OpenCV contrib4.11.0.86 và NumPy1.26.4. File lock giữ toàn bộ phiên bản giải được trên ARM64/macOS. Máy khác cần kiểm wheel trước khi sử dụng. Package Web chỉ dùng trong công cụ đối chiếu. Model và WASM của nó phục vụ qua route cục bộ của Playwright trong lần thử.
