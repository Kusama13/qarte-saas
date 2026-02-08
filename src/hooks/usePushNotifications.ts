'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  isPushSupported,
  subscribeToPush,
  getPermissionStatus,
  isIOSDevice,
  isStandalonePWA,
  isIOSPushSupported,
  getIOSVersion,
} from '@/lib/push';
import { trackPushEnabled } from '@/lib/analytics';

interface UsePushNotificationsOptions {
  /** Customer ID to subscribe push for */
  customerId?: string;
  /** Skip initialization (e.g. in preview mode) */
  skip?: boolean;
}

interface UsePushNotificationsReturn {
  pushSupported: boolean;
  pushPermission: NotificationPermission | 'unsupported';
  pushSubscribing: boolean;
  pushSubscribed: boolean;
  pushError: string | null;
  isIOS: boolean;
  isIOSChrome: boolean;
  isStandalone: boolean;
  iOSVersion: number;
  showIOSInstructions: boolean;
  setShowIOSInstructions: (v: boolean) => void;
  showIOSVersionWarning: boolean;
  setShowIOSVersionWarning: (v: boolean) => void;
  showSuccessToast: boolean;
  handlePushSubscribe: () => Promise<void>;
}

export function usePushNotifications({
  customerId,
  skip = false,
}: UsePushNotificationsOptions = {}): UsePushNotificationsReturn {
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [pushSubscribing, setPushSubscribing] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);

  const [isIOS, setIsIOS] = useState(false);
  const [isIOSChrome, setIsIOSChrome] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [iOSVersion, setIOSVersion] = useState(0);

  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [showIOSVersionWarning, setShowIOSVersionWarning] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Initialize push state
  useEffect(() => {
    if (skip) return;

    const standardPush = isPushSupported();
    const iOS = isIOSDevice();
    const standalone = isStandalonePWA();
    const iosVersion = getIOSVersion();
    const iosPush = isIOSPushSupported();

    setIsIOS(iOS);
    setIsIOSChrome(iOS && /CriOS/i.test(navigator.userAgent));
    setIsStandalone(standalone);
    setIOSVersion(iosVersion);

    if (iOS && standalone) {
      setPushSupported(iosPush || standardPush);
    } else {
      setPushSupported(standardPush);
    }

    setPushPermission(getPermissionStatus());

    const already = localStorage.getItem('qarte_push_subscribed');
    if (already === 'true') {
      setPushSubscribed(true);
    }
  }, [skip]);

  const handlePushSubscribe = useCallback(async () => {
    if (!customerId) return;

    setPushError(null);

    // iOS not standalone → show install instructions
    if (isIOS && !isStandalone) {
      setShowIOSInstructions(true);
      return;
    }

    // iOS standalone old version → show warning
    if (isIOS && isStandalone && iOSVersion > 0 && iOSVersion < 16) {
      setShowIOSVersionWarning(true);
      return;
    }

    setPushSubscribing(true);
    try {
      const result = await subscribeToPush(customerId);
      if (result.success) {
        setPushSubscribed(true);
        setPushPermission('granted');
        localStorage.setItem('qarte_push_subscribed', 'true');
        trackPushEnabled(customerId);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 4000);
      } else {
        console.error('Push subscribe failed:', result.error);
        setPushError(result.error || 'Erreur inconnue');
        if (result.error === 'Permission refusée') {
          setPushPermission('denied');
        }
        if (isIOS && isStandalone && result.error === 'Push non supporté sur ce navigateur') {
          setShowIOSVersionWarning(true);
        }
      }
    } catch (error) {
      console.error('Push subscribe error:', error);
      setPushError(error instanceof Error ? error.message : 'Erreur inconnue');
      if (isIOS && isStandalone) {
        setShowIOSVersionWarning(true);
      }
    } finally {
      setPushSubscribing(false);
    }
  }, [customerId, isIOS, isStandalone, iOSVersion]);

  return {
    pushSupported,
    pushPermission,
    pushSubscribing,
    pushSubscribed,
    pushError,
    isIOS,
    isIOSChrome,
    isStandalone,
    iOSVersion,
    showIOSInstructions,
    setShowIOSInstructions,
    showIOSVersionWarning,
    setShowIOSVersionWarning,
    showSuccessToast,
    handlePushSubscribe,
  };
}
