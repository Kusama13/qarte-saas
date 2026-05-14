'use client';

import { cn } from '@/lib/utils';

interface ChipOption {
  value: string;
  label: string;
}

interface ChipGroupProps {
  options: ChipOption[];
  value: string;
  onChange: (next: string) => void;
  /** Si fourni, ajoute un input numérique custom à la suite des chips. */
  custom?: {
    placeholder: string;
    suffix?: string;
    min?: number;
    max?: number;
  };
  /** Erreur visuelle sur le custom input. */
  error?: boolean;
  className?: string;
}

export function ChipGroup({ options, value, onChange, custom, error, className }: ChipGroupProps) {
  const isCustomValue = custom && value !== '' && !options.some(o => o.value === value);
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
            value === opt.value
              ? 'bg-slate-900 text-white border border-slate-900'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300',
          )}
        >
          {opt.label}
        </button>
      ))}
      {custom && (
        <input
          type="number"
          value={isCustomValue ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={custom.placeholder}
          min={custom.min}
          max={custom.max}
          className={cn(
            'w-[72px] px-2.5 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
            error ? 'border-red-300' : 'border-gray-200',
          )}
        />
      )}
    </div>
  );
}
