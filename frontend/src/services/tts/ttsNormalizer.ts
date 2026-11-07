const DIGIT_WORDS: Record<string, string> = {
  '0': 'không',
  '1': 'một',
  '2': 'hai',
  '3': 'ba',
  '4': 'bốn',
  '5': 'năm',
  '6': 'sáu',
  '7': 'bảy',
  '8': 'tám',
  '9': 'chín',
  '10': 'mười',
};

/**
 * Chuẩn hóa văn bản y tế cho TTS tiếng Việt đọc tự nhiên
 * Ví dụ: "mức 7/10" -> "mức bảy trên mười"
 *        "cách đây 2 giờ" -> "cách đây hai giờ"
 */
export function normalizeTextForTTS(text: string): string {
  if (!text) return '';

  let normalized = text;

  // 1. Chuyển đổi thang điểm đau: "X/10" -> "X trên mười"
  normalized = normalized.replace(/(\b\d{1,2})\s*\/\s*10\b/g, (_match, num) => {
    const word = DIGIT_WORDS[num] || num;
    return `${word} trên mười`;
  });

  // 2. Chuyển đổi các số nhỏ kèm đơn vị thời gian (phút, giờ, ngày, tuần, tháng)
  // Lưu ý: Không dùng \b ở đuôi vì tiếng Việt có dấu (giờ, ngày, tuần) không thuộc \w trong ASCII regex
  normalized = normalized.replace(
    /(^|\s)(\d{1,2})\s*(giờ|ngày|tuần|tháng|phút)(?=[.,!?\s]|$)/gi,
    (_match, prefix, num, unit) => {
      const word = DIGIT_WORDS[num] || num;
      return `${prefix}${word} ${unit}`;
    }
  );

  return normalized;
}
