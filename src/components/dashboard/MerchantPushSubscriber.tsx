'use client';

import { useEffect } from 'react';
import { subscribeMerchantToPush } from '@/lib/merchant-push';

/**
 * Silent push subscriber for merchants.
 * Runs once on mount — if notification permission is already granted,
 * registers/refreshes the merchant push subscription.
 * No UI, no popup, no user interaction.
 */
export default function MerchantPushSubscriber() {
  useEffect(() => {
    // Small delay to avoid blocking initial render
    const timer = setTimeout(() => {
      subscribeMerchantToPush().catch(() => {
        // Silently ignore — push is best-effort
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
