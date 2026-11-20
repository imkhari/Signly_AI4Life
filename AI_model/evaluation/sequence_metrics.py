"""Gloss sequence metrics and declared prediction-source validation."""

import re
from typing import Any


def validate_prediction_sources(candidate: dict[str, Any], expected_sha256: str) -> None:
    if not re.fullmatch(r"[a-f0-9]{64}", expected_sha256):
        raise ValueError("Expected checkpoint SHA-256 must have 64 lowercase hex characters")
    if candidate.get("checkpoint_sha256") != expected_sha256:
        raise ValueError("Candidate checkpoint SHA-256 mismatch")
    for prediction in candidate.get("predictions", []):
        if prediction.get("engine_source") != "learned_model":
            raise ValueError("Benchmark requires learned_model; reference/mock output is excluded")
        if prediction.get("input_source") != "observed_landmarks":
            raise ValueError("Benchmark requires observed_landmarks, not filename-selected samples")


def edit_counts(reference: list[str], hypothesis: list[str]) -> dict[str, int]:
    # Each cell tracks edits, substitutions, deletions and insertions.
    previous = [(j, 0, 0, j) for j in range(len(hypothesis) + 1)]
    for i, expected in enumerate(reference, 1):
        current = [(i, 0, i, 0)]
        for j, actual in enumerate(hypothesis, 1):
            diagonal = previous[j - 1]
            if expected == actual:
                current.append(diagonal)
                continue
            deletion = previous[j]
            insertion = current[j - 1]
            current.append(
                min(
                    (diagonal[0] + 1, diagonal[1] + 1, diagonal[2], diagonal[3]),
                    (deletion[0] + 1, deletion[1], deletion[2] + 1, deletion[3]),
                    (insertion[0] + 1, insertion[1], insertion[2], insertion[3] + 1),
                    key=lambda cell: cell[0],
                )
            )
        previous = current
    edits, substitutions, deletions, insertions = previous[-1]
    return {
        "edits": edits,
        "substitutions": substitutions,
        "deletions": deletions,
        "insertions": insertions,
    }


def sequence_metrics(rows: list[dict[str, Any]]) -> dict[str, Any]:
    totals = {"edits": 0, "substitutions": 0, "deletions": 0, "insertions": 0}
    reference_tokens = 0
    errors = []
    exact = 0
    negative_count = 0
    hallucinated_negatives = 0
    for row in rows:
        reference = row["expected_glosses"]
        hypothesis = row["predicted_glosses"]
        if any(
            not isinstance(tokens, list)
            or any(not isinstance(token, str) or not token.strip() for token in tokens)
            for tokens in (reference, hypothesis)
        ):
            raise ValueError("Gloss sequences must be lists of nonempty tokens")
        counts = edit_counts(reference, hypothesis)
        reference_tokens += len(reference)
        for key, value in counts.items():
            totals[key] += value
        exact += reference == hypothesis
        negative_count += not reference
        hallucinated_negatives += not reference and bool(hypothesis)
        if counts["edits"]:
            errors.append({**row, **counts})
    return {
        "clips": len(rows),
        "exact_matches": exact,
        "reference_tokens": reference_tokens,
        **totals,
        "wer": totals["edits"] / reference_tokens if reference_tokens else None,
        "negative_clips": negative_count,
        "hallucinated_negative_clips": hallucinated_negatives,
        "errors": errors,
        "limitations": "Exact gloss tokens; not a measure of clinical facts or sentence safety.",
    }
