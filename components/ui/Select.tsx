'use client';

import { SelectHTMLAttributes, forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helper?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, helper, options, placeholder, className = '', id, ...props },
  ref
) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-slate-300 mb-1.5">
          {label}
          {props.required && <span className="text-amber-400 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={`
            w-full bg-[#1a1f2e] border text-slate-100 rounded-lg py-2 px-3 pr-9
            focus:outline-none focus:ring-1 transition-colors
            appearance-none text-sm cursor-pointer
            ${error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
              : 'border-[#2a2f42] focus:border-amber-500 focus:ring-amber-500/30'
            }
            ${className}
          `}
          {...props}
        >
          {placeholder && (
            <option value="">{placeholder}</option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
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
