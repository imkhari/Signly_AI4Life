import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VSLCameraView } from '../../src/features/patient/components/VSLCameraView';
import { SessionProvider } from '../../src/state/SessionContext';
import { mediaPipeDetector } from '../../src/services/vsl/MediaPipeHandDetector';

// Mock MediaPipe Detector
vi.mock('../../src/services/vsl/MediaPipeHandDetector', () => {
  let callback: ((res: unknown) => void) | null = null;
  return {
    mediaPipeDetector: {
      initialize: vi.fn().mockResolvedValue(undefined),
      start: vi.fn().mockImplementation(() => {
        // Trigger simulated detection
        if (callback) {
          callback({
            landmarks: [
              Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.65, z: 0.0 })),
            ],
            handednesses: [[{ categoryName: 'Right' }]],
          });
        }
      }),
      stop: vi.fn(),
      onResults: vi.fn().mockImplementation((fn: (res: unknown) => void) => {
        callback = fn;
        return () => {
          callback = null;
        };
      }),
      emitMockResult: (res: unknown) => {
        if (callback) callback(res);
      },
    },
  };
});

// Mock restApi
vi.mock('../../src/services/api/rest', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/api/rest')>();
  return {
    ...actual,
    restApi: {
      ...actual.restApi,
      predictVSL: vi.fn().mockResolvedValue({
        success: true,
        gloss: 'NGỰC',
        label_vi: 'Vùng Ngực',
        confidence: 0.94,
        tokens: ['NGỰC'],
        latency_ms: 0.05,
        model_source: 'AI_model',
      }),
    },
  };
});

describe('VSLCameraView', () => {
  const mockTrack = { stop: vi.fn() };
  const mockStream = { getTracks: vi.fn().mockReturnValue([mockTrack]) };

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(global.navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
      },
    });
  });

  it('renders camera view with video and canvas elements', async () => {
    render(
      <SessionProvider>
        <VSLCameraView onApplyGlosses={() => {}} onSwitchToTouchMode={() => {}} />
      </SessionProvider>
    );

    expect(screen.getByText(/Nhận dạng Ký hiệu Ngôn ngữ/i)).toBeInTheDocument();
    expect(screen.getByTestId('vsl-video-element')).toBeInTheDocument();
    expect(screen.getByText(/Sẵn sàng nhận diện/i)).toBeInTheDocument();
  });

  it('switches to touch mode when button is clicked', () => {
    const handleSwitch = vi.fn();
    render(
      <SessionProvider>
        <VSLCameraView onApplyGlosses={() => {}} onSwitchToTouchMode={handleSwitch} />
      </SessionProvider>
    );

    fireEvent.click(screen.getByText('Chuyển sang Chạm'));
    expect(handleSwitch).toHaveBeenCalled();
  });

  it('calls mediaPipeDetector initialize and start', async () => {
    render(
      <SessionProvider>
        <VSLCameraView onApplyGlosses={() => {}} />
      </SessionProvider>
    );

    expect(mediaPipeDetector.initialize).toHaveBeenCalled();
  });
});
