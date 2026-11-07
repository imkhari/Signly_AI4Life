import React from 'react';
import { Camera, Hand, Keyboard } from 'lucide-react';
import { BigIconButton } from '../../../ui/BigIconButton';
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
          Chọn cách thức bạn muốn giao tiếp
        </h2>
        <p className="text-mute text-base">
          Bạn có thể thay đổi bất kỳ lúc nào trong quá trình khai báo.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full mb-10">
        <BigIconButton
          icon={<Hand className="w-12 h-12" />}
          label="Chạm chọn hình"
          sublabel="Dễ nhất, chỉ cần chọn icon và vị trí trên hình"
          selected={selectedMode === 'touch'}
          onClick={() => onSelectMode('touch')}
        />

        <BigIconButton
          icon={<Keyboard className="w-12 h-12" />}
          label="Viết chữ"
          sublabel="Gõ bàn phím, hệ thống sẽ đọc to giúp bạn"
          selected={selectedMode === 'text'}
          onClick={() => onSelectMode('text')}
        />

        <BigIconButton
          icon={<Camera className="w-12 h-12" />}
          label="Ký hiệu VSL"
          sublabel="Nhận diện cử chỉ ngôn ngữ ký hiệu qua camera"
          selected={selectedMode === 'vsl_gloss'}
          onClick={() => onSelectMode('vsl_gloss')}
        />
      </div>

      <div className="flex justify-end w-full">
        <Button variant="primary" onClick={onNext} className="min-w-[200px]">
          Tiếp tục
        </Button>
      </div>
    </div>
  );
};
