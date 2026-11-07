import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VSLCameraView } from '../../src/features/patient/components/VSLCameraView';
import { SessionProvider } from '../../src/state/SessionContext';

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

  it('renders camera view and mock gloss toolbar', async () => {
    render(
      <SessionProvider>
        <VSLCameraView onApplyGlosses={() => {}} onSwitchToTouchMode={() => {}} />
      </SessionProvider>
    );

    expect(screen.getByText('Nhận dạng Ký hiệu Ngôn ngữ (VSL)')).toBeInTheDocument();
    expect(screen.getByTestId('vsl-video-element')).toBeInTheDocument();
    expect(screen.getByTestId('mock-gloss-btn-ĐAU')).toBeInTheDocument();
    expect(screen.getByTestId('mock-gloss-btn-NGỰC')).toBeInTheDocument();
  });

  it('adds candidate gloss when mock gloss button is clicked and confirms it', async () => {
    const handleApply = vi.fn();
    render(
      <SessionProvider>
        <VSLCameraView onApplyGlosses={handleApply} />
      </SessionProvider>
    );

    // Click mock "ĐAU" button
    act(() => {
      fireEvent.click(screen.getByTestId('mock-gloss-btn-ĐAU'));
    });

    // Expect candidate chip to appear
    expect(screen.getByTestId('candidate-gloss-ĐAU')).toBeInTheDocument();

    // Confirm the candidate
    const confirmBtn = screen.getByTestId('btn-confirm-gloss-ĐAU');
    act(() => {
      fireEvent.click(confirmBtn);
    });

    // Candidate disappears and confirmed section has 1 gloss
    expect(screen.queryByTestId('candidate-gloss-ĐAU')).not.toBeInTheDocument();
    expect(screen.getByText('1 từ đã chọn')).toBeInTheDocument();

    // Click apply
    const applyBtn = screen.getByTestId('btn-apply-vsl-glosses');
    act(() => {
      fireEvent.click(applyBtn);
    });

    expect(handleApply).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ gloss: 'ĐAU', label_vi: 'Đau' }),
      ])
    );
  });

  it('displays low confidence warning when confidence is less than 0.6', () => {
    render(
      <SessionProvider>
        <VSLCameraView onApplyGlosses={() => {}} />
      </SessionProvider>
    );

    // Run low confidence scenario button
    act(() => {
      fireEvent.click(screen.getByText(/Kịch bản: Độ tin cậy thấp/i));
    });

    // Wait for the scenario timeout
    vi.useFakeTimers();
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(screen.getByText(/Độ tin cậy thấp/i)).toBeInTheDocument();
    vi.useRealTimers();
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
});
