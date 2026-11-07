import json
from functools import lru_cache
from pathlib import Path
from typing import Any

ONTOLOGY_DIR = Path(__file__).resolve().parent


@lru_cache(maxsize=1)
def load_chief_complaints() -> list[dict[str, Any]]:
    path = ONTOLOGY_DIR / "chief_complaints.json"
    with open(path, encoding="utf-8") as f:
        return json.load(f)  # type: ignore[no-any-return]


@lru_cache(maxsize=1)
def load_body_regions() -> list[dict[str, Any]]:
    path = ONTOLOGY_DIR / "body_regions.json"
    with open(path, encoding="utf-8") as f:
        return json.load(f)  # type: ignore[no-any-return]


@lru_cache(maxsize=1)
def load_vsl_gloss() -> list[dict[str, Any]]:
    path = ONTOLOGY_DIR / "vsl_gloss.json"
    with open(path, encoding="utf-8") as f:
        return json.load(f)  # type: ignore[no-any-return]


@lru_cache(maxsize=1)
def load_drug_names() -> list[str]:
    path = ONTOLOGY_DIR / "drug_names.json"
    with open(path, encoding="utf-8") as f:
        return json.load(f)  # type: ignore[no-any-return]


def find_chief_complaint_by_code(code: str) -> dict[str, Any] | None:
    for item in load_chief_complaints():
        if item["code"] == code:
            return item
    return None


def find_body_region_by_code(code: str) -> dict[str, Any] | None:
    for item in load_body_regions():
        if item["code"] == code:
            return item
    return None


def match_chief_complaint_from_text(text: str) -> dict[str, Any] | None:
    text_lower = text.lower()
    for item in load_chief_complaints():
        for syn in item.get("synonyms_vi", []):
            if syn.lower() in text_lower:
                return item
    return None


def match_body_regions_from_text(text: str) -> list[str]:
    text_lower = text.lower()
    matched: list[str] = []
    for item in load_body_regions():
        for syn in item.get("synonyms_vi", []):
            if syn.lower() in text_lower:
                matched.append(item["code"])
                break
    return matched


def find_drug_names_in_text(text: str) -> list[str]:
    text_lower = text.lower()
    drugs = load_drug_names()
    return [drug for drug in drugs if drug in text_lower]

