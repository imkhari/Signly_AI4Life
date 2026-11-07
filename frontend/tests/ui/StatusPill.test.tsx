import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusPill } from '../../src/ui/StatusPill';

describe('StatusPill component', () => {
  it('renders both text and icon (no color alone)', () => {
    const { container } = render(<StatusPill status="confirmed" label="Đã xác nhận" />);
    expect(screen.getByText('Đã xác nhận')).toBeInTheDocument();
    // Verify an svg icon is rendered
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders critical warning with alert icon', () => {
    const { container } = render(<StatusPill status="danger" label="Nguy hiểm" />);
    expect(screen.getByText('Nguy hiểm')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});

