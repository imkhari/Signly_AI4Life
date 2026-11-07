from app.domain.models import (
    NurseAttentionItem,
    NurseConfirmedItem,
    NurseView,
    SemanticFrame,
)


def build_nurse_view(frame: SemanticFrame) -> NurseView:
    confirmed: list[NurseConfirmedItem] = []
    needs_attention: list[NurseAttentionItem] = []

    # 1. Chief complaint
    if frame.chief_complaint.label_vi:
        confirmed.append(
            NurseConfirmedItem(
                label_vi="Lý do khám",
                detail=frame.chief_complaint.label_vi,
            )
        )

    # 2. Pain
    if frame.pain.present is True:
        regions = ", ".join(frame.pain.body_regions) if frame.pain.body_regions else "Chưa rõ vùng"
        sev = f"Mức {frame.pain.severity}/10" if frame.pain.severity is not None else "Chưa rõ mức"
        onset_str = ""
        if frame.pain.onset and frame.pain.onset.value is not None:
            unit_vi = {
                "minute": "phút",
                "hour": "giờ",
                "day": "ngày",
                "week": "tuần",
                "month": "tháng",
            }.get(frame.pain.onset.unit or "", frame.pain.onset.unit or "")
            onset_str = f", bắt đầu {frame.pain.onset.value} {unit_vi} trước"
        confirmed.append(
            NurseConfirmedItem(
                label_vi="Triệu chứng đau",
                detail=f"{sev}, vị trí: {regions}{onset_str}",
            )
        )
    elif frame.pain.present is False:
        confirmed.append(NurseConfirmedItem(label_vi="Triệu chứng đau", detail="Không có đau"))

    # 3. Allergy
    if frame.allergy.has_allergy is True:
        if frame.allergy.items:
            items_str = ", ".join(f"{it.name}" for it in frame.allergy.items)
            confirmed.append(NurseConfirmedItem(label_vi="Dị ứng", detail=items_str))
    elif frame.allergy.has_allergy is False:
        confirmed.append(NurseConfirmedItem(label_vi="Dị ứng", detail="Không có dị ứng"))

    # 4. Alerts / Needs attention
    for alert in frame.conflicts:
        needs_attention.append(NurseAttentionItem(level=alert.level, message_vi=alert.message_vi))

    for missing in frame.missing_fields:
        if missing == "allergy.has_allergy" and not any(
            a.message_vi == "Chưa khai dị ứng" for a in needs_attention
        ):
            needs_attention.append(
                NurseAttentionItem(level="warning", message_vi="Chưa khai dị ứng")
            )

    return NurseView(confirmed=confirmed, needs_attention=needs_attention)
