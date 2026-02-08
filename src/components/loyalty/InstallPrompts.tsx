'use client';

import {
  X,
  ChevronDown,
  ChevronUp,
  Share,
  PlusSquare,
  AlertCircle,
  Check,
  Download,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface InstallPromptsProps {
  merchant: { primary_color: string; secondary_color?: string | null; shop_name: string };
  isIOS: boolean;
  isIOSChrome: boolean;
  isMobile: boolean;
  isStandalone: boolean;
  showInstallBar: boolean;
  onDismissInstallBar: () => void;
  deferredPrompt: any | null;
  onClearDeferredPrompt: () => void;
  showIOSInstructions: boolean;
  setShowIOSInstructions: (v: boolean) => void;
  showIOSVersionWarning: boolean;
  setShowIOSVersionWarning: (v: boolean) => void;
  iOSVersion: number;
  showSuccessToast: boolean;
}

export default function InstallPrompts({
  merchant,
  isIOS,
  isIOSChrome,
  isMobile,
  isStandalone,
  showInstallBar,
  onDismissInstallBar,
  deferredPrompt,
  onClearDeferredPrompt,
  showIOSInstructions,
  setShowIOSInstructions,
  showIOSVersionWarning,
  setShowIOSVersionWarning,
  iOSVersion,
  showSuccessToast,
}: InstallPromptsProps) {

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Android: native install prompt
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          onDismissInstallBar();
        }
      } catch (err) {
        console.error('Install prompt error:', err);
      }
      onClearDeferredPrompt();
    } else {
      // iOS or other: show manual instructions
      setShowIOSInstructions(true);
    }
  };

  return (
    <>
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

      {/* Smart Install Bar - Sticky bottom with safe area */}
      <AnimatePresence>
        {showInstallBar && !showIOSInstructions && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                style={{ background: `linear-gradient(135deg, ${merchant.primary_color}, ${merchant.secondary_color || merchant.primary_color})` }}
              >
                <Download className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{merchant.shop_name}</p>
                <p className="text-xs text-gray-500">Retrouvez votre carte en 1 tap</p>
              </div>
              <button
                onClick={handleInstallClick}
                className="shrink-0 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
                style={{ backgroundColor: merchant.primary_color }}
              >
                Installer
              </button>
              <button
                onClick={onDismissInstallBar}
                className="shrink-0 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
