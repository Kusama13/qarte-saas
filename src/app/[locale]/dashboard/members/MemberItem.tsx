'use client';

import {
  RefreshCw,
  Trash2,
} from 'lucide-react';
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
    <div className={`group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all duration-300 ${
      isValid
        ? 'bg-white/70 backdrop-blur-md border-indigo-100 shadow-sm hover:shadow-xl hover:shadow-indigo-900/5 hover:border-indigo-300 hover:-translate-y-0.5'
        : 'bg-gray-50/50 border-gray-100 opacity-60 grayscale-[0.5]'
    }`}>
      {/* Top row on mobile: Avatar + Info + Status */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Premium Avatar with Glow */}
        <div className="relative shrink-0">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-white font-bold relative z-10 overflow-hidden ${
            isValid
              ? 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 shadow-lg shadow-indigo-200'
              : 'bg-gray-400'
          }`}>
            {isValid && <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent animate-shimmer" />}
            {member.customer?.first_name?.charAt(0) || '?'}
          </div>
          {isValid && (
            <div className="absolute -inset-1 bg-indigo-400/20 blur-lg rounded-xl transition-opacity opacity-0 group-hover:opacity-100" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 tracking-tight flex items-center gap-2 text-sm sm:text-base truncate">
            {member.customer?.first_name} {member.customer?.last_name}
            {isValid && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)] shrink-0" />}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 text-[11px] sm:text-[13px] text-gray-500">
            <span className="font-medium">{formatPhoneLabel(member.customer?.phone_number || '')}</span>
            <span className="hidden sm:inline w-1 h-1 rounded-full bg-gray-300" />
            <span className="flex items-center gap-1">
              <span className="hidden sm:inline opacity-60">{t('expiresOn')}</span>
              <span className={isValid ? 'text-indigo-700 font-medium' : ''}>{formatDate(member.valid_until)}</span>
            </span>
          </div>
        </div>

        {/* Status Badge - visible on mobile in top row */}
        <div className="sm:hidden shrink-0">
          <div className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${
            isValid
              ? 'bg-emerald-50/50 border-emerald-100 text-emerald-600'
              : 'bg-gray-100 border-gray-200 text-gray-500'
          }`}>
            {isValid ? t('active') : t('expired')}
          </div>
        </div>
      </div>

      {/* Bottom row on mobile: Badges + Actions */}
      <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 pl-13 sm:pl-0">
        {/* Dynamic Status Badges */}
        <div className="hidden sm:flex items-center gap-3">
          {isValid && daysRemaining <= 7 && (
            <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-black uppercase tracking-wider rounded-lg shadow-sm">
              {t('daysRemaining', { count: daysRemaining })}
            </span>
          )}

          <div className={`px-3 py-1 text-[11px] font-bold uppercase tracking-widest rounded-full transition-all border ${
            isValid
              ? 'bg-emerald-50/50 border-emerald-100 text-emerald-600'
              : 'bg-gray-100 border-gray-200 text-gray-500'
          }`}>
            {isValid ? t('active') : t('expired')}
          </div>
        </div>

        {/* Mobile: Days remaining badge */}
        {isValid && daysRemaining <= 7 && (
          <span className="sm:hidden px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold uppercase rounded-lg">
            {t('daysRemainingShort', { count: daysRemaining })}
          </span>
        )}

        {/* Premium Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={onExtend}
            className="p-2 sm:p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg sm:rounded-xl transition-all active:scale-95 border border-transparent hover:border-indigo-100"
            title={t('renew')}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onRemove}
            className="p-2 sm:p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg sm:rounded-xl transition-all active:scale-95 border border-transparent hover:border-red-100"
            title={t('remove')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
