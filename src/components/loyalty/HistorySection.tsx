'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDateTime } from '@/lib/utils';
import type { Merchant, Visit, VisitStatus } from '@/types';

interface PointAdjustment {
  id: string;
  created_at: string;
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

interface HistorySectionProps {
  visits: VisitWithStatus[];
  adjustments: PointAdjustment[];
  redemptions: RedemptionHistory[];
  merchant: Merchant;
}

export default function HistorySection({
  visits,
  adjustments,
  redemptions,
  merchant,
}: HistorySectionProps) {
  const [expanded, setExpanded] = useState(false);

  const LoyaltyIcon = Heart;
  const hasItems = visits.length > 0 || adjustments.length > 0 || redemptions.length > 0;

  // Pre-compute sorted items
  const allItems = [
    ...visits.map((v) => ({
      type: 'visit' as const,
      date: v.visited_at,
      points: v.points_earned || 1,
      id: v.id,
      status: v.status || ('confirmed' as const),
      flagged_reason: v.flagged_reason,
      tier: undefined as number | undefined,
    })),
    ...adjustments.map((a) => ({
      type: 'adjustment' as const,
      date: a.created_at,
      points: a.adjustment,
      id: a.id,
      status: 'confirmed' as const,
      flagged_reason: null as string | null,
      tier: undefined as number | undefined,
    })),
    ...redemptions.map((r) => ({
      type: 'redemption' as const,
      date: r.redeemed_at,
      points: r.stamps_used,
      id: r.id,
      status: 'confirmed' as const,
      flagged_reason: null as string | null,
      tier: r.tier as number | undefined,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 30);

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
          Historique
        </h2>
      </div>

      {hasItems ? (
        <>
          <ul className="divide-y divide-gray-50">
            {displayItems.map((item, index) => {
              const isAdjustment = item.type === 'adjustment';
              const isRedemption = item.type === 'redemption';
              const isPending = item.status === 'pending';
              const isRejected = item.status === 'rejected';

              const getStatusIcon = () => {
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
                if (isRedemption) return item.tier === 2 ? '#ede9fe' : '#d1fae5';
                if (isAdjustment) return '#fef3c7';
                if (isPending) return '#fef3c7';
                if (isRejected) return '#fee2e2';
                return `${merchant.primary_color}10`;
              };

              const getLabel = () => {
                if (isRedemption) {
                  const tierLabel = merchant.tier2_enabled ? ` palier ${item.tier}` : '';
                  return `🎁 Cadeau${tierLabel} utilisé`;
                }
                if (isAdjustment) return 'Ajustement';
                if (isPending) return 'En attente';
                if (isRejected) return 'Refusé';
                if (merchant.loyalty_mode === 'visit') return 'Passage validé';
                return `${item.points} ${merchant.product_name || 'article'}${item.points > 1 ? 's' : ''}`;
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
                    <p className={`font-semibold text-sm truncate ${isRejected ? 'text-gray-500 line-through' : isRedemption ? 'text-emerald-700' : 'text-gray-900'}`}>
                      {getLabel()}
                    </p>
                    <p className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDateTime(item.date)}
                    </p>
                  </div>
                  {!isRedemption && (
                    <div
                      className={`px-2 py-1 rounded-lg text-xs font-bold ${
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
                      {isPending ? '⏳' : isRejected ? '❌' : item.points > 0 ? '+' : ''}{!isPending && !isRejected ? item.points : item.points}
                    </div>
                  )}
                  {isRedemption && (
                    <div className={`px-2 py-1 rounded-lg text-xs font-bold ${item.tier === 2 ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      ✓
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
                    Réduire
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    Voir tout ({allItems.length})
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
          <p className="text-gray-500 font-medium text-sm">Aucun historique</p>
        </div>
      )}
    </motion.div>
  );
}
