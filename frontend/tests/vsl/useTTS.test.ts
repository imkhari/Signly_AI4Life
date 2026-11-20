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

it('ignores late callbacks from a cancelled utterance while a new one is speaking',()=>{
  const {result,unmount}=renderHook(()=>useTTS());
  const ended=vi.fn();
  act(()=>result.current.speak('Câu trước',ended));
  const old=(window.speechSynthesis.speak as ReturnType<typeof vi.fn>).mock.calls.at(-1)![0];
  act(()=>result.current.speak('Câu mới'));
  act(()=>{old.onend?.();old.onerror?.();});
  expect(result.current.isSpeaking).toBe(true);
  expect(result.current.subtitle).toBe('Câu mới');
  expect(ended).not.toHaveBeenCalled();unmount();
});

it('switches ownership between buttons and does not cancel another button on unmount',()=>{
  const first=renderHook(()=>useTTS()),second=renderHook(()=>useTTS());
  act(()=>first.result.current.speak('Câu thứ nhất'));
  act(()=>second.result.current.speak('Câu thứ hai'));
  expect(first.result.current.isSpeaking).toBe(false);
  expect(second.result.current.isSpeaking).toBe(true);
  const cancel=window.speechSynthesis.cancel as ReturnType<typeof vi.fn>;
  const calls=cancel.mock.calls.length;
  first.unmount();expect(cancel).toHaveBeenCalledTimes(calls);
  second.unmount();expect(cancel).toHaveBeenCalledTimes(calls+1);
});

it('keeps voice listeners independent and removes them on unmount',()=>{
  const bus=new EventTarget();
  Object.assign(window.speechSynthesis,{addEventListener:bus.addEventListener.bind(bus),removeEventListener:bus.removeEventListener.bind(bus)});
  const first=renderHook(()=>useTTS()),second=renderHook(()=>useTTS());
  first.unmount();
  const voices=window.speechSynthesis.getVoices as ReturnType<typeof vi.fn>;
  voices.mockReturnValue([]);const before=voices.mock.calls.length;
  act(()=>bus.dispatchEvent(new Event('voiceschanged')));
  expect(second.result.current.hasViVoice).toBe(false);
  expect(voices).toHaveBeenCalledTimes(before+1);
  second.unmount();bus.dispatchEvent(new Event('voiceschanged'));
  expect(voices).toHaveBeenCalledTimes(before+1);
});
});
