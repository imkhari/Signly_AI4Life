import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useWizard } from '../../src/features/patient/hooks/useWizard';

describe('useWizard hook', () => {
  it('initializes at step 1 with default touch modality', () => {
    const handleSend = vi.fn();
    const { result } = renderHook(() => useWizard(handleSend));

    expect(result.current.step).toBe(1);
    expect(result.current.draft.selectedMode).toBe('touch');
  });

  it('navigates next and previous steps correctly', () => {
    const handleSend = vi.fn();
    const { result } = renderHook(() => useWizard(handleSend));

    act(() => {
      result.current.nextStep();
    });
    expect(result.current.step).toBe(2);

    act(() => {
      result.current.prevStep();
    });
    expect(result.current.step).toBe(1);

    // Prev at 1 stays at 1
    act(() => {
      result.current.prevStep();
    });
    expect(result.current.step).toBe(1);
  });

  it('updates modality and symptoms draft', () => {
    const handleSend = vi.fn();
    const { result } = renderHook(() => useWizard(handleSend));

    act(() => {
      result.current.updateMode('text');
      result.current.updateSymptoms({
        chiefComplaintCode: 'PAIN',
        chiefComplaintLabel: 'Đau / Nhức',
        severity: 8,
      });
    });

    expect(result.current.draft.selectedMode).toBe('text');
    expect(result.current.draft.symptoms.chiefComplaintCode).toBe('PAIN');
    expect(result.current.draft.symptoms.severity).toBe(8);
  });
});
