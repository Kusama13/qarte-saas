'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scissors,
  Pizza,
  Scan,
  Plus,
  ArrowRight,
  Check,
  X,
  Sparkles,
  Users,
  ShoppingBag,
  Coffee,
} from 'lucide-react';
import { Button } from '@/components/ui';

interface ProgramGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export function ProgramGuide({ isOpen, onClose, onComplete }: ProgramGuideProps) {
  const [selectedMode, setSelectedMode] = useState<'visit' | 'article' | null>(null);

  const handleComplete = () => {
    onComplete?.();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          {/* Header */}
          <div className="px-8 pt-10 pb-6 text-center border-b border-gray-100">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring' }}
              className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-200"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">
              Quel programme est fait pour vous ?
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              Choisissez le mode de fidélité adapté à votre activité. Vous pourrez toujours le modifier plus tard.
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Mode Visite */}
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                onClick={() => setSelectedMode('visit')}
                className={`relative text-left p-6 rounded-3xl border-2 transition-all duration-300 group ${
                  selectedMode === 'visit'
                    ? 'border-indigo-500 bg-indigo-50/50 shadow-lg shadow-indigo-100'
                    : 'border-gray-200 hover:border-indigo-200 hover:bg-gray-50'
                }`}
              >
                {selectedMode === 'visit' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center"
                  >
                    <Check className="w-5 h-5 text-white" />
                  </motion.div>
                )}

                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center mb-4 shadow-lg shadow-slate-200 group-hover:scale-105 transition-transform">
                  <Scissors className="w-7 h-7 text-white" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">Mode Visite</h3>
                <p className="text-sm text-gray-500 mb-6">
                  1 passage = 1 point. Simple et efficace.
                </p>

                {/* Visual Schema */}
                <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Comment ça marche
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                        <Scan className="w-6 h-6 text-slate-600" />
                      </div>
                      <span className="text-[10px] font-medium text-gray-500 mt-1">Scan</span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-300" />
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                        <span className="text-lg font-black text-indigo-600">+1</span>
                      </div>
                      <span className="text-[10px] font-medium text-gray-500 mt-1">Point</span>
                    </div>
                  </div>
                </div>

                {/* For Who */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Idéal pour
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-xs font-medium text-slate-700">
                      <Scissors className="w-3 h-3" /> Coiffeurs
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-xs font-medium text-slate-700">
                      <Sparkles className="w-3 h-3" /> Instituts
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-xs font-medium text-slate-700">
                      <Users className="w-3 h-3" /> Services
                    </span>
                  </div>
                </div>

                {/* Advantage Badge */}
                <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <p className="text-xs font-semibold text-emerald-700">
                    Simple et rapide, idéal si vos prix varient peu
                  </p>
                </div>
              </motion.button>

              {/* Mode Article */}
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                onClick={() => setSelectedMode('article')}
                className={`relative text-left p-6 rounded-3xl border-2 transition-all duration-300 group ${
                  selectedMode === 'article'
                    ? 'border-orange-500 bg-orange-50/50 shadow-lg shadow-orange-100'
                    : 'border-gray-200 hover:border-orange-200 hover:bg-gray-50'
                }`}
              >
                {selectedMode === 'article' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center"
                  >
                    <Check className="w-5 h-5 text-white" />
                  </motion.div>
                )}

                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-4 shadow-lg shadow-orange-200 group-hover:scale-105 transition-transform">
                  <Pizza className="w-7 h-7 text-white" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">Mode Article</h3>
                <p className="text-sm text-gray-500 mb-6">
                  X articles achetés = X points. Récompense le volume.
                </p>

                {/* Visual Schema */}
                <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Comment ça marche
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                        <Scan className="w-5 h-5 text-orange-600" />
                      </div>
                      <span className="text-[9px] font-medium text-gray-500 mt-1">Scan</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300" />
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-xs font-bold text-orange-600">
                        Qté?
                      </div>
                      <span className="text-[9px] font-medium text-gray-500 mt-1">Choix</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300" />
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center">
                        <span className="text-sm font-black text-white">+3</span>
                      </div>
                      <span className="text-[9px] font-medium text-gray-500 mt-1">Points</span>
                    </div>
                  </div>
                </div>

                {/* For Who */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Idéal pour
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-100 text-xs font-medium text-orange-700">
                      <Pizza className="w-3 h-3" /> Restaurants
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-100 text-xs font-medium text-orange-700">
                      <Coffee className="w-3 h-3" /> Cafés
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-100 text-xs font-medium text-orange-700">
                      <ShoppingBag className="w-3 h-3" /> Boulangeries
                    </span>
                  </div>
                </div>

                {/* Advantage Badge */}
                <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-100">
                  <p className="text-xs font-semibold text-amber-700">
                    Récompense le volume. Idéal si un client achète pour toute la famille
                  </p>
                </div>
              </motion.button>
            </div>

            {/* Example Comparison */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100"
            >
              <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <span className="text-xs">💡</span>
                </div>
                Exemple concret
              </h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="p-4 rounded-xl bg-white border border-gray-100">
                  <p className="font-semibold text-gray-900 mb-1">Mode Visite</p>
                  <p className="text-gray-500">
                    Marie vient se faire coiffer → <span className="font-semibold text-indigo-600">+1 point</span>
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white border border-gray-100">
                  <p className="font-semibold text-gray-900 mb-1">Mode Article</p>
                  <p className="text-gray-500">
                    Pierre achète 3 pizzas → <span className="font-semibold text-orange-600">+3 points</span>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 border-t border-gray-100 bg-gray-50/50">
            <Button
              onClick={handleComplete}
              disabled={!selectedMode}
              className={`w-full h-14 rounded-2xl text-lg font-bold transition-all ${
                selectedMode
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200 hover:shadow-xl hover:scale-[1.02]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {selectedMode ? (
                <>
                  J'ai compris, configurer mon programme
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              ) : (
                'Sélectionnez un mode pour continuer'
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ProgramGuide;
