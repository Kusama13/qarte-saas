'use client';

import { useEffect, useId, useRef, ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    full: 'max-w-4xl',
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={cn(
          'relative flex flex-col w-full max-h-[calc(100dvh-2rem)] bg-white rounded-2xl shadow-sm border border-slate-100 animate-slide-up',
          sizes[size]
        )}
      >
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
            <h2 id={titleId} className="text-base font-bold text-slate-900">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Fermer"
              className="p-2 transition-colors rounded-lg hover:bg-slate-100 active:scale-95 touch-manipulation"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        )}
        {!title && (
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="absolute p-2 transition-colors rounded-lg top-4 right-4 hover:bg-slate-100 active:scale-95 touch-manipulation"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        )}
        <div className="p-6 min-h-0 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
