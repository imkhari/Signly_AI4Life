import sys
from pathlib import Path

# Thêm thư mục gốc vào path để load AI_model
_PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from AI_model.inference import HAS_TORCH, VSLInferenceEngine  # noqa: E402  # type: ignore


def test_vsl_engine_fallback_or_pytorch_mode() -> None:
    """
    Smoke test kiểm tra tính toàn vẹn của VSL Engine:
    - Nếu có PyTorch: Kiểm tra model khởi tạo và load checkpoint.
    - Nếu không có PyTorch: Kiểm tra fallback sang Động cơ Hình học 3D (<1ms) không bị crash.
    """
    engine = VSLInferenceEngine()
    assert engine is not None
    assert len(engine.vocab) > 0

    # Kiểm tra đường dẫn checkpoint
    ckpt_path = Path(engine.checkpoint_path)
    assert ckpt_path.exists(), f"Không tìm thấy checkpoint tại {ckpt_path}"
    assert ckpt_path.stat().st_size > 100 * 1024 * 1024, "Checkpoint phải có kích thước > 100MB"

    # Chạy thử một input landmarks mẫu
    mock_hands = [
        {
            "handedness": "Right",
            "landmarks": [{"x": 0.5, "y": 0.65, "z": 0.0} for _ in range(21)],
        }
    ]

    res = engine.predict_from_hands(mock_hands, context_step="location")
    assert res["success"] is True
    assert res["gloss"] in ["NGỰC", "ĐAU"]
    assert res["confidence"] > 0.70
    assert "latency_ms" in res

    if not HAS_TORCH:
        # Trong môi trường không có PyTorch: fallback engine hoạt động độc lập
        assert engine.is_model_loaded is False
        assert res["latency_ms"] < 20.0
    else:
        # Nếu có PyTorch: model_loaded có thể True nếu weights match
        assert hasattr(engine, "model")
