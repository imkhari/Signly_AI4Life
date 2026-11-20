"""Controlled perturbations of four pinned public clips; never a webcam accuracy test."""

import argparse
import hashlib
import json
import platform
from collections import Counter
from pathlib import Path
from typing import Any

import numpy as np
import torch

from AI_model.vsl_v2.engine import ROOT, V2Engine
from AI_model.vsl_v2.worker import predict_request, prepare_sequence
from backend.app.ai.vsl_v2 import map_candidate

COMMIT = "6c351e63c0b2cf1b5e2e8056bb3bf2d6f31dc90a"
CLIPS = {
    "SENT101_S06_R01_F": "PAIN+HEAD",
    "SENT103_S06_R01_F": "PAIN+CHEST",
    "SENT105_S06_R01_F": "FEVER",
    "SENT115_S06_R01_F": "BREATH_DIFFICULTY",
}


def load_public(root: Path, identifier: str) -> tuple[np.ndarray, str]:
    manifest = json.loads((ROOT / "AI_model/evaluation/reports/tiny-ctc-evidence/"
                           "landmark-manifest.json").read_text())
    expected = {row["id"]: row["sha256"] for row in manifest}
    if identifier not in CLIPS:
        raise ValueError("Only the four predefined public references are accepted")
    path = root / (identifier + ".npy")
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    if digest != expected[identifier]:
        raise ValueError("Public reference checksum mismatch")
    return np.load(path, allow_pickle=False), digest


def variants(raw: np.ndarray) -> list[tuple[str, np.ndarray, np.ndarray]]:
    times = np.arange(len(raw), dtype=np.float64) * 1000 / 30
    cases = [("source_30fps", raw.copy(), times.copy())]
    # Subsample observations while preserving their actual source timestamps.
    for fps in (15, 20, 24):
        indices = np.unique(np.r_[np.rint(np.arange(0, len(raw) - 1, 30 / fps)),
                                     len(raw) - 1].astype(int))
        cases.append((f"sample_{fps}fps", raw[indices].copy(), times[indices]))
    for factor in (.75, 1.25, 1.5, 2.0):
        cases.append((f"duration_x{factor:g}", raw.copy(), times * factor))
    # Repeated endpoints are synthetic holds, not recordings of genuine resting hands.
    for seconds in (.5, 1.0):
        count = round(seconds * 30)
        held = np.concatenate((np.repeat(raw[:1], count, axis=0), raw,
                               np.repeat(raw[-1:], count, axis=0)))
        cases.append((f"endpoint_holds_{seconds:g}s_each", held,
                      np.arange(len(held), dtype=np.float64) * 1000 / 30))
    face = raw.copy()
    face[:, 75:285] = 0
    cases.append(("face_missing", face, times.copy()))
    for name, start, end in (("left_hand_missing", 285, 348),
                             ("right_hand_missing", 348, 411)):
        missing = raw.copy()
        missing[:, start:end] = 0
        cases.append((name, missing, times.copy()))
    partial_face = raw.copy()
    partial_face[len(raw) // 3:2 * len(raw) // 3, 75:285] = 0
    cases.append(("face_missing_middle_third", partial_face, times.copy()))
    shoulder = raw.copy()
    shoulder[len(raw) // 2, 27:30] = 0
    cases.append(("one_frame_missing_shoulder", shoulder, times.copy()))
    hands = raw.copy()
    hands[:, 285:] = 0
    cases.append(("both_hands_missing", hands, times.copy()))
    mirrored = raw.copy()
    x = mirrored[:, 0::3]
    x[:] = np.where(x != 0, 1 - x, 0)
    cases.append(("input_mirrored_without_hand_swap", mirrored, times.copy()))
    return cases


def probe(engine: V2Engine, raw: np.ndarray, times: np.ndarray) -> dict[str, Any]:
    request = {"frames": raw, "timestamps_ms": times}
    try:
        prepared = prepare_sequence(request)
        result = predict_request(engine, request)
        mapped = map_candidate(result, "intake")
        suggestion = mapped.get("intake_suggestion")
        label = ("+".join([suggestion["chief_complaint_code"], *suggestion["body_regions"]])
                 if suggestion else "UNKNOWN")
        return {
            "label": label,
            "diagnostic_code": mapped.get("suggested_next_step"),
            "prepared_frames": len(prepared),
            "worker_reason": result.get("reason"),
        }
    except ValueError:
        return {"label": "UNKNOWN", "diagnostic_code": "invalid_input",
                "prepared_frames": None, "worker_reason": "rejected_before_decode"}


def run(root: Path) -> dict[str, Any]:
    torch.set_num_threads(4)
    engine = V2Engine()
    records = []
    sources = []
    for identifier, expected in CLIPS.items():
        raw, digest = load_public(root, identifier)
        sources.append({"clip_id": identifier, "sha256": digest, "frames": len(raw),
                        "assumed_fps": 30, "video_fps_verified": False})
        for name, frames, times in variants(raw):
            result = probe(engine, frames, times)
            # Reference comparison is strictly after inference and mapping.
            label = result["label"]
            records.append({
                "clip_id": identifier, "variant": name, "expected": expected,
                "input_frames": len(frames), "span_ms": float(times[-1] - times[0]),
                "exceeds_client_count_or_span_limit": bool(len(frames) > 180 or times[-1] > 6000),
                "outcome": "correct" if label == expected else
                           "rejected" if label == "UNKNOWN" else "wrong",
                **result,
            })
    hashes = {name: hashlib.sha256((ROOT / name).read_bytes()).hexdigest() for name in (
        "AI_model/vsl_v2/robustness.py", "AI_model/vsl_v2/engine.py",
        "AI_model/vsl_v2/worker.py", "backend/app/ai/vsl_v2.py",
    )}
    return {
        "kind": "public_landmark_controlled_perturbation_not_live",
        "checkpoint_sha256": engine.sha256,
        "source_commit": COMMIT, "code_hashes": hashes,
        "runtime": {"python": platform.python_version(), "torch": torch.__version__,
                    "numpy": np.__version__},
        "sources": sources, "records": records,
        "by_variant": {name: dict(Counter(r["outcome"] for r in records
                                         if r["variant"] == name))
                       for name, _, _ in variants(raw)},
        "limitations": [
            "Four already-opened public clips from S06; no independent final evaluation.",
            "Synthetic time/endpoint/missing-group perturbations are not actual signing trials.",
            "Assumed 30 FPS from source documentation; original videos unavailable.",
            "Does not exercise RGB extraction, capture UI, real click boundaries or tracking.",
            "Client-limit indicator only checks count/span, not capture eligibility.",
            "No parameter selection, webcam accuracy or readiness claim follows from this report.",
        ],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Chẩn độ nhạy trên4landmark công khai đã ghim")
    parser.add_argument("--landmarks-root", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists():
        raise ValueError("Keep previous evidence; choose a new report path")
    report = run(args.landmarks_root)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2, allow_nan=False) + "\n")
    print(json.dumps(report["by_variant"]))


if __name__ == "__main__":
    main()
