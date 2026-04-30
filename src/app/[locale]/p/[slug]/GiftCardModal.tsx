'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Loader2, Check, Sparkles, Coins, Clock, ChevronRight, ChevronLeft, Wand2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { formatCurrency, validateEmail, suggestEmailCorrection } from '@/lib/utils';
import {
  GIFT_CARD_MIN_AMOUNT,
  GIFT_CARD_MAX_AMOUNT,
  GIFT_CARD_DEFAULT_AMOUNTS,
  parseGiftCardAmounts,
} from '@/lib/gift-cards';
import type { MerchantCountry } from '@/types';

function formatDuration(mins: number, locale: string): string {
  if (mins < 60) return `${mins}min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (locale === 'en') return m > 0 ? `${h}h ${m}min` : `${h}h`;
  return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

type Step = 'kind' | 'amount' | 'services' | 'recipient' | 'sender' | 'recap' | 'success';

interface Service {
  id: string;
  name: string;
  price: number;
  duration?: number | null;
  position?: number;
  category_id?: string | null;
  price_from?: boolean;
}

interface ServiceCategory {
  id: string;
  name: string;
  position: number;
}

interface GiftCardModalProps {
  open: boolean;
  onClose: () => void;
  merchantId: string;
  shopName: string;
  primaryColor: string;
  secondaryColor: string;
  defaultCountry: MerchantCountry;
  amounts: number[] | null;
  introMessage: string | null;
  services: Service[];
  serviceCategories: ServiceCategory[];
  servicesEnabled: boolean;
  locale: string;
  isDemo?: boolean;
}

export default function GiftCardModal({
  open, onClose, merchantId, shopName, primaryColor, secondaryColor,
  defaultCountry, amounts, introMessage, services, serviceCategories,
  servicesEnabled, locale, isDemo = false,
}: GiftCardModalProps) {
  const t = useTranslations('giftCards');
  const p = primaryColor;
  const s = secondaryColor;

  const servicesAvailable = servicesEnabled && services.length > 0;
  const initialStep: Step = servicesAvailable ? 'kind' : 'amount';

  const [step, setStep] = useState<Step>(initialStep);
  const [kind, setKind] = useState<'amount' | 'services'>('amount');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [amount, setAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  const [recipientFirstName, setRecipientFirstName] = useState('');
  const [recipientLastName, setRecipientLastName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientCountry, setRecipientCountry] = useState<MerchantCountry>(defaultCountry);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientEmailSuggestion, setRecipientEmailSuggestion] = useState('');

  const [senderFirstName, setSenderFirstName] = useState('');
  const [senderLastName, setSenderLastName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderCountry, setSenderCountry] = useState<MerchantCountry>(defaultCountry);
  const [senderEmail, setSenderEmail] = useState('');
  const [senderEmailSuggestion, setSenderEmailSuggestion] = useState('');
  const [senderMessage, setSenderMessage] = useState('');
  // Envoi planifié au destinataire (optionnel) — date locale ISO YYYY-MM-DD
  const [scheduledDate, setScheduledDate] = useState('');

  const suggestedAmounts = useMemo(
    () => parseGiftCardAmounts(amounts ?? GIFT_CARD_DEFAULT_AMOUNTS),
    [amounts],
  );

  const country = defaultCountry || 'FR';

  const selectedServices = useMemo(() => {
    const byId = new Map(services.map((sv) => [sv.id, sv]));
    return selectedServiceIds.map((id) => byId.get(id)).filter((sv): sv is Service => Boolean(sv));
  }, [services, selectedServiceIds]);

  const finalAmount = useMemo(() => {
    if (kind === 'services') {
      return selectedServices.reduce((sum, sv) => sum + Number(sv.price || 0), 0);
    }
    return amount ?? Number(customAmount) ?? 0;
  }, [kind, selectedServices, amount, customAmount]);

  const totalDuration = useMemo(
    () => selectedServices.reduce((sum, sv) => sum + (sv.duration || 0), 0),
    [selectedServices],
  );

  const amountFormatted = useMemo(
    () => formatCurrency(finalAmount, country, 'fr', 0),
    [finalAmount, country],
  );

  // Reset à chaque ouverture
  useEffect(() => {
    if (open) {
      setStep(initialStep);
      setKind('amount');
      setAmount(null);
      setCustomAmount('');
      setSelectedServiceIds([]);
      setRecipientFirstName('');
      setRecipientLastName('');
      setRecipientPhone('');
      setRecipientCountry(defaultCountry);
      setRecipientEmail('');
      setRecipientEmailSuggestion('');
      setSenderFirstName('');
      setSenderLastName('');
      setSenderPhone('');
      setSenderCountry(defaultCountry);
      setSenderEmail('');
      setSenderEmailSuggestion('');
      setSenderMessage('');
      setScheduledDate('');
      setError(null);
      setSubmitting(false);
    }
  }, [open, defaultCountry, initialStep]);

  // Group services par catégorie
  const groupedServices = useMemo(() => {
    const catMap = new Map(serviceCategories.map((c) => [c.id, c]));
    const grouped: { category: ServiceCategory | null; services: Service[] }[] = [];
    const withCat = services.filter((sv) => sv.category_id && catMap.has(sv.category_id));
    const withoutCat = services.filter((sv) => !sv.category_id || !catMap.has(sv.category_id));
    const seenCats = new Set<string>();
    for (const svc of withCat) {
      if (svc.category_id && !seenCats.has(svc.category_id)) {
        seenCats.add(svc.category_id);
        const cat = catMap.get(svc.category_id)!;
        grouped.push({
          category: cat,
          services: withCat
            .filter((sv) => sv.category_id === svc.category_id)
            .sort((a, b) => (a.position || 0) - (b.position || 0)),
        });
      }
    }
    if (withoutCat.length > 0) {
      grouped.push({
        category: null,
        services: withoutCat.sort((a, b) => (a.position || 0) - (b.position || 0)),
      });
    }
    return grouped;
  }, [services, serviceCategories]);

  const addService = useCallback((id: string) => {
    setSelectedServiceIds((prev) => [...prev, id]);
  }, []);

  const removeServiceAt = useCallback((index: number) => {
    setSelectedServiceIds((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const canContinueAmount = finalAmount >= GIFT_CARD_MIN_AMOUNT && finalAmount <= GIFT_CARD_MAX_AMOUNT;
  const canContinueServices = selectedServiceIds.length > 0
    && finalAmount >= GIFT_CARD_MIN_AMOUNT
    && finalAmount <= GIFT_CARD_MAX_AMOUNT;
  const canContinueRecipient = recipientFirstName.trim().length > 0
    && recipientLastName.trim().length > 0
    && recipientPhone.trim().length >= 6
    && (!recipientEmail.trim() || validateEmail(recipientEmail.trim()));
  const canContinueSender = senderFirstName.trim().length > 0
    && senderLastName.trim().length > 0
    && senderPhone.trim().length >= 6
    && validateEmail(senderEmail.trim());

  // Validation email avant de passer à l'étape suivante : on bloque + propose une correction
  const validateRecipientEmail = (): boolean => {
    const v = recipientEmail.trim();
    if (!v) return true; // optionnel
    if (!validateEmail(v)) {
      setError(t('errorEmail'));
      return false;
    }
    const correction = suggestEmailCorrection(v);
    if (correction && !recipientEmailSuggestion) {
      setRecipientEmailSuggestion(correction);
      return false;
    }
    return true;
  };

  const validateSenderEmail = (): boolean => {
    const v = senderEmail.trim();
    if (!validateEmail(v)) {
      setError(t('errorEmail'));
      return false;
    }
    const correction = suggestEmailCorrection(v);
    if (correction && !senderEmailSuggestion) {
      setSenderEmailSuggestion(correction);
      return false;
    }
    return true;
  };

  const submit = useCallback(async () => {
    if (isDemo) {
      setStep('success');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/gift-cards/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant_id: merchantId,
          kind,
          ...(kind === 'amount' ? { amount: finalAmount } : {}),
          ...(kind === 'services' ? { service_ids: selectedServiceIds } : {}),
          sender_first_name: senderFirstName.trim(),
          sender_last_name: senderLastName.trim(),
          sender_phone: senderPhone.trim(),
          sender_phone_country: senderCountry,
          sender_email: senderEmail.trim(),
          sender_message: senderMessage.trim() || null,
          recipient_first_name: recipientFirstName.trim(),
          recipient_last_name: recipientLastName.trim(),
          recipient_phone: recipientPhone.trim(),
          recipient_phone_country: recipientCountry,
          recipient_email: recipientEmail.trim() || null,
          // Date d'envoi : on la convertit en ISO datetime à 9h locale du jour choisi
          scheduled_send_at: scheduledDate
            ? new Date(`${scheduledDate}T09:00:00`).toISOString()
            : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 429) setError(t('errorRateLimit'));
        else if (res.status === 403 && json.error?.includes('numéro')) setError(t('errorBanned'));
        else if (res.status === 403) setError(t('errorMerchantSuspended'));
        else setError(json.error || t('errorGeneric'));
        return;
      }
      setStep('success');
    } catch {
      setError(t('errorGeneric'));
    } finally {
      setSubmitting(false);
    }
  }, [
    isDemo, merchantId, kind, finalAmount, selectedServiceIds,
    senderFirstName, senderLastName, senderPhone, senderCountry, senderEmail, senderMessage,
    recipientFirstName, recipientLastName, recipientPhone, recipientCountry, recipientEmail,
    scheduledDate, t,
  ]);

  if (!open) return null;

  // Step indicator
  const indicatorSteps: Step[] = servicesAvailable
    ? ['kind', kind === 'services' ? 'services' : 'amount', 'recipient', 'sender', 'recap']
    : ['amount', 'recipient', 'sender', 'recap'];
  const currentStepIdx = indicatorSteps.indexOf(step);

  const goBack = () => {
    setError(null);
    if (step === 'recap') setStep('sender');
    else if (step === 'sender') setStep('recipient');
    else if (step === 'recipient') setStep(kind === 'services' ? 'services' : 'amount');
    else if ((step === 'amount' || step === 'services') && servicesAvailable) setStep('kind');
  };

  const goNext = () => {
    setError(null);
    if (step === 'kind') setStep(kind === 'services' ? 'services' : 'amount');
    else if (step === 'amount' && canContinueAmount) setStep('recipient');
    else if (step === 'services' && canContinueServices) setStep('recipient');
    else if (step === 'recipient' && canContinueRecipient) {
      // Email destinataire optionnel : on valide seulement si fourni (avec suggestion)
      if (!validateRecipientEmail()) return;
      setStep('sender');
    }
    else if (step === 'sender' && canContinueSender) {
      // Email offreur obligatoire : valide format + propose suggestion
      if (!validateSenderEmail()) return;
      setStep('recap');
    }
    else if (step === 'recap') submit();
  };

  const canShowBack = step !== 'success' && step !== initialStep;

  // Header sub-title contextuel
  const headerSubtitle = (() => {
    if (step === 'success') return null;
    if (selectedServices.length > 0 && kind === 'services') {
      return t('headerSubtitleServices', { count: selectedServiceIds.length, amount: amountFormatted });
    }
    if (kind === 'amount' && finalAmount > 0) {
      return amountFormatted;
    }
    return shopName;
  })();

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          key="panel"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 30, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header sticky white */}
          <div className="sticky top-0 z-10 bg-white rounded-t-3xl border-b border-gray-100 px-5 py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {canShowBack && (
                <button
                  onClick={goBack}
                  aria-label={t('back')}
                  className="p-1.5 -ml-1 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-500" />
                </button>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-gray-900 leading-tight truncate">
                  {step === 'success' ? t('successTitle') : t('publicTitle')}
                </h3>
                {headerSubtitle && (
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{headerSubtitle}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label={t('close')}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors touch-manipulation shrink-0"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Step indicator (barres remplies) */}
          {step !== 'success' && (
            <div className="px-5 pt-3 pb-1 flex gap-1.5">
              {indicatorSteps.map((_, i) => (
                <div
                  key={i}
                  className="h-1 flex-1 rounded-full transition-colors"
                  style={{ backgroundColor: i <= currentStepIdx ? p : '#e5e7eb' }}
                />
              ))}
            </div>
          )}

          <div className="p-5">
            <AnimatePresence mode="wait">
              {/* STEP — KIND */}
              {step === 'kind' && (
                <motion.div
                  key="kind"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <p className="text-sm font-semibold text-gray-700 mb-1">{t('publicStepKindTitle')}</p>
                  <p className="text-xs text-gray-500 mb-4">{t('publicDesc', { shopName })}</p>

                  {introMessage && (
                    <div className="rounded-xl bg-gray-50 px-3.5 py-2.5 mb-4">
                      <p className="text-[13px] text-gray-700 italic leading-snug">{introMessage}</p>
                    </div>
                  )}

                  <div className="space-y-2.5">
                    <KindCard
                      selected={kind === 'amount'}
                      onClick={() => setKind('amount')}
                      icon={<Coins className="w-4 h-4" />}
                      title={t('kindAmountTitle')}
                      description={t('kindAmountDesc')}
                      primaryColor={p}
                    />
                    <KindCard
                      selected={kind === 'services'}
                      onClick={() => setKind('services')}
                      icon={<Wand2 className="w-4 h-4" />}
                      title={t('kindServicesTitle')}
                      description={t('kindServicesDesc')}
                      primaryColor={p}
                    />
                  </div>

                  <StickyCta
                    primary={p}
                    secondary={s}
                    onClick={goNext}
                    label={t('continue')}
                  />
                </motion.div>
              )}

              {/* STEP — AMOUNT */}
              {step === 'amount' && (
                <motion.div
                  key="amount"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <p className="text-sm font-semibold text-gray-700 mb-1">{t('publicStep1Title')}</p>
                  {!servicesAvailable && (
                    <p className="text-xs text-gray-500 mb-4">{t('publicDesc', { shopName })}</p>
                  )}
                  {servicesAvailable && (
                    <p className="text-xs text-gray-500 mb-4">{t('amountStepHint')}</p>
                  )}

                  {!servicesAvailable && introMessage && (
                    <div className="rounded-xl bg-gray-50 px-3.5 py-2.5 mb-4">
                      <p className="text-[13px] text-gray-700 italic leading-snug">{introMessage}</p>
                    </div>
                  )}

                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                    {t('amountSuggestion')}
                  </p>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {suggestedAmounts.map((a) => {
                      const active = amount === a;
                      return (
                        <button
                          key={a}
                          type="button"
                          onClick={() => { setAmount(a); setCustomAmount(''); }}
                          className={`px-4 py-3.5 rounded-xl border-2 text-center transition-all touch-manipulation ${
                            active ? 'text-white' : 'bg-gray-50 border-transparent hover:bg-gray-100'
                          }`}
                          style={active ? { borderColor: p, backgroundColor: p } : undefined}
                        >
                          <span className={`block text-lg font-bold ${active ? 'text-white' : 'text-gray-900'}`}>
                            {formatCurrency(a, country, 'fr', 0)}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                    {t('amountCustom')}
                  </p>
                  <div className="relative mb-2">
                    <input
                      type="number"
                      min={GIFT_CARD_MIN_AMOUNT}
                      max={GIFT_CARD_MAX_AMOUNT}
                      value={customAmount}
                      onChange={(e) => { setCustomAmount(e.target.value); setAmount(null); }}
                      placeholder={t('amountCustomPlaceholder')}
                      className="w-full px-3.5 py-3 pr-12 rounded-xl border border-gray-200 text-base font-semibold text-gray-900 focus:ring-2 focus:border-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      style={{ '--tw-ring-color': `${p}40` } as React.CSSProperties}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">
                      {country === 'CH' ? 'CHF' : '€'}
                    </span>
                  </div>
                  {customAmount && (Number(customAmount) < GIFT_CARD_MIN_AMOUNT || Number(customAmount) > GIFT_CARD_MAX_AMOUNT) && (
                    <p className="text-xs text-rose-600 mb-2">
                      {Number(customAmount) < GIFT_CARD_MIN_AMOUNT ? t('amountMin') : t('amountMax')}
                    </p>
                  )}

                  <StickyCta
                    primary={p}
                    secondary={s}
                    onClick={goNext}
                    disabled={!canContinueAmount}
                    label={t('continue')}
                  />
                </motion.div>
              )}

              {/* STEP — SERVICES */}
              {step === 'services' && (
                <motion.div
                  key="services"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <p className="text-sm font-semibold text-gray-700 mb-1">{t('publicStepServicesTitle')}</p>
                  <p className="text-xs text-gray-500 mb-4">{t('publicStepServicesDesc')}</p>

                  <div className="space-y-4 mb-4">
                    {groupedServices.map(({ category, services: catServices }) => (
                      <div key={category?.id || 'uncategorized'}>
                        {category && (
                          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.14em] mb-2">
                            {category.name}
                          </p>
                        )}
                        <div className="space-y-1.5">
                          {catServices.map((svc) => {
                            const count = selectedServiceIds.filter((id) => id === svc.id).length;
                            const selected = count > 0;
                            return (
                              <button
                                key={svc.id}
                                type="button"
                                onClick={() => addService(svc.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all touch-manipulation ${
                                  selected ? 'border-2' : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                                }`}
                                style={selected ? { backgroundColor: `${p}10`, borderColor: p } : undefined}
                              >
                                <div
                                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                    selected ? 'text-white' : 'bg-white border-2 border-gray-300 text-gray-400'
                                  }`}
                                  style={selected ? { backgroundColor: p } : undefined}
                                >
                                  {selected ? (
                                    <span className="text-xs font-bold">{count}</span>
                                  ) : (
                                    <span className="text-base font-light leading-none">+</span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-900">{svc.name}</p>
                                  {svc.duration ? (
                                    <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                                      <Clock className="w-3 h-3" />
                                      {formatDuration(svc.duration, locale)}
                                    </p>
                                  ) : null}
                                </div>
                                <p className="text-sm font-bold text-gray-700 shrink-0">
                                  {svc.price_from && (
                                    <span className="text-[10px] font-normal text-gray-500">{t('priceFrom')} </span>
                                  )}
                                  {formatCurrency(Number(svc.price), country, 'fr')}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Sélection en cours */}
                  {selectedServiceIds.length > 0 && (
                    <div className="rounded-xl bg-gray-50 px-3.5 py-3 mb-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                        {t('selectedTitle', { count: selectedServiceIds.length })}
                      </p>
                      <div className="space-y-1.5">
                        {selectedServices.map((svc, idx) => (
                          <div key={`${svc.id}-${idx}`} className="flex items-center gap-2">
                            <span className="flex-1 text-[13px] text-gray-800 truncate">{svc.name}</span>
                            <span className="text-[13px] font-semibold text-gray-700 shrink-0 tabular-nums">
                              {formatCurrency(Number(svc.price), country, 'fr')}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeServiceAt(idx)}
                              className="w-6 h-6 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors touch-manipulation"
                              aria-label={t('remove')}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                        <span className="text-[13px] font-medium text-gray-600">{t('totalLabel')}</span>
                        <div className="text-right">
                          <p className="text-base font-bold text-gray-900 leading-tight tabular-nums">{amountFormatted}</p>
                          {totalDuration > 0 && (
                            <p className="text-[10px] text-gray-500">~{formatDuration(totalDuration, locale)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <StickyCta
                    primary={p}
                    secondary={s}
                    onClick={goNext}
                    disabled={!canContinueServices}
                    label={selectedServiceIds.length > 0 ? `${t('continue')} · ${amountFormatted}` : t('selectAtLeastOne')}
                  />
                </motion.div>
              )}

              {/* STEP — RECIPIENT */}
              {step === 'recipient' && (
                <motion.div
                  key="recipient"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <p className="text-sm font-semibold text-gray-700 mb-1">{t('publicStep2Title')}</p>
                  <p className="text-xs text-gray-500 mb-4">{t('recipientPhoneHint')}</p>

                  <div className="space-y-3.5">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                          {t('recipientFirstName')}
                        </label>
                        <input
                          type="text"
                          value={recipientFirstName}
                          onChange={(e) => setRecipientFirstName(e.target.value)}
                          placeholder={t('recipientFirstNamePlaceholder')}
                          maxLength={60}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-base text-gray-900 focus:ring-2 focus:border-transparent focus:outline-none"
                          style={{ '--tw-ring-color': `${p}40` } as React.CSSProperties}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                          {t('recipientLastName')}
                        </label>
                        <input
                          type="text"
                          value={recipientLastName}
                          onChange={(e) => setRecipientLastName(e.target.value)}
                          placeholder={t('recipientLastNamePlaceholder')}
                          maxLength={60}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-base text-gray-900 focus:ring-2 focus:border-transparent focus:outline-none"
                          style={{ '--tw-ring-color': `${p}40` } as React.CSSProperties}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        {t('recipientPhone')}
                      </label>
                      <PhoneInput
                        value={recipientPhone}
                        onChange={setRecipientPhone}
                        country={recipientCountry}
                        onCountryChange={setRecipientCountry}
                        countries={['FR', 'BE', 'CH']}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        {t('recipientEmail')}
                        <span className="text-gray-400 font-normal ml-1.5">{t('recipientEmailOptional')}</span>
                      </label>
                      <input
                        type="email"
                        value={recipientEmail}
                        onChange={(e) => { setRecipientEmail(e.target.value); setRecipientEmailSuggestion(''); }}
                        placeholder={t('recipientEmailPlaceholder')}
                        maxLength={255}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-base text-gray-900 focus:ring-2 focus:border-transparent focus:outline-none"
                        style={{ '--tw-ring-color': `${p}40` } as React.CSSProperties}
                      />
                      {recipientEmailSuggestion ? (
                        <p className="mt-1 text-[12px] text-amber-700">
                          {t('didYouMean')}{' '}
                          <button
                            type="button"
                            className="font-semibold underline hover:text-amber-900"
                            onClick={() => { setRecipientEmail(recipientEmailSuggestion); setRecipientEmailSuggestion(''); }}
                          >
                            {recipientEmailSuggestion}
                          </button>
                          {' '}?
                        </p>
                      ) : (
                        <p className="text-[11px] text-gray-500 mt-1">{t('recipientEmailHint')}</p>
                      )}
                    </div>
                  </div>

                  <StickyCta
                    primary={p}
                    secondary={s}
                    onClick={goNext}
                    disabled={!canContinueRecipient}
                    label={t('continue')}
                  />
                </motion.div>
              )}

              {/* STEP — SENDER */}
              {step === 'sender' && (
                <motion.div
                  key="sender"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <p className="text-sm font-semibold text-gray-700 mb-4">{t('publicStep3Title')}</p>

                  <div className="space-y-3.5">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                          {t('senderFirstName')}
                        </label>
                        <input
                          type="text"
                          value={senderFirstName}
                          onChange={(e) => setSenderFirstName(e.target.value)}
                          placeholder={t('senderFirstNamePlaceholder')}
                          maxLength={60}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-base text-gray-900 focus:ring-2 focus:border-transparent focus:outline-none"
                          style={{ '--tw-ring-color': `${p}40` } as React.CSSProperties}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                          {t('senderLastName')}
                        </label>
                        <input
                          type="text"
                          value={senderLastName}
                          onChange={(e) => setSenderLastName(e.target.value)}
                          placeholder={t('senderLastNamePlaceholder')}
                          maxLength={60}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-base text-gray-900 focus:ring-2 focus:border-transparent focus:outline-none"
                          style={{ '--tw-ring-color': `${p}40` } as React.CSSProperties}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        {t('senderPhone')}
                      </label>
                      <PhoneInput
                        value={senderPhone}
                        onChange={setSenderPhone}
                        country={senderCountry}
                        onCountryChange={setSenderCountry}
                        countries={['FR', 'BE', 'CH']}
                      />
                      <p className="text-[11px] text-gray-500 mt-1">{t('senderPhoneHint')}</p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        {t('senderEmail')}
                      </label>
                      <input
                        type="email"
                        value={senderEmail}
                        onChange={(e) => { setSenderEmail(e.target.value); setSenderEmailSuggestion(''); }}
                        placeholder={t('senderEmailPlaceholder')}
                        maxLength={255}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-base text-gray-900 focus:ring-2 focus:border-transparent focus:outline-none"
                        style={{ '--tw-ring-color': `${p}40` } as React.CSSProperties}
                      />
                      {senderEmailSuggestion ? (
                        <p className="mt-1 text-[12px] text-amber-700">
                          {t('didYouMean')}{' '}
                          <button
                            type="button"
                            className="font-semibold underline hover:text-amber-900"
                            onClick={() => { setSenderEmail(senderEmailSuggestion); setSenderEmailSuggestion(''); }}
                          >
                            {senderEmailSuggestion}
                          </button>
                          {' '}?
                        </p>
                      ) : (
                        <p className="text-[11px] text-gray-500 mt-1">{t('senderEmailHint')}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        {t('senderMessage')}
                        <span className="text-gray-400 font-normal ml-1.5">{t('senderMessageOptional')}</span>
                      </label>
                      <textarea
                        value={senderMessage}
                        onChange={(e) => setSenderMessage(e.target.value.slice(0, 300))}
                        placeholder={t('senderMessagePlaceholder')}
                        rows={3}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-base text-gray-900 focus:ring-2 focus:border-transparent focus:outline-none resize-none"
                        style={{ '--tw-ring-color': `${p}40` } as React.CSSProperties}
                      />
                      <p className="text-[10px] text-gray-400 mt-1 text-right">
                        {t('senderMessageMax', { count: senderMessage.length })}
                      </p>
                    </div>

                    {/* Date d'envoi planifiée (optionnel) */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        {t('scheduledSendAtLabel')}
                        <span className="text-gray-400 font-normal ml-1.5">{t('senderMessageOptional')}</span>
                      </label>
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}
                        max={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-base text-gray-900 focus:ring-2 focus:border-transparent focus:outline-none"
                        style={{ '--tw-ring-color': `${p}40` } as React.CSSProperties}
                      />
                      <p className="text-[11px] text-gray-500 mt-1">{t('scheduledSendAtHint')}</p>
                    </div>
                  </div>

                  <StickyCta
                    primary={p}
                    secondary={s}
                    onClick={goNext}
                    disabled={!canContinueSender}
                    label={t('continue')}
                  />
                </motion.div>
              )}

              {/* STEP — RECAP */}
              {step === 'recap' && (
                <motion.div
                  key="recap"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <p className="text-sm font-semibold text-gray-700 mb-3">{t('publicStep4Title')}</p>

                  {/* Mini preview "papier cadeau" */}
                  <GiftCardPreview
                    primaryColor={p}
                    secondaryColor={s}
                    shopName={shopName}
                    kind={kind}
                    amountFormatted={amountFormatted}
                    services={selectedServices}
                    recipientFirstName={recipientFirstName}
                    senderFirstName={senderFirstName}
                  />

                  <div className="space-y-2.5 px-1 mt-4 mb-4">
                    <RecapLine label={t('toLabel')} value={`${recipientFirstName} ${recipientLastName} · ${recipientPhone}`} />
                    <RecapLine label={t('fromLabel')} value={`${senderFirstName} ${senderLastName} · ${senderEmail}`} />
                    {scheduledDate && (
                      <RecapLine
                        label={t('scheduledSendAtLabel')}
                        value={new Date(`${scheduledDate}T09:00:00`).toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      />
                    )}
                    {senderMessage && (
                      <RecapLine label={t('messageLabel')} value={`« ${senderMessage} »`} italic />
                    )}
                  </div>

                  {error && (
                    <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-800 mb-4">
                      {error}
                    </div>
                  )}

                  <p className="text-[11px] text-gray-500 leading-relaxed bg-gray-50 rounded-xl px-3.5 py-2.5 mb-2">
                    {t('successInstr2')} · {t('successInstr3', { code: '[ta référence]' })}
                  </p>

                  <p className="text-[11px] text-gray-400 leading-relaxed mb-2 px-1">
                    {t('validityNote')}
                  </p>

                  <StickyCta
                    primary={p}
                    secondary={s}
                    onClick={goNext}
                    disabled={submitting}
                    label={submitting ? t('submitting') : t('submit')}
                    submitting={submitting}
                  />
                </motion.div>
              )}

              {/* STEP — SUCCESS */}
              {step === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-2"
                >
                  <div
                    className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${p} 0%, ${s} 100%)` }}
                  >
                    <Check className="w-6 h-6 text-white" strokeWidth={3} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1.5">{t('successTitle')}</h2>
                  <p className="text-[13px] text-gray-600 leading-relaxed mb-5 max-w-sm mx-auto">
                    {t('successBody', { shopName, recipient: recipientFirstName })}
                  </p>

                  <div className="text-left bg-amber-50 border border-amber-100 rounded-xl p-3.5 mb-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800 mb-2">
                      {t('successPaymentInstr')}
                    </p>
                    <ol className="space-y-1.5 text-[13px] text-amber-900">
                      <li className="flex gap-2"><span className="font-bold">1.</span><span>{t('successInstr1')}</span></li>
                      <li className="flex gap-2"><span className="font-bold">2.</span><span>{t('successInstr2')}</span></li>
                      <li className="flex gap-2"><span className="font-bold">3.</span><span>{t('successInstr3', { code: t('codeLabel').toLowerCase() })}</span></li>
                    </ol>
                  </div>

                  <button
                    onClick={onClose}
                    className="w-full px-5 py-3 rounded-xl text-white text-sm font-bold transition-opacity hover:opacity-90 touch-manipulation"
                    style={{ background: `linear-gradient(135deg, ${p} 0%, ${s} 100%)` }}
                  >
                    {t('successClose')}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================================
// Sub-components
// ============================================================

function StickyCta({
  primary, secondary, onClick, disabled = false, label, submitting = false,
}: {
  primary: string;
  secondary: string;
  onClick: () => void;
  disabled?: boolean;
  label: string;
  submitting?: boolean;
}) {
  return (
    <div className="sticky bottom-0 -mx-5 -mb-5 mt-4 px-5 py-3 bg-white/95 backdrop-blur-sm border-t border-gray-100">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 touch-manipulation"
        style={{ background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)` }}
      >
        {submitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : null}
        <span>{label}</span>
        {!submitting && <ChevronRight className="w-4 h-4" />}
      </button>
    </div>
  );
}

function KindCard({
  selected, onClick, icon, title, description, primaryColor,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  primaryColor: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl p-3.5 transition-all touch-manipulation flex items-start gap-3 ${
        selected ? 'border-2' : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
      }`}
      style={selected ? { backgroundColor: `${primaryColor}10`, borderColor: primaryColor } : undefined}
    >
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
          selected ? 'text-white' : 'bg-white text-gray-500'
        }`}
        style={selected ? { backgroundColor: primaryColor } : undefined}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 leading-tight">{title}</p>
        <p className="text-[12px] text-gray-500 mt-0.5 leading-snug">{description}</p>
      </div>
      <div
        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
          selected ? 'border-transparent text-white' : 'border-gray-300'
        }`}
        style={selected ? { backgroundColor: primaryColor } : undefined}
      >
        {selected && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
      </div>
    </button>
  );
}

function RecapLine({ label, value, italic = false }: { label: string; value: string; italic?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</span>
      <span className={`text-[13px] text-gray-800 ${italic ? 'italic' : 'font-medium'}`}>{value}</span>
    </div>
  );
}

/**
 * Carte cadeau preview "papier cadeau premium" — distinct du palier 2.
 * Fond ivoire texturé, liseré or, typo serif élégante pour le montant/prestation,
 * sceau "BON CADEAU" en haut, gradient merchant subtil en background.
 */
function GiftCardPreview({
  primaryColor, secondaryColor, shopName, kind, amountFormatted, services, recipientFirstName, senderFirstName,
}: {
  primaryColor: string;
  secondaryColor: string;
  shopName: string;
  kind: 'amount' | 'services';
  amountFormatted: string;
  services: Service[];
  recipientFirstName: string;
  senderFirstName: string;
}) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden p-6 text-center"
      style={{
        background: `
          linear-gradient(135deg, ${primaryColor}06 0%, ${secondaryColor}10 100%),
          radial-gradient(ellipse at top, #fefcf6 0%, #fdf9ee 100%)
        `,
        boxShadow: `inset 0 0 0 1px ${primaryColor}25, 0 8px 24px -8px ${primaryColor}30`,
      }}
    >
      {/* Liseré décoratif */}
      <div
        className="absolute inset-2 rounded-xl pointer-events-none"
        style={{ border: `1px dashed ${primaryColor}40` }}
      />

      {/* Sceau */}
      <div className="relative">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-3" style={{ backgroundColor: `${primaryColor}12` }}>
          <Sparkles className="w-3 h-3" style={{ color: primaryColor }} />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: primaryColor }}>
            Bon cadeau
          </span>
        </div>

        {/* Contenu : montant ou prestations */}
        {kind === 'services' ? (
          <>
            <div className="space-y-0.5 mb-3 px-2">
              {services.map((sv, idx) => (
                <p
                  key={`${sv.id}-${idx}`}
                  className="text-base font-serif text-gray-900 leading-tight"
                  style={{ fontFamily: 'Georgia, "Cormorant Garamond", serif' }}
                >
                  {sv.name}
                </p>
              ))}
            </div>
            <p className="text-[11px] text-gray-500 italic">Valeur {amountFormatted}</p>
          </>
        ) : (
          <p
            className="text-5xl font-serif text-gray-900 mb-3 tracking-tight"
            style={{ fontFamily: 'Georgia, "Cormorant Garamond", serif' }}
          >
            {amountFormatted}
          </p>
        )}

        <div className="flex items-center justify-center gap-2 text-[11px] text-gray-500">
          <span className="h-px w-6" style={{ backgroundColor: `${primaryColor}40` }} />
          <span style={{ color: primaryColor }} className="font-semibold uppercase tracking-wider text-[10px]">
            {shopName}
          </span>
          <span className="h-px w-6" style={{ backgroundColor: `${primaryColor}40` }} />
        </div>

        {recipientFirstName && senderFirstName && (
          <p className="mt-3 text-[11px] text-gray-500 italic">
            Pour {recipientFirstName}, de la part de {senderFirstName}
          </p>
        )}
      </div>

      {/* Gift icon watermark décoratif */}
      <Gift
        className="absolute -bottom-2 -right-2 w-16 h-16 opacity-[0.06]"
        style={{ color: primaryColor }}
      />
    </div>
  );
}
