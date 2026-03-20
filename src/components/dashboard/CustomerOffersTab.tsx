'use client';

import { useState, useEffect } from 'react';
import { Gift, Sparkles, Check, Loader2, Trash2, ShoppingBag } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMerchant } from '@/contexts/MerchantContext';
import { Button } from '@/components/ui';
import type { MerchantOffer } from '@/types';

interface ExistingVoucher {
  id: string;
  source: string | null;
  offer_id: string | null;
  reward_description: string;
  created_at: string;
}

interface CustomerOffersTabProps {
  customerId: string;
  merchantId: string;
  onSuccess: (message: string) => void;
}

export function CustomerOffersTab({ customerId, merchantId, onSuccess }: CustomerOffersTabProps) {
  const t = useTranslations('customerOffers');
  const { merchant } = useMerchant();

  const [offers, setOffers] = useState<MerchantOffer[]>([]);
  const [grantedWelcome, setGrantedWelcome] = useState(false);
  const [grantedOfferIds, setGrantedOfferIds] = useState<Set<string>>(new Set());
  const [existingVouchers, setExistingVouchers] = useState<ExistingVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [granting, setGranting] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [offersRes, vouchersRes] = await Promise.all([
        fetch(`/api/merchant-offers?merchantId=${merchantId}`),
        fetch(`/api/vouchers/grant?customer_id=${customerId}&merchant_id=${merchantId}`),
      ]);

      if (offersRes.ok) {
        const data = await offersRes.json();
        setOffers(data.offers || []);
      }

      if (vouchersRes.ok) {
        const data = await vouchersRes.json();
        const vouchers = (data.vouchers || []) as ExistingVoucher[];
        setExistingVouchers(vouchers.filter(v => v.source === 'welcome' || v.source === 'offer'));
        setGrantedWelcome(vouchers.some(v => v.source === 'welcome'));
        const offerIds = new Set<string>();
        for (const v of vouchers) {
          if (v.source === 'offer' && v.offer_id) offerIds.add(v.offer_id);
        }
        setGrantedOfferIds(offerIds);
      }

      setLoading(false);
    };

    fetchData();
  }, [customerId, merchantId]);

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
        if (type === 'welcome') setGrantedWelcome(true);
        else if (offerId) setGrantedOfferIds(prev => new Set(prev).add(offerId));
        onSuccess(t('grantSuccess'));
      } else {
        const data = await res.json();
        if (data.error === 'already_granted') {
          if (type === 'welcome') setGrantedWelcome(true);
          else if (offerId) setGrantedOfferIds(prev => new Set(prev).add(offerId));
        } else {
          setError(data.error || t('grantError'));
        }
      }
    } catch {
      setError(t('grantError'));
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
        onSuccess(t('voucherUsed'));
      } else {
        setError(t('grantError'));
      }
    } catch {
      setError(t('grantError'));
    }
    setActing(null);
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
        const removed = existingVouchers.find(v => v.id === voucherId);
        setExistingVouchers(prev => prev.filter(v => v.id !== voucherId));
        if (removed?.source === 'welcome') setGrantedWelcome(false);
        if (removed?.source === 'offer' && removed.offer_id) {
          setGrantedOfferIds(prev => { const s = new Set(prev); s.delete(removed.offer_id!); return s; });
        }
        onSuccess(t('voucherRemoved'));
      } else {
        setError(t('grantError'));
      }
    } catch {
      setError(t('grantError'));
    }
    setActing(null);
    setConfirmRemoveId(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
      </div>
    );
  }

  const welcomeEnabled = !!merchant?.welcome_offer_enabled;
  const hasOffers = offers.length > 0;

  if (!merchant?.welcome_offer_description && !hasOffers && existingVouchers.length === 0) {
    return (
      <div className="text-center py-12">
        <Gift className="w-8 h-8 text-gray-200 mx-auto mb-3" />
        <p className="text-sm text-gray-400">{t('noOffers')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Error banner */}
      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-50 rounded-xl">{error}</div>
      )}

      {/* Existing unused vouchers */}
      {existingVouchers.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('activeVouchers')}</p>
          <div className="space-y-2">
            {existingVouchers.map((v) => (
              <div key={v.id} className="p-3 sm:p-4 rounded-xl border border-emerald-100 bg-emerald-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                    {v.source === 'welcome' ? <Sparkles className="w-5 h-5 text-emerald-600" /> : <Gift className="w-5 h-5 text-emerald-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{v.reward_description}</p>
                    <p className="text-[11px] text-gray-400">{v.source === 'welcome' ? t('welcomeOffer') : t('promoOffer')}</p>
                  </div>
                </div>

                {/* Actions */}
                {confirmRemoveId === v.id ? (
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="danger"
                      size="sm"
                      className="flex-1"
                      loading={acting === v.id}
                      onClick={() => handleRemoveVoucher(v.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                      {t('confirmRemove')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setConfirmRemoveId(null)}
                    >
                      {t('cancel')}
                    </Button>
                  </div>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
                      loading={acting === v.id}
                      onClick={() => handleUseVoucher(v.id)}
                    >
                      <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />
                      {t('useVoucher')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 border-red-200 hover:bg-red-50"
                      onClick={() => setConfirmRemoveId(v.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Welcome offer */}
      {merchant?.welcome_offer_description && (
        <div className={`p-3 sm:p-4 rounded-xl border ${welcomeEnabled ? 'border-violet-100 bg-violet-50/50' : 'border-gray-100 bg-gray-50/50 opacity-60'}`}>
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${welcomeEnabled ? 'bg-violet-100' : 'bg-gray-200'}`}>
              <Sparkles className={`w-5 h-5 ${welcomeEnabled ? 'text-violet-600' : 'text-gray-400'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${welcomeEnabled ? 'text-violet-600' : 'text-gray-400'}`}>{t('welcomeOffer')}</p>
              <p className={`text-sm ${welcomeEnabled ? 'text-gray-700' : 'text-gray-400'}`}>{merchant.welcome_offer_description}</p>
            </div>
          </div>
          {welcomeEnabled ? (
            <div className="mt-3">
              <Button
                size="sm"
                className={`w-full ${
                  grantedWelcome
                    ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-50 cursor-default'
                    : 'bg-violet-600 hover:bg-violet-700 focus:ring-violet-500'
                }`}
                disabled={grantedWelcome}
                loading={granting === 'welcome'}
                onClick={() => handleGrant('welcome')}
              >
                {grantedWelcome ? (
                  <><Check className="w-4 h-4 mr-1.5" />{t('alreadyGranted')}</>
                ) : (
                  t('grantWelcome')
                )}
              </Button>
            </div>
          ) : (
            <p className="mt-3 text-center text-[11px] text-gray-400">{t('disabledHint')}</p>
          )}
        </div>
      )}

      {/* Promo offers */}
      {hasOffers && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('promoOffers')}</p>
          <div className="space-y-2">
            {offers.map((offer) => {
              const granted = grantedOfferIds.has(offer.id);
              const isActive = offer.active && (!offer.expires_at || new Date(offer.expires_at) > new Date());

              return (
                <div key={offer.id} className={`p-3 sm:p-4 rounded-xl border ${isActive ? 'border-amber-100 bg-amber-50/50' : 'border-gray-100 bg-gray-50/50 opacity-60'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isActive ? 'bg-amber-100' : 'bg-gray-200'}`}>
                      <Gift className={`w-5 h-5 ${isActive ? 'text-amber-600' : 'text-gray-400'}`} />
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
                            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-50 cursor-default'
                            : 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500'
                        }`}
                        disabled={granted}
                        loading={granting === offer.id}
                        onClick={() => handleGrant('offer', offer.id)}
                      >
                        {granted ? (
                          <><Check className="w-4 h-4 mr-1.5" />{t('alreadyGranted')}</>
                        ) : (
                          t('grantOffer')
                        )}
                      </Button>
                    </div>
                  ) : (
                    <p className="mt-3 text-center text-[11px] text-gray-400">{t('disabledHint')}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
