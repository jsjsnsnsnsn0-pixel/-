import React from 'react';

interface PremiumButtonProps {
  children: React.ReactNode;
  variant?: 'gold' | 'primary' | 'secondary' | 'danger' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export const PremiumButton: React.FC<PremiumButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  onClick,
  icon,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'h-11 px-3 text-xs gap-1.5 rounded-lg',
    md: 'h-11 px-4 text-sm gap-2 rounded-xl font-semibold',
    lg: 'h-13 px-6 text-base gap-2.5 rounded-2xl font-bold',
  };

  const variantClasses = {
    gold: 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-slate-950 font-bold shadow-md shadow-amber-500/20 hover:brightness-105 active:scale-[0.98]',
    primary:
      'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white shadow-md shadow-purple-600/30 hover:brightness-110 active:scale-[0.98]',
    secondary:
      'bg-[#1a1c30] text-slate-200 border border-purple-500/20 hover:bg-[#22253f] hover:border-purple-500/40 active:scale-[0.98]',
    glass:
      'bg-white/10 backdrop-blur-md text-white border border-white/15 hover:bg-white/15 active:scale-[0.98]',
    danger:
      'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-600/20 hover:brightness-105 active:scale-[0.98]',
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`ui-control inline-flex items-center justify-center cursor-pointer transition-all select-none disabled:opacity-50 disabled:cursor-not-allowed ${
        fullWidth ? 'w-full' : ''
      } ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
    </button>
  );
};
