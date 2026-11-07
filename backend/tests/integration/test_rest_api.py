from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_rest_health() -> None:
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "llm_mode" in data


def test_rest_ontology() -> None:
    res = client.get("/api/ontology")
    assert res.status_code == 200
    data = res.json()
    assert "chief_complaints" in data
    assert "body_regions" in data
    assert "vsl_gloss" in data
    assert len(data["chief_complaints"]) > 0
    assert len(data["body_regions"]) > 0
    assert len(data["vsl_gloss"]) > 0


def test_rest_create_and_join_session() -> None:
    # 1. Nurse creates session
    create_res = client.post("/api/sessions")
    assert create_res.status_code == 201
    create_data = create_res.json()
    assert "session_id" in create_data
    assert "pairing_code" in create_data
    assert "token_nurse" in create_data
    assert len(create_data["pairing_code"]) == 6

    # 2. Join with invalid pairing code
    bad_join = client.post("/api/sessions/join", json={"pairing_code": "INVALID"})
    assert bad_join.status_code == 404
    assert bad_join.json()["detail"]["code"] == "SESSION_NOT_FOUND"

    # 3. Patient joins with correct pairing code
    join_res = client.post("/api/sessions/join", json={"pairing_code": create_data["pairing_code"]})
    assert join_res.status_code == 200
    join_data = join_res.json()
    assert join_data["session_id"] == create_data["session_id"]
    assert "token_patient" in join_data


def test_rest_force_fallback() -> None:
    create_res = client.post("/api/sessions")
    session_id = create_res.json()["session_id"]

    res = client.post("/api/dev/force-fallback", json={"session_id": session_id, "force": True})
    assert res.status_code == 200
    assert res.json()["force_fallback"] is True
