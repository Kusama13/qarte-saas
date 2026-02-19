'use client';

import { useState } from 'react';
import { Gift, Trophy } from 'lucide-react';
import { Button, Input, Textarea } from '@/components/ui';

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
}: TierProgressProps) {
  return (
    <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</span>
        {reached && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${reachedBadgeClass}`}>
            Atteint
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
}: CustomerAdjustTabProps) {
  const [adjustment, setAdjustment] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const effectiveMax = (tier2Enabled && tier2StampsRequired) ? tier2StampsRequired - 1 : stampsRequired - 1;
  const maxAdjustment = effectiveMax - currentStamps;
  const newStamps = Math.min(Math.max(0, currentStamps + adjustment), effectiveMax);

  const handleSubmit = async () => {
    if (adjustment === 0) {
      setError('Veuillez saisir un ajustement');
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
          reason: reason.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'ajustement');
      }

      onSuccess('Points ajustes !');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'ajustement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Progress display */}
      {tier2Enabled && tier2StampsRequired ? (
        <div className="space-y-2">
          <TierProgress
            icon={<Gift className={`w-4 h-4 ${currentStamps >= stampsRequired ? 'text-emerald-500' : 'text-indigo-500'}`} />}
            label="Palier 1"
            description={rewardDescription || 'Recompense'}
            current={Math.min(currentStamps, stampsRequired)}
            required={stampsRequired}
            reached={currentStamps >= stampsRequired}
            reachedBadgeClass="text-emerald-600 bg-emerald-50"
            reachedTextClass="text-emerald-600"
            barClass="bg-emerald-500"
            barBaseClass="bg-indigo-500"
          />
          <TierProgress
            icon={<Trophy className={`w-4 h-4 ${currentStamps >= tier2StampsRequired ? 'text-violet-500' : 'text-gray-400'}`} />}
            label="Palier 2"
            description={tier2RewardDescription || 'Recompense palier 2'}
            current={Math.max(0, Math.min(currentStamps - stampsRequired, tier2StampsRequired - stampsRequired))}
            required={tier2StampsRequired - stampsRequired}
            reached={currentStamps >= tier2StampsRequired}
            reachedBadgeClass="text-violet-600 bg-violet-50"
            reachedTextClass="text-violet-600"
            barClass="bg-violet-500"
            barBaseClass="bg-gray-300"
          />
          {adjustment !== 0 && (
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-indigo-700 font-medium">Apres ajustement</span>
                <span className="font-bold text-sm">
                  <span className="text-gray-900">
                    {newStamps < stampsRequired
                      ? `${newStamps}/${stampsRequired} palier 1`
                      : `${newStamps - stampsRequired}/${(tier2StampsRequired || 0) - stampsRequired} palier 2`
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
            <span className="text-gray-600">Actuellement</span>
            <span className="font-semibold text-gray-900">
              {currentStamps} / {stampsRequired} passages
            </span>
          </div>
          {adjustment !== 0 && (
            <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-gray-200">
              <span className="text-gray-600">Apres ajustement</span>
              <span className={`font-semibold ${adjustment > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {newStamps} / {stampsRequired} passages
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
          Nombre de points
        </label>
        <Input
          type="number"
          placeholder="Ex: 2 ou -3"
          value={adjustment === 0 ? '' : adjustment}
          onChange={(e) => {
            let val = parseInt(e.target.value) || 0;
            if (val < -currentStamps) val = -currentStamps;
            if (val > maxAdjustment) val = maxAdjustment;
            setAdjustment(val);
          }}
          className="text-center text-lg"
        />
        <p className="mt-1 text-xs text-gray-400">
          Positif pour ajouter, negatif pour retirer (max {effectiveMax} au total)
        </p>
      </div>

      <Textarea
        label="Raison (optionnel)"
        placeholder="Ex: Erreur de scan, geste commercial..."
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={100}
        showCount
      />

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onClose} className="flex-1" disabled={loading}>
          Annuler
        </Button>
        <Button onClick={handleSubmit} loading={loading} disabled={adjustment === 0} className="flex-1">
          Valider
        </Button>
      </div>
    </div>
  );
}
