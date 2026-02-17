'use client';

import {
  X,
  AlertTriangle,
  Gift,
  HelpCircle,
  EyeOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HowItWorksModalProps {
  show: boolean;
  onClose: () => void;
}

export function HowItWorksModal({ show, onClose }: HowItWorksModalProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-500" />
                Comment ça marche ?
              </h2>
              <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4 text-sm text-gray-700">
              {[
                { title: 'Rédigez votre notification', desc: 'Titre court et accrocheur + message clair' },
                { title: 'Ajoutez les détails de l\'offre', desc: 'Description visible sur la carte fidélité du client' },
                { title: 'Choisissez la durée', desc: 'L\'offre disparaît automatiquement après expiration' },
                { title: 'Envoyez !', desc: 'Immédiatement ou programmez pour plus tard' },
              ].map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{step.title}</p>
                    <p className="text-gray-500">{step.desc}</p>
                  </div>
                </div>
              ))}

              <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-100">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="font-bold text-red-700">Important</span>
                </div>
                <p className="text-red-600 text-xs">
                  N&apos;envoyez pas plus de 1-2 notifications par semaine. Trop de messages = désabonnements !
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full mt-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              J&apos;ai compris
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface OfferModalProps {
  show: boolean;
  onClose: () => void;
  title: string;
  description: string;
  imageUrl: string | null;
  expiresAt: string | null;
  onDeactivate: () => void;
}

export function OfferModal({ show, onClose, title, description, imageUrl, expiresAt, onDeactivate }: OfferModalProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Gift className="w-5 h-5 text-emerald-500" />
                Offre en cours
              </h2>
              <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Titre</p>
                <p className="font-bold text-gray-900">{title || '-'}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Description</p>
                <p className="text-gray-700 whitespace-pre-wrap">{description || '-'}</p>
              </div>

              {imageUrl && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Image</p>
                  <img src={imageUrl} alt="Offre" className="w-full h-40 object-cover rounded-xl" />
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Expiration</p>
                <p className="text-gray-700">
                  {expiresAt ? new Date(expiresAt).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : '-'}
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Fermer
              </button>
              <button
                onClick={() => { onClose(); onDeactivate(); }}
                className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                <EyeOff className="w-4 h-4" />
                Désactiver
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
