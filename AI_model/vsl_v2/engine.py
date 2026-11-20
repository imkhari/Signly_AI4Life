"""Strict, reference-free V2 translation inference from observed holistic landmarks."""

import argparse
import hashlib
import json
import time
from pathlib import Path
from typing import Any

import numpy as np
import torch

from AI_model.vsl_v2.vendor.slt_model import SLTModel

ROOT = Path(__file__).resolve().parents[2]
CHECKPOINT = ROOT / "AI_model/checkpoints/vsl_v2.pt"


def preprocess(raw: np.ndarray, max_frames: int = 300) -> torch.Tensor:
    if raw.ndim != 2 or raw.shape[1] != 411 or len(raw) < 8 or not np.isfinite(raw).all():
        raise ValueError("Expected at least eight finite frames with 411 coordinates")
    kp = raw[:max_frames].astype(np.float32).copy()
    left, right = kp[:, 27:29], kp[:, 30:32]
    width = np.linalg.norm(right - left, axis=-1)
    valid_shoulders = np.any(left != 0, axis=-1) & np.any(right != 0, axis=-1) & (width > 1e-5)
    if not valid_shoulders.all():
        raise ValueError("Missing or degenerate shoulders in sequence")
    cx = ((left[:, 0] + right[:, 0]) / 2)[:, None]
    cy = ((left[:, 1] + right[:, 1]) / 2)[:, None]
    scale = (width + 1e-6)[:, None]
    detected_x, detected_y = kp[:, 0::3] != 0, kp[:, 1::3] != 0
    kp[:, 0::3] = np.where(detected_x, (kp[:, 0::3] - cx) / scale, 0)
    kp[:, 1::3] = np.where(detected_y, (kp[:, 1::3] - cy) / scale, 0)
    kp[:, 2::3] /= scale
    velocity = np.zeros_like(kp)
    velocity[1:] = kp[1:] - kp[:-1]
    return torch.from_numpy(np.concatenate((kp, velocity), axis=-1))


class V2Engine:
    def __init__(self, checkpoint: Path = CHECKPOINT):
        manifest = json.loads(Path(__file__).with_name("model-manifest.json").read_text())
        digest = hashlib.sha256(checkpoint.read_bytes()).hexdigest()
        if digest != manifest["runtime_checkpoint_sha256"]:
            raise ValueError("V2 checkpoint checksum mismatch")
        package = torch.load(checkpoint, map_location="cpu", weights_only=True)
        self.metadata = package["metadata"]
        self.tokens = package["translation_tokens"]
        if (
            self.metadata["norm_version"] != 2
            or len(self.tokens) != 442
            or len(set(self.tokens)) != 442
            or self.tokens[:5] != ["<pad>", "<bos>", "<eos>", "<unk>", "<blank>"]
        ):
            raise ValueError("Unsupported V2 normalization or vocabulary")
        self.model = SLTModel(
            input_dim=822,
            gloss_vocab_size=374,
            trans_vocab_size=442,
            d_model=256,
            nhead=8,
            num_encoder_layers=4,
            num_decoder_layers=3,
            dim_feedforward=1024,
            dropout=0.1,
            pad_idx=0,
        )
        self.model.load_state_dict(package["model_state"], strict=True)
        self.model.eval()
        self.sha256 = digest

    @torch.no_grad()
    def decode_frames(self, raw: np.ndarray) -> dict[str, Any]:
        src = preprocess(raw).unsqueeze(0)
        mask = torch.zeros((1, src.shape[1]), dtype=torch.bool)
        started = time.perf_counter()
        memory = self.model.encode(src, src_key_padding_mask=mask)
        ids = torch.tensor([[1]], dtype=torch.long)
        words = []
        probabilities = []
        for _ in range(30):
            output = self.model.decode(ids, memory, memory_key_padding_mask=mask)
            distribution = self.model.trans_head(output[:, -1]).softmax(-1)
            index = int(distribution.argmax(-1).item())
            if index == 2:
                break
            if index >= 5:
                words.append(self.tokens[index])
                probabilities.append(float(distribution[0, index]))
            ids = torch.cat((ids, torch.tensor([[index]], dtype=torch.long)), dim=1)
        return {
            "translation": " ".join(words),
            "engine_source": "vsl_v2_learned_translation",
            "checkpoint_sha256": self.sha256,
            "input_source": "observed_landmarks",
            "mean_token_probability": float(np.mean(probabilities)) if probabilities else 0.0,
            "probability_calibrated": False,
            "ctc_glosses": None,
            "forward_decode_ms": (time.perf_counter() - started) * 1000,
            "patient_confirmation_required": True,
        }


def main() -> None:
    parser = argparse.ArgumentParser(description="V2 offline, không tra câu mẫu theo tên file")
    parser.add_argument("--landmarks", type=Path, required=True)
    args = parser.parse_args()
    torch.set_num_threads(4)
    engine = V2Engine()
    result = engine.decode_frames(np.load(args.landmarks, allow_pickle=False))
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
