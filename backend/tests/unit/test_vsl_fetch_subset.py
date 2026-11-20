import pytest
from AI_model.vsl_v2.fetch_test_subset import select_identifiers


def references():
    identifiers = [f"SENT{i:03}_S06_R01_F" for i in range(1, 301)]
    return {"predictions": [{"clip_id": item} for item in identifiers]}, dict.fromkeys(
        identifiers, "a" * 64
    )


def test_only_requested_known_public_clips_are_selected():
    report, manifest = references()
    chosen = [f"SENT{i:03}_S06_R01_F" for i in (101, 103, 105, 115)]
    assert select_identifiers(report, manifest, chosen) == chosen
    assert len(select_identifiers(report, manifest, None)) == 300


@pytest.mark.parametrize("requested", [[], ["../../private"], ["not-in-replay"],
                                       ["SENT101_S06_R01_F"] * 2])
def test_invalid_or_duplicate_subset_is_rejected_before_network(requested):
    report, manifest = references()
    with pytest.raises(ValueError):
        select_identifiers(report, manifest, requested)
