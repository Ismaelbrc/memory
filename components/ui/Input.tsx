'use client';

import { InputHTMLAttributes, ReactNode, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, helper, leftIcon, rightIcon, className = '', id, ...props },
  ref
) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-300 mb-1.5">
          {label}
          {props.required && <span className="text-amber-400 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full bg-[#1a1f2e] border text-slate-100 rounded-lg py-2 px-3
            focus:outline-none focus:ring-1 transition-colors
            placeholder:text-slate-600 text-sm
            ${error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
              : 'border-[#2a2f42] focus:border-amber-500 focus:ring-amber-500/30'
            }
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            ${className}
          `}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}
      {helper && !error && (
        <p className="mt-1 text-xs text-slate-500">{helper}</p>
      )}
    </div>
  );
});
