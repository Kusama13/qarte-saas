'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, X, Check, Sparkles, Gift, QrCode, Share2, BarChart3 } from 'lucide-react';

interface OnboardingGuideProps {
  onComplete: () => void;
  onSkip: () => void;
}

interface StepConfig {
  number: number;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const steps: StepConfig[] = [
  {
    number: 1,
    title: "Configurez votre programme",
    description: "Personnalisez vos récompenses, le nombre de points requis et votre message de bienvenue.",
    icon: Gift,
    color: "#EC4899",
  },
  {
    number: 2,
    title: "Téléchargez votre QR code",
    description: "Récupérez votre QR code unique à imprimer et afficher dans votre commerce.",
    icon: QrCode,
    color: "#8B5CF6",
  },
  {
    number: 3,
    title: "Partagez avec vos clients",
    description: "Vos clients scannent le QR code pour rejoindre votre programme en quelques secondes.",
    icon: Share2,
    color: "#10B981",
  },
  {
    number: 4,
    title: "Suivez vos statistiques",
    description: "Analysez vos performances et l'engagement de vos clients fidèles en temps réel.",
    icon: BarChart3,
    color: "#F59E0B",
  },
];

const OnboardingGuide: React.FC<OnboardingGuideProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const isLastStep = currentStep === steps.length - 1;

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }, [isLastStep, onComplete]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onSkip();
    } else if (e.key === 'Enter' || e.key === 'ArrowRight') {
      handleNext();
    } else if (e.key === 'ArrowLeft' && currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [onSkip, handleNext, currentStep]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isVisible) return null;

  const step = steps[currentStep];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
          onClick={onSkip}
        />

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative z-10 w-full max-w-lg mx-4"
        >
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Header with gradient */}
            <div className="relative bg-gradient-to-r from-indigo-600 to-violet-600 px-8 pt-8 pb-16">
              {/* Close button */}
              <button
                onClick={onSkip}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all"
              >
                <X size={20} />
              </button>

              {/* Progress dots */}
              <div className="flex items-center gap-2 mb-6">
                {steps.map((_, i) => (
                  <motion.div
                    key={i}
                    initial={false}
                    animate={{
                      width: i === currentStep ? 24 : 8,
                      backgroundColor: i <= currentStep ? 'white' : 'rgba(255,255,255,0.3)',
                    }}
                    className="h-2 rounded-full"
                    transition={{ duration: 0.3 }}
                  />
                ))}
              </div>

              {/* Welcome text */}
              <h2 className="text-white/80 text-sm font-medium mb-1">
                Bienvenue sur Qarte
              </h2>
              <h1 className="text-white text-2xl font-bold">
                Configurez votre programme en 4 étapes
              </h1>

              {/* Decorative elements */}
              <div className="absolute -bottom-6 right-8">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="w-24 h-24 rounded-2xl bg-white shadow-xl flex items-center justify-center"
                >
                  <step.icon size={40} style={{ color: step.color }} />
                </motion.div>
              </div>
            </div>

            {/* Content */}
            <div className="px-8 pt-10 pb-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Step number */}
                  <div className="flex items-center gap-3 mb-4">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200"
                    >
                      {step.number}
                    </motion.div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {step.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-gray-500 leading-relaxed mb-8 ml-[52px]">
                    {step.description}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Last step celebration */}
              {isLastStep && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-100"
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="text-amber-500" size={24} />
                    <div>
                      <p className="font-semibold text-amber-900">Vous y êtes presque !</p>
                      <p className="text-sm text-amber-700">Commencez à fidéliser vos clients dès maintenant.</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between">
                <button
                  onClick={onSkip}
                  className="text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Passer le guide
                </button>

                <div className="flex items-center gap-3">
                  {currentStep > 0 && (
                    <button
                      onClick={() => setCurrentStep((prev) => prev - 1)}
                      className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                    >
                      Précédent
                    </button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNext}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-200 hover:shadow-xl transition-all"
                  >
                    {isLastStep ? (
                      <>
                        C'est parti !
                        <Check size={18} />
                      </>
                    ) : (
                      <>
                        Suivant
                        <ChevronRight size={18} />
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </div>

          {/* Keyboard hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center text-white/50 text-xs mt-4"
          >
            Appuyez sur Entrée pour continuer ou Echap pour fermer
          </motion.p>
        </motion.div>

        {/* Floating sparkles on last step */}
        {isLastStep && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 100 }}
                animate={{
                  opacity: [0, 1, 0],
                  y: -500,
                  x: Math.sin(i) * 200,
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
                className="absolute bottom-0"
                style={{ left: `${10 + i * 12}%` }}
              >
                <Sparkles size={20} className="text-amber-400/60" />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingGuide;
