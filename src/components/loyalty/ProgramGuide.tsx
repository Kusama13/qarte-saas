'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Scissors,
  Scan,
  ArrowRight,
  X,
  Sparkles,
  Users,
  MessageCircle,
  HelpCircle,
  Footprints,
} from 'lucide-react';
import { Button } from '@/components/ui';

interface ProgramGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export function ProgramGuide({ isOpen, onClose, onComplete }: ProgramGuideProps) {
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
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl"
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
              Comment fonctionne le programme ?
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              Un système simple et efficace pour fidéliser vos clients
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Mode Visite Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-6 rounded-3xl border-2 border-indigo-500 bg-indigo-50/50 shadow-lg shadow-indigo-100"
            >
              {/* Icon */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-lg shadow-slate-200">
                  <Footprints className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Mode Passage</h3>
                  <p className="text-sm text-gray-500">
                    1 visite = 1 point. Simple et efficace.
                  </p>
                </div>
              </div>

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
                    <Users className="w-3 h-3" /> Spas
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Examples */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100"
            >
              <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <span className="text-xs">💡</span>
                </div>
                Exemples concrets
              </h4>

              <div className="space-y-2 text-sm">
                <div className="p-3 rounded-xl bg-white border border-gray-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-lg">✂️</div>
                  <div className="flex-1">
                    <p className="text-gray-700">Marie vient se faire coiffer (brushing ou coloration)</p>
                  </div>
                  <span className="font-bold text-indigo-600 whitespace-nowrap">→ +1 point</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-gray-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center text-lg">💅</div>
                  <div className="flex-1">
                    <p className="text-gray-700">Julie fait une manucure + pédicure (1 visite)</p>
                  </div>
                  <span className="font-bold text-indigo-600 whitespace-nowrap">→ +1 point</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-gray-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-lg">🧖</div>
                  <div className="flex-1">
                    <p className="text-gray-700">Thomas vient pour un massage d&apos;1h</p>
                  </div>
                  <span className="font-bold text-indigo-600 whitespace-nowrap">→ +1 point</span>
                </div>
              </div>
              <p className="mt-3 text-xs text-gray-500 italic">
                Après 10 visites → Récompense : &quot;Une coupe offerte&quot; ou &quot;-50% sur la prochaine prestation&quot;
              </p>
            </motion.div>

            {/* WhatsApp Help */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center shrink-0 shadow-lg shadow-green-200">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-green-600" />
                    Encore des questions ?
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Notre équipe est disponible pour vous aider à configurer votre programme de fidélité parfait.
                  </p>
                  <a
                    href="https://wa.me/33607447420?text=Bonjour%2C%20j%27ai%20une%20question%20sur%20le%20programme%20de%20fid%C3%A9lit%C3%A9%20Qarte"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500 text-white font-semibold text-sm hover:bg-green-600 transition-colors shadow-md shadow-green-200"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Nous contacter sur WhatsApp
                  </a>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 border-t border-gray-100 bg-gray-50/50">
            <Button
              onClick={handleComplete}
              className="w-full h-14 rounded-2xl text-lg font-bold transition-all bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200 hover:shadow-xl hover:scale-[1.02]"
            >
              J&apos;ai compris, configurer mon programme
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ProgramGuide;
