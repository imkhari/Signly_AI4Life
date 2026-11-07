import { useCallback, useEffect, useRef, useState } from 'react';
import { ModalityType, OnsetUnit } from '../../../types';
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
    onsetValue: null,
    onsetUnit: 'hour' as OnsetUnit,
  },
  allergy: {
    hasAllergy: null,
    items: [],
  },
};

export function useWizard(
  onSendInput: (step: string, patch: Record<string, unknown>, modality: string) => void
) {
  const [step, setStep] = useState<number>(1); // 1: Mode, 2: Symptoms, 3: Allergy, 4: Confirm, 5: Waiting
  const [draft, setDraft] = useState<WizardDraft>(initialDraft);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Gửi debounce 150ms khi draft thay đổi
  const syncWithServer = useCallback(
    (currentDraft: WizardDraft, currentStep: number) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
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
            onset: currentDraft.symptoms.onsetValue
              ? {
                  value: currentDraft.symptoms.onsetValue,
                  unit: currentDraft.symptoms.onsetUnit,
                }
              : null,
          },
          allergy: {
            has_allergy: currentDraft.allergy.hasAllergy,
            items: currentDraft.allergy.items,
          },
        };

        onSendInput(stepName, patch, currentDraft.selectedMode);
      }, 150);
    },
    [onSendInput]
  );

  const updateMode = useCallback(
    (mode: ModalityType) => {
      setDraft((prev) => {
        const next = { ...prev, selectedMode: mode };
        syncWithServer(next, step);
        return next;
      });
    },
    [syncWithServer, step]
  );

  const updateSymptoms = useCallback(
    (updated: Partial<SymptomsData>) => {
      setDraft((prev) => {
        const next = {
          ...prev,
          symptoms: { ...prev.symptoms, ...updated },
        };
        syncWithServer(next, step);
        return next;
      });
    },
    [syncWithServer, step]
  );

  const updateAllergy = useCallback(
    (updated: Partial<AllergyData>) => {
      setDraft((prev) => {
        const next = {
          ...prev,
          allergy: { ...prev.allergy, ...updated },
        };
        syncWithServer(next, step);
        return next;
      });
    },
    [syncWithServer, step]
  );

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
    setStep(1);
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
  };
}
