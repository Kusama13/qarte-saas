'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type CalloutVariant = 'info' | 'success' | 'warning' | 'danger' | 'amber' | 'violet' | 'indigo';

interface CalloutProps {
  variant?: CalloutVariant;
  icon?: LucideIcon;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const VARIANT_BG: Record<CalloutVariant, string> = {
  info: 'bg-sky-50/60 border-sky-100',
  success: 'bg-emerald-50/60 border-emerald-100',
  warning: 'bg-amber-50/60 border-amber-100',
  danger: 'bg-rose-50/60 border-rose-100',
  amber: 'bg-amber-50/60 border-amber-100',
  violet: 'bg-violet-50/60 border-violet-100',
  indigo: 'bg-indigo-50/60 border-indigo-100',
};

const VARIANT_ICON: Record<CalloutVariant, string> = {
  info: 'text-sky-600',
  success: 'text-emerald-600',
  warning: 'text-amber-600',
  danger: 'text-rose-600',
  amber: 'text-amber-600',
  violet: 'text-violet-600',
  indigo: 'text-indigo-600',
};

const VARIANT_TITLE: Record<CalloutVariant, string> = {
  info: 'text-sky-900',
  success: 'text-emerald-900',
  warning: 'text-amber-900',
  danger: 'text-rose-900',
  amber: 'text-amber-900',
  violet: 'text-violet-900',
  indigo: 'text-indigo-900',
};

const VARIANT_BODY: Record<CalloutVariant, string> = {
  info: 'text-sky-800/80',
  success: 'text-emerald-800/80',
  warning: 'text-amber-800/80',
  danger: 'text-rose-800/80',
  amber: 'text-amber-800/80',
  violet: 'text-violet-800/80',
  indigo: 'text-indigo-800/80',
};

export function Callout({ variant = 'info', icon: Icon, title, children, className }: CalloutProps) {
  return (
    <div className={cn('rounded-xl border p-3 flex items-start gap-2', VARIANT_BG[variant], className)}>
      {Icon && <Icon className={cn('w-3.5 h-3.5 shrink-0 mt-0.5', VARIANT_ICON[variant])} />}
      <div className="flex-1 min-w-0">
        {title && <p className={cn('text-[11px] font-bold mb-0.5', VARIANT_TITLE[variant])}>{title}</p>}
        <div className={cn('text-[11px] leading-relaxed', VARIANT_BODY[variant])}>{children}</div>
      </div>
    </div>
  );
}
