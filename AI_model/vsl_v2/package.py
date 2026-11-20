"""Build the isolated runtime artifact from the exact owner-supplied best checkpoint."""

import argparse
import hashlib
import json
from pathlib import Path

import torch


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=Path("AI_model/checkpoints/vsl_v2.pt"))
    args = parser.parse_args()
    manifest = json.loads(Path(__file__).with_name("model-manifest.json").read_text())
    if hashlib.sha256(args.source.read_bytes()).hexdigest() != manifest["source_best_sha256"]:
        raise ValueError("Source checksum mismatch; review a different checkpoint before adopting")
    source = torch.load(args.source, map_location="cpu", weights_only=True)
    if source["norm_version"] != 2 or source["epoch"] != 72:
        raise ValueError("Unexpected normalization/epoch")
    metadata = {
        key: value
        for key, value in manifest.items()
        if key not in ("runtime_checkpoint_sha256", "runtime_bytes")
    }
    tokens = json.loads(Path(__file__).with_name("translation-vocabulary.json").read_text())
    package = {
        "model_state": source["model_state"],
        "metadata": metadata,
        "translation_tokens": tokens,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    if args.output.exists():
        raise ValueError("Output exists; preserve it and choose a new output directory")
    torch.save(package, args.output)
    digest = hashlib.sha256(args.output.read_bytes()).hexdigest()
    print(
        json.dumps(
            {
                "sha256": digest,
                "bytes": args.output.stat().st_size,
                "matches_manifest": digest == manifest["runtime_checkpoint_sha256"],
            }
        )
    )
    if digest != manifest["runtime_checkpoint_sha256"]:
        raise ValueError("Serialization differs; do not change manifest without replay review")


if __name__ == "__main__":
    main()
