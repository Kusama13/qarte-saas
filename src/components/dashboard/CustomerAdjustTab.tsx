'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Gift, Trophy, Coins, Minus, Plus } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { formatCurrency, calculateCashback } from '@/lib/utils';
import { ROLES } from '@/lib/customer-modal-styles';

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
    <div className="flex items-center gap-4 sm:gap-5">
      <div className="shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between mb-2 sm:mb-2.5">
          <span className={`text-sm sm:text-base font-bold tracking-tight truncate ${reached ? textClass : 'text-gray-700'}`}>
            {label}
          </span>
          <span className={`text-base sm:text-lg font-bold tabular-nums shrink-0 ml-2 ${reached ? textClass : 'text-gray-900'}`}>
            {current}/{required}
          </span>
        </div>
        <div className="h-2.5 sm:h-3 bg-gray-100 rounded-full overflow-hidden">
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

  const canSubmit = adjustment !== 0 || (isCagnotte && parsedAmountAdj !== 0);

  return (
    <div className="min-h-full flex flex-col justify-center space-y-6 sm:space-y-7">
      {/* ── Status : cagnotte + progress bars ── */}
      <div className={`rounded-xl border ${ROLES.neutral.border} ${ROLES.neutral.bg} p-5 sm:p-6 space-y-5 sm:space-y-6`}>
        {isCagnotte && (() => {
          const activePercent = (tier2Reached || (tier1Redeemed && tier2Enabled)) ? (cagnotteTier2Percent || cagnottePercent) : cagnottePercent;
          const activeValue = formatCurrency(calculateCashback(currentAmount, activePercent), country);
          return (
            <div className="flex items-baseline justify-between pb-2.5 border-b border-gray-200/70">
              <div className="flex items-center gap-1.5">
                <Coins className={`w-4 h-4 ${ROLES.success.icon}`} />
                <span className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider ${ROLES.success.text}`}>{t('cagnotte')}</span>
                {tier1Reached && (
                  <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded ${tier2Reached ? `${ROLES.premium.text} ${ROLES.premium.bgSolid}` : `${ROLES.success.text} ${ROLES.success.bgSolid}`}`}>
                    {tier2Reached ? t('tier2Reached') : t('tier1Reached')}
                  </span>
                )}
              </div>
              <div className="text-right">
                <p className={`text-base sm:text-xl font-bold ${ROLES.success.text}`}>{activeValue} <span className="text-[11px] sm:text-xs font-bold opacity-70">({activePercent}%)</span></p>
                <p className="text-[10px] sm:text-[11px] text-gray-500">{t('totalSpent', { amount: formatCurrency(currentAmount, country) })}</p>
              </div>
            </div>
          );
        })()}

        {tier2Enabled && tier2StampsRequired ? (
          <div className="space-y-4 sm:space-y-5">
            <CompactProgressRow
              icon={<Gift className={`w-5 h-5 sm:w-6 sm:h-6 ${tier1Reached ? ROLES.success.icon : ROLES.primary.icon}`} />}
              label={rewardDescription || t('tier1')}
              current={Math.min(currentStamps, stampsRequired)}
              required={stampsRequired}
              reached={tier1Reached}
              barClass={tier1Reached ? ROLES.success.bar : ROLES.primary.bar}
              textClass={ROLES.success.text}
            />
            <CompactProgressRow
              icon={<Trophy className={`w-5 h-5 sm:w-6 sm:h-6 ${tier2Reached ? ROLES.premium.icon : 'text-gray-400'}`} />}
              label={tier2RewardDescription || t('tier2')}
              current={Math.max(0, Math.min(currentStamps - stampsRequired, tier2StampsRequired - stampsRequired))}
              required={tier2StampsRequired - stampsRequired}
              reached={tier2Reached}
              barClass={tier2Reached ? ROLES.premium.bar : 'bg-gray-300'}
              textClass={ROLES.premium.text}
            />
          </div>
        ) : (
          <CompactProgressRow
            icon={<Gift className={`w-4 h-4 sm:w-5 sm:h-5 ${tier1Reached ? ROLES.success.icon : ROLES.primary.icon}`} />}
            label={rewardDescription || t('reward')}
            current={Math.min(currentStamps, stampsRequired)}
            required={stampsRequired}
            reached={tier1Reached}
            barClass={tier1Reached ? ROLES.success.bar : ROLES.primary.bar}
            textClass={ROLES.success.text}
          />
        )}

        {adjustment !== 0 && (
          <div className="text-xs sm:text-sm flex items-center justify-between pt-2 border-t border-gray-200/70">
            <span className="text-gray-500">{t('afterAdjust')}</span>
            <span className="font-bold tabular-nums">
              <span className="text-gray-400">{currentStamps}</span>
              <span className="text-gray-400 mx-1">→</span>
              <span className={adjustment > 0 ? ROLES.success.text : ROLES.danger.text}>{newStamps}</span>
              <span className="text-gray-400 ml-1">/ {effectiveMax}</span>
              <span className={`ml-2 ${adjustment > 0 ? ROLES.success.text : ROLES.danger.text}`}>({adjustment > 0 ? '+' : ''}{adjustment})</span>
            </span>
          </div>
        )}
      </div>

      {/* ── Stepper passages ── */}
      <div className="py-2">
        <label className="block mb-3 text-base sm:text-lg font-semibold text-gray-800 text-center">{t('stampsLabel')}</label>
        <div className="flex items-center gap-3 sm:gap-4 max-w-sm mx-auto">
          <button
            onClick={() => tweakBy(-1)}
            disabled={adjustment <= minAdjustment}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-gray-100 flex items-center justify-center transition-colors shrink-0"
            aria-label="-1"
          >
            <Minus className="w-6 h-6 sm:w-7 sm:h-7 text-gray-700" />
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
            className="text-center text-3xl sm:text-4xl font-bold h-14 sm:h-16"
          />
          <button
            onClick={() => tweakBy(1)}
            disabled={adjustment >= maxAdjustment}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-gray-100 flex items-center justify-center transition-colors shrink-0"
            aria-label="+1"
          >
            <Plus className="w-6 h-6 sm:w-7 sm:h-7 text-gray-700" />
          </button>
        </div>
      </div>

      {isCagnotte && (
        <div>
          <label className="block mb-2 text-sm sm:text-base font-medium text-gray-700 text-center">{t('adjustAmountLabel')}</label>
          <Input
            type="text"
            inputMode="decimal"
            placeholder={t('adjustAmountPlaceholder')}
            value={amountAdjustment}
            onChange={(e) => setAmountAdjustment(e.target.value)}
            className="text-center text-lg sm:text-xl h-12 max-w-sm mx-auto"
          />
          {parsedAmountAdj !== 0 && (
            <div className="mt-2.5 text-xs sm:text-sm text-center text-gray-500 space-y-0.5">
              <p>{t('newTotal')} : <span className="font-semibold">{formatCurrency(newAmount, country)}</span></p>
              <p>
                {t('newCagnotte')} : <span className={`font-semibold ${ROLES.success.text}`}>{formatCurrency(calculateCashback(newAmount, cagnottePercent), country)} ({cagnottePercent}%)</span>
                {cagnotteTier2Percent && tier1Redeemed && <span className={`${ROLES.premium.text} ml-1`}>/ {formatCurrency(calculateCashback(newAmount, cagnotteTier2Percent), country)} ({cagnotteTier2Percent}%)</span>}
              </p>
            </div>
          )}
        </div>
      )}

      <Input
        placeholder={t('reasonPlaceholder')}
        value={reason}
        onChange={(e) => setReason(e.target.value.slice(0, 100))}
        className="text-sm sm:text-base h-11"
      />

      {error && (
        <div className={`p-3 text-xs sm:text-sm ${ROLES.danger.text} ${ROLES.danger.bg} rounded-lg`}>{error}</div>
      )}

      <div className="flex gap-3 pt-1">
        <Button variant="ghost" onClick={onClose} className="flex-1" disabled={loading}>
          {t('cancel')}
        </Button>
        <Button onClick={handleSubmit} loading={loading} disabled={!canSubmit} className="flex-1">
          {t('validate')}
        </Button>
      </div>
    </div>
  );
}
