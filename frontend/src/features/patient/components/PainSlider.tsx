import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { TTSButton } from '../../../ui/TTSButton';

export interface PainSliderProps {
  value: number; // 0..10
  onChange: (val: number) => void;
  className?: string;
}

interface PainLevelInfo {
  label: string;
  emoji: string;
  color: string;
}

const PAIN_LEVELS: Record<number, PainLevelInfo> = {
  0: { label: 'Không đau', emoji: '😄', color: 'text-ok' },
  1: { label: 'Đau rất nhẹ', emoji: '🙂', color: 'text-ok' },
  2: { label: 'Đau nhẹ', emoji: '🙂', color: 'text-ok' },
  3: { label: 'Hơi khó chịu', emoji: '😐', color: 'text-action' },
  4: { label: 'Đau vừa phải', emoji: '😐', color: 'text-action' },
  5: { label: 'Đau nhiều', emoji: '😟', color: 'text-warn' },
  6: { label: 'Đau ảnh hưởng sinh hoạt', emoji: '😟', color: 'text-warn' },
  7: { label: 'Rất đau', emoji: '😣', color: 'text-danger' },
  8: { label: 'Đau dữ dội', emoji: '😣', color: 'text-danger' },
  9: { label: 'Đau quằn quại', emoji: '😭', color: 'text-danger' },
  10: { label: 'Đau không thể chịu nổi', emoji: '😭', color: 'text-danger' },
};

export const PainSlider: React.FC<PainSliderProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const safeValue = Math.max(0, Math.min(10, Math.round(value)));
  const info = PAIN_LEVELS[safeValue] || PAIN_LEVELS[0];

  const handleDecrement = () => {
    if (safeValue > 0) onChange(safeValue - 1);
  };

  const handleIncrement = () => {
    if (safeValue < 10) onChange(safeValue + 1);
  };

  return (
    <div className={`flex flex-col items-center w-full max-w-md mx-auto ${className}`}>
      {/* Hiển thị số điểm và khuôn mặt biểu cảm */}
      <div className="flex items-center justify-center gap-4 mb-4 select-none">
        <span className="text-6xl" role="img" aria-label={info.label}>
          {info.emoji}
        </span>
        <div className="text-center">
          <div className="flex items-baseline justify-center gap-1">
            <span className={`text-5xl font-black ${info.color}`}>{safeValue}</span>
            <span className="text-2xl font-bold text-mute">/ 10</span>
          </div>
          <span className={`text-lg font-bold block ${info.color}`}>{info.label}</span>
        </div>
      </div>

      {/* Điều khiển kéo + Nút bấm chạm lớn ± */}
      <div className="flex items-center gap-4 w-full">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={safeValue <= 0}
          className="w-16 h-16 rounded-2xl bg-paper border-2 border-action text-action hover:bg-canvas disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center font-bold text-2xl transition-colors cursor-pointer select-none active:scale-95"
          aria-label="Giảm mức đau"
        >
          <Minus className="w-8 h-8" />
        </button>

        <div className="flex-1 px-2">
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={safeValue}
            onChange={(e) => onChange(parseInt(e.target.value, 10))}
            className="w-full h-4 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-action"
            aria-label="Thanh trượt mức độ đau từ 0 đến 10"
          />
          <div className="flex justify-between text-xs font-bold text-mute mt-1 px-1 select-none">
            <span>0</span>
            <span>2</span>
            <span>4</span>
            <span>6</span>
            <span>8</span>
            <span>10</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={safeValue >= 10}
          className="w-16 h-16 rounded-2xl bg-paper border-2 border-action text-action hover:bg-canvas disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center font-bold text-2xl transition-colors cursor-pointer select-none active:scale-95"
          aria-label="Tăng mức đau"
        >
          <Plus className="w-8 h-8" />
        </button>
      </div>

      <div className="mt-4">
        <TTSButton
          text={`Mức độ đau: ${safeValue} trên mười. ${info.label}`}
          label="Nghe đọc mức đau"
        />
      </div>
    </div>
  );
};
