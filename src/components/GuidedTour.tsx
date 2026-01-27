'use client';

import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gift,
  QrCode,
  Users,
  Crown,
  Megaphone,
  Settings,
  ChevronRight,
  ChevronLeft,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  selector: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'program',
    title: 'Mon Programme',
    description: 'Configurez votre programme de fidélité, définissez le nombre de points et la récompense.',
    icon: Gift,
    color: 'bg-pink-500',
    selector: 'program',
  },
  {
    id: 'qr',
    title: 'Télécharger QR',
    description: 'Téléchargez et imprimez votre QR code unique à afficher dans votre commerce.',
    icon: QrCode,
    color: 'bg-violet-600',
    selector: 'qr',
  },
  {
    id: 'customers',
    title: 'Clients',
    description: 'Consultez la liste de vos clients inscrits et leur activité.',
    icon: Users,
    color: 'bg-emerald-500',
    selector: 'customers',
  },
  {
    id: 'members',
    title: 'Membres',
    description: 'Gérez vos membres VIP et leurs avantages exclusifs.',
    icon: Crown,
    color: 'bg-amber-500',
    selector: 'members',
  },
  {
    id: 'marketing',
    title: 'Marketing',
    description: 'Envoyez des notifications push à vos clients pour les fidéliser.',
    icon: Megaphone,
    color: 'bg-orange-500',
    selector: 'marketing',
  },
  {
    id: 'settings',
    title: 'Paramètres',
    description: 'Modifiez les informations de votre commerce.',
    icon: Settings,
    color: 'bg-slate-500',
    selector: 'settings',
  },
];

interface GuidedTourProps {
  onComplete: () => void;
  onSkip: () => void;
}

interface SpotlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
  borderRadius: number;
}

export default function GuidedTour({ onComplete, onSkip }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [isDesktop, setIsDesktop] = useState(false);

  const activeStep = TOUR_STEPS[currentStep];

  // Update spotlight position based on the target element
  const updateSpotlight = useCallback(() => {
    const element = document.querySelector(`[data-tour="${activeStep.selector}"]`);
    if (element) {
      const rect = element.getBoundingClientRect();
      const padding = 6;
      setSpotlightRect({
        x: rect.left - padding,
        y: rect.top - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
        borderRadius: 12,
      });

      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeStep.selector]);

  useLayoutEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    checkDesktop();
    updateSpotlight();

    const handleResize = () => {
      checkDesktop();
      updateSpotlight();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', updateSpotlight);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', updateSpotlight);
    };
  }, [currentStep, updateSpotlight]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onSkip();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft' && currentStep > 0) {
        setCurrentStep(prev => prev - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, onSkip]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // SVG Path for the spotlight "hole"
  const getMaskPath = () => {
    if (!spotlightRect) return '';
    const { x, y, width: w, height: h, borderRadius: r } = spotlightRect;
    const { width: vw, height: vh } = windowSize;

    return `
      M 0 0 h ${vw} v ${vh} h -${vw} z
      M ${x + r} ${y}
      h ${w - 2 * r}
      a ${r} ${r} 0 0 1 ${r} ${r}
      v ${h - 2 * r}
      a ${r} ${r} 0 0 1 -${r} ${r}
      h -${w - 2 * r}
      a ${r} ${r} 0 0 1 -${r} -${r}
      v -${h - 2 * r}
      a ${r} ${r} 0 0 1 ${r} -${r}
      z
    `;
  };

  // Calculate tooltip position
  const getTooltipPosition = () => {
    if (!spotlightRect) return { top: 100, left: 300 };
    return {
      top: Math.min(Math.max(20, spotlightRect.y), windowSize.height - 320),
      left: spotlightRect.x + spotlightRect.width + 24,
    };
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      {/* --- DESKTOP VIEW --- */}
      {isDesktop && (
        <div className="w-full h-full relative">
          {/* Dark Backdrop with SVG Hole */}
          <svg className="absolute inset-0 w-full h-full">
            <motion.path
              d={getMaskPath()}
              fill="black"
              fillOpacity={0.75}
              fillRule="evenodd"
              initial={false}
              animate={{ d: getMaskPath() }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={onSkip}
              className="cursor-pointer"
            />
          </svg>

          {/* Pulsing ring around spotlight */}
          {spotlightRect && (
            <motion.div
              className="absolute border-2 border-indigo-400 rounded-xl pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0.5, 1, 0.5],
                scale: [1, 1.02, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{
                left: spotlightRect.x,
                top: spotlightRect.y,
                width: spotlightRect.width,
                height: spotlightRect.height,
              }}
            />
          )}

          {/* Desktop Tooltip */}
          <AnimatePresence mode="wait">
            {spotlightRect && (
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                animate={{
                  opacity: 1,
                  x: 0,
                  scale: 1,
                }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                style={getTooltipPosition()}
                className="absolute w-80 bg-white shadow-2xl rounded-2xl overflow-hidden border border-slate-100"
              >
                {/* Header Gradient */}
                <div className={cn("h-1.5 w-full", activeStep.color)} />

                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      Étape {currentStep + 1} / {TOUR_STEPS.length}
                    </span>
                    <button
                      onClick={onSkip}
                      className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="flex items-start gap-4 mb-4">
                    <div className={cn("p-2.5 rounded-xl text-white shrink-0", activeStep.color)}>
                      <activeStep.icon size={22} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg leading-tight mb-1">
                        {activeStep.title}
                      </h3>
                      <p className="text-slate-500 text-sm leading-relaxed">
                        {activeStep.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-6">
                    <button
                      onClick={onSkip}
                      className="text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      Passer
                    </button>
                    <div className="flex gap-2">
                      {currentStep > 0 && (
                        <button
                          onClick={handlePrev}
                          className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600"
                        >
                          <ChevronLeft size={18} />
                        </button>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleNext}
                        className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:shadow-xl transition-all flex items-center gap-2"
                      >
                        {currentStep === TOUR_STEPS.length - 1 ? 'Terminer' : 'Suivant'}
                        <ChevronRight size={16} />
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Tooltip Arrow */}
                <div
                  className="absolute top-8 -left-2 w-4 h-4 bg-white border-l border-b border-slate-100"
                  style={{ transform: 'rotate(45deg)' }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* --- MOBILE VIEW --- */}
      {!isDesktop && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -40, scale: 0.9 }}
              className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl"
            >
              {/* Mobile Visual */}
              <div className={cn("h-44 flex items-center justify-center relative", activeStep.color)}>
                <motion.div
                  initial={{ scale: 0, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="bg-white/20 backdrop-blur-md p-6 rounded-full border border-white/30 text-white shadow-2xl"
                >
                  <activeStep.icon size={56} strokeWidth={1.5} />
                </motion.div>
              </div>

              <div className="p-6 text-center">
                {/* Progress dots */}
                <div className="flex justify-center gap-1.5 mb-5">
                  {TOUR_STEPS.map((_, idx) => (
                    <motion.div
                      key={idx}
                      initial={false}
                      animate={{
                        width: idx === currentStep ? 24 : 6,
                        backgroundColor: idx === currentStep ? '#4F46E5' : '#E2E8F0',
                      }}
                      className="h-1.5 rounded-full"
                    />
                  ))}
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {activeStep.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-6">
                  {activeStep.description}
                </p>

                <div className="space-y-3">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNext}
                    className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200"
                  >
                    {currentStep === TOUR_STEPS.length - 1 ? 'Commencer' : 'Suivant'}
                  </motion.button>

                  <div className="flex justify-between px-2">
                    <button
                      onClick={handlePrev}
                      disabled={currentStep === 0}
                      className={cn(
                        "text-sm font-medium transition-colors",
                        currentStep === 0 ? "text-slate-300" : "text-slate-500 hover:text-slate-800"
                      )}
                    >
                      Précédent
                    </button>
                    <button
                      onClick={onSkip}
                      className="text-sm font-medium text-slate-400 hover:text-slate-800"
                    >
                      Passer
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
