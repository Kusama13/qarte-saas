// Push notification utilities

// Cache for VAPID public key fetched from API
let cachedVapidPublicKey: string | null = null;

// Get VAPID public key - try env var first, then fetch from API
async function getVapidPublicKey(): Promise<string | null> {
  // Try environment variable first
  const envKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (envKey) return envKey;

  // Return cached key if available
  if (cachedVapidPublicKey) return cachedVapidPublicKey;

  // Fetch from API endpoint
  try {
    const response = await fetch('/api/push/config');
    if (response.ok) {
      const data = await response.json();
      cachedVapidPublicKey = data.vapidPublicKey;
      return cachedVapidPublicKey;
    }
  } catch (error) {
    console.error('Failed to fetch VAPID key:', error);
  }

  return null;
}

// Convert VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Check if push notifications are supported
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

// Check if device is iOS
export function isIOSDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

// Check if running as standalone PWA
export function isStandalonePWA(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
}

// Check iOS version (returns 0 if not iOS or can't detect)
export function getIOSVersion(): number {
  if (typeof window === 'undefined') return 0;
  const match = navigator.userAgent.match(/OS (\d+)_/);
  return match ? parseInt(match[1], 10) : 0;
}

// Check if iOS PWA push is supported (iOS 16.4+)
export function isIOSPushSupported(): boolean {
  if (!isIOSDevice()) return false;
  if (!isStandalonePWA()) return false;
  const version = getIOSVersion();
  // iOS 16.4+ supports push in PWA
  return version >= 16;
}

// Get current permission status
export function getPermissionStatus(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

// Register service worker
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered:', registration);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

// Request notification permission
export async function requestPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) return 'denied';

  const permission = await Notification.requestPermission();
  return permission;
}

// Subscribe to push notifications
// Note: subscription is linked to CUSTOMER only (not merchant)
// This allows customers to receive notifications from ALL their merchants
export async function subscribeToPush(
  customerId?: string
): Promise<{ success: boolean; subscription?: PushSubscription; error?: string }> {
  if (!isPushSupported()) {
    return { success: false, error: 'Push non supporté sur ce navigateur' };
  }

  if (!customerId) {
    return { success: false, error: 'Customer ID requis' };
  }

  // Get VAPID public key (from env or API)
  const vapidPublicKey = await getVapidPublicKey();
  if (!vapidPublicKey) {
    return { success: false, error: 'Configuration push manquante' };
  }

  try {
    // Request permission first
    const permission = await requestPermission();
    if (permission !== 'granted') {
      return { success: false, error: 'Permission refusée' };
    }

    // Register service worker
    const registration = await registerServiceWorker();
    if (!registration) {
      return { success: false, error: 'Erreur Service Worker' };
    }

    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();

    // If not subscribed, create new subscription
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      });
    }

    // Send subscription to backend
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        customerId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Erreur serveur');
    }

    return { success: true, subscription };
  } catch (error) {
    console.error('Push subscription error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // Unsubscribe locally
      await subscription.unsubscribe();

      // Remove from backend
      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
    }

    return true;
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return false;
  }
}

// Check if user is subscribed
export async function isSubscribed(): Promise<boolean> {
  if (!isPushSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch {
    return false;
  }
}
