'use client';

import Script from 'next/script';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const TT_PIXEL_ID = 'D6FCUKBC77UC649NN2J0';

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
      if (typeof window !== 'undefined' && (window as any).ttq) {
        (window as any).ttq.page();
      }
    }
  }, [pathname]);

  return null;
}

// Helper to track events
export function trackTTEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window !== 'undefined' && (window as any).ttq) {
    if (params) {
      (window as any).ttq.track(eventName, params);
    } else {
      (window as any).ttq.track(eventName);
    }
  }
}

// Standard events mapped for Qarte
export const ttEvents = {
  completeRegistration: () => trackTTEvent('CompleteRegistration'),
  initiateCheckout: () => trackTTEvent('InitiateCheckout'),
  completePayment: (value?: number) =>
    trackTTEvent('CompletePayment', value ? { value, currency: 'EUR' } : undefined),
  subscribe: (value?: number) =>
    trackTTEvent('Subscribe', value ? { value, currency: 'EUR' } : undefined),
};
