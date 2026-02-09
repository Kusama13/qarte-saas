'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { getTrialStatus, formatDate } from '@/lib/utils';
import type { Merchant } from '@/types';

interface PaymentMethod {
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
}

const features = [
  'Clients illimités',
  'QR Code perso',
  'Notifications push',
  'Programmation envois',
  'Dashboard analytics',
  'Avis Google',
  'Support prioritaire',
  'Zéro commission',
];

export default function SubscriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [billingPlan, setBillingPlan] = useState<'monthly' | 'annual'>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setToast({ type: 'success', message: 'Abonnement actif !' });
      router.replace('/dashboard/subscription', { scroll: false });
    } else if (searchParams.get('canceled') === 'true') {
      setToast({ type: 'error', message: 'Paiement annulé.' });
      router.replace('/dashboard/subscription', { scroll: false });
    }
  }, [searchParams, router]);

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
        if (data.stripe_subscription_id) {
          fetchPaymentMethod();
        }
      }
      setLoading(false);
    };

    fetchMerchant();
  }, [router]);

  const fetchPaymentMethod = async () => {
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
  };

  const handleOpenPortal = async () => {
    setLoadingPortal(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.error) {
        setToast({ type: 'error', message: data.error });
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch (error) {
      console.error('Error opening portal:', error);
      setToast({ type: 'error', message: 'Erreur portail' });
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
      setToast({ type: 'error', message: 'Erreur paiement' });
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
  const needsAction = !isPaid && !isCanceling;

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
      <div className="px-1 mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Abonnement</span>
        </h1>
      </div>

      {/* Alert banner — single line */}
      {(trialStatus.isInGracePeriod || trialStatus.isFullyExpired) && (
        <div className="flex items-center gap-2 px-4 py-2.5 mb-6 rounded-xl bg-red-500 text-white text-sm font-semibold">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {trialStatus.isInGracePeriod
            ? <span>Essai terminé — données supprimées dans {trialStatus.daysUntilDeletion}j</span>
            : <span>Compte inactif</span>
          }
        </div>
      )}
      {isCanceling && (
        <div className="flex items-center gap-2 px-4 py-2.5 mb-6 rounded-xl bg-orange-500 text-white text-sm font-semibold">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Annulation en fin de période</span>
        </div>
      )}
      {isPastDue && (
        <div className="flex items-center gap-2 px-4 py-2.5 mb-6 rounded-xl bg-red-500 text-white text-sm font-semibold">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Paiement échoué</span>
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
                  <p className="text-lg sm:text-xl font-black text-gray-900">Plan Pro</p>
                  <p className="text-xs text-gray-400 font-medium">Tout inclus</p>
                </div>
              </div>
              {isPaid && <span className="px-3 py-1 text-xs font-bold text-green-700 bg-green-50 rounded-full border border-green-100">Actif</span>}
              {trialStatus.isActive && <span className="px-3 py-1 text-xs font-bold text-primary bg-primary-50 rounded-full border border-primary-100">Essai</span>}
              {isCanceled && <span className="px-3 py-1 text-xs font-bold text-red-700 bg-red-50 rounded-full border border-red-100">Annulé</span>}
            </div>

            {/* Price */}
            <div className="text-center py-4 sm:py-6">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl sm:text-6xl font-black text-gray-900 tabular-nums">
                  {billingPlan === 'annual' ? '15' : '19'}
                </span>
                <span className="text-2xl sm:text-3xl font-black text-gray-900">
                  {billingPlan === 'annual' ? ',83' : ',00'}
                </span>
                <span className="text-lg text-gray-400 font-medium ml-1">€/mois</span>
              </div>
              {billingPlan === 'annual' && (
                <p className="text-sm text-gray-400 mt-1"><span className="line-through">228 €</span> → <span className="font-bold text-emerald-600">190 €/an</span></p>
              )}
            </div>

            {/* Toggle mensuel/annuel */}
            {needsAction && (
              <div className="flex items-center justify-center gap-1 p-1 rounded-xl bg-gray-100 mb-6">
                <button
                  onClick={() => setBillingPlan('monthly')}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    billingPlan === 'monthly'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500'
                  }`}
                >
                  Mensuel
                </button>
                <button
                  onClick={() => setBillingPlan('annual')}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                    billingPlan === 'annual'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500'
                  }`}
                >
                  Annuel
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">-17%</span>
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
            {needsAction && (
              <Button
                className="w-full h-14 rounded-2xl font-bold text-base shadow-lg shadow-primary/20 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
                onClick={handleSubscribe}
                loading={subscribing}
              >
                {billingPlan === 'annual' ? 'S\'abonner — 190 €/an' : 'S\'abonner — 19 €/mois'}
              </Button>
            )}

            {/* Micro-reassurance under CTA — mobile only */}
            {needsAction && (
              <p className="text-[11px] text-gray-400 text-center mt-3 sm:hidden">
                Sans engagement · Résiliable en 1 clic · Paiement sécurisé
              </p>
            )}
          </div>

          {/* Countdown timer */}
          {trialStatus.isActive && (
            <div className={`rounded-2xl text-white shadow-xl overflow-hidden relative p-4 sm:p-5 ${
              trialStatus.daysRemaining <= 3
                ? 'bg-gradient-to-r from-red-600 to-red-500 shadow-red-100'
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 shadow-indigo-100'
            }`}>
              <div className="relative z-10">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Calendar className="w-3.5 h-3.5 opacity-80" />
                  <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider opacity-80">
                    Fin de l&apos;essai le {formatDate(merchant?.trial_ends_at || '')}
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
              <h2 className="text-lg font-extrabold text-gray-900 mb-6">Facturation</h2>

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
                      <p className="text-sm text-gray-500">Aucune carte</p>
                    )}
                  </div>
                </div>
              </div>

              {isCanceled ? (
                <Button className="w-full h-11 rounded-2xl font-bold" onClick={handleSubscribe} loading={subscribing}>
                  Réactiver
                </Button>
              ) : isCanceling ? (
                <Button variant="outline" className="w-full h-11 rounded-2xl text-orange-600 border-orange-200 hover:bg-orange-50 font-bold" onClick={handleOpenPortal} loading={loadingPortal}>
                  Annuler la résiliation
                </Button>
              ) : isPastDue ? (
                <Button className="w-full h-11 rounded-2xl font-bold" onClick={handleOpenPortal} loading={loadingPortal}>
                  Mettre à jour le paiement
                </Button>
              ) : (
                <Button variant="outline" className="w-full h-11 rounded-2xl text-gray-500 border-gray-200 hover:text-gray-700 hover:border-gray-300 font-medium text-sm" onClick={handleOpenPortal} loading={loadingPortal}>
                  Gérer mon abonnement
                </Button>
              )}
            </div>
          ) : (
            /* No Stripe customer — desktop reassurance block */
            <div className="hidden lg:flex flex-col items-center justify-center bg-white/80 backdrop-blur-xl border border-white/40 shadow-xl rounded-3xl p-8 text-center h-full">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 flex items-center justify-center mb-4">
                <CreditCard className="w-7 h-7 text-primary" />
              </div>
              <p className="font-bold text-gray-900 mb-1">Paiement sécurisé</p>
              <p className="text-sm text-gray-400">Via Stripe · Sans engagement</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer reassurance — desktop only */}
      <div className="hidden sm:flex items-center justify-center gap-6 mt-6 text-xs text-gray-400">
        <span>Sans engagement</span>
        <span className="w-1 h-1 rounded-full bg-gray-300" />
        <span>Résiliation en 1 clic</span>
        <span className="w-1 h-1 rounded-full bg-gray-300" />
        <span>Données conservées 30j</span>
        <span className="w-1 h-1 rounded-full bg-gray-300" />
        <span>Paiement sécurisé Stripe</span>
      </div>
    </div>
  );
}
