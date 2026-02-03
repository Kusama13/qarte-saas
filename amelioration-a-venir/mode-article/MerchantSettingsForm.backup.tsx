'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Footprints,
  Pizza,
  HelpCircle,
  Gift,
  Target,
  Users,
  Coffee,
  ShoppingBag,
  Sparkles,
  Minus,
  Plus,
  Check,
} from 'lucide-react';
import { Input } from '@/components/ui';
import type { LoyaltyMode } from '@/types';

interface MerchantSettingsFormProps {
  initialMode?: LoyaltyMode;
  initialProductName?: string;
  initialMaxQuantity?: number;
  initialStampsRequired?: number;
  initialRewardDescription?: string;
  onOpenGuide?: () => void;
  onChange?: (settings: LoyaltySettings) => void;
}

export interface LoyaltySettings {
  loyalty_mode: LoyaltyMode;
  product_name: string | null;
  max_quantity_per_scan: number;
  stamps_required: number;
  reward_description: string;
}

export function MerchantSettingsForm({
  initialMode = 'visit',
  initialProductName = '',
  initialMaxQuantity = 5,
  initialStampsRequired = 10,
  initialRewardDescription = '',
  onOpenGuide,
  onChange,
}: MerchantSettingsFormProps) {
  const [mode, setMode] = useState<LoyaltyMode>(initialMode);
  const [productName, setProductName] = useState(initialProductName || '');
  const [maxQuantity, setMaxQuantity] = useState(initialMaxQuantity);
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
    setMode(initialMode);
    setProductName(initialProductName || '');
    setMaxQuantity(initialMaxQuantity);
    setStampsRequired(initialStampsRequired);
    setRewardDescription(initialRewardDescription || '');
  }, [initialMode, initialProductName, initialMaxQuantity, initialStampsRequired, initialRewardDescription]);

  // Notify parent of changes for real-time preview updates (debounced)
  useEffect(() => {
    const settings = {
      loyalty_mode: mode,
      product_name: mode === 'article' ? productName : null,
      max_quantity_per_scan: mode === 'article' ? maxQuantity : 1,
      stamps_required: stampsRequired,
      reward_description: rewardDescription,
    };
    onChangeRef.current?.(settings);
  }, [mode, productName, maxQuantity, stampsRequired, rewardDescription]);

  // Build summary sentence
  const getSummary = () => {
    if (mode === 'visit') {
      return (
        <>
          Vos clients devront venir{' '}
          <span className="font-bold text-indigo-600">{stampsRequired} fois</span> pour gagner{' '}
          <span className="font-bold text-indigo-600">{rewardDescription || '[Récompense]'}</span>.
        </>
      );
    } else {
      return (
        <>
          Vos clients devront acheter{' '}
          <span className="font-bold text-orange-600">
            {stampsRequired} {productName || '[Produit]'}
          </span>{' '}
          pour gagner{' '}
          <span className="font-bold text-orange-600">{rewardDescription || '[Récompense]'}</span>.
        </>
      );
    }
  };

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

      {/* Mode Selection */}
      <div className="space-y-4">
        <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">
          Mode de fidélité
        </label>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Visit Mode Card */}
          <button
            type="button"
            onClick={() => setMode('visit')}
            className={`relative text-left p-5 rounded-2xl border-2 transition-all duration-300 group ${
              mode === 'visit'
                ? 'border-indigo-500 bg-indigo-50/50 shadow-lg shadow-indigo-100'
                : 'border-gray-200 hover:border-indigo-200 hover:bg-gray-50'
            }`}
          >
            {mode === 'visit' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-3 right-3 w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center"
              >
                <Check className="w-4 h-4 text-white" />
              </motion.div>
            )}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-lg shadow-slate-200 group-hover:scale-105 transition-transform">
                <Footprints className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Mode Visite</h4>
                <p className="text-sm text-gray-500">1 passage = 1 point</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-[10px] font-medium text-slate-600">
                <Footprints className="w-3 h-3" /> Coiffeurs
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-[10px] font-medium text-slate-600">
                <Sparkles className="w-3 h-3" /> Instituts
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-[10px] font-medium text-slate-600">
                <Users className="w-3 h-3" /> Services
              </span>
            </div>
          </button>

          {/* Article Mode Card */}
          <button
            type="button"
            onClick={() => setMode('article')}
            className={`relative text-left p-5 rounded-2xl border-2 transition-all duration-300 group ${
              mode === 'article'
                ? 'border-orange-500 bg-orange-50/50 shadow-lg shadow-orange-100'
                : 'border-gray-200 hover:border-orange-200 hover:bg-gray-50'
            }`}
          >
            {mode === 'article' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-3 right-3 w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center"
              >
                <Check className="w-4 h-4 text-white" />
              </motion.div>
            )}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-200 group-hover:scale-105 transition-transform">
                <Pizza className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Mode Article</h4>
                <p className="text-sm text-gray-500">X articles = X points</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-100 text-[10px] font-medium text-orange-600">
                <Pizza className="w-3 h-3" /> Restaurants
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-100 text-[10px] font-medium text-orange-600">
                <Coffee className="w-3 h-3" /> Cafés
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-100 text-[10px] font-medium text-orange-600">
                <ShoppingBag className="w-3 h-3" /> Boulangeries
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Article Mode Config */}
      <AnimatePresence>
        {mode === 'article' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-6 overflow-hidden"
          >
            <div className="p-6 rounded-2xl bg-orange-50/50 border border-orange-100 space-y-6">
              <h4 className="text-sm font-bold text-orange-700 uppercase tracking-wider flex items-center gap-2">
                <Pizza className="w-4 h-4" />
                Configuration Article
              </h4>

              {/* Product Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Nom du produit
                </label>
                <Input
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Ex: Pizza, Café, Croissant..."
                  className="bg-white"
                />
                <p className="text-xs text-gray-500">
                  Le produit que vos clients accumulent pour gagner la récompense
                </p>
              </div>

              {/* Max Quantity Slider */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">
                  Quantité max par scan
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setMaxQuantity(Math.max(1, maxQuantity - 1))}
                    className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <Minus className="w-4 h-4 text-gray-600" />
                  </button>
                  <div className="flex-1 relative">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={maxQuantity}
                      onChange={(e) => setMaxQuantity(Number(e.target.value))}
                      className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 rounded-lg bg-orange-500 text-white text-sm font-bold">
                      {maxQuantity}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMaxQuantity(Math.min(10, maxQuantity + 1))}
                    className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Nombre maximum d&apos;articles qu&apos;un client peut valider en une fois
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                {mode === 'visit' ? 'passages' : 'articles'}
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
              placeholder="Ex: Une pizza offerte, -20%, Un café gratuit..."
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      <motion.div
        key={`${mode}-${stampsRequired}-${productName}-${rewardDescription}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-5 rounded-2xl border ${
          mode === 'visit'
            ? 'bg-indigo-50/50 border-indigo-100'
            : 'bg-orange-50/50 border-orange-100'
        }`}
      >
        <p className="text-sm font-medium text-gray-600 mb-2">Résumé du programme</p>
        <p className="text-lg text-gray-800">{getSummary()}</p>
      </motion.div>

    </div>
  );
}

export default MerchantSettingsForm;
