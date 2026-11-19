"""Strict landmark validation and shared train/inference preprocessing."""

import hashlib
import json
import re
from pathlib import Path
from typing import Any

import numpy as np
import torch
from torch.nn.utils.rnn import pad_sequence

PREPROCESSING = "holistic411-shoulders9-10-mask-velocity-v1"
SOURCE_COMMIT = "6c351e63c0b2cf1b5e2e8056bb3bf2d6f31dc90a"
METADATA_SHA256 = "d54f48cc8ea8a3df2644fec27567e3f7be4511d4ec867911e3a8c0b72537a380"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def features(raw: np.ndarray, max_frames: int = 300) -> torch.Tensor:
    if raw.ndim != 2 or raw.shape[1] != 411 or len(raw) < 2:
        raise ValueError("Expected at least two frames of 411 coordinates")
    if not np.isfinite(raw).all():
        raise ValueError("Non-finite landmarks")
    if len(raw) > max_frames:
        raw = raw[np.linspace(0, len(raw) - 1, max_frames).round().astype(int)]
    points = raw.astype(np.float32).reshape(-1, 137, 3).copy()
    detected = np.any(points != 0, axis=-1)
    left, right = points[:, 9, :2], points[:, 10, :2]
    widths = np.linalg.norm(left - right, axis=-1)
    valid = detected[:, 9] & detected[:, 10] & (widths > 1e-4)
    if not valid.any():
        raise ValueError("No valid shoulder frame")
    centers = (left + right) / 2
    indices = np.arange(len(points))
    for axis in (0, 1):
        centers[:, axis] = np.interp(indices, indices[valid], centers[valid, axis])
    widths = np.interp(indices, indices[valid], widths[valid]).astype(np.float32)
    points[:, :, :2] -= centers[:, None, :]
    points /= widths[:, None, None]
    points[~detected] = 0
    velocity = np.zeros_like(points)
    velocity[1:] = points[1:] - points[:-1]
    velocity[1:][~(detected[1:] & detected[:-1])] = 0
    combined = np.concatenate((points.reshape(-1, 411), velocity.reshape(-1, 411)), axis=1)
    if not np.isfinite(combined).all():
        raise ValueError("Invalid normalized features")
    return torch.from_numpy(combined)


def audit(root: Path) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    metadata = root / "data/dataset.json"
    if sha256(metadata) != METADATA_SHA256:
        raise ValueError("Metadata differs from approved snapshot")
    rows = json.loads(metadata.read_text())
    identifiers: set[str] = set()
    signer_splits: dict[str, str] = {}
    content_splits: dict[str, str] = {}
    counts = {split: 0 for split in ("train", "val", "test")}
    lengths = []
    canonicalized_ids = []
    accepted = []
    rejected = []
    for row in rows:
        original_id = row["id"]
        identifier = original_id.strip()
        match = re.fullmatch(r"SENT\d+_S(\d+)_R\d+_F", identifier)
        split = row["split"]
        if match is None or identifier in identifiers or split not in counts:
            raise ValueError(f"Invalid or duplicate record: {identifier}")
        identifiers.add(identifier)
        signer = match[1]
        if signer in signer_splits and signer_splits[signer] != split:
            raise ValueError("Signer leakage")
        signer_splits[signer] = split
        path = root / "data/keypoints" / f"{original_id}.npy"
        digest = sha256(path)
        if digest in content_splits and content_splits[digest] != split:
            raise ValueError("Identical landmark content crosses splits")
        content_splits[digest] = split
        array = np.load(path, allow_pickle=False)
        tensor = features(array)
        labels = row["gloss_sequence"]
        if not labels or any(not isinstance(token, str) or not token.strip() for token in labels):
            rejected.append({"clip_id": identifier, "split": split, "reason": "empty_gloss_label"})
            continue
        minimum = len(labels) + sum(a == b for a, b in zip(labels, labels[1:]))
        if len(tensor) < minimum:
            raise ValueError(f"Insufficient frames for CTC: {identifier}")
        counts[split] += 1
        lengths.append(len(array))
        row["landmark_file_id"] = original_id
        row["id"] = identifier
        if identifier != original_id:
            canonicalized_ids.append({"original": original_id, "canonical": identifier})
        accepted.append(row)
    return accepted, {
        "source_commit": SOURCE_COMMIT,
        "metadata_sha256": METADATA_SHA256,
        "preprocessing": PREPROCESSING,
        "counts": counts,
        "signer_splits": signer_splits,
        "min_frames": min(lengths),
        "max_frames": max(lengths),
        "input_clips": len(rows),
        "rejected_clips": len(rejected),
        "rejected": rejected,
        "canonicalized_ids": canonicalized_ids,
        "scope": "landmark integrity; not independent consent or linguistic validation",
    }


class LandmarkDataset(torch.utils.data.Dataset):
    def __init__(self, root: Path, rows: list[dict[str, Any]], tokens: list[str]):
        self.items = []
        vocabulary = {token: index for index, token in enumerate(tokens)}
        for row in rows:
            values = features(
                np.load(
                    root / "data/keypoints" / f"{row.get('landmark_file_id', row['id'])}.npy",
                    allow_pickle=False,
                )
            )
            target = torch.tensor([vocabulary[token] for token in row["gloss_sequence"]])
            self.items.append((values, target, row["id"], row["gloss_sequence"]))

    def __len__(self) -> int:
        return len(self.items)

    def __getitem__(self, index: int) -> tuple:
        return self.items[index]


def collate(items: list[tuple]) -> tuple:
    values, targets, identifiers, references = zip(*items, strict=True)
    return (
        pad_sequence(values, batch_first=True),
        torch.tensor([len(value) for value in values]),
        torch.cat(targets),
        torch.tensor([len(target) for target in targets]),
        identifiers,
        references,
    )
