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
  /** Layout grille : chips répartis sur toute la largeur, colonnes selon le nombre de cellules. */
  fill?: boolean;
  className?: string;
}

/** Layout grille `fill` selon le nombre total de cellules (chips + input custom éventuel). */
const FILL_COLS: Record<number, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-4',
  5: 'grid-cols-3 sm:grid-cols-5',
  6: 'grid-cols-3 sm:grid-cols-6',
};

export function ChipGroup({ options, value, onChange, custom, error, fill, className }: ChipGroupProps) {
  const isCustomValue = custom && value !== '' && !options.some(o => o.value === value);
  const cellCount = options.length + (custom ? 1 : 0);
  return (
    <div
      className={cn(
        fill ? `grid gap-1.5 ${FILL_COLS[cellCount] ?? FILL_COLS[6]}` : 'flex flex-wrap gap-1.5',
        className,
      )}
    >
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'min-h-[44px] inline-flex items-center justify-center rounded-xl text-xs font-bold transition-all',
            fill ? 'w-full' : 'px-3',
            value === opt.value
              ? 'bg-slate-800 text-white border border-slate-800'
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
            'min-h-[44px] px-2.5 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
            fill ? 'w-full min-w-0' : 'w-[72px]',
            error ? 'border-red-300' : 'border-gray-200',
          )}
        />
      )}
    </div>
  );
}
