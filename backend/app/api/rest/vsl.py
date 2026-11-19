import sys
from pathlib import Path
from typing import Annotated, Any

from fastapi import APIRouter
from pydantic import BaseModel, Field, model_validator

from app.ai.vsl_v2 import map_candidate, v2_runtime
from app.domain.vsl import IntakeSuggestion

# Thêm thư mục gốc của project vào sys.path để nạp module AI_model
_PROJECT_ROOT = Path(__file__).resolve().parents[4]
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

try:
    from AI_model.inference import VSLInferenceEngine  # type: ignore

    _engine = VSLInferenceEngine()
except Exception as e:
    print(f"[WARN] Failed to load VSLInferenceEngine: {e}")
    _engine = None  # type: ignore

router = APIRouter(prefix="/vsl", tags=["vsl"])


# --- Schemas ---
class LandmarkPoint(BaseModel):
    x: float = Field(..., description="Tọa độ X chuẩn hóa (0.0 đến 1.0)")
    y: float = Field(..., description="Tọa độ Y chuẩn hóa (0.0 đến 1.0)")
    z: float = Field(default=0.0, description="Tọa độ Z chiều sâu")


class HandInput(BaseModel):
    handedness: str = Field(default="Right", description="Tay phải hoặc tay trái")
    landmarks: list[LandmarkPoint] = Field(
        ..., min_length=21, description="21 điểm mốc xương bàn tay"
    )


Coordinate = Annotated[float, Field(strict=True, ge=-10, le=10, allow_inf_nan=False)]


class HolisticFrame(BaseModel):
    timestamp_ms: float = Field(..., strict=True, ge=0, allow_inf_nan=False)
    landmarks: list[Coordinate] = Field(..., min_length=411, max_length=411)


class VSLPredictRequest(BaseModel):
    hands: list[HandInput] | None = Field(default=None, max_length=2)
    frames: list[HolisticFrame] | None = Field(default=None, min_length=8, max_length=300)
    context_step: str | None = Field(
        default=None,
        description="Bước ngữ cảnh: intake, location, symptom, pain_level, onset, general",
    )

    @model_validator(mode="after")
    def validate_input(self) -> "VSLPredictRequest":
        if (self.hands is None) == (self.frames is None):
            raise ValueError("Provide hands or holistic frames, never both")
        if self.context_step == "intake" and self.frames is None:
            raise ValueError("Sentence intake requires holistic frames")
        if self.frames:
            times = [frame.timestamp_ms for frame in self.frames]
            if any(b <= a for a, b in zip(times, times[1:])) or times[-1] - times[0] > 10000:
                raise ValueError("Frame times must increase within a ten-second window")
        return self


class TopKPrediction(BaseModel):
    gloss: str
    confidence: float


class VSLPredictResponse(BaseModel):
    success: bool
    gloss: str
    token: str | None = None
    secondary_token: str | None = None
    tokens: list[str] = Field(default_factory=list)
    label_vi: str | None = None
    confidence: float
    hand_count: int = 0
    total_fingers: int = 0
    is_transitioning: bool = False
    motion_type: str = "steady"
    suggested_next_step: str | None = None
    top_k: list[TopKPrediction] = Field(default_factory=list)
    latency_ms: float = 0.0
    model_source: str = "AI_model (VTN & 3D Spatial Geometry)"
    intake_suggestion: IntakeSuggestion | None = None


# --- Endpoints ---
@router.post("/predict", response_model=VSLPredictResponse)
async def predict_vsl(req: VSLPredictRequest) -> VSLPredictResponse:
    """
    Suggest controlled labels from numeric landmarks; no image/video input.
    Holistic requests use V2 exclusively; hands requests retain the legacy API.
    """
    if req.frames is not None:
        v2_result = await v2_runtime.infer(
            [frame.landmarks for frame in req.frames],
            [frame.timestamp_ms for frame in req.frames],
        )
        candidate = map_candidate(v2_result, req.context_step)
        return VSLPredictResponse(**candidate)
    if _engine is None:
        return VSLPredictResponse(
            success=False,
            gloss="UNKNOWN",
            confidence=0.0,
            label_vi="Động cơ AI chưa được khởi tạo",
            model_source="None",
        )

    # Chuyển đổi pydantic models sang dict chuẩn cho VSLInferenceEngine
    hands_data = [
        {
            "handedness": h.handedness,
            "landmarks": [{"x": p.x, "y": p.y, "z": p.z} for p in h.landmarks],
        }
        for h in req.hands or []
    ]

    result: dict[str, Any] = _engine.predict_from_hands(hands_data, context_step=req.context_step)

    top_k = [
        TopKPrediction(gloss=k["gloss"], confidence=k["confidence"])
        for k in result.get("top_k", [])
    ]

    return VSLPredictResponse(
        success=bool(result.get("success", False)),
        gloss=str(result.get("gloss", "UNKNOWN")),
        token=result.get("token"),
        secondary_token=result.get("secondary_token"),
        tokens=result.get("tokens", []),
        label_vi=result.get("label_vi"),
        confidence=float(result.get("confidence", 0.0)),
        hand_count=int(result.get("hand_count", 0)),
        total_fingers=int(result.get("total_fingers", 0)),
        is_transitioning=bool(result.get("is_transitioning", False)),
        motion_type=str(result.get("motion_type", "steady")),
        suggested_next_step=result.get("suggested_next_step"),
        top_k=top_k,
        latency_ms=float(result.get("latency_ms", 0.0)),
        model_source=str(result.get("model_source", "AI_model (VTN & 3D Spatial Geometry)")),
    )


@router.get("/vocab")
async def get_vsl_vocab() -> dict[str, Any]:
    """
    Danh mục ontology chung; không phải số ký hiệu đã được V2 kiểm chứng.
    """
    if _engine and _engine.vocab:
        return {"vocab": _engine.vocab, "total": len(_engine.vocab)}
    return {
        "vocab": [
            "ĐAU",
            "BỤNG",
            "BỤNG-DƯỚI",
            "ĐẦU",
            "NGỰC",
            "HỌNG",
            "SỐT",
            "BUỒN-NÔN",
            "CHÓNG-MẶT",
            "KHÓ-THỞ",
            "HO",
            "MỆT-MỎI",
            "HÔM-QUA",
            "HÔM-NAY",
            "SÁNG",
            "TỐI",
            "THUỐC",
            "DỊ-ỨNG",
            "CÓ",
            "KHÔNG",
        ],
        "total": 20,
    }


@router.get("/status")
async def get_vsl_status() -> dict[str, Any]:
    """
    Báo cáo trạng thái kỹ thuật của VSL Engine:
    - Có PyTorch hay đang chạy Heuristic 3D Spatial Geometry
    - Trạng thái checkpoint file (best_checkpoints.pth)
    - Số lượng cử chỉ được hỗ trợ
    """
    checkpoint_path = ""
    checkpoint_exists = False
    checkpoint_size_mb = 0.0
    is_model_loaded = False
    has_torch = False

    if _engine:
        checkpoint_path = str(getattr(_engine, "checkpoint_path", ""))
        p = Path(checkpoint_path)
        checkpoint_exists = p.exists()
        if checkpoint_exists:
            checkpoint_size_mb = round(p.stat().st_size / (1024 * 1024), 2)
        is_model_loaded = bool(getattr(_engine, "is_model_loaded", False))
        has_torch = "torch" in sys.modules and sys.modules["torch"] is not None

    model_source = (
        "heuristic_with_checkpoint_boost" if is_model_loaded else "heuristic_3d_spatial_geometry"
    )
    active_engine = (
        "3D geometry with checkpoint score adjustment"
        if is_model_loaded
        else "3D Spatial Geometry & Motion Trajectory (Heuristic)"
    )

    return {
        "primary_camera_engine": "vsl_v2_learned_translation",
        "v2_runtime_available": v2_runtime.available,
        "v2_status": "available" if v2_runtime.available else "unavailable",
        "v2_worker_ready": v2_runtime.process is not None and v2_runtime.process.returncode is None,
        "v2_supported_contexts": ["intake", "symptom", "location"],
        "v2_probability_calibrated": False,
        "vocabulary_count_is_recognition_accuracy": False,
        "legacy_fields_describe": "hands request only; camera uses holistic V2",
        "status": "ready" if _engine else "unavailable",
        "has_torch": has_torch,
        "is_model_loaded": is_model_loaded,
        "model_source": model_source,
        "active_engine": active_engine,
        "checkpoint_path": checkpoint_path,
        "checkpoint_exists": checkpoint_exists,
        "checkpoint_size_mb": checkpoint_size_mb,
        "supported_gestures_count": len(_engine.vocab) if _engine else 60,
        "latency_ms_benchmark": 15.0 if is_model_loaded else 0.06,
        "note": (
            "Labels come from geometry rules on the LAN backend; checkpoints adjust scores. "
            "Vocabulary count describes mappings. latency_ms_benchmark is a legacy configured "
            "estimate; use predict latency or end-to-end measurements."
        ),
    }


def clear_vsl_motion_buffer() -> None:
    """Release transient landmark history when the demo session ends."""
    if _engine:
        _engine.motion_buffer.clear()
    v2_runtime.clear()
