from typing import Any

# Ngưỡng độ tin cậy của VSL Gloss
GLOSS_CONFIDENCE_THRESHOLD: float = 0.6

# Ngưỡng mức đau khẩn cấp
CRITICAL_PAIN_SEVERITY: int = 10
HIGH_PAIN_SEVERITY: int = 8

# Mã vùng cơ thể và triệu chứng nguy cơ cao
CHEST_REGION_CODE: str = "CHEST"
BLEED_SYMPTOM_CODE: str = "BLEED"
BREATH_DIFFICULTY_CODE: str = "BREATH_DIFFICULTY"
EMERGENCY_HELP_CODE: str = "EMERGENCY_HELP"

# Danh mục tin nhắn cảnh báo mặc định (tiếng Việt)
ALERT_MESSAGES: dict[str, dict[str, Any]] = {
    "PAIN_FALSE_BUT_SEVERITY": {
        "level": "warning",
        "message_vi": (
            "Bạn đã chọn không đau nhưng lại kéo mức đau lớn hơn 0. Vui lòng kiểm tra lại."
        ),
        "needs_nurse_ack": False,
    },
    "PAIN_TRUE_NO_SEVERITY": {
        "level": "warning",
        "message_vi": "Bạn chọn có đau nhưng chưa chọn mức độ đau.",
        "needs_nurse_ack": False,
    },
    "PAIN_TRUE_NO_REGION": {
        "level": "warning",
        "message_vi": "Bạn chọn có đau nhưng chưa chạm chọn vị trí đau trên cơ thể.",
        "needs_nurse_ack": False,
    },
    "PAIN_FALSE_BUT_REGION": {
        "level": "warning",
        "message_vi": "Bạn chọn không đau nhưng có vị trí đau được đánh dấu trên cơ thể.",
        "needs_nurse_ack": False,
    },
    "ALLERGY_FALSE_BUT_ITEMS": {
        "level": "critical",
        "message_vi": (
            "Khai báo không dị ứng nhưng có tên chất dị ứng. Y tá cần xác minh lại ngay."
        ),
        "needs_nurse_ack": True,
    },
    "ALLERGY_TRUE_NO_ITEMS": {
        "level": "warning",
        "message_vi": "Bạn chọn có dị ứng nhưng chưa ghi rõ tên thuốc hoặc thức ăn dị ứng.",
        "needs_nurse_ack": False,
    },
    "ALLERGY_UNSURE": {
        "level": "critical",
        "message_vi": (
            "Bệnh nhân không chắc về tiền sử dị ứng. Y tá cần hỏi kỹ lại trước khi dùng thuốc."
        ),
        "needs_nurse_ack": True,
    },
    "MISSING_ALLERGY": {
        "level": "warning",
        "message_vi": "Chưa khai báo thông tin dị ứng.",
        "needs_nurse_ack": False,
    },
    "MISSING_ONSET": {
        "level": "info",
        "message_vi": "Chưa chọn thời gian bắt đầu đau.",
        "needs_nurse_ack": False,
    },
    "TEXT_MENTIONS_DRUG_NOT_DECLARED": {
        "level": "warning",
        "message_vi": "Có nhắc đến tên thuốc nhưng chưa khai báo trong mục dị ứng.",
        "needs_nurse_ack": False,
    },
    "LOW_CONFIDENCE_GLOSS": {
        "level": "warning",
        "message_vi": "Ký hiệu VSL chưa đủ rõ ràng. Vui lòng xác nhận lại hoặc chọn bằng tay.",
        "needs_nurse_ack": False,
    },
    "EMERGENCY_RED_FLAG": {
        "level": "critical",
        "message_vi": "Dấu hiệu cảnh báo khẩn cấp: Cần hỗ trợ y tế ngay lập tức!",
        "needs_nurse_ack": True,
    },
    "PATIENT_UNSURE": {
        "level": "warning",
        "message_vi": "Bệnh nhân chưa chắc chắn về thông tin đã xác nhận. Gợi ý hỗ trợ phiên dịch.",
        "needs_nurse_ack": False,
    },
}
