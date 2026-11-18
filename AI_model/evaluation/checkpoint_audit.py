"""Inspect tensor metadata without importing torch or materializing tensor storage."""

import collections
import hashlib
import io
import pickle
import zipfile
from pathlib import Path
from typing import Any


def tensor_metadata(
    storage: Any, offset: int, size: Any, stride: Any, requires_grad: bool, hooks: Any
) -> dict[str, Any]:
    return {"shape": list(size), "storage_type": storage[1]}


class MetadataReader(pickle.Unpickler):
    def find_class(self, module: str, name: str) -> Any:
        if (module, name) == ("collections", "OrderedDict"):
            return collections.OrderedDict
        if (module, name) == ("torch._utils", "_rebuild_tensor_v2"):
            return tensor_metadata
        if module == "torch" and name in ("FloatStorage", "LongStorage"):
            return name
        raise ValueError(f"Unsupported checkpoint global: {module}.{name}")

    def persistent_load(self, identity: Any) -> Any:
        if not isinstance(identity, tuple) or identity[0] != "storage":
            raise ValueError("Unsupported persistent storage")
        return identity


def audit_checkpoint(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {"filename": path.name, "exists": False}
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    result: dict[str, Any] = {
        "filename": path.name,
        "exists": True,
        "bytes": path.stat().st_size,
        "sha256": digest.hexdigest(),
        "tensor_shapes": {},
    }
    try:
        with zipfile.ZipFile(path) as archive:
            info = next(
                entry for entry in archive.infolist() if entry.filename.endswith("/data.pkl")
            )
            if info.file_size > 8 * 1024 * 1024:
                raise ValueError("Checkpoint metadata exceeds 8 MiB")
            weights = MetadataReader(io.BytesIO(archive.read(info))).load()
        result["tensor_count"] = len(weights)
        result["tensor_shapes"] = {
            key: weights[key]["shape"]
            for key in (
                "bottle_mm.weight",
                "classifier.fc.weight",
                "classifier.fc.bias",
            )
            if key in weights
        }
        result["metadata_status"] = "read"
    except (ValueError, KeyError, StopIteration, pickle.UnpicklingError, zipfile.BadZipFile) as exc:
        result["metadata_status"] = "unsupported"
        result["metadata_error"] = str(exc)
    return result
