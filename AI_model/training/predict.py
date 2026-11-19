"""Offline inference from supplied landmarks; no reference lookup or filename fallback."""

import argparse
import json
import time
from pathlib import Path
from typing import Any

import numpy as np
import torch

from AI_model.training.data import PREPROCESSING, features, sha256
from AI_model.training.model import TinyTemporalCTC, decode


def predict(checkpoint_path: Path, landmarks_path: Path) -> dict[str, Any]:
    checkpoint = torch.load(checkpoint_path, map_location="cpu", weights_only=True)
    config = checkpoint["config"]
    if config["preprocessing"] != PREPROCESSING or config["architecture"] != "TinyTemporalCTC":
        raise ValueError("Unsupported checkpoint preprocessing or architecture")
    tokens = checkpoint["tokens"]
    if (
        not tokens
        or tokens[0] != "<blank>"
        or len(set(tokens)) != len(tokens)
        or len(tokens) != config["classes"]
    ):
        raise ValueError("Invalid checkpoint vocabulary")
    model = TinyTemporalCTC(len(tokens), config["width"], config["layers"])
    model.load_state_dict(checkpoint["state_dict"], strict=True)
    model.eval()
    values = features(np.load(landmarks_path, allow_pickle=False))
    lengths = torch.tensor([len(values)])
    started = time.perf_counter()
    with torch.no_grad():
        log_probs = model(values.unsqueeze(0), lengths)
        glosses = decode(log_probs, lengths, tokens)[0]
    elapsed_ms = (time.perf_counter() - started) * 1000
    return {
        "gloss_sequence": glosses,
        "status": "decoded_unvalidated" if glosses else "no_gloss",
        "engine_source": "learned_model",
        "input_source": "observed_landmarks",
        "checkpoint_sha256": sha256(checkpoint_path),
        "preprocessing": PREPROCESSING,
        "offline_forward_decode_ms": elapsed_ms,
        "clinical_or_patient_confirmation": False,
        "limitations": "Raw gloss decoding; no calibrated rejection or clinical interpretation.",
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Nhận gloss offline từ landmark đã cung cấp")
    parser.add_argument("--checkpoint", type=Path, required=True)
    parser.add_argument("--landmarks", type=Path, required=True)
    args = parser.parse_args()
    torch.set_num_threads(4)
    print(json.dumps(predict(args.checkpoint, args.landmarks), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
