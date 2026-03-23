'use client';

import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`
          relative w-full ${sizeClasses[size]}
          bg-[#1a1f2e] border border-[#2a2f42] rounded-2xl shadow-2xl
          animate-fade-in
        `}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2f42]">
            <h2 className="text-base font-semibold text-slate-100">{title}</h2>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-[#2a2f42]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
