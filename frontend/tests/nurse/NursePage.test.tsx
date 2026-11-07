import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { NursePage } from '../../src/features/nurse/NursePage';
import { SessionProvider, useSession } from '../../src/state/SessionContext';
import { restApi } from '../../src/services/api/rest';
import { socketClient } from '../../src/services/ws/socketClient';

// Mock restApi
vi.mock('../../src/services/api/rest', () => ({
  restApi: {
    createSession: vi.fn(),
    joinSession: vi.fn(),
    getHealth: vi.fn(),
    getOntology: vi.fn(),
    forceFallback: vi.fn(),
  },
}));

// Mock socketClient
vi.mock('../../src/services/ws/socketClient', () => {
  const listeners: Record<string, ((data: unknown) => void)[]> = {};
  return {
    socketClient: {
      connect: vi.fn(),
      disconnect: vi.fn(),
      send: vi.fn(),
      getLastSeq: vi.fn().mockReturnValue(0),
      onStatusChange: vi.fn().mockReturnValue(() => {}),
      on: vi.fn().mockImplementation((ev: string, fn: (data: unknown) => void) => {
        listeners[ev] = listeners[ev] || [];
        listeners[ev].push(fn);
        return () => {
          listeners[ev] = listeners[ev].filter((f) => f !== fn);
        };
      }),
      emitMock: (ev: string, data: unknown) => {
        (listeners[ev] || []).forEach((fn) => fn(data));
      },
    },
  };
});

describe('NursePage integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (restApi.createSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      session_id: 'test-session-123',
      pairing_code: 'ABC888',
      token_nurse: 'nurse-secret-token',
    });
  });

  it('initializes session and displays pairing code and STT', async () => {
    render(
      <MemoryRouter>
        <SessionProvider>
          <NursePage />
        </SessionProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(restApi.createSession).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByTestId('nurse-pairing-code')).toHaveTextContent('ABC888');
    });

    expect(screen.getByLabelText('Số thứ tự')).toHaveValue(42);
    expect(screen.getByText('Bàn tiếp nhận điều dưỡng')).toBeInTheDocument();
  });

  it('keeps verify button disabled while patient has not confirmed', async () => {
    render(
      <MemoryRouter>
        <SessionProvider>
          <NursePage />
        </SessionProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('btn-verify-intake')).toBeDisabled();
    });
  });

  it('opens export record modal on export button click', async () => {
    render(
      <MemoryRouter>
        <SessionProvider>
          <NursePage />
        </SessionProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Xuất hồ sơ bàn giao')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Xuất hồ sơ bàn giao'));
    expect(screen.getByText('Xuất hồ sơ tiếp nhận ban đầu')).toBeInTheDocument();
    expect(screen.getByText('Phiếu Tiếp Nhận Ban Đầu')).toBeInTheDocument();
  });

  it('opens session reset modal on reset button click', async () => {
    render(
      <MemoryRouter>
        <SessionProvider>
          <NursePage />
        </SessionProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Kết thúc phiên')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Kết thúc phiên'));
    expect(screen.getByText('Xác nhận kết thúc và xóa phiên')).toBeInTheDocument();
  });

  it('unlocks verify button after patient confirms and critical alerts are acknowledged', async () => {
    // Helper to simulate patient confirmed with critical alert
    const TestComponent = () => {
      const { dispatch } = useSession();
      return (
        <div>
          <button
            onClick={() => {
              dispatch({
                type: 'FRAME_UPDATED',
                payload: {
                  frame: {
                    schema_version: '1.0',
                    session_id: 'test-session-123',
                    modality: ['touch'],
                    chief_complaint: { code: 'PAIN', label_vi: 'Đau ngực', free_text: null },
                    pain: { present: true, severity: 8, body_regions: ['CHEST'] },
                    allergy: { has_allergy: false, items: [] },
                    extra_symptoms: [],
                    uncertain_fields: [],
                    field_confidence: {},
                    conflicts: [],
                    missing_fields: [],
                  },
                  alerts: [
                    {
                      code: 'CRITICAL_CHEST_PAIN',
                      level: 'critical',
                      message_vi: 'Cơn đau ngực dữ dội',
                      needs_nurse_ack: true,
                    },
                  ],
                  completeness: 1.0,
                  step: 'confirm',
                },
              });
              dispatch({
                type: 'PATIENT_CONFIRMED',
                payload: { status: 'patient_confirmed' },
              });
            }}
          >
            Mock Patient Confirm
          </button>
          <NursePage />
        </div>
      );
    };

    render(
      <MemoryRouter>
        <SessionProvider>
          <TestComponent />
        </SessionProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Mock Patient Confirm')).toBeInTheDocument();
    });

    // Patient confirms
    fireEvent.click(screen.getByText('Mock Patient Confirm'));

    // Because there is a critical alert unacknowledged, verify button is still disabled!
    await waitFor(() => {
      expect(screen.getByTestId('btn-verify-intake')).toBeDisabled();
    });

    // Nurse acknowledges the critical alert
    const ackBtn = screen.getByRole('button', { name: /Xác nhận đã biết cảnh báo CRITICAL_CHEST_PAIN/i });
    fireEvent.click(ackBtn);

    // Now verify button must be enabled!
    await waitFor(() => {
      expect(screen.getByTestId('btn-verify-intake')).not.toBeDisabled();
    });

    // Nurse clicks verify
    fireEvent.click(screen.getByTestId('btn-verify-intake'));
    expect(socketClient.send).toHaveBeenCalledWith(
      'NURSE_VERIFIED',
      expect.objectContaining({
        queue_number: 42,
        acknowledged_alerts: ['CRITICAL_CHEST_PAIN'],
      })
    );
  });
});
