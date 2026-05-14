'use client';

import { Switch } from './Switch';
import { cn } from '@/lib/utils';

type ToggleTone = 'indigo' | 'emerald' | 'amber' | 'violet' | 'rose';

interface ToggleRowProps {
  title: string;
  hint?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  tone?: ToggleTone;
  /** Contenu sub-revealé quand le toggle est ON (ex: form de config). */
  children?: React.ReactNode;
  className?: string;
}

export function ToggleRow({ title, hint, checked, onChange, tone = 'indigo', children, className }: ToggleRowProps) {
  return (
    <div className={cn('space-y-2.5', className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800">{title}</p>
          {hint && <p className="text-[11px] text-gray-500 mt-0.5">{hint}</p>}
        </div>
        <Switch checked={checked} onChange={onChange} tone={tone} size="md" />
      </div>
      {checked && children && <div className="pl-1">{children}</div>}
    </div>
  );
}
