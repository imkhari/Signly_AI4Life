"""Isolated V2 runtime and exact, fail-closed translation-to-ontology mapping."""

import asyncio
import contextlib
import json
import math
import re
import unicodedata
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[3]
RUNTIME = ROOT / "AI_model/runtime/.venv/bin/python"
CHECKPOINT = ROOT / "AI_model/checkpoints/vsl_v2.pt"

# Complete utterances only: no substring matching or extracting unrelated numbers.
PHRASES: dict[str, tuple[str, str | None]] = {
    "tôi bị đau đầu": ("ĐAU", "ĐẦU"),
    "tôi bị đau bụng": ("ĐAU", None),
    "tôi bị đau bụng trên": ("ĐAU", "BỤNG"),
    "tôi bị đau bụng dưới": ("ĐAU", "BỤNG-DƯỚI"),
    "tôi bị đau ngực": ("ĐAU", "NGỰC"),
    "tôi bị đau họng": ("ĐAU", "HỌNG"),
    "tôi bị đau lưng": ("ĐAU", None),
    "tôi bị đau lưng dưới": ("ĐAU", "LƯNG"),
    "tôi bị ho": ("HO", None),
    "tôi bị sốt": ("SỐT", None),
    "tôi cảm thấy khó thở": ("KHÓ-THỞ", None),
    "tôi thấy khó thở lắm": ("KHÓ-THỞ", None),
}
LABELS = {
    "ĐAU": "Đau / Nhức",
    "ĐẦU": "Đầu",
    "BỤNG": "Bụng trên",
    "BỤNG-DƯỚI": "Bụng dưới",
    "NGỰC": "Ngực",
    "HỌNG": "Cổ / Họng",
    "LƯNG": "Lưng dưới",
    "HO": "Ho",
    "SỐT": "Sốt",
    "KHÓ-THỞ": "Khó thở",
}
COMPLAINT_CODES = {"ĐAU": "PAIN", "HO": "COUGH", "SỐT": "FEVER", "KHÓ-THỞ": "BREATH_DIFFICULTY"}
REGION_CODES = {
    "ĐẦU": "HEAD", "NGỰC": "CHEST", "BỤNG": "ABDOMEN_UPPER",
    "BỤNG-DƯỚI": "ABDOMEN_LOWER", "HỌNG": "NECK", "LƯNG": "LOWER_BACK",
}


def map_candidate(result: dict[str, Any], context: str | None) -> dict[str, Any]:
    unknown: dict[str, Any] = {
        "success": False,
        "gloss": "UNKNOWN",
        "confidence": 0.0,
        "model_source": "vsl_v2_learned_translation",
    }
    if context == "intake" and result.get("reason") == "no_clear_hand_motion":
        unknown["suggested_next_step"] = "hand_motion_unclear"
        return unknown
    if not isinstance(result.get("translation"), str):
        return unknown
    try:
        score = float(result.get("mean_token_probability", 0))
    except (TypeError, ValueError):
        return unknown
    if not math.isfinite(score) or not 0.7 <= score <= 1:
        if context == "intake" and math.isfinite(score) and 0 <= score < 0.7:
            unknown["suggested_next_step"] = "model_score_low"
        return unknown
    phrase = unicodedata.normalize("NFC", result["translation"]).lower().strip()
    phrase = re.sub(r"\s+", " ", phrase)
    phrase = re.sub(r"\s*[.!?]+$", "", phrase)
    if phrase not in PHRASES:
        if context == "intake":
            unknown["suggested_next_step"] = "phrase_not_supported"
        return unknown
    symptom, region = PHRASES[phrase]
    if context == "location":
        gloss = region
    elif context in (None, "symptom", "general", "intake"):
        gloss = symptom
    else:
        gloss = None
    if gloss is None:
        return unknown
    candidate: dict[str, Any] = {
        "success": True,
        "gloss": gloss,
        "tokens": [gloss],
        "token": gloss,
        "label_vi": LABELS[gloss],
        "confidence": float(result["mean_token_probability"]),
        "model_source": "vsl_v2_learned_translation",
        "latency_ms": float(result.get("forward_decode_ms", 0)),
    }
    if context == "intake":
        candidate["intake_suggestion"] = {
            "chief_complaint_code": COMPLAINT_CODES[symptom],
            "pain_present": True if symptom == "ĐAU" else None,
            "body_regions": [REGION_CODES[region]] if region is not None else [],
        }
    return candidate


class V2Runtime:
    def __init__(self) -> None:
        self.process: asyncio.subprocess.Process | None = None
        self.lock = asyncio.Lock()
        self.generation = 0

    @property
    def available(self) -> bool:
        return RUNTIME.is_file() and CHECKPOINT.is_file()

    def clear(self) -> None:
        self.generation += 1
        if self.process is not None and self.process.returncode is None:
            with contextlib.suppress(ProcessLookupError):
                self.process.kill()
        self.process = None

    async def infer(self, frames: list[list[float]], timestamps: list[float]) -> dict[str, Any]:
        generation = self.generation
        if not self.available or self.lock.locked():
            return {}
        async with self.lock:
            try:
                async with asyncio.timeout(15):
                    if generation != self.generation:
                        return {}
                    if self.process is None or self.process.returncode is not None:
                        self.process = await asyncio.create_subprocess_exec(
                            str(RUNTIME),
                            "-m",
                            "AI_model.vsl_v2.worker",
                            cwd=ROOT,
                            stdin=asyncio.subprocess.PIPE,
                            stdout=asyncio.subprocess.PIPE,
                            stderr=asyncio.subprocess.DEVNULL,
                        )
                        if generation != self.generation:
                            self.clear()
                            return {}
                        if self.process.stdout is None:
                            return {}
                        ready = json.loads(await self.process.stdout.readline())
                        if not ready.get("ready"):
                            raise ValueError("Runtime not ready")
                    process = self.process
                    if process is None or process.stdin is None or process.stdout is None:
                        return {}
                    payload = json.dumps(
                        {"frames": frames, "timestamps_ms": timestamps}, allow_nan=False
                    )
                    process.stdin.write((payload + "\n").encode())
                    await process.stdin.drain()
                    response = json.loads(await process.stdout.readline())
                    if generation != self.generation:
                        return {}
                    return dict(response.get("result", {}))
            except asyncio.CancelledError:
                self.clear()
                raise
            except (TimeoutError, ValueError, OSError, RuntimeError, BrokenPipeError):
                self.clear()
                return {}


v2_runtime = V2Runtime()
