'use client';

import { useState, useEffect } from 'react';
import { X, Download, Share, PlusSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSupabase } from '@/lib/supabase';
import { useMerchant } from '@/contexts/MerchantContext';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

const DISMISS_KEY = 'qarte-pro-install-dismissed';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1023px)');
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

export default function InstallAppBanner() {
  const isMobile = useIsMobile();
  const { merchant } = useMerchant();
  const [hasReceivedScan, setHasReceivedScan] = useState(false);
  const [dismissed, setDismissed] = useState(true); // default hidden to avoid flash

  // Only run PWA hook on mobile
  const {
    showInstallButton,
    isIOS,
    isIOSChrome,
    promptInstall,
    showIOSInstructions,
    setShowIOSInstructions,
  } = useInstallPrompt(isMobile ? '/api/manifest/pro' : undefined);

  // Check localStorage dismiss
  useEffect(() => {
    if (!isMobile) return;
    setDismissed(localStorage.getItem(DISMISS_KEY) === 'true');
  }, [isMobile]);

  // Query visits only on mobile
  useEffect(() => {
    if (!isMobile || !merchant?.id) return;
    const supabase = getSupabase();
    supabase
      .from('visits')
      .select('*', { count: 'exact', head: true })
      .eq('merchant_id', merchant.id)
      .eq('status', 'confirmed')
      .limit(1)
      .then(({ count }: { count: number | null }) => {
        if ((count ?? 0) >= 1) setHasReceivedScan(true);
      });
  }, [isMobile, merchant?.id]);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, 'true');
  };

  // Don't render anything on desktop
  if (!isMobile) return null;

  const visible = hasReceivedScan && showInstallButton && !dismissed;

  return (
    <>
      {/* Sticky install banner */}
      <AnimatePresence>
        {visible && !showIOSInstructions && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-indigo-600 to-violet-600 shadow-[0_-4px_20px_rgba(0,0,0,0.15)]"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">Installez Qarte Pro</p>
                <p className="text-xs text-white/70">Accédez au tableau de bord en 1 tap</p>
              </div>
              <button
                onClick={promptInstall}
                className="shrink-0 px-4 py-2 rounded-xl text-sm font-bold text-indigo-600 bg-white transition-all active:scale-95 hover:bg-indigo-50"
              >
                Installer
              </button>
              <button
                onClick={handleDismiss}
                className="shrink-0 p-1.5 rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions modal */}
      {showIOSInstructions && (
        <>
          {/* Animated arrows pointing to the right button */}
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

          {!isIOS && (
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
              <div className="px-4 py-4 text-center bg-gradient-to-r from-indigo-50 to-violet-50">
                <button
                  onClick={() => setShowIOSInstructions(false)}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
                <div className="flex items-center justify-center gap-2">
                  <PlusSquare className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-gray-900">Installer Qarte Pro</h3>
                </div>
                <p className="text-xs text-gray-500 mt-1">Accédez au tableau de bord en 1 tap</p>
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
                      <p className="text-sm text-gray-800"><span className="font-semibold">2.</span> <strong>Ajouter un raccourci</strong></p>
                    </div>
                  </>
                )}
              </div>

              <div className="px-4 pb-4 pt-2">
                <button
                  onClick={() => setShowIOSInstructions(false)}
                  className="w-full py-3 rounded-xl font-semibold text-white text-sm bg-indigo-600 hover:bg-indigo-700 transition-colors"
                >
                  J&apos;ai compris
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
