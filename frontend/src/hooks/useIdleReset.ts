import { useCallback, useEffect, useRef, useState } from 'react';

interface UseIdleResetOptions {
  idleTimeoutMs?: number; // Mặc định 10 phút (600,000 ms)
  warningDurationMs?: number; // Cảnh báo trước 60 giây (60,000 ms)
  onTimeout: () => void;
  enabled?: boolean;
}

export function useIdleReset({
  idleTimeoutMs = 600000,
  warningDurationMs = 60000,
  onTimeout,
  enabled = true,
}: UseIdleResetOptions) {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(Math.round(warningDurationMs / 1000));

  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAllTimers = useCallback(() => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
  }, []);

  const resetIdleTimer = useCallback(() => {
    if (!enabled) return;
    clearAllTimers();
    setShowWarning(false);
    setSecondsRemaining(Math.round(warningDurationMs / 1000));

    // Thời gian cho tới khi bật cảnh báo
    const timeUntilWarning = Math.max(idleTimeoutMs - warningDurationMs, 0);

    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setSecondsRemaining(Math.round(warningDurationMs / 1000));

      countdownIntervalRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      timeoutTimerRef.current = setTimeout(() => {
        clearAllTimers();
        onTimeout();
      }, warningDurationMs);
    }, timeUntilWarning);
  }, [enabled, idleTimeoutMs, warningDurationMs, onTimeout, clearAllTimers]);

  useEffect(() => {
    if (!enabled) return;

    const activityEvents = ['pointerdown', 'keydown', 'touchstart', 'scroll'];
    const handleActivity = () => {
      if (!showWarning) {
        resetIdleTimer();
      }
    };

    activityEvents.forEach((ev) => window.addEventListener(ev, handleActivity, { passive: true }));
    resetIdleTimer();

    return () => {
      clearAllTimers();
      activityEvents.forEach((ev) => window.removeEventListener(ev, handleActivity));
    };
  }, [enabled, showWarning, resetIdleTimer, clearAllTimers]);

  const dismissWarning = useCallback(() => {
    resetIdleTimer();
  }, [resetIdleTimer]);

  return {
    showWarning,
    secondsRemaining,
    dismissWarning,
  };
}

