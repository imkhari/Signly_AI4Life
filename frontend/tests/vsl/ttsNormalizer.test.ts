import { describe, it, expect } from 'vitest';
import { normalizeTextForTTS } from '../../src/services/tts/ttsNormalizer';

describe('ttsNormalizer', () => {
  it('converts pain scale fractions to natural Vietnamese words', () => {
    expect(normalizeTextForTTS('Mức đau: 7/10')).toBe('Mức đau: bảy trên mười');
    expect(normalizeTextForTTS('Đau 0/10')).toBe('Đau không trên mười');
    expect(normalizeTextForTTS('Mức 10/10 dữ dội')).toBe('Mức mười trên mười dữ dội');
    expect(normalizeTextForTTS('Đau ở mức 3/10')).toBe('Đau ở mức ba trên mười');
  });

  it('converts number + time units to natural words', () => {
    expect(normalizeTextForTTS('Bắt đầu cách đây 2 giờ')).toBe('Bắt đầu cách đây hai giờ');
    expect(normalizeTextForTTS('Đau khoảng 3 ngày nay')).toBe('Đau khoảng ba ngày nay');
    expect(normalizeTextForTTS('Kéo dài 1 tuần')).toBe('Kéo dài một tuần');
  });

  it('handles empty or normal text without changes', () => {
    expect(normalizeTextForTTS('')).toBe('');
    expect(normalizeTextForTTS('Bạn không có dị ứng thuốc.')).toBe('Bạn không có dị ứng thuốc.');
  });
});
