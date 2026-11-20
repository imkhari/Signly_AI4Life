"""Offline camera evaluation. Run from the repository root with python -m."""

import argparse
import contextlib
import hashlib
import json
import math
import statistics
import subprocess
import sys
import time
from pathlib import Path
from types import SimpleNamespace
from typing import Any
from unittest.mock import patch

from AI_model import inference
from AI_model.evaluation.checkpoint_audit import audit_checkpoint
from AI_model.evaluation.sequence_metrics import (
    sequence_metrics,
    validate_prediction_sources,
)

ROOT = Path(__file__).resolve().parents[2]


def validate_dataset(data: dict[str, Any]) -> None:
    if not isinstance(data, dict):
        raise TypeError("Dataset must be a JSON object")
    if data.get("kind") not in ("synthetic", "consented_landmarks"):
        raise ValueError("Dataset kind must be synthetic or consented_landmarks")
    if not data.get("provenance") or not data.get("license_or_consent"):
        raise ValueError("Provenance and permission metadata are required")
    clips = data.get("clips", [])
    if not isinstance(clips, list) or not clips:
        raise ValueError("Dataset contains no clips")
    identifiers: set[str] = set()
    signers: dict[str, str] = {}
    contents: dict[str, str] = {}
    for clip in clips:
        for field in ("clip_id", "signer_id", "split", "expected", "context_step", "frames"):
            if field not in clip:
                raise ValueError(f"Missing clip field: {field}")
        if any(
            not isinstance(clip[field], str) or not clip[field]
            for field in ("clip_id", "signer_id", "expected")
        ):
            raise ValueError("Clip identifiers and expected label must be nonempty strings")
        if clip["context_step"] not in ("symptom", "location", "severity", "general"):
            raise ValueError("Unsupported context_step")
        if clip["clip_id"] in identifiers:
            raise ValueError("Duplicate clip_id")
        identifiers.add(clip["clip_id"])
        split = clip["split"]
        if split not in ("train", "validation", "test"):
            raise ValueError("Unknown split")
        signer = clip["signer_id"]
        if signer in signers and signers[signer] != split:
            raise ValueError("Signer leakage across splits")
        signers[signer] = split
        content = hashlib.sha256(
            json.dumps([frame["hands"] for frame in clip["frames"]], sort_keys=True).encode()
        ).hexdigest()
        if content in contents and contents[content] != split:
            raise ValueError("Duplicate clip content across splits")
        contents[content] = split
        previous = -1.0
        if not clip["frames"]:
            raise ValueError("Empty clip")
        for frame in clip["frames"]:
            stamp = frame["timestamp_ms"]
            if (
                isinstance(stamp, bool)
                or not isinstance(stamp, (int, float))
                or not math.isfinite(stamp)
                or stamp < 0
                or stamp <= previous
            ):
                raise ValueError("Frame timestamps must be finite, nonnegative and increasing")
            previous = stamp
            for hand in frame["hands"]:
                if len(hand["landmarks"]) != 21:
                    raise ValueError("Each hand must contain exactly 21 points")
                for point in hand["landmarks"]:
                    if any(
                        isinstance(point[axis], bool)
                        or not isinstance(point[axis], (int, float))
                        or not math.isfinite(point[axis])
                        for axis in ("x", "y", "z")
                    ):
                        raise ValueError("Non-finite landmark")
    if data["kind"] == "consented_landmarks" and set(signers.values()) != {
        "train",
        "validation",
        "test",
    }:
        raise ValueError("Real evaluation requires all split memberships for leakage checks")
    if not any(clip["split"] == "test" for clip in clips):
        raise ValueError("No test clips")


def metrics(rows: list[dict[str, Any]], labels: list[str]) -> dict[str, Any]:
    total = len(rows)
    accepted = sum(row["predicted"] != "UNKNOWN" for row in rows)
    correct = sum(row["predicted"] == row["expected"] for row in rows)
    negatives = [row for row in rows if row["expected"] == "UNKNOWN"]
    false_accepts = sum(row["predicted"] != "UNKNOWN" for row in negatives)
    per_label = {}
    scored_labels = sorted((set(labels) | {row["predicted"] for row in rows}) - {"UNKNOWN"})
    for label in scored_labels:
        tp = sum(row["expected"] == label and row["predicted"] == label for row in rows)
        fp = sum(row["expected"] != label and row["predicted"] == label for row in rows)
        fn = sum(row["expected"] == label and row["predicted"] != label for row in rows)
        precision = tp / (tp + fp) if tp + fp else 0.0
        recall = tp / (tp + fn) if tp + fn else 0.0
        per_label[label] = {
            "tp": tp,
            "fp": fp,
            "fn": fn,
            "support": tp + fn,
            "precision": precision,
            "recall": recall,
            "f1": 2 * precision * recall / (precision + recall) if precision + recall else 0.0,
        }
    return {
        "clips": total,
        "correct": correct,
        "accepted": accepted,
        "coverage": accepted / total if total else 0.0,
        "rejection_rate": (total - accepted) / total if total else 0.0,
        "accuracy": correct / total if total else 0.0,
        "negative_clips": len(negatives),
        "false_accepts": false_accepts,
        "false_accept_rate": false_accepts / len(negatives) if negatives else None,
        "macro_f1": statistics.mean(value["f1"] for value in per_label.values())
        if scored_labels
        else None,
        "scored_labels": scored_labels,
        "per_label": per_label,
        "errors": [row for row in rows if row["predicted"] != row["expected"]],
    }


def evaluate(data: dict[str, Any]) -> dict[str, Any]:
    validate_dataset(data)
    clips = [clip for clip in data["clips"] if clip["split"] == "test"]
    with contextlib.redirect_stdout(sys.stderr):
        engine = inference.VSLInferenceEngine(checkpoint_path=str(ROOT / "AI_model/no-checkpoint"))
    replays = []
    raw_rows = []
    timings = []
    for clip in clips:
        engine.motion_buffer.clear()
        predictions = []
        for frame in clip["frames"]:
            clock = SimpleNamespace(time=lambda stamp=frame["timestamp_ms"]: stamp / 1000)
            started = time.perf_counter()
            with patch.object(inference, "time", clock):
                result = engine.predict_from_hands(frame["hands"], clip["context_step"])
            timings.append((time.perf_counter() - started) * 1000)
            predictions.append({"timestamp_ms": frame["timestamp_ms"], "prediction": result})
        replays.append(predictions)
        last = predictions[-1]["prediction"]
        raw_rows.append(
            {
                "clip_id": clip["clip_id"],
                "expected": clip["expected"],
                "predicted": last["gloss"] if last.get("success") else "UNKNOWN",
                "negative_kind": clip.get("negative_kind"),
            }
        )
    replay = subprocess.run(
        ["node", str(Path(__file__).with_name("replay_stabilizer.cjs"))],
        input=json.dumps(replays),
        text=True,
        capture_output=True,
        check=True,
        timeout=60,
    )
    temporal = json.loads(replay.stdout)
    stable_rows: list[dict[str, Any]] = []
    for clip, row, candidates in zip(clips, raw_rows, temporal["clips"], strict=True):
        stable_rows.append(
            {
                **row,
                "predicted": candidates[0]["gloss"] if candidates else "UNKNOWN",
                "first_emission_ms": candidates[0]["timestamp_ms"] if candidates else None,
                "first_candidate_delay_ms": candidates[0]["timestamp_ms"]
                - clip["frames"][0]["timestamp_ms"]
                if candidates
                else None,
                "emitted_candidates": [candidate["gloss"] for candidate in candidates],
            }
        )
    labels = sorted({clip["expected"] for clip in clips} - {"UNKNOWN"})
    return {
        "kind": data["kind"],
        "scope": "offline landmarks and actual frontend stabilizer",
        "independent_signer_evaluation": data["kind"] == "consented_landmarks",
        "labels": labels,
        "stabilizer_options": temporal["options"],
        "raw_final_frame": metrics(raw_rows, labels),
        "stabilized_first_candidate": metrics(stable_rows, labels),
        "offline_frame_latency_ms": {
            "median": statistics.median(timings),
            "max": max(timings),
        },
        "accepted_candidate_delays_ms": [
            row["first_candidate_delay_ms"]
            for row in stable_rows
            if row["first_candidate_delay_ms"] is not None
        ],
        "limitations": [
            "Synthetic results measure fixture behavior only.",
            "Camera capture, MediaPipe, HTTP, UI context filters "
            "and patient acceptance are excluded.",
            "Raw final frame and first stable candidate use different clip decision policies.",
            "No learned classifier is evaluated by this baseline.",
            "Macro-F1 includes unexpected predicted labels, excludes UNKNOWN; "
            "false accepts are reported separately.",
            "Offline frame timing includes clock instrumentation overhead.",
        ],
        "clip_results": stable_rows,
        "source_sha256": {
            str(path.relative_to(ROOT)): hashlib.sha256(path.read_bytes()).hexdigest()
            for path in (
                ROOT / "AI_model/inference.py",
                ROOT / "frontend/src/services/vsl/GestureStabilizer.ts",
            )
        },
    }


def score_candidate(
    data: dict[str, Any], candidate: dict[str, Any], expected_checkpoint_sha256: str | None = None
) -> dict[str, Any]:
    validate_dataset(data)
    if (
        not candidate.get("model_name")
        or candidate.get("decision_policy") != "first_stable_candidate"
    ):
        raise ValueError("Candidate requires model_name and first_stable_candidate policy")
    tests = {clip["clip_id"]: clip for clip in data["clips"] if clip["split"] == "test"}
    training_signers = candidate.get("training_signers")
    if not isinstance(training_signers, list) or any(
        not isinstance(signer, str) or not signer for signer in training_signers
    ):
        raise ValueError("Candidate requires a list of training_signers")
    held_out = {clip["signer_id"] for clip in data["clips"] if clip["split"] != "train"}
    if set(training_signers) & held_out:
        raise ValueError("Candidate training signers overlap held-out data")
    predictions = candidate.get("predictions", [])
    identifiers = [prediction["clip_id"] for prediction in predictions]
    if len(set(identifiers)) != len(identifiers) or set(identifiers) != set(tests):
        raise ValueError("Candidate predictions must match every test clip exactly once")
    if expected_checkpoint_sha256 is not None:
        validate_prediction_sources(candidate, expected_checkpoint_sha256)
    rows = []
    for prediction in predictions:
        if not isinstance(prediction.get("predicted"), str) or not prediction["predicted"]:
            raise ValueError("Candidate prediction must be a nonempty label")
        rows.append(
            {
                "clip_id": prediction["clip_id"],
                "expected": tests[prediction["clip_id"]]["expected"],
                "predicted": prediction["predicted"],
            }
        )
    labels = sorted({clip["expected"] for clip in tests.values()} - {"UNKNOWN"})
    result = {
        "model_name": candidate["model_name"],
        "provenance": "user-supplied predictions and training metadata; not independently verified",
        "decision_policy": candidate["decision_policy"],
        "metrics": metrics(rows, labels),
        "source_declarations_checked": expected_checkpoint_sha256 is not None,
        "runtime_independently_verified": False,
    }
    if any("expected_glosses" in clip for clip in tests.values()):
        if any("expected_glosses" not in clip for clip in tests.values()) or any(
            "predicted_glosses" not in prediction for prediction in predictions
        ):
            raise ValueError("Sequence scoring requires gloss sequences for every test clip")
        result["sequences"] = sequence_metrics([
            {
                "clip_id": prediction["clip_id"],
                "expected_glosses": tests[prediction["clip_id"]]["expected_glosses"],
                "predicted_glosses": prediction["predicted_glosses"],
            }
            for prediction in predictions
        ])
    return result


def audit() -> dict[str, Any]:
    vocab = json.loads((ROOT / "AI_model/data/medical_vsl_30.json").read_text())
    labels = json.loads((ROOT / "AI_model/data/voya_labels.json").read_text())
    items = [item for group in vocab.values() for item in group]
    return {
        "vocabulary_count": len(items),
        "voya_label_count": len(labels),
        "voya_linked_count": sum(bool(item.get("class_id")) for item in items),
        "torch_importable_by_engine": inference.HAS_TORCH,
        "checkpoints": [
            audit_checkpoint(path) for path in sorted((ROOT / "AI_model/checkpoints").glob("*.pth"))
        ],
        "label_selection": "geometry rules; optional checkpoint adjusts confidence by at most 0.04",
        "training_data": "not supplied",
        "independent_test_data": "not supplied",
        "checkpoint_source_license_and_199_class_order": "unverified",
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Kiểm kê và đánh giá camera offline")
    inputs = parser.add_mutually_exclusive_group()
    inputs.add_argument("--dataset", type=Path)
    inputs.add_argument("--synthetic", action="store_true")
    parser.add_argument("--candidate", type=Path)
    parser.add_argument("--checkpoint-sha256")
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if args.candidate and not (args.dataset or args.synthetic):
        parser.error("--candidate requires --dataset or --synthetic")
    if args.checkpoint_sha256 and not args.candidate:
        parser.error("--checkpoint-sha256 requires --candidate")
    report: dict[str, Any] = {"audit": audit()}
    if args.dataset or args.synthetic:
        if args.synthetic:
            from AI_model.evaluation.synthetic_cases import dataset

            raw = json.dumps(dataset(), sort_keys=True).encode()
        else:
            raw = args.dataset.read_bytes()
        try:
            report["evaluation"] = evaluate(json.loads(raw))
        except (ValueError, KeyError, TypeError) as exc:
            parser.error(str(exc))
        if args.candidate:
            try:
                report["candidate"] = score_candidate(
                    json.loads(raw), json.loads(args.candidate.read_bytes()), args.checkpoint_sha256
                )
            except (ValueError, KeyError, TypeError) as exc:
                parser.error(str(exc))
        report["dataset_sha256"] = hashlib.sha256(raw).hexdigest()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(f"Đã ghi báo cáo tại {args.output}")


if __name__ == "__main__":
    main()
