import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useTTS } from '../hooks/useTTS';

export interface TTSButtonProps {
  text: string;
  label?: string;
  className?: string;
}

export const TTSButton: React.FC<TTSButtonProps> = ({
  text,
  label = 'Nghe đọc',
  className = '',
}) => {
  const { isSpeaking, subtitle, speak, stop, isSupported } = useTTS();

  if (!isSupported) {
    return null;
  }

  const handleClick = () => {
    if (isSpeaking) {
      stop();
    } else {
      speak(text);
    }
  };

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-semibold text-base transition-colors min-h-[48px] cursor-pointer ${
          isSpeaking
            ? 'bg-action text-white border-action'
            : 'bg-paper text-action border-action hover:bg-canvas'
        } ${className}`}
        aria-label={isSpeaking ? 'Dừng đọc' : label}
      >
        {isSpeaking ? (
          <>
            <VolumeX className="w-5 h-5 flex-shrink-0 animate-bounce" />
            <span>Đang đọc...</span>
          </>
        ) : (
          <>
            <Volume2 className="w-5 h-5 flex-shrink-0" />
            <span>{label}</span>
          </>
        )}
      </button>

      {/* Phụ đề trực quan cho người Điếc/khiếm thính */}
      {isSpeaking && subtitle && (
        <div
          role="region"
          aria-live="polite"
          className="mt-1 px-3 py-1.5 bg-ink text-white text-sm rounded-lg shadow-sm border border-black/20"
        >
          <span className="font-bold mr-1">Lời đọc:</span>
          <span>{subtitle}</span>
        </div>
      )}
    </div>
  );
};

