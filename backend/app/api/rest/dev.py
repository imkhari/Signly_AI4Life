from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.application.session_service import session_service
from app.config import settings

router = APIRouter(prefix="/dev", tags=["dev"])


class ForceFallbackRequest(BaseModel):
    session_id: str
    force: bool = True


class ForceFallbackResponse(BaseModel):
    session_id: str
    force_fallback: bool


@router.post("/force-fallback", response_model=ForceFallbackResponse)
async def toggle_force_fallback(req: ForceFallbackRequest) -> ForceFallbackResponse:
    if settings.ENV == "prod":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "FORBIDDEN", "message_vi": "Chỉ khả dụng trong môi trường demo/dev"},
        )

    ok = await session_service.set_force_fallback(req.session_id, req.force)
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "SESSION_NOT_FOUND", "message_vi": "Phiên không tồn tại"},
        )

    return ForceFallbackResponse(session_id=req.session_id, force_fallback=req.force)
