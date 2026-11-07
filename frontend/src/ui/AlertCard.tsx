import React from 'react';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { AlertLevel } from '../types';

export interface AlertCardProps {
  level: AlertLevel;
  message: string;
  className?: string;
}

export const AlertCard: React.FC<AlertCardProps> = ({ level, message, className = '' }) => {
  const configs = {
    info: {
      container: 'bg-canvas border-action/40 text-ink',
      icon: <Info className="w-6 h-6 text-action flex-shrink-0" />,
      label: 'Thông tin',
    },
    warning: {
      container: 'bg-warn-bg border-warn/40 text-warn',
      icon: <AlertCircle className="w-6 h-6 text-warn flex-shrink-0" />,
      label: 'Cần chú ý',
    },
    critical: {
      container: 'bg-danger-bg border-danger/40 text-danger',
      icon: <AlertTriangle className="w-6 h-6 text-danger flex-shrink-0 animate-pulse" />,
      label: 'Nguy cơ khẩn cấp',
    },
  }[level];

  return (
    <div
      role="alert"
      aria-live={level === 'critical' ? 'assertive' : 'polite'}
      className={`flex items-start gap-3 p-4 rounded-xl border-2 font-medium ${configs.container} ${className}`}
    >
      {configs.icon}
      <div className="flex-1">
        <span className="block font-bold text-sm tracking-wide uppercase mb-0.5">
          {configs.label}
        </span>
        <span className="text-base leading-relaxed">{message}</span>
      </div>
    </div>
  );
};

