'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDateTime } from '@/lib/utils';

interface Visit {
  id: string;
  visited_at: string;
  points_earned: number;
}

interface PointAdjustment {
  id: string;
  created_at: string;
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
  tier2Enabled: boolean;
}

export function CustomerHistoryTab({
  loyaltyCardId,
  tier2Enabled,
}: CustomerHistoryTabProps) {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [adjustments, setAdjustments] = useState<PointAdjustment[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [loyaltyCardId]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const [visitsResult, adjustmentsResult, redemptionsResult] = await Promise.all([
        supabase
          .from('visits')
          .select('id, visited_at, points_earned')
          .eq('loyalty_card_id', loyaltyCardId)
          .order('visited_at', { ascending: false })
          .limit(50),
        supabase
          .from('point_adjustments')
          .select('id, created_at, adjustment, reason')
          .eq('loyalty_card_id', loyaltyCardId)
          .order('created_at', { ascending: false })
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

  // Combine and sort history items
  const historyItems = [
    ...visits.map((v) => ({ type: 'visit' as const, date: v.visited_at, points: v.points_earned, id: v.id, tier: undefined as number | undefined, reason: undefined as string | null | undefined })),
    ...adjustments.map((a) => ({
      type: 'adjustment' as const,
      date: a.created_at,
      points: a.adjustment,
      reason: a.reason,
      id: a.id,
      tier: undefined as number | undefined,
    })),
    ...redemptions.map((r) => ({
      type: 'redemption' as const,
      date: r.redeemed_at,
      points: r.stamps_used,
      id: r.id,
      tier: r.tier,
      reason: undefined as string | null | undefined,
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
          <p className="text-sm">Aucun historique</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {historyItems.length} entree{historyItems.length > 1 ? 's' : ''}
            </p>
            <button
              onClick={() => setHistoryExpanded(!historyExpanded)}
              className="text-sm text-indigo-600 flex items-center gap-1"
            >
              {historyExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {historyExpanded ? 'Reduire' : 'Voir tout'}
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
                  const tierLabel = tier2Enabled ? ` palier ${item.tier}` : '';
                  return `Cadeau${tierLabel} utilise`;
                }
                if (isAdjustment) return 'Ajustement manuel';
                return 'Passage';
              };

              return (
                <li
                  key={item.id}
                  className={`flex items-center justify-between p-2 rounded-lg ${getBgColor()}`}
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
                  {!isRedemption ? (
                    <span
                      className={`text-sm font-bold px-2 py-1 rounded-lg flex-shrink-0 ml-2 ${
                        item.points > 0
                          ? 'text-green-700 bg-green-100'
                          : 'text-red-700 bg-red-100'
                      }`}
                    >
                      {item.points > 0 ? '+' : ''}
                      {item.points}
                    </span>
                  ) : (
                    <span className={`text-sm font-bold px-2 py-1 rounded-lg flex-shrink-0 ml-2 ${item.tier === 2 ? 'text-violet-700 bg-violet-100' : 'text-emerald-700 bg-emerald-100'}`}>
                      ✓
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
