'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  HelpCircle,
  Gift,
  Target,
  Footprints,
} from 'lucide-react';
import { Input } from '@/components/ui';

interface MerchantSettingsFormProps {
  initialStampsRequired?: number;
  initialRewardDescription?: string;
  onOpenGuide?: () => void;
  onChange?: (settings: LoyaltySettings) => void;
}

export interface LoyaltySettings {
  stamps_required: number;
  reward_description: string;
}

export function MerchantSettingsForm({
  initialStampsRequired = 10,
  initialRewardDescription = '',
  onOpenGuide,
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

  return (
    <div className="space-y-8">
      {/* Header with Help Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Programme de fidélité</h3>
          <p className="text-sm text-gray-500 mt-1">Configurez les règles de votre programme</p>
        </div>
        {onOpenGuide && (
          <button
            onClick={onOpenGuide}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 transition-all duration-300 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-105 active:scale-95 text-sm font-bold"
          >
            <HelpCircle className="w-4 h-4" />
            Comment ça fonctionne ?
          </button>
        )}
      </div>

      {/* Mode Display - Visit Only */}
      <div className="p-5 rounded-2xl border-2 border-indigo-500 bg-indigo-50/50 shadow-lg shadow-indigo-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-lg shadow-slate-200">
            <Footprints className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900">Mode Visite</h4>
            <p className="text-sm text-gray-500">1 passage = 1 point</p>
          </div>
        </div>
      </div>

      {/* Reward Configuration */}
      <div className="space-y-6">
        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
          <Gift className="w-4 h-4" />
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
      </div>

      {/* Summary */}
      <motion.div
        key={`${stampsRequired}-${rewardDescription}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 rounded-2xl border bg-indigo-50/50 border-indigo-100"
      >
        <p className="text-sm font-medium text-gray-600 mb-2">Résumé du programme</p>
        <p className="text-lg text-gray-800">
          Vos clients devront venir{' '}
          <span className="font-bold text-indigo-600">{stampsRequired} fois</span> pour gagner{' '}
          <span className="font-bold text-indigo-600">{rewardDescription || '[Récompense]'}</span>.
        </p>
      </motion.div>

    </div>
  );
}

export default MerchantSettingsForm;
