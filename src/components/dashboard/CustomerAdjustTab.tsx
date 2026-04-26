'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Gift, Trophy, Coins, Minus, Plus } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { formatCurrency, calculateCashback } from '@/lib/utils';

interface CompactProgressRowProps {
  icon: React.ReactNode;
  label: string;
  current: number;
  required: number;
  reached: boolean;
  barClass: string;
  textClass: string;
}

function CompactProgressRow({ icon, label, current, required, reached, barClass, textClass }: CompactProgressRowProps) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between mb-0.5">
          <span className={`text-[11px] font-bold uppercase tracking-wider ${reached ? textClass : 'text-gray-500'}`}>
            {label}
          </span>
          <span className={`text-xs font-bold tabular-nums ${reached ? textClass : 'text-gray-700'}`}>
            {current}/{required}
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${barClass}`} style={{ width: `${Math.min((current / required) * 100, 100)}%` }} />
        </div>
      </div>
    </div>
  );
}

export interface CustomerAdjustTabProps {
  currentStamps: number;
  stampsRequired: number;
  tier2Enabled: boolean;
  tier2StampsRequired?: number;
  tier2RewardDescription?: string;
  rewardDescription?: string;
  customerId: string;
  merchantId: string;
  loyaltyCardId: string;
  onSuccess: (message: string) => void;
  onClose: () => void;
  isCagnotte?: boolean;
  currentAmount?: number;
  cagnottePercent?: number;
  cagnotteTier2Percent?: number | null;
  tier1Redeemed?: boolean;
  country?: string;
}

export function CustomerAdjustTab({
  currentStamps,
  stampsRequired,
  tier2Enabled,
  tier2StampsRequired,
  tier2RewardDescription,
  rewardDescription,
  customerId,
  merchantId,
  loyaltyCardId,
  onSuccess,
  onClose,
  isCagnotte = false,
  currentAmount = 0,
  cagnottePercent = 0,
  cagnotteTier2Percent,
  tier1Redeemed = false,
  country,
}: CustomerAdjustTabProps) {
  const t = useTranslations('customerAdjust');
  const [adjustment, setAdjustment] = useState<number>(0);
  const [amountAdjustment, setAmountAdjustment] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const effectiveMax = (tier2Enabled && tier2StampsRequired) ? tier2StampsRequired : stampsRequired;
  const maxAdjustment = effectiveMax - currentStamps;
  const minAdjustment = -currentStamps;
  const newStamps = Math.min(Math.max(0, currentStamps + adjustment), effectiveMax);

  const parsedAmountAdj = parseFloat(amountAdjustment.replace(',', '.')) || 0;
  const newAmount = Math.max(0, currentAmount + parsedAmountAdj);

  const tier1Reached = currentStamps >= stampsRequired;
  const tier2Reached = !!(tier2Enabled && tier2StampsRequired && currentStamps >= tier2StampsRequired);
  const showLargeQuickStep = effectiveMax >= 8; // skip ±5 on small programs

  const tweakBy = (delta: number) => {
    const next = adjustment + delta;
    setAdjustment(Math.max(minAdjustment, Math.min(maxAdjustment, next)));
  };

  const handleSubmit = async () => {
    if (adjustment === 0 && (!isCagnotte || parsedAmountAdj === 0)) {
      setError(t('enterAdjustment'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/adjust-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          merchant_id: merchantId,
          loyalty_card_id: loyaltyCardId,
          adjustment,
          amount_adjustment: isCagnotte ? parsedAmountAdj : undefined,
          reason: reason.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t('adjustError'));
      setAdjustment(0);
      setAmountAdjustment('');
      setReason('');
      onSuccess(isCagnotte ? t('adjustSuccess') : t('pointsAdjusted'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('adjustError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Status condensé : 1 carte avec cagnotte (si applicable) + progressions */}
      <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 space-y-2.5">
        {isCagnotte && (() => {
          const activePercent = (tier2Reached || (tier1Redeemed && tier2Enabled)) ? (cagnotteTier2Percent || cagnottePercent) : cagnottePercent;
          const activeValue = formatCurrency(calculateCashback(currentAmount, activePercent), country);
          return (
            <div className="flex items-baseline justify-between pb-2 border-b border-gray-200/70">
              <div className="flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">{t('cagnotte')}</span>
                {tier1Reached && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${tier2Reached ? 'text-violet-600 bg-violet-100' : 'text-emerald-600 bg-emerald-100'}`}>
                    {tier2Reached ? t('tier2Reached') : t('tier1Reached')}
                  </span>
                )}
              </div>
              <div className="text-right">
                <p className="text-base font-bold text-emerald-700">{activeValue} <span className="text-[11px] font-bold text-emerald-500">({activePercent}%)</span></p>
                <p className="text-[10px] text-gray-500">{t('totalSpent', { amount: formatCurrency(currentAmount, country) })}</p>
              </div>
            </div>
          );
        })()}

        {tier2Enabled && tier2StampsRequired ? (
          <>
            <CompactProgressRow
              icon={<Gift className={`w-4 h-4 ${tier1Reached ? 'text-emerald-500' : 'text-indigo-500'}`} />}
              label={rewardDescription || t('tier1')}
              current={Math.min(currentStamps, stampsRequired)}
              required={stampsRequired}
              reached={tier1Reached}
              barClass={tier1Reached ? 'bg-emerald-500' : 'bg-indigo-500'}
              textClass="text-emerald-600"
            />
            <CompactProgressRow
              icon={<Trophy className={`w-4 h-4 ${tier2Reached ? 'text-violet-500' : 'text-gray-400'}`} />}
              label={tier2RewardDescription || t('tier2')}
              current={Math.max(0, Math.min(currentStamps - stampsRequired, tier2StampsRequired - stampsRequired))}
              required={tier2StampsRequired - stampsRequired}
              reached={tier2Reached}
              barClass={tier2Reached ? 'bg-violet-500' : 'bg-gray-300'}
              textClass="text-violet-600"
            />
          </>
        ) : (
          <CompactProgressRow
            icon={<Gift className={`w-4 h-4 ${tier1Reached ? 'text-emerald-500' : 'text-indigo-500'}`} />}
            label={rewardDescription || t('reward')}
            current={Math.min(currentStamps, stampsRequired)}
            required={stampsRequired}
            reached={tier1Reached}
            barClass={tier1Reached ? 'bg-emerald-500' : 'bg-indigo-500'}
            textClass="text-emerald-600"
          />
        )}

        {adjustment !== 0 && (
          <div className="text-xs flex items-center justify-between pt-1.5 border-t border-gray-200/70">
            <span className="text-gray-500">{t('afterAdjust')}</span>
            <span className="font-bold tabular-nums">
              <span className="text-gray-400">{currentStamps}</span>
              <span className="text-gray-400 mx-1">→</span>
              <span className={adjustment > 0 ? 'text-emerald-600' : 'text-red-600'}>{newStamps}</span>
              <span className="text-gray-400 ml-1">/ {effectiveMax}</span>
              <span className={`ml-1.5 ${adjustment > 0 ? 'text-emerald-600' : 'text-red-600'}`}>({adjustment > 0 ? '+' : ''}{adjustment})</span>
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="p-2.5 text-xs text-red-700 bg-red-50 rounded-lg">{error}</div>
      )}

      {/* Ajustement passages */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-medium text-gray-700">{t('stampsLabel')}</label>
          {/* Quick step buttons */}
          <div className="flex items-center gap-1">
            {showLargeQuickStep && (
              <button
                onClick={() => tweakBy(-5)}
                disabled={adjustment - 5 < minAdjustment}
                className="px-2 py-0.5 rounded-md text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-30 transition-colors"
              >−5</button>
            )}
            <button
              onClick={() => tweakBy(-1)}
              disabled={adjustment - 1 < minAdjustment}
              className="px-2 py-0.5 rounded-md text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-30 transition-colors"
            >−1</button>
            <button
              onClick={() => tweakBy(1)}
              disabled={adjustment + 1 > maxAdjustment}
              className="px-2 py-0.5 rounded-md text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-30 transition-colors"
            >+1</button>
            {showLargeQuickStep && (
              <button
                onClick={() => tweakBy(5)}
                disabled={adjustment + 5 > maxAdjustment}
                className="px-2 py-0.5 rounded-md text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-30 transition-colors"
              >+5</button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => tweakBy(-1)}
            disabled={adjustment <= minAdjustment}
            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-gray-100 flex items-center justify-center transition-colors shrink-0"
            aria-label="-1"
          >
            <Minus className="w-4 h-4 text-gray-600" />
          </button>
          <Input
            type="number"
            placeholder="0"
            value={adjustment === 0 ? '' : adjustment}
            onChange={(e) => {
              let val = parseInt(e.target.value) || 0;
              if (val < minAdjustment) val = minAdjustment;
              if (val > maxAdjustment) val = maxAdjustment;
              setAdjustment(val);
            }}
            className="text-center text-lg font-semibold"
          />
          <button
            onClick={() => tweakBy(1)}
            disabled={adjustment >= maxAdjustment}
            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-gray-100 flex items-center justify-center transition-colors shrink-0"
            aria-label="+1"
          >
            <Plus className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Cagnotte amount adjustment */}
      {isCagnotte && (
        <div>
          <label className="block mb-1.5 text-sm font-medium text-gray-700">{t('adjustAmountLabel')}</label>
          <Input
            type="text"
            inputMode="decimal"
            placeholder={t('adjustAmountPlaceholder')}
            value={amountAdjustment}
            onChange={(e) => setAmountAdjustment(e.target.value)}
            className="text-center text-lg"
          />
          {parsedAmountAdj !== 0 && (
            <div className="mt-1 text-xs text-gray-500 space-y-0.5">
              <p>{t('newTotal')} : <span className="font-semibold">{formatCurrency(newAmount, country)}</span></p>
              <p>{t('newCagnotte')} : <span className="font-semibold text-emerald-600">{formatCurrency(calculateCashback(newAmount, cagnottePercent), country)} ({cagnottePercent}%)</span>
                {cagnotteTier2Percent && tier1Redeemed ? <span className="text-violet-600 ml-1">/ {formatCurrency(calculateCashback(newAmount, cagnotteTier2Percent), country)} ({cagnotteTier2Percent}%)</span> : ''}
              </p>
            </div>
          )}
        </div>
      )}

      <Input
        placeholder={t('reasonPlaceholder')}
        value={reason}
        onChange={(e) => setReason(e.target.value.slice(0, 100))}
        className="text-sm"
      />

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onClose} className="flex-1" disabled={loading}>
          {t('cancel')}
        </Button>
        <Button onClick={handleSubmit} loading={loading} disabled={adjustment === 0 && (!isCagnotte || parsedAmountAdj === 0)} className="flex-1">
          {t('validate')}
        </Button>
      </div>
    </div>
  );
}
