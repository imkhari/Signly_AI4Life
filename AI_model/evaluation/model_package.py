"""Check declared model artifacts without importing code or deserializing weights."""

import argparse
import hashlib
import json
import re
from pathlib import Path
from typing import Any

REQUIRED_ROLES = {
    "checkpoint",
    "model_source",
    "vocab_source",
    "config",
    "gloss_vocab",
    "trans_vocab",
}
TEMPLATE = Path(__file__).with_name("model-package.template.json")


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def inspect_package(root: Path, manifest: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(manifest, dict):
        raise TypeError("Model manifest must be a JSON object")
    if manifest.get("version") != 1:
        raise ValueError("Unsupported model package version")
    entries = manifest.get("artifacts")
    if not isinstance(entries, list):
        raise ValueError("Package artifacts must be a list")
    roles: set[str] = set()
    paths: set[str] = set()
    results = []
    for entry in entries:
        role = entry["role"]
        relative = entry["path"]
        if not isinstance(role, str) or not role or role in roles:
            raise ValueError("Artifact roles must be unique nonempty strings")
        if not isinstance(relative, str) or not relative or relative in paths:
            raise ValueError("Artifact paths must be unique nonempty strings")
        roles.add(role)
        paths.add(relative)
        path = (root / relative).resolve()
        if Path(relative).is_absolute() or not path.is_relative_to(root.resolve()):
            raise ValueError("Artifact path must stay within package root")
        expected = entry.get("sha256", "")
        if not isinstance(expected, str) or (
            expected and not re.fullmatch(r"[a-f0-9]{64}", expected)
        ):
            raise ValueError("Invalid expected SHA-256")
        exists = path.is_file()
        actual = file_sha256(path) if exists else None
        size = path.stat().st_size if exists else 0
        status = "missing" if not exists else "empty" if size == 0 else "checksum_unprovided"
        if exists and size and expected:
            status = "matched" if expected == actual else "mismatch"
        results.append(
            {
                "role": role,
                "path": relative,
                "required": role in REQUIRED_ROLES,
                "bytes": size,
                "sha256": actual,
                "status": status,
            }
        )
    missing_roles = sorted(REQUIRED_ROLES - roles)
    metadata_missing = [
        field
        for field in ("model_name", "provenance", "license_or_permission", "preprocessing")
        if not isinstance(manifest.get(field), str) or not manifest[field].strip()
    ]
    verified = (
        not missing_roles
        and not metadata_missing
        and all(item["status"] == "matched" for item in results if item["required"])
        and all(
            item["status"] in ("matched", "missing") for item in results if not item["required"]
        )
    )
    return {
        "manifest_sha256": hashlib.sha256(
            json.dumps(manifest, sort_keys=True).encode()
        ).hexdigest(),
        "model_name": manifest.get("model_name"),
        "artifacts": results,
        "missing_required_roles": missing_roles,
        "missing_declarations": metadata_missing,
        "declared_integrity_verified": verified,
        "runtime_status": "not_tested",
        "recognition_quality": "not_evaluated",
        "limitations": [
            "Checks bytes against supplied hashes, not model authenticity or permission validity.",
            "Does not import source, load weights, parse config "
            "or verify vocabulary compatibility.",
            "OOD and runtime dependencies require a separate runtime smoke test.",
        ],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Kiểm tra bộ model, không thực thi model")
    parser.add_argument("--package", type=Path, required=True)
    parser.add_argument("--manifest", type=Path, default=TEMPLATE)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    try:
        report = inspect_package(args.package, json.loads(args.manifest.read_bytes()))
    except (OSError, ValueError, KeyError, TypeError) as exc:
        parser.error(str(exc))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(f"Đã ghi kiểm kê tại {args.output}; runtime chưa được kiểm tra.")
    if not report["declared_integrity_verified"]:
        raise SystemExit(2)


if __name__ == "__main__":
    main()
