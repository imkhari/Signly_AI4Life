import copy
import hashlib
import json
import sys
from pathlib import Path
from typing import Any

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

from AI_model.evaluation.evaluate import score_candidate  # noqa: E402
from AI_model.evaluation.model_package import REQUIRED_ROLES, inspect_package  # noqa: E402
from AI_model.evaluation.sequence_metrics import (  # noqa: E402
    sequence_metrics,
    validate_prediction_sources,
)
from AI_model.evaluation.stability_suite import evaluate_stability  # noqa: E402
from AI_model.evaluation.synthetic_cases import dataset  # noqa: E402


def declared_package(root: Path) -> dict[str, Any]:
    artifacts = []
    for role in sorted(REQUIRED_ROLES):
        content = f"Synthetic integrity test only: {role}".encode()
        (root / role).write_bytes(content)
        artifacts.append(
            {
                "role": role,
                "path": role,
                "sha256": hashlib.sha256(content).hexdigest(),
            }
        )
    return {
        "version": 1,
        "model_name": "synthetic-test",
        "provenance": "test fixture",
        "license_or_permission": "test fixture",
        "preprocessing": "not a real model",
        "artifacts": artifacts,
    }


def test_package_integrity_never_claims_runtime_or_recognition_quality(tmp_path: Path) -> None:
    manifest = declared_package(tmp_path)
    report = inspect_package(tmp_path, manifest)
    assert report["declared_integrity_verified"] is True
    assert report["runtime_status"] == "not_tested"
    assert report["recognition_quality"] == "not_evaluated"
    (tmp_path / "checkpoint").write_bytes(b"tampered")
    report = inspect_package(tmp_path, manifest)
    assert report["declared_integrity_verified"] is False
    assert (
        next(row for row in report["artifacts"] if row["role"] == "checkpoint")["status"]
        == "mismatch"
    )


def test_package_missing_role_permission_or_checksum_blocks_integrity(tmp_path: Path) -> None:
    manifest = declared_package(tmp_path)
    for missing in ("license_or_permission", "checksum", "role"):
        changed = copy.deepcopy(manifest)
        if missing == "checksum":
            changed["artifacts"][0]["sha256"] = ""
        elif missing == "role":
            changed["artifacts"].pop()
        else:
            changed[missing] = ""
        assert inspect_package(tmp_path, changed)["declared_integrity_verified"] is False


@pytest.mark.parametrize("path", ["../outside", "/tmp/outside"])
def test_package_rejects_paths_outside_root(tmp_path: Path, path: str) -> None:
    manifest = declared_package(tmp_path)
    manifest["artifacts"][0]["path"] = path
    with pytest.raises(ValueError, match="within package root"):
        inspect_package(tmp_path, manifest)


def test_package_rejects_symlink_outside_root(tmp_path: Path) -> None:
    root = tmp_path / "package"
    root.mkdir()
    outside = tmp_path / "outside"
    outside.write_text("synthetic")
    (root / "escaped").symlink_to(outside)
    manifest = declared_package(root)
    manifest["artifacts"][0]["path"] = "escaped"
    with pytest.raises(ValueError, match="within package root"):
        inspect_package(root, manifest)


def test_optional_ood_bank_is_reported_missing_not_invented(tmp_path: Path) -> None:
    manifest = declared_package(tmp_path)
    manifest["artifacts"].append({"role": "ood_bank", "path": "absent", "sha256": ""})
    report = inspect_package(tmp_path, manifest)
    assert report["declared_integrity_verified"] is True
    assert report["artifacts"][-1]["status"] == "missing"


@pytest.mark.parametrize(
    "engine,input_source",
    [
        ("reference", "observed_landmarks"),
        ("mock", "observed_landmarks"),
        ("learned_model", "filename_selected_sample"),
        ("learned_model", None),
    ],
)
def test_strict_benchmark_excludes_reference_or_replaced_inputs(
    engine: str,
    input_source: str | None,
) -> None:
    candidate: dict[str, Any] = {
        "checkpoint_sha256": "a" * 64,
        "predictions": [{"engine_source": engine, "input_source": input_source}],
    }
    with pytest.raises(ValueError):
        validate_prediction_sources(candidate, "a" * 64)


def test_sequence_metrics_count_substitution_deletion_insertion_and_negative_output() -> None:
    report = sequence_metrics(
        [
            {
                "clip_id": "a",
                "expected_glosses": ["A", "B", "C"],
                "predicted_glosses": ["A", "X", "C", "D"],
            },
            {"clip_id": "b", "expected_glosses": ["A", "B"], "predicted_glosses": ["A"]},
            {"clip_id": "c", "expected_glosses": [], "predicted_glosses": ["Q"]},
            {"clip_id": "d", "expected_glosses": [], "predicted_glosses": []},
        ]
    )
    assert report["substitutions"] == 1
    assert report["deletions"] == 1
    assert report["insertions"] == 2
    assert report["wer"] == 0.8
    assert report["hallucinated_negative_clips"] == 1
    assert report["exact_matches"] == 1
    assert (
        sequence_metrics(
            [
                {"expected_glosses": [], "predicted_glosses": ["Q"]},
            ]
        )["wer"]
        is None
    )


@pytest.mark.parametrize("tokens", ["A B", [""], [False], None])
def test_sequence_metrics_reject_ambiguous_token_lists(tokens: Any) -> None:
    with pytest.raises(ValueError, match="lists of nonempty tokens"):
        sequence_metrics([{"expected_glosses": ["A"], "predicted_glosses": tokens}])


def test_candidate_sequence_scoring_and_source_declarations() -> None:
    data = dataset()
    for clip in data["clips"]:
        clip["expected_glosses"] = [] if clip["expected"] == "UNKNOWN" else [clip["expected"]]
    candidate: dict[str, Any] = {
        "model_name": "synthetic-declaration-test",
        "training_signers": [],
        "checkpoint_sha256": "a" * 64,
        "decision_policy": "first_stable_candidate",
        "predictions": [
            {
                "clip_id": clip["clip_id"],
                "predicted": clip["expected"],
                "predicted_glosses": clip["expected_glosses"],
                "engine_source": "learned_model",
                "input_source": "observed_landmarks",
            }
            for clip in data["clips"]
        ],
    }
    report = score_candidate(data, candidate, "a" * 64)
    assert report["sequences"]["wer"] == 0
    assert report["source_declarations_checked"] is True
    assert report["runtime_independently_verified"] is False
    with pytest.raises(ValueError, match="SHA-256 mismatch"):
        score_candidate(data, candidate, "b" * 64)
    del candidate["predictions"][0]["predicted_glosses"]
    with pytest.raises(ValueError, match="every test clip"):
        score_candidate(data, candidate, "a" * 64)


def test_temporal_replays_use_actual_stabilizer_and_preserve_failure_evidence() -> None:
    report = evaluate_stability()
    rows = {row["case_id"]: row for row in report["results"]}
    assert rows["stable_hold"]["actual"] == ["NGỰC"]
    assert rows["short_hold"]["actual"] == []
    assert rows["lost_hand"]["actual"] == []
    assert rows["cooldown"]["actual"] == ["NGỰC"]
    assert rows["delivery_gap"]["expected"] == []
    assert report["matched"] == sum(row["matches_expectation"] for row in report["results"])
    json.dumps(report, allow_nan=False)
