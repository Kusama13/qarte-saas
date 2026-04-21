'use client';

import { Crown, Clock, Users, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ProgramWithCount } from './types';
import { formatDuration } from './types';

export default function ProgramCard({
  program,
  onClick,
}: {
  program: ProgramWithCount;
  onClick: () => void;
}) {
  const t = useTranslations('members');
  const memberCount = program.member_cards?.[0]?.count || 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:bg-slate-50 active:scale-[0.99] touch-manipulation transition-all text-left"
    >
      <div className="flex items-center gap-3">
        <div className="shrink-0 w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
          <Crown className="w-5 h-5 text-indigo-600" strokeWidth={2.25} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight truncate">
              {program.name}
            </h3>
            <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" strokeWidth={2.25} />
          </div>

          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {!!program.benefit_label && (
              <span className="inline-flex px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider">
                {program.benefit_label}
              </span>
            )}
            {!!program.discount_percent && (
              <span className="inline-flex px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold tabular-nums">
                -{program.discount_percent}%
              </span>
            )}
            {program.skip_deposit && (
              <span className="inline-flex px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 text-[10px] font-bold uppercase tracking-wider">
                {t('skipDepositBadge')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 text-slate-400" strokeWidth={2.25} />
              <span className="font-medium tabular-nums">{memberCount} membre{memberCount > 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" strokeWidth={2.25} />
              <span className="font-medium">{formatDuration(program.duration_months)}</span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
