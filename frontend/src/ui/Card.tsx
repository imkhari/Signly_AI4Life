import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'highlight' | 'warning' | 'danger';
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  children,
  className = '',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-paper border-gray-200 text-ink',
    highlight: 'bg-paper border-action text-ink shadow-sm',
    warning: 'bg-warn-bg border-warn/30 text-ink',
    danger: 'bg-danger-bg border-danger/30 text-ink',
  }[variant];

  return (
    <div
      className={`rounded-2xl border p-6 card-border ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

