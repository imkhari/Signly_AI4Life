import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '../../src/ui/Button';

describe('Button component', () => {
  it('renders correctly with label', () => {
    render(<Button>Xác nhận</Button>);
    expect(screen.getByRole('button', { name: 'Xác nhận' })).toBeInTheDocument();
  });

  it('has minimum touch target height of 64px', () => {
    const { container } = render(<Button>Chạm vào đây</Button>);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('min-h-[64px]');
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Bấm</Button>);
    fireEvent.click(screen.getByText('Bấm'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not trigger click when disabled', () => {
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Khóa
      </Button>
    );
    fireEvent.click(screen.getByText('Khóa'));
    expect(handleClick).not.toHaveBeenCalled();
  });
});

