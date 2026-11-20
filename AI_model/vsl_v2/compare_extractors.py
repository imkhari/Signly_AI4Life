"""Compare matching public-video frames; emit aggregate metrics and controlled suggestions."""

import argparse
import json
from pathlib import Path

import numpy as np
import torch

from AI_model.vsl_v2.engine import V2Engine
from AI_model.vsl_v2.worker import predict_request
from backend.app.ai.vsl_v2 import map_candidate


def differences(reference: np.ndarray, browser: np.ndarray) -> dict:
    if (reference.shape != browser.shape or reference.ndim != 2
            or reference.shape[1] != 411 or len(reference) == 0):
        raise ValueError("Expected equal T x 411 frame arrays")
    if not np.isfinite(reference).all() or not np.isfinite(browser).all():
        raise ValueError("Non-finite coordinates")
    groups = {}
    for name, start, end in [
        ("pose", 0, 75), ("face", 75, 285), ("left_hand", 285, 348), ("right_hand", 348, 411),
    ]:
        a = reference[:, start:end].reshape(len(reference), -1, 3)
        b = browser[:, start:end].reshape(len(browser), -1, 3)
        seen_a = np.any(a != 0, axis=-1)
        seen_b = np.any(b != 0, axis=-1)
        paired = seen_a & seen_b
        groups[name] = {
            "legacy_present_frames": int(seen_a.any(axis=1).sum()),
            "browser_present_frames": int(seen_b.any(axis=1).sum()),
            "paired_points": int(paired.sum()),
            "mean_abs_xy_difference": float(np.abs(a[paired, :2] - b[paired, :2]).mean())
            if paired.any() else None,
            "mean_abs_z_difference": float(np.abs(a[paired, 2] - b[paired, 2]).mean())
            if paired.any() else None,
            "mean_abs_xyz_difference": float(np.abs(a[paired] - b[paired]).mean())
            if paired.any() else None,
        }
    return groups


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    data = json.loads(args.input.read_text())
    legacy = data["legacy"]
    browser = data["browser"]
    if legacy["video_sha256"] != browser["video_sha256"]:
        raise ValueError("Different video inputs")
    a, b = np.array(legacy["frames"]), np.array(browser["frames"])
    groups = differences(a, b)
    torch.set_num_threads(4)
    engine = V2Engine()
    results = {}
    variants = {"legacy": a, "browser": b}
    legacy_web_groups = None
    if "legacy_web" in data:
        if data["legacy_web"]["video_sha256"] != legacy["video_sha256"]:
            raise ValueError("Legacy Web has different video input")
        variants["legacy_web"] = np.array(data["legacy_web"]["frames"])
        legacy_web_groups = differences(a, variants["legacy_web"])
    for name, frames in variants.items():
        times = (np.arange(len(frames)) * 1000 / legacy["fps"]).tolist()
        try:
            result = predict_request(engine, {"frames": frames.tolist(), "timestamps_ms": times})
            candidate = map_candidate(result, "intake")
            results[name] = {
                "gloss": candidate["gloss"],
                "suggestion": candidate.get("intake_suggestion"),
                "rejection_hint": candidate.get("suggested_next_step"),
            }
        except ValueError:
            results[name] = {"rejected_input": True}
    report = {
        "kind": "public_video_extractor_comparison", "video_sha256": legacy["video_sha256"],
        "frames": len(a), "source_fps": legacy["fps"], "groups": groups,
        "predictions": results, "legacy_web_groups": legacy_web_groups,
        "limitations": [
            "Public-video audit, not live signing or clinical validation.",
            "Identical RGB frames in the same order. Worker timestamps use source FPS.",
            "XYZ differences describe extractor drift, not recognition accuracy.",
            "Worker probe only. Browser capture rejection is not reproduced.",
        ],
    }
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2, allow_nan=False) + "\n")


if __name__ == "__main__":
    main()
