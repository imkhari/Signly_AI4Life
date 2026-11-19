"""Train a new gloss-only model in an isolated environment; never imports app code."""

import argparse
import json
import math
import random
import time
from pathlib import Path
from typing import Any

import numpy as np
import torch

from AI_model.evaluation.sequence_metrics import sequence_metrics
from AI_model.training.data import (
    PREPROCESSING,
    LandmarkDataset,
    audit,
    collate,
    sha256,
)
from AI_model.training.model import TinyTemporalCTC, decode


def write_json(path: Path, data: Any) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2, allow_nan=False) + "\n")


@torch.no_grad()
def evaluate(model: TinyTemporalCTC, loader: torch.utils.data.DataLoader) -> dict[str, Any]:
    model.eval()
    rows = []
    latencies = []
    for values, lengths, _, _, identifiers, references in loader:
        started = time.perf_counter()
        hypotheses = decode(model(values, lengths), lengths, model.tokens)
        latencies.append((time.perf_counter() - started) * 1000 / len(values))
        rows.extend(
            {
                "clip_id": identifier,
                "expected_glosses": reference,
                "predicted_glosses": hypothesis,
            }
            for identifier, reference, hypothesis in zip(
                identifiers, references, hypotheses, strict=True
            )
        )
    result = sequence_metrics(rows)
    result["batched_cpu_ms_per_clip_mean"] = sum(latencies) / len(latencies)
    result["scope"] = "offline recorded landmarks; no webcam or patient acceptance"
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--epochs", type=int, default=30)
    parser.add_argument("--patience", type=int, default=5)
    parser.add_argument("--batch-size", type=int, default=4)
    parser.add_argument("--train-limit", type=int)
    parser.add_argument("--val-limit", type=int)
    parser.add_argument("--threads", type=int, default=4)
    parser.add_argument("--evaluate-test", action="store_true")
    args = parser.parse_args()
    if args.epochs < 1 or args.batch_size < 1 or args.patience < 1 or args.threads < 1:
        parser.error("Epochs, batch size, patience and threads must be positive")
    if args.evaluate_test and (args.train_limit or args.val_limit):
        parser.error("Smoke runs must not evaluate the test set")
    args.output.mkdir(parents=True, exist_ok=False)
    random.seed(42)
    np.random.seed(42)
    torch.manual_seed(42)
    torch.set_num_threads(args.threads)
    rows, audit_report = audit(args.data)
    write_json(args.output / "dataset-audit.json", audit_report)
    training = [row for row in rows if row["split"] == "train"]
    validation = [row for row in rows if row["split"] == "val"]
    tokens = ["<blank>"] + sorted({token for row in training for token in row["gloss_sequence"]})
    vocabulary = set(tokens)
    if any(token not in vocabulary for row in rows for token in row["gloss_sequence"]):
        raise ValueError("Held-out label absent from training vocabulary")
    if args.train_limit:
        training = random.sample(training, min(args.train_limit, len(training)))
    if args.val_limit:
        validation = random.sample(validation, min(args.val_limit, len(validation)))
    loaders = []
    for subset, shuffle in ((training, True), (validation, False)):
        dataset = LandmarkDataset(args.data, subset, tokens)
        loaders.append(
            torch.utils.data.DataLoader(
                dataset,
                batch_size=args.batch_size,
                shuffle=shuffle,
                collate_fn=collate,
                num_workers=0,
            )
        )
    model = TinyTemporalCTC(len(tokens))
    model.tokens = tokens
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3)
    criterion = torch.nn.CTCLoss(blank=0, zero_infinity=False)
    config = {
        "architecture": "TinyTemporalCTC",
        "classes": len(tokens),
        "width": 128,
        "layers": 2,
        "seed": 42,
        "device": "cpu",
        "batch_size": args.batch_size,
        "max_epochs": args.epochs,
        "patience": args.patience,
        "learning_rate": 1e-3,
        "preprocessing": PREPROCESSING,
        "parameters": sum(p.numel() for p in model.parameters()),
        "train_clips": len(training),
        "validation_clips": len(validation),
        "smoke_only": bool(args.train_limit or args.val_limit),
        "torch_version": str(torch.__version__),
        "numpy_version": str(np.__version__),
    }
    write_json(args.output / "config.json", config)
    write_json(args.output / "vocabulary.json", {"tokens": tokens, "blank_id": 0})
    print(json.dumps(config), flush=True)
    history = []
    best = float("inf")
    stalled = 0
    for epoch in range(1, args.epochs + 1):
        model.train()
        started = time.perf_counter()
        losses = []
        for values, lengths, targets, target_lengths, _, _ in loaders[0]:
            optimizer.zero_grad(set_to_none=True)
            log_probs = model(values, lengths)
            loss = criterion(log_probs.transpose(0, 1), targets, lengths, target_lengths)
            if not math.isfinite(loss.item()):
                raise ValueError("Non-finite CTC loss; stopping instead of hiding invalid samples")
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0, error_if_nonfinite=True)
            optimizer.step()
            losses.append(loss.item())
        validation_report = evaluate(model, loaders[1])
        entry = {
            "epoch": epoch,
            "train_loss": sum(losses) / len(losses),
            "validation_wer": validation_report["wer"],
            "seconds": time.perf_counter() - started,
        }
        history.append(entry)
        write_json(args.output / "history.json", history)
        print(json.dumps(entry), flush=True)
        if entry["validation_wer"] < best:
            best = entry["validation_wer"]
            stalled = 0
            torch.save(
                {
                    "state_dict": model.state_dict(),
                    "tokens": tokens,
                    "config": config,
                    "epoch": epoch,
                    "validation_wer": best,
                },
                args.output / "best.pt",
            )
            write_json(args.output / "validation.json", validation_report)
        else:
            stalled += 1
            if stalled >= args.patience:
                break
    summary = {
        **config,
        "completed_epochs": len(history),
        "best_validation_wer": best,
        "checkpoint_sha256": sha256(args.output / "best.pt"),
        "test_evaluated": False,
    }
    if args.evaluate_test:
        checkpoint = torch.load(args.output / "best.pt", map_location="cpu", weights_only=True)
        model.load_state_dict(checkpoint["state_dict"], strict=True)
        test = LandmarkDataset(args.data, [row for row in rows if row["split"] == "test"], tokens)
        loader = torch.utils.data.DataLoader(test, batch_size=args.batch_size, collate_fn=collate)
        write_json(args.output / "test.json", evaluate(model, loader))
        summary["test_evaluated"] = True
    write_json(args.output / "summary.json", summary)
    print(json.dumps(summary), flush=True)


if __name__ == "__main__":
    main()
