"""Read-only artifact and decoder-replay audit; never receives live camera input."""

import argparse
import hashlib
import json
import sys
from collections import Counter
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend"))
from app.ai.vsl_v2 import PHRASES, map_candidate  # noqa: E402

from AI_model.evaluation.sequence_metrics import sequence_metrics  # noqa: E402


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def audit(root: Path = ROOT) -> dict[str, Any]:
    directory = root / "AI_model/vsl_v2"
    model = json.loads((directory / "model-manifest.json").read_text())
    asset = json.loads((directory / "asset-manifest.json").read_text())
    replay_path = directory / "reports/greedy-replay.json"
    replay = json.loads(replay_path.read_text())
    tokens_path = directory / "translation-vocabulary.json"
    tokens = json.loads(tokens_path.read_text())
    checkpoint = root / "AI_model/checkpoints/vsl_v2.pt"
    artifacts = []
    inputs = [
        (checkpoint, model["runtime_checkpoint_sha256"]),
        (root / asset["path"], asset["sha256"]),
    ]
    inputs.extend((root / item["path"], item["sha256"]) for item in asset.get("legacy_files", []))
    for path, expected in inputs:
        actual = sha256(path) if path.is_file() else None
        artifacts.append(
            {
                "path": str(path.relative_to(root)),
                "sha256": actual,
                "expected_sha256": expected,
                "matches": actual == expected,
            }
        )
    predictions = replay["predictions"]
    if len({row["clip_id"] for row in predictions}) != len(predictions):
        raise ValueError("Duplicate replay identifiers")
    metrics = sequence_metrics(
        [
            {
                "clip_id": row["clip_id"],
                "expected_glosses": row["reference"].split(),
                "predicted_glosses": row["translation"].split(),
            }
            for row in predictions
        ]
    )
    supplied_path = root / "VSL_Checkpoints_v2/test_greedy_predictions.json"
    supplied_agreement = None
    if supplied_path.is_file():
        supplied = json.loads(supplied_path.read_text())
        expected = {row["video_id"]: row["hypothesis"] for row in supplied["predictions"]}
        supplied_agreement = len(expected) == len(predictions) and all(
            expected.get(row["clip_id"]) == row["translation"] for row in predictions
        )
    scope = {}
    for context in ("symptom", "location"):
        inside = []
        outside_projection = 0
        for row in predictions:
            # Reference only enters scoring here, never engine/worker input.
            expected = map_candidate(
                {"translation": row["reference"], "mean_token_probability": 1.0}, context
            )["gloss"]
            actual = map_candidate(row, context)["gloss"]
            if expected != "UNKNOWN":
                inside.append(
                    {
                        "clip_id": row["clip_id"],
                        "reference": row["reference"],
                        "expected": expected,
                        "actual": actual,
                        "outcome": "rejected"
                        if actual == "UNKNOWN"
                        else "correct"
                        if actual == expected
                        else "wrong",
                    }
                )
            elif actual != "UNKNOWN":
                outside_projection += 1
        scope[context] = {
            "reference_in_exact_allowlist": len(inside),
            "outcomes": dict(Counter(row["outcome"] for row in inside)),
            "records": inside,
            "projection_from_reference_outside_exact_allowlist": outside_projection,
        }
    mapping = [
        {"phrase": phrase, "symptom": labels[0], "location": labels[1]}
        for phrase, labels in PHRASES.items()
    ]
    return {
        "kind": "artifact_and_archived_decoder_replay_audit_not_live",
        "artifacts": artifacts,
        "translation_vocabulary_sha256": sha256(tokens_path),
        "translation_vocabulary_valid": len(tokens) == 442
        and len(set(tokens)) == 442
        and tokens[:5] == ["<pad>", "<bos>", "<eos>", "<unk>", "<blank>"],
        "runtime_python_exists": (root / "AI_model/runtime/.venv/bin/python").is_file(),
        "runtime_lock_sha256": sha256(root / "AI_model/runtime/requirements-lock.txt"),
        "ctc_output_enabled": False,
        "ctc_mapping_verified": model["ctc_mapping_verified"],
        "replay_sha256": sha256(replay_path),
        "matches_supplied_outputs": supplied_agreement,
        "recomputed_word_metrics": {
            k: v for k, v in metrics.items() if k not in ("errors", "limitations")
        },
        "allowlist": mapping,
        "scope_projection": scope,
        "limitations": [
            "Archived outputs: no new 300-clip inference or live camera test performed.",
            "Mapping projection excludes live capture, worker gates and UI stability.",
            "References outside the exact allowlist are not automatically negative/OOD examples.",
            "65 reference/version mismatches and unknown full training provenance remain.",
            "Vocabulary JSON hash and checks do not independently establish training provenance.",
        ],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Kiểm artifacts và chấm lại replay đã lưu")
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    result = audit()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False) + "\n")
    print(
        json.dumps(
            {
                "artifacts_match": all(row["matches"] for row in result["artifacts"]),
                "clips": result["recomputed_word_metrics"]["clips"],
                "scope_outcomes": {
                    context: data["outcomes"]
                    for context, data in result["scope_projection"].items()
                },
            },
            ensure_ascii=False,
        )
    )
    if (
        not all(row["matches"] for row in result["artifacts"])
        or not result["translation_vocabulary_valid"]
    ):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
