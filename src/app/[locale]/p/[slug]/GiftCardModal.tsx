'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, ArrowLeft, Loader2, Check, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { formatCurrency } from '@/lib/utils';
import {
  GIFT_CARD_MIN_AMOUNT,
  GIFT_CARD_MAX_AMOUNT,
  GIFT_CARD_DEFAULT_AMOUNTS,
  parseGiftCardAmounts,
} from '@/lib/gift-cards';
import type { MerchantCountry } from '@/types';

type Step = 'amount' | 'recipient' | 'sender' | 'recap' | 'success';

interface GiftCardModalProps {
  open: boolean;
  onClose: () => void;
  merchantId: string;
  shopName: string;
  primaryColor: string;
  secondaryColor: string;
  defaultCountry: MerchantCountry;
  amounts: number[] | null;     // depuis merchant.gift_card_amounts (JSONB)
  introMessage: string | null;  // merchant.gift_card_message
  isDemo?: boolean;
}

export default function GiftCardModal({
  open, onClose, merchantId, shopName, primaryColor, secondaryColor,
  defaultCountry, amounts, introMessage, isDemo = false,
}: GiftCardModalProps) {
  const t = useTranslations('giftCards');

  const [step, setStep] = useState<Step>('amount');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: amount
  const [amount, setAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');

  // Step 2: recipient
  const [recipientFirstName, setRecipientFirstName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientCountry, setRecipientCountry] = useState<MerchantCountry>(defaultCountry);
  const [recipientEmail, setRecipientEmail] = useState('');

  // Step 3: sender
  const [senderFirstName, setSenderFirstName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderCountry, setSenderCountry] = useState<MerchantCountry>(defaultCountry);
  const [senderEmail, setSenderEmail] = useState('');
  const [senderMessage, setSenderMessage] = useState('');

  const suggestedAmounts = useMemo(
    () => parseGiftCardAmounts(amounts ?? GIFT_CARD_DEFAULT_AMOUNTS),
    [amounts],
  );

  const country = defaultCountry || 'FR';
  const finalAmount = amount ?? Number(customAmount) ?? 0;
  const amountFormatted = useMemo(
    () => formatCurrency(finalAmount, country, 'fr', 0),
    [finalAmount, country],
  );

  // Reset état à chaque ouverture
  useEffect(() => {
    if (open) {
      setStep('amount');
      setAmount(null);
      setCustomAmount('');
      setRecipientFirstName('');
      setRecipientPhone('');
      setRecipientCountry(defaultCountry);
      setRecipientEmail('');
      setSenderFirstName('');
      setSenderPhone('');
      setSenderCountry(defaultCountry);
      setSenderEmail('');
      setSenderMessage('');
      setError(null);
      setSubmitting(false);
    }
  }, [open, defaultCountry]);

  const canContinueStep1 = finalAmount >= GIFT_CARD_MIN_AMOUNT && finalAmount <= GIFT_CARD_MAX_AMOUNT;
  const canContinueStep2 = recipientFirstName.trim().length > 0 && recipientPhone.trim().length >= 6;
  const canContinueStep3 = senderFirstName.trim().length > 0
    && senderPhone.trim().length >= 6
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail.trim());

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
          amount: finalAmount,
          sender_first_name: senderFirstName.trim(),
          sender_phone: senderPhone.trim(),
          sender_phone_country: senderCountry,
          sender_email: senderEmail.trim(),
          sender_message: senderMessage.trim() || null,
          recipient_first_name: recipientFirstName.trim(),
          recipient_phone: recipientPhone.trim(),
          recipient_phone_country: recipientCountry,
          recipient_email: recipientEmail.trim() || null,
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
    isDemo, merchantId, finalAmount, senderFirstName, senderPhone, senderCountry,
    senderEmail, senderMessage, recipientFirstName, recipientPhone, recipientCountry,
    recipientEmail, t,
  ]);

  if (!open) return null;

  const stepIndex = step === 'amount' ? 0 : step === 'recipient' ? 1 : step === 'sender' ? 2 : 3;

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          key="panel"
          initial={{ y: 30, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 30, opacity: 0, scale: 0.98 }}
          transition={{ type: 'spring', damping: 32, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:max-w-lg bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden"
        >
          {/* Header gradient merchant */}
          <header
            className="relative px-5 py-5 sm:py-6"
            style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` }}
          >
            <div className="flex items-center justify-between">
              {step !== 'success' && step !== 'amount' ? (
                <button
                  onClick={() => {
                    setError(null);
                    setStep(step === 'recap' ? 'sender' : step === 'sender' ? 'recipient' : 'amount');
                  }}
                  className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors touch-manipulation"
                  aria-label={t('back')}
                >
                  <ArrowLeft className="w-4 h-4 text-white" />
                </button>
              ) : (
                <div className="w-9 h-9" />
              )}

              <div className="flex items-center gap-2 text-white/90">
                <Gift className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-[0.18em]">
                  {t('publicTitle')}
                </span>
              </div>

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors touch-manipulation"
                aria-label="Fermer"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {step !== 'success' && (
              <>
                {/* Progress dots */}
                <div className="flex justify-center gap-1.5 mt-4">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === stepIndex
                          ? 'w-8 bg-white'
                          : i < stepIndex
                          ? 'w-1.5 bg-white/80'
                          : 'w-1.5 bg-white/30'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </header>

          {/* Body scroll */}
          <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
            {/* STEP 1 — AMOUNT */}
            {step === 'amount' && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">{t('publicStep1Title')}</h2>
                  <p className="text-sm text-gray-500">
                    {t('publicDesc', { shopName })}
                  </p>
                  {introMessage && (
                    <p className="text-sm text-gray-700 italic mt-3 bg-gray-50 rounded-xl px-4 py-3">
                      {introMessage}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2.5">
                    {t('amountSuggestion')}
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {suggestedAmounts.map((a) => {
                      const active = amount === a;
                      return (
                        <button
                          key={a}
                          type="button"
                          onClick={() => { setAmount(a); setCustomAmount(''); }}
                          className={`px-4 py-4 rounded-2xl border-2 text-center transition-all touch-manipulation ${
                            active
                              ? 'text-white shadow-lg shadow-black/10'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                          style={active ? {
                            borderColor: primaryColor,
                            background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                          } : undefined}
                        >
                          <span className={`block text-2xl font-bold ${active ? 'text-white' : 'text-gray-900'}`}>
                            {formatCurrency(a, country, 'fr', 0)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                    {t('amountCustom')}
                  </p>
                  <div className="relative">
                    <input
                      type="number"
                      min={GIFT_CARD_MIN_AMOUNT}
                      max={GIFT_CARD_MAX_AMOUNT}
                      value={customAmount}
                      onChange={(e) => { setCustomAmount(e.target.value); setAmount(null); }}
                      placeholder={t('amountCustomPlaceholder')}
                      className="w-full px-4 py-3.5 pr-12 rounded-xl border-2 border-gray-200 text-lg font-semibold text-gray-900 focus:border-gray-900 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">
                      {country === 'CH' ? 'CHF' : '€'}
                    </span>
                  </div>
                  {customAmount && (Number(customAmount) < GIFT_CARD_MIN_AMOUNT || Number(customAmount) > GIFT_CARD_MAX_AMOUNT) && (
                    <p className="text-xs text-rose-600 mt-1.5">
                      {Number(customAmount) < GIFT_CARD_MIN_AMOUNT ? t('amountMin') : t('amountMax')}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2 — RECIPIENT */}
            {step === 'recipient' && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold text-gray-900 mb-1">{t('publicStep2Title')}</h2>
                <p className="text-sm text-gray-500 -mt-3">
                  {t('recipientPhoneHint')}
                </p>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {t('recipientFirstName')}
                  </label>
                  <input
                    type="text"
                    value={recipientFirstName}
                    onChange={(e) => setRecipientFirstName(e.target.value)}
                    placeholder={t('recipientFirstNamePlaceholder')}
                    maxLength={60}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-base text-gray-900 focus:border-gray-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
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
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {t('recipientEmail')}
                    <span className="text-gray-400 font-normal ml-1.5">{t('recipientEmailOptional')}</span>
                  </label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder={t('recipientEmailPlaceholder')}
                    maxLength={255}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-base text-gray-900 focus:border-gray-900 focus:outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">{t('recipientEmailHint')}</p>
                </div>
              </div>
            )}

            {/* STEP 3 — SENDER */}
            {step === 'sender' && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold text-gray-900 mb-1">{t('publicStep3Title')}</h2>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {t('senderFirstName')}
                  </label>
                  <input
                    type="text"
                    value={senderFirstName}
                    onChange={(e) => setSenderFirstName(e.target.value)}
                    placeholder={t('senderFirstNamePlaceholder')}
                    maxLength={60}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-base text-gray-900 focus:border-gray-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {t('senderPhone')}
                  </label>
                  <PhoneInput
                    value={senderPhone}
                    onChange={setSenderPhone}
                    country={senderCountry}
                    onCountryChange={setSenderCountry}
                    countries={['FR', 'BE', 'CH']}
                  />
                  <p className="text-xs text-gray-500 mt-1.5">{t('senderPhoneHint')}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {t('senderEmail')}
                  </label>
                  <input
                    type="email"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder={t('senderEmailPlaceholder')}
                    maxLength={255}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-base text-gray-900 focus:border-gray-900 focus:outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">{t('senderEmailHint')}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {t('senderMessage')}
                    <span className="text-gray-400 font-normal ml-1.5">{t('senderMessageOptional')}</span>
                  </label>
                  <textarea
                    value={senderMessage}
                    onChange={(e) => setSenderMessage(e.target.value.slice(0, 300))}
                    placeholder={t('senderMessagePlaceholder')}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-base text-gray-900 focus:border-gray-900 focus:outline-none resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">
                    {t('senderMessageMax', { count: senderMessage.length })}
                  </p>
                </div>
              </div>
            )}

            {/* STEP 4 — RECAP */}
            {step === 'recap' && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold text-gray-900 mb-1">{t('publicStep4Title')}</h2>

                {/* Mini carte cadeau preview */}
                <div
                  className="rounded-3xl p-6 text-center text-white shadow-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                    boxShadow: `0 20px 40px -12px ${primaryColor}66`,
                  }}
                >
                  <Sparkles className="w-5 h-5 mx-auto mb-2 opacity-80" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-90 mb-2">
                    {t('publicTitle')}
                  </p>
                  <p className="text-5xl font-bold tracking-tight mb-2">{amountFormatted}</p>
                  <p className="text-sm opacity-95">{shopName}</p>
                </div>

                {/* Détails récap */}
                <div className="space-y-3 px-1">
                  <RecapLine label={t('toLabel')} value={`${recipientFirstName} · ${recipientPhone}`} />
                  <RecapLine label={t('fromLabel')} value={`${senderFirstName} · ${senderEmail}`} />
                  {senderMessage && (
                    <RecapLine label={t('messageLabel')} value={`« ${senderMessage} »`} italic />
                  )}
                </div>

                {error && (
                  <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-800">
                    {error}
                  </div>
                )}

                <p className="text-xs text-gray-500 leading-relaxed bg-gray-50 rounded-xl px-4 py-3">
                  {t('successInstr2')} · {t('successInstr3', { code: '[ta référence]' })}
                </p>
              </div>
            )}

            {/* STEP 5 — SUCCESS */}
            {step === 'success' && (
              <div className="text-center py-6">
                <div
                  className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` }}
                >
                  <Check className="w-8 h-8 text-white" strokeWidth={3} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('successTitle')}</h2>
                <p className="text-sm text-gray-600 leading-relaxed mb-6 max-w-sm mx-auto">
                  {t('successBody', { shopName, recipient: recipientFirstName })}
                </p>

                <div className="text-left bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 mb-5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800 mb-2.5">
                    {t('successPaymentInstr')}
                  </p>
                  <ol className="space-y-2 text-sm text-amber-900">
                    <li className="flex gap-2">
                      <span className="font-bold">1.</span>
                      <span>{t('successInstr1')}</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold">2.</span>
                      <span>{t('successInstr2')}</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold">3.</span>
                      <span>{t('successInstr3', { code: t('codeLabel').toLowerCase() })}</span>
                    </li>
                  </ol>
                </div>

                <button
                  onClick={onClose}
                  className="w-full px-5 py-3.5 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90 touch-manipulation"
                  style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` }}
                >
                  {t('successClose')}
                </button>
              </div>
            )}
          </div>

          {/* Footer CTA — caché sur success */}
          {step !== 'success' && (
            <footer className="px-5 py-4 border-t border-gray-100 bg-white">
              <button
                onClick={() => {
                  setError(null);
                  if (step === 'amount' && canContinueStep1) setStep('recipient');
                  else if (step === 'recipient' && canContinueStep2) setStep('sender');
                  else if (step === 'sender' && canContinueStep3) setStep('recap');
                  else if (step === 'recap') submit();
                }}
                disabled={
                  submitting ||
                  (step === 'amount' && !canContinueStep1) ||
                  (step === 'recipient' && !canContinueStep2) ||
                  (step === 'sender' && !canContinueStep3)
                }
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-white text-base font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 touch-manipulation"
                style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('submitting')}
                  </>
                ) : step === 'recap' ? (
                  t('submit')
                ) : (
                  t('continue')
                )}
              </button>
            </footer>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function RecapLine({ label, value, italic = false }: { label: string; value: string; italic?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</span>
      <span className={`text-sm text-gray-800 ${italic ? 'italic' : 'font-medium'}`}>{value}</span>
    </div>
  );
}
