"""Authored prediction replays, separate from sign-recognition accuracy evaluation."""

import argparse
import hashlib
import json
import subprocess
from pathlib import Path
from typing import Any


def prediction(gloss: str = "NGỰC", **overrides: Any) -> dict[str, Any]:
    return {
        "success": gloss != "UNKNOWN",
        "gloss": gloss,
        "confidence": 0.9,
        "label_vi": gloss,
        **overrides,
    }


def cases() -> list[dict[str, Any]]:
    def case(name: str, frames: list[tuple[int, dict[str, Any]]], expected: list[str]) -> dict:
        return {
            "case_id": name,
            "expected": expected,
            "frames": [{"timestamp_ms": stamp, "prediction": value} for stamp, value in frames],
        }

    normal = [(stamp, prediction()) for stamp in (0, 180, 360, 540, 720)]
    return [
        case("stable_hold", normal, ["NGỰC"]),
        case("short_hold", [(t, prediction()) for t in (0, 100, 200, 300, 400)], []),
        case("too_few_frames", [(t, prediction()) for t in (0, 600)], []),
        case("low_confidence", [(t, prediction(confidence=0.69)) for t in (0, 300, 600)], []),
        case("waving", [(t, prediction(motion_type="waving")) for t in (0, 300, 600)], []),
        case("transitioning", [(t, prediction(is_transitioning=True)) for t in (0, 300, 600)], []),
        case(
            "lost_hand",
            [
                (0, prediction()),
                (200, prediction()),
                (400, prediction("UNKNOWN")),
                (600, prediction()),
                (800, prediction()),
            ],
            [],
        ),
        case(
            "changing_gloss",
            [
                (t, prediction("NGỰC" if i % 2 == 0 else "BỤNG"))
                for i, t in enumerate((0, 200, 400, 600, 800))
            ],
            [],
        ),
        case("cooldown", [(t, prediction()) for t in (0, 200, 400, 600, 800, 1000)], ["NGỰC"]),
        case(
            "repeat_after_cooldown",
            [(t, prediction()) for t in (0, 200, 600, 900, 2600)],
            ["NGỰC", "NGỰC"],
        ),
        case(
            "numeric_one_frame_jitter",
            [
                (t, prediction("MỨC-2" if i == 2 else "MỨC-1"))
                for i, t in enumerate((0, 180, 360, 540))
            ],
            ["MỨC-1"],
        ),
        # Desired rejection after a long delivery gap, even with three equal predictions.
        case("delivery_gap", [(t, prediction()) for t in (0, 10000, 11000)], []),
    ]


def evaluate_stability() -> dict[str, Any]:
    fixtures = cases()
    replay = subprocess.run(
        ["node", str(Path(__file__).with_name("replay_stabilizer.cjs"))],
        input=json.dumps([case["frames"] for case in fixtures]),
        text=True,
        capture_output=True,
        check=True,
        timeout=60,
    )
    output = json.loads(replay.stdout)
    results = []
    for fixture, emitted in zip(fixtures, output["clips"], strict=True):
        actual = [entry["gloss"] for entry in emitted]
        results.append(
            {
                "case_id": fixture["case_id"],
                "expected": fixture["expected"],
                "actual": actual,
                "matches_expectation": actual == fixture["expected"],
                "emissions": emitted,
            }
        )
    return {
        "kind": "synthetic_prediction_replay",
        "cases": len(results),
        "matched": sum(case["matches_expectation"] for case in results),
        "stabilizer_options": output["options"],
        "fixture_sha256": hashlib.sha256(json.dumps(fixtures, sort_keys=True).encode()).hexdigest(),
        "source_sha256": {
            str(path.relative_to(Path(__file__).resolve().parents[2])): hashlib.sha256(
                path.read_bytes()
            ).hexdigest()
            for path in (
                Path(__file__).resolve().parents[2]
                / "frontend/src/services/vsl/GestureStabilizer.ts",
                Path(__file__).with_name("replay_stabilizer.cjs"),
            )
        },
        "results": results,
        "limitations": [
            "Authored predictions, no camera, landmarks, trained model or human signer.",
            "Each case starts a new stabilizer; tests emissions, not patient acceptance.",
            "delivery_gap encodes a desired behavior absent from current max-gap-free tracking.",
            "Pass count is not sign-recognition accuracy or a production readiness threshold.",
        ],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Kiểm tra bộ ổn định bằng dự đoán tổng hợp")
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    report = evaluate_stability()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(f"Đã ghi {report['cases']} ca phần mềm; {report['matched']} khớp kỳ vọng.")


if __name__ == "__main__":
    main()
