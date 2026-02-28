'use client';

import { useEffect, useState } from 'react';
import { Star, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewLink: string;
  shopName: string;
  merchantId: string;
}

const REVIEW_COOLDOWN_DAYS = 90;

export default function ReviewModal({ isOpen, onClose, reviewLink, shopName, merchantId }: ReviewModalProps) {
  const [alreadyAsked, setAlreadyAsked] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const key = `qarte_review_asked_${merchantId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const diff = (Date.now() - parseInt(stored)) / (1000 * 60 * 60 * 24);
      if (diff < REVIEW_COOLDOWN_DAYS) {
        setAlreadyAsked(true);
        onClose();
      }
    }
  }, [isOpen, merchantId, onClose]);

  const handleReview = () => {
    localStorage.setItem(`qarte_review_asked_${merchantId}`, Date.now().toString());
    window.open(reviewLink, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const handleDismiss = () => {
    localStorage.setItem(`qarte_review_asked_${merchantId}`, Date.now().toString());
    onClose();
  };

  if (alreadyAsked) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm mb-2 sm:mb-0 bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            {/* Fond doré subtil en haut */}
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-amber-50 to-transparent pointer-events-none" />

            {/* Bouton fermer */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-1.5 rounded-full text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="relative px-8 pt-10 pb-8 text-center">
              {/* Étoiles animées */}
              <motion.div
                className="flex items-center justify-center gap-1 mb-6"
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
              >
                {[1, 2, 3, 4, 5].map((i) => (
                  <motion.div
                    key={i}
                    variants={{
                      hidden: { opacity: 0, scale: 0.4, y: 8 },
                      visible: { opacity: 1, scale: 1, y: 0 },
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                  >
                    <Star className="w-7 h-7 text-amber-400 fill-amber-400" />
                  </motion.div>
                ))}
              </motion.div>

              {/* Nom du commerce */}
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="text-xs font-bold uppercase tracking-[0.18em] text-amber-500 mb-3"
              >
                {shopName}
              </motion.p>

              {/* Message principal */}
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="text-[1.35rem] font-black text-gray-900 leading-snug mb-8"
              >
                Un avis, c&apos;est la plus belle façon de nous soutenir.
              </motion.p>

              {/* Boutons */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="space-y-3"
              >
                <button
                  onClick={handleReview}
                  className="w-full h-14 flex items-center justify-center gap-2 rounded-2xl text-white text-base font-bold shadow-lg shadow-amber-200/60 hover:shadow-xl hover:shadow-amber-300/50 active:scale-[0.97] transition-all"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                >
                  Laisser mon avis
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={handleDismiss}
                  className="w-full py-3 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Non merci
                </button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
