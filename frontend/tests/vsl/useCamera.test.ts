import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCamera } from '../../src/hooks/useCamera';
import { SessionProvider } from '../../src/state/SessionContext';

describe('useCamera hook', () => {
  const mockTrack = {
    stop: vi.fn(),
  };

  const mockStream = {
    getTracks: vi.fn().mockReturnValue([mockTrack]),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(global.navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
      },
    });
  });

  it('starts camera and sets status to active', async () => {
    const { result } = renderHook(() => useCamera(), {
      wrapper: SessionProvider,
    });

    expect(result.current.status).toBe('idle');

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.status).toBe('active');
    expect(result.current.isActive).toBe(true);
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    });
  });

  it('stops camera and calls track.stop() to release hardware', async () => {
    const { result } = renderHook(() => useCamera(), {
      wrapper: SessionProvider,
    });

    await act(async () => {
      await result.current.start();
    });

    act(() => {
      result.current.stop();
    });

    expect(result.current.status).toBe('idle');
    expect(mockTrack.stop).toHaveBeenCalled();
  });

  it('handles permission denied error cleanly', async () => {
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockRejectedValueOnce({
      name: 'NotAllowedError',
      message: 'Permission denied',
    });

    const { result } = renderHook(() => useCamera(), {
      wrapper: SessionProvider,
    });

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.status).toBe('denied');
    expect(result.current.errorMessage).toContain('Quyền truy cập camera bị từ chối');
  });
});
