.PHONY: setup setup-backend setup-frontend dev dev-backend dev-frontend check check-backend check-frontend demo clean

VENV = backend/.venv
PYTHON = $(VENV)/bin/python
PIP = $(VENV)/bin/pip

setup: setup-backend setup-frontend
	@echo "==> Setup completed successfully!"

setup-backend:
	@echo "==> Setting up backend virtualenv..."
	@if command -v uv >/dev/null 2>&1; then \
		echo "Using uv to set up virtualenv..."; \
		uv venv $(VENV) --python python3; \
		uv pip install -e "backend[dev]"; \
	else \
		echo "uv not found, using python3 -m venv..."; \
		python3 -m venv $(VENV); \
		$(PIP) install --upgrade pip; \
		$(PIP) install -e "backend[dev]"; \
	fi
	@if [ ! -f backend/.env ]; then cp backend/.env.example backend/.env; fi

setup-frontend:
	@echo "==> Installing frontend dependencies..."
	cd frontend && npm install

check: check-backend check-frontend
	@echo "==> All checks passed (Backend + Frontend)!"

check-backend:
	@echo "==> [Backend] Linting with ruff..."
	cd backend && ../$(VENV)/bin/ruff check .
	@echo "==> [Backend] Type checking with mypy..."
	cd backend && ../$(VENV)/bin/mypy app tests
	@echo "==> [Backend] Running unit tests with pytest..."
	cd backend && ../$(VENV)/bin/pytest

check-frontend:
	@echo "==> [Frontend] Linting with eslint..."
	cd frontend && npm run lint
	@echo "==> [Frontend] Type checking with tsc..."
	cd frontend && npm run typecheck
	@echo "==> [Frontend] Running unit tests with vitest..."
	cd frontend && npm test

dev:
	@echo "Starting backend (:8000) and frontend (:5173)..."
	@trap 'kill 0' INT; \
	(cd backend && ../$(VENV)/bin/uvicorn app.main:app --reload --port 8000) & \
	(cd frontend && npm run dev) & \
	wait

dev-backend:
	cd backend && ../$(VENV)/bin/uvicorn app.main:app --reload --port 8000

dev-frontend:
	cd frontend && npm run dev

demo:
	@echo "Starting AI4Care in DEMO mode..."
	@trap 'kill 0' INT; \
	(cd backend && ENV=demo LLM_PROVIDER=mock ../$(VENV)/bin/uvicorn app.main:app --port 8000) & \
	(cd frontend && npm run dev) & \
	wait

clean:
	rm -rf backend/.venv frontend/node_modules frontend/dist

