'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Gift, Trophy, Coins, Minus, Plus } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { formatCurrency, calculateCashback } from '@/lib/utils';

interface TierProgressProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  current: number;
  required: number;
  reached: boolean;
  reachedBadgeClass: string;
  reachedTextClass: string;
  barClass: string;
  barBaseClass: string;
  reachedLabel: string;
}

function TierProgress({
  icon,
  label,
  description,
  current,
  required,
  reached,
  reachedBadgeClass,
  reachedTextClass,
  barClass,
  barBaseClass,
  reachedLabel,
}: TierProgressProps) {
  return (
    <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</span>
        {reached && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${reachedBadgeClass}`}>
            {reachedLabel}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500 text-xs">{description}</span>
        <span className={`font-semibold ${reached ? reachedTextClass : 'text-gray-900'}`}>
          {current}/{required}
        </span>
      </div>
      <div className="h-1 bg-gray-200 rounded-full mt-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${reached ? barClass : barBaseClass}`}
          style={{ width: `${Math.min((current / required) * 100, 100)}%` }}
        />
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
  const newStamps = Math.min(Math.max(0, currentStamps + adjustment), effectiveMax);

  const parsedAmountAdj = parseFloat(amountAdjustment.replace(',', '.')) || 0;
  const newAmount = Math.max(0, currentAmount + parsedAmountAdj);

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

      if (!response.ok) {
        throw new Error(data.error || t('adjustError'));
      }

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
      {/* Cagnotte display */}
      {isCagnotte && (() => {
        const tier1Reached = currentStamps >= stampsRequired;
        const tier2Reached = tier2Enabled && tier2StampsRequired && currentStamps >= tier2StampsRequired;
        // Palier 2 percent only applies AFTER tier1 has been redeemed (current_amount resets to 0 at T1 redeem)
        const activePercent = (tier2Reached || (tier1Redeemed && tier2Enabled)) ? (cagnotteTier2Percent || cagnottePercent) : cagnottePercent;
        const activeValue = formatCurrency(calculateCashback(currentAmount, activePercent), country);
        return (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">{t('cagnotte')}</span>
              </div>
              {tier1Reached && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${tier2Reached ? 'text-violet-600 bg-violet-100' : 'text-emerald-600 bg-emerald-100'}`}>
                  {tier2Reached ? t('tier2Reached') : t('tier1Reached')}
                </span>
              )}
            </div>
            <p className="text-2xl font-black text-emerald-800">
              {activeValue}
              <span className="text-sm font-bold text-emerald-600 ml-1">({activePercent}%)</span>
            </p>
            {tier2Enabled && cagnotteTier2Percent && !tier2Reached && tier1Redeemed && (
              <p className="text-xs text-violet-600 mt-0.5">
                {t('tier2')} ({cagnotteTier2Percent}%) : {formatCurrency(calculateCashback(currentAmount, cagnotteTier2Percent), country)}
              </p>
            )}
            <p className="text-xs text-emerald-600 mt-1">
              {t('totalSpent', { amount: formatCurrency(currentAmount, country) })}
            </p>
          </div>
        );
      })()}

      {/* Progress display */}
      {tier2Enabled && tier2StampsRequired ? (
        <div className="space-y-2">
          <TierProgress
            icon={<Gift className={`w-4 h-4 ${currentStamps >= stampsRequired ? 'text-emerald-500' : 'text-indigo-500'}`} />}
            label={t('tier1')}
            description={rewardDescription || t('reward')}
            current={Math.min(currentStamps, stampsRequired)}
            required={stampsRequired}
            reached={currentStamps >= stampsRequired}
            reachedBadgeClass="text-emerald-600 bg-emerald-50"
            reachedTextClass="text-emerald-600"
            barClass="bg-emerald-500"
            barBaseClass="bg-indigo-500"
            reachedLabel={t('reached')}
          />
          <TierProgress
            icon={<Trophy className={`w-4 h-4 ${currentStamps >= tier2StampsRequired ? 'text-violet-500' : 'text-gray-400'}`} />}
            label={t('tier2')}
            description={tier2RewardDescription || t('rewardTier2')}
            current={Math.max(0, Math.min(currentStamps - stampsRequired, tier2StampsRequired - stampsRequired))}
            required={tier2StampsRequired - stampsRequired}
            reached={currentStamps >= tier2StampsRequired}
            reachedBadgeClass="text-violet-600 bg-violet-50"
            reachedTextClass="text-violet-600"
            barClass="bg-violet-500"
            barBaseClass="bg-gray-300"
            reachedLabel={t('reached')}
          />
          {adjustment !== 0 && (
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-indigo-700 font-medium">{t('afterAdjust')}</span>
                <span className="font-bold text-sm">
                  <span className="text-gray-900">
                    {newStamps < stampsRequired
                      ? `${newStamps}/${stampsRequired} ${t('tier1').toLowerCase()}`
                      : `${newStamps - stampsRequired}/${(tier2StampsRequired || 0) - stampsRequired} ${t('tier2').toLowerCase()}`
                    }
                  </span>
                  {' '}
                  <span className={adjustment > 0 ? 'text-green-600' : 'text-red-600'}>
                    ({adjustment > 0 ? '+' : ''}{adjustment})
                  </span>
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-gray-50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{t('currently')}</span>
            <span className="font-semibold text-gray-900">
              {currentStamps} / {stampsRequired} {t('visits')}
            </span>
          </div>
          {adjustment !== 0 && (
            <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-gray-200">
              <span className="text-gray-600">{t('afterAdjust')}</span>
              <span className={`font-semibold ${adjustment > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {newStamps} / {stampsRequired} {t('visits')}
              </span>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-50 rounded-xl">
          {error}
        </div>
      )}

      <div>
        <label className="block mb-1.5 text-sm font-medium text-gray-700">
          {t('stampsLabel')}
        </label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const next = adjustment - 1;
              if (next >= -currentStamps) setAdjustment(next);
            }}
            disabled={adjustment <= -currentStamps}
            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-gray-100 flex items-center justify-center transition-colors shrink-0"
          >
            <Minus className="w-4 h-4 text-gray-600" />
          </button>
          <Input
            type="number"
            placeholder="0"
            value={adjustment === 0 ? '' : adjustment}
            onChange={(e) => {
              let val = parseInt(e.target.value) || 0;
              if (val < -currentStamps) val = -currentStamps;
              if (val > maxAdjustment) val = maxAdjustment;
              setAdjustment(val);
            }}
            className="text-center text-lg font-semibold"
          />
          <button
            onClick={() => {
              const next = adjustment + 1;
              if (next <= maxAdjustment) setAdjustment(next);
            }}
            disabled={adjustment >= maxAdjustment}
            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-gray-100 flex items-center justify-center transition-colors shrink-0"
          >
            <Plus className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        {adjustment !== 0 && (
          <p className="mt-1.5 text-xs text-center">
            <span className="text-gray-500">{currentStamps}</span>
            <span className="text-gray-400 mx-1.5">&rarr;</span>
            <span className={`font-semibold ${adjustment > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {newStamps}
            </span>
            <span className="text-gray-400 ml-0.5">/ {effectiveMax}</span>
          </p>
        )}
      </div>

      {isCagnotte && (
        <div>
          <label className="block mb-1.5 text-sm font-medium text-gray-700">
            {t('adjustAmountLabel')}
          </label>
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
