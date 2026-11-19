import csv
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))
from AI_model.vsl_v2.trials import (  # noqa: E402
    FIELDS,
    counts,
    outcome,
    profile,
    protocol,
    read_trials,
    summarize,
)

IDENTIFIER = "a" * 64


def row(intent="HEAD_SYMPTOM", actual=None, participant="P01", evidence="synthetic"):
    item = next(item for item in protocol()["intents"] if item["id"] == intent)
    label = item["expected"] if actual is None else actual
    wrong = label not in ("UNKNOWN", item["expected"])
    return dict(
        zip(
            FIELDS,
            [
                "T0001",
                participant,
                "internal",
                protocol()["participants"][participant],
                "learning",
                "D01",
                "ready",
                intent,
                item["context"],
                "normal",
                item["expected"],
                label,
                str(wrong).lower(),
                outcome(item["expected"], label, wrong),
                "100" if label != "UNKNOWN" else "",
                "90",
                "30",
                "1200",
                "accepted" if label != "UNKNOWN" else "unknown",
                IDENTIFIER,
                evidence,
            ],
        )
    )


def load(tmp_path, records):
    path = tmp_path / "trials.csv"
    with path.open("w", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(records)
    return read_trials(path, IDENTIFIER)


def test_empty_trials_remain_pending_with_null_rates(tmp_path):
    report = summarize(load(tmp_path, []), IDENTIFIER)
    assert report["status"] == "CANDIDATE"
    assert report["live"]["trials"] == 0
    assert report["live"]["positive_correct_rate"] is None
    assert not report["numeric_criteria_met"]


def test_rejections_and_wrong_exposure_are_not_hidden(tmp_path):
    records = [
        row(actual="ĐAU"),
        row(actual="HO"),
        row(actual="UNKNOWN"),
        row("NEG_OUTSIDE", actual="HO"),
    ]
    for i, record in enumerate(records):
        record["trial_id"] = f"T{i + 1:04}"
    result = counts(load(tmp_path, records))
    assert result["positive_trials"] == 3
    assert result["positive_correct_rate"] == pytest.approx(1 / 3)
    assert result["per_trial_suggestion_precision"] == 0.5
    assert result["negative_false_suggestion_rate"] == 1
    records[0].update(ever_wrong_candidate="true", outcome="wrong")
    assert load(tmp_path, records)[0]["outcome"] == "wrong"


@pytest.mark.parametrize(
    "key,value",
    [
        ("participant_code", "real name"),
        ("split", "final"),
        ("expected_label", "SỐT"),
        ("displayed_candidate", "arbitrary free text"),
        ("profile_id", "b" * 64),
        ("candidate_latency_ms", "nan"),
        ("candidate_latency_ms", "-1"),
        ("condition", "anything"),
        ("worker_state", "anything"),
        ("reason", "private text"),
        ("outcome", "rejected"),
    ],
)
def test_uncontrolled_or_inconsistent_records_are_rejected(tmp_path, key, value):
    record = row()
    record[key] = value
    with pytest.raises(ValueError):
        load(tmp_path, [record])


def test_wrong_candidate_and_missing_timing_cannot_be_reported_as_correct(tmp_path):
    record = row(actual="HO")
    record["ever_wrong_candidate"] = "false"
    with pytest.raises(ValueError):
        load(tmp_path, [record])
    record = row()
    record["candidate_latency_ms"] = ""
    with pytest.raises(ValueError):
        load(tmp_path, [record])
    record = row(actual="UNKNOWN")
    record["candidate_latency_ms"] = "100"
    with pytest.raises(ValueError):
        load(tmp_path, [record])


def final_records(evidence="live_internal"):
    records = []
    for item in protocol()["intents"]:
        for _ in range(5):
            record = row(item["id"], participant="P03", evidence=evidence)
            record["trial_id"] = f"T{len(records) + 1:04}"
            records.append(record)
    return records


def test_numeric_gate_never_declares_freeze_and_excludes_synthetic(tmp_path):
    synthetic = load(tmp_path, final_records("synthetic"))
    assert not summarize(synthetic, IDENTIFIER)["numeric_criteria_met"]
    assert summarize(synthetic, IDENTIFIER)["live"]["trials"] == 0
    records = load(tmp_path, final_records())
    report = summarize(records, IDENTIFIER)
    assert report["numeric_criteria_met"]
    assert report["status"] == "CANDIDATE"
    records[0]["outcome"] = "wrong"
    records[1]["outcome"] = "rejected"
    assert not summarize(records, IDENTIFIER)["numeric_criteria_met"]


def test_any_false_negative_trial_suggestion_prevents_numeric_gate(tmp_path):
    records = final_records()
    record = next(r for r in records if r["intent_id"] == "NEG_MOTION")
    record.update(
        displayed_candidate="HO",
        ever_wrong_candidate="true",
        outcome="wrong",
        candidate_latency_ms="100",
        reason="accepted",
    )
    assert not summarize(load(tmp_path, records), IDENTIFIER)["numeric_criteria_met"]


def test_duplicate_trials_and_raw_extra_columns_are_rejected(tmp_path):
    with pytest.raises(ValueError):
        load(tmp_path, [row(), row()])
    path = tmp_path / "raw.csv"
    path.write_text("frames,patient_name\n[],example\n")
    with pytest.raises(ValueError):
        read_trials(path, IDENTIFIER)


def test_aborted_negative_trial_is_not_a_successful_gate_sample(tmp_path):
    records = final_records()
    record = next(r for r in records if r["intent_id"] == "NEG_REST")
    record.update(reason="cancelled", outcome="aborted")
    assert not summarize(load(tmp_path, records), IDENTIFIER)["numeric_criteria_met"]


def test_median_is_correct_for_an_even_number_of_samples(tmp_path):
    records = [row(), row()]
    records[1].update(trial_id="T0002", candidate_latency_ms="300")
    assert counts(load(tmp_path, records))["candidate_latency_median_ms"] == 200


def test_profile_binds_sources_and_artifact_identifiers():
    result = profile()
    assert len(result["profile_id"]) == 64
    assert result["status"] == "CANDIDATE"
    assert "checkpoint_sha256" in result["sources"]


def test_invalid_capture_does_not_count_as_valid_tracking_negative_evidence(tmp_path):
    records = final_records()
    record = next(r for r in records if r["intent_id"] == "NEG_REST")
    record.update(reason="missing_shoulders", frame_count="2", response_latency_ms="")
    report = summarize(load(tmp_path, records), IDENTIFIER)
    assert not report["numeric_checks"]["NEG_REST"]


def test_archived_replay_audit_preserves_known_model_errors():
    from AI_model.vsl_v2.audit import audit

    result = audit()
    assert result["recomputed_word_metrics"]["clips"] == 300
    assert result["scope_projection"]["symptom"]["outcomes"]["wrong"] == 2
    assert result["ctc_output_enabled"] is False
