"""Strict anonymous trial records and an internal-demo gate; no camera data accepted."""

import argparse
import csv
import hashlib
import io
import json
import math
import statistics
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
PROTOCOL = ROOT / "frontend/src/services/vsl/validationProtocol.json"
FIELDS = [
    "trial_id",
    "participant_code",
    "cohort",
    "split",
    "signing_familiarity",
    "device_code",
    "worker_state",
    "intent_id",
    "context",
    "condition",
    "expected_label",
    "displayed_candidate",
    "ever_wrong_candidate",
    "outcome",
    "candidate_latency_ms",
    "response_latency_ms",
    "frame_count",
    "capture_duration_ms",
    "reason",
    "profile_id",
    "evidence_kind",
]
SOURCES = [
    "AI_model/vsl_v2/engine.py",
    "AI_model/vsl_v2/trials.py",
    "frontend/src/features/validation/VSLValidationPage.tsx",
    "AI_model/vsl_v2/worker.py",
    "backend/app/ai/vsl_v2.py",
    "backend/app/api/rest/vsl.py",
    "frontend/src/services/vsl/HolisticDetector.ts",
    "frontend/src/services/vsl/SentenceCapture.ts",
    "frontend/src/features/patient/components/VSLCameraView.tsx",
    "frontend/src/services/vsl/validationProtocol.json",
    "AI_model/vsl_v2/model-manifest.json",
    "AI_model/runtime/requirements-lock.txt",
    "frontend/package-lock.json",
    "AI_model/vsl_v2/asset-manifest.json",
    "AI_model/vsl_v2/translation-vocabulary.json",
]


def protocol() -> dict[str, Any]:
    return json.loads(PROTOCOL.read_text())


def profile(root: Path = ROOT) -> dict[str, Any]:
    sources = {path: hashlib.sha256((root / path).read_bytes()).hexdigest() for path in SOURCES}
    manifest = json.loads((root / "AI_model/vsl_v2/model-manifest.json").read_text())
    asset = json.loads((root / "AI_model/vsl_v2/asset-manifest.json").read_text())
    sources["checkpoint_sha256"] = manifest["runtime_checkpoint_sha256"]
    sources["holistic_task_sha256"] = asset["sha256"]
    policy = protocol()
    sources["policy_canonical_sha256"] = hashlib.sha256(
        json.dumps(policy, sort_keys=True).encode()
    ).hexdigest()
    identifier = hashlib.sha256(json.dumps(sources, sort_keys=True).encode()).hexdigest()
    return {
        "profile_id": identifier,
        "sources": sources,
        "protocol": policy["version"],
        "policy": policy,
        "status": "CANDIDATE",
        "live_trials": 0,
        "camera_data_persisted": False,
    }


def outcome(expected: str, actual: str, ever_wrong: bool, reason: str = "") -> str:
    if reason == "cancelled":
        return "aborted"
    if ever_wrong or (actual != "UNKNOWN" and actual != expected):
        return "wrong"
    if actual == expected:
        return "correct"
    return "rejected"


def finite_number(value: str, name: str, maximum: float) -> float | None:
    if value == "":
        return None
    try:
        number = float(value)
    except ValueError:
        raise ValueError(f"Invalid {name}") from None
    if not math.isfinite(number) or not 0 <= number <= maximum:
        raise ValueError(f"Invalid {name}")
    return number


def read_trials(
    path: Path, expected_profile: str, policy_override: dict[str, Any] | None = None
) -> list[dict[str, Any]]:
    policy = policy_override or protocol()
    intents = {item["id"]: item for item in policy["intents"]}
    with path.open(newline="", encoding="utf-8-sig") as file:
        reader = csv.DictReader(file)
        if reader.fieldnames != FIELDS:
            raise ValueError("Unexpected columns/order; raw data forbidden")
        rows = []
        seen = set()
        for index, row in enumerate(reader, 2):
            if None in row or any(value is None for value in row.values()):
                raise ValueError(f"Malformed CSV row {index}")
            code = row["trial_id"]
            if not code.startswith("T") or not code[1:].isdigit() or len(code) > 10 or code in seen:
                raise ValueError("Invalid/duplicate trial_id")
            seen.add(code)
            if row["participant_code"] not in policy["participants"]:
                raise ValueError("Unknown participant code")
            if row["split"] != policy["participants"][row["participant_code"]]:
                raise ValueError("Participant split mismatch")
            if row["worker_state"] not in ("ready", "not_ready", "unknown"):
                raise ValueError("Unknown worker state")
            if (
                row["cohort"] != "internal"
                or row["signing_familiarity"] not in policy["familiarities"]
            ):
                raise ValueError("Unsupported cohort/familiarity")
            if (
                row["device_code"] not in policy["devices"]
                or row["condition"] not in policy["conditions"]
            ):
                raise ValueError("Unknown device/condition")
            if row["intent_id"] not in intents:
                raise ValueError("Unknown intent")
            intent = intents[row["intent_id"]]
            if row["expected_label"] != intent["expected"] or row["context"] != intent["context"]:
                raise ValueError("Reference/context differs from predefined intent")
            if row["displayed_candidate"] not in policy["allowed_labels"]:
                raise ValueError("Uncontrolled output label")
            if row["profile_id"] != expected_profile:
                raise ValueError("Profile mismatch; separate configurations")
            if (
                row["evidence_kind"] not in ("live_internal", "synthetic")
                or row["reason"] not in policy["reasons"]
            ):
                raise ValueError("Unknown evidence/rejection reason")
            if row["ever_wrong_candidate"] not in ("true", "false"):
                raise ValueError("Invalid wrong-exposure flag")
            ever = row["ever_wrong_candidate"] == "true"
            if row["displayed_candidate"] not in ("UNKNOWN", row["expected_label"]) and not ever:
                raise ValueError("Wrong candidate exposure cannot be hidden")
            if row["outcome"] != outcome(
                row["expected_label"], row["displayed_candidate"], ever, row["reason"]
            ):
                raise ValueError("Outcome differs from recorded prediction")
            for key in ("candidate_latency_ms", "response_latency_ms", "capture_duration_ms"):
                row[key] = finite_number(row[key], key, 120000)
            displayed = row["displayed_candidate"] != "UNKNOWN" or ever
            if displayed != (row["candidate_latency_ms"] is not None):
                raise ValueError("Candidate timing required only when a candidate appeared")
            if row["capture_duration_ms"] is None:
                raise ValueError("Capture duration required")
            if not row["frame_count"].isdigit() or not 0 <= int(row["frame_count"]) <= 180:
                raise ValueError("Invalid frame_count")
            row["frame_count"] = int(row["frame_count"])
            row["kind"] = intent["kind"]
            rows.append(row)
    return rows


def percentile95(values: list[float]) -> float | None:
    if not values:
        return None
    return sorted(values)[math.ceil(0.95 * len(values)) - 1]


def counts(rows: list[dict[str, Any]]) -> dict[str, Any]:
    total = len(rows)
    tally = Counter(row["outcome"] for row in rows)
    positive = [row for row in rows if row["kind"] == "positive"]
    pos = Counter(row["outcome"] for row in positive)
    negatives = [row for row in rows if row["kind"].startswith("negative")]
    false = sum(row["outcome"] == "wrong" for row in negatives)
    valid_negatives = [row for row in negatives if row["kind"] == "negative_valid"]
    eligible_negatives = [
        row
        for row in valid_negatives
        if row["response_latency_ms"] is not None
        and row["frame_count"] >= 24
        and row["reason"] in ("accepted", "unknown")
    ]
    eligible_false = sum(row["outcome"] == "wrong" for row in eligible_negatives)
    times = [row["candidate_latency_ms"] for row in rows if row["candidate_latency_ms"] is not None]
    accepted = pos["correct"] + pos["wrong"]
    return {
        "trials": total,
        "outcomes": dict(tally),
        "positive_trials": len(positive),
        "aborted_trials": sum(r["outcome"] == "aborted" for r in rows),
        "positive_correct": pos["correct"],
        "positive_wrong": pos["wrong"],
        "positive_rejected": pos["rejected"],
        "positive_correct_rate": pos["correct"] / len(positive) if positive else None,
        "per_trial_suggestion_precision": pos["correct"] / accepted if accepted else None,
        "negative_trials": len(negatives),
        "valid_tracking_negative_attempts": len(valid_negatives),
        "valid_tracking_negative_submitted": len(eligible_negatives),
        "valid_tracking_negative_false_rate": eligible_false / len(eligible_negatives)
        if eligible_negatives
        else None,
        "negative_false_suggestions": false,
        "negative_false_suggestion_rate": false / len(negatives) if negatives else None,
        "candidate_latency_samples": len(times),
        "candidate_latency_p95_ms": percentile95(times),
        "candidate_latency_median_ms": statistics.median(times) if times else None,
        "response_samples": sum(row["response_latency_ms"] is not None for row in rows),
        "timeouts": sum(row["reason"] == "inference_timeout" for row in rows),
    }


def summarize(
    rows: list[dict[str, Any]], identifier: str, policy_override: dict[str, Any] | None = None
) -> dict[str, Any]:
    policy = policy_override or protocol()
    live = [r for r in rows if r["evidence_kind"] == "live_internal"]
    final = [r for r in live if r["split"] == "final" and r["condition"] == "normal"]
    checks = {}
    issues = []
    for intent in policy["intents"]:
        chosen = [r for r in final if r["intent_id"] == intent["id"]]
        if intent["kind"] == "positive":
            checks[intent["id"]] = (
                len(chosen) == policy["expected_per_intent_final"]
                and not any(r["outcome"] == "aborted" for r in chosen)
                and sum(r["outcome"] == "correct" for r in chosen)
                >= policy["required_correct_per_intent"]
            )
        elif intent["kind"].startswith("negative"):
            checks[intent["id"]] = (
                len(chosen) == policy["expected_per_negative_final"]
                and not any(r["outcome"] == "aborted" for r in chosen)
                and not any(r["outcome"] == "wrong" for r in chosen)
                and (
                    intent["kind"] != "negative_valid"
                    or all(
                        r["response_latency_ms"] is not None
                        and r["frame_count"] >= 24
                        and r["reason"] in ("accepted", "unknown")
                        for r in chosen
                    )
                )
            )
        else:
            checks["fever_diagnostic_recorded"] = len(chosen) == 5 and not any(
                r["outcome"] == "aborted" for r in chosen
            )
    positive_times = [
        r["candidate_latency_ms"]
        for r in final
        if r["kind"] == "positive" and r["candidate_latency_ms"] is not None
    ]
    checks["candidate_p95"] = (
        bool(positive_times) and percentile95(positive_times) <= policy["candidate_p95_ms_limit"]
    )
    # Testing tools cannot independently verify live attendance, UI safety or final-test discipline.
    if not live:
        issues.append("No human camera trials recorded; n=0.")
    if any(r["evidence_kind"] == "synthetic" for r in rows):
        issues.append("Synthetic records excluded from live gate.")
    issues += [
        "Self-reported anonymous trial records are not independently verified.",
        "Sign language validity and target-user effectiveness remain unverified.",
        "Freeze also requires regression and human confirmation that final trials were untouched.",
    ]
    groups = {}
    for key in (
        "split",
        "participant_code",
        "intent_id",
        "condition",
        "device_code",
        "worker_state",
        "kind",
    ):
        buckets = defaultdict(list)
        for row in live:
            buckets[row[key]].append(row)
        groups[key] = {value: counts(values) for value, values in buckets.items()}
    confusion = Counter((r["expected_label"], r["displayed_candidate"]) for r in live)
    return {
        "profile_id": identifier,
        "protocol": policy["version"],
        "status": "CANDIDATE",
        "live": counts(live),
        "synthetic_records": len(rows) - len(live),
        "groups": groups,
        "confusion": [
            {"expected": pair[0], "displayed": pair[1], "trials": n}
            for pair, n in confusion.items()
        ],
        "final_normal": counts(final),
        "numeric_checks": checks,
        "numeric_criteria_met": bool(final) and all(checks.values()),
        "limitations": issues,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Kết quả thử nội bộ, không nhận dữ liệu camera")
    sub = parser.add_subparsers(dest="command", required=True)
    for name in ("profile", "template", "summarize"):
        cmd = sub.add_parser(name)
        cmd.add_argument("--output", type=Path, required=True)
        if name == "summarize":
            cmd.add_argument("--input", type=Path, required=True)
            cmd.add_argument("--profile", type=Path)
    args = parser.parse_args()
    current = profile()
    if args.command == "summarize" and args.profile:
        current = json.loads(args.profile.read_text())
        identity = hashlib.sha256(
            json.dumps(current["sources"], sort_keys=True).encode()
        ).hexdigest()
        policy_hash = hashlib.sha256(
            json.dumps(current["policy"], sort_keys=True).encode()
        ).hexdigest()
        if (
            identity != current["profile_id"]
            or policy_hash != current["sources"]["policy_canonical_sha256"]
        ):
            raise ValueError("Archived profile integrity mismatch")
    if args.command == "template":
        if args.output.exists():
            raise ValueError("Do not overwrite existing trials")
        buffer = io.StringIO()
        csv.writer(buffer, lineterminator="\n").writerow(FIELDS)
        content = buffer.getvalue()
    else:
        result = (
            current
            if args.command == "profile"
            else summarize(
                read_trials(args.input, current["profile_id"], current["policy"]),
                current["profile_id"],
                current["policy"],
            )
        )
        content = json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False) + "\n"
    args.output.parent.mkdir(parents=True, exist_ok=True)
    if args.command == "profile":
        archive = ROOT / "docs/validation/vsl-v2/profiles" / (current["profile_id"] + ".json")
        archive.parent.mkdir(parents=True, exist_ok=True)
        archive.write_text(content)
    args.output.write_text(content)
    print(str(args.output))


if __name__ == "__main__":
    main()
