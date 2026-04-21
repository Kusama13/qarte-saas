'use client';

import { useTranslations } from 'next-intl';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WeekTile {
  label: string;
  value: string | number;
  thisWeek: number;
  lastWeek: number;
}

interface Props {
  tiles: WeekTile[];
}

function computeDelta(thisWeek: number, lastWeek: number): { pct: number | null; trend: 'up' | 'down' | 'flat' } {
  if (lastWeek === 0) {
    if (thisWeek > 0) return { pct: null, trend: 'up' };
    return { pct: null, trend: 'flat' };
  }
  const pct = Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
  if (pct > 0) return { pct, trend: 'up' };
  if (pct < 0) return { pct: Math.abs(pct), trend: 'down' };
  return { pct: 0, trend: 'flat' };
}

export default function WeekTiles({ tiles }: Props) {
  const t = useTranslations('weekTiles');
  const hasData = tiles.some((tile) => tile.thisWeek > 0 || tile.lastWeek > 0);
  if (!hasData) return null;

  return (
    <div>
      <p className="px-1 mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
        {t('title')}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {tiles.map((tile, i) => {
          const { pct, trend } = computeDelta(tile.thisWeek, tile.lastWeek);
          const Icon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus;
          const colorClass =
            trend === 'up' ? 'text-emerald-600' :
            trend === 'down' ? 'text-red-500' :
            'text-slate-400';
          return (
            <div
              key={i}
              className={cn(
                'rounded-2xl p-4 border transition-colors',
                trend === 'up' ? 'bg-emerald-50/60 border-emerald-100' :
                trend === 'down' ? 'bg-red-50/60 border-red-100' :
                'bg-slate-50 border-slate-100'
              )}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 leading-none mb-2">
                {tile.label}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-[22px] font-bold text-slate-900 tracking-tight tabular-nums leading-none">
                  {tile.value}
                </span>
              </div>
              <div className={cn('flex items-center gap-1 mt-2 text-[11px] font-semibold', colorClass)}>
                <Icon className="w-3 h-3" strokeWidth={2.5} />
                {pct != null ? (
                  <span className="tabular-nums">{trend === 'up' ? '+' : trend === 'down' ? '-' : ''}{pct}%</span>
                ) : (
                  <span className="text-slate-400">{t('newData')}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
