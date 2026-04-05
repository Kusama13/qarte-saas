'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  isPushSupported,
  requestPermission,
  getPermissionStatus,
  getVapidPublicKey,
  urlBase64ToUint8Array,
  isIOSDevice,
  isStandalonePWA,
  isIOSPushSupported,
  getIOSVersion,
} from '@/lib/push';

const LS_KEY = 'qarte_merchant_push_subscribed';
const LS_DISMISSED_KEY = 'qarte_merchant_push_dismissed';

export function useMerchantPushNotifications() {
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [pushSubscribing, setPushSubscribing] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(true);

  const isIOS = typeof navigator !== 'undefined' && isIOSDevice();
  const isStandalone = typeof navigator !== 'undefined' && isStandalonePWA();

  useEffect(() => {
    const supported = isPushSupported() || (isIOS && isStandalone && isIOSPushSupported());
    setPushSupported(supported);
    setPushPermission(getPermissionStatus());
    setDismissed(localStorage.getItem(LS_DISMISSED_KEY) === 'true');

    // Verify real subscription state via the SW — localStorage can be stale if iOS revoked the endpoint
    (async () => {
      if (!supported || !('serviceWorker' in navigator)) {
        setPushSubscribed(false);
        return;
      }
      try {
        const reg = await navigator.serviceWorker.getRegistration('/dashboard');
        const sub = reg ? await reg.pushManager.getSubscription() : null;
        const isReallySubscribed = !!sub;
        setPushSubscribed(isReallySubscribed);
        if (isReallySubscribed) {
          localStorage.setItem(LS_KEY, 'true');
        } else {
          localStorage.removeItem(LS_KEY);
        }
      } catch {
        setPushSubscribed(localStorage.getItem(LS_KEY) === 'true');
      }
    })();
  }, [isIOS, isStandalone]);

  const subscribe = useCallback(async () => {
    setPushError(null);
    setPushSubscribing(true);

    try {
      const vapidKey = await getVapidPublicKey();
      if (!vapidKey) {
        setPushError('Configuration push manquante');
        return;
      }

      const permission = await requestPermission();
      if (permission !== 'granted') {
        setPushPermission('denied');
        setPushError('Permission refusée');
        return;
      }

      // Register SW with /dashboard scope (must match manifest Pro scope)
      let registration: ServiceWorkerRegistration | null = null;
      try {
        registration = await navigator.serviceWorker.register('/sw.js', { scope: '/dashboard' });
      } catch {
        registration = null;
      }
      if (!registration) {
        setPushError('Service Worker non disponible');
        return;
      }

      await navigator.serviceWorker.ready;

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
        });
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch('/api/merchant-push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: subscription.toJSON() }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          setPushError(data.error || 'Erreur serveur');
          return;
        }
      } catch {
        clearTimeout(timeout);
        setPushError('Erreur réseau');
        return;
      }

      setPushSubscribed(true);
      setPushPermission('granted');
      localStorage.setItem(LS_KEY, 'true');
    } catch (error) {
      setPushError(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setPushSubscribing(false);
    }
  }, []);

  const dismiss = useCallback(() => {
    setDismissed(true);
    localStorage.setItem(LS_DISMISSED_KEY, 'true');
  }, []);

  // Show prompt only in standalone PWA mode (not desktop browser)
  const showPrompt = pushSupported && isStandalone && !pushSubscribed && !dismissed && pushPermission !== 'denied';
  const iOSVersion = typeof navigator !== 'undefined' ? getIOSVersion() : 0;

  return {
    pushSupported,
    pushPermission,
    pushSubscribing,
    pushSubscribed,
    pushError,
    showPrompt,
    subscribe,
    dismiss,
    isIOS,
    isStandalone,
    iOSVersion,
  };
}
