"""Isolated E2E server exercising the normal WebSocket route with a toxic mock."""

from app.api.ws import handlers
from app.infrastructure.llm.mock import MockLLMClient
from app.main import app as app


def toxic_client() -> MockLLMClient:
    return MockLLMClient(mode="toxic")


handlers.get_llm_client = toxic_client
