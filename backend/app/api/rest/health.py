from fastapi import APIRouter
from pydantic import BaseModel

from app.config import settings

router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    status: str
    llm_mode: str


@router.get("/health", response_model=HealthResponse)
async def get_health() -> HealthResponse:
    llm_mode = "mock" if settings.LLM_PROVIDER == "mock" else "live"
    return HealthResponse(status="ok", llm_mode=llm_mode)
