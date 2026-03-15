// Analytics helper for tracking events via Google Tag Manager dataLayer

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

// Generic event tracking
export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !window.dataLayer) return;
  if (!eventName || typeof eventName !== 'string') return;
  window.dataLayer.push({
    event: eventName,
    ...params,
  });
}

// Factory for simple tracker functions (no custom logic, just forward params)
const createTracker = (eventName: string) =>
  (params?: Record<string, unknown>) => trackEvent(eventName, params);

// ============================================
// LANDING PAGE EVENTS
// ============================================

export function trackPageView(pageName: string, pageUrl?: string) {
  trackEvent('page_view', {
    page_name: pageName,
    page_url: pageUrl || window.location.href,
  });
}

export function trackCtaClick(ctaName: string, ctaLocation: string) {
  trackEvent('cta_click', {
    cta_name: ctaName,
    cta_location: ctaLocation,
  });
  // Persist signup source for merchant creation tracking
  try {
    localStorage.setItem('qarte_signup_source', `landing_${ctaName}`);
  } catch { /* SSR / private browsing */ }
}

export function trackScrollDepth(percentage: number) {
  trackEvent('scroll_depth', {
    scroll_percentage: percentage,
  });
}

// ============================================
// SIGNUP FUNNEL EVENTS
// ============================================

export function trackSignupStarted(method: 'email' | 'google' = 'email') {
  trackEvent('signup_started', {
    signup_method: method,
  });
}

export function trackSignupCompleted(userId: string, method: 'email' | 'google' = 'email') {
  trackEvent('signup_completed', {
    user_id: userId,
    signup_method: method,
  });
}

export const trackLoginCompleted = createTracker('login_completed');

// ============================================
// MERCHANT SETUP EVENTS
// ============================================

export const trackSetupStarted = createTracker('merchant_setup_started');
export const trackSetupCompleted = createTracker('merchant_setup_completed');
export const trackFirstCustomerAdded = createTracker('first_customer_added');

// ============================================
// SUBSCRIPTION/PAYMENT EVENTS
// ============================================

export const trackSubscriptionStarted = createTracker('subscription_started');

export function trackSubscriptionCompleted(plan: string, price: number, merchantId: string) {
  if (!plan || !merchantId || typeof price !== 'number' || price < 0) return;
  trackEvent('purchase', {
    transaction_id: `sub_${merchantId}_${Date.now()}`,
    value: price,
    currency: 'EUR',
    items: [{
      item_name: `Qarte ${plan}`,
      price: price,
      quantity: 1,
    }],
  });
}

export const trackTrialStarted = createTracker('trial_started');

// ============================================
// CUSTOMER (END-USER) EVENTS
// ============================================

export const trackQrScanned = createTracker('qr_scanned');
export const trackCardCreated = createTracker('card_created');
export const trackPwaInstalled = createTracker('pwa_installed');
export const trackPushEnabled = createTracker('push_enabled');
export const trackPointEarned = createTracker('point_earned');
export const trackRewardRedeemed = createTracker('reward_redeemed');

// ============================================
// ENGAGEMENT EVENTS
// ============================================

export const trackVideoPlayed = createTracker('video_played');
export const trackFaqOpened = createTracker('faq_opened');
export const trackContactFormSubmitted = createTracker('contact_form_submitted');
export const trackWhatsAppClicked = createTracker('whatsapp_clicked');
