'use client';

import Script from 'next/script';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const TT_PIXEL_ID = 'D6FCUKBC77UC649NN2J0';

declare global {
  interface Window {
    ttq: any;
  }
}

export function TikTokPixel() {
  return (
    <Script id="tt-pixel" strategy="afterInteractive">
      {`
        !function (w, d, t) {
          w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
          var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script")
          ;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
          ttq.load('${TT_PIXEL_ID}');
          ttq.page();
        }(window, document, 'ttq');
      `}
    </Script>
  );
}

// Track SPA route changes
export function TikTokPageTracker() {
  const pathname = usePathname();
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    if (pathname !== prevPathRef.current) {
      prevPathRef.current = pathname;
      if (typeof window !== 'undefined' && window.ttq) {
        window.ttq.page();
      }
    }
  }, [pathname]);

  return null;
}

// SHA-256 hash (client-side, for identify)
async function sha256(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value.trim().toLowerCase());
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Identify user for advanced matching (call before track events)
export async function ttIdentify(params: { email?: string; phone?: string; externalId?: string }) {
  if (typeof window === 'undefined' || !window.ttq) return;
  const data: Record<string, string> = {};
  if (params.email) data.email = await sha256(params.email);
  if (params.phone) data.phone_number = await sha256(params.phone);
  if (params.externalId) data.external_id = await sha256(params.externalId);
  if (Object.keys(data).length > 0) {
    window.ttq.identify(data);
  }
}

// Helper to track events with standard parameters
function trackTTEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window !== 'undefined' && window.ttq) {
    if (params) {
      window.ttq.track(eventName, params);
    } else {
      window.ttq.track(eventName);
    }
  }
}

// Qarte SaaS content descriptor
function qarteContent(plan?: 'monthly' | 'annual') {
  return {
    contents: [{
      content_id: plan === 'annual' ? 'qarte_pro_annual' : 'qarte_pro',
      content_type: 'product',
      content_name: plan === 'annual' ? 'Qarte Pro Annuel' : 'Qarte Pro',
    }],
  };
}

// Standard events mapped for Qarte
export const ttEvents = {
  completeRegistration: () =>
    trackTTEvent('CompleteRegistration', {
      ...qarteContent(),
      value: 0,
      currency: 'EUR',
    }),
  startTrial: () =>
    trackTTEvent('StartTrial', {
      ...qarteContent(),
      value: 0,
      currency: 'EUR',
    }),
  clickButton: (label?: string) =>
    trackTTEvent('ClickButton', {
      ...qarteContent(),
      value: 0,
      currency: 'EUR',
    }),
  subscribe: (value: number, plan: 'monthly' | 'annual' = 'monthly') =>
    trackTTEvent('Subscribe', {
      ...qarteContent(plan),
      value,
      currency: 'EUR',
    }),
  viewContent: (contentName: string) =>
    trackTTEvent('ViewContent', {
      contents: [{
        content_id: 'qarte_landing',
        content_type: 'product',
        content_name: contentName,
      }],
    }),
};
