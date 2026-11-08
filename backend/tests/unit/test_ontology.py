from app.domain.ontology.loader import (
    find_body_region_by_code,
    find_chief_complaint_by_code,
    find_drug_names_in_text,
    load_body_regions,
    load_chief_complaints,
    load_drug_names,
    load_vsl_gloss,
    match_body_regions_from_text,
    match_chief_complaint_from_text,
)


def test_ontology_loaders() -> None:
    complaints = load_chief_complaints()
    assert len(complaints) >= 11
    assert any(c["code"] == "PAIN" for c in complaints)

    regions = load_body_regions()
    assert len(regions) >= 15
    assert any(r["code"] == "CHEST" for r in regions)

    glosses = load_vsl_gloss()
    assert len(glosses) >= 15
    assert any(g["gloss"] == "ĐAU" for g in glosses)

    drugs = load_drug_names()
    assert len(drugs) >= 15
    assert "penicillin" in drugs


def test_find_by_code() -> None:
    item = find_chief_complaint_by_code("PAIN")
    assert item is not None
    assert item["label_vi"] == "Đau"

    unknown = find_chief_complaint_by_code("UNKNOWN_XYZ")
    assert unknown is None

    region = find_body_region_by_code("HEAD")
    assert region is not None
    assert region["label_vi"] == "Đầu"

    unknown_region = find_body_region_by_code("NON_EXISTING")
    assert unknown_region is None


def test_match_from_text() -> None:
    # Chief complaint
    cc = match_chief_complaint_from_text("Tôi bị sốt cao từ sáng")
    assert cc is not None
    assert cc["code"] == "FEVER"

    no_cc = match_chief_complaint_from_text("Hôm nay trời đẹp")
    assert no_cc is None

    # Body regions
    regions = match_body_regions_from_text("Tôi bị nhức đầu và đau nhói ở ngực")
    assert "HEAD" in regions
    assert "CHEST" in regions

    # Drug names
    drugs = find_drug_names_in_text("Tôi uống amoxicillin và paracetamol nhưng không đỡ")
    assert "amoxicillin" in drugs
    assert "paracetamol" in drugs
