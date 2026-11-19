"""Token precision/recall using minimum-edit alignment, not isolated-sign accuracy."""

from collections import Counter
from typing import Any


def token_metrics(rows: list[dict[str, Any]]) -> dict[str, Any]:
    true_positive: Counter[str] = Counter()
    false_positive: Counter[str] = Counter()
    false_negative: Counter[str] = Counter()
    for row in rows:
        reference, hypothesis = row["expected_glosses"], row["predicted_glosses"]
        costs = [[0] * (len(hypothesis) + 1) for _ in range(len(reference) + 1)]
        operations = [[""] * (len(hypothesis) + 1) for _ in range(len(reference) + 1)]
        for i in range(1, len(reference) + 1):
            costs[i][0], operations[i][0] = i, "delete"
        for j in range(1, len(hypothesis) + 1):
            costs[0][j], operations[0][j] = j, "insert"
        for i, expected in enumerate(reference, 1):
            for j, actual in enumerate(hypothesis, 1):
                if expected == actual:
                    costs[i][j], operations[i][j] = costs[i - 1][j - 1], "match"
                else:
                    costs[i][j], operations[i][j] = min(
                        (costs[i - 1][j - 1] + 1, "substitute"),
                        (costs[i - 1][j] + 1, "delete"),
                        (costs[i][j - 1] + 1, "insert"),
                        key=lambda pair: pair[0],
                    )
        i, j = len(reference), len(hypothesis)
        while i or j:
            operation = operations[i][j]
            if operation == "match":
                true_positive[reference[i - 1]] += 1
            elif operation in ("delete", "substitute"):
                false_negative[reference[i - 1]] += 1
            if operation in ("insert", "substitute"):
                false_positive[hypothesis[j - 1]] += 1
            if operation in ("match", "substitute", "delete"):
                i -= 1
            if operation in ("match", "substitute", "insert"):
                j -= 1
    per_label = {}
    for label in sorted(set(true_positive) | set(false_positive) | set(false_negative)):
        tp, fp, fn = true_positive[label], false_positive[label], false_negative[label]
        per_label[label] = {
            "tp": tp,
            "fp": fp,
            "fn": fn,
            "reference_tokens": tp + fn,
            "precision": tp / (tp + fp) if tp + fp else None,
            "recall": tp / (tp + fn) if tp + fn else None,
            "f1": 2 * tp / (2 * tp + fp + fn),
        }
    return {
        "token_alignment_macro_f1": sum(row["f1"] for row in per_label.values()) / len(per_label)
        if per_label
        else None,
        "per_label": per_label,
        "limitations": "Minimum-edit token alignment; not isolated-sign accuracy.",
        "alignment_ties": "substitution, deletion, insertion",
    }
