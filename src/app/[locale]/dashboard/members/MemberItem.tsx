'use client';

import { RefreshCw, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatDate, formatPhoneLabel } from '@/lib/utils';
import type { MemberCard } from '@/types';

export default function MemberItem({
  member,
  onExtend,
  onRemove,
}: {
  member: MemberCard;
  onExtend: () => void;
  onRemove: () => void;
}) {
  const t = useTranslations('members');
  const isValid = new Date(member.valid_until) > new Date();
  const daysRemaining = Math.ceil(
    (new Date(member.valid_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border transition-colors ${
      isValid
        ? 'bg-white border-slate-100 hover:bg-slate-50'
        : 'bg-slate-50 border-slate-100 opacity-60'
    }`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-sm font-semibold ${
          isValid ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-500'
        }`}>
          {member.customer?.first_name?.charAt(0) || '?'}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2 truncate">
            {member.customer?.first_name} {member.customer?.last_name}
            {isValid && <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500" />}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-slate-500 mt-0.5">
            <span>{formatPhoneLabel(member.customer?.phone_number || '')}</span>
            <span className="hidden sm:inline w-1 h-1 rounded-full bg-slate-300" />
            <span className="tabular-nums">
              <span className="hidden sm:inline opacity-75 mr-1">{t('expiresOn')}</span>
              {formatDate(member.valid_until)}
            </span>
          </div>
        </div>

        <div className="sm:hidden shrink-0">
          <div className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${
            isValid ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}>
            {isValid ? t('active') : t('expired')}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
        <div className="hidden sm:flex items-center gap-2">
          {isValid && daysRemaining <= 7 && (
            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-wider rounded-full tabular-nums">
              {t('daysRemaining', { count: daysRemaining })}
            </span>
          )}
          <div className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${
            isValid ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}>
            {isValid ? t('active') : t('expired')}
          </div>
        </div>

        {isValid && daysRemaining <= 7 && (
          <span className="sm:hidden px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-wider rounded-full tabular-nums">
            {t('daysRemainingShort', { count: daysRemaining })}
          </span>
        )}

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onExtend}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg active:scale-95 touch-manipulation transition-colors"
            title={t('renew')}
          >
            <RefreshCw className="w-4 h-4" strokeWidth={2.25} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg active:scale-95 touch-manipulation transition-colors"
            title={t('remove')}
          >
            <Trash2 className="w-4 h-4" strokeWidth={2.25} />
          </button>
        </div>
      </div>
    </div>
  );
}
