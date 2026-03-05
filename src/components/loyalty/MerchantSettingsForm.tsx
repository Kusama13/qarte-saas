'use client';

import { motion } from 'framer-motion';
import {
  Gift,
  Target,
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
  tatouage: [
    '1 retouche offerte',
    '-10% sur le prochain tatouage',
    '1 piercing offert',
    '1 consultation design offerte',
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
  tatouage: [5, 8, 10],
  autre: [5, 8, 10],
};

interface MerchantSettingsFormProps {
  stampsRequired: number;
  rewardDescription: string;
  shopType?: ShopType;
  onChange: (settings: LoyaltySettings) => void;
  hiddenReward?: boolean;
}

export interface LoyaltySettings {
  stamps_required: number;
  reward_description: string;
}

export function MerchantSettingsForm({
  stampsRequired,
  rewardDescription,
  shopType = 'autre',
  onChange,
  hiddenReward,
}: MerchantSettingsFormProps) {
  const rewardSuggestions = REWARD_SUGGESTIONS[shopType] || REWARD_SUGGESTIONS.autre;
  const stampsSuggestions = STAMPS_SUGGESTIONS[shopType] || STAMPS_SUGGESTIONS.autre;

  return (
    <div className="space-y-5">
      {/* Stamps Required */}
      <div className="space-y-2.5">
        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Target className="w-4 h-4 text-indigo-500" />
          Nombre de passages requis
        </label>
        <Input
          type="number"
          min="1"
          max="50"
          value={stampsRequired}
          onChange={(e) => onChange({ stamps_required: Number(e.target.value), reward_description: rewardDescription })}
          className="text-center font-bold text-lg h-12 border-2 max-w-[120px]"
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Suggestions :</span>
          {stampsSuggestions.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange({ stamps_required: n, reward_description: rewardDescription })}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${
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
      {!hiddenReward && (
        <div className="space-y-2.5">
          <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Gift className="w-4 h-4 text-indigo-500" />
            Récompense offerte
          </label>
          <Input
            value={rewardDescription}
            onChange={(e) => onChange({ stamps_required: stampsRequired, reward_description: e.target.value })}
            placeholder="Ex: Un soin offert, -20%, Une coupe gratuite..."
            className="h-11"
          />
          <div className="flex flex-wrap gap-1.5">
            {rewardSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onChange({ stamps_required: stampsRequired, reward_description: suggestion })}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${
                  rewardDescription === suggestion
                    ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                    : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600'
                }`}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {rewardDescription && (
        <motion.div
          key={`${stampsRequired}-${rewardDescription}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 md:p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100"
        >
          <p className="text-sm md:text-base text-gray-700">
            Après <span className="font-bold text-indigo-600">{stampsRequired} passages</span>, vos clients gagnent{' '}
            <span className="font-bold text-indigo-600">{rewardDescription}</span>
          </p>
        </motion.div>
      )}
    </div>
  );
}

export default MerchantSettingsForm;
