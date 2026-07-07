'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect } from 'react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

interface ImageLightboxProps {
  /** URL de l'image à afficher en grand. `null` → lightbox fermée. */
  src: string | null;
  alt: string;
  onClose: () => void;
  closeLabel?: string;
  /** Navigation optionnelle (galerie multi-photos) : flèches + touches ←/→ si fournies. */
  onPrev?: () => void;
  onNext?: () => void;
  prevLabel?: string;
  nextLabel?: string;
}

/**
 * Lightbox une image : plein écran, fond sombre, fermeture au clic dehors / croix / Échap.
 * Navigation prev/next optionnelle (galerie). Verrou de scroll compteur → s'ouvre proprement
 * même par-dessus une autre modale (z-[60] pour passer au-dessus des modales vitrine en z-50).
 */
export default function ImageLightbox({ src, alt, onClose, closeLabel, onPrev, onNext, prevLabel, nextLabel }: ImageLightboxProps) {
  useBodyScrollLock(!!src);

  useEffect(() => {
    if (!src) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') onPrev?.();
      else if (e.key === 'ArrowRight') onNext?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [src, onClose, onPrev, onNext]);

  const hasNav = !!onPrev && !!onNext;

  return (
    <AnimatePresence>
      {src && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <button
            type="button"
            aria-label={closeLabel || 'Fermer'}
            className="absolute top-4 right-4 p-3 text-white/80 hover:text-white transition-colors z-10"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>

          {hasNav && (
            <>
              <button
                type="button"
                aria-label={prevLabel || 'Précédent'}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-3 text-white/60 hover:text-white transition-colors z-10"
                onClick={(e) => { e.stopPropagation(); onPrev!(); }}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                aria-label={nextLabel || 'Suivant'}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-3 text-white/60 hover:text-white transition-colors z-10"
                onClick={(e) => { e.stopPropagation(); onNext!(); }}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <motion.img
            key={src}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.2 }}
            src={src}
            alt={alt}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
