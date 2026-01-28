"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

const FB_PIXEL_ID = "1438158154679532";

// Facebook Pixel component - add to pages that need tracking
export function FacebookPixel() {
  return (
    <>
      <Script id="fb-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${FB_PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}

// Helper function to track events
export function trackFBEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window !== "undefined" && (window as any).fbq) {
    if (params) {
      (window as any).fbq("track", eventName, params);
    } else {
      (window as any).fbq("track", eventName);
    }
  }
}

// Common events
export const fbEvents = {
  lead: () => trackFBEvent("Lead"),
  completeRegistration: () => trackFBEvent("CompleteRegistration"),
  startTrial: () => trackFBEvent("StartTrial"),
  subscribe: (value?: number) => trackFBEvent("Subscribe", value ? { value, currency: "EUR" } : undefined),
  scrollDepth: (percent: number) => trackFBEvent("ScrollDepth", { percent }),
  initiateCheckout: () => trackFBEvent("InitiateCheckout"), // Clic signup
};

// Scroll depth tracking component
export function FacebookScrollTracker() {
  const trackedRef = useRef<Set<number>>(new Set());
  const thresholds = [25, 50, 75, 100];

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((window.scrollY / scrollHeight) * 100);

      thresholds.forEach((threshold) => {
        if (scrollPercent >= threshold && !trackedRef.current.has(threshold)) {
          trackedRef.current.add(threshold);
          fbEvents.scrollDepth(threshold);
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return null;
}
