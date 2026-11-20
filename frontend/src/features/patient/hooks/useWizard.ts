import { useCallback, useEffect, useRef, useState } from 'react';
import { ModalityType, OnsetUnit, SemanticFrame } from '../../../types';
import { SymptomsData } from '../components/SymptomsStep';
import { AllergyData } from '../components/AllergyStep';

export interface WizardDraft {
  selectedMode: ModalityType;
  symptoms: SymptomsData;
  allergy: AllergyData;
}

const initialDraft: WizardDraft = {
  selectedMode: 'touch',
  symptoms: {
    chiefComplaintCode: null,
    chiefComplaintLabel: null,
    hasPain: null,
    severity: null,
    bodyRegions: [],
    extraSymptoms: [],
    onsetValue: null,
    onsetUnit: 'hour' as OnsetUnit,
  },
  allergy: {
    hasAllergy: null,
    items: [],
  },
};

export function useWizard(
  onSendInput: (step: string, patch: Record<string, unknown>, modality: string) => boolean | void
) {
  const [step, setStep] = useState<number>(1); // 1: Mode, 2: Symptoms, 3: Allergy, 4: Confirm, 5: Waiting
  const [draft, setDraft] = useState<WizardDraft>(initialDraft);

  const draftRef = useRef(draft);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pendingInput = useRef<(() => boolean | void) | null>(null);
  const flushInput = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = null;
    const send = pendingInput.current;
    if (send?.() === false) return false;
    pendingInput.current = null;
    return true;
  }, []);

  // Debounce edits, but flush before asking for a summary.
  const syncWithServer = useCallback(
    (currentDraft: WizardDraft, currentStep: number) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      pendingInput.current = () => {
        const stepName =
          currentStep === 1
            ? 'choose_mode'
            : currentStep === 2
              ? 'symptoms'
              : currentStep === 3
                ? 'allergy'
                : 'confirm';

        const patch: Record<string, unknown> = {
          chief_complaint: {
            code: currentDraft.symptoms.chiefComplaintCode,
            label_vi: currentDraft.symptoms.chiefComplaintLabel,
            free_text: null,
          },
          pain: {
            present: currentDraft.symptoms.hasPain,
            severity: currentDraft.symptoms.severity,
            body_regions: currentDraft.symptoms.bodyRegions,
            onset: currentDraft.symptoms.onsetValue !== null
              ? {
                  value: currentDraft.symptoms.onsetValue,
                  unit: currentDraft.symptoms.onsetUnit,
                }
              : null,
          },
          extra_symptoms: currentDraft.symptoms.extraSymptoms || [],
          allergy: {
            has_allergy: currentDraft.allergy.hasAllergy,
            items: currentDraft.allergy.items,
          },
        };

        return onSendInput(stepName, patch, currentDraft.selectedMode);
      };
      debounceTimerRef.current = setTimeout(flushInput, 150);
    },
    [onSendInput, flushInput]
  );

  const updateMode = useCallback(
    (mode: ModalityType) => {
      const next = { ...draftRef.current, selectedMode: mode };
      draftRef.current = next;
      setDraft(next);
      syncWithServer(next, step);
    },
    [syncWithServer, step]
  );

  const updateSymptoms = useCallback(
    (updated: Partial<SymptomsData>) => {
      const previous = draftRef.current;
      const next = { ...previous, symptoms: { ...previous.symptoms, ...updated } };
      draftRef.current = next;
      setDraft(next);
      syncWithServer(next, step);
    },
    [syncWithServer, step]
  );

  const updateAllergy = useCallback(
    (updated: Partial<AllergyData>) => {
      const previous = draftRef.current;
      const next = { ...previous, allergy: { ...previous.allergy, ...updated } };
      draftRef.current = next;
      setDraft(next);
      syncWithServer(next, step);
    },
    [syncWithServer, step]
  );

  const receiveFrame = useCallback((frame: SemanticFrame) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    pendingInput.current = null;
    const next: WizardDraft = {
      selectedMode: draftRef.current.selectedMode,
      symptoms: {
        chiefComplaintCode: frame.chief_complaint.code ?? null,
        chiefComplaintLabel: frame.chief_complaint.label_vi ?? null,
        hasPain: frame.pain.present ?? null,
        severity: frame.pain.severity ?? null,
        bodyRegions: frame.pain.body_regions,
        extraSymptoms: frame.extra_symptoms,
        onsetValue: frame.pain.onset?.value ?? null,
        onsetUnit: frame.pain.onset?.unit ?? 'hour',
      },
      allergy: { hasAllergy: frame.allergy.has_allergy ?? null, items: frame.allergy.items },
    };
    draftRef.current = next;
    setDraft(next);
  }, []);

  const nextStep = useCallback(() => {
    setStep((s) => Math.min(s + 1, 5));
  }, []);

  const prevStep = useCallback(() => {
    setStep((s) => Math.max(s - 1, 1));
  }, []);

  const goToStep = useCallback((target: number) => {
    setStep(Math.max(1, Math.min(target, 5)));
  }, []);

  const resetWizard = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    pendingInput.current = null;
    setStep(1);
    draftRef.current = initialDraft;
    setDraft(initialDraft);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    step,
    draft,
    updateMode,
    updateSymptoms,
    updateAllergy,
    nextStep,
    prevStep,
    goToStep,
    resetWizard,
    flushInput,
    receiveFrame,
  };
}
