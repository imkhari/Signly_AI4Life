"""Explicitly fetch only the pinned 300 public replay landmarks, verified by SHA256."""

import argparse
import concurrent.futures
import hashlib
import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
COMMIT = "6c351e63c0b2cf1b5e2e8056bb3bf2d6f31dc90a"
BASE = f"https://raw.githubusercontent.com/nguyentheanh822/Vietnamese-Sign-Language-Translation/{COMMIT}/data/keypoints/"


def select_identifiers(
    report: dict, manifest: dict[str, str], requested: list[str] | None
) -> list[str]:
    identifiers = [row["clip_id"] for row in report["predictions"]]
    if len(identifiers) != 300 or len(set(identifiers)) != 300:
        raise ValueError("Expected exactly300 unique public replay identifiers")
    for identifier in identifiers:
        if Path(identifier).name != identifier or identifier not in manifest:
            raise ValueError("Unsafe/unknown public sample identifier")
    if requested is None:
        return identifiers
    if not requested or len(requested) != len(set(requested)):
        raise ValueError("Select a nonempty list of unique replay identifiers")
    if any(identifier not in identifiers for identifier in requested):
        raise ValueError("Only identifiers from the pinned replay may be fetched")
    return requested


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Tải300NPY public để tái lập replay; không tải video"
    )
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--clip", action="append", help="Chỉ tải ID replay đã ghim; có thể lặp")
    args = parser.parse_args()
    report = json.loads((ROOT / "AI_model/vsl_v2/reports/greedy-replay.json").read_text())
    manifest = {
        row["id"]: row["sha256"]
        for row in json.loads(
            (
                ROOT / "AI_model/evaluation/reports/tiny-ctc-evidence/landmark-manifest.json"
            ).read_text()
        )
    }
    identifiers = select_identifiers(report, manifest, args.clip)
    args.output.mkdir(parents=True, exist_ok=True)

    def fetch(identifier: str) -> int:
        path = args.output / (identifier + ".npy")
        if path.exists():
            data = path.read_bytes()
            if hashlib.sha256(data).hexdigest() != manifest[identifier]:
                raise ValueError("Existing file differs; choose a new output directory")
            return len(data)
        for attempt in range(3):
            try:
                url = BASE + urllib.parse.quote(identifier, safe="") + ".npy"
                with urllib.request.urlopen(url, timeout=40) as response:
                    data = response.read()
                if hashlib.sha256(data).hexdigest() != manifest[identifier]:
                    raise ValueError("Public landmark checksum mismatch")
                path.write_bytes(data)
                return len(data)
            except OSError:
                if attempt == 2:
                    raise
                time.sleep(1)
        raise RuntimeError("Download failed")

    count = 0
    size = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
        for amount in executor.map(fetch, identifiers):
            count += 1
            size += amount
            if count % 50 == 0:
                print(json.dumps({"verified": count, "bytes": size}), flush=True)
    print(json.dumps({"source_commit": COMMIT, "verified": count, "bytes": size}), flush=True)


if __name__ == "__main__":
    main()
