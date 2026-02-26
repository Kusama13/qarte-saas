// Merchant push notification utilities
// Reuses the same VAPID key and service worker as customer push,
// but saves subscriptions to merchant_push_subscriptions table.

import { isPushSupported, registerServiceWorker } from '@/lib/push';

// Get VAPID public key
function getVapidPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Subscribe the current merchant to push notifications.
 * Only subscribes if permission is already 'granted' (no popup).
 */
export async function subscribeMerchantToPush(): Promise<boolean> {
  if (!isPushSupported()) return false;

  // Only proceed if permission already granted — no intrusive popup
  if (Notification.permission !== 'granted') return false;

  const vapidPublicKey = getVapidPublicKey();
  if (!vapidPublicKey) return false;

  try {
    const registration = await registerServiceWorker();
    if (!registration) return false;

    // Check existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      });
    }

    // Send to our API
    const res = await fetch('/api/merchants/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
            auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))),
          },
        },
      }),
    });

    return res.ok;
  } catch (error) {
    console.error('Merchant push subscribe error:', error);
    return false;
  }
}
