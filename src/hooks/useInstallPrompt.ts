'use client';

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface UseInstallPromptReturn {
  showInstallButton: boolean;
  isIOS: boolean;
  isIOSChrome: boolean;
  isInstalled: boolean;
  promptInstall: () => Promise<void>;
  showIOSInstructions: boolean;
  setShowIOSInstructions: (v: boolean) => void;
}

const NOOP_RETURN: UseInstallPromptReturn = {
  showInstallButton: false,
  isIOS: false,
  isIOSChrome: false,
  isInstalled: false,
  promptInstall: async () => {},
  showIOSInstructions: false,
  setShowIOSInstructions: () => {},
};

/**
 * PWA install hook for the merchant dashboard.
 * Pass `undefined` to disable all effects (e.g. on desktop).
 */
export function useInstallPrompt(manifestHref: string | undefined): UseInstallPromptReturn {
  const enabled = !!manifestHref;

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isIOSChrome, setIsIOSChrome] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  // Register service worker scoped to /dashboard (needed for beforeinstallprompt)
  useEffect(() => {
    if (!enabled) return;
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/dashboard' }).catch(() => {});
    }
  }, [enabled]);

  // Override manifest link to use the Pro manifest on dashboard pages
  useEffect(() => {
    if (!enabled || !manifestHref) return;
    // Remove existing manifest link (Next.js default)
    const existing = document.querySelector('link[rel="manifest"]');
    if (existing) existing.remove();
    // Inject the Pro manifest
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = manifestHref;
    document.head.appendChild(link);
    return () => { link.remove(); };
  }, [enabled, manifestHref]);

  // Detect platform and standalone mode
  useEffect(() => {
    if (!enabled) return;

    const iOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(iOS);
    setIsIOSChrome(iOS && /CriOS/i.test(navigator.userAgent));

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;
    setIsInstalled(standalone);
    // Track if already installed (in case appinstalled event was missed)
    if (standalone) {
      fetch('/api/pwa/track-install', { method: 'POST' }).catch(() => {});
    }
  }, [enabled]);

  // Capture beforeinstallprompt + appinstalled
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      // Track install in DB (fire-and-forget)
      fetch('/api/pwa/track-install', { method: 'POST' }).catch(() => {});
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [enabled]);

  const promptInstall = useCallback(async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
        }
      } catch {
        // prompt failed silently
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSInstructions(true);
    }
  }, [deferredPrompt, isIOS]);

  if (!enabled) return NOOP_RETURN;

  const canPrompt = !!deferredPrompt;
  const showInstallButton = !isInstalled && (canPrompt || isIOS);

  return {
    showInstallButton,
    isIOS,
    isIOSChrome,
    isInstalled,
    promptInstall,
    showIOSInstructions,
    setShowIOSInstructions,
  };
}
