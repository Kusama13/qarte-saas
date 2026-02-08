'use client';

import { useState } from 'react';
import { Clock, ChevronDown, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MerchantOffer {
  active: boolean;
  title: string;
  description: string;
  imageUrl: string | null;
  expiresAt: string | null;
}

interface ExclusiveOfferProps {
  offer: MerchantOffer;
  merchantColor: string;
  isPreview?: boolean;
}

export default function ExclusiveOffer({ offer, merchantColor, isPreview }: ExclusiveOfferProps) {
  const [expanded, setExpanded] = useState(false);

  if (!offer.active) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mb-4 overflow-hidden rounded-2xl shadow-lg shadow-black/5 border border-white/20 relative"
    >
      {isPreview && (
        <div className="absolute top-2 right-2 z-20 bg-white/90 backdrop-blur-sm text-[10px] font-bold text-gray-500 px-2 py-0.5 rounded-full border border-gray-200 shadow-sm">
          Exemple — Personnalisable
        </div>
      )}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left transition-transform active:scale-[0.99]"
      >
        <div
          className="relative p-4 text-white overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${merchantColor} 0%, ${merchantColor}dd 100%)`
          }}
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />

          <div className="relative flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/20 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-white" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white">Offre Exclusive</span>
                </div>
              </div>
              <h3 className="text-base font-extrabold leading-tight mb-1 drop-shadow-sm">
                {offer.title}
              </h3>
              {offer.expiresAt && (
                <div className="flex items-center gap-1.5 text-white/90 text-xs font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    Valable jusqu&apos;au {(() => {
                      const expires = new Date(offer.expiresAt);
                      const today = new Date();
                      const tomorrow = new Date(today);
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      if (expires.toDateString() === today.toDateString()) {
                        return "ce soir";
                      } else if (expires.toDateString() === tomorrow.toDateString()) {
                        return "demain soir";
                      } else {
                        return expires.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
                      }
                    })()}
                  </span>
                </div>
              )}
            </div>

            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              className="ml-3 w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30"
            >
              <ChevronDown className="w-4 h-4 text-white" />
            </motion.div>
          </div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white overflow-hidden"
          >
            <div className="p-4 border-t border-gray-100">
              <p className="text-sm text-gray-600 leading-relaxed">
                {offer.description}
              </p>
              {offer.imageUrl && (
                <div className="mt-3 rounded-xl overflow-hidden border border-gray-100">
                  <img
                    src={offer.imageUrl}
                    alt={offer.title}
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
