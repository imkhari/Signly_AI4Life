import React from 'react';
import { HelpCircle, Moon, Sun, Type } from 'lucide-react';
import { useSession } from '../state/SessionContext';
import { vi } from '../i18n/vi';

export interface A11yControlsProps {
  onCallHelp?: () => void;
  className?: string;
}

export const A11yControls: React.FC<A11yControlsProps> = ({ onCallHelp, className = '' }) => {
  const { state, dispatch } = useSession();
  const { largeText, highContrast } = state.a11y;

  return (
    <div
      className={`inline-flex items-center gap-2 flex-wrap ${className}`}
      role="toolbar"
      aria-label="Cài đặt hỗ trợ tiếp cận"
    >
      {/* Nút Chữ lớn */}
      <button
        type="button"
        onClick={() => dispatch({ type: 'TOGGLE_LARGE_TEXT' })}
        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 font-semibold text-sm transition-colors min-h-[48px] cursor-pointer ${
          largeText
            ? 'bg-action text-white border-action'
            : 'bg-paper text-ink border-gray-300 hover:bg-canvas'
        }`}
        aria-pressed={largeText}
        aria-label={largeText ? vi.a11y.normalText : vi.a11y.largeText}
      >
        <Type className="w-5 h-5 flex-shrink-0" />
        <span>{largeText ? 'A' : 'A+'}</span>
      </button>

      {/* Nút Tương phản cao */}
      <button
        type="button"
        onClick={() => dispatch({ type: 'TOGGLE_HIGH_CONTRAST' })}
        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 font-semibold text-sm transition-colors min-h-[48px] cursor-pointer ${
          highContrast
            ? 'bg-ink text-paper border-ink'
            : 'bg-paper text-ink border-gray-300 hover:bg-canvas'
        }`}
        aria-pressed={highContrast}
        aria-label={highContrast ? vi.a11y.normalContrast : vi.a11y.highContrast}
      >
        {highContrast ? (
          <Sun className="w-5 h-5 flex-shrink-0" />
        ) : (
          <Moon className="w-5 h-5 flex-shrink-0" />
        )}
        <span>◐</span>
      </button>

      {/* Nút Cần giúp ngay / Phiên dịch */}
      {onCallHelp && (
        <button
          type="button"
          onClick={onCallHelp}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-action bg-paper text-action hover:bg-action hover:text-white font-bold text-sm transition-colors min-h-[48px] cursor-pointer"
          aria-label={vi.a11y.callInterpreter}
        >
          <HelpCircle className="w-5 h-5 flex-shrink-0" />
          <span>{vi.a11y.callInterpreter}</span>
        </button>
      )}
    </div>
  );
};

