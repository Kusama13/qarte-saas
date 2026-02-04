'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Scan,
  ArrowRight,
  X,
  Sparkles,
  MessageCircle,
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
          className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl"
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
          <div className="px-6 pt-8 pb-4 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring' }}
              className="inline-flex items-center justify-center w-14 h-14 mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-200"
            >
              <Sparkles className="w-7 h-7 text-white" />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Comment ça marche ?
            </h2>
          </div>

          {/* Content */}
          <div className="px-6 pb-6">
            {/* Simple explanation */}
            <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 mb-4">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                    <Scan className="w-6 h-6 text-gray-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-500 mt-1">Le client scanne</span>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-300" />
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <span className="text-lg font-bold text-indigo-600">+1</span>
                  </div>
                  <span className="text-xs font-medium text-gray-500 mt-1">Gagne 1 point</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 text-center">
                Chaque passage = 1 point. Une fois l&apos;objectif atteint, le client reçoit sa récompense.
              </p>
            </div>

            {/* WhatsApp Help */}
            <div className="p-4 rounded-2xl bg-green-50 border border-green-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center shrink-0 shadow-md">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">Une question ?</p>
                  <a
                    href="https://wa.me/33607447420?text=Bonjour%2C%20j%27ai%20une%20question%20sur%20Qarte"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-green-600 font-semibold hover:underline"
                  >
                    Contactez-nous sur WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100">
            <Button
              onClick={handleComplete}
              className="w-full h-12 rounded-xl font-semibold transition-all bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md hover:shadow-lg"
            >
              Compris
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ProgramGuide;
