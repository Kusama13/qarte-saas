'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
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
  Sparkles,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui';
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

const PLANS = {
  monthly: { price: 19, priceDisplay: '19,00', daily: '0,63', label: '19 €/mois' },
  annual: { price: 190, priceDisplay: '15,83', daily: '0,52', label: '190 €/an', originalPrice: 228, savings: '-17%' },
} as const;

export default function SubscriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('subscription');
  const { refetch: refetchContext } = useMerchant();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [billingPlan, setBillingPlan] = useState<'monthly' | 'annual'>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
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
    t('featureUnlimitedClients'),
    t('featureStampsCashback'),
    t('featureQrNfc'),
    t('featureProPage'),
    t('featurePricing'),
    t('featurePhotos'),
    t('featurePlanning'),
    t('featureWelcome'),
    t('featureReferral'),
    t('featureReminders'),
    t('featureGoogleReviews'),
    t('featureNotifications'),
    t('featureDashboard'),
    t('featureNoCommission'),
  ];

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setToast({ type: 'success', message: t('successToast') });
      setPolling(true);
      const plan = searchParams.get('plan');
      const price = plan === 'annual' ? 190 : 19;
      const planType: 'monthly' | 'annual' = plan === 'annual' ? 'annual' : 'monthly';
      fbEvents.subscribe(price);
      ttEvents.subscribe(price, planType);
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
      if (data.paymentMethod) {
        setPaymentMethod(data.paymentMethod);
      }
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

  const handleSubscribe = async () => {
    setSubscribing(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: billingPlan }),
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
                  {PLANS[billingPlan].priceDisplay.split(',')[0]}
                </span>
                <span className="text-2xl sm:text-3xl font-black text-gray-900">
                  ,{PLANS[billingPlan].priceDisplay.split(',')[1]}
                </span>
                <span className="text-lg text-gray-400 font-medium ml-1">{t('perMonth')}</span>
              </div>
              <p className="text-sm text-gray-400 mt-1.5">
                {t.rich('dailyCost', {
                  daily: PLANS[billingPlan].daily,
                  bold: (chunks) => <span className="font-bold text-gray-600">{chunks}</span>,
                })}
              </p>
              {billingPlan === 'annual' && (
                <p className="text-sm text-gray-400 mt-1"><span className="line-through">{PLANS.annual.originalPrice} €</span> → <span className="font-bold text-emerald-600">{PLANS.annual.label}</span></p>
              )}
            </div>

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
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-sm text-gray-600">{feature}</span>
                </div>
              ))}
            </div>
            <div className="sm:hidden mb-6">
              <div className="flex flex-wrap gap-x-1 gap-y-0.5 justify-center">
                {features.map((feature, i) => (
                  <span key={i} className="text-xs text-gray-500">
                    {feature}{i < features.length - 1 ? ' ·' : ''}
                  </span>
                ))}
              </div>
            </div>

            {/* CTA */}
            {showSubscribeCTA && (
              <Button
                className="w-full h-14 rounded-2xl font-bold text-base shadow-lg shadow-primary/20 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
                onClick={handleSubscribe}
                loading={subscribing}
              >
                {t('subscribeCta', { label: PLANS[billingPlan].label })}
              </Button>
            )}

            {/* Micro-reassurance under CTA — mobile only */}
            {showSubscribeCTA && (
              <p className="text-[11px] text-gray-400 text-center mt-3 sm:hidden">
                {t('ctaReassurance')}
              </p>
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
                    { value: countdown.days, label: 'j' },
                    { value: countdown.hours, label: 'h' },
                    { value: countdown.minutes, label: 'min' },
                    { value: countdown.seconds, label: 's' },
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
                      {t('annual')} <span className="text-emerald-600">{PLANS.annual.savings}</span>
                    </button>
                  </div>
                  <Button
                    className="w-full h-11 rounded-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
                    onClick={handleSubscribe}
                    loading={subscribing}
                  >
                    {t('subscribeCta', { label: PLANS[billingPlan].label })}
                  </Button>
                </div>
              ) : isCanceled ? (
                <Button className="w-full h-11 rounded-2xl font-bold" onClick={handleSubscribe} loading={subscribing}>
                  {t('reactivate')}
                </Button>
              ) : isCanceling ? (
                <Button variant="outline" className="w-full h-11 rounded-2xl text-orange-600 border-orange-200 hover:bg-orange-50 font-bold" onClick={handleOpenPortal} loading={loadingPortal}>
                  {t('cancelCancellation')}
                </Button>
              ) : isPastDue ? (
                <Button className="w-full h-11 rounded-2xl font-bold" onClick={handleOpenPortal} loading={loadingPortal}>
                  {t('updatePayment')}
                </Button>
              ) : (
                <Button variant="outline" className="w-full h-11 rounded-2xl text-gray-500 border-gray-200 hover:text-gray-700 hover:border-gray-300 font-medium text-sm" onClick={handleOpenPortal} loading={loadingPortal}>
                  {t('manageSubscription')}
                </Button>
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

      {/* Social proof */}
      {showSubscribeCTA && (
        <div className="mt-6 py-4 text-center">
          <p className="text-xs text-gray-400">
            {t('socialProof')}{' '}
            <a href="/pros" className="font-semibold text-indigo-500 hover:text-indigo-700 underline underline-offset-2 transition-colors">
              {t('viewPrograms')}
            </a>
          </p>
        </div>
      )}

      {/* Footer reassurance — desktop only */}
      <div className="hidden sm:flex items-center justify-center gap-6 mt-6 text-xs text-gray-400">
        <span>{t('noCommitment')}</span>
        <span className="w-1 h-1 rounded-full bg-gray-300" />
        <span>{t('cancelAnytime')}</span>
        <span className="w-1 h-1 rounded-full bg-gray-300" />
        <span>{t('dataRetention')}</span>
        <span className="w-1 h-1 rounded-full bg-gray-300" />
        <span>{t('stripeSecure')}</span>
      </div>
    </div>
  );
}
