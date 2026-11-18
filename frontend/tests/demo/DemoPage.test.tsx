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

  it('keeps session actions disabled in a standalone demo tab', async () => {
    render(
      <MemoryRouter>
        <SessionProvider>
          <DemoPage />
        </SessionProvider>
      </MemoryRouter>
    );

    await screen.findByText('Chế độ AI: mock');
    for (const id of ['scenario-emergency', 'scenario-allergy', 'force-fallback', 'quick-reset']) {
      const button = screen.getByTestId(`btn-demo-${id}`);
      expect(button).toBeDisabled();
      fireEvent.click(button);
    }
    expect(socketClient.send).not.toHaveBeenCalled();
    expect(restApi.forceFallback).not.toHaveBeenCalled();
  });
});
