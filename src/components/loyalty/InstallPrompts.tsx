'use client';

import {
  X,
  ChevronDown,
  ChevronUp,
  Share,
  PlusSquare,
  AlertCircle,
  Check,
  Bell,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InstallPromptsProps {
  merchant: { primary_color: string; secondary_color?: string | null; shop_name: string };
  isIOS: boolean;
  isIOSChrome: boolean;
  isMobile: boolean;
  isStandalone: boolean;
  showIOSInstructions: boolean;
  setShowIOSInstructions: (v: boolean) => void;
  showIOSVersionWarning: boolean;
  setShowIOSVersionWarning: (v: boolean) => void;
  iOSVersion: number;
  pushError: string | null;
  showSuccessToast: boolean;
}

export default function InstallPrompts({
  merchant,
  isIOS,
  isIOSChrome,
  isMobile,
  isStandalone,
  showIOSInstructions,
  setShowIOSInstructions,
  showIOSVersionWarning,
  setShowIOSVersionWarning,
  iOSVersion,
  pushError,
  showSuccessToast,
}: InstallPromptsProps) {
  return (
    <>
      {/* Push Error Display */}
      {pushError && (
        <div className="w-full rounded-2xl p-4 bg-red-50 border border-red-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-red-800 text-sm">Erreur d&apos;activation</p>
            <p className="text-xs text-red-600 mt-1">{pushError}</p>
            {isIOS && (
              <p className="text-xs text-red-500 mt-2">
                iOS {iOSVersion || '?'} • {isStandalone ? 'Mode PWA' : 'Navigateur'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-6 left-4 right-4 z-50 animate-slide-up">
          <div
            className="max-w-md mx-auto rounded-2xl p-4 shadow-2xl flex items-center gap-3"
            style={{ backgroundColor: merchant.primary_color }}
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Check className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-white">C&apos;est fait ! 🎉</p>
              <p className="text-sm text-white/80">Vous recevrez nos offres exclusives</p>
            </div>
          </div>
        </div>
      )}

      {/* iOS Instructions Modal */}
      {showIOSInstructions && (
        <>
          {/* Animated arrows */}
          {isIOS && !isIOSChrome && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, y: [0, 8, 0] }}
              transition={{ y: { duration: 0.8, repeat: Infinity }, opacity: { duration: 0.3 } }}
              className="fixed bottom-3 right-3 z-[60] flex flex-col items-center"
            >
              <div className="bg-white rounded-full p-2 shadow-xl border-2 border-blue-500">
                <ChevronDown className="w-6 h-6 text-blue-500" />
              </div>
            </motion.div>
          )}

          {isIOS && isIOSChrome && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, y: [0, -8, 0] }}
              transition={{ y: { duration: 0.8, repeat: Infinity }, opacity: { duration: 0.3 } }}
              className="fixed top-3 right-3 z-[60] flex flex-col items-center"
            >
              <div className="bg-white rounded-full p-2 shadow-xl border-2 border-blue-500">
                <ChevronUp className="w-6 h-6 text-blue-500" />
              </div>
            </motion.div>
          )}

          {!isIOS && isMobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, y: [0, -8, 0] }}
              transition={{ y: { duration: 0.8, repeat: Infinity }, opacity: { duration: 0.3 } }}
              className="fixed top-3 right-3 z-[60] flex flex-col items-center"
            >
              <div className="bg-white rounded-full p-2 shadow-xl border-2 border-blue-500">
                <ChevronUp className="w-6 h-6 text-blue-500" />
              </div>
            </motion.div>
          )}

          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowIOSInstructions(false)}
          >
            <div
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="relative px-4 py-4 text-center"
                style={{ background: `linear-gradient(135deg, ${merchant.primary_color}10, white)` }}
              >
                <button
                  onClick={() => setShowIOSInstructions(false)}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
                <div className="flex items-center justify-center gap-2">
                  <PlusSquare className="w-5 h-5" style={{ color: merchant.primary_color }} />
                  <h3 className="text-base font-bold text-gray-900">Ajouter à l&apos;écran d&apos;accueil</h3>
                </div>
                <p className="text-xs text-gray-500 mt-1">Pour recevoir les offres exclusives</p>
              </div>

              <div className="px-4 py-3 space-y-2">
                {isIOS && !isIOSChrome ? (
                  <>
                    <div className="flex items-center gap-3 p-2.5 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
                        <span className="text-white font-bold">⋯</span>
                      </div>
                      <p className="text-sm text-gray-800"><span className="font-semibold">1.</span> Appuyez sur <strong>⋯</strong> en bas</p>
                    </div>
                    <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                      <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
                        <Share className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-sm text-gray-800"><span className="font-semibold">2.</span> Puis <strong>Partager</strong></p>
                    </div>
                    <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
                        <PlusSquare className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-sm text-gray-800"><span className="font-semibold">3.</span> <strong>Sur l&apos;écran d&apos;accueil</strong></p>
                    </div>
                  </>
                ) : isIOS && isIOSChrome ? (
                  <>
                    <div className="flex items-center gap-3 p-2.5 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
                        <Share className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-sm text-gray-800"><span className="font-semibold">1.</span> Appuyez sur <strong>Partager</strong> ↑</p>
                    </div>
                    <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                      <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
                        <span className="text-white font-bold text-sm">⋯</span>
                      </div>
                      <p className="text-sm text-gray-800"><span className="font-semibold">2.</span> Puis <strong>Plus...</strong></p>
                    </div>
                    <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
                        <PlusSquare className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-sm text-gray-800"><span className="font-semibold">3.</span> <strong>Sur l&apos;écran d&apos;accueil</strong></p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 p-2.5 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
                        <span className="text-white font-bold">⋮</span>
                      </div>
                      <p className="text-sm text-gray-800"><span className="font-semibold">1.</span> Appuyez sur <strong>⋮</strong> en haut</p>
                    </div>
                    <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
                        <PlusSquare className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-sm text-gray-800"><span className="font-semibold">2.</span> <strong>Installer l&apos;application</strong></p>
                    </div>
                  </>
                )}
              </div>

              <div className="px-4 pb-4 pt-2">
                <button
                  onClick={() => setShowIOSInstructions(false)}
                  className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90"
                  style={{ backgroundColor: merchant.primary_color }}
                >
                  J&apos;ai compris
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* iOS Version Warning Modal */}
      {showIOSVersionWarning && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 text-center">
              <button
                onClick={() => setShowIOSVersionWarning(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>

              <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-amber-600" />
              </div>

              <h3 className="text-xl font-black text-gray-900 mb-2">Mise à jour requise</h3>
              <p className="text-gray-600 mb-4">
                Les notifications push nécessitent iOS 16.4 ou plus récent.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Votre version actuelle : iOS {iOSVersion || '?'}
                <br />
                Allez dans <span className="font-semibold">Réglages → Général → Mise à jour</span> pour mettre à jour votre iPhone.
              </p>

              <button
                onClick={() => setShowIOSVersionWarning(false)}
                className="w-full py-4 rounded-2xl font-bold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: merchant.primary_color }}
              >
                Compris
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Add to Home Screen Banner */}
      <AnimatePresence>
        {!isStandalone && isMobile && !showIOSInstructions && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowIOSInstructions(true)}
            className="fixed bottom-4 left-4 right-4 z-40"
          >
            <motion.div
              animate={{
                boxShadow: [
                  `0 0 0 0 ${merchant.primary_color}40`,
                  `0 0 0 8px ${merchant.primary_color}00`,
                  `0 0 0 0 ${merchant.primary_color}40`
                ],
                opacity: [1, 0.85, 1]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border-2"
              style={{
                backgroundColor: '#ffffff',
                borderColor: merchant.primary_color,
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="shrink-0"
              >
                {isIOS && !isIOSChrome ? (
                  <ChevronDown className="w-5 h-5" style={{ color: merchant.primary_color }} />
                ) : (
                  <ChevronUp className="w-5 h-5" style={{ color: merchant.primary_color }} />
                )}
              </motion.div>
              <span className="flex-1 text-sm font-semibold text-left" style={{ color: merchant.primary_color }}>
                Ajouter à l&apos;écran d&apos;accueil
              </span>
              <PlusSquare className="w-5 h-5 shrink-0" style={{ color: merchant.primary_color }} />
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Safari Share Arrow */}
      {/* (Note: Safari arrow state managed by parent) */}
    </>
  );
}
