import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BodyMap } from '../../src/features/patient/components/BodyMap';

describe('BodyMap component', () => {
  it('renders SVG body map and front/back view buttons', () => {
    render(<BodyMap selectedRegions={[]} onToggleRegion={() => {}} />);
    expect(screen.getByRole('button', { name: 'Mặt trước' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mặt sau' })).toBeInTheDocument();
  });

  it('switches views when clicking back button', () => {
    render(<BodyMap selectedRegions={[]} onToggleRegion={() => {}} />);
    const backBtn = screen.getByRole('button', { name: 'Mặt sau' });
    fireEvent.click(backBtn);
    expect(backBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onToggleRegion when a body region is clicked', () => {
    const handleToggle = vi.fn();
    render(<BodyMap selectedRegions={[]} onToggleRegion={handleToggle} />);
    const headPath = screen.getByRole('button', { name: 'Đầu' });
    fireEvent.click(headPath);
    expect(handleToggle).toHaveBeenCalledWith('HEAD');
  });

  it('displays selected region chips', () => {
    render(<BodyMap selectedRegions={['CHEST']} onToggleRegion={() => {}} />);
    const chestElements = screen.getAllByText('Ngực');
    expect(chestElements.length).toBeGreaterThanOrEqual(1);
  });
});
