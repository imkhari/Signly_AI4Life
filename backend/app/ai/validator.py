import json
import re
import unicodedata

from pydantic import BaseModel, Field

from app.domain.models import SemanticFrame
from app.domain.ontology.loader import load_body_regions, load_drug_names


class ValidatorReport(BaseModel):
    passed: bool
    violations: list[str] = Field(default_factory=list)


def _strip_accents(text: str) -> str:
    """Loại bỏ dấu tiếng Việt để đối sánh linh hoạt."""
    nfkd = unicodedata.normalize("NFKD", text)
    cleaned = "".join(c for c in nfkd if not unicodedata.combining(c))
    return cleaned.replace("đ", "d").replace("Đ", "D")


def _matches_keyword(keyword: str, text_lower: str, text_unaccented: str) -> bool:
    """Kiểm tra từ khóa có ranh giới từ để tránh khớp nhầm xâu con (ví dụ: 'ung thư')."""
    kw_lower = keyword.lower().strip()
    kw_unaccented = _strip_accents(kw_lower)
    pattern_accented = rf"(?<!\w){re.escape(kw_lower)}(?!\w)"
    pattern_unaccented = rf"(?<!\w){re.escape(kw_unaccented)}(?!\w)"
    return bool(
        re.search(pattern_accented, text_lower)
        or re.search(pattern_unaccented, text_unaccented)
    )


DIAGNOSIS_KEYWORDS = [
    "chẩn đoán",
    "có thể là",
    "nghi ngờ",
    "dấu hiệu của",
    "bị bệnh",
    "mắc bệnh",
    "viêm",
    "ung thư",
    "nhồi máu",
    "đột quỵ",
    "tiểu đường",
    "huyết áp cao",
    "covid",
    "lao",
    "suy ",
    "hội chứng",
    "diagnos",
    "likely",
    "probably",
]

PRESCRIPTION_KEYWORDS = [
    "nên uống",
    "hãy uống",
    "dùng thuốc",
    "liều",
    "viên",
    "tiêm",
    "truyền",
    "kê đơn",
    "điều trị",
    "phẫu thuật",
    "nghỉ ngơi",
    "chườm",
]

REASSURANCE_KEYWORDS = [
    "không sao",
    "đừng lo",
    "nhẹ thôi",
    "nghiêm trọng",
    "nguy hiểm",
    "khẩn cấp",
]

DOSE_PATTERN = re.compile(r"\b\d+\s*(?:mg|ml|mcg|g)\b", re.IGNORECASE)


def validate_summary_output(raw_output: str, frame: SemanticFrame) -> ValidatorReport:
    violations: list[str] = []

    # V1: Format check (JSON, string text_vi, <= 400 chars, <= 4 sentences)
    try:
        data = json.loads(raw_output)
        if (
            not isinstance(data, dict)
            or "text_vi" not in data
            or not isinstance(data["text_vi"], str)
        ):
            violations.append("V1_FORMAT: JSON không chứa trường 'text_vi' kiểu string")
            return ValidatorReport(passed=False, violations=violations)
        text_vi = data["text_vi"].strip()
    except Exception as e:
        violations.append(f"V1_FORMAT: Đầu ra không phải JSON hợp lệ ({e})")
        return ValidatorReport(passed=False, violations=violations)

    if len(text_vi) > 400:
        violations.append(f"V1_FORMAT: Văn bản vượt quá 400 ký tự ({len(text_vi)} ký tự)")

    sentences = [s.strip() for s in re.split(r"[.!?]+", text_vi) if s.strip()]
    if len(sentences) > 4:
        violations.append(f"V1_FORMAT: Văn bản vượt quá 4 câu ({len(sentences)} câu)")

    text_lower = text_vi.lower()
    text_unaccented = _strip_accents(text_lower)

    # V2: Không chẩn đoán
    for kw in DIAGNOSIS_KEYWORDS:
        if _matches_keyword(kw, text_lower, text_unaccented):
            violations.append(f"V2_DIAGNOSIS: Phát hiện từ khóa chẩn đoán/dự đoán: '{kw}'")
            break

    # V3: Không kê đơn/điều trị
    for kw in PRESCRIPTION_KEYWORDS:
        if _matches_keyword(kw, text_lower, text_unaccented):
            violations.append(f"V3_PRESCRIPTION: Phát hiện hướng dẫn điều trị/kê đơn: '{kw}'")
            break

    if DOSE_PATTERN.search(text_vi):
        violations.append("V3_PRESCRIPTION: Phát hiện liều lượng thuốc trong văn bản")

    # V4: Tên thuốc chỉ hợp lệ khi echo dị ứng
    drug_names = load_drug_names()
    declared_allergies = [item.name.lower() for item in frame.allergy.items]
    for drug in drug_names:
        if re.search(rf"(?<!\w){re.escape(drug.lower())}(?!\w)", text_lower):
            if not any(drug in declared for declared in declared_allergies):
                msg = f"V4_UNDECLARED_DRUG: Nhắc đến thuốc '{drug}' chưa khai dị ứng"
                violations.append(msg)
                break

    # V5: Không trấn an/đánh giá
    for kw in REASSURANCE_KEYWORDS:
        if _matches_keyword(kw, text_lower, text_unaccented):
            violations.append(f"V5_REASSURANCE: Phát hiện từ ngữ trấn an/đánh giá: '{kw}'")
            break

    # V6: Không thêm dữ kiện (số và vùng cơ thể)
    frame_numbers: set[int] = set()
    if frame.pain.severity is not None:
        frame_numbers.add(frame.pain.severity)
    if frame.pain.onset and frame.pain.onset.value is not None:
        frame_numbers.add(frame.pain.onset.value)
    frame_numbers.update({1, 2, 3, 4, 10})

    text_numbers = [int(n) for n in re.findall(r"\b\d+\b", text_vi)]
    for num in text_numbers:
        if num not in frame_numbers and num > 10:
            violations.append(f"V6_EXTRA_FACTS: Phát hiện số lạ không có trong dữ liệu: {num}")
            break

    # Kiểm tra vùng cơ thể: phải nằm trong frame.pain.body_regions
    declared_regions = set(frame.pain.body_regions)
    all_regions = load_body_regions()
    # Loại bỏ các cụm từ phổ biến chứa từ 'đầu' nhưng không phải là vùng đầu cơ thể
    text_for_regions = re.sub(r"\b(?:bắt đầu|ban đầu|lúc đầu|từ đầu|đầu tiên)\b", "", text_lower)
    for reg in all_regions:
        reg_code = reg["code"]
        reg_syns = reg.get("synonyms_vi", [])
        mentioned = False
        for syn in reg_syns:
            syn_lower = syn.lower()
            pattern = rf"(?<!\w){re.escape(syn_lower)}(?!\w)"
            if re.search(pattern, text_for_regions):
                mentioned = True
                break
        if mentioned and reg_code not in declared_regions:
            if frame.pain.present is not False:
                msg = f"V6_EXTRA_FACTS: Nhắc đến vùng cơ thể chưa được chọn: '{reg['label_vi']}'"
                violations.append(msg)
                break

    # V7: Phản ánh thiếu/mâu thuẫn
    has_missing_or_conflicts = bool(frame.missing_fields or frame.conflicts)
    if has_missing_or_conflicts:
        has_ack_phrase = "chưa rõ" in text_lower or "chưa khớp" in text_lower
        if not has_ack_phrase:
            msg = "V7_MISSING_REFLECTION: Không chứa 'Chưa rõ' hoặc 'chưa khớp' khi thiếu/mâu thuẫn"
            violations.append(msg)

    # V8: Ngôn ngữ chủ yếu tiếng Việt
    letters = [c for c in text_vi if c.isalpha()]
    if letters:
        vietnamese_latin_count = sum(
            1 for c in letters if "LATIN" in unicodedata.name(c, "")
        )
        ratio = vietnamese_latin_count / len(letters)
        if ratio < 0.9:
            violations.append(f"V8_LANGUAGE: Ngôn ngữ không chuẩn tiếng Việt (tỷ lệ {ratio:.2f})")

    return ValidatorReport(passed=len(violations) == 0, violations=violations)
