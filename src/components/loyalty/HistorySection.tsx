'use client';

import { useState, useMemo } from 'react';
import {
  Clock,
  Gift,
  ChevronDown,
  ChevronUp,
  Heart,
  SlidersHorizontal,
  Hourglass,
  XCircle,
  Trophy,
  Ticket,
  UserPlus,
  Calendar,
  Cake,
  Check,
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { formatDateTime, formatCurrency, formatTime } from '@/lib/utils';
import type { Merchant, Visit, VisitStatus } from '@/types';

interface PointAdjustment {
  id: string;
  adjusted_at: string;
  adjustment: number;
  reason: string | null;
}

interface RedemptionHistory {
  id: string;
  redeemed_at: string;
  stamps_used: number;
  tier: number;
}

interface VisitWithStatus extends Visit {
  status: VisitStatus;
  flagged_reason: string | null;
}

export interface UsedVoucher {
  id: string;
  used_at: string;
  reward_description: string;
  source?: 'birthday' | 'referral' | 'redemption' | 'welcome' | 'offer' | null;
}

interface AppointmentItem {
  id: string;
  slot_date: string;
  start_time: string;
  planning_slot_services?: Array<{ service_id: string; service: { name: string } | null }>;
}

interface HistorySectionProps {
  visits: VisitWithStatus[];
  adjustments: PointAdjustment[];
  redemptions: RedemptionHistory[];
  usedVouchers?: UsedVoucher[];
  appointments?: AppointmentItem[];
  merchant: Merchant;
}

export default function HistorySection({
  visits,
  adjustments,
  redemptions,
  usedVouchers = [],
  appointments = [],
  merchant,
}: HistorySectionProps) {
  const t = useTranslations('historySection');
  const locale = useLocale();
  const [expanded, setExpanded] = useState(false);

  const LoyaltyIcon = Heart;
  const hasItems = visits.length > 0 || adjustments.length > 0 || redemptions.length > 0 || usedVouchers.length > 0 || appointments.length > 0;

  // Pre-compute sorted items (memoized to avoid re-sort on expand toggle)
  const allItems = useMemo(() => [
    ...visits.map((v) => ({
      type: 'visit' as const,
      date: v.visited_at,
      points: v.points_earned || 1,
      id: v.id,
      status: v.status || ('confirmed' as const),
      flagged_reason: v.flagged_reason,
      tier: undefined as number | undefined,
      reward_description: undefined as string | undefined,
      source: null as string | null,
      amount_spent: v.amount_spent ?? null,
      serviceNames: undefined as string[] | undefined,
    })),
    ...adjustments.map((a) => ({
      type: 'adjustment' as const,
      date: a.adjusted_at,
      points: a.adjustment,
      id: a.id,
      status: 'confirmed' as const,
      flagged_reason: null as string | null,
      tier: undefined as number | undefined,
      reward_description: undefined as string | undefined,
      source: null as string | null,
      amount_spent: null as number | null,
      serviceNames: undefined as string[] | undefined,
    })),
    ...redemptions.map((r) => ({
      type: 'redemption' as const,
      date: r.redeemed_at,
      points: r.stamps_used,
      id: r.id,
      status: 'confirmed' as const,
      flagged_reason: null as string | null,
      tier: r.tier as number | undefined,
      reward_description: undefined as string | undefined,
      source: null as string | null,
      amount_spent: null as number | null,
      serviceNames: undefined as string[] | undefined,
    })),
    ...usedVouchers.map((v) => ({
      type: 'voucher_used' as const,
      date: v.used_at,
      points: 0,
      id: v.id,
      status: 'confirmed' as const,
      flagged_reason: null as string | null,
      tier: undefined as number | undefined,
      reward_description: v.reward_description,
      source: v.source || null,
      amount_spent: null as number | null,
      serviceNames: undefined as string[] | undefined,
    })),
    ...appointments.map((a) => ({
      type: 'appointment' as const,
      date: `${a.slot_date}T${a.start_time}:00`,
      points: 0,
      id: a.id,
      status: 'confirmed' as const,
      flagged_reason: null as string | null,
      tier: undefined as number | undefined,
      reward_description: undefined as string | undefined,
      source: null as string | null,
      amount_spent: null as number | null,
      serviceNames: (a.planning_slot_services || []).map(s => s.service?.name).filter(Boolean) as string[],
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 30),
  [visits, adjustments, redemptions, usedVouchers, appointments]);

  const displayItems = expanded ? allItems : allItems.slice(0, 3);
  const hasMore = allItems.length > 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100/80 overflow-hidden mb-4"
    >
      <div className="p-4 border-b border-gray-50 flex items-center justify-between">
        <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
          <div className="p-1.5 bg-gray-50 rounded-lg">
            <LoyaltyIcon className="w-4 h-4 text-gray-500" />
          </div>
          {t('title')}
        </h2>
      </div>

      {hasItems ? (
        <>
          <ul className="divide-y divide-gray-50">
            {displayItems.map((item, index) => {
              const isAdjustment = item.type === 'adjustment';
              const isRedemption = item.type === 'redemption';
              const isVoucherUsed = item.type === 'voucher_used';
              const isAppointment = item.type === 'appointment';
              const isBonusVoucher = item.type === 'visit' && !!item.flagged_reason?.startsWith('bonus_');
              const isPending = item.status === 'pending';
              const isRejected = item.status === 'rejected';

              const getStatusIcon = () => {
                if (isAppointment) return <Calendar className="w-4 h-4 text-purple-500" />;
                if (isVoucherUsed) return <Ticket className="w-4 h-4 text-indigo-500" />;
                if (isBonusVoucher) return <UserPlus className="w-4 h-4" style={{ color: merchant.primary_color }} />;
                if (isRedemption) {
                  return item.tier === 2
                    ? <Trophy className="w-4 h-4 text-violet-500" />
                    : <Gift className="w-4 h-4 text-emerald-500" />;
                }
                if (isAdjustment) return <SlidersHorizontal className="w-4 h-4 text-amber-600" />;
                if (isPending) return <Hourglass className="w-4 h-4 text-amber-600 animate-pulse" />;
                if (isRejected) return <XCircle className="w-4 h-4 text-red-500" />;
                return <LoyaltyIcon className="w-4 h-4" style={{ color: merchant.primary_color }} />;
              };

              const getIconBgColor = () => {
                if (isAppointment) return '#f3e8ff';
                if (isVoucherUsed) return '#e0e7ff';
                if (isRedemption) return item.tier === 2 ? '#ede9fe' : '#d1fae5';
                if (isAdjustment) return '#fef3c7';
                if (isPending) return '#fef3c7';
                if (isRejected) return '#fee2e2';
                return `${merchant.primary_color}10`;
              };

              const getLabel = () => {
                if (isAppointment) {
                  const time = item.date.split('T')[1]?.slice(0, 5) || '';
                  return t('appointmentAt', { time: formatTime(time, locale) });
                }
                if (isVoucherUsed) {
                  return item.reward_description || t('rewardUsed');
                }
                if (isBonusVoucher) {
                  if (item.flagged_reason === 'bonus_welcome') return t('bonusWelcome');
                  if (item.flagged_reason === 'bonus_offer') return t('bonusOffer');
                  return t('bonusReferral');
                }
                if (isRedemption) {
                  const tierLabel = merchant.tier2_enabled && item.tier ? ` ${t('tier', { number: item.tier })}` : '';
                  const isCagnotte = merchant.loyalty_mode === 'cagnotte';
                  return isCagnotte ? t('cagnotteRedeemed', { tierLabel }) : t('giftUsed', { tierLabel });
                }
                if (isAdjustment) return t('adjustment');
                if (isPending) return t('pending');
                if (isRejected) return t('rejected');
                if (item.amount_spent != null && item.amount_spent > 0) {
                  return t('visitValidatedAmount', { amount: formatCurrency(Number(item.amount_spent || 0), merchant.country, locale) });
                }
                return t('visitValidated');
              };

              return (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50/40 transition-colors ${isRejected ? 'opacity-60' : ''}`}
                >
                  <div
                    className="flex items-center justify-center w-9 h-9 rounded-xl"
                    style={{ backgroundColor: getIconBgColor() }}
                  >
                    {getStatusIcon()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm truncate flex items-center gap-1.5 ${
                      isRejected ? 'text-gray-500 line-through'
                      : isRedemption ? 'text-emerald-700'
                      : isVoucherUsed ? 'text-indigo-700'
                      : isBonusVoucher ? 'text-gray-900'
                      : 'text-gray-900'
                    }`}>
                      {isVoucherUsed && (item.source === 'birthday'
                        ? <Cake className="w-3.5 h-3.5 shrink-0" />
                        : <Ticket className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span className="truncate">{getLabel()}</span>
                    </p>
                    <p className="text-[10px] text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDateTime(item.date, locale)}
                    </p>
                    {isAppointment && item.serviceNames && item.serviceNames.length > 0 && (
                      <p className="text-[10px] text-gray-500 mt-0.5 truncate">{item.serviceNames.join(', ')}</p>
                    )}
                  </div>
                  {isAppointment ? (
                    <div className="px-2 py-1 rounded-lg text-xs font-bold bg-purple-100 text-purple-700">
                      <Calendar className="w-3.5 h-3.5" />
                    </div>
                  ) : !isRedemption && !isVoucherUsed && (
                    <div
                      className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
                        isPending
                          ? 'bg-amber-100 text-amber-700'
                          : isRejected
                          ? 'bg-red-100 text-red-500 line-through'
                          : item.points > 0
                          ? isAdjustment
                            ? 'bg-green-100 text-green-700'
                            : ''
                          : 'bg-red-100 text-red-700'
                      }`}
                      style={
                        item.points > 0 && !isAdjustment && !isPending && !isRejected
                          ? { backgroundColor: `${merchant.primary_color}10`, color: merchant.primary_color }
                          : {}
                      }
                    >
                      {isPending ? <Hourglass className="w-3 h-3" /> : isRejected ? <XCircle className="w-3 h-3" /> : null}
                      <span>{!isPending && !isRejected && item.points > 0 ? `+${item.points}` : item.points}</span>
                    </div>
                  )}
                  {isRedemption && (
                    <div className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center ${item.tier === 2 ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </div>
                  )}
                  {isVoucherUsed && (
                    <div className="px-2 py-1 rounded-lg text-xs font-bold bg-indigo-100 text-indigo-700 flex items-center">
                      <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </div>
                  )}
                </motion.li>
              );
            })}
          </ul>
          {hasMore && (
            <div className="p-3 border-t border-gray-50">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-center gap-1 py-2 text-xs font-medium rounded-lg transition-all"
                style={{ color: merchant.primary_color, backgroundColor: `${merchant.primary_color}08` }}
              >
                {expanded ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    {t('collapse')}
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    {t('viewAll', { count: allItems.length })}
                  </>
                )}
              </motion.button>
            </div>
          )}
        </>
      ) : (
        <div className="p-8 text-center">
          <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <LoyaltyIcon className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium text-sm">{t('noHistory')}</p>
        </div>
      )}
    </motion.div>
  );
}
