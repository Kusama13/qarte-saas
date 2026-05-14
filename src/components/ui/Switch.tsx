'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

type SwitchTone = 'indigo' | 'emerald' | 'amber' | 'violet' | 'rose';
type SwitchSize = 'sm' | 'md';

interface SwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  tone?: SwitchTone;
  size?: SwitchSize;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

const TONE_BG: Record<SwitchTone, string> = {
  indigo: 'bg-indigo-600',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  violet: 'bg-violet-600',
  rose: 'bg-rose-500',
};

const SIZE_TRACK: Record<SwitchSize, string> = {
  sm: 'h-5 w-9',
  md: 'h-6 w-11',
};

const SIZE_THUMB: Record<SwitchSize, string> = {
  sm: 'h-3.5 w-3.5',
  md: 'h-5 w-5',
};

const SIZE_TRANSLATE_ON: Record<SwitchSize, string> = {
  sm: 'translate-x-[18px]',
  md: 'translate-x-[22px]',
};

const SIZE_TRANSLATE_OFF: Record<SwitchSize, string> = {
  sm: 'translate-x-[3px]',
  md: 'translate-x-0.5',
};

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onChange, tone = 'indigo', size = 'md', disabled, ariaLabel, className }, ref) => (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
        SIZE_TRACK[size],
        checked ? TONE_BG[tone] : 'bg-gray-200',
        className,
      )}
    >
      <span className={cn(
        'inline-block transform rounded-full bg-white shadow-sm transition-transform',
        SIZE_THUMB[size],
        checked ? SIZE_TRANSLATE_ON[size] : SIZE_TRANSLATE_OFF[size],
      )} />
    </button>
  ),
);

Switch.displayName = 'Switch';
