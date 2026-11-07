import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export type StatusType = 'confirmed' | 'pending' | 'warning' | 'danger';

export interface StatusPillProps {
  status: StatusType;
  label: string;
  className?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, label, className = '' }) => {
  const configs = {
    confirmed: {
      bg: 'bg-ok-bg text-ok border-ok/40',
      icon: <CheckCircle className="w-5 h-5 flex-shrink-0" />,
    },
    pending: {
      bg: 'bg-canvas text-mute border-gray-300',
      icon: <Clock className="w-5 h-5 flex-shrink-0" />,
    },
    warning: {
      bg: 'bg-warn-bg text-warn border-warn/40',
      icon: <AlertCircle className="w-5 h-5 flex-shrink-0" />,
    },
    danger: {
      bg: 'bg-danger-bg text-danger border-danger/40',
      icon: <AlertTriangle className="w-5 h-5 flex-shrink-0" />,
    },
  }[status];

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-semibold text-base ${configs.bg} ${className}`}
    >
      {configs.icon}
      <span>{label}</span>
    </span>
  );
};

