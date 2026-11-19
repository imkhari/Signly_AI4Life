"""JSON-lines worker. Numeric frames exist only in transient process memory."""

import json
import sys
from typing import Any

import numpy as np
import torch

from AI_model.vsl_v2.engine import V2Engine


def prepare_sequence(request: dict[str, Any]) -> np.ndarray:
    frames = np.asarray(request["frames"], dtype=np.float32)
    times = np.asarray(request["timestamps_ms"], dtype=np.float64)
    if (
        frames.ndim != 2
        or frames.shape[1] != 411
        or not 8 <= len(frames) <= 300
        or times.shape != (len(frames),)
        or not np.isfinite(frames).all()
        or not np.isfinite(times).all()
        or np.any(np.diff(times) <= 0)
        or times[-1] - times[0] > 10000
    ):
        raise ValueError("Invalid sequence shape/times")
    # Match training's 30 FPS velocity features, never persist a video/frame.
    target_count = min(300, int(np.floor((times[-1] - times[0]) * 0.03 + 1e-9)) + 1)
    if target_count < 8:
        raise ValueError("Insufficient sequence duration")
    targets = np.linspace(times[0], times[-1], target_count)
    upper = np.clip(np.searchsorted(times, targets, side="right"), 1, len(times) - 1)
    lower = upper - 1
    weight = ((targets - times[lower]) / (times[upper] - times[lower]))[:, None]
    a, b = frames[lower], frames[upper]
    nearest = np.where(weight < 0.5, a, b)
    return np.where((a != 0) & (b != 0), (1 - weight) * a + weight * b, nearest).astype(np.float32)


def predict_request(engine: V2Engine, request: dict[str, Any]) -> dict[str, Any]:
    frames = prepare_sequence(request)
    hands = frames[:, 285:]
    present = np.abs(hands).sum(axis=-1) > 0
    motion = float(np.linalg.norm(np.diff(hands, axis=0), axis=-1).mean())
    # Conservative engineering gates, not a calibrated OOD detector.
    if present.mean() < 0.5 or motion < 0.003:
        return {"translation": "", "mean_token_probability": 0.0, "reason": "no_clear_hand_motion"}
    return engine.decode_frames(frames)


def respond(engine: V2Engine, line: str) -> str:
    try:
        return json.dumps({"result": predict_request(engine, json.loads(line))}, allow_nan=False)
    except (ValueError, KeyError, TypeError, IndexError, RuntimeError):
        return json.dumps({"error": "invalid_or_unavailable_inference"})


def main() -> None:
    torch.set_num_threads(4)
    engine = V2Engine()
    print(json.dumps({"ready": True}), flush=True)
    for line in sys.stdin:
        print(respond(engine, line), flush=True)
        del line  # No last patient request retained while the process waits for input.


if __name__ == "__main__":
    main()
