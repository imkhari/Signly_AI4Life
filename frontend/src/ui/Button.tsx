import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'normal' | 'large';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'normal',
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center gap-3 font-semibold rounded-2xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none min-h-[64px] px-6 text-lg';

  const variantStyles = {
    primary: 'bg-action text-white hover:opacity-90 active:scale-[0.98]',
    secondary: 'bg-paper border-2 border-action text-action hover:bg-canvas active:scale-[0.98]',
    danger: 'bg-danger text-white hover:opacity-90 active:scale-[0.98]',
    ghost: 'bg-transparent text-ink hover:bg-black/5 active:scale-[0.98]',
  }[variant];

  const sizeStyles = {
    normal: 'py-3 text-lg',
    large: 'py-4 text-xl min-h-[72px]',
  }[size];

  return (
    <button
      className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};

