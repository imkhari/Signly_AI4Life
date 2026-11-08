import json
from pathlib import Path
from typing import Any

PROJECT_ROOT = Path(__file__).resolve().parents[3]
DATASET_PATH = PROJECT_ROOT / "AI_model" / "data" / "medical_vsl_30.json"
VOYA_LABELS_PATH = PROJECT_ROOT / "AI_model" / "data" / "voya_labels.json"
ONTOLOGY_GLOSS_PATH = (
    PROJECT_ROOT / "backend" / "app" / "domain" / "ontology" / "vsl_gloss.json"
)
CHIEF_COMPLAINTS_PATH = (
    PROJECT_ROOT / "backend" / "app" / "domain" / "ontology" / "chief_complaints.json"
)
BODY_REGIONS_PATH = PROJECT_ROOT / "backend" / "app" / "domain" / "ontology" / "body_regions.json"


def _load_dataset() -> dict[str, list[dict[str, Any]]]:
    assert DATASET_PATH.exists(), f"Không tìm thấy file dataset tại {DATASET_PATH}"
    with open(DATASET_PATH, encoding="utf-8") as f:
        return json.load(f)  # type: ignore[no-any-return]


def _load_vsl_gloss() -> list[dict[str, Any]]:
    assert ONTOLOGY_GLOSS_PATH.exists(), f"Không tìm thấy file ontology tại {ONTOLOGY_GLOSS_PATH}"
    with open(ONTOLOGY_GLOSS_PATH, encoding="utf-8") as f:
        return json.load(f)  # type: ignore[no-any-return]


def _load_voya_labels() -> dict[str, str]:
    assert VOYA_LABELS_PATH.exists(), f"Không tìm thấy voya_labels tại {VOYA_LABELS_PATH}"
    with open(VOYA_LABELS_PATH, encoding="utf-8") as f:
        return json.load(f)  # type: ignore[no-any-return]


def test_dataset_categories_and_item_counts() -> None:
    data = _load_dataset()
    expected_categories = {"symptom", "body_region", "time", "severity_number", "modifier_allergy"}
    msg = f"Categories không đúng chuẩn: {set(data.keys())}"
    assert set(data.keys()) == expected_categories, msg

    counts = {cat: len(items) for cat, items in data.items()}
    total_items = sum(counts.values())

    # Yêu cầu: danh sách chuẩn hóa 60 mục cho toàn hệ thống
    assert counts["symptom"] == 15
    assert counts["body_region"] == 17
    assert counts["time"] == 10
    assert counts["severity_number"] == 13
    assert counts["modifier_allergy"] == 5
    assert total_items == 60


def test_no_duplicate_glosses() -> None:
    data = _load_dataset()
    all_glosses: list[str] = []
    for cat, items in data.items():
        for item in items:
            gloss = item.get("gloss") or item.get("word", "").upper().replace(" ", "-")
            all_glosses.append(gloss)

    duplicates = [g for g in set(all_glosses) if all_glosses.count(g) > 1]
    assert len(duplicates) == 0, f"Phát hiện gloss trùng lặp: {duplicates}"
    assert len(all_glosses) == len(set(all_glosses))


def test_ho_mapping_is_clean_and_accurate() -> None:
    data = _load_dataset()
    symptoms = data.get("symptom", [])
    ho_item = next((it for it in symptoms if it.get("gloss") == "HO"), None)

    assert ho_item is not None, "Không tìm thấy mục HO trong nhóm symptom"
    # Kiểm tra đã sửa triệt để false positive class_0046 ('không cho (bắc)')
    assert ho_item["class_id"] is None, "Mục HO không được có class_id sai"
    assert ho_item["found_in_vsl_dict"] is None
    # Đã đổi is_model_ready thành has_vsl_voya_class để không gây hiểu nhầm PyTorch runtime
    assert ho_item["has_vsl_voya_class"] is False
    assert ho_item["maps_to"] == {"field": "chief_complaint", "code": "COUGH"}


def test_class_id_integrity_and_dataset_mapping() -> None:
    data = _load_dataset()
    voya = _load_voya_labels()

    for cat, items in data.items():
        for item in items:
            gloss = item["gloss"]
            cid = item.get("class_id")
            has_voya = item.get("has_vsl_voya_class")

            if cid is not None:
                assert (
                    has_voya is True
                ), f"Mục {gloss} có class_id={cid} nhưng has_vsl_voya_class không phải True"
                assert (
                    cid in voya
                ), f"Mục {gloss} có class_id={cid} không tồn tại trong voya_labels.json"
                assert item["found_in_vsl_dict"] is not None
            else:
                assert (
                    has_voya is False
                ), f"Mục {gloss} chưa có class_id nhưng has_vsl_voya_class lại là True"
                assert item["found_in_vsl_dict"] is None


def test_ontology_mappings_are_valid() -> None:
    data = _load_dataset()

    with open(CHIEF_COMPLAINTS_PATH, encoding="utf-8") as f:
        complaints = json.load(f)
    valid_complaint_codes = {c["code"] for c in complaints}

    with open(BODY_REGIONS_PATH, encoding="utf-8") as f:
        regions = json.load(f)
    valid_region_codes = {r["code"] for r in regions}

    for cat, items in data.items():
        for item in items:
            maps_to = item.get("maps_to")
            assert maps_to is not None, f"Mục {item['gloss']} thiếu maps_to"
            field = maps_to.get("field")

            if field == "chief_complaint":
                code = maps_to.get("code")
                assert (
                    code in valid_complaint_codes
                ), f"Gloss {item['gloss']} map tới chief_complaint không hợp lệ: {code}"

            elif field == "pain.body_regions":
                code = maps_to.get("code")
                assert (
                    code in valid_region_codes
                ), f"Gloss {item['gloss']} map tới body_regions không hợp lệ: {code}"

            elif field == "pain.severity":
                val = maps_to.get("value")
                assert isinstance(val, int) and 0 <= val <= 10, f"Mức đau không hợp lệ: {val}"

            elif field == "pain.onset":
                unit = maps_to.get("unit")
                assert unit in [
                    "minute",
                    "hour",
                    "day",
                    "week",
                    "month",
                ], f"Onset unit không hợp lệ: {unit}"

            elif field in ("allergy.has_allergy", "modifier"):
                assert isinstance(maps_to.get("value"), bool)


def test_cross_file_dataset_and_ontology_consistency() -> None:
    """
    Test cross-file phát hiện thừa/thiếu gloss giữa AI_model/data/medical_vsl_30.json
    và backend/app/domain/ontology/vsl_gloss.json.
    """
    dataset_data = _load_dataset()
    ontology_data = _load_vsl_gloss()

    dataset_glosses = {
        item["gloss"]
        for items in dataset_data.values()
        for item in items
    }
    ontology_glosses = {item["gloss"] for item in ontology_data}

    # Cả hai nguồn phải chứa chính xác 60 gloss
    assert len(dataset_glosses) == 60, f"Dataset có {len(dataset_glosses)} gloss (mong đợi 60)"
    assert len(ontology_glosses) == 60, f"Ontology có {len(ontology_glosses)} gloss (mong đợi 60)"

    # Không được có gloss nào bị thừa hoặc thiếu giữa 2 file
    missing_in_ontology = dataset_glosses - ontology_glosses
    missing_in_dataset = ontology_glosses - dataset_glosses
    assert (
        not missing_in_ontology
    ), f"Gloss có trong dataset nhưng thiếu trong ontology: {missing_in_ontology}"
    assert (
        not missing_in_dataset
    ), f"Gloss có trong ontology nhưng thiếu trong dataset: {missing_in_dataset}"

    # Kiểm tra mapping tương đồng
    ontology_map = {item["gloss"]: item for item in ontology_data}
    for items in dataset_data.values():
        for item in items:
            g = item["gloss"]
            ont_item = ontology_map[g]
            assert ont_item["category"] == item["category"], f"Sai category ở {g}"
            assert ont_item.get("maps_to") == item.get("maps_to"), f"Sai maps_to ở {g}"
