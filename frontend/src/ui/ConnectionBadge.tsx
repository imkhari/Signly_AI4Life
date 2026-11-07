import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export interface ConnectionBadgeProps {
  status: 'connected' | 'connecting' | 'reconnecting' | 'disconnected';
  className?: string;
}

export const ConnectionBadge: React.FC<ConnectionBadgeProps> = ({ status, className = '' }) => {
  const configs = {
    connected: {
      dot: 'bg-ok',
      text: 'Đã kết nối',
      icon: <Wifi className="w-4 h-4 text-ok" />,
      container: 'border-ok/30 bg-ok-bg text-ok',
    },
    connecting: {
      dot: 'bg-warn animate-pulse',
      text: 'Đang kết nối...',
      icon: <Wifi className="w-4 h-4 text-warn animate-pulse" />,
      container: 'border-warn/30 bg-warn-bg text-warn',
    },
    reconnecting: {
      dot: 'bg-warn animate-ping',
      text: 'Đang kết nối lại...',
      icon: <Wifi className="w-4 h-4 text-warn animate-pulse" />,
      container: 'border-warn/30 bg-warn-bg text-warn',
    },
    disconnected: {
      dot: 'bg-danger',
      text: 'Mất kết nối',
      icon: <WifiOff className="w-4 h-4 text-danger" />,
      container: 'border-danger/30 bg-danger-bg text-danger',
    },
  }[status];

  return (
    <div
      role="status"
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold select-none ${configs.container} ${className}`}
    >
      {configs.icon}
      <span>{configs.text}</span>
    </div>
  );
};

