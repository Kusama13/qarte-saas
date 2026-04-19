'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, Link } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import {
  CreditCard,
  Check,
  AlertTriangle,
  Calendar,
  Zap,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ShieldCheck,
  Gift,
  Copy,
  ArrowUpDown,
} from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { getTrialStatus, formatDate } from '@/lib/utils';
import type { Merchant } from '@/types';
import { useMerchant } from '@/contexts/MerchantContext';
import { fbEvents } from '@/components/analytics/FacebookPixel';
import { ttEvents } from '@/components/analytics/TikTokPixel';

interface PaymentMethod {
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
}

interface SubscriptionInfo {
  unit_amount: number; // cents
  currency: string;
  interval: 'month' | 'year';
}

const PLANS_FR = {
  monthly: { price: 24, priceDisplay: '24,00', sep: ',', daily: '0,80', label: '24 €/mois' },
  annual: { price: 240, priceDisplay: '20,00', sep: ',', daily: '0,66', label: '240 €/an', originalPrice: '288 €', savings: '-17%' },
};

const PLANS_EN = {
  monthly: { price: 24, priceDisplay: '24.00', sep: '.', daily: '0.80', label: '$24/mo' },
  annual: { price: 240, priceDisplay: '20.00', sep: '.', daily: '0.66', label: '$240/yr', originalPrice: '$288', savings: '-17%' },
};

// Build the displayed price values from the merchant's actual Stripe subscription
// (handles grandfathered prices: 19€/mois, 180€/an, or any custom-negotiated rate).
function buildPlanFromSubscription(sub: SubscriptionInfo, locale: string) {
  const amount = sub.unit_amount / 100;
  const isAnnual = sub.interval === 'year';
  const sep = locale === 'en' ? '.' : ',';
  const isUSD = sub.currency.toUpperCase() === 'USD';
  const fmt = (n: number) => n.toFixed(2).replace('.', sep);
  const monthlyEquivalent = isAnnual ? amount / 12 : amount;
  const intervalSuffix = isAnnual ? (locale === 'en' ? '/yr' : '/an') : (locale === 'en' ? '/mo' : '/mois');
  const label = isUSD ? `$${fmt(amount)}${intervalSuffix}` : `${fmt(amount)} €${intervalSuffix}`;
  return {
    priceDisplay: fmt(monthlyEquivalent),
    sep,
    daily: fmt(monthlyEquivalent / 30),
    label,
  };
}

export default function SubscriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('subscription');
  const locale = useLocale();
  const PLANS = locale === 'en' ? PLANS_EN : PLANS_FR;
  const { refetch: refetchContext } = useMerchant();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [billingPlan, setBillingPlan] = useState<'monthly' | 'annual'>('monthly');
  const [planTier, setPlanTier] = useState<'fidelity' | 'all_in'>('all_in');
  const [showChangeTierModal, setShowChangeTierModal] = useState(false);
  const [changingTier, setChangingTier] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showNfcModal, setShowNfcModal] = useState(false);
  const [showSaveOffer, setShowSaveOffer] = useState(false);
  const [cancelReason, setCancelReason] = useState<string | null>(null);
  const [showPromoCode, setShowPromoCode] = useState(false);
  const [promoCopied, setPromoCopied] = useState(false);
  const [cancelStats, setCancelStats] = useState<{ customers: number; visits: number } | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [polling, setPolling] = useState(() => {
    if (typeof window !== 'undefined') {
      const flag = sessionStorage.getItem('qarte_portal_return');
      if (flag) {
        sessionStorage.removeItem('qarte_portal_return');
        return true;
      }
    }
    return false;
  });
  const features = [
    t('featurePlanning'),
    t('featureSms'),
    t('featureUnlimitedClients'),
    t('featureStampsCashback'),
    t('featureProPage'),
    t('featureQrNfc'),
    t('featureReferral'),
    t('featureDuoOffer'),
    t('featureNotifications'),
    t('featureNoCommission'),
  ];

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setToast({ type: 'success', message: t('successToast') });
      setPolling(true);
      const plan = searchParams.get('plan');
      const price = plan === 'annual' ? 240 : 24;
      const planType: 'monthly' | 'annual' = plan === 'annual' ? 'annual' : 'monthly';
      const currency = locale === 'en' ? 'USD' : 'EUR';
      fbEvents.subscribe(price, undefined, currency);
      ttEvents.subscribe(price, planType, currency);
      router.replace('/dashboard/subscription', { scroll: false });
    } else if (searchParams.get('canceled') === 'true') {
      setToast({ type: 'error', message: t('canceledToast') });
      router.replace('/dashboard/subscription', { scroll: false });
    }
  }, [searchParams, router, t]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [toast]);

  const updateCountdown = useCallback(() => {
    if (!merchant?.trial_ends_at) return;
    const end = new Date(merchant.trial_ends_at).getTime();
    const now = Date.now();
    const diff = Math.max(0, end - now);

    setCountdown({
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
    });
  }, [merchant?.trial_ends_at]);

  useEffect(() => {
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [updateCountdown]);

  useEffect(() => {
    const fetchMerchant = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/merchant');
        return;
      }

      const { data } = await supabase
        .from('merchants')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Detect super_admin for tier change override on legacy merchants
      const { data: adminRow } = await supabase
        .from('super_admins')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();
      setIsSuperAdmin(!!adminRow);

      if (data) {
        setMerchant(data);
        if (data.billing_interval === 'annual') {
          setBillingPlan('annual');
        }
        if (data.stripe_subscription_id) {
          fetchPaymentMethod();
        }
      }
      setLoading(false);
    };

    fetchMerchant();
  }, [router]);

  useEffect(() => {
    if (!polling || !merchant) return;

    if (merchant.subscription_status === 'active' || merchant.subscription_status === 'canceling') {
      refetchContext();
      if (merchant.stripe_subscription_id) fetchPaymentMethod();
      setPolling(false);
      return;
    }

    const initialStatus = merchant.subscription_status;
    const initialStripeId = merchant.stripe_subscription_id;
    let attempts = 0;
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const poll = async () => {
      if (cancelled) return;
      attempts++;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) { setPolling(false); return; }

      const { data } = await supabase
        .from('merchants')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (cancelled) return;

      if (data && (
        data.subscription_status !== initialStatus ||
        data.stripe_subscription_id !== initialStripeId ||
        data.subscription_status === 'active' ||
        data.subscription_status === 'canceling'
      )) {
        setMerchant(data);
        if (data.billing_interval === 'annual') setBillingPlan('annual');
        refetchContext();
        if (data.stripe_subscription_id) fetchPaymentMethod();
        setPolling(false);
        return;
      }

      if (attempts >= 30) {
        if (data) {
          setMerchant(data);
          if (data.billing_interval === 'annual') setBillingPlan('annual');
          refetchContext();
          if (data.stripe_subscription_id) fetchPaymentMethod();
        }
        setPolling(false);
        return;
      }

      timeoutId = setTimeout(poll, 1000);
    };

    timeoutId = setTimeout(poll, 0);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [polling, merchant?.id]);

  const fetchPaymentMethod = useCallback(async () => {
    setLoadingPayment(true);
    try {
      const res = await fetch('/api/stripe/payment-method');
      const data = await res.json();
      if (data.paymentMethod) setPaymentMethod(data.paymentMethod);
      if (data.subscription) setSubscriptionInfo(data.subscription);
    } catch (error) {
      console.error('Error fetching payment method:', error);
    } finally {
      setLoadingPayment(false);
    }
  }, []);

  const handleOpenPortal = async () => {
    setLoadingPortal(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.error) {
        setToast({ type: 'error', message: data.error });
        return;
      }
      if (data.url) {
        sessionStorage.setItem('qarte_portal_return', '1');
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error opening portal:', error);
      setToast({ type: 'error', message: t('portalError') });
    } finally {
      setLoadingPortal(false);
    }
  };

  const handleOpenCancelFlow = async () => {
    setShowSaveOffer(true);
    if (merchant && !cancelStats) {
      const [custRes, visitRes] = await Promise.all([
        supabase.from('customers').select('id', { count: 'exact', head: true }).eq('merchant_id', merchant.id),
        supabase.from('visits').select('id', { count: 'exact', head: true }).eq('merchant_id', merchant.id).eq('status', 'confirmed'),
      ]);
      setCancelStats({ customers: custRes.count || 0, visits: visitRes.count || 0 });
    }
  };

  const handleChangeTier = async (newTier: 'fidelity' | 'all_in') => {
    if (!merchant || merchant.plan_tier === newTier) return;
    setChangingTier(true);
    try {
      const res = await fetch('/api/stripe/change-tier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: newTier }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({ type: 'error', message: data.error || t('paymentError') });
        return;
      }
      setToast({ type: 'success', message: newTier === 'all_in' ? t('upgradeSuccess') : t('downgradeSuccess') });
      setShowChangeTierModal(false);
      // Refresh merchant data so the new tier appears immediately
      const { data: refreshed } = await supabase.from('merchants').select('*').eq('user_id', (await supabase.auth.getUser()).data.user?.id || '').single();
      if (refreshed) setMerchant(refreshed);
    } catch (error) {
      console.error('Change tier error:', error);
      setToast({ type: 'error', message: t('paymentError') });
    } finally {
      setChangingTier(false);
    }
  };

  const handleSubscribe = async () => {
    setSubscribing(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: billingPlan, tier: planTier }),
      });
      const data = await res.json();
      if (data.error) {
        setToast({ type: 'error', message: data.error });
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch (error) {
      console.error('Error:', error);
      setToast({ type: 'error', message: t('paymentError') });
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const trialStatus = getTrialStatus(
    merchant?.trial_ends_at || null,
    merchant?.subscription_status || 'trial'
  );
  const subscriptionStatus = merchant?.subscription_status;
  const isPaid = subscriptionStatus === 'active';
  const isCanceling = subscriptionStatus === 'canceling';
  const isCanceled = subscriptionStatus === 'canceled';
  const isPastDue = subscriptionStatus === 'past_due';
  const hasStripe = !!merchant?.stripe_subscription_id;
  const showSubscribeCTA = !isPaid && !isCanceling && !hasStripe && !polling;

  // Display the merchant's actual Stripe subscription price (handles grandfathered 19€/180€
  // and custom-negotiated rates). Only override for paying merchants — trial/canceled users
  // see the new public pricing since that's what they would pay if they (re)subscribe.
  const isPayingMerchant = isPaid || isCanceling || isPastDue;
  // Legacy merchants: créés avant le pricing split 2026-04-05 (2 tiers).
  // Ils sont grandfathered (full features Tout-en-un), pas de changement de plan
  // possible (sauf super_admin qui peut override pour support).
  const PRICING_SPLIT_DATE = '2026-04-05';
  const isLegacyMerchant = isPayingMerchant && merchant?.created_at
    ? new Date(merchant.created_at) < new Date(PRICING_SPLIT_DATE)
    : false;
  const canChangeTier = isPayingMerchant && (!isLegacyMerchant || isSuperAdmin);
  const displayPlan = isPayingMerchant && subscriptionInfo
    ? buildPlanFromSubscription(subscriptionInfo, locale)
    : PLANS[billingPlan];
  const hasActualAnnualPrice = isPayingMerchant && subscriptionInfo?.interval === 'year';

  return (
    <div className="max-w-5xl mx-auto stagger-fade-in">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md animate-fade-in-up ${
          toast.type === 'success'
            ? 'bg-green-50/90 border-green-200 text-green-800'
            : 'bg-red-50/90 border-red-200 text-red-800'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 shrink-0" />
          )}
          <span className="text-sm font-semibold">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-1 opacity-50 hover:opacity-100">&times;</button>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 p-4 md:p-6 rounded-2xl bg-[#4b0082]/[0.04] border border-[#4b0082]/[0.08]">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('back')}
        </Link>
        <h1 className="text-xl md:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#4b0082] to-violet-600">
          {t('title')}
        </h1>
      </div>

      {/* Alert banner — single line */}
      {!polling && (trialStatus.isInGracePeriod || trialStatus.isFullyExpired) && (
        <div className="flex flex-col gap-1.5 px-4 py-3 mb-6 rounded-xl bg-red-500 text-white text-sm font-semibold">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {trialStatus.isInGracePeriod
              ? <span>{t('alertTrialExpiring', { days: trialStatus.daysUntilDeletion })}</span>
              : <span>{t('alertExpired')}</span>
            }
          </div>
          {trialStatus.isFullyExpired && (
            <p className="text-xs font-normal text-white/80 ml-6">
              {t('alertExpiredDesc')}
            </p>
          )}
        </div>
      )}
      {!polling && isCanceling && (
        <div className="flex items-center gap-2 px-4 py-2.5 mb-6 rounded-xl bg-orange-500 text-white text-sm font-semibold">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{t('alertCanceling')}</span>
        </div>
      )}
      {!polling && isPastDue && (
        <div className="flex items-center gap-2 px-4 py-2.5 mb-6 rounded-xl bg-red-500 text-white text-sm font-semibold">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{t('alertPastDue')}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* ===== LEFT COLUMN — Pricing ===== */}
        <div className="lg:col-span-3 space-y-5">

          {/* Price hero card */}
          <div className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-xl rounded-3xl p-5 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-200">
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <p className="text-lg sm:text-xl font-black text-gray-900">{billingPlan === 'annual' ? t('planProAnnual') : t('planProMonthly')}</p>
                  <p className="text-xs text-gray-400 font-medium">{t('allIncluded')}</p>
                </div>
              </div>
              {polling && <span className="px-3 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 rounded-full border border-indigo-100 flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" />{t('syncing')}</span>}
              {!polling && isPaid && <span className="px-3 py-1 text-xs font-bold text-green-700 bg-green-50 rounded-full border border-green-100">{t('statusActive')}</span>}
              {!polling && isCanceling && <span className="px-3 py-1 text-xs font-bold text-orange-700 bg-orange-50 rounded-full border border-orange-100">{t('statusCanceling')}</span>}
              {!polling && trialStatus.isActive && !isCanceled && <span className="px-3 py-1 text-xs font-bold text-primary bg-primary-50 rounded-full border border-primary-100">{t('statusTrial')}</span>}
              {!polling && isCanceled && <span className="px-3 py-1 text-xs font-bold text-red-700 bg-red-50 rounded-full border border-red-100">{t('statusCanceled')}</span>}
              {!polling && isPastDue && <span className="px-3 py-1 text-xs font-bold text-red-700 bg-red-50 rounded-full border border-red-100">{t('statusPastDue')}</span>}
            </div>

            {/* Price */}
            <div className="text-center py-4 sm:py-6">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl sm:text-6xl font-black text-gray-900 tabular-nums">
                  {displayPlan.priceDisplay.split(displayPlan.sep)[0]}
                </span>
                <span className="text-2xl sm:text-3xl font-black text-gray-900">
                  {displayPlan.sep}{displayPlan.priceDisplay.split(displayPlan.sep)[1]}
                </span>
                <span className="text-lg text-gray-400 font-medium ml-1">{t('perMonth')}</span>
              </div>
              <p className="text-sm text-gray-400 mt-1.5">
                {t.rich('dailyCost', {
                  daily: displayPlan.daily,
                  bold: (chunks) => <span className="font-bold text-gray-600">{chunks}</span>,
                })}
              </p>
              {billingPlan === 'annual' && (
                <>
                  {hasActualAnnualPrice ? (
                    <p className="text-sm text-gray-400 mt-1"><span className="font-bold text-gray-600">{displayPlan.label}</span></p>
                  ) : (
                    <p className="text-sm text-gray-400 mt-1"><span className="line-through">{PLANS.annual.originalPrice}</span> → <span className="font-bold text-emerald-600">{PLANS.annual.label}</span></p>
                  )}
                  <button onClick={() => setShowNfcModal(true)} className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 hover:from-indigo-100 hover:to-violet-100 transition-colors cursor-pointer underline-offset-2 hover:underline">
                    <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-xs font-bold text-indigo-700">{t('nfcIncluded')}</span>
                  </button>
                </>
              )}
            </div>

            {/* Sélecteur tier */}
            {showSubscribeCTA && (
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  onClick={() => setPlanTier('fidelity')}
                  className={`rounded-xl border-2 px-3 py-3 text-left transition-all ${
                    planTier === 'fidelity'
                      ? 'border-[#4b0082] bg-[#4b0082]/5'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-baseline justify-between mb-0.5">
                    <span className="text-sm font-bold text-gray-900">{t('tierFidelityName')}</span>
                    <span className="text-sm font-extrabold text-gray-900">{billingPlan === 'annual' ? '190€' : '19€'}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-tight">{t('tierFidelityHint')}</p>
                </button>
                <button
                  onClick={() => setPlanTier('all_in')}
                  className={`rounded-xl border-2 px-3 py-3 text-left transition-all relative ${
                    planTier === 'all_in'
                      ? 'border-[#4b0082] bg-[#4b0082]/5'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <span className="absolute -top-2 left-3 text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white uppercase">{t('recommended')}</span>
                  <div className="flex items-baseline justify-between mb-0.5">
                    <span className="text-sm font-bold text-gray-900">{t('tierAllInName')}</span>
                    <span className="text-sm font-extrabold text-gray-900">{billingPlan === 'annual' ? '240€' : '24€'}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-tight">{t('tierAllInHint')}</p>
                </button>
              </div>
            )}

            {/* Toggle mensuel/annuel */}
            {showSubscribeCTA && (
              <div className="flex items-center justify-center gap-1 p-1 rounded-xl bg-gray-100 mb-6">
                <button
                  onClick={() => setBillingPlan('monthly')}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    billingPlan === 'monthly'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500'
                  }`}
                >
                  {t('monthly')}
                </button>
                <button
                  onClick={() => setBillingPlan('annual')}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                    billingPlan === 'annual'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500'
                  }`}
                >
                  {t('annual')}
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">{PLANS.annual.savings}</span>
                </button>
              </div>
            )}

            {/* Features — mobile: compact list / desktop: grid */}
            <div className="hidden sm:grid sm:grid-cols-2 gap-2 mb-6">
              {features.map((feature, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5">
                  <Check className={`w-4 h-4 shrink-0 ${i < 2 ? 'text-indigo-500' : 'text-emerald-500'}`} />
                  <span className={`text-sm ${i < 2 ? 'font-bold text-gray-900' : 'text-gray-600'}`}>{feature}</span>
                </div>
              ))}
              {billingPlan === 'annual' && (
                <div className="flex items-center gap-2 py-1.5 col-span-2 bg-indigo-50/60 rounded-lg px-2 -mx-2">
                  <CreditCard className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="text-sm font-bold text-indigo-700">{t('nfcFeature')}</span>
                </div>
              )}
            </div>
            <div className="sm:hidden mb-6">
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                {features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <Check className={`w-3 h-3 shrink-0 ${i < 2 ? 'text-indigo-500' : 'text-emerald-500'}`} />
                    <span className={`text-[11px] leading-tight ${i < 2 ? 'font-bold text-gray-800' : 'text-gray-500'}`}>{feature}</span>
                  </div>
                ))}
              </div>
              {billingPlan === 'annual' && (
                <div className="flex items-center gap-1.5 mt-2 bg-indigo-50/60 rounded-lg px-2 py-1.5">
                  <CreditCard className="w-3 h-3 text-indigo-600 shrink-0" />
                  <span className="text-[11px] font-bold text-indigo-700">{t('nfcFeature')}</span>
                </div>
              )}
            </div>

            {/* CTA */}
            {showSubscribeCTA && (
              <Button
                className="w-full h-14 rounded-2xl font-bold text-base shadow-lg shadow-primary/20 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
                onClick={handleSubscribe}
                loading={subscribing}
              >
                {t('subscribeCta', { plan: billingPlan === 'annual' ? t('annual').toLowerCase() : t('monthly').toLowerCase() })}
              </Button>
            )}

            {/* Reassurance under CTA */}
            {showSubscribeCTA && (
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-3">
                <span className="flex items-center gap-1 text-[11px] text-gray-400">
                  <ShieldCheck className="w-3 h-3" />
                  {t('noCommitment')}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-gray-400">
                  <Check className="w-3 h-3" />
                  {t('cancelAnytime')}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-gray-400">
                  <CreditCard className="w-3 h-3" />
                  {t('stripeSecure')}
                </span>
              </div>
            )}

            {/* Tier badge + change plan (paid merchants only) */}
            {isPayingMerchant && merchant && (
              <div className="mt-5 pt-5 border-t border-gray-100 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">{t('currentTierLabel')}</p>
                  <p className="text-sm font-bold text-gray-900">
                    {isLegacyMerchant ? t('tierAllInName') : (merchant.plan_tier === 'fidelity' ? t('tierFidelityName') : t('tierAllInName'))}
                    {isLegacyMerchant && (
                      <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-600">
                        {t('legacyBadge')}
                      </span>
                    )}
                  </p>
                </div>
                {canChangeTier && (
                  <button
                    onClick={() => setShowChangeTierModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    {t('changeTierCta')}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Syncing indicator */}
          {polling && (
            <div className="rounded-2xl shadow-xl overflow-hidden relative p-4 sm:p-5 bg-gradient-to-r from-indigo-600 to-violet-600 shadow-indigo-100">
              <div className="relative z-10 flex flex-col items-center justify-center gap-1.5 text-white">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-bold">{t('syncingTitle')}</span>
                </div>
                <p className="text-xs text-white/70">{t('syncingDesc')}</p>
              </div>
              <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-white/5 skew-x-12 translate-x-10" />
            </div>
          )}

          {/* Countdown timer */}
          {!polling && trialStatus.isActive && (
            <div className={`rounded-2xl text-white shadow-xl overflow-hidden relative p-4 sm:p-5 ${
              trialStatus.daysRemaining <= 3
                ? 'bg-gradient-to-r from-red-600 to-red-500 shadow-red-100'
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 shadow-indigo-100'
            }`}>
              <div className="relative z-10">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Calendar className="w-3.5 h-3.5 opacity-80" />
                  <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider opacity-80">
                    {t('trialEndsOn', { date: formatDate(merchant?.trial_ends_at || '') })}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  {[
                    { value: countdown.days, label: t('countdownDays') },
                    { value: countdown.hours, label: t('countdownHours') },
                    { value: countdown.minutes, label: t('countdownMinutes') },
                    { value: countdown.seconds, label: t('countdownSeconds') },
                  ].map((unit, i) => (
                    <div key={unit.label} className="flex items-center gap-1">
                      {i > 0 && <span className="text-white/30 font-bold">:</span>}
                      <div className="bg-white/15 backdrop-blur-sm rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 min-w-[42px] sm:min-w-[48px] text-center">
                        <span className="text-xl sm:text-2xl font-black tabular-nums">{String(unit.value).padStart(2, '0')}</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider opacity-60 ml-0.5">{unit.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-white/5 skew-x-12 translate-x-10" />
            </div>
          )}
        </div>

        {/* ===== RIGHT COLUMN — Billing (desktop) ===== */}
        <div className="lg:col-span-2">
          {merchant?.stripe_subscription_id ? (
            <div className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-xl rounded-3xl p-5 sm:p-8">
              <h2 className="text-lg font-extrabold text-gray-900 mb-6">{t('billing')}</h2>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <CreditCard className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    {loadingPayment ? (
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    ) : paymentMethod ? (
                      <>
                        <p className="font-bold text-gray-900 capitalize text-sm">
                          {paymentMethod.brand} •••• {paymentMethod.last4}
                        </p>
                        <p className="text-[10px] text-gray-400 font-bold">
                          Exp {String(paymentMethod.exp_month).padStart(2, '0')}/{paymentMethod.exp_year}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">{t('noCard')}</p>
                    )}
                  </div>
                </div>
              </div>

              {isCanceled && trialStatus.isActive ? (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                    <p className="text-sm text-indigo-800 font-medium">
                      {t('trialStillActive')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100">
                    <button
                      onClick={() => setBillingPlan('monthly')}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                        billingPlan === 'monthly'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500'
                      }`}
                    >
                      {t('monthly')}
                    </button>
                    <button
                      onClick={() => setBillingPlan('annual')}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                        billingPlan === 'annual'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500'
                      }`}
                    >
                      {t('annual')} <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded-full">{t('recommended')}</span> <span className="text-emerald-600">{PLANS.annual.savings}</span>
                    </button>
                  </div>
                  <Button
                    className="w-full h-11 rounded-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
                    onClick={handleSubscribe}
                    loading={subscribing}
                  >
                    {t('subscribeCta', { plan: billingPlan === 'annual' ? t('annual').toLowerCase() : t('monthly').toLowerCase() })}
                  </Button>
                </div>
              ) : isCanceled ? (
                <>
                  <Button className="w-full h-11 rounded-2xl font-bold" onClick={handleSubscribe} loading={subscribing}>
                    {t('reactivate')}
                  </Button>
                  <p className="text-xs text-gray-500 text-center mt-2">{t('canceledCtaHint')}</p>
                </>
              ) : isCanceling ? (
                <Button variant="outline" className="w-full h-11 rounded-2xl text-orange-600 border-orange-200 hover:bg-orange-50 font-bold" onClick={handleOpenPortal} loading={loadingPortal}>
                  {t('cancelCancellation')}
                </Button>
              ) : isPastDue ? (
                <>
                  <Button className="w-full h-11 rounded-2xl font-bold" onClick={handleOpenPortal} loading={loadingPortal}>
                    {t('updatePayment')}
                  </Button>
                  <p className="text-xs text-gray-500 text-center mt-2">{t('pastDueCtaHint')}</p>
                </>
              ) : (
                <>
                  <Button className="w-full h-11 rounded-2xl font-bold" onClick={handleOpenPortal} loading={loadingPortal}>
                    {t('manageSubscription')}
                  </Button>
                  <p className="text-xs text-gray-500 text-center mt-2">{t('manageSubscriptionHint')}</p>
                  <button
                    type="button"
                    className="w-full mt-4 text-xs text-gray-400 hover:text-gray-600 font-medium underline underline-offset-2 transition-colors"
                    onClick={handleOpenCancelFlow}
                  >
                    {t('cancelSubscription')}
                  </button>
                </>
              )}
            </div>
          ) : (
            /* No Stripe customer — desktop reassurance block */
            <div className="hidden lg:flex flex-col items-center justify-center bg-white/80 backdrop-blur-xl border border-white/40 shadow-xl rounded-3xl p-8 text-center h-full">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 flex items-center justify-center mb-4">
                <CreditCard className="w-7 h-7 text-primary" />
              </div>
              <p className="font-bold text-gray-900 mb-1">{t('securePayment')}</p>
              <p className="text-sm text-gray-400">{t('securePaymentDesc')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Change tier modal */}
      <Modal isOpen={showChangeTierModal} onClose={() => !changingTier && setShowChangeTierModal(false)} size="sm">
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900">{t('changeTierTitle')}</h3>
          <p className="text-sm text-gray-500">{t('changeTierDesc')}</p>

          {(['fidelity', 'all_in'] as const).map(tier => {
            const isCurrent = merchant?.plan_tier === tier;
            const isDowngrade = merchant?.plan_tier === 'all_in' && tier === 'fidelity';
            const interval = merchant?.billing_interval === 'annual' ? 'annual' : 'monthly';
            const price = tier === 'fidelity'
              ? (interval === 'annual' ? '190€/an' : '19€/mois')
              : (interval === 'annual' ? '240€/an' : '24€/mois');
            return (
              <button
                key={tier}
                disabled={isCurrent || changingTier}
                onClick={() => handleChangeTier(tier)}
                className={`w-full text-left rounded-xl border-2 px-4 py-3 transition-all ${
                  isCurrent
                    ? 'border-emerald-300 bg-emerald-50 cursor-default'
                    : 'border-gray-200 bg-white hover:border-[#4b0082] hover:bg-[#4b0082]/5'
                } ${changingTier ? 'opacity-60 cursor-wait' : ''}`}
              >
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-sm font-bold text-gray-900">
                    {tier === 'fidelity' ? t('tierFidelityName') : t('tierAllInName')}
                    {isCurrent && <span className="ml-2 text-[10px] font-bold uppercase text-emerald-700">· {t('changeTierCurrent')}</span>}
                  </span>
                  <span className="text-sm font-extrabold text-gray-900">{price}</span>
                </div>
                <p className="text-xs text-gray-500 leading-snug">
                  {tier === 'fidelity' ? t('tierFidelityHint') : t('tierAllInHint')}
                </p>
                {isDowngrade && !isCurrent && (
                  <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 p-2 text-[11px] text-amber-800">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{t('changeTierDowngradeWarning')}</span>
                  </div>
                )}
              </button>
            );
          })}

          <p className="text-[11px] text-gray-400 text-center">{t('changeTierProrationNote')}</p>
        </div>
      </Modal>

      {/* NFC explanation modal */}
      <Modal isOpen={showNfcModal} onClose={() => setShowNfcModal(false)} size="sm">
        <div className="text-center">
          <img
            src="/images/carte-nfc-qarte.png"
            alt={t('nfcModalTitle')}
            className="w-48 mx-auto rounded-2xl shadow-lg mb-4"
          />
          <h3 className="text-lg font-bold text-gray-900 mb-2">{t('nfcModalTitle')}</h3>
          <p className="text-sm text-gray-500 leading-relaxed">{t('nfcModalDesc')}</p>
          <p className="text-xs text-gray-400 mt-3">{t('nfcModalDelivery')}</p>
        </div>
      </Modal>

      {/* Save offer modal — intercepts cancel flow */}
      <Modal isOpen={showSaveOffer} onClose={() => { setShowSaveOffer(false); setCancelReason(null); setShowPromoCode(false); }} size="sm">
        <div className="space-y-4">
          {!showPromoCode ? (
            <>
              <h3 className="text-lg font-bold text-gray-900">{t('saveOfferTitle')}</h3>
              <p className="text-sm text-gray-500">{t('saveOfferSubtitle')}</p>

              {cancelStats && (cancelStats.customers > 0 || cancelStats.visits > 0) && (
                <div className="p-3 bg-red-50 rounded-xl border border-red-200">
                  <p className="text-sm font-semibold text-red-800">{t('saveOfferLossTitle')}</p>
                  <p className="text-xs text-red-600 mt-1">
                    {cancelStats.customers > 0 && t('saveOfferLossClients', { count: cancelStats.customers })}
                    {cancelStats.customers > 0 && cancelStats.visits > 0 && ' · '}
                    {cancelStats.visits > 0 && t('saveOfferLossVisits', { count: cancelStats.visits })}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                {['too_expensive', 'not_using', 'missing_feature', 'switching', 'temporary', 'other'].map(reason => (
                  <button
                    key={reason}
                    onClick={() => setCancelReason(reason)}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                      cancelReason === reason
                        ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {t(`saveReason_${reason}`)}
                  </button>
                ))}
              </div>

              {cancelReason === 'too_expensive' && (
                <div className="p-4 bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl border border-violet-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="w-4 h-4 text-violet-600" />
                    <span className="text-sm font-bold text-violet-900">{t('saveOfferPromoTitle')}</span>
                  </div>
                  <p className="text-sm text-violet-700">{t('saveOfferPromoDesc')}</p>
                  <Button
                    className="w-full mt-3 h-10 rounded-xl bg-violet-600 hover:bg-violet-700 font-bold text-sm"
                    onClick={() => setShowPromoCode(true)}
                  >
                    {t('saveOfferPromoAccept')}
                  </Button>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 h-10 rounded-xl text-sm font-medium"
                  onClick={() => { setShowSaveOffer(false); setCancelReason(null); }}
                >
                  {t('saveOfferKeep')}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 h-10 rounded-xl text-sm font-medium text-gray-400 border-gray-200"
                  onClick={() => { setShowSaveOffer(false); setCancelReason(null); handleOpenPortal(); }}
                  loading={loadingPortal}
                >
                  {t('saveOfferContinueCancel')}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-violet-100 flex items-center justify-center">
                <Gift className="w-6 h-6 text-violet-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">{t('saveOfferPromoTitle')}</h3>
              <p className="text-sm text-gray-500">{t('saveOfferPromoApply')}</p>
              <div className="flex items-center justify-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="font-mono font-bold text-lg text-indigo-700">2MOISQARTEPRO25</span>
                <button
                  onClick={() => { navigator.clipboard.writeText('2MOISQARTEPRO25'); setPromoCopied(true); setTimeout(() => setPromoCopied(false), 2000); }}
                  className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {promoCopied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-400" />}
                </button>
              </div>
              <p className="text-xs text-gray-400">{t('saveOfferPromoHint')}</p>
              <Button
                className="w-full h-11 rounded-xl font-bold"
                onClick={() => { setShowSaveOffer(false); setShowPromoCode(false); setCancelReason(null); }}
              >
                {t('saveOfferPromoDone')}
              </Button>
            </div>
          )}
        </div>
      </Modal>

    </div>
  );
}
