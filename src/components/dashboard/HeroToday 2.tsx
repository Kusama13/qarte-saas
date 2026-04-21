'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { ArrowRight, Heart } from 'lucide-react';
import type { Merchant, MerchantCountry } from '@/types';
import { formatCurrency, formatTime } from '@/lib/utils';

interface TodayBooking {
  id: string;
  client_name: string;
  start_time: string;
  totalPrice: number;
  servicesLabel: string;
  deposit_confirmed: boolean | null;
}

interface NearRewardCustomer {
  id: string;
  firstName: string;
  remaining: number; // visites OU € restants
}

interface HeroTodayProps {
  merchant: Merchant;
  // All-In data
  todayBookings: TodayBooking[];
  // Fidelity data
  todayVisitsCount: number;
  todayRedemptionsCount: number;
  nearRewardCustomers: NearRewardCustomer[];
}

export default function HeroToday({
  merchant,
  todayBookings,
  todayVisitsCount,
  todayRedemptionsCount,
  nearRewardCustomers,
}: HeroTodayProps) {
  const t = useTranslations('heroToday');
  const locale = useLocale();
  const country: MerchantCountry | undefined = merchant.country ?? undefined;
  const isCagnotte = merchant.loyalty_mode === 'cagnotte';
  const planningEnabled = !!merchant.planning_enabled;

  // ── Variant 1 : All-In (planning enabled) ──
  if (planningEnabled) {
    const count = todayBookings.length;
    const revenue = todayBookings.reduce((sum, b) => sum + b.totalPrice, 0);
    const previewBookings = todayBookings.slice(0, 4);
    const moreCount = Math.max(0, count - previewBookings.length);

    return (
      <Link
        href="/dashboard/planning"
        className="block group rounded-3xl bg-gradient-to-br from-[#4b0082] via-violet-700 to-violet-800 shadow-xl shadow-violet-900/20 overflow-hidden active:scale-[0.99] transition-transform"
      >
        <div className="px-5 pt-5 pb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/60 mb-2">
            {t('todayLabel')}
          </p>
          {count === 0 ? (
            <>
              <p className="text-2xl font-bold text-white tracking-tight leading-tight">
                {t('emptyTitlePlanning')}
              </p>
              <p className="text-sm text-white/70 mt-1">{t('emptyHintPlanning')}</p>
            </>
          ) : (
            <div className="flex items-baseline gap-3">
              <p className="text-3xl font-bold text-white tracking-tight tabular-nums">
                {t('countBookings', { count })}
              </p>
              {revenue > 0 && (
                <p className="text-base font-semibold text-white/80 tabular-nums">
                  · {formatCurrency(revenue, country, locale, 0)}
                </p>
              )}
            </div>
          )}
        </div>

        {previewBookings.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm border-t border-white/10">
            <ul className="divide-y divide-white/10">
              {previewBookings.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center gap-3 px-5 py-2.5"
                >
                  <span className="text-[13px] font-bold text-white tabular-nums shrink-0 w-12">
                    {formatTime(b.start_time, locale)}
                  </span>
                  <span className="flex-1 text-[13px] font-medium text-white truncate">
                    {b.client_name}
                  </span>
                  {b.totalPrice > 0 && (
                    <span className="text-[13px] font-semibold text-white/80 tabular-nums shrink-0">
                      {formatCurrency(b.totalPrice, country, locale, 0)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between px-5 py-2.5 text-[12px] text-white/80 group-active:text-white">
              <span>
                {moreCount > 0 ? t('moreBookings', { count: moreCount }) : t('viewPlanning')}
              </span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-active:translate-x-0.5" />
            </div>
          </div>
        )}
      </Link>
    );
  }

  // ── Variant 2 : Fidélité (no planning) ──
  const hasActivity = todayVisitsCount > 0 || todayRedemptionsCount > 0;
  const previewNear = nearRewardCustomers.slice(0, 3);

  return (
    <Link
      href="/dashboard/customers"
      className="block group rounded-3xl bg-gradient-to-br from-[#4b0082] via-violet-700 to-violet-800 shadow-xl shadow-violet-900/20 overflow-hidden active:scale-[0.99] transition-transform"
    >
      <div className="px-5 pt-5 pb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/60 mb-2">
          {t('todayLabel')}
        </p>
        {hasActivity ? (
          <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1">
            <p className="text-3xl font-bold text-white tracking-tight tabular-nums">
              {isCagnotte
                ? t('countVisitsGeneric', { count: todayVisitsCount })
                : t('countStamps', { count: todayVisitsCount })}
            </p>
            {todayRedemptionsCount > 0 && (
              <p className="text-base font-semibold text-white/80 tabular-nums">
                · {t('countRewards', { count: todayRedemptionsCount })}
              </p>
            )}
          </div>
        ) : (
          <>
            <p className="text-2xl font-bold text-white tracking-tight leading-tight">
              {t('emptyTitleFidelity')}
            </p>
            <p className="text-sm text-white/70 mt-1">{t('emptyHintFidelity')}</p>
          </>
        )}
      </div>

      {previewNear.length > 0 && (
        <div className="bg-white/10 backdrop-blur-sm border-t border-white/10">
          <p className="px-5 pt-3 pb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-white/60">
            {t('nearRewardTitle')}
          </p>
          <ul className="divide-y divide-white/10">
            {previewNear.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-5 py-2.5">
                <Heart className="w-3.5 h-3.5 text-pink-300 shrink-0" fill="currentColor" />
                <span className="flex-1 text-[13px] font-medium text-white truncate">
                  {c.firstName}
                </span>
                <span className="text-[12px] font-semibold text-white/80 tabular-nums shrink-0">
                  {isCagnotte
                    ? t('remainingAmount', { amount: formatCurrency(c.remaining, country, locale, 0) })
                    : t('remainingStamps', { count: c.remaining })}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between px-5 py-2.5 text-[12px] text-white/80 group-active:text-white">
            <span>{t('viewCustomers')}</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-active:translate-x-0.5" />
          </div>
        </div>
      )}
    </Link>
  );
}
