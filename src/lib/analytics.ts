// Analytics helper for tracking events via Google Tag Manager dataLayer

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

// Generic event tracking
export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...params,
    });
  }
}

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

export function trackLoginCompleted(userId: string) {
  trackEvent('login_completed', {
    user_id: userId,
  });
}

// ============================================
// MERCHANT SETUP EVENTS
// ============================================

export function trackSetupStarted() {
  trackEvent('merchant_setup_started');
}

export function trackSetupCompleted(merchantId: string, businessType?: string) {
  trackEvent('merchant_setup_completed', {
    merchant_id: merchantId,
    business_type: businessType,
  });
}

export function trackFirstCustomerAdded(merchantId: string) {
  trackEvent('first_customer_added', {
    merchant_id: merchantId,
  });
}

// ============================================
// SUBSCRIPTION/PAYMENT EVENTS
// ============================================

export function trackSubscriptionStarted(plan: string, price: number) {
  trackEvent('subscription_started', {
    plan_name: plan,
    plan_price: price,
    currency: 'EUR',
  });
}

export function trackSubscriptionCompleted(plan: string, price: number, merchantId: string) {
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

export function trackTrialStarted(merchantId: string) {
  trackEvent('trial_started', {
    merchant_id: merchantId,
  });
}

// ============================================
// CUSTOMER (END-USER) EVENTS
// ============================================

export function trackQrScanned(merchantId: string) {
  trackEvent('qr_scanned', {
    merchant_id: merchantId,
  });
}

export function trackCardCreated(merchantId: string, customerId: string) {
  trackEvent('card_created', {
    merchant_id: merchantId,
    customer_id: customerId,
  });
}

export function trackPwaInstalled(merchantId: string) {
  trackEvent('pwa_installed', {
    merchant_id: merchantId,
  });
}

export function trackPushEnabled(customerId: string) {
  trackEvent('push_enabled', {
    customer_id: customerId,
  });
}

export function trackPointEarned(merchantId: string, customerId: string, totalPoints: number) {
  trackEvent('point_earned', {
    merchant_id: merchantId,
    customer_id: customerId,
    total_points: totalPoints,
  });
}

export function trackRewardRedeemed(merchantId: string, customerId: string, rewardName: string) {
  trackEvent('reward_redeemed', {
    merchant_id: merchantId,
    customer_id: customerId,
    reward_name: rewardName,
  });
}

// ============================================
// ENGAGEMENT EVENTS
// ============================================

export function trackVideoPlayed(videoName: string) {
  trackEvent('video_played', {
    video_name: videoName,
  });
}

export function trackFaqOpened(questionId: string) {
  trackEvent('faq_opened', {
    question_id: questionId,
  });
}

export function trackContactFormSubmitted(source: string) {
  trackEvent('contact_form_submitted', {
    source: source,
  });
}

export function trackWhatsAppClicked(source: string) {
  trackEvent('whatsapp_clicked', {
    source: source,
  });
}
