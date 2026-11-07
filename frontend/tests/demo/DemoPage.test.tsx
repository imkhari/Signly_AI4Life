import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { DemoPage } from '../../src/features/demo/DemoPage';
import { SessionProvider } from '../../src/state/SessionContext';
import { restApi } from '../../src/services/api/rest';
import { socketClient } from '../../src/services/ws/socketClient';

vi.mock('../../src/services/api/rest', () => ({
  restApi: {
    getHealth: vi.fn().mockResolvedValue({ status: 'ok', llm_mode: 'mock' }),
    forceFallback: vi.fn().mockResolvedValue({ status: 'ok', force_fallback: true }),
    createSession: vi.fn(),
    joinSession: vi.fn(),
    getOntology: vi.fn(),
  },
}));

vi.mock('../../src/services/ws/socketClient', () => ({
  socketClient: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    send: vi.fn(),
    getLastSeq: vi.fn().mockReturnValue(0),
    onStatusChange: vi.fn().mockReturnValue(() => {}),
    on: vi.fn().mockReturnValue(() => {}),
  },
}));

describe('DemoPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders demo control board and checks health status', async () => {
    render(
      <MemoryRouter>
        <SessionProvider>
          <DemoPage />
        </SessionProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Bảng Điều Khiển Demo Giám Khảo')).toBeInTheDocument();
    expect(screen.getByText('ENV=demo')).toBeInTheDocument();

    await waitFor(() => {
      expect(restApi.getHealth).toHaveBeenCalled();
      expect(screen.getByText('Chế độ AI: mock')).toBeInTheDocument();
    });
  });

  it('triggers emergency chest pain scenario on button click', async () => {
    render(
      <MemoryRouter>
        <SessionProvider>
          <DemoPage />
        </SessionProvider>
      </MemoryRouter>
    );

    const btn = screen.getByTestId('btn-demo-scenario-emergency');
    fireEvent.click(btn);

    expect(socketClient.send).toHaveBeenCalledWith(
      'INPUT_UPDATED',
      expect.objectContaining({
        step: 'pain_details',
        patch: expect.objectContaining({
          pain: expect.objectContaining({ severity: 8, body_regions: ['CHEST'] }),
        }),
      })
    );
  });

  it('triggers allergy conflict scenario on button click', async () => {
    render(
      <MemoryRouter>
        <SessionProvider>
          <DemoPage />
        </SessionProvider>
      </MemoryRouter>
    );

    const btn = screen.getByTestId('btn-demo-scenario-allergy');
    fireEvent.click(btn);

    expect(socketClient.send).toHaveBeenCalledWith(
      'INPUT_UPDATED',
      expect.objectContaining({
        step: 'allergy',
        patch: expect.objectContaining({
          raw_input: expect.objectContaining({
            text: expect.stringContaining('penicillin'),
          }),
        }),
      })
    );
  });

  it('toggles force-fallback API on button click', async () => {
    render(
      <MemoryRouter>
        <SessionProvider>
          <DemoPage />
        </SessionProvider>
      </MemoryRouter>
    );

    const btn = screen.getByTestId('btn-demo-force-fallback');
    fireEvent.click(btn);

    await waitFor(() => {
      expect(restApi.forceFallback).toHaveBeenCalledWith(expect.any(String), true);
      expect(socketClient.send).toHaveBeenCalledWith('SUMMARY_REQUESTED', expect.anything());
    });
  });

  it('triggers quick reset on button click', async () => {
    render(
      <MemoryRouter>
        <SessionProvider>
          <DemoPage />
        </SessionProvider>
      </MemoryRouter>
    );

    const btn = screen.getByTestId('btn-demo-quick-reset');
    fireEvent.click(btn);

    expect(socketClient.send).toHaveBeenCalledWith(
      'SESSION_RESET',
      expect.objectContaining({ reason: 'manual', wipe: true })
    );
  });
});
