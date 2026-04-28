'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { MessageSquareText, ShoppingCart, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { SMS_FREE_QUOTA } from '@/lib/sms-constants';
import { toBCP47, formatCurrency } from '@/lib/utils';
import type { SmsPackPurchase } from '@/types';

interface SmsUsage {
  sent: number;
  remaining: number;
  packBalance: number;
  periodStart: string;
  quota: number;
}

interface SmsBalancePanelProps {
  merchantId?: string;
  onBuyPack?: () => void;
}

export default function SmsBalancePanel({ merchantId, onBuyPack }: SmsBalancePanelProps) {
  const t = useTranslations('marketing.smsBalance');
  const locale = useLocale();
  const [usage, setUsage] = useState<SmsUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [purchases, setPurchases] = useState<SmsPackPurchase[] | null>(null);
  const [purchasesLoading, setPurchasesLoading] = useState(false);

  const toggleHistory = async () => {
    const next = !historyOpen;
    setHistoryOpen(next);
    if (next && purchases === null) {
      setPurchasesLoading(true);
      try {
        const res = await fetch('/api/sms/pack-purchases');
        if (res.ok) {
          const data = await res.json();
          setPurchases(data.purchases || []);
        } else {
          setPurchases([]);
        }
      } catch {
        setPurchases([]);
      } finally {
        setPurchasesLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!merchantId) return;
    let cancelled = false;
    (async () => {
      let fallback = { sent: 0, remaining: SMS_FREE_QUOTA, packBalance: 0, periodStart: '', quota: SMS_FREE_QUOTA };
      try {
        const res = await fetch(`/api/sms/usage?merchantId=${merchantId}`);
        if (res.ok) {
          const data = await res.json();
          fallback = {
            sent: Number(data.sent || 0),
            remaining: Number(data.remaining || 0),
            packBalance: Number(data.packBalance || 0),
            periodStart: String(data.periodStart || ''),
            quota: Number(data.quota || SMS_FREE_QUOTA),
          };
        }
      } catch {
        /* keep fallback */
      } finally {
        if (!cancelled) {
          setUsage(fallback);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [merchantId]);

  if (loading || !usage) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-4 md:p-5 shadow-sm mb-4">
        <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
        <div className="mt-3 h-2 w-full bg-gray-100 rounded-full animate-pulse" />
      </div>
    );
  }

  const percent = Math.min(100, Math.round((usage.sent / usage.quota) * 100));
  const quotaDepleted = usage.remaining === 0;
  const packEmpty = usage.packBalance === 0;
  const blocked = quotaDepleted && packEmpty;
  // Warning visuel uniquement si pas de pack en backup (sinon on bascule en silence dessus)
  const warning = percent >= 80 && !blocked && packEmpty;

  const barColor = blocked
    ? 'bg-red-500'
    : warning
      ? 'bg-amber-500'
      : 'bg-emerald-500';

  const cardStyle = blocked
    ? 'border-red-200 bg-red-50'
    : warning
      ? 'border-amber-200 bg-amber-50'
      : 'border-gray-100 bg-white';

  return (
    <div className={`rounded-2xl border ${cardStyle} p-4 md:p-5 shadow-sm mb-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <MessageSquareText className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-bold text-gray-800">{t('title')}</span>
        </div>
        <button
          onClick={onBuyPack}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#4b0082] rounded-lg hover:bg-[#3a0063] transition-colors"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          {t('buyPack')}
        </button>
      </div>

      <div className="mt-3">
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-xs text-gray-500">
            {t('includedUsage', { sent: usage.sent, quota: usage.quota })}
          </span>
          <span className="text-xs font-semibold text-gray-700">{percent}%</span>
        </div>
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} transition-all`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-gray-500">
          {t('packBalance', { balance: usage.packBalance })}
        </span>
      </div>

      {blocked && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-red-100 p-2.5 text-xs text-red-800">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="font-medium">{t('blockedMessage')}</span>
        </div>
      )}
      {warning && !blocked && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-100 p-2.5 text-xs text-amber-800">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="font-medium">{t('warningMessage')}</span>
        </div>
      )}

      {/* Fetch lazy au premier toggle — économise un appel pour les merchants qui ne consultent jamais leur historique. */}
      <button
        onClick={toggleHistory}
        className="mt-3 w-full flex items-center justify-between text-[11px] font-semibold text-gray-500 hover:text-gray-700 transition-colors"
      >
        <span>{t('historyToggle')}</span>
        {historyOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      {historyOpen && (
        <div className="mt-2 space-y-1.5">
          {purchasesLoading && (
            <div className="h-6 w-full bg-gray-100 rounded animate-pulse" />
          )}
          {!purchasesLoading && purchases && purchases.length === 0 && (
            <p className="text-[11px] text-gray-400 italic py-2">{t('historyEmpty')}</p>
          )}
          {!purchasesLoading && purchases && purchases.map((p) => {
            const date = p.paid_at || p.created_at;
            const dateLabel = date ? new Date(date).toLocaleDateString(toBCP47(locale), { day: 'numeric', month: 'short', year: 'numeric' }) : '';
            return (
              <div key={p.id} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-white border border-gray-100">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${p.status === 'refunded' ? 'bg-orange-400' : 'bg-emerald-500'}`} />
                  <span className="font-medium text-gray-800">{p.pack_size} SMS</span>
                  <span className="text-gray-400 truncate">· {dateLabel}</span>
                  {p.status === 'refunded' && (
                    <span className="shrink-0 text-[10px] font-semibold uppercase text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">{t('historyRefunded')}</span>
                  )}
                </div>
                <span className="text-gray-700 font-semibold shrink-0">{formatCurrency(Number(p.amount_ttc_cents || 0) / 100, undefined, locale)}</span>
              </div>
            );
          })}
          {!purchasesLoading && purchases && purchases.length > 0 && (
            <p className="text-[11px] text-gray-400 italic pt-1">{t('historyInvoicesNote')}</p>
          )}
        </div>
      )}
    </div>
  );
}
