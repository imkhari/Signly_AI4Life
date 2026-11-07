import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTTS } from '../../src/hooks/useTTS';
import { SessionProvider } from '../../src/state/SessionContext';

describe('useTTS hook', () => {
  const mockSpeak = vi.fn();
  const mockCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'speechSynthesis', {
      writable: true,
      value: {
        speak: mockSpeak,
        cancel: mockCancel,
        getVoices: vi.fn().mockReturnValue([
          { name: 'Google tiếng Việt', lang: 'vi-VN' },
        ]),
        onvoiceschanged: null,
      },
    });

    // Mock SpeechSynthesisUtterance
    class MockUtterance {
      text: string;
      lang: string = 'vi-VN';
      rate: number = 1;
      voice: unknown = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    }
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      writable: true,
      value: MockUtterance,
    });
  });

  it('detects Vietnamese voice and speaks with normalized numbers', () => {
    const { result } = renderHook(() => useTTS(), {
      wrapper: SessionProvider,
    });

    expect(result.current.isSupported).toBe(true);
    expect(result.current.hasViVoice).toBe(true);

    act(() => {
      result.current.speak('Bạn bị đau mức 7/10');
    });

    expect(result.current.isSpeaking).toBe(true);
    expect(result.current.subtitle).toBe('Bạn bị đau mức 7/10');
    expect(mockCancel).toHaveBeenCalled();
    expect(mockSpeak).toHaveBeenCalled();
  });

  it('stops speaking and clears subtitle on stop()', () => {
    const { result } = renderHook(() => useTTS(), {
      wrapper: SessionProvider,
    });

    act(() => {
      result.current.speak('Kiểm tra triệu chứng');
    });
    expect(result.current.isSpeaking).toBe(true);

    act(() => {
      result.current.stop();
    });

    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.subtitle).toBeNull();
    expect(mockCancel).toHaveBeenCalled();
  });

  it('falls back to visual subtitle when no Vietnamese voice is found', () => {
    vi.useFakeTimers();
    (window.speechSynthesis.getVoices as ReturnType<typeof vi.fn>).mockReturnValue([
      { name: 'English Voice', lang: 'en-US' },
    ]);

    const { result } = renderHook(() => useTTS(), {
      wrapper: SessionProvider,
    });

    expect(result.current.hasViVoice).toBe(false);

    act(() => {
      result.current.speak('Chỉ hiển thị phụ đề trực quan');
    });

    expect(result.current.isSpeaking).toBe(true);
    expect(result.current.subtitle).toBe('Chỉ hiển thị phụ đề trực quan');
    // Should NOT speak with the foreign voice
    expect(mockSpeak).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(3500);
    });

    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.subtitle).toBeNull();
    vi.useRealTimers();
  });
});
