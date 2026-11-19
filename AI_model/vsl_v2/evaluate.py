"""Replay observed landmarks; reference files are used only for scoring after inference."""

import argparse
import json
import statistics
from pathlib import Path
from typing import Any

import numpy as np
import torch

from AI_model.evaluation.sequence_metrics import edit_counts, sequence_metrics
from AI_model.vsl_v2.engine import V2Engine


def evaluate(root: Path, provided: Path) -> dict[str, Any]:
    supplied = json.loads(provided.read_text())
    engine = V2Engine()
    rows = []
    records = []
    for sample in supplied["predictions"]:
        identifier = sample["video_id"]
        if Path(identifier).name != identifier:
            raise ValueError("Invalid sample identifier")
        result = engine.decode_frames(np.load(root / f"{identifier}.npy", allow_pickle=False))
        reference = sample["reference"].split()
        hypothesis = result["translation"].split()
        rows.append(
            {"clip_id": identifier, "expected_glosses": reference, "predicted_glosses": hypothesis}
        )
        records.append(
            {
                "clip_id": identifier,
                "reference": sample["reference"],
                **result,
                "matches_provided_prediction": result["translation"] == sample["hypothesis"],
            }
        )
    metrics = sequence_metrics(rows)
    mean_wer = statistics.mean(
        edit_counts(row["expected_glosses"], row["predicted_glosses"])["edits"]
        / len(row["expected_glosses"])
        for row in rows
    )
    return {
        "engine": "vsl_v2",
        "checkpoint_sha256": engine.sha256,
        "config_verification": engine.metadata["config_verification"],
        "metric_unit": "Vietnamese word tokens, punctuation retained; not CTC glosses",
        "metrics": {
            key: value for key, value in metrics.items() if key not in ("errors", "limitations")
        },
        "sentence_mean_wer": mean_wer,
        "provided_header": {key: value for key, value in supplied.items() if key != "predictions"},
        "reproduced_supplied_predictions": sum(
            row["matches_provided_prediction"] for row in records
        ),
        "forward_decode_ms_median": statistics.median(row["forward_decode_ms"] for row in records),
        "predictions": records,
        "limitations": [
            "Owner-supplied references; not independent annotation or clinical validation.",
            "Configuration recovered by shape/behavior matching; original training config absent.",
            "One recorded test signer, closed sentence set; no real webcam or rest/OOD evaluation.",
            "Word translation metrics cannot be compared directly with TinyCTC gloss metrics.",
        ],
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--landmarks-root", type=Path, required=True)
    parser.add_argument("--provided", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    torch.set_num_threads(4)
    report = evaluate(args.landmarks_root, args.provided)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2, allow_nan=False) + "\n")
    print(json.dumps({key: value for key, value in report.items() if key != "predictions"}))


if __name__ == "__main__":
    main()
