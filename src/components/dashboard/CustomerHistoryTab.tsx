'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Loader2,
  Check,
  Clock,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  History,
  Gift,
  Trophy,
  Pencil,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDateTime, formatCurrency } from '@/lib/utils';

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

export interface CustomerHistoryTabProps {
  loyaltyCardId: string;
  merchantId: string;
  tier2Enabled: boolean;
  isCagnotte?: boolean;
  country?: string;
}

export function CustomerHistoryTab({
  loyaltyCardId,
  merchantId,
  tier2Enabled,
  isCagnotte = false,
  country,
}: CustomerHistoryTabProps) {
  const t = useTranslations('customerHistory');
  const [visits, setVisits] = useState<Visit[]>([]);
  const [adjustments, setAdjustments] = useState<PointAdjustment[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(true);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPoints, setEditPoints] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [loyaltyCardId]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const [visitsResult, adjustmentsResult, redemptionsResult] = await Promise.all([
        supabase
          .from('visits')
          .select('id, visited_at, points_earned, amount_spent')
          .eq('loyalty_card_id', loyaltyCardId)
          .order('visited_at', { ascending: false })
          .limit(50),
        supabase
          .from('point_adjustments')
          .select('id, adjusted_at, adjustment, reason')
          .eq('loyalty_card_id', loyaltyCardId)
          .order('adjusted_at', { ascending: false })
          .limit(50),
        supabase
          .from('redemptions')
          .select('id, redeemed_at, stamps_used, tier')
          .eq('loyalty_card_id', loyaltyCardId)
          .order('redeemed_at', { ascending: false })
          .limit(50),
      ]);

      setVisits(visitsResult.data || []);
      setAdjustments(adjustmentsResult.data || []);
      setRedemptions(redemptionsResult.data || []);
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

      if (isCagnotte) {
        payload.new_amount = Math.max(0, parseFloat(editAmount.replace(',', '.')) || 0);
      }

      const res = await fetch('/api/visits/edit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        cancelEdit();
        fetchHistory();
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  // Combine and sort history items
  const historyItems = [
    ...visits.map((v) => ({ type: 'visit' as const, date: v.visited_at, points: v.points_earned, id: v.id, tier: undefined as number | undefined, reason: undefined as string | null | undefined, amount_spent: v.amount_spent })),
    ...adjustments.map((a) => ({
      type: 'adjustment' as const,
      date: a.adjusted_at,
      points: a.adjustment,
      reason: a.reason,
      id: a.id,
      tier: undefined as number | undefined,
      amount_spent: null as number | null,
    })),
    ...redemptions.map((r) => ({
      type: 'redemption' as const,
      date: r.redeemed_at,
      points: r.stamps_used,
      id: r.id,
      tier: r.tier,
      reason: undefined as string | null | undefined,
      amount_spent: null as number | null,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-3">
      {historyLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
        </div>
      ) : historyItems.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <History className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">{t('noHistory')}</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {historyItems.length > 1 ? t('entriesPlural', { count: historyItems.length }) : t('entries', { count: historyItems.length })}
            </p>
            <button
              onClick={() => setHistoryExpanded(!historyExpanded)}
              className="text-sm text-indigo-600 flex items-center gap-1"
            >
              {historyExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {historyExpanded ? t('collapse') : t('viewAll')}
            </button>
          </div>

          <ul className="space-y-1.5">
            {(historyExpanded ? historyItems : historyItems.slice(0, 5)).map((item) => {
              const isRedemption = item.type === 'redemption';
              const isAdjustment = item.type === 'adjustment';

              const getBgColor = () => {
                if (isRedemption) return item.tier === 2 ? 'bg-violet-50' : 'bg-emerald-50';
                if (isAdjustment) return 'bg-amber-50';
                return 'bg-indigo-50';
              };

              const getIconBgColor = () => {
                if (isRedemption) return item.tier === 2 ? 'bg-violet-100' : 'bg-emerald-100';
                if (isAdjustment) return 'bg-amber-100';
                return 'bg-indigo-100';
              };

              const getIcon = () => {
                if (isRedemption) {
                  return item.tier === 2
                    ? <Trophy className="w-4 h-4 text-violet-600" />
                    : <Gift className="w-4 h-4 text-emerald-600" />;
                }
                if (isAdjustment) return <SlidersHorizontal className="w-4 h-4 text-amber-600" />;
                return <Check className="w-4 h-4 text-indigo-600" />;
              };

              const getLabel = () => {
                if (isRedemption) {
                  if (tier2Enabled) {
                    return isCagnotte
                      ? t('cagnotteTierUsed', { tier: item.tier })
                      : t('giftTierUsed', { tier: item.tier });
                  }
                  return isCagnotte ? t('cagnotteUsed') : t('giftUsed');
                }
                if (isAdjustment) return t('manualAdjust');
                if (isCagnotte && item.amount_spent != null && item.amount_spent > 0) {
                  return `${t('visit')} · ${formatCurrency(Number(item.amount_spent), country)}`;
                }
                return t('visit');
              };

              const isVisit = item.type === 'visit';
              const isEditing = editingId === item.id;

              if (isVisit && isEditing) {
                return (
                  <li key={item.id} className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-200 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${getIconBgColor()}`}>
                        {getIcon()}
                      </div>
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
                  className={`flex items-center justify-between p-2 rounded-lg ${getBgColor()} ${isVisit ? 'cursor-pointer hover:ring-1 hover:ring-indigo-200 transition-shadow' : ''}`}
                  onClick={isVisit ? () => startEdit(item) : undefined}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${getIconBgColor()}`}>
                      {getIcon()}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${isRedemption ? 'text-emerald-700' : 'text-gray-900'}`}>
                        {getLabel()}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        {formatDateTime(item.date)}
                      </p>
                      {isAdjustment && item.reason && (
                        <p className="text-xs text-gray-400 italic mt-0.5 truncate">{item.reason}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    {!isRedemption ? (
                      <span
                        className={`text-sm font-bold px-2 py-1 rounded-lg ${
                          item.points > 0
                            ? 'text-green-700 bg-green-100'
                            : 'text-red-700 bg-red-100'
                        }`}
                      >
                        {item.points > 0 ? '+' : ''}
                        {item.points}
                      </span>
                    ) : (
                      <span className={`text-sm font-bold px-2 py-1 rounded-lg ${item.tier === 2 ? 'text-violet-700 bg-violet-100' : 'text-emerald-700 bg-emerald-100'}`}>
                        ✓
                      </span>
                    )}
                    {isVisit && (
                      <Pencil className="w-3 h-3 text-gray-300" />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
