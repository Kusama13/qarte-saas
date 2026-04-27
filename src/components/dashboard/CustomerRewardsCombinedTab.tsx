'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Gift,
  Flower2,
  Check,
  Loader2,
  Trash2,
  ShoppingBag,
  Trophy,
  Undo2,
  Cake,
} from 'lucide-react';
import { useMerchant } from '@/contexts/MerchantContext';
import { Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { formatDateTime } from '@/lib/utils';
import type { MerchantOffer } from '@/types';
import { ROLES } from '@/lib/customer-modal-styles';
import { SectionHeader } from './customer-modal/SectionHeader';

const VOUCHER_SOURCE_ICONS: Record<string, typeof Gift> = {
  welcome: Flower2,
  birthday: Cake,
};

interface ExistingVoucher {
  id: string;
  source: string | null;
  offer_id: string | null;
  reward_description: string;
  created_at: string;
}

interface Redemption {
  id: string;
  redeemed_at: string;
  stamps_used: number;
  tier: number;
}

interface CustomerRewardsCombinedTabProps {
  loyaltyCardId: string;
  currentStamps: number;
  stampsRequired: number;
  tier2Enabled: boolean;
  tier2StampsRequired?: number;
  tier2RewardDescription?: string;
  rewardDescription?: string;
  tier1Redeemed: boolean;
  isCagnotte?: boolean;
  customerId: string;
  merchantId: string;
  onSuccess: (message: string) => void;
}

export function CustomerRewardsCombinedTab({
  loyaltyCardId,
  currentStamps,
  stampsRequired,
  tier2Enabled,
  tier2StampsRequired,
  tier2RewardDescription,
  rewardDescription,
  tier1Redeemed,
  isCagnotte = false,
  customerId,
  merchantId,
  onSuccess,
}: CustomerRewardsCombinedTabProps) {
  const tr = useTranslations('customerRewards');
  const to = useTranslations('customerOffers');
  const { merchant } = useMerchant();

  // Rewards state
  const [lastRedemption, setLastRedemption] = useState<Redemption | null>(null);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);

  // Offers state
  const [offers, setOffers] = useState<MerchantOffer[]>([]);
  const [existingVouchers, setExistingVouchers] = useState<ExistingVoucher[]>([]);
  const [granting, setGranting] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'use' | 'remove'; id: string } | null>(null);

  // Shared state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Derived from existingVouchers (no separate state needed)
  const grantedWelcome = existingVouchers.some(v => v.source === 'welcome');
  const grantedOfferIds = new Set(existingVouchers.filter(v => v.source === 'offer' && v.offer_id).map(v => v.offer_id!));

  // Reward availability
  const canRedeemTier1 = currentStamps >= stampsRequired && !tier1Redeemed;
  const canRedeemTier2 = tier2Enabled && tier2StampsRequired ? currentStamps >= tier2StampsRequired : false;
  const hasRedeemable = canRedeemTier1 || canRedeemTier2;

  const loadVouchers = async (signal?: AbortSignal): Promise<void> => {
    const res = await fetch(`/api/vouchers/grant?customer_id=${customerId}&merchant_id=${merchantId}`, { signal });
    if (!res.ok) return;
    const data = await res.json();
    const vouchers = (data.vouchers || []) as ExistingVoucher[];
    setExistingVouchers(vouchers.filter(v => v.source === 'welcome' || v.source === 'offer' || v.source === 'birthday'));
  };

  const loadLastRedemption = async (): Promise<void> => {
    const { data } = await supabase
      .from('redemptions')
      .select('id, redeemed_at, stamps_used, tier')
      .eq('loyalty_card_id', loyaltyCardId)
      .order('redeemed_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setLastRedemption(data);
  };

  useEffect(() => {
    const controller = new AbortController();
    const fetchAll = async () => {
      try {
        const [offersRes] = await Promise.all([
          fetch(`/api/merchant-offers?merchantId=${merchantId}`, { signal: controller.signal }),
          loadVouchers(controller.signal),
          loadLastRedemption(),
        ]);

        if (controller.signal.aborted) return;

        if (offersRes.ok) {
          const data = await offersRes.json();
          setOffers(data.offers || []);
        }
      } catch {
        // ignore — UI shows empty state
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchAll();
    return () => controller.abort();
  }, [customerId, merchantId, loyaltyCardId]);

  // ── Rewards handlers ──

  const handleRedeem = async (tier: 1 | 2) => {
    setRedeemLoading(true);
    setError(null);
    try {
      const endpoint = isCagnotte ? '/api/cagnotte/redeem' : '/api/redeem';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loyalty_card_id: loyaltyCardId, tier }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || tr('redeemError'));
      const label = isCagnotte ? tr('cagnotte') : tr('reward');
      loadLastRedemption();
      onSuccess(tier2Enabled ? tr('redeemSuccessTiered', { label, tier }) : tr('redeemSuccess', { label }));
    } catch (err) {
      setError(err instanceof Error ? err.message : tr('redeemError'));
    } finally {
      setRedeemLoading(false);
    }
  };

  const handleCancelReward = async () => {
    if (!cancelConfirm) {
      setError(tr('confirmCancelFirst'));
      return;
    }
    setCancelLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/rewards/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loyalty_card_id: loyaltyCardId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || tr('cancelError'));
      setCancelConfirm(false);
      loadLastRedemption();
      onSuccess(isCagnotte ? tr('cancelledCagnotte') : tr('cancelledReward'));
    } catch (err) {
      setError(err instanceof Error ? err.message : tr('cancelError'));
    } finally {
      setCancelLoading(false);
    }
  };

  const handleGrant = async (type: 'welcome' | 'offer', offerId?: string) => {
    setGranting(type === 'welcome' ? 'welcome' : offerId || '');
    setError(null);
    try {
      const res = await fetch('/api/vouchers/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: customerId, merchant_id: merchantId, type, offer_id: offerId }),
      });
      if (res.ok) {
        // Refetch to get the real voucher row (id used by handleUseVoucher/handleRemoveVoucher PATCH/DELETE).
        await loadVouchers();
        onSuccess(to('grantSuccess'));
      } else {
        const data = await res.json();
        // 'already_granted' = silent no-op (UI is in sync via loadVouchers refresh on next mount).
        if (data.error !== 'already_granted') setError(data.error || to('grantError'));
      }
    } catch {
      setError(to('grantError'));
    }
    setGranting(null);
  };

  const handleUseVoucher = async (voucherId: string) => {
    setActing(voucherId);
    setError(null);
    try {
      const res = await fetch('/api/vouchers/grant', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voucher_id: voucherId, merchant_id: merchantId }),
      });
      if (res.ok) {
        setExistingVouchers(prev => prev.filter(v => v.id !== voucherId));
        onSuccess(to('voucherUsed'));
      } else {
        setError(to('grantError'));
      }
    } catch {
      setError(to('grantError'));
    }
    setActing(null);
    setConfirmAction(null);
  };

  const handleRemoveVoucher = async (voucherId: string) => {
    setActing(voucherId);
    setError(null);
    try {
      const res = await fetch('/api/vouchers/grant', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voucher_id: voucherId, merchant_id: merchantId }),
      });
      if (res.ok) {
        setExistingVouchers(prev => prev.filter(v => v.id !== voucherId));
        onSuccess(to('voucherRemoved'));
      } else {
        setError(to('grantError'));
      }
    } catch {
      setError(to('grantError'));
    }
    setActing(null);
    setConfirmAction(null);
  };

  // ── Computed ──

  const welcomeEnabled = !!merchant?.welcome_offer_enabled;
  const hasOffers = offers.length > 0;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
      </div>
    );
  }

  const showEmptyState = !hasRedeemable && existingVouchers.length === 0 && !merchant?.welcome_offer_description && !hasOffers;

  return (
    <div className="space-y-5">
      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-50 rounded-xl">{error}</div>
      )}

      {existingVouchers.length > 0 && (
        <div>
          <SectionHeader role="success" label={tr('sectionActiveVouchers')} count={existingVouchers.length} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {existingVouchers.map((v) => {
              const isBirthday = v.source === 'birthday';
              const r = isBirthday ? ROLES.birthday : ROLES.success;
              const Icon = (v.source && VOUCHER_SOURCE_ICONS[v.source]) || Gift;
              return (
                <div key={v.id} className={`p-3 rounded-xl border ${r.border} ${r.bg}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${r.bgSolid}`}>
                      <Icon className={`w-5 h-5 ${r.icon}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{v.reward_description}</p>
                      <p className="text-[11px] text-gray-400">{v.source === 'welcome' ? to('welcomeOffer') : v.source === 'birthday' ? to('birthdayGift') : to('promoOffer')}</p>
                    </div>
                  </div>

                  {confirmAction?.id === v.id && confirmAction.type === 'remove' ? (
                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="danger"
                        size="sm"
                        className="flex-1"
                        loading={acting === v.id}
                        onClick={() => handleRemoveVoucher(v.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                        {to('confirmRemove')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setConfirmAction(null)}
                      >
                        {to('cancel')}
                      </Button>
                    </div>
                  ) : confirmAction?.id === v.id && confirmAction.type === 'use' ? (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-medium text-emerald-700">{to('confirmUseQuestion')}</p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className={`flex-1 ${ROLES.success.solid} focus:ring-emerald-500`}
                          loading={acting === v.id}
                          onClick={() => handleUseVoucher(v.id)}
                        >
                          <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />
                          {to('confirmUse')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setConfirmAction(null)}
                        >
                          {to('cancel')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        className={`flex-1 ${ROLES.success.solid} focus:ring-emerald-500`}
                        onClick={() => setConfirmAction({ type: 'use', id: v.id })}
                      >
                        <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />
                        {to('useVoucher')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`${ROLES.danger.icon} ${ROLES.danger.border} ${ROLES.danger.hoverBg}`}
                        onClick={() => setConfirmAction({ type: 'remove', id: v.id })}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {hasRedeemable ? (
        <div>
          <SectionHeader role="success" label={tr('sectionRewards')} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
            {canRedeemTier1 && (
              <div className={`p-3 rounded-xl border ${ROLES.success.border} ${ROLES.success.bg}`}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Gift className={`w-3.5 h-3.5 ${ROLES.success.icon}`} />
                  <span className="text-sm font-semibold text-gray-900">
                    {tier2Enabled ? tr('tier1') : (isCagnotte ? tr('cagnotte') : tr('reward'))}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-2.5">{rewardDescription || (isCagnotte ? tr('cagnotteLoyalty') : tr('rewardLoyalty'))}</p>
                <Button
                  onClick={() => handleRedeem(1)}
                  loading={redeemLoading}
                  className={`w-full ${ROLES.success.solid} text-sm`}
                >
                  <Gift className="w-4 h-4 mr-1.5" />
                  {isCagnotte ? tr('redeemCagnotte') : tr('redeemReward')}
                </Button>
              </div>
            )}

            {canRedeemTier2 && (
              <div className={`p-3 rounded-xl border ${ROLES.premium.border} ${ROLES.premium.bg}`}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Trophy className={`w-3.5 h-3.5 ${ROLES.premium.icon}`} />
                  <span className="text-sm font-semibold text-gray-900">{tr('tier2')}</span>
                </div>
                <p className="text-xs text-gray-500 mb-2.5">{tier2RewardDescription || (isCagnotte ? tr('cagnotteTier2') : tr('rewardTier2'))}</p>
                <Button
                  onClick={() => handleRedeem(2)}
                  loading={redeemLoading}
                  className={`w-full ${ROLES.premium.solid} text-sm`}
                >
                  <Trophy className="w-4 h-4 mr-1.5" />
                  {isCagnotte ? tr('redeemCagnotteTier2') : tr('redeemRewardTier2')}
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : showEmptyState ? (
        <div className="text-center py-4">
          <Gift className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">{isCagnotte ? tr('noCagnotte') : tr('noReward')}</p>
        </div>
      ) : null}

      {(merchant?.welcome_offer_description || hasOffers) && (
        <div>
          <SectionHeader role="primary" label={tr('sectionGrant')} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {merchant?.welcome_offer_description && (
              <div className={`p-3 rounded-xl border ${welcomeEnabled ? `${ROLES.primary.border} ${ROLES.primary.bg}` : 'border-gray-100 bg-gray-50/50 opacity-60'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${welcomeEnabled ? ROLES.primary.bgSolid : 'bg-gray-200'}`}>
                    <Flower2 className={`w-5 h-5 ${welcomeEnabled ? ROLES.primary.icon : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${welcomeEnabled ? ROLES.primary.text : 'text-gray-400'}`}>{to('welcomeOffer')}</p>
                    <p className={`text-sm ${welcomeEnabled ? 'text-gray-700' : 'text-gray-400'}`}>{merchant.welcome_offer_description}</p>
                  </div>
                </div>
                {welcomeEnabled ? (
                  <div className="mt-3">
                    <Button
                      size="sm"
                      className={`w-full ${
                        grantedWelcome || currentStamps > 0
                          ? 'bg-gray-50 text-gray-400 hover:bg-gray-50 cursor-default'
                          : `${ROLES.primary.solid} focus:ring-indigo-500`
                      }`}
                      disabled={grantedWelcome || currentStamps > 0}
                      loading={granting === 'welcome'}
                      onClick={() => handleGrant('welcome')}
                    >
                      {grantedWelcome ? (
                        <><Check className="w-4 h-4 mr-1.5" />{to('alreadyGranted')}</>
                      ) : currentStamps > 0 ? (
                        to('notNewClient')
                      ) : (
                        to('grantWelcome')
                      )}
                    </Button>
                  </div>
                ) : (
                  <p className="mt-3 text-center text-[11px] text-gray-400">{to('disabledHint')}</p>
                )}
              </div>
            )}

            {offers.map((offer) => {
              const granted = grantedOfferIds.has(offer.id);
              const isActive = offer.active && (!offer.expires_at || new Date(offer.expires_at) > new Date());

              return (
                <div key={offer.id} className={`p-3 rounded-xl border ${isActive ? `${ROLES.primary.border} ${ROLES.primary.bg}` : 'border-gray-100 bg-gray-50/50 opacity-60'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isActive ? ROLES.primary.bgSolid : 'bg-gray-200'}`}>
                      <Gift className={`w-5 h-5 ${isActive ? ROLES.primary.icon : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>{offer.title}</p>
                      <p className={`text-xs mt-0.5 ${isActive ? 'text-gray-500' : 'text-gray-400'}`}>{offer.description}</p>
                    </div>
                  </div>
                  {isActive ? (
                    <div className="mt-3">
                      <Button
                        size="sm"
                        className={`w-full ${
                          granted
                            ? `${ROLES.success.bg} ${ROLES.success.text} ${ROLES.success.hoverBg} cursor-default`
                            : `${ROLES.primary.solid} focus:ring-indigo-500`
                        }`}
                        disabled={granted}
                        loading={granting === offer.id}
                        onClick={() => handleGrant('offer', offer.id)}
                      >
                        {granted ? (
                          <><Check className="w-4 h-4 mr-1.5" />{to('alreadyGranted')}</>
                        ) : (
                          to('grantOffer')
                        )}
                      </Button>
                    </div>
                  ) : (
                    <p className="mt-3 text-center text-[11px] text-gray-400">{to('disabledHint')}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {lastRedemption && (
        <div className="border-t border-gray-100 pt-4">
          <SectionHeader role="warning" label={isCagnotte ? tr('lastCagnotte') : tr('lastReward')} />
          <div className={`p-2.5 rounded-xl ${ROLES.warning.bg} border ${ROLES.warning.border}`}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                {lastRedemption.tier === 2 ? (
                  <Trophy className={`w-4 h-4 ${ROLES.premium.icon}`} />
                ) : (
                  <Gift className={`w-4 h-4 ${ROLES.success.icon}`} />
                )}
                <span className="text-sm font-medium text-gray-900">
                  {tier2Enabled ? `${lastRedemption.tier === 2 ? tr('tier2') : tr('tier1')}` : (isCagnotte ? tr('cagnotte') : tr('reward'))}
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
                className={`w-4 h-4 rounded ${ROLES.warning.border} ${ROLES.warning.icon} focus:ring-amber-500`}
              />
              <span className={`text-xs ${ROLES.warning.text}`}>
                {tr('confirmCancel')}
              </span>
            </label>

            <Button
              onClick={handleCancelReward}
              loading={cancelLoading}
              disabled={!cancelConfirm}
              variant="outline"
              className={`w-full text-sm ${ROLES.warning.border} ${ROLES.warning.text} ${ROLES.warning.hoverBgSolid}`}
            >
              <Undo2 className="w-4 h-4 mr-1.5" />
              {isCagnotte ? tr('cancelCagnotte') : tr('cancelReward')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
