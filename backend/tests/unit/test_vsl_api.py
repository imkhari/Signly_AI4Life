from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    with TestClient(app) as c:
        yield c


def test_vsl_vocab_endpoint(client: TestClient) -> None:
    res = client.get("/api/vsl/vocab")
    assert res.status_code == 200
    data = res.json()
    assert "vocab" in data
    assert len(data["vocab"]) > 0
    assert "NGỰC" in data["vocab"] or "ĐAU" in data["vocab"]


def test_vsl_status_endpoint(client: TestClient) -> None:
    res = client.get("/api/vsl/status")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ready"
    assert "has_torch" in data
    assert "is_model_loaded" in data
    assert "model_source" in data
    assert isinstance(data["checkpoint_exists"], bool)
    assert "checkpoint_path" in data
    assert data["supported_gestures_count"] == 60


def test_vsl_predict_endpoint_chest_pain(client: TestClient) -> None:
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


def test_vsl_predict_endpoint_five_fingers(client: TestClient) -> None:
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


def test_vsl_predict_endpoint_v_sign_two_fingers(client: TestClient) -> None:
    # Mô phỏng giơ 2 ngón tay chữ V (Index + Middle duỗi, Ring + Pinky + Thumb gập)
    mock_landmarks = [{"x": 0.5, "y": 0.5, "z": 0.0} for _ in range(21)]
    mock_landmarks[0] = {"x": 0.5, "y": 0.7, "z": 0.0}
    # Ngón trỏ (8) và giữa (12) duỗi cao
    for tip_idx, dip_idx, pip_idx, mcp_idx in [(8, 7, 6, 5), (12, 11, 10, 9)]:
        mock_landmarks[mcp_idx] = {"x": 0.5, "y": 0.55, "z": 0.0}
        mock_landmarks[pip_idx] = {"x": 0.5, "y": 0.45, "z": 0.0}
        mock_landmarks[dip_idx] = {"x": 0.5, "y": 0.38, "z": 0.0}
        mock_landmarks[tip_idx] = {"x": 0.5, "y": 0.30, "z": 0.0}
    # Ngón áp út (16) và út (20) gập
    for tip_idx, dip_idx, pip_idx, mcp_idx in [(16, 15, 14, 13), (20, 18, 18, 17)]:
        mock_landmarks[mcp_idx] = {"x": 0.5, "y": 0.55, "z": 0.0}
        mock_landmarks[pip_idx] = {"x": 0.5, "y": 0.57, "z": 0.0}
        mock_landmarks[dip_idx] = {"x": 0.5, "y": 0.60, "z": 0.0}
        mock_landmarks[tip_idx] = {"x": 0.5, "y": 0.62, "z": 0.0}
    # Ngón cái gập
    mock_landmarks[2] = {"x": 0.5, "y": 0.60, "z": 0.0}
    mock_landmarks[3] = {"x": 0.5, "y": 0.62, "z": 0.0}
    mock_landmarks[4] = {"x": 0.5, "y": 0.64, "z": 0.0}

    payload = {
        "hands": [{"handedness": "Right", "landmarks": mock_landmarks}],
        "context_step": "general",
    }
    res = client.post("/api/vsl/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["gloss"] == "MỨC-2"
    assert data["secondary_token"] == "2"
    assert data["confidence"] >= 0.90


def test_vsl_predict_endpoint_two_hands_ten_fingers(client: TestClient) -> None:
    # Mô phỏng 2 bàn tay mỗi tay 5 ngón xòe (10 ngón)
    mock_h1 = [{"x": 0.35, "y": 0.6, "z": 0.0} for _ in range(21)]
    mock_h1[0] = {"x": 0.35, "y": 0.82, "z": 0.0}
    four_fingers = [(8, 7, 6, 5), (12, 11, 10, 9), (16, 15, 14, 13), (20, 18, 18, 17)]
    for tip_idx, dip_idx, pip_idx, mcp_idx in four_fingers:
        mock_h1[mcp_idx] = {"x": 0.35, "y": 0.62, "z": 0.0}
        mock_h1[pip_idx] = {"x": 0.35, "y": 0.50, "z": 0.0}
        mock_h1[dip_idx] = {"x": 0.35, "y": 0.42, "z": 0.0}
        mock_h1[tip_idx] = {"x": 0.35, "y": 0.34, "z": 0.0}
    mock_h1[2] = {"x": 0.28, "y": 0.65, "z": 0.0}
    mock_h1[3] = {"x": 0.24, "y": 0.58, "z": 0.0}
    mock_h1[4] = {"x": 0.20, "y": 0.50, "z": 0.0}

    mock_h2 = [{"x": 0.65, "y": 0.6, "z": 0.0} for _ in range(21)]
    mock_h2[0] = {"x": 0.65, "y": 0.82, "z": 0.0}
    for tip_idx, dip_idx, pip_idx, mcp_idx in four_fingers:
        mock_h2[mcp_idx] = {"x": 0.65, "y": 0.62, "z": 0.0}
        mock_h2[pip_idx] = {"x": 0.65, "y": 0.50, "z": 0.0}
        mock_h2[dip_idx] = {"x": 0.65, "y": 0.42, "z": 0.0}
        mock_h2[tip_idx] = {"x": 0.65, "y": 0.34, "z": 0.0}
    mock_h2[2] = {"x": 0.72, "y": 0.65, "z": 0.0}
    mock_h2[3] = {"x": 0.76, "y": 0.58, "z": 0.0}
    mock_h2[4] = {"x": 0.80, "y": 0.50, "z": 0.0}

    payload = {
        "hands": [
            {"handedness": "Left", "landmarks": mock_h1},
            {"handedness": "Right", "landmarks": mock_h2},
        ],
        "context_step": "general",
    }
    res = client.post("/api/vsl/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["gloss"] == "MỨC-10"
    assert data["secondary_token"] == "10"
    assert data["total_fingers"] == 10


def test_vsl_predict_endpoint_fever_forehead(client: TestClient) -> None:
    # Mô phỏng áp tay lên trán (act_y = 0.22 < 0.36) -> SỐT
    mock_landmarks = [{"x": 0.5, "y": 0.22, "z": 0.0} for _ in range(21)]
    mock_landmarks[0] = {"x": 0.5, "y": 0.28, "z": 0.0}
    four_fingers = [(8, 7, 6, 5), (12, 11, 10, 9), (16, 15, 14, 13), (20, 18, 18, 17)]
    for tip_idx, dip_idx, pip_idx, mcp_idx in four_fingers:
        mock_landmarks[mcp_idx] = {"x": 0.5, "y": 0.25, "z": 0.0}
        mock_landmarks[pip_idx] = {"x": 0.5, "y": 0.20, "z": 0.0}
        mock_landmarks[dip_idx] = {"x": 0.5, "y": 0.16, "z": 0.0}
        mock_landmarks[tip_idx] = {"x": 0.5, "y": 0.12, "z": 0.0}

    payload = {
        "hands": [{"handedness": "Right", "landmarks": mock_landmarks}],
        "context_step": "general",
    }
    res = client.post("/api/vsl/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["gloss"] == "SỐT"


def test_vsl_predict_endpoint_shoulder_vai(client: TestClient) -> None:
    # Mô phỏng đặt tay lên vai (act_x = 0.20 < 0.28, act_y = 0.45)
    mock_landmarks = [{"x": 0.20, "y": 0.45, "z": 0.0} for _ in range(21)]
    payload = {
        "hands": [{"handedness": "Right", "landmarks": mock_landmarks}],
        "context_step": "general",
    }
    res = client.post("/api/vsl/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["gloss"] == "VAI"


def test_vsl_predict_endpoint_tooth_rang(client: TestClient) -> None:
    # Mô phỏng áp tay vào má (act_x = 0.30, act_y = 0.42)
    mock_landmarks = [{"x": 0.30, "y": 0.42, "z": 0.0} for _ in range(21)]
    payload = {
        "hands": [{"handedness": "Right", "landmarks": mock_landmarks}],
        "context_step": "general",
    }
    res = client.post("/api/vsl/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["gloss"] == "RĂNG"


def test_vsl_predict_endpoint_eye_mat(client: TestClient) -> None:
    # Mô phỏng chỉ tay vào mắt (act_x = 0.45, act_y = 0.32, chỉ ngón trỏ duỗi)
    mock_landmarks = [{"x": 0.45, "y": 0.32, "z": 0.0} for _ in range(21)]
    mock_landmarks[0] = {"x": 0.45, "y": 0.45, "z": 0.0}
    mock_landmarks[5] = {"x": 0.45, "y": 0.38, "z": 0.0}
    mock_landmarks[6] = {"x": 0.45, "y": 0.34, "z": 0.0}
    mock_landmarks[7] = {"x": 0.45, "y": 0.30, "z": 0.0}
    mock_landmarks[8] = {"x": 0.45, "y": 0.25, "z": 0.0}  # Ngón trỏ chỉ cao

    payload = {
        "hands": [{"handedness": "Right", "landmarks": mock_landmarks}],
        "context_step": "general",
    }
    res = client.post("/api/vsl/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["gloss"] == "MẮT"


def test_vsl_predict_endpoint_neck_gay(client: TestClient) -> None:
    # Mô phỏng hai tay ôm sau gáy (act_x = 0.50, act_y = 0.40, distance = 0.20)
    mock_landmarks_r = [{"x": 0.60, "y": 0.40, "z": 0.0} for _ in range(21)]
    mock_landmarks_l = [{"x": 0.40, "y": 0.40, "z": 0.0} for _ in range(21)]
    payload = {
        "hands": [
            {"handedness": "Right", "landmarks": mock_landmarks_r},
            {"handedness": "Left", "landmarks": mock_landmarks_l},
        ],
        "context_step": "general",
    }
    res = client.post("/api/vsl/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["gloss"] == "GÁY"


def test_vsl_predict_endpoint_hip_hong(client: TestClient) -> None:
    # Mô phỏng chống tay lên hông (act_x = 0.18, act_y = 0.70)
    mock_landmarks = [{"x": 0.18, "y": 0.70, "z": 0.0} for _ in range(21)]
    payload = {
        "hands": [{"handedness": "Right", "landmarks": mock_landmarks}],
        "context_step": "general",
    }
    res = client.post("/api/vsl/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["gloss"] == "HÔNG"
