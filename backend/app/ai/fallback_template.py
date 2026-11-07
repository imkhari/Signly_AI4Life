from app.domain.models import SemanticFrame
from app.domain.ontology.loader import find_body_region_by_code, find_chief_complaint_by_code


def render_fallback_template(frame: SemanticFrame) -> str:
    """Ghép câu cố định an toàn từ SemanticFrame mà không dùng LLM."""
    sentences: list[str] = []

    # 1. Lý do khám
    cc_label = frame.chief_complaint.label_vi
    if not cc_label and frame.chief_complaint.code:
        item = find_chief_complaint_by_code(frame.chief_complaint.code)
        if item:
            cc_label = item["label_vi"]

    if cc_label:
        sentences.append(f"Bạn đến khám vì: {cc_label}.")
    else:
        sentences.append("Chưa rõ: lý do khám.")

    # 2. Tình trạng đau
    if frame.pain.present is True:
        # Vùng đau
        region_labels: list[str] = []
        for reg_code in frame.pain.body_regions:
            reg_item = find_body_region_by_code(reg_code)
            region_labels.append(reg_item["label_vi"] if reg_item else reg_code)

        regions_str = ", ".join(region_labels) if region_labels else "vị trí chưa rõ"
        severity_str = f"{frame.pain.severity}/10" if frame.pain.severity is not None else "Chưa rõ"

        onset_str = "chưa rõ thời gian"
        if frame.pain.onset and frame.pain.onset.value is not None:
            unit_vi = {
                "minute": "phút",
                "hour": "giờ",
                "day": "ngày",
                "week": "tuần",
                "month": "tháng",
            }.get(frame.pain.onset.unit or "hour", "giờ")
            onset_str = f"{frame.pain.onset.value} {unit_vi}"

        sentences.append(
            f"Bạn bị đau ở {regions_str}, mức {severity_str}, bắt đầu cách đây {onset_str}."
        )
    elif frame.pain.present is False:
        sentences.append("Bạn không bị đau.")
    else:
        sentences.append("Chưa rõ: tình trạng đau.")

    # 3. Dị ứng
    if frame.allergy.has_allergy is False:
        sentences.append("Dị ứng: Không.")
    elif frame.allergy.has_allergy is True:
        item_names = [item.name for item in frame.allergy.items if item.name]
        items_str = ", ".join(item_names) if item_names else "chưa rõ tên chất"
        sentences.append(f"Dị ứng: Có ({items_str}).")
    else:  # None or "unsure"
        sentences.append("Dị ứng: Chưa rõ.")

    # 4. Mâu thuẫn
    if frame.conflicts:
        sentences.append("Thông tin chưa khớp, y tá sẽ hỏi lại bạn.")

    return " ".join(sentences)
