import { useCallback, useEffect, useRef, useState } from 'react';
import { normalizeTextForTTS } from '../services/tts/ttsNormalizer';
import { useOptionalSession } from '../state/SessionContext';

export function useTTS() {
  const session = useOptionalSession();
  const sessionId = session?.state.sessionId;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [subtitle, setSubtitle] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [hasViVoice, setHasViVoice] = useState(false);
  const viVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const fallbackTimerRef = useRef<number | null>(null);

  // Phát hiện hỗ trợ Web Speech API và tìm giọng tiếng Việt (vi-VN)
  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const viVoice = voices.find(
        (v) => v.lang.toLowerCase().startsWith('vi') || v.name.toLowerCase().includes('vietnam')
      );
      if (viVoice) {
        viVoiceRef.current = viVoice;
        setHasViVoice(true);
      } else {
        viVoiceRef.current = null;
        setHasViVoice(false);
      }
    };

    updateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (fallbackTimerRef.current !== null) {
      window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    setIsSpeaking(false);
    setSubtitle(null);
  }, []);

  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!text) {
        onEnd?.();
        return;
      }

      stop();
      setSubtitle(text);
      setIsSpeaking(true);

      const normalized = normalizeTextForTTS(text);

      const hasUtterance = typeof window !== 'undefined' && 'SpeechSynthesisUtterance' in window;

      // Nếu không hỗ trợ hoặc không có giọng tiếng Việt:
      // Chỉ hiển thị phụ đề trực quan (A11y/Deaf accessibility) thay vì phát giọng ngoại quốc sai âm điệu
      if (!isSupported || !viVoiceRef.current || !hasUtterance) {
        const readingDuration = Math.max(2000, Math.min(6000, text.length * 70));
        fallbackTimerRef.current = window.setTimeout(() => {
          setIsSpeaking(false);
          setSubtitle(null);
          onEnd?.();
        }, readingDuration);
        return;
      }

      const utterance = new window.SpeechSynthesisUtterance(normalized);
      utterance.voice = viVoiceRef.current;
      utterance.lang = 'vi-VN';
      utterance.rate = 0.95; // Tốc độ vừa phải cho tiếp nhận y tế

      utterance.onend = () => {
        setIsSpeaking(false);
        setSubtitle(null);
        onEnd?.();
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        setSubtitle(null);
        onEnd?.();
      };

      window.speechSynthesis.speak(utterance);
    },
    [isSupported, stop]
  );

  // Tự động dừng TTS khi kết thúc phiên (SESSION_RESET / Privacy)
  useEffect(() => {
    if (!sessionId) {
      stop();
    }
  }, [sessionId, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    isSpeaking,
    subtitle,
    isSupported,
    hasViVoice,
    speak,
    stop,
  };
}
