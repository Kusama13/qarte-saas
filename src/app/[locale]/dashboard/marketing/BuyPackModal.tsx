'use client';

import { useState } from 'react';
import { X, ShoppingCart, Loader2, CheckCircle2, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface BuyPackModalProps {
  open: boolean;
  onClose: () => void;
}

interface Pack {
  size: 50 | 100 | 150 | 200 | 250;
  ht: number;
  ttc: number;
  popular?: boolean;
}

const PACKS: Pack[] = [
  { size: 50, ht: 3.75, ttc: 5.70 },
  { size: 100, ht: 7.50, ttc: 9.00 },
  { size: 150, ht: 11.25, ttc: 13.50, popular: true },
  { size: 200, ht: 15.00, ttc: 18.00 },
  { size: 250, ht: 18.75, ttc: 22.50 },
];

// Processing fee: always 1€ HT → 1.20€ TTC. Totals shown include it.
const PACKS_WITH_FEE = PACKS.map((p) => ({
  ...p,
  htWithFee: p.ht + 1,
  ttcWithFee: +(p.ttc + 1.2).toFixed(2),
}));

export default function BuyPackModal({ open, onClose }: BuyPackModalProps) {
  const t = useTranslations('marketing.buyPack');
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleBuy = async (size: number) => {
    setLoading(size);
    setError(null);
    try {
      const res = await fetch('/api/stripe/sms-pack/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packSize: size }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || t('errorGeneric'));
        setLoading(null);
      }
    } catch {
      setError(t('errorGeneric'));
      setLoading(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-[#4b0082]" />
            <h2 className="text-base font-bold text-gray-900">{t('title')}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

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
                onClick={() => handleBuy(p.size)}
                disabled={loading !== null}
                className={`w-full flex items-center justify-between gap-2 sm:gap-3 p-3 rounded-xl border-2 transition-all ${
                  p.popular
                    ? 'border-[#4b0082] bg-[#4b0082]/[0.04]'
                    : 'border-gray-200 bg-white hover:border-[#4b0082]/40'
                } disabled:opacity-50`}
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
                      {p.popular && (
                        <span className="text-[9px] font-bold text-[#4b0082] bg-[#4b0082]/10 px-1.5 py-0.5 rounded-full uppercase tracking-wide whitespace-nowrap">
                          {t('popular')}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 truncate">
                      {p.ht.toFixed(2)}€ + 1€ = <span className="font-semibold">{p.htWithFee.toFixed(2)}€ HT</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-right shrink-0">
                  <div>
                    <p className="text-base font-bold text-gray-900">{p.ttcWithFee.toFixed(2)}€</p>
                    <p className="text-[10px] text-gray-400">TTC</p>
                  </div>
                  {loading === p.size && <Loader2 className="w-4 h-4 animate-spin text-[#4b0082]" />}
                </div>
              </button>
            ))}
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
              {error}
            </div>
          )}

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
      </div>
    </div>
  );
}
