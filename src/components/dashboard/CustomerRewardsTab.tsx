'use client';

import { useState, useEffect } from 'react';
import {
  Loader2,
  Check,
  Gift,
  Trophy,
  Cake,
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

interface ActiveVoucher {
  id: string;
  reward_description: string;
  expires_at: string;
  source: string;
  is_used: boolean;
  created_at: string;
}

const MONTHS_SHORT = ['janv.','fev.','mars','avr.','mai','juin','juil.','aout','sept.','oct.','nov.','dec.'];

export interface CustomerRewardsTabProps {
  loyaltyCardId: string;
  merchantId: string;
  currentStamps: number;
  stampsRequired: number;
  tier2Enabled: boolean;
  tier2StampsRequired?: number;
  tier2RewardDescription?: string;
  rewardDescription?: string;
  tier1Redeemed: boolean;
  birthMonth?: number | null;
  birthDay?: number | null;
  onSuccess: (message: string) => void;
}

export function CustomerRewardsTab({
  loyaltyCardId,
  merchantId,
  currentStamps,
  stampsRequired,
  tier2Enabled,
  tier2StampsRequired,
  tier2RewardDescription,
  rewardDescription,
  tier1Redeemed,
  birthMonth,
  birthDay,
  onSuccess,
}: CustomerRewardsTabProps) {
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [lastRedemption, setLastRedemption] = useState<Redemption | null>(null);
  const [rewardsLoading, setRewardsLoading] = useState(false);
  const [activeVoucher, setActiveVoucher] = useState<ActiveVoucher | null>(null);
  const [birthdayGiftEnabled, setBirthdayGiftEnabled] = useState(false);
  const [birthdayGiftDescription, setBirthdayGiftDescription] = useState('');
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [error, setError] = useState('');

  // Reward availability
  const isTier1Ready = currentStamps >= stampsRequired;
  const isTier2Ready = tier2Enabled && tier2StampsRequired ? currentStamps >= tier2StampsRequired : false;
  const canRedeemTier1 = isTier1Ready && !tier1Redeemed;
  const canRedeemTier2 = isTier2Ready;

  useEffect(() => {
    fetchRewardsData();
  }, [loyaltyCardId]);

  const fetchRewardsData = async () => {
    setRewardsLoading(true);
    try {
      const [redemptionResult, voucherResult, merchantResult] = await Promise.all([
        supabase
          .from('redemptions')
          .select('id, redeemed_at, stamps_used, tier')
          .eq('loyalty_card_id', loyaltyCardId)
          .order('redeemed_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('vouchers')
          .select('id, reward_description, expires_at, source, is_used, created_at')
          .eq('loyalty_card_id', loyaltyCardId)
          .eq('source', 'birthday')
          .eq('is_used', false)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('merchants')
          .select('birthday_gift_enabled, birthday_gift_description')
          .eq('id', merchantId)
          .single(),
      ]);
      setLastRedemption(redemptionResult.data);
      setActiveVoucher(voucherResult.data);
      if (merchantResult.data) {
        setBirthdayGiftEnabled(merchantResult.data.birthday_gift_enabled || false);
        setBirthdayGiftDescription(merchantResult.data.birthday_gift_description || '');
      }
    } catch {
      // ignore
    } finally {
      setRewardsLoading(false);
    }
  };

  const handleRedeem = async (tier: 1 | 2) => {
    setRedeemLoading(true);
    setError('');

    try {
      const response = await fetch('/api/redeem', {
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

      onSuccess(`Recompense palier ${tier} validee !`);
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

      onSuccess('Recompense annulee !');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'annulation');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleCreateBirthdayVoucher = async () => {
    setVoucherLoading(true);
    setError('');

    try {
      const response = await fetch('/api/vouchers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loyalty_card_id: loyaltyCardId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la creation');
      }

      onSuccess('Cadeau anniversaire offert !');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la creation');
    } finally {
      setVoucherLoading(false);
    }
  };

  return (
    <div className="space-y-3.5">
      {rewardsLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
        </div>
      ) : (
        <>
          {/* Tier status cards */}
          <div className="space-y-2.5">
            {/* Tier 1 */}
            <div className={`p-3 rounded-xl border ${
              canRedeemTier1 ? 'border-emerald-200 bg-emerald-50' :
              tier1Redeemed ? 'border-gray-200 bg-gray-50' :
              'border-gray-100 bg-gray-50'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Gift className={`w-3.5 h-3.5 ${canRedeemTier1 ? 'text-emerald-600' : tier1Redeemed ? 'text-gray-400' : 'text-indigo-500'}`} />
                  <span className="text-sm font-semibold text-gray-900">
                    {tier2Enabled ? 'Palier 1' : 'Recompense'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {Math.min(currentStamps, stampsRequired)}/{stampsRequired}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-1.5">{rewardDescription || 'Recompense fidelite'}</p>

              {/* Progress bar */}
              <div className="h-1 bg-gray-200 rounded-full overflow-hidden mb-2.5">
                <div
                  className={`h-full rounded-full transition-all ${
                    isTier1Ready ? 'bg-emerald-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${Math.min((currentStamps / stampsRequired) * 100, 100)}%` }}
                />
              </div>

              {/* Status + action */}
              {canRedeemTier1 ? (
                <Button
                  onClick={() => handleRedeem(1)}
                  loading={redeemLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-sm"
                >
                  <Gift className="w-4 h-4 mr-1.5" />
                  Valider la recompense
                </Button>
              ) : tier1Redeemed ? (
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Check className="w-4 h-4 text-gray-400" />
                  <span>Deja utilisee dans ce cycle</span>
                </div>
              ) : (
                <div className="text-sm text-gray-400">
                  Encore {stampsRequired - currentStamps} passage{stampsRequired - currentStamps > 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* Tier 2 (if enabled) */}
            {tier2Enabled && tier2StampsRequired && (
              <div className={`p-3 rounded-xl border ${
                canRedeemTier2 ? 'border-violet-200 bg-violet-50' : 'border-gray-100 bg-gray-50'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Trophy className={`w-3.5 h-3.5 ${canRedeemTier2 ? 'text-violet-600' : 'text-gray-400'}`} />
                    <span className="text-sm font-semibold text-gray-900">Palier 2</span>
                    <span className="text-xs text-gray-400">
                      {Math.max(0, Math.min(currentStamps - stampsRequired, tier2StampsRequired - stampsRequired))}/{tier2StampsRequired - stampsRequired}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-1.5">{tier2RewardDescription || 'Recompense palier 2'}</p>

                <div className="h-1 bg-gray-200 rounded-full overflow-hidden mb-2.5">
                  <div
                    className={`h-full rounded-full transition-all ${
                      canRedeemTier2 ? 'bg-violet-500' : 'bg-gray-300'
                    }`}
                    style={{ width: `${Math.min(Math.max(0, (currentStamps - stampsRequired) / (tier2StampsRequired - stampsRequired)) * 100, 100)}%` }}
                  />
                </div>

                {canRedeemTier2 ? (
                  <Button
                    onClick={() => handleRedeem(2)}
                    loading={redeemLoading}
                    className="w-full bg-violet-600 hover:bg-violet-700 text-sm"
                  >
                    <Trophy className="w-4 h-4 mr-1.5" />
                    Valider la recompense palier 2
                  </Button>
                ) : (
                  <div className="text-sm text-gray-400">
                    Encore {tier2StampsRequired - currentStamps} passage{tier2StampsRequired - currentStamps > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-50 rounded-xl">
              {error}
            </div>
          )}

          {/* Cancel last reward */}
          {lastRedemption && (
            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Derniere recompense
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
                      {tier2Enabled ? `Palier ${lastRedemption.tier}` : 'Recompense'}
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
                  Annuler cette recompense
                </Button>
              </div>
            </div>
          )}

          {/* Birthday voucher section — only show when actionable */}
          {birthdayGiftEnabled && (activeVoucher || (birthMonth && birthDay)) && (
            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Cadeau anniversaire
              </p>
              {activeVoucher ? (
                <div className="p-2.5 rounded-xl bg-pink-50 border border-pink-100">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Cake className="w-4 h-4 text-pink-500" />
                    <span className="text-sm font-medium text-gray-900">
                      {activeVoucher.reward_description}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Expire le {formatDateTime(activeVoucher.expires_at).split(' a ')[0]}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-pink-600 font-medium">
                    <Check className="w-3.5 h-3.5" />
                    Cadeau actif — en attente d&apos;utilisation
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Cake className="w-3.5 h-3.5 text-pink-400" />
                    <span className="text-sm text-gray-600">
                      {birthdayGiftDescription || 'Cadeau anniversaire'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">
                    Anniversaire : {birthDay} {MONTHS_SHORT[(birthMonth || 1) - 1]} — Aucun cadeau actif
                  </p>
                  <Button
                    onClick={handleCreateBirthdayVoucher}
                    loading={voucherLoading}
                    variant="outline"
                    className="w-full text-sm border-pink-200 text-pink-700 hover:bg-pink-50"
                  >
                    <Cake className="w-4 h-4 mr-1.5" />
                    Offrir le cadeau anniversaire
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
