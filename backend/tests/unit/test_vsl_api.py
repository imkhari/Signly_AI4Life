from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_vsl_vocab_endpoint() -> None:
    res = client.get("/api/vsl/vocab")
    assert res.status_code == 200
    data = res.json()
    assert "vocab" in data
    assert len(data["vocab"]) > 0
    assert "NGỰC" in data["vocab"] or "ĐAU" in data["vocab"]


def test_vsl_status_endpoint() -> None:
    res = client.get("/api/vsl/status")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ready"
    assert "has_torch" in data
    assert "is_model_loaded" in data
    assert "model_source" in data
    assert data["checkpoint_exists"] is True
    assert data["supported_gestures_count"] == 35


def test_vsl_predict_endpoint_chest_pain() -> None:
    # Mô phỏng nắm tay trước ngực
    mock_landmarks = [{"x": 0.5, "y": 0.65, "z": 0.0} for _ in range(21)]
    payload = {
        "hands": [
            {
                "handedness": "Right",
                "landmarks": mock_landmarks,
            }
        ],
        "context_step": "location",
    }
    res = client.post("/api/vsl/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["gloss"] in ["NGỰC", "ĐAU"]
    assert data["confidence"] > 0.8
    assert data["latency_ms"] >= 0.0
    assert len(data["top_k"]) > 0


def test_vsl_predict_endpoint_five_fingers() -> None:
    # Mô phỏng giơ 5 ngón tay
    mock_landmarks = [{"x": 0.82, "y": 0.6, "z": 0.0} for _ in range(21)]
    mock_landmarks[0] = {"x": 0.85, "y": 0.82, "z": 0.0}
    finger_indices = [
        (8, 7, 6, 5),
        (12, 11, 10, 9),
        (16, 15, 14, 13),
        (20, 18, 18, 17),
    ]
    for tip_idx, dip_idx, pip_idx, mcp_idx in finger_indices:
        mock_landmarks[mcp_idx] = {"x": 0.82, "y": 0.62, "z": 0.0}
        mock_landmarks[pip_idx] = {"x": 0.82, "y": 0.50, "z": 0.0}
        mock_landmarks[dip_idx] = {"x": 0.82, "y": 0.42, "z": 0.0}
        mock_landmarks[tip_idx] = {"x": 0.82, "y": 0.34, "z": 0.0}
    mock_landmarks[2] = {"x": 0.76, "y": 0.65, "z": 0.0}
    mock_landmarks[3] = {"x": 0.72, "y": 0.58, "z": 0.0}
    mock_landmarks[4] = {"x": 0.67, "y": 0.50, "z": 0.0}

    payload = {
        "hands": [
            {
                "handedness": "Right",
                "landmarks": mock_landmarks,
            }
        ],
        "context_step": "general",
    }
    res = client.post("/api/vsl/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["gloss"] == "MỨC-5"
    assert data["confidence"] >= 0.9
