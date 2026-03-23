'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

const variantClasses = {
  primary: 'bg-amber-500 hover:bg-amber-600 text-black font-semibold border-transparent',
  secondary: 'bg-[#2a2f42] hover:bg-[#333a52] text-slate-100 border-[#3a3f52]',
  danger: 'bg-red-500 hover:bg-red-600 text-white font-semibold border-transparent',
  ghost: 'bg-transparent hover:bg-[#2a2f42] text-slate-300 hover:text-slate-100 border-transparent',
  outline: 'bg-transparent hover:bg-[#2a2f42] text-amber-400 border-amber-500/50 hover:border-amber-500',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs rounded-md gap-1.5',
  md: 'px-4 py-2 text-sm rounded-lg gap-2',
  lg: 'px-5 py-2.5 text-base rounded-lg gap-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center border font-medium
        transition-all duration-150 cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
