import { useCallback, useEffect, useState } from 'react';

export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [subtitle, setSubtitle] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('speechSynthesis' in window);
  }, []);

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setSubtitle(null);
  }, []);

  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!text || !('speechSynthesis' in window)) {
        onEnd?.();
        return;
      }

      window.speechSynthesis.cancel();
      setSubtitle(text);
      setIsSpeaking(true);

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.rate = 0.95; // Tốc độ vừa phải cho môi trường y tế

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
    []
  );

  return {
    isSpeaking,
    subtitle,
    isSupported,
    speak,
    stop,
  };
}

