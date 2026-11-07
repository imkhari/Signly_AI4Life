import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from '../state/SessionContext';

export type CameraStatus =
  | 'idle'
  | 'requesting'
  | 'active'
  | 'denied'
  | 'error'
  | 'unsupported';

export function useCamera() {
  const { state } = useSession();
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoElementRef.current) {
      videoElementRef.current.srcObject = null;
    }
    setStatus('idle');
  }, []);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus('unsupported');
      setErrorMessage('Trình duyệt hoặc thiết bị này không hỗ trợ truy cập camera.');
      return;
    }

    try {
      setStatus('requesting');
      setErrorMessage(null);

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = mediaStream;
      if (videoElementRef.current) {
        videoElementRef.current.srcObject = mediaStream;
      }
      setStatus('active');
    } catch (err: unknown) {
      const error = err as { name?: string; message?: string };
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setStatus('denied');
        setErrorMessage(
          'Quyền truy cập camera bị từ chối. Bạn có thể cho phép camera trong cài đặt trình duyệt hoặc chuyển sang chế độ Chạm/Chữ.'
        );
      } else {
        setStatus('error');
        setErrorMessage(
          'Không thể khởi động camera. Vui lòng kiểm tra thiết bị hoặc sử dụng chế độ Chạm/Chữ.'
        );
      }
    }
  }, []);

  // Gán video element
  const bindVideoRef = useCallback((el: HTMLVideoElement | null) => {
    videoElementRef.current = el;
    if (el && streamRef.current) {
      el.srcObject = streamRef.current;
    }
  }, []);

  // Tự động dừng camera khi phiên làm việc bị xóa (SESSION_RESET / Privacy-by-design)
  useEffect(() => {
    if (!state.sessionId) {
      stop();
    }
  }, [state.sessionId, stop]);

  // Tự động giải phóng camera khi unmount hook
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    status,
    errorMessage,
    isActive: status === 'active',
    start,
    stop,
    bindVideoRef,
  };
}
