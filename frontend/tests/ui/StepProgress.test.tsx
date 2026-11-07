import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StepProgress } from '../../src/ui/StepProgress';

describe('StepProgress component', () => {
  const steps = [
    { id: '1', label: 'Bước 1' },
    { id: '2', label: 'Bước 2' },
    { id: '3', label: 'Bước 3' },
  ];

  it('renders all step labels', () => {
    render(<StepProgress steps={steps} currentStepIndex={1} />);
    expect(screen.getByText('Bước 1')).toBeInTheDocument();
    expect(screen.getByText('Bước 2')).toBeInTheDocument();
    expect(screen.getByText('Bước 3')).toBeInTheDocument();
  });

  it('marks current step with aria-current="step"', () => {
    const { container } = render(<StepProgress steps={steps} currentStepIndex={1} />);
    const activeStep = container.querySelector('[aria-current="step"]');
    expect(activeStep).toBeInTheDocument();
    expect(activeStep?.textContent).toContain('2');
  });
});

