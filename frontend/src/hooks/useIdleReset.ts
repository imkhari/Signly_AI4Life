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
  const warningVisibleRef = useRef(false);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  const clearAllTimers = useCallback(() => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
    warningTimerRef.current = countdownIntervalRef.current = timeoutTimerRef.current = null;
  }, []);

  const resetIdleTimer = useCallback(() => {
    if (!enabled) return;
    clearAllTimers();
    warningVisibleRef.current = false;
    setShowWarning(false);
    const timeoutMs = Math.max(0, idleTimeoutMs);
    const warningMs = Math.min(Math.max(0, warningDurationMs), timeoutMs);
    const deadline = Date.now() + timeoutMs;
    setSecondsRemaining(Math.ceil(warningMs / 1000));

    // Thời gian cho tới khi bật cảnh báo
    const timeUntilWarning = timeoutMs - warningMs;

    warningTimerRef.current = setTimeout(() => {
      warningVisibleRef.current = true;
      setShowWarning(true);
      const updateCountdown = () => setSecondsRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
      updateCountdown();
      countdownIntervalRef.current = setInterval(updateCountdown, 1000);
    }, timeUntilWarning);
    timeoutTimerRef.current = setTimeout(() => {
      clearAllTimers();
      warningVisibleRef.current = false;
      setShowWarning(false);
      setSecondsRemaining(0);
      onTimeoutRef.current();
    }, timeoutMs);
  }, [enabled, idleTimeoutMs, warningDurationMs, clearAllTimers]);

  useEffect(() => {
    if (!enabled) {
      clearAllTimers();
      warningVisibleRef.current = false;
      setShowWarning(false);
      return;
    }

    const activityEvents = ['pointerdown', 'keydown', 'touchstart', 'scroll'];
    const handleActivity = () => {
      if (!warningVisibleRef.current) {
        resetIdleTimer();
      }
    };

    activityEvents.forEach((ev) => window.addEventListener(ev, handleActivity, { passive: true }));
    resetIdleTimer();

    return () => {
      clearAllTimers();
      activityEvents.forEach((ev) => window.removeEventListener(ev, handleActivity));
    };
  }, [enabled, resetIdleTimer, clearAllTimers]);

  const dismissWarning = useCallback(() => {
    resetIdleTimer();
  }, [resetIdleTimer]);

  return {
    showWarning,
    secondsRemaining,
    dismissWarning,
  };
}

