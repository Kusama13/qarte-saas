'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  Loader2,
  Check,
  Clock,
  SlidersHorizontal,
  History,
  Gift,
  Trophy,
  Pencil,
  X,
  Ticket,
  Calendar,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDateTime, formatCurrency, formatTime } from '@/lib/utils';
import { ROLES, type Role } from '@/lib/customer-modal-styles';

const INITIAL_VISIBLE_COUNT = 8;

interface Visit {
  id: string;
  visited_at: string;
  points_earned: number;
  amount_spent: number | null;
}

interface PointAdjustment {
  id: string;
  adjusted_at: string;
  adjustment: number;
  reason: string | null;
}

interface Redemption {
  id: string;
  redeemed_at: string;
  stamps_used: number;
  tier: number;
}

interface UsedVoucher {
  id: string;
  used_at: string;
  reward_description: string;
  source: string | null;
}

interface Appointment {
  id: string;
  slot_date: string;
  start_time: string;
  planning_slot_services: Array<{ service_id: string; service: { name: string } | null }>;
  planning_slot_result_photos: Array<{ id: string; url: string; position: number }>;
}

export interface CustomerHistoryTabProps {
  loyaltyCardId: string;
  merchantId: string;
  tier2Enabled: boolean;
  isCagnotte?: boolean;
  country?: string;
  customerId?: string;
}

type ItemType = 'visit' | 'adjustment' | 'redemption' | 'voucher' | 'appointment';
type FilterKey = 'all' | 'visit' | 'redemption' | 'voucher' | 'appointment' | 'adjustment';
type BucketKey = 'today' | 'week' | 'month' | 'older';

const DAY_MS = 86400000;

function bucketFor(dateStr: string, now: number): BucketKey {
  const d = new Date(dateStr).getTime();
  const diffDays = (now - d) / DAY_MS;
  if (diffDays < 1) return 'today';
  if (diffDays < 7) return 'week';
  if (diffDays < 30) return 'month';
  return 'older';
}

const BUCKET_ORDER: BucketKey[] = ['today', 'week', 'month', 'older'];

// Mapping sémantique : item type → rôle de couleur du modal.
// Pour `redemption`, on bascule sur `premium` quand tier === 2 (cf. logique inline).
const ITEM_TYPE_TO_ROLE: Record<ItemType, Role> = {
  visit: 'primary',
  appointment: 'primary',
  redemption: 'success',
  voucher: 'neutral',
  adjustment: 'warning',
};

export function CustomerHistoryTab({
  loyaltyCardId,
  merchantId,
  tier2Enabled,
  isCagnotte = false,
  country,
  customerId,
}: CustomerHistoryTabProps) {
  const t = useTranslations('customerHistory');
  const locale = useLocale();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [adjustments, setAdjustments] = useState<PointAdjustment[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [usedVouchers, setUsedVouchers] = useState<UsedVoucher[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPoints, setEditPoints] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [loyaltyCardId, customerId]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const appointmentsPromise = customerId
        ? fetch(`/api/planning?merchantId=${merchantId}&customerId=${customerId}&booked=true`)
            .then(r => r.ok ? r.json() : { slots: [] })
        : Promise.resolve({ slots: [] });

      const [visitsResult, adjustmentsResult, redemptionsResult, vouchersResult, appointmentsResult] = await Promise.all([
        supabase.from('visits').select('id, visited_at, points_earned, amount_spent').eq('loyalty_card_id', loyaltyCardId).order('visited_at', { ascending: false }).limit(50),
        supabase.from('point_adjustments').select('id, adjusted_at, adjustment, reason').eq('loyalty_card_id', loyaltyCardId).order('adjusted_at', { ascending: false }).limit(50),
        supabase.from('redemptions').select('id, redeemed_at, stamps_used, tier').eq('loyalty_card_id', loyaltyCardId).order('redeemed_at', { ascending: false }).limit(50),
        supabase.from('vouchers').select('id, used_at, reward_description, source').eq('loyalty_card_id', loyaltyCardId).eq('is_used', true).order('used_at', { ascending: false }).limit(50),
        appointmentsPromise,
      ]);

      setVisits(visitsResult.data || []);
      setAdjustments(adjustmentsResult.data || []);
      setRedemptions(redemptionsResult.data || []);
      setUsedVouchers((vouchersResult.data || []) as UsedVoucher[]);
      setAppointments((appointmentsResult.slots || []) as Appointment[]);
    } catch {
      // ignore
    } finally {
      setHistoryLoading(false);
    }
  };

  const startEdit = (item: { id: string; points: number; amount_spent: number | null }) => {
    setEditingId(item.id);
    setEditPoints(String(item.points));
    setEditAmount(item.amount_spent != null ? String(item.amount_spent) : '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditPoints('');
    setEditAmount('');
  };

  const saveEdit = async (visitId: string) => {
    const newPoints = parseInt(editPoints) || 0;
    if (newPoints < 0) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        visit_id: visitId,
        merchant_id: merchantId,
        loyalty_card_id: loyaltyCardId,
        new_points: newPoints,
      };
      if (isCagnotte) payload.new_amount = Math.max(0, parseFloat(editAmount.replace(',', '.')) || 0);
      const res = await fetch('/api/visits/edit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        cancelEdit();
        fetchHistory();
      }
    } finally {
      setSaving(false);
    }
  };

  type HistoryItem = {
    type: ItemType;
    date: string;
    points: number;
    id: string;
    tier?: number;
    reason?: string | null;
    amount_spent?: number | null;
    voucherDesc?: string;
    voucherSource?: string | null;
    serviceNames?: string[];
    resultPhotos?: Array<{ id: string; url: string; position: number }>;
  };

  const historyItems = useMemo<HistoryItem[]>(() => [
    ...visits.map((v): HistoryItem => ({ type: 'visit', date: v.visited_at, points: v.points_earned, id: v.id, amount_spent: v.amount_spent })),
    ...adjustments.map((a): HistoryItem => ({ type: 'adjustment', date: a.adjusted_at, points: a.adjustment, reason: a.reason, id: a.id })),
    ...redemptions.map((r): HistoryItem => ({ type: 'redemption', date: r.redeemed_at, points: r.stamps_used, id: r.id, tier: r.tier })),
    ...usedVouchers.map((v): HistoryItem => ({ type: 'voucher', date: v.used_at, points: 0, id: v.id, voucherDesc: v.reward_description, voucherSource: v.source })),
    ...appointments.map((a): HistoryItem => ({
      type: 'appointment',
      date: `${a.slot_date}T${a.start_time}:00`,
      points: 0,
      id: a.id,
      serviceNames: a.planning_slot_services.map(s => s.service?.name).filter(Boolean) as string[],
      resultPhotos: a.planning_slot_result_photos || [],
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  [visits, adjustments, redemptions, usedVouchers, appointments]);

  const filteredItems = useMemo(
    () => filter === 'all' ? historyItems : historyItems.filter(it => it.type === filter),
    [historyItems, filter],
  );

  // Reset visibleCount quand le filtre change pour repartir d'une vue propre.
  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, [filter]);

  const visibleItems = useMemo(
    () => filteredItems.slice(0, visibleCount),
    [filteredItems, visibleCount],
  );
  const hasMore = filteredItems.length > visibleCount;
  const remainingCount = filteredItems.length - visibleCount;

  const grouped = useMemo(() => {
    const now = Date.now();
    const out: Record<BucketKey, HistoryItem[]> = { today: [], week: [], month: [], older: [] };
    for (const it of visibleItems) out[bucketFor(it.date, now)].push(it);
    return out;
  }, [visibleItems]);

  // Counts per filter (for chip badges)
  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = { all: historyItems.length, visit: 0, redemption: 0, voucher: 0, appointment: 0, adjustment: 0 };
    for (const it of historyItems) c[it.type as FilterKey]++;
    return c;
  }, [historyItems]);

  const FILTER_PILLS: { key: FilterKey; label: string }[] = [
    { key: 'all', label: t('filterAll') },
    { key: 'visit', label: t('filterVisits') },
    { key: 'redemption', label: t('filterRewards') },
    { key: 'voucher', label: t('filterVouchers') },
    { key: 'appointment', label: t('filterAppointments') },
    { key: 'adjustment', label: t('filterAdjustments') },
  ];

  if (historyLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (historyItems.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <History className="w-10 h-10 mx-auto mb-2 text-gray-300" />
        <p className="text-sm">{t('noHistory')}</p>
      </div>
    );
  }

  const renderItem = (item: HistoryItem) => {
    const isRedemption = item.type === 'redemption';
    const isAdjustment = item.type === 'adjustment';
    const isVoucherUsed = item.type === 'voucher';
    const isAppointment = item.type === 'appointment';
    const isVisit = item.type === 'visit';
    const isEditing = editingId === item.id;

    // Tier 2 redemption bascule en `premium`, sinon utilise le mapping standard.
    const role: Role = isRedemption && item.tier === 2 ? 'premium' : ITEM_TYPE_TO_ROLE[item.type];
    const r = ROLES[role];

    const getIcon = () => {
      if (isAppointment) return <Calendar className={`w-4 h-4 ${r.icon}`} />;
      if (isVoucherUsed) return <Ticket className={`w-4 h-4 ${r.icon}`} />;
      if (isRedemption) {
        return item.tier === 2
          ? <Trophy className={`w-4 h-4 ${r.icon}`} />
          : <Gift className={`w-4 h-4 ${r.icon}`} />;
      }
      if (isAdjustment) return <SlidersHorizontal className={`w-4 h-4 ${r.icon}`} />;
      return <Check className={`w-4 h-4 ${r.icon}`} />;
    };

    const getLabel = () => {
      if (isAppointment) {
        const time = item.date.split('T')[1]?.slice(0, 5) || '';
        return t('appointmentAt', { time: formatTime(time, locale) });
      }
      if (isVoucherUsed) return item.voucherDesc || t('voucherUsed');
      if (isRedemption) {
        if (tier2Enabled) {
          return isCagnotte
            ? t('cagnotteTierUsed', { tier: item.tier ?? 1 })
            : t('giftTierUsed', { tier: item.tier ?? 1 });
        }
        return isCagnotte ? t('cagnotteUsed') : t('giftUsed');
      }
      if (isAdjustment) return t('manualAdjust');
      if (isCagnotte && item.amount_spent != null && item.amount_spent > 0) {
        return `${t('visit')} · ${formatCurrency(Number(item.amount_spent), country)}`;
      }
      return t('visit');
    };

    if (isVisit && isEditing) {
      return (
        <li key={item.id} className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-200 space-y-2">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${r.bgSolid}`}>{getIcon()}</div>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3 flex-shrink-0" />
              {formatDateTime(item.date)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-[10px] font-medium text-gray-500 uppercase">{t('pointsLabel')}</label>
              <input
                type="number"
                min={0}
                value={editPoints}
                onChange={(e) => setEditPoints(e.target.value)}
                className="w-full px-2 py-1 rounded-lg border border-gray-200 text-sm font-medium bg-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20 focus:outline-none"
              />
            </div>
            {isCagnotte && (
              <div className="flex-1">
                <label className="text-[10px] font-medium text-gray-500 uppercase">{t('amountLabel')}</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full px-2 py-1 rounded-lg border border-gray-200 text-sm font-medium bg-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20 focus:outline-none"
                />
              </div>
            )}
            <div className="flex items-end gap-1 pt-3.5">
              <button
                onClick={() => saveEdit(item.id)}
                disabled={saving}
                className="p-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              </button>
              <button
                onClick={cancelEdit}
                className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        </li>
      );
    }

    return (
      <li
        key={item.id}
        className={`flex items-center justify-between p-2.5 sm:p-3 rounded-lg ${r.bg} ${isVisit ? 'cursor-pointer hover:ring-1 hover:ring-indigo-200 transition-shadow' : ''}`}
        onClick={isVisit ? () => startEdit({ id: item.id, points: item.points, amount_spent: item.amount_spent ?? null }) : undefined}
        title={isVisit ? t('tapToEdit') : undefined}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${r.bgSolid}`}>{getIcon()}</div>
          <div className="min-w-0">
            <p className={`text-sm font-medium truncate ${isRedemption ? r.text : 'text-gray-900'}`}>{getLabel()}</p>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3 flex-shrink-0" />
              {formatDateTime(item.date)}
            </p>
            {isAdjustment && item.reason && (
              <p className="text-xs text-gray-400 italic mt-0.5 truncate">{item.reason}</p>
            )}
            {isAppointment && item.serviceNames && item.serviceNames.length > 0 && (
              <p className="text-xs text-gray-400 mt-0.5 truncate">{item.serviceNames.join(', ')}</p>
            )}
            {isAppointment && item.resultPhotos && item.resultPhotos.length > 0 && (
              <div className="flex gap-1 mt-1">
                {item.resultPhotos.map(p => (
                  <img key={p.id} src={p.url} className="w-6 h-6 rounded object-cover" alt="" />
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          {isAppointment ? (
            <span className={`text-sm font-bold px-2 py-1 rounded-lg ${r.text} ${r.bgSolid}`}>
              <Calendar className="w-3.5 h-3.5" />
            </span>
          ) : !isRedemption && !isVoucherUsed ? (
            <span className={`text-sm font-bold px-2 py-1 rounded-lg ${item.points > 0 ? `${ROLES.success.text} ${ROLES.success.bgSolid}` : `${ROLES.danger.text} ${ROLES.danger.bgSolid}`}`}>
              {item.points > 0 ? '+' : ''}{item.points}
            </span>
          ) : (
            <span className={`text-sm font-bold px-2 py-1 rounded-lg ${r.text} ${r.bgSolid}`}>
              ✓
            </span>
          )}
          {isVisit && <Pencil className="w-3 h-3 text-gray-300" />}
        </div>
      </li>
    );
  };

  return (
    <div className="space-y-3">
      {/* Filter pills */}
      <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-1 scrollbar-hide">
        {FILTER_PILLS.map(p => {
          const active = filter === p.key;
          const count = counts[p.key];
          if (p.key !== 'all' && count === 0) return null;
          return (
            <button
              key={p.key}
              onClick={() => setFilter(p.key)}
              className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                active
                  ? `${ROLES.primary.solid} text-white`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p.label}
              <span className={`ml-1 ${active ? 'text-white/80' : 'text-gray-400'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {filteredItems.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-4">{t('noResultsForFilter')}</p>
      ) : (
        <>
          {BUCKET_ORDER.filter(b => grouped[b].length > 0).map(b => (
            <div key={b}>
              <div className="flex items-center gap-2 mb-1.5 px-1">
                <span className="w-1 h-3 rounded-full bg-gray-300" />
                <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">{t(`bucket_${b}` as 'bucket_today')}</p>
              </div>
              <ul className="space-y-1.5">
                {grouped[b].map(renderItem)}
              </ul>
            </div>
          ))}
          {hasMore && (
            <button
              onClick={() => setVisibleCount(c => c * 2)}
              className={`w-full py-2 mt-1 text-xs font-semibold rounded-lg transition-colors ${ROLES.primary.bg} ${ROLES.primary.text} hover:${ROLES.primary.bgSolid}`}
            >
              {t('viewMore', { count: remainingCount })}
            </button>
          )}
        </>
      )}
    </div>
  );
}
