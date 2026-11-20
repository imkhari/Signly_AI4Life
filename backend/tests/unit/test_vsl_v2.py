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


@pytest.mark.parametrize("text", ["tôi không bị sốt", "tôi bị sốt và ho", "tôi bị đau ngực 3 ngày"])
def test_sentence_intake_rejects_partial_matches(text: str) -> None:
    result = map_candidate(decoded(text), "intake")
    assert not result["success"]
    assert "intake_suggestion" not in result


@pytest.mark.parametrize(
    "text,code,pain,regions",
    [
        ("tôi bị đau ngực", "PAIN", True, ["CHEST"]),
        ("tôi bị đau đầu", "PAIN", True, ["HEAD"]),
        ("tôi bị đau bụng", "PAIN", True, []),
        ("tôi bị đau lưng", "PAIN", True, []),
        ("tôi bị đau bụng dưới", "PAIN", True, ["ABDOMEN_LOWER"]),
        ("tôi bị ho", "COUGH", None, []),
        ("tôi bị sốt", "FEVER", None, []),
        ("tôi cảm thấy khó thở", "BREATH_DIFFICULTY", None, []),
    ],
)
def test_sentence_intake_returns_only_asserted_fields(text, code, pain, regions) -> None:
    result = map_candidate(decoded(text), "intake")
    assert result["intake_suggestion"] == {
        "chief_complaint_code": code, "pain_present": pain, "body_regions": regions,
    }
    assert "translation" not in result


def test_sentence_response_contract_and_legacy_context(monkeypatch) -> None:
    monkeypatch.setattr(v2_runtime, "infer", AsyncMock(return_value=decoded("tôi bị đau ngực")))
    with TestClient(app) as client:
        result = client.post("/api/vsl/predict", json={
            "frames": frames(), "context_step": "intake",
        }).json()
        assert result["intake_suggestion"] == {
            "chief_complaint_code": "PAIN", "pain_present": True, "body_regions": ["CHEST"],
        }
        legacy = client.post("/api/vsl/predict", json={
            "frames": frames(), "context_step": "location",
        }).json()
        assert legacy["gloss"] == "NGỰC" and legacy["intake_suggestion"] is None
        assert client.post("/api/vsl/predict", json={
            "hands": [], "context_step": "intake",
        }).status_code == 422


@pytest.mark.parametrize(
    "result, hint", [({}, "worker_unavailable"), (decoded(""), "phrase_not_supported")]
)
def test_intake_distinguishes_missing_worker_result_from_abstention(monkeypatch, result, hint):
    monkeypatch.setattr(v2_runtime, "infer", AsyncMock(return_value=result))
    with TestClient(app) as client:
        body = client.post("/api/vsl/predict", json={
            "frames": frames(), "context_step": "intake",
        }).json()
    assert body["suggested_next_step"] == hint
    assert body["gloss"] == "UNKNOWN" and body["intake_suggestion"] is None



@pytest.mark.parametrize(
    "decoded_result,hint",
    [
        ({"translation": "", "mean_token_probability": 0,
          "reason": "no_face_landmarks"}, "face_not_tracked"),
        ({"translation": "", "mean_token_probability": 0,
          "reason": "no_clear_hand_motion"}, "hand_motion_unclear"),
        (decoded("tôi bị đau ngực", 0.69), "model_score_low"),
        (decoded("tôi bị đau ngực và ho"), "phrase_not_supported"),
    ],
)
def test_intake_rejection_hints_do_not_expose_decoder_or_create_suggestion(
    monkeypatch, decoded_result, hint
):
    monkeypatch.setattr(v2_runtime, "infer", AsyncMock(return_value=decoded_result))
    with TestClient(app) as client:
        body = client.post("/api/vsl/predict", json={
            "frames": frames(), "context_step": "intake",
        }).json()
    assert body["success"] is False and body["gloss"] == "UNKNOWN"
    assert body["intake_suggestion"] is None and body["suggested_next_step"] == hint
    assert "translation" not in body and "mean_token_probability" not in body
    assert "suggested_next_step" not in map_candidate(decoded_result, "symptom")


@pytest.mark.parametrize("score", [float("nan"), float("inf"), -0.1, 1.1, "bad"])
def test_invalid_scores_never_produce_misleading_low_score_hint(score):
    body = map_candidate(decoded("tôi bị đau ngực", score), "intake")
    assert body["gloss"] == "UNKNOWN" and "suggested_next_step" not in body


def test_structured_suggestion_cannot_deny_pain_or_attach_unrelated_location() -> None:
    from pydantic import ValidationError

    from app.domain.vsl import IntakeSuggestion

    for payload in [
        {"chief_complaint_code": "PAIN", "pain_present": None},
        {"chief_complaint_code": "PAIN", "pain_present": False},
        {"chief_complaint_code": "COUGH", "body_regions": ["CHEST"]},
        {"chief_complaint_code": "FEVER", "pain_present": True},
        {"chief_complaint_code": "PAIN", "pain_present": True, "severity": 8},
    ]:
        with pytest.raises(ValidationError):
            IntakeSuggestion.model_validate(payload)


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
