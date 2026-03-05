'use client';

import { useState, useEffect } from 'react';
import {
  Loader2,
  Check,
  Gift,
  Trophy,
  Undo2,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { formatDateTime } from '@/lib/utils';

interface Redemption {
  id: string;
  redeemed_at: string;
  stamps_used: number;
  tier: number;
}

export interface CustomerRewardsTabProps {
  loyaltyCardId: string;
  currentStamps: number;
  stampsRequired: number;
  tier2Enabled: boolean;
  tier2StampsRequired?: number;
  tier2RewardDescription?: string;
  rewardDescription?: string;
  tier1Redeemed: boolean;
  onSuccess: (message: string) => void;
  isCagnotte?: boolean;
}

export function CustomerRewardsTab({
  loyaltyCardId,
  currentStamps,
  stampsRequired,
  tier2Enabled,
  tier2StampsRequired,
  tier2RewardDescription,
  rewardDescription,
  tier1Redeemed,
  onSuccess,
  isCagnotte = false,
}: CustomerRewardsTabProps) {
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [lastRedemption, setLastRedemption] = useState<Redemption | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reward availability
  const canRedeemTier1 = currentStamps >= stampsRequired && !tier1Redeemed;
  const canRedeemTier2 = tier2Enabled && tier2StampsRequired ? currentStamps >= tier2StampsRequired : false;
  const hasRedeemable = canRedeemTier1 || canRedeemTier2;

  useEffect(() => {
    fetchLastRedemption();
  }, [loyaltyCardId]);

  const fetchLastRedemption = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('redemptions')
        .select('id, redeemed_at, stamps_used, tier')
        .eq('loyalty_card_id', loyaltyCardId)
        .order('redeemed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setLastRedemption(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (tier: 1 | 2) => {
    setRedeemLoading(true);
    setError('');

    try {
      const endpoint = isCagnotte ? '/api/cagnotte/redeem' : '/api/redeem';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loyalty_card_id: loyaltyCardId,
          tier,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la validation');
      }

      const label = isCagnotte ? 'Cagnotte' : 'Récompense';
      onSuccess(tier2Enabled ? `${label} palier ${tier} validée !` : `${label} validée !`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la validation');
    } finally {
      setRedeemLoading(false);
    }
  };

  const handleCancelReward = async () => {
    if (!cancelConfirm) {
      setError('Veuillez confirmer l\'annulation');
      return;
    }

    setCancelLoading(true);
    setError('');

    try {
      const response = await fetch('/api/rewards/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loyalty_card_id: loyaltyCardId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'annulation');
      }

      onSuccess(isCagnotte ? 'Cagnotte annulée !' : 'Récompense annulée !');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'annulation');
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="space-y-3.5">
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
        </div>
      ) : (
        <>
          {/* Redeem buttons — only when a tier is ready */}
          {hasRedeemable ? (
            <div className="space-y-2.5">
              {canRedeemTier1 && (
                <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Gift className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-sm font-semibold text-gray-900">
                      {tier2Enabled ? 'Palier 1' : (isCagnotte ? 'Cagnotte' : 'Récompense')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2.5">{rewardDescription || (isCagnotte ? 'Cagnotte fidélité' : 'Récompense fidélité')}</p>
                  <Button
                    onClick={() => handleRedeem(1)}
                    loading={redeemLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-sm"
                  >
                    <Gift className="w-4 h-4 mr-1.5" />
                    {isCagnotte ? 'Valider la cagnotte' : 'Valider la récompense'}
                  </Button>
                </div>
              )}

              {canRedeemTier2 && (
                <div className="p-3 rounded-xl border border-violet-200 bg-violet-50">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Trophy className="w-3.5 h-3.5 text-violet-600" />
                    <span className="text-sm font-semibold text-gray-900">Palier 2</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2.5">{tier2RewardDescription || (isCagnotte ? 'Cagnotte palier 2' : 'Récompense palier 2')}</p>
                  <Button
                    onClick={() => handleRedeem(2)}
                    loading={redeemLoading}
                    className="w-full bg-violet-600 hover:bg-violet-700 text-sm"
                  >
                    <Trophy className="w-4 h-4 mr-1.5" />
                    {isCagnotte ? 'Valider la cagnotte palier 2' : 'Valider la récompense palier 2'}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <Gift className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">{isCagnotte ? 'Aucune cagnotte à valider' : 'Aucune récompense à valider'}</p>
            </div>
          )}

          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-50 rounded-xl">
              {error}
            </div>
          )}

          {/* Cancel last reward */}
          {lastRedemption && (
            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {isCagnotte ? 'Dernière cagnotte' : 'Dernière récompense'}
              </p>
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {lastRedemption.tier === 2 ? (
                      <Trophy className="w-4 h-4 text-violet-600" />
                    ) : (
                      <Gift className="w-4 h-4 text-emerald-600" />
                    )}
                    <span className="text-sm font-medium text-gray-900">
                      {tier2Enabled ? `Palier ${lastRedemption.tier}` : (isCagnotte ? 'Cagnotte' : 'Récompense')}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDateTime(lastRedemption.redeemed_at)}
                  </span>
                </div>

                <label className="flex items-center gap-2 mb-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cancelConfirm}
                    onChange={(e) => setCancelConfirm(e.target.checked)}
                    className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-xs text-amber-700">
                    Confirmer l&apos;annulation
                  </span>
                </label>

                <Button
                  onClick={handleCancelReward}
                  loading={cancelLoading}
                  disabled={!cancelConfirm}
                  variant="outline"
                  className="w-full text-sm border-amber-200 text-amber-700 hover:bg-amber-100"
                >
                  <Undo2 className="w-4 h-4 mr-1.5" />
                  {isCagnotte ? 'Annuler cette cagnotte' : 'Annuler cette récompense'}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
