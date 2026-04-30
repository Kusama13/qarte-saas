'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  Gift, Loader2, Check, X, Phone, Mail, Calendar,
  AlertCircle, Hourglass, CheckCircle2, XCircle, ChevronRight,
  MessageSquare, Save, AlertTriangle, Sparkles,
} from 'lucide-react';
import { useMerchant } from '@/contexts/MerchantContext';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency, formatPhoneLabel } from '@/lib/utils';
import {
  GIFT_CARD_DEFAULT_AMOUNTS,
  GIFT_CARD_MIN_AMOUNT,
  GIFT_CARD_MAX_AMOUNT,
} from '@/lib/gift-cards';
import { detectPaymentProvider } from '@/lib/payment-providers';
import type { GiftCard, GiftCardStatus } from '@/types';

type Tab = 'pending_payment' | 'active' | 'used' | 'cancelled';

interface GiftCardListResponse {
  gift_cards: GiftCard[];
  counts: Record<GiftCardStatus, number>;
}

function formatDateLabel(iso: string | null, locale: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch { return '—'; }
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  try {
    const ms = new Date(iso).getTime() - Date.now();
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
  } catch { return null; }
}

export default function GiftCardsPage() {
  const t = useTranslations('giftCards');
  const { merchant } = useMerchant();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>('pending_payment');
  const [data, setData] = useState<GiftCardListResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const locale = (merchant?.locale || 'fr') as 'fr' | 'en';
  const enabled = merchant?.gift_card_enabled ?? false;

  const fetchData = useCallback(async () => {
    if (!merchant?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/gift-cards?merchantId=${merchant.id}`);
      if (!res.ok) throw new Error('Failed');
      const json = await res.json() as GiftCardListResponse;
      setData(json);
    } catch (err) {
      console.error('[gift-cards] fetch error', err);
      addToast(t('toastError'), 'error');
    } finally {
      setLoading(false);
    }
  }, [merchant?.id, addToast, t]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const counts = data?.counts || { pending_payment: 0, active: 0, used: 0, cancelled: 0, expired: 0 };
  const filteredGiftCards = useMemo(() => {
    if (!data) return [];
    return data.gift_cards.filter((g) => g.status === activeTab);
  }, [data, activeTab]);

  if (!merchant) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const tabs: Array<{ id: Tab; label: string; count: number; urgent: boolean }> = [
    { id: 'pending_payment', label: t('tabPending'), count: counts.pending_payment, urgent: counts.pending_payment > 0 },
    { id: 'active', label: t('tabActive'), count: counts.active, urgent: false },
    { id: 'used', label: t('tabUsed'), count: counts.used, urgent: false },
    { id: 'cancelled', label: t('tabCancelled'), count: counts.cancelled, urgent: false },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* ═══ HEADER ═══ */}
      <div className="mb-4 md:mb-6">
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-rose-500" />
          <h1 className="text-lg md:text-2xl font-bold tracking-tight text-slate-900">
            {t('pageTitle')}
          </h1>
        </div>
        <p className="mt-0.5 text-xs md:text-sm text-slate-500">
          {t('pageDesc')}
        </p>
      </div>

      {/* ═══ SETTINGS ═══ */}
      <SettingsPanel
        merchantId={merchant.id}
        enabled={enabled}
        amounts={merchant.gift_card_amounts || GIFT_CARD_DEFAULT_AMOUNTS}
        message={merchant.gift_card_message}
        servicesEnabled={merchant.gift_card_services_enabled !== false}
        paymentLink={merchant.gift_card_payment_link}
        paymentLink2={merchant.gift_card_payment_link_2}
        onChange={() => fetchData()}
      />

      {/* ═══ Pas activé : pitch + signal d'activation ═══ */}
      {!enabled && <DisabledPitch t={t} />}

      {/* ═══ TABS + LISTE ═══ */}
      {enabled && (
        <>
          <div className="flex gap-1.5 sm:gap-2 mb-4">
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-2 rounded-xl font-bold text-[12px] sm:text-sm transition-all touch-manipulation ${
                    active
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span className="truncate">{tab.label}</span>
                  {tab.count > 0 && (
                    <span
                      className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold ${
                        active
                          ? 'bg-white/20 text-white'
                          : tab.urgent
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : filteredGiftCards.length === 0 ? (
            <EmptyState tab={activeTab} t={t} />
          ) : (
            <div className="space-y-3">
              {filteredGiftCards.map((card) => (
                <GiftCardRow
                  key={card.id}
                  card={card}
                  locale={locale}
                  country={merchant.country}
                  onChange={fetchData}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================
// SettingsPanel — collapsible, toggle + amounts + message
// ============================================================

function SettingsPanel({
  merchantId, enabled: initialEnabled, amounts: initialAmounts, message: initialMessage, servicesEnabled: initialServicesEnabled,
  paymentLink: initialPaymentLink, paymentLink2: initialPaymentLink2,
  onChange,
}: {
  merchantId: string;
  enabled: boolean;
  amounts: number[];
  message: string | null;
  servicesEnabled: boolean;
  paymentLink: string | null;
  paymentLink2: string | null;
  onChange?: () => void;
}) {
  const t = useTranslations('giftCards');
  const { addToast } = useToast();

  const [enabled, setEnabled] = useState(initialEnabled);
  const [amounts, setAmounts] = useState<number[]>(initialAmounts);
  const [message, setMessage] = useState(initialMessage || '');
  const [servicesEnabled, setServicesEnabled] = useState(initialServicesEnabled);
  const [paymentLink, setPaymentLink] = useState(initialPaymentLink || '');
  const [paymentLink2, setPaymentLink2] = useState(initialPaymentLink2 || '');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const persist = useCallback(async (override?: {
    enabled?: boolean; amounts?: number[]; message?: string; servicesEnabled?: boolean;
    paymentLink?: string; paymentLink2?: string;
  }) => {
    setSaving(true);
    try {
      const res = await fetch('/api/gift-cards/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId,
          enabled: override?.enabled ?? enabled,
          amounts: (override?.amounts ?? amounts).filter((a) => a >= GIFT_CARD_MIN_AMOUNT && a <= GIFT_CARD_MAX_AMOUNT),
          message: (override?.message ?? message)?.trim() || null,
          servicesEnabled: override?.servicesEnabled ?? servicesEnabled,
          paymentLink: (override?.paymentLink ?? paymentLink)?.trim() || null,
          paymentLink2: (override?.paymentLink2 ?? paymentLink2)?.trim() || null,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      addToast(t('saved'), 'success');
      setDirty(false);
      onChange?.();
    } catch {
      addToast(t('toastError'), 'error');
    } finally {
      setSaving(false);
    }
  }, [merchantId, enabled, amounts, message, servicesEnabled, paymentLink, paymentLink2, addToast, t, onChange]);

  const handleServicesToggle = () => {
    const next = !servicesEnabled;
    setServicesEnabled(next);
    persist({ servicesEnabled: next });
  };

  const handleToggle = () => {
    const next = !enabled;
    setEnabled(next);
    persist({ enabled: next });
  };

  const cleanAmounts = amounts.filter((a) => a > 0);

  return (
    <section className="bg-white border border-gray-100 rounded-2xl shadow-sm mb-6 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-base md:text-lg font-bold text-gray-900">
              {t('programToggleTitle')}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{t('programToggleDesc')}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={handleToggle}
            disabled={saving}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 disabled:opacity-50 mt-1 ${
              enabled ? 'bg-rose-500' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Config (visible quand activé) */}
        {enabled && (
          <div className="mt-5 pt-5 border-t border-gray-100 space-y-5">
            {/* Montants */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                {t('programAmountsLabel')}
              </label>
              <p className="text-xs text-gray-400 mb-2.5">{t('programAmountsHint')}</p>
              <div className="flex flex-wrap gap-2">
                {amounts.map((amount, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 rounded-full pl-3 pr-1 py-1"
                  >
                    <input
                      type="number"
                      min={GIFT_CARD_MIN_AMOUNT}
                      max={GIFT_CARD_MAX_AMOUNT}
                      value={amount || ''}
                      onChange={(e) => {
                        const v = Number(e.target.value) || 0;
                        setAmounts((prev) => prev.map((a, i) => (i === idx ? v : a)));
                        setDirty(true);
                      }}
                      className="w-12 bg-transparent text-sm font-bold text-rose-700 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      aria-label={t('programAmountsRemove')}
                      onClick={() => {
                        setAmounts((prev) => prev.filter((_, i) => i !== idx));
                        setDirty(true);
                      }}
                      className="w-6 h-6 rounded-full hover:bg-rose-100 text-rose-600 inline-flex items-center justify-center text-base leading-none touch-manipulation"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setAmounts((prev) => [...prev, 0]);
                    setDirty(true);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border border-dashed border-rose-300 text-rose-700 hover:bg-rose-50 transition-colors touch-manipulation"
                >
                  + {t('programAmountsAdd')}
                </button>
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                {t('programMessageLabel')}
              </label>
              <textarea
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value.slice(0, 300));
                  setDirty(true);
                }}
                placeholder={t('programMessagePlaceholder')}
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
              />
            </div>

            {/* Sous-toggle : offrir une prestation */}
            <div className="flex items-center justify-between gap-3 rounded-xl bg-rose-50/40 border border-rose-100 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">{t('programServicesToggleTitle')}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-snug">{t('programServicesToggleDesc')}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={servicesEnabled}
                onClick={handleServicesToggle}
                disabled={saving}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 disabled:opacity-50 ${
                  servicesEnabled ? 'bg-rose-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                    servicesEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Liens paiement dédiés bons cadeaux */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1 block">
                {t('programPaymentLinksLabel')}
              </label>
              <p className="text-xs text-gray-500 mb-3 leading-snug">
                {t('programPaymentLinksHint')}
              </p>

              <div className="space-y-2.5">
                <PaymentLinkField
                  url={paymentLink}
                  onUrlChange={(v) => { setPaymentLink(v); setDirty(true); }}
                  placeholder={t('programPaymentLinkPlaceholder1')}
                />
                <PaymentLinkField
                  url={paymentLink2}
                  onUrlChange={(v) => { setPaymentLink2(v); setDirty(true); }}
                  placeholder={t('programPaymentLinkPlaceholder2')}
                />
              </div>

              {/* Warning inline si aucun lien renseigné — directement sous les champs */}
              {!paymentLink.trim() && !paymentLink2.trim() && (
                <div className="mt-3 flex gap-2 items-start rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-900 leading-relaxed">{t('needPaymentLink')}</p>
                </div>
              )}
            </div>

            {dirty && cleanAmounts.length > 0 && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => persist()}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 disabled:opacity-50 transition-colors touch-manipulation"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? t('saving') : t('save')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function PaymentLinkField({
  url, onUrlChange, placeholder,
}: {
  url: string;
  onUrlChange: (v: string) => void;
  placeholder: string;
}) {
  const detected = url.trim() ? detectPaymentProvider(url.trim()) : null;
  return (
    <div className="relative">
      <input
        type="url"
        value={url}
        onChange={(e) => onUrlChange(e.target.value)}
        placeholder={placeholder}
        maxLength={500}
        className={`w-full px-3.5 py-2.5 ${detected ? 'pr-28' : ''} rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 placeholder:text-gray-400`}
      />
      {detected && (
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
          <Check className="w-2.5 h-2.5" />
          {detected}
        </span>
      )}
    </div>
  );
}

// ============================================================
// DisabledPitch — visible quand toggle OFF (au lieu de tabs vides)
// ============================================================

function DisabledPitch({ t: _t }: { t: ReturnType<typeof useTranslations<'giftCards'>> }) {
  const bullets = [
    'Tes clientes commandent depuis ta page, sans logiciel à installer.',
    'Tu reçois un email à chaque commande, avec la référence de paiement.',
    'À ton clic, on envoie le bon par SMS et on crée la carte fidélité.',
  ];
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
      <h3 className="text-sm font-bold text-gray-900 mb-3">Comment ça marche</h3>
      <ul className="space-y-2.5">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
            <span className="w-5 h-5 rounded-full bg-rose-50 text-rose-600 inline-flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
              {i + 1}
            </span>
            <span className="leading-relaxed">{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================
// GiftCardRow — affichage avec confirm/cancel inline (pas de modal)
// ============================================================

type RowMode = 'view' | 'confirming' | 'cancelling' | 'consuming';

function GiftCardRow({
  card, locale, country, onChange,
}: {
  card: GiftCard & { services_resolved?: Array<{ id: string; name: string; price: number }> };
  locale: 'fr' | 'en';
  country: string | null;
  onChange: () => void;
}) {
  const t = useTranslations('giftCards');
  const { addToast } = useToast();

  const [mode, setMode] = useState<RowMode>('view');
  const [busy, setBusy] = useState(false);

  const amountFmt = formatCurrency(Number(card.amount), country || 'FR', locale, 0);
  const days = daysUntil(card.expires_at);
  const expiringSoon = days !== null && days <= 30 && days > 0;
  const isServicesKind = card.kind === 'services';
  // services_resolved est calculé serveur-side (LIVE + fallback snapshot)
  const resolvedServices = card.services_resolved && card.services_resolved.length > 0
    ? card.services_resolved
    : (card.service_snapshot || []);
  const senderFullName = card.sender_last_name ? `${card.sender_first_name} ${card.sender_last_name}` : card.sender_first_name;
  const recipientFullName = card.recipient_last_name ? `${card.recipient_first_name} ${card.recipient_last_name}` : card.recipient_first_name;

  const handleConfirm = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/gift-cards/${card.id}/confirm-payment`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed');
      addToast(t('toastConfirmed', { recipient: card.recipient_first_name }), 'success');
      onChange();
    } catch {
      addToast(t('toastError'), 'error');
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/gift-cards/${card.id}/cancel`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed');
      addToast(t('toastCancelled'), 'info');
      onChange();
    } catch {
      addToast(t('toastError'), 'error');
      setBusy(false);
    }
  };

  const handleConsume = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/gift-cards/${card.id}/consume`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed');
      addToast(t('toastConsumed', { name: recipientFullName }), 'success');
      onChange();
    } catch {
      addToast(t('toastError'), 'error');
      setBusy(false);
    }
  };

  return (
    <article className={`bg-white border border-slate-100 rounded-xl shadow-sm p-4 md:p-5 ${card.status === 'cancelled' || card.status === 'expired' ? 'opacity-70' : ''}`}>
      {/* En-tête : montant + code + status */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-xl font-bold text-gray-900 tabular-nums">{amountFmt}</span>
            {isServicesKind && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 text-[10px] font-bold uppercase tracking-wider">
                <Sparkles className="w-2.5 h-2.5" />
                {t('rowKindServices')}
              </span>
            )}
            <code className="text-[11px] font-mono font-semibold text-gray-400 tracking-wider">
              {card.code}
            </code>
          </div>
          <p className="text-[13px] text-gray-600 mt-0.5">
            <span className="font-semibold text-gray-900">{senderFullName}</span>
            <span className="text-gray-400 mx-1.5">→</span>
            <span className="font-semibold text-gray-900">{recipientFullName}</span>
          </p>
        </div>
        <StatusPill status={card.status} t={t} />
      </div>

      {/* Liste prestations offertes (kind=services) */}
      {isServicesKind && resolvedServices.length > 0 && (
        <div className="rounded-xl bg-violet-50/50 border border-violet-100 px-3 py-2.5 mb-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600 mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {t('rowServicesLabel')}
          </p>
          <ul className="space-y-0.5">
            {resolvedServices.map((s, idx) => (
              <li key={`${s.id}-${idx}`} className="flex items-center justify-between gap-2 text-[13px]">
                <span className="text-violet-900 truncate">{s.name}</span>
                <span className="text-violet-700 font-semibold tabular-nums shrink-0">
                  {formatCurrency(Number(s.price || 0), country || 'FR', locale, 0)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Détails 2 colonnes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <ContactBlock label={t('fromLabel')} name={senderFullName} phone={card.sender_phone} email={card.sender_email} />
        <ContactBlock label={t('toLabel')} name={recipientFullName} phone={card.recipient_phone} email={card.recipient_email} />
      </div>

      {/* Mot personnel */}
      {card.sender_message && (
        <div className="rounded-xl bg-violet-50 border border-violet-100 p-3 mb-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600 mb-1 flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            {t('messageLabel')}
          </p>
          <p className="text-[13px] text-violet-900 italic leading-relaxed">{`« ${card.sender_message} »`}</p>
        </div>
      )}

      {/* Dates */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-500 mb-3">
        <DateChip icon={Calendar} label={t('createdLabel')} value={formatDateLabel(card.created_at, locale)} />
        {card.paid_at && (
          <DateChip icon={CheckCircle2} label={t('paidLabel')} value={formatDateLabel(card.paid_at, locale)} iconClass="text-emerald-500" />
        )}
        {card.used_at && (
          <DateChip icon={Check} label={t('usedLabel')} value={formatDateLabel(card.used_at, locale)} iconClass="text-violet-500" />
        )}
        {card.status === 'active' && card.expires_at && (
          <span className={`inline-flex items-center gap-1 ${expiringSoon ? 'text-amber-600 font-semibold' : ''}`}>
            <Hourglass className="w-3 h-3" />
            {expiringSoon
              ? t('expiresIn', { days: String(days) })
              : `${t('expiresLabel')} ${formatDateLabel(card.expires_at, locale)}`}
          </span>
        )}
      </div>

      {/* Actions inline (pending uniquement) — pattern garde-fou clic-clic */}
      {card.status === 'pending_payment' && mode === 'view' && (
        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-3 border-t border-gray-100">
          <button
            onClick={() => setMode('cancelling')}
            className="sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors touch-manipulation"
          >
            <X className="w-4 h-4" />
            {t('cancel')}
          </button>
          <button
            onClick={() => setMode('confirming')}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors touch-manipulation"
          >
            <Check className="w-4 h-4" />
            {t('confirmPayment')}
          </button>
        </div>
      )}

      {/* Confirm step inline */}
      {mode === 'confirming' && (
        <div className="pt-3 border-t border-gray-100 space-y-3">
          <div className="flex gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[13px] text-amber-900 leading-relaxed">
              {t('confirmBody', { amount: amountFmt, code: card.code, recipient: card.recipient_first_name })}
            </p>
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-2">
            <button
              onClick={() => setMode('view')}
              disabled={busy}
              className="sm:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 touch-manipulation"
            >
              {t('confirmKeep')}
            </button>
            <button
              onClick={handleConfirm}
              disabled={busy}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors touch-manipulation"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {busy ? t('confirmingPayment') : t('confirmCta')}
            </button>
          </div>
        </div>
      )}

      {/* Cancel step inline */}
      {mode === 'cancelling' && (
        <div className="pt-3 border-t border-gray-100 space-y-3">
          <div className="flex gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-[13px] text-rose-900 leading-relaxed">{t('cancelBody')}</p>
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-2">
            <button
              onClick={() => setMode('view')}
              disabled={busy}
              className="sm:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 touch-manipulation"
            >
              {t('cancelKeep')}
            </button>
            <button
              onClick={handleCancel}
              disabled={busy}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 disabled:opacity-50 transition-colors touch-manipulation"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
              {busy ? t('cancelling') : t('cancelCta')}
            </button>
          </div>
        </div>
      )}

      {/* Active : bouton "Consommer" inline */}
      {card.status === 'active' && mode === 'view' && (
        <div className="pt-3 border-t border-gray-100">
          <button
            onClick={() => setMode('consuming')}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-colors touch-manipulation"
          >
            <Sparkles className="w-4 h-4" />
            {t('consumeCta')}
          </button>
        </div>
      )}

      {/* Consume step inline — pattern garde-fou clic-clic */}
      {mode === 'consuming' && (
        <div className="pt-3 border-t border-gray-100 space-y-3">
          <div className="flex gap-2.5 p-3 rounded-xl bg-violet-50 border border-violet-200">
            <Sparkles className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
            <p className="text-[13px] text-violet-900 leading-relaxed">
              {t('consumeBody', { name: recipientFullName, gift: isServicesKind && resolvedServices.length > 0
                ? resolvedServices.map((sv) => sv.name).join(' + ')
                : amountFmt })}
            </p>
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-2">
            <button
              onClick={() => setMode('view')}
              disabled={busy}
              className="sm:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 touch-manipulation"
            >
              {t('consumeCancel')}
            </button>
            <button
              onClick={handleConsume}
              disabled={busy}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 disabled:opacity-50 transition-colors touch-manipulation"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {busy ? t('consuming') : t('consumeConfirm')}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

// ============================================================
// Composants de présentation
// ============================================================

function ContactBlock({ label, name, phone, email }: {
  label: string;
  name: string;
  phone: string;
  email?: string | null;
}) {
  return (
    <div className="space-y-0.5 min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="text-[13px] font-semibold text-gray-900 truncate">{name}</p>
      <a href={`tel:${phone}`} className="flex items-center gap-1 text-[11px] text-gray-600 hover:text-gray-900 truncate">
        <Phone className="w-3 h-3 shrink-0" />
        <span className="tabular-nums truncate">{formatPhoneLabel(phone)}</span>
      </a>
      {email && (
        <a href={`mailto:${email}`} className="flex items-center gap-1 text-[11px] text-gray-600 hover:text-gray-900 truncate">
          <Mail className="w-3 h-3 shrink-0" />
          <span className="truncate">{email}</span>
        </a>
      )}
    </div>
  );
}

function DateChip({ icon: Icon, label, value, iconClass }: {
  icon: typeof Calendar;
  label: string;
  value: string;
  iconClass?: string;
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <Icon className={`w-3 h-3 ${iconClass || ''}`} />
      <span>{label} : <span className="text-gray-700 font-medium">{value}</span></span>
    </span>
  );
}

function StatusPill({ status, t }: { status: GiftCardStatus; t: ReturnType<typeof useTranslations<'giftCards'>> }) {
  const cfg = {
    pending_payment: { label: t('tabPending'), bg: 'bg-amber-100', text: 'text-amber-800', Icon: Hourglass },
    active: { label: t('tabActive'), bg: 'bg-emerald-100', text: 'text-emerald-800', Icon: CheckCircle2 },
    used: { label: t('tabUsed'), bg: 'bg-violet-100', text: 'text-violet-800', Icon: Check },
    cancelled: { label: t('tabCancelled'), bg: 'bg-gray-100', text: 'text-gray-700', Icon: XCircle },
    expired: { label: t('tabCancelled'), bg: 'bg-gray-100', text: 'text-gray-600', Icon: XCircle },
  }[status];

  return (
    <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>
      <cfg.Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function EmptyState({ tab, t }: { tab: Tab; t: ReturnType<typeof useTranslations<'giftCards'>> }) {
  const messages: Record<Tab, string> = {
    pending_payment: t('emptyPending'),
    active: t('emptyActive'),
    used: t('emptyUsed'),
    cancelled: t('emptyCancelled'),
  };
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-sm py-12 px-6 text-center">
      <Gift className="w-9 h-9 text-gray-300 mx-auto mb-2.5" strokeWidth={1.5} />
      <p className="text-sm text-gray-500 max-w-sm mx-auto">{messages[tab]}</p>
    </div>
  );
}
