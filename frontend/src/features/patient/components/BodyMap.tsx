import React, { useState } from 'react';

export interface BodyMapProps {
  selectedRegions: string[];
  onToggleRegion: (regionCode: string) => void;
  className?: string;
}

interface RegionPath {
  code: string;
  label: string;
  d: string;
  view: 'front' | 'back' | 'both';
}

const REGIONS: RegionPath[] = [
  // Front & Back head/neck
  {
    code: 'HEAD',
    label: 'Đầu',
    d: 'M 90 20 C 90 10 110 10 110 20 C 110 32 90 32 90 20 Z',
    view: 'both',
  },
  {
    code: 'NECK',
    label: 'Cổ',
    d: 'M 95 33 L 105 33 L 106 42 L 94 42 Z',
    view: 'both',
  },

  // Front torso
  {
    code: 'CHEST',
    label: 'Ngực',
    d: 'M 82 43 L 118 43 L 116 70 L 84 70 Z',
    view: 'front',
  },
  {
    code: 'ABDOMEN_UPPER',
    label: 'Bụng trên',
    d: 'M 85 71 L 115 71 L 113 95 L 87 95 Z',
    view: 'front',
  },
  {
    code: 'ABDOMEN_LOWER',
    label: 'Bụng dưới',
    d: 'M 87 96 L 113 96 L 110 120 L 90 120 Z',
    view: 'front',
  },

  // Back torso
  {
    code: 'UPPER_BACK',
    label: 'Lưng trên',
    d: 'M 82 43 L 118 43 L 115 78 L 85 78 Z',
    view: 'back',
  },
  {
    code: 'LOWER_BACK',
    label: 'Lưng dưới / Thắt lưng',
    d: 'M 85 79 L 115 79 L 110 120 L 90 120 Z',
    view: 'back',
  },

  // Arms & Hands (Both views)
  {
    code: 'ARM_L',
    label: 'Cánh tay trái',
    d: 'M 119 44 L 135 75 L 142 110 L 134 112 L 127 80 L 117 55 Z',
    view: 'both',
  },
  {
    code: 'ARM_R',
    label: 'Cánh tay phải',
    d: 'M 81 44 L 65 75 L 58 110 L 66 112 L 73 80 L 83 55 Z',
    view: 'both',
  },
  {
    code: 'HAND_L',
    label: 'Bàn tay trái',
    d: 'M 134 113 L 143 111 L 147 132 L 138 135 Z',
    view: 'both',
  },
  {
    code: 'HAND_R',
    label: 'Bàn tay phải',
    d: 'M 66 113 L 57 111 L 53 132 L 62 135 Z',
    view: 'both',
  },

  // Legs & Feet (Both views)
  {
    code: 'LEG_L',
    label: 'Chân trái',
    d: 'M 101 121 L 112 121 L 114 185 L 110 230 L 100 230 L 102 185 Z',
    view: 'both',
  },
  {
    code: 'LEG_R',
    label: 'Chân phải',
    d: 'M 88 121 L 99 121 L 98 185 L 100 230 L 90 230 L 86 185 Z',
    view: 'both',
  },
  {
    code: 'FOOT_L',
    label: 'Bàn chân trái',
    d: 'M 100 231 L 111 231 L 115 245 L 98 245 Z',
    view: 'both',
  },
  {
    code: 'FOOT_R',
    label: 'Bàn chân phải',
    d: 'M 89 231 L 100 231 L 102 245 L 85 245 Z',
    view: 'both',
  },
];

export const BodyMap: React.FC<BodyMapProps> = ({
  selectedRegions,
  onToggleRegion,
  className = '',
}) => {
  const [view, setView] = useState<'front' | 'back'>('front');

  const visibleRegions = REGIONS.filter((r) => r.view === 'both' || r.view === view);

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* Nút chuyển mặt Trước / Sau */}
      <div
        role="group"
        aria-label="Chọn góc nhìn cơ thể"
        className="inline-flex p-1 bg-canvas rounded-xl mb-4 border border-gray-200"
      >
        <button
          type="button"
          onClick={() => setView('front')}
          className={`px-6 py-2.5 rounded-lg font-bold text-base transition-colors min-h-[48px] cursor-pointer ${
            view === 'front'
              ? 'bg-paper text-action shadow-sm border border-gray-200'
              : 'text-mute hover:text-ink'
          }`}
          aria-pressed={view === 'front'}
        >
          Mặt trước
        </button>
        <button
          type="button"
          onClick={() => setView('back')}
          className={`px-6 py-2.5 rounded-lg font-bold text-base transition-colors min-h-[48px] cursor-pointer ${
            view === 'back'
              ? 'bg-paper text-action shadow-sm border border-gray-200'
              : 'text-mute hover:text-ink'
          }`}
          aria-pressed={view === 'back'}
        >
          Mặt sau
        </button>
      </div>

      <p className="text-sm text-mute mb-2 text-center">
        Chạm trực tiếp vào các vùng trên hình để chọn vị trí đau (có thể chọn nhiều vùng):
      </p>

      {/* Sơ đồ SVG */}
      <div className="relative w-64 h-80 bg-paper rounded-2xl border-2 border-gray-200 p-2 shadow-inner flex items-center justify-center">
        <svg
          viewBox="40 0 120 255"
          className="w-full h-full max-h-76"
          role="img"
          aria-label={`Sơ đồ cơ thể người (${view === 'front' ? 'Mặt trước' : 'Mặt sau'})`}
        >
          {visibleRegions.map((region) => {
            const isSelected = selectedRegions.includes(region.code);

            return (
              <path
                key={region.code}
                d={region.d}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                aria-label={`${region.label}${isSelected ? ' (đã chọn)' : ''}`}
                onClick={() => onToggleRegion(region.code)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onToggleRegion(region.code);
                  }
                }}
                className={`transition-colors cursor-pointer outline-none ${
                  isSelected
                    ? 'fill-action stroke-action stroke-2 opacity-90'
                    : 'fill-canvas stroke-gray-300 stroke-1 hover:fill-action/30 hover:stroke-action'
                }`}
              >
                <title>{region.label}</title>
              </path>
            );
          })}
        </svg>
      </div>

      {/* Danh sách các vùng đang chọn */}
      <div className="mt-4 w-full">
        <div className="text-sm font-semibold text-ink mb-1.5 flex items-center justify-between">
          <span>Các vùng đau đã chọn ({selectedRegions.length}):</span>
          {selectedRegions.length > 0 && (
            <span className="text-action text-xs font-bold">Chạm lại để bỏ chọn</span>
          )}
        </div>
        {selectedRegions.length === 0 ? (
          <p className="text-sm text-mute italic">Chưa chọn vùng nào</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedRegions.map((code) => {
              const reg = REGIONS.find((r) => r.code === code);
              return (
                <button
                  type="button"
                  key={code}
                  onClick={() => onToggleRegion(code)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-action/10 border border-action text-action font-semibold text-sm rounded-lg hover:bg-danger-bg hover:text-danger hover:border-danger transition-colors cursor-pointer"
                  title="Bấm để bỏ chọn vùng này"
                >
                  <span>{reg?.label || code}</span>
                  <span className="text-xs font-bold">✕</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
