'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { MessageSquareText, ShoppingCart, AlertTriangle } from 'lucide-react';

const SMS_FREE_QUOTA = 100;

interface SmsUsage {
  sent: number;
  remaining: number;
  packBalance: number;
  periodStart: string;
}

interface SmsBalancePanelProps {
  merchantId?: string;
  onBuyPack?: () => void;
}

export default function SmsBalancePanel({ merchantId, onBuyPack }: SmsBalancePanelProps) {
  const t = useTranslations('marketing.smsBalance');
  const [usage, setUsage] = useState<SmsUsage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!merchantId) return;
    let cancelled = false;
    (async () => {
      let fallback = { sent: 0, remaining: SMS_FREE_QUOTA, packBalance: 0, periodStart: '' };
      try {
        const res = await fetch(`/api/sms/usage?merchantId=${merchantId}`);
        if (res.ok) {
          const data = await res.json();
          fallback = {
            sent: Number(data.sent || 0),
            remaining: Number(data.remaining || 0),
            packBalance: Number(data.packBalance || 0),
            periodStart: String(data.periodStart || ''),
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

  const percent = Math.min(100, Math.round((usage.sent / SMS_FREE_QUOTA) * 100));
  const quotaDepleted = usage.remaining === 0;
  const packEmpty = usage.packBalance === 0;
  const blocked = quotaDepleted && packEmpty;
  const warning = percent >= 80 && !blocked;

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
            {t('includedUsage', { sent: usage.sent, quota: SMS_FREE_QUOTA })}
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
    </div>
  );
}
