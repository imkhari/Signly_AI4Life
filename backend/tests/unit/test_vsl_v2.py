from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient

from app.ai.vsl_v2 import V2Runtime, map_candidate, v2_runtime
from app.main import app


def decoded(text: str, score: float = 0.95) -> dict:
    return {"translation": text, "mean_token_probability": score, "forward_decode_ms": 25}


@pytest.mark.parametrize(
    "text",
    [
        "tôi không bị sốt .",
        "tôi bị sốt và ho .",
        "tôi bị đau đầu 3 ngày .",
        "tôi bị viêm phổi .",
        "uống thuốc giảm đau .",
        "không phải tôi bị ho .",
    ],
)
def test_decoder_cannot_add_diagnosis_negation_or_extra_facts(text: str) -> None:
    assert map_candidate(decoded(text), "symptom")["gloss"] == "UNKNOWN"


def test_context_and_generic_locations_fail_closed() -> None:
    assert map_candidate(decoded("tôi bị đau bụng ."), "symptom")["gloss"] == "ĐAU"
    assert map_candidate(decoded("tôi bị đau bụng ."), "location")["gloss"] == "UNKNOWN"
    assert map_candidate(decoded("tôi bị đau lưng ."), "location")["gloss"] == "UNKNOWN"
    assert map_candidate(decoded("tôi bị đau đầu ."), "location")["gloss"] == "ĐẦU"
    assert map_candidate(decoded("tôi bị sốt ."), "severity")["gloss"] == "UNKNOWN"
    assert map_candidate(decoded("tôi bị sốt ."), "onset")["gloss"] == "UNKNOWN"
    assert "translation" not in map_candidate(decoded("tôi bị sốt ."), "symptom")


@pytest.mark.parametrize("score", [0, 0.69, float("nan"), float("inf"), 1.01])
def test_invalid_uncalibrated_score_never_becomes_candidate(score: float) -> None:
    assert not map_candidate(decoded("tôi bị sốt .", score), "symptom")["success"]


def frames() -> list[dict]:
    return [{"timestamp_ms": i * 40, "landmarks": [0.5] * 411} for i in range(24)]


def test_v2_request_runs_only_v2_and_returns_controlled_gloss(monkeypatch) -> None:
    infer = AsyncMock(return_value=decoded("tôi bị đau đầu ."))
    monkeypatch.setattr(v2_runtime, "infer", infer)
    with TestClient(app) as client:
        response = client.post(
            "/api/vsl/predict", json={"frames": frames(), "context_step": "location"}
        )
        assert response.status_code == 200
        result = response.json()
        assert result["gloss"] == "ĐẦU"
        assert result["model_source"] == "vsl_v2_learned_translation"
        assert "translation" not in result
        infer.assert_awaited_once()
        infer.return_value = {}
        assert (
            client.post("/api/vsl/predict", json={"frames": frames()}).json()["gloss"] == "UNKNOWN"
        )


@pytest.mark.parametrize(
    "variant", ["both", "neither", "width", "too_many", "time", "span", "bool", "nan", "range"]
)
def test_holistic_contract_rejects_malformed_or_oversize_input(variant: str) -> None:
    payload: dict = {"frames": frames()}
    if variant == "both":
        payload["hands"] = []
    if variant == "neither":
        payload = {}
    if variant == "width":
        payload["frames"][0]["landmarks"].pop()
    if variant == "too_many":
        payload["frames"] *= 13
    if variant == "time":
        payload["frames"][1]["timestamp_ms"] = 0
    if variant == "span":
        payload["frames"][-1]["timestamp_ms"] = 11000
    if variant == "bool":
        payload["frames"][0]["landmarks"][0] = True
    if variant == "nan":
        payload["frames"][0]["landmarks"][0] = "NaN"
    if variant == "range":
        payload["frames"][0]["landmarks"][0] = 11
    with TestClient(app) as client:
        assert client.post("/api/vsl/predict", json=payload).status_code == 422


@pytest.mark.asyncio
async def test_runtime_unavailable_does_not_use_heuristic(monkeypatch) -> None:
    runtime = V2Runtime()
    monkeypatch.setattr(type(runtime), "available", property(lambda self: False))
    assert await runtime.infer([[0.0] * 411] * 8, list(range(8))) == {}


def test_reset_kills_worker_and_invalidates_pending_response() -> None:
    from unittest.mock import Mock

    from app.api.rest.vsl import clear_vsl_motion_buffer

    process = Mock(returncode=None)
    v2_runtime.process = process
    generation = v2_runtime.generation
    clear_vsl_motion_buffer()
    process.kill.assert_called_once()
    assert v2_runtime.process is None
    assert v2_runtime.generation > generation


@pytest.mark.asyncio
async def test_cancelled_http_kills_worker_before_another_request(monkeypatch) -> None:
    import asyncio
    from unittest.mock import Mock

    runtime = V2Runtime()
    waiting = asyncio.Event()
    pending: asyncio.Future[bytes] = asyncio.Future()

    async def read_response():
        waiting.set()
        return await pending

    process = Mock(returncode=None)
    process.stdin.drain = AsyncMock()
    process.stdout.readline = AsyncMock(side_effect=read_response)
    runtime.process = process
    monkeypatch.setattr(type(runtime), "available", property(lambda self: True))
    task = asyncio.create_task(runtime.infer([[0.5] * 411] * 8, list(range(8))))
    await waiting.wait()
    task.cancel()
    with pytest.raises(asyncio.CancelledError):
        await task
    process.kill.assert_called_once()
    assert runtime.process is None


@pytest.mark.asyncio
async def test_reset_while_worker_starts_kills_new_process_before_sending_frames(
    monkeypatch,
) -> None:
    from unittest.mock import Mock

    runtime = V2Runtime()
    process = Mock(returncode=None)

    async def spawn(*args, **kwargs):
        runtime.clear()
        return process

    monkeypatch.setattr(type(runtime), "available", property(lambda self: True))
    monkeypatch.setattr("app.ai.vsl_v2.asyncio.create_subprocess_exec", spawn)
    assert await runtime.infer([[0.5] * 411] * 8, list(range(8))) == {}
    process.kill.assert_called_once()
    process.stdin.write.assert_not_called()
    assert runtime.process is None
