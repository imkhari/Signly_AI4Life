from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.application.session_service import session_service

router = APIRouter(prefix="/sessions", tags=["sessions"])


class CreateSessionResponse(BaseModel):
    session_id: str
    pairing_code: str
    token_nurse: str


class JoinSessionRequest(BaseModel):
    pairing_code: str = Field(..., min_length=4, max_length=10)


class JoinSessionResponse(BaseModel):
    session_id: str
    token_patient: str


@router.post("", response_model=CreateSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session() -> CreateSessionResponse:
    session_id, pairing_code, token_nurse = await session_service.create_session()
    return CreateSessionResponse(
        session_id=session_id,
        pairing_code=pairing_code,
        token_nurse=token_nurse,
    )


@router.post("/join", response_model=JoinSessionResponse)
async def join_session(req: JoinSessionRequest) -> JoinSessionResponse:
    result = await session_service.join_session(req.pairing_code)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "SESSION_NOT_FOUND",
                "message_vi": "Mã ghép cặp không đúng hoặc phiên đã hết hạn",
            },
        )
    session_id, token_patient = result
    return JoinSessionResponse(
        session_id=session_id,
        token_patient=token_patient,
    )
