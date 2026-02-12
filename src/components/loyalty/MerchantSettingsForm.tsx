'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Gift,
  Target,
  Lightbulb,
} from 'lucide-react';
import { Input } from '@/components/ui';
import type { ShopType } from '@/types';

// Suggestions de récompenses par type de commerce
const REWARD_SUGGESTIONS: Record<ShopType, string[]> = {
  coiffeur: [
    '1 coupe offerte',
    '1 brushing offert',
    '-20% sur une coloration',
    '1 soin capillaire offert',
  ],
  barbier: [
    '1 coupe offerte',
    '1 taille de barbe offerte',
    '-20% sur un soin',
    '1 rasage offert',
  ],
  institut_beaute: [
    '1 soin du visage offert',
    '-20% sur une prestation',
    '1 manucure offerte',
    '1 modelage offert',
  ],
  onglerie: [
    '1 pose offerte',
    '-20% sur le prochain rdv',
    '1 nail art offert',
    '1 semi-permanent offert',
  ],
  spa: [
    '1 massage 30min offert',
    '-20% sur un soin',
    '1 accès hammam offert',
    '1 soin corps offert',
  ],
  estheticienne: [
    '1 soin du visage offert',
    '-20% sur une prestation',
    '1 épilation offerte',
    '1 modelage offert',
  ],
  massage: [
    '1 massage 30min offert',
    '-20% sur une séance',
    '30min offertes en plus',
    '1 massage duo offert',
  ],
  epilation: [
    '1 zone offerte',
    '-20% sur la prochaine séance',
    '1 séance visage offerte',
    '1 forfait aisselles offert',
  ],
  autre: [
    '1 prestation offerte',
    '-20% sur le prochain passage',
    '1 produit offert',
    'Un cadeau surprise',
  ],
};

// Suggestions d'objectifs (nombre de passages) par type
const STAMPS_SUGGESTIONS: Record<ShopType, number[]> = {
  coiffeur: [5, 8, 10],
  barbier: [5, 8, 10],
  institut_beaute: [5, 8, 10],
  onglerie: [5, 8, 10],
  spa: [5, 8, 10],
  estheticienne: [5, 8, 10],
  massage: [5, 8, 10],
  epilation: [5, 8, 10],
  autre: [5, 8, 10],
};

interface MerchantSettingsFormProps {
  initialStampsRequired?: number;
  initialRewardDescription?: string;
  shopType?: ShopType;
  onChange?: (settings: LoyaltySettings) => void;
}

export interface LoyaltySettings {
  stamps_required: number;
  reward_description: string;
}

export function MerchantSettingsForm({
  initialStampsRequired = 10,
  initialRewardDescription = '',
  shopType = 'autre',
  onChange,
}: MerchantSettingsFormProps) {
  const [stampsRequired, setStampsRequired] = useState(initialStampsRequired);
  const [rewardDescription, setRewardDescription] = useState(initialRewardDescription || '');

  // Use ref for onChange to avoid infinite loops
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Track if this is the initial mount
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setStampsRequired(initialStampsRequired);
    setRewardDescription(initialRewardDescription || '');
  }, [initialStampsRequired, initialRewardDescription]);

  // Notify parent of changes for real-time preview updates
  useEffect(() => {
    const settings = {
      stamps_required: stampsRequired,
      reward_description: rewardDescription,
    };
    onChangeRef.current?.(settings);
  }, [stampsRequired, rewardDescription]);

  const rewardSuggestions = REWARD_SUGGESTIONS[shopType] || REWARD_SUGGESTIONS.autre;
  const stampsSuggestions = STAMPS_SUGGESTIONS[shopType] || STAMPS_SUGGESTIONS.autre;

  return (
    <div className="space-y-5 md:space-y-8">
      {/* Header */}
      <div>
        <h3 className="text-base md:text-xl font-bold text-gray-900">Programme de fidélité</h3>
        <p className="text-xs md:text-sm text-gray-500 mt-0.5 md:mt-1">Configurez les règles de votre programme</p>
      </div>

      {/* Reward Configuration */}
      <div className="space-y-4 md:space-y-6">
        <h4 className="text-xs md:text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
          <Gift className="w-3.5 h-3.5 md:w-4 md:h-4" />
          Configuration Récompense
        </h4>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Stamps Required */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Target className="w-4 h-4 text-gray-400" />
              Objectif
            </label>
            <div className="relative">
              <Input
                type="number"
                min="1"
                max="50"
                value={stampsRequired}
                onChange={(e) => setStampsRequired(Number(e.target.value))}
                className="pr-24"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                passages
              </span>
            </div>
            {/* Stamps suggestions */}
            <div className="flex gap-2">
              {stampsSuggestions.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setStampsRequired(n)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all duration-200 ${
                    stampsRequired === n
                      ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                      : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600'
                  }`}
                >
                  {n} passages
                </button>
              ))}
            </div>
          </div>

          {/* Reward Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Gift className="w-4 h-4 text-gray-400" />
              Récompense
            </label>
            <Input
              value={rewardDescription}
              onChange={(e) => setRewardDescription(e.target.value)}
              placeholder="Ex: Un soin offert, -20%, Une coupe gratuite..."
            />
          </div>
        </div>

        {/* Reward Suggestions */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold text-gray-600">Suggestions pour votre activité</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {rewardSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setRewardDescription(suggestion)}
                className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-all duration-200 ${
                  rewardDescription === suggestion
                    ? 'bg-indigo-100 border-indigo-300 text-indigo-700 shadow-sm'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 hover:shadow-sm'
                }`}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary */}
      <motion.div
        key={`${stampsRequired}-${rewardDescription}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-3 md:p-5 rounded-xl md:rounded-2xl border bg-indigo-50/50 border-indigo-100"
      >
        <p className="text-xs md:text-sm font-medium text-gray-600 mb-1 md:mb-2">Résumé du programme</p>
        <p className="text-sm md:text-lg text-gray-800">
          Vos clients devront venir{' '}
          <span className="font-bold text-indigo-600">{stampsRequired} fois</span> pour gagner{' '}
          <span className="font-bold text-indigo-600">{rewardDescription || '[Récompense]'}</span>.
        </p>
      </motion.div>

    </div>
  );
}

export default MerchantSettingsForm;
