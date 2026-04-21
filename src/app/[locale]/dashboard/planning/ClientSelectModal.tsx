'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Search, UserCheck, UserPlus, Loader2, ArrowRight, Instagram, Gift } from 'lucide-react';
import { TikTokIcon, FacebookIcon } from '@/components/icons/SocialIcons';
import { useTranslations } from 'next-intl';
import type { PlanningSlot, CustomerSearchResult, MerchantOffer, MerchantCountry } from '@/types';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { useMerchant } from '@/contexts/MerchantContext';
import { formatTime, toBCP47, formatPhoneLabel } from '@/lib/utils';
import type { BookingDraft } from './usePlanningState';

interface ClientSelectModalProps {
  slot: PlanningSlot;
  draft: BookingDraft;
  merchantId: string;
  customerResults: CustomerSearchResult[];
  showCustomerSearch: boolean;
  searchDone: boolean;
  creatingCustomer: boolean;
  createError: string | null;
  locale: string;
  phonePlaceholder: string;
  onNameChange: (value: string) => void;
  onDraftChange: (partial: Partial<BookingDraft>) => void;
  onSelectCustomer: (c: CustomerSearchResult) => void;
  onCreateCustomer: (social?: { instagram_handle?: string; tiktok_handle?: string; facebook_url?: string }) => Promise<string | null>;
  onProceed: (customer: CustomerSearchResult | null, isNewCustomer: boolean) => void;
  onShowCustomerSearch: (show: boolean) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export default function ClientSelectModal({
  slot,
  draft,
  merchantId,
  customerResults,
  showCustomerSearch,
  searchDone,
  creatingCustomer,
  createError,
  locale,
  phonePlaceholder,
  onNameChange,
  onDraftChange,
  onSelectCustomer,
  onCreateCustomer,
  onProceed,
  onShowCustomerSearch,
  onDelete,
  onClose,
}: ClientSelectModalProps) {
  const t = useTranslations('planning');
  const { merchant } = useMerchant();
  const [phoneCountry, setPhoneCountry] = useState<MerchantCountry>(
    (draft.phoneCountry || merchant?.country || 'FR') as MerchantCountry
  );
  // Sync local state when draft changes (e.g. client selected from search)
  useEffect(() => {
    if (draft.phoneCountry) setPhoneCountry(draft.phoneCountry as MerchantCountry);
  }, [draft.phoneCountry]);
  const handlePhoneCountryChange = (c: MerchantCountry) => {
    setPhoneCountry(c);
    onDraftChange({ phoneCountry: c });
  };
  const hasSocialData = !!(draft.instagramHandle || draft.tiktokHandle || draft.facebookUrl);
  const [showSocial, setShowSocial] = useState(hasSocialData);
  const [grantWelcome, setGrantWelcome] = useState(false);
  const [grantOfferId, setGrantOfferId] = useState<string | null>(null);
  const [activeOffers, setActiveOffers] = useState<MerchantOffer[]>([]);

  useEffect(() => {
    if (!merchantId) return;
    fetch(`/api/merchant-offers?merchantId=${merchantId}&public=true`)
      .then(r => r.ok ? r.json() : { offers: [] })
      .then(d => setActiveOffers(d.offers || []))
      .catch(() => {});
  }, [merchantId]);

  const hasClient = !!draft.customerId;
  const canCreate = draft.clientName.trim().length >= 2 && draft.clientPhone.trim().length >= 6 && !draft.customerId;

  const buildCustomerFromDraft = (id: string): CustomerSearchResult => ({
    id,
    first_name: draft.clientName.split(' ')[0],
    last_name: draft.clientName.split(' ').slice(1).join(' ') || null,
    phone_number: draft.clientPhone,
    instagram_handle: draft.instagramHandle || null,
    tiktok_handle: draft.tiktokHandle || null,
    facebook_url: draft.facebookUrl || null,
  });

  const handleProceedWithClient = async () => {
    if (draft.customerId) {
      // Save social links if any were entered/changed
      if (draft.instagramHandle || draft.tiktokHandle || draft.facebookUrl) {
        fetch('/api/customers/social', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId: draft.customerId,
            merchantId,
            instagram_handle: draft.instagramHandle || null,
            tiktok_handle: draft.tiktokHandle || null,
            facebook_url: draft.facebookUrl || null,
          }),
        }).catch(() => {});
      }
      onProceed(buildCustomerFromDraft(draft.customerId), false);
    } else {
      onProceed(null, false);
    }
  };

  const handleCreateAndProceed = async () => {
    const customerId = await onCreateCustomer({
      instagram_handle: draft.instagramHandle || undefined,
      tiktok_handle: draft.tiktokHandle || undefined,
      facebook_url: draft.facebookUrl || undefined,
    });
    if (customerId) {
      // Fire-and-forget voucher grants
      if (grantWelcome) {
        fetch('/api/vouchers/grant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customer_id: customerId, merchant_id: merchantId, type: 'welcome' }),
        }).catch(() => {});
      }
      if (grantOfferId) {
        fetch('/api/vouchers/grant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customer_id: customerId, merchant_id: merchantId, type: 'offer', offer_id: grantOfferId }),
        }).catch(() => {});
      }
      onProceed(buildCustomerFromDraft(customerId), true);
    }
  };

  const handleSkip = () => {
    onProceed(null, false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, pointerEvents: 'none' }}
      animate={{ opacity: 1, pointerEvents: 'auto' }}
      exit={{ opacity: 0, pointerEvents: 'none' }}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-gray-900">{t('selectClient')}</h3>
            <p className="text-xs text-gray-400">
              {formatTime(slot.start_time, locale)} — {new Date(slot.slot_date + 'T12:00:00').toLocaleDateString(toBCP47(locale), { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Search / Name field */}
          <div className="relative">
            <label className="text-xs font-semibold text-gray-600 mb-1 block">{t('clientName')}</label>
            <div className="relative">
              <input
                type="text"
                value={draft.clientName}
                onChange={(e) => onNameChange(e.target.value)}
                onFocus={() => { if (draft.clientName.length >= 2 && !draft.customerId) onShowCustomerSearch(true); }}
                onBlur={() => setTimeout(() => onShowCustomerSearch(false), 200)}
                placeholder={t('searchPlaceholder')}
                className="w-full px-3 py-2.5 pr-9 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
              />
              {draft.clientName.length >= 2 && !draft.customerId && (
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              )}
            </div>

            {/* Customer linked badge */}
            {hasClient && (
              <div className="mt-1.5 flex items-center gap-1.5 text-emerald-600">
                <UserCheck className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{t('clientLinked')}</span>
              </div>
            )}

            {/* Autocomplete dropdown */}
            {showCustomerSearch && searchDone && (
              <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {customerResults.length > 0 ? (
                  customerResults.map(c => (
                    <button
                      key={c.id}
                      onPointerDown={() => onSelectCustomer(c)}
                      className="w-full text-left px-3 py-2.5 hover:bg-indigo-50 transition-colors border-b border-gray-50 last:border-0 touch-manipulation"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-800">
                          {c.first_name} {c.last_name || ''}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {c.instagram_handle && <Instagram className="w-3 h-3 text-pink-500" />}
                          {c.tiktok_handle && <TikTokIcon className="w-3 h-3 text-gray-700" />}
                          {c.facebook_url && <FacebookIcon className="w-3 h-3 text-blue-600" />}
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">{formatPhoneLabel(c.phone_number)}</span>
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-3 text-xs text-gray-400">{t('noClientFound')}</p>
                )}
              </div>
            )}
          </div>

          {/* Phone */}
          <PhoneInput
            label={hasClient ? t('phoneOptional') : t('phoneLabel')}
            value={draft.clientPhone}
            onChange={(v) => onDraftChange({ clientPhone: v })}
            country={phoneCountry}
            onCountryChange={handlePhoneCountryChange}
            countries={['FR', 'BE', 'CH']}

            className="text-sm border-gray-200 rounded-r-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
          />

          {/* Social links toggle */}
          {(hasClient || canCreate) && (
            <button
              onClick={() => setShowSocial(!showSocial)}
              className="text-xs text-indigo-600 font-medium hover:underline"
            >
              {showSocial ? t('hideSocial') : t('addSocial')}
            </button>
          )}

          {/* Social link inputs */}
          {showSocial && (hasClient || canCreate) && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-0.5 block flex items-center gap-1">
                  <Instagram className="w-3 h-3 text-pink-500" /> Instagram
                </label>
                <input
                  type="text"
                  value={draft.instagramHandle}
                  onChange={(e) => onDraftChange({ instagramHandle: e.target.value })}
                  placeholder="@pseudo"
                  className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-0.5 block flex items-center gap-1">
                  <TikTokIcon className="w-3 h-3 text-gray-700" /> TikTok
                </label>
                <input
                  type="text"
                  value={draft.tiktokHandle}
                  onChange={(e) => onDraftChange({ tiktokHandle: e.target.value })}
                  placeholder="@pseudo"
                  className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-500 mb-0.5 block flex items-center gap-1">
                  <FacebookIcon className="w-3 h-3 text-blue-600" /> Facebook
                </label>
                <input
                  type="text"
                  value={draft.facebookUrl}
                  onChange={(e) => onDraftChange({ facebookUrl: e.target.value })}
                  placeholder="https://facebook.com/..."
                  className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          )}

          {/* Error message */}
          {createError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{createError}</p>
          )}

          {/* Voucher grants (only for new client creation) */}
          {canCreate && (merchant?.welcome_offer_enabled || activeOffers.length > 0) && (
            <div className="space-y-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
              {merchant?.welcome_offer_enabled && (
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={grantWelcome}
                    onChange={(e) => setGrantWelcome(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                  />
                  <Gift className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                  <span className="text-xs text-gray-700">{t('grantWelcomeOffer')}</span>
                </label>
              )}
              {activeOffers.length > 0 && (
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={!!grantOfferId}
                    onChange={(e) => setGrantOfferId(e.target.checked ? activeOffers[0].id : null)}
                    className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  <Gift className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  {activeOffers.length === 1 ? (
                    <span className="text-xs text-gray-700">{activeOffers[0].title}</span>
                  ) : (
                    <select
                      value={grantOfferId || ''}
                      onChange={(e) => setGrantOfferId(e.target.value || null)}
                      className="text-xs text-gray-700 border border-gray-200 rounded-lg px-2 py-1 flex-1 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                    >
                      <option value="">{t('selectOffer')}</option>
                      {activeOffers.map(o => (
                        <option key={o.id} value={o.id}>{o.title}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Create customer button */}
          {canCreate && (
            <button
              onClick={handleCreateAndProceed}
              disabled={creatingCustomer}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm"
            >
              {creatingCustomer ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {t('creating')}</>
              ) : (
                <><UserPlus className="w-4 h-4" /> {t('createAsNewClient', { name: draft.clientName.trim().split(' ')[0] })}</>
              )}
            </button>
          )}
        </div>

        {/* Footer buttons — sticky bottom, stack mobile */}
        <div className="p-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row gap-2 sticky bottom-0 bg-white z-10">
          {onDelete && (
            <button
              onClick={onDelete}
              className="w-full sm:flex-1 py-3 rounded-xl bg-white border border-red-200 text-red-600 text-sm font-bold hover:bg-red-50 hover:border-red-300 transition-colors"
            >
              {t('deleteSlot')}
            </button>
          )}
          {!hasClient && draft.clientPhone.trim().length < 6 && (
            <button
              onClick={handleSkip}
              className="w-full sm:flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200 transition-colors"
            >
              {t('skipClient')}
            </button>
          )}
          {hasClient && (
            <button
              onClick={handleProceedWithClient}
              className="w-full sm:flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm"
            >
              {t('nextStep')}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
