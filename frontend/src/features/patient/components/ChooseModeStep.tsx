import React from 'react';
import { IconHandClick, IconVideo } from '@tabler/icons-react';
import { BigIconButton } from '../../../ui/BigIconButton';
import { vi } from '../../../i18n/vi';
import { Button } from '../../../ui/Button';
import { ModalityType } from '../../../types';

export interface ChooseModeStepProps {
  selectedMode: ModalityType;
  onSelectMode: (mode: ModalityType) => void;
  onNext: () => void;
}

export const ChooseModeStep: React.FC<ChooseModeStepProps> = ({
  selectedMode,
  onSelectMode,
  onNext,
}) => {
  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-ink mb-2">
          {vi.presentation.modeTitle}
        </h2>
        <p className="text-mute text-base">
          {vi.presentation.modeHint}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full mb-10">
        <BigIconButton
          icon={<IconHandClick className="w-12 h-12 text-action" stroke={1.8} />}
          label={vi.presentation.touchLabel}
          sublabel={vi.presentation.touchDescription}
          selected={selectedMode === 'touch'}
          onClick={() => onSelectMode('touch')}
        />

        <BigIconButton
          icon={<IconVideo className="w-12 h-12 text-action" stroke={1.8} />}
          label={vi.presentation.vslLabel}
          sublabel={vi.presentation.vslDescription}
          selected={selectedMode === 'vsl_gloss'}
          onClick={() => onSelectMode('vsl_gloss')}
        />
      </div>

      <div className="flex justify-end w-full">
        <Button variant="primary" onClick={onNext} className="min-w-[200px]">
          {vi.common.next}
        </Button>
      </div>
    </div>
  );
};
