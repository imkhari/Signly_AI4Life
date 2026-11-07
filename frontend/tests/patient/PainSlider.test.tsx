import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PainSlider } from '../../src/features/patient/components/PainSlider';

describe('PainSlider component', () => {
  it('renders pain value and emoji', () => {
    render(<PainSlider value={7} onChange={() => {}} />);
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('Rất đau')).toBeInTheDocument();
  });

  it('handles increment and decrement clicks', () => {
    const handleChange = vi.fn();
    render(<PainSlider value={5} onChange={handleChange} />);

    const decBtn = screen.getByRole('button', { name: 'Giảm mức đau' });
    fireEvent.click(decBtn);
    expect(handleChange).toHaveBeenCalledWith(4);

    const incBtn = screen.getByRole('button', { name: 'Tăng mức đau' });
    fireEvent.click(incBtn);
    expect(handleChange).toHaveBeenCalledWith(6);
  });

  it('disables decrement at 0 and increment at 10', () => {
    const { rerender } = render(<PainSlider value={0} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Giảm mức đau' })).toBeDisabled();

    rerender(<PainSlider value={10} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Tăng mức đau' })).toBeDisabled();
  });
});
