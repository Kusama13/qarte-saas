'use client';

import { useState } from 'react';
import { X, ShoppingCart, Loader2, CheckCircle2, Info, ArrowLeft, ChevronRight, Gift } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PACK_SIZES, PACK_TTC_CENTS, PROCESSING_FEE_TTC_CENTS, VAT_RATE, getBonusSms, type PackSize } from '@/lib/sms-pack-pricing';

interface BuyPackModalProps {
  open: boolean;
  onClose: () => void;
}

const FEE_TTC = PROCESSING_FEE_TTC_CENTS / 100; // 1€

// Prix TTC envoyés directement à Stripe. Source unique : src/lib/sms-pack-pricing.ts.
const PACKS_WITH_FEE = PACK_SIZES.map((size: PackSize) => {
  const totalTtc = PACK_TTC_CENTS[size] / 100;
  const smsTtc = totalTtc - FEE_TTC;
  return {
    size,
    smsTtc: +smsTtc.toFixed(2),
    totalTtc: +totalTtc.toFixed(2),
    vatAmount: +(totalTtc - totalTtc / (1 + VAT_RATE)).toFixed(2),
    bonusSms: getBonusSms(size),
    popular: size === 150,
  };
});

type PackWithFee = (typeof PACKS_WITH_FEE)[number];

export default function BuyPackModal({ open, onClose }: BuyPackModalProps) {
  const t = useTranslations('marketing.buyPack');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingPack, setConfirmingPack] = useState<PackWithFee | null>(null);

  if (!open) return null;

  const handleSelect = (pack: PackWithFee) => {
    setError(null);
    setConfirmingPack(pack);
  };

  const handleBack = () => {
    setError(null);
    setConfirmingPack(null);
  };

  const handleConfirm = async () => {
    if (!confirmingPack) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/sms-pack/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packSize: confirmingPack.size }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || t('errorGeneric'));
        setSubmitting(false);
      }
    } catch {
      setError(t('errorGeneric'));
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={submitting ? undefined : onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {confirmingPack ? (
              <button
                onClick={handleBack}
                disabled={submitting}
                className="p-1 -ml-1 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-50"
                aria-label={t('back')}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <ShoppingCart className="w-5 h-5 text-[#4b0082]" />
            )}
            <h2 className="text-base font-bold text-gray-900">
              {confirmingPack ? t('confirmTitle') : t('title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-50"
            aria-label={t('close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Étape 1 : sélection */}
        {!confirmingPack && (
          <div className="p-5 space-y-3">
            <p className="text-sm text-gray-600">{t('subtitle')}</p>

            <div className="rounded-xl bg-indigo-50/50 border border-indigo-100 p-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <p className="text-xs text-indigo-800 leading-relaxed">{t('feeNotice')}</p>
            </div>

            <div className="space-y-2 pt-1">
              {PACKS_WITH_FEE.map((p) => (
                <button
                  key={p.size}
                  onClick={() => handleSelect(p)}
                  className={`w-full flex items-center justify-between gap-2 sm:gap-3 p-3 rounded-xl border-2 transition-all ${
                    p.popular
                      ? 'border-[#4b0082] bg-[#4b0082]/[0.04]'
                      : 'border-gray-200 bg-white hover:border-[#4b0082]/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                      p.popular ? 'bg-[#4b0082] text-white' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {p.size}
                    </div>
                    <div className="text-left min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-bold text-gray-900">{t('packLabel', { count: p.size })}</p>
                        {p.bonusSms > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full uppercase tracking-wide whitespace-nowrap">
                            <Gift className="w-2.5 h-2.5" />
                            +{p.bonusSms} {t('bonusBadge')}
                          </span>
                        )}
                        {p.popular && (
                          <span className="text-[9px] font-bold text-[#4b0082] bg-[#4b0082]/10 px-1.5 py-0.5 rounded-full uppercase tracking-wide whitespace-nowrap">
                            {t('popular')}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 truncate">
                        {p.bonusSms > 0
                          ? t('packLineWithBonus', { total: p.size + p.bonusSms })
                          : t('packLineHint')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-right shrink-0">
                    <div>
                      <p className="text-base font-bold text-gray-900">{p.totalTtc.toFixed(2)}€</p>
                      <p className="text-[10px] text-gray-400">{t('ttcLabel')}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </button>
              ))}
            </div>

            <ul className="space-y-1.5 pt-2 text-xs text-gray-500">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>{t('benefit1')}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>{t('benefit2')}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>{t('benefit3')}</span>
              </li>
            </ul>
          </div>
        )}

        {/* Étape 2 : confirmation avec TVA détaillée */}
        {confirmingPack && (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#4b0082]/[0.04] border border-[#4b0082]/20">
              <div className="w-12 h-12 rounded-xl bg-[#4b0082] text-white flex items-center justify-center font-bold text-base shrink-0">
                {confirmingPack.size}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">{t('packLabel', { count: confirmingPack.size })}</p>
                <p className="text-xs text-gray-600">{t('confirmPackHint')}</p>
              </div>
            </div>

            {confirmingPack.bonusSms > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
                <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <Gift className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-emerald-800">
                    {t('bonusOffered', { count: confirmingPack.bonusSms })}
                  </p>
                  <p className="text-[11px] text-emerald-700">
                    {t('bonusOfferedSub', { total: confirmingPack.size + confirmingPack.bonusSms })}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between text-gray-600">
                <span>{t('lineSms', { count: confirmingPack.size })}</span>
                <span className="font-medium text-gray-700">{confirmingPack.smsTtc.toFixed(2)}€</span>
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <span>{t('lineFee')}</span>
                <span className="font-medium text-gray-700">{FEE_TTC.toFixed(2)}€</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <span className="text-base font-bold text-gray-900">{t('lineTotalTtc')}</span>
                <span className="text-xl font-bold text-[#4b0082]">{confirmingPack.totalTtc.toFixed(2)}€</span>
              </div>
              <p className="text-[11px] text-gray-400 text-right pt-1">
                {t('vatIncludedNote', { amount: confirmingPack.vatAmount.toFixed(2) })}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
              <p className="text-xs text-gray-600 leading-relaxed">{t('confirmInfo')}</p>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                {error}
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-1">
              <button
                onClick={handleBack}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {t('back')}
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#4b0082] text-white font-bold text-sm hover:bg-[#3d006b] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('redirecting')}
                  </>
                ) : (
                  t('confirmCta', { amount: confirmingPack.totalTtc.toFixed(2) })
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
