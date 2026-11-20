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

it('flushes the latest allergy edit once before a summary request', () => {
  vi.useFakeTimers();
  const handleSend = vi.fn();
  const { result, unmount } = renderHook(() => useWizard(handleSend));
  act(() => result.current.updateAllergy({ hasAllergy: false }));
  act(() => result.current.flushInput());
  expect(handleSend).toHaveBeenCalledWith(
    'choose_mode',
    expect.objectContaining({ allergy: { has_allergy: false, items: [] } }),
    'touch'
  );
  act(() => vi.runOnlyPendingTimers());
  expect(handleSend).toHaveBeenCalledTimes(1);
  unmount();
  vi.useRealTimers();
});

it('retains unsent input for retry after reconnection', () => {
  const handleSend = vi.fn().mockReturnValueOnce(false).mockReturnValue(true);
  const { result, unmount } = renderHook(() => useWizard(handleSend));
  act(() => result.current.updateAllergy({ hasAllergy: true }));
  act(() => { expect(result.current.flushInput()).toBe(false); });
  act(() => { expect(result.current.flushInput()).toBe(true); });
  expect(handleSend).toHaveBeenCalledTimes(2);
  unmount();
});

it('keeps explicit zero time and additional symptoms in the outgoing frame', () => {
  const send = vi.fn();
  const { result } = renderHook(() => useWizard(send));
  act(() => result.current.updateSymptoms({ onsetValue: 0, onsetUnit: 'hour', extraSymptoms: ['COUGH'] }));
  act(() => result.current.flushInput());
  expect(send).toHaveBeenCalledWith('choose_mode', expect.objectContaining({
    pain: expect.objectContaining({ onset: { value: 0, unit: 'hour' } }),
    extra_symptoms: ['COUGH'],
  }), 'touch');
});
