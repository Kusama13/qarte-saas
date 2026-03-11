'use client';

import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSupabase } from '@/lib/supabase';
import { useMerchant } from '@/contexts/MerchantContext';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import IOSInstallInstructions from '@/components/shared/IOSInstallInstructions';

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

  // Query visits only on mobile — delay until merchant account is > 1 hour old
  // to avoid showing the install banner during initial setup
  useEffect(() => {
    if (!isMobile || !merchant?.id) return;
    const accountAgeMs = Date.now() - new Date(merchant.created_at).getTime();
    if (accountAgeMs < 3600_000) return;
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
  }, [isMobile, merchant?.id, merchant?.created_at]);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, 'true');
  };

  // Don't render on desktop
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
        <IOSInstallInstructions
          isIOS={isIOS}
          isIOSChrome={isIOSChrome}
          onClose={() => setShowIOSInstructions(false)}
          title="Installer Qarte Pro"
          subtitle="Accédez au tableau de bord en 1 tap"
          iconColor="#4f46e5"
          buttonClassName="bg-indigo-600 hover:bg-indigo-700"
        />
      )}
    </>
  );
}
