import React from 'react';
import { Check } from 'lucide-react';

export interface BigIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  selected?: boolean;
}

export const BigIconButton: React.FC<BigIconButtonProps> = ({
  icon,
  label,
  sublabel,
  selected = false,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <button
      type="button"
      className={`relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all cursor-pointer min-h-[140px] w-full text-center select-none disabled:opacity-50 disabled:cursor-not-allowed ${
        selected
          ? 'bg-action/10 border-action text-action shadow-sm'
          : 'bg-paper border-gray-200 text-ink hover:border-action/50 hover:bg-canvas'
      } ${className}`}
      aria-pressed={selected}
      disabled={disabled}
      {...props}
    >
      {selected && (
        <span className="absolute top-3 right-3 w-7 h-7 bg-action text-white rounded-full flex items-center justify-center">
          <Check className="w-4 h-4" />
        </span>
      )}
      <div className="mb-3 text-action">{icon}</div>
      <span className="text-xl font-bold leading-tight">{label}</span>
      {sublabel && <span className="text-sm text-mute mt-1">{sublabel}</span>}
    </button>
  );
};

