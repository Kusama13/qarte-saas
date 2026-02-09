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
  HelpCircle,
  ShieldCheck,
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

  // Gerer les query params de retour Stripe
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setToast({ type: 'success', message: 'Paiement confirmé ! Votre abonnement est maintenant actif.' });
      router.replace('/dashboard/subscription', { scroll: false });
    } else if (searchParams.get('canceled') === 'true') {
      setToast({ type: 'error', message: 'Paiement annulé. Vous pouvez réessayer à tout moment.' });
      router.replace('/dashboard/subscription', { scroll: false });
    }
  }, [searchParams, router]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Live countdown timer
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

        // Fetch payment method if subscribed or has stripe customer
        if (data.subscription_status === 'active' || data.stripe_customer_id) {
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
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
      });
      const data = await res.json();

      if (data.error) {
        setToast({ type: 'error', message: data.error });
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error opening portal:', error);
      setToast({ type: 'error', message: 'Erreur lors de l\'ouverture du portail' });
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

      if (data.url) {
        // Redirection vers Stripe Checkout
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error:', error);
      setToast({ type: 'error', message: 'Erreur lors de la redirection vers le paiement' });
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

  return (
    <div className="max-w-5xl mx-auto space-y-8 stagger-fade-in">
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border backdrop-blur-md transition-all animate-fade-in-up ${
          toast.type === 'success'
            ? 'bg-green-50/90 border-green-200 text-green-800'
            : 'bg-red-50/90 border-red-200 text-red-800'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span className="text-sm font-semibold">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-current opacity-50 hover:opacity-100">
            &times;
          </button>
        </div>
      )}

      <div className="px-1">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Tableau de bord
        </Link>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Abonnement</span>
        </h1>
        <p className="mt-2 text-base font-medium text-gray-500">Gérez votre plan</p>
      </div>

      {(trialStatus.isInGracePeriod || trialStatus.isFullyExpired) && (
        <div className="card border-red-100 bg-red-50/40 backdrop-blur-md p-4 flex items-start gap-3 rounded-2xl">
          <div className="p-2 bg-red-100 rounded-xl shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="font-bold text-red-900 leading-none mb-1">Attention requise</p>
            {trialStatus.isInGracePeriod ? (
              <p className="text-red-700 text-sm">
                Essai expiré. Données conservées <span className="font-extrabold">{trialStatus.daysUntilDeletion}j</span> avant suppression.
              </p>
            ) : (
              <p className="text-red-700 text-sm">Compte inactif. Souscrivez pour continuer.</p>
            )}
          </div>
        </div>
      )}

      {isCanceling && (
        <div className="card border-orange-100 bg-orange-50/40 backdrop-blur-md p-4 flex items-start gap-3 rounded-2xl">
          <div className="p-2 bg-orange-100 rounded-xl shrink-0">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p className="font-bold text-orange-900 leading-none mb-1">Annulation programmée</p>
            <p className="text-orange-700 text-sm">
              Actif jusqu&apos;à la fin de la période en cours.
            </p>
          </div>
        </div>
      )}

      {isPastDue && (
        <div className="card border-red-100 bg-red-50/40 backdrop-blur-md p-4 flex items-start gap-3 rounded-2xl">
          <div className="p-2 bg-red-100 rounded-xl shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="font-bold text-red-900 leading-none mb-1">Paiement echoue</p>
            <p className="text-red-700 text-sm">
              Mettez a jour votre moyen de paiement.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3 card bg-white/80 backdrop-blur-xl border-white/40 shadow-xl rounded-3xl p-5 sm:p-8 hover-glow transition-all duration-300">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Votre offre</h2>
            {trialStatus.isActive && <span className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary bg-primary-50 rounded-full border border-primary-100">Essai en cours</span>}
            {isPaid && <span className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-green-700 bg-green-50 rounded-full border border-green-100">Actif</span>}
            {isCanceling && <span className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-orange-700 bg-orange-50 rounded-full border border-orange-100">Annulation en cours</span>}
            {isCanceled && <span className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-red-700 bg-red-50 rounded-full border border-red-100">Annulé</span>}
            {isPastDue && <span className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-red-700 bg-red-50 rounded-full border border-red-100">Paiement en échec</span>}
          </div>

          <div className="flex items-center gap-4 p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-indigo-50/50 to-violet-50/50 border border-indigo-100/50 mb-4 hover-lift">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white shadow-sm border border-indigo-50">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900 leading-tight">Plan Pro</p>
              <p className="text-xl font-bold gradient-text">
                {billingPlan === 'annual' ? '15,83 €' : '19,00 €'} <span className="text-sm font-medium text-gray-400">/ mois</span>
              </p>
              {billingPlan === 'annual' && (
                <p className="text-xs text-gray-400"><span className="line-through text-gray-300">228 €</span> 190 € facturé annuellement</p>
              )}
            </div>
          </div>

          {/* Billing Toggle */}
          {!isPaid && !isCanceling && (
            <div className="flex items-center justify-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 mb-8">
              <button
                onClick={() => setBillingPlan('monthly')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  billingPlan === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Mensuel
              </button>
              <button
                onClick={() => setBillingPlan('annual')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                  billingPlan === 'annual'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Annuel
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">-17%</span>
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/40 border border-gray-100/80 hover:bg-white hover:shadow-md transition-all cursor-default">
                <div className="bg-green-100 p-1 rounded-full shrink-0">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-xs font-bold text-gray-600">{feature}</span>
              </div>
            ))}
          </div>

          {trialStatus.isActive && (
            <div className={`p-5 rounded-2xl text-white shadow-xl overflow-hidden relative ${
              trialStatus.daysRemaining <= 3
                ? 'bg-gradient-to-r from-red-600 to-red-500 shadow-red-100'
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 shadow-indigo-100'
            }`}>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                    Fin de l&apos;essai le {formatDate(merchant?.trial_ends_at || '')}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-1.5 sm:gap-3">
                  {[
                    { value: countdown.days, label: 'j' },
                    { value: countdown.hours, label: 'h' },
                    { value: countdown.minutes, label: 'min' },
                    { value: countdown.seconds, label: 's' },
                  ].map((unit, i) => (
                    <div key={unit.label} className="flex items-center gap-0.5 sm:gap-1">
                      {i > 0 && <span className="text-white/40 font-bold text-base sm:text-lg">:</span>}
                      <div className="bg-white/15 backdrop-blur-sm rounded-lg sm:rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 min-w-[40px] sm:min-w-[48px] text-center">
                        <span className="text-lg sm:text-2xl font-black tabular-nums">{String(unit.value).padStart(2, '0')}</span>
                        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider opacity-70 ml-0.5">{unit.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {trialStatus.daysRemaining <= 3 && (
                  <p className="text-center text-xs font-semibold mt-3 opacity-90">
                    Souscrivez maintenant pour ne pas perdre vos données
                  </p>
                )}
              </div>
              <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-white/5 skew-x-12 translate-x-10" />
            </div>
          )}

          {/* Subscribe CTA in left column (near countdown) */}
          {!isPaid && !isCanceling && (
            <Button
              className="w-full h-12 rounded-2xl font-bold text-base shadow-lg shadow-primary/20 mt-6"
              onClick={handleSubscribe}
              loading={subscribing}
            >
              {billingPlan === 'annual' ? 'S\'abonner — 190 €/an' : 'S\'abonner — 19 €/mois'}
            </Button>
          )}
        </div>

        <div className="lg:col-span-2 card bg-white/80 backdrop-blur-xl border-white/40 shadow-xl rounded-3xl p-5 sm:p-8 flex flex-col hover-glow transition-all duration-300">
          <h2 className="text-xl font-extrabold text-gray-900 mb-8 tracking-tight">Facturation</h2>

          <div className="flex-grow flex flex-col justify-center">
            {!merchant?.stripe_customer_id ? (
              <div className="space-y-5 text-center">
                <div className="relative group mx-auto w-16 h-16">
                  <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl group-hover:bg-primary/30 transition-all" />
                  <div className="relative flex items-center justify-center w-full h-full rounded-2xl bg-white shadow-sm border border-primary-50">
                    <CreditCard className="w-8 h-8 text-primary" />
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-gray-900">Paiement sécurisé</h3>
                  <p className="text-sm text-gray-500 mt-1">Via Stripe. Sans engagement.</p>
                </div>

                <div className="flex items-center justify-center gap-2 opacity-40">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Powered by</span>
                  <span className="text-sm font-bold text-gray-500">Stripe</span>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-gray-50/50 border border-gray-100 shadow-inner group transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                        <CreditCard className="w-6 h-6 text-indigo-500" />
                      </div>
                      <div>
                        {loadingPayment ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                            <span className="text-sm text-gray-400">Chargement...</span>
                          </div>
                        ) : paymentMethod ? (
                          <>
                            <p className="font-extrabold text-gray-900 capitalize">
                              {paymentMethod.brand} •••• {paymentMethod.last4}
                            </p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">
                              Exp {String(paymentMethod.exp_month).padStart(2, '0')} / {paymentMethod.exp_year}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-gray-500">Aucune carte enregistrée</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-xl text-primary font-extrabold hover:bg-primary-50"
                      onClick={handleOpenPortal}
                      loading={loadingPortal}
                    >
                      Modifier
                    </Button>
                  </div>
                </div>
                <div className="pt-4 space-y-3">
                  {isCanceled ? (
                    <Button
                      className="w-full h-12 rounded-2xl font-bold transition-all"
                      onClick={handleSubscribe}
                      loading={subscribing}
                    >
                      Reactiver mon abonnement
                    </Button>
                  ) : isCanceling ? (
                    <Button
                      variant="outline"
                      className="w-full h-12 rounded-2xl text-orange-600 border-orange-100 hover:bg-orange-50 font-bold transition-all"
                      onClick={handleOpenPortal}
                      loading={loadingPortal}
                    >
                      Annuler la resiliation
                    </Button>
                  ) : isPastDue ? (
                    <Button
                      className="w-full h-12 rounded-2xl font-bold transition-all"
                      onClick={handleOpenPortal}
                      loading={loadingPortal}
                    >
                      Mettre a jour le paiement
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full h-12 rounded-2xl text-red-600 border-red-100 hover:bg-red-50 font-bold transition-all"
                      onClick={handleOpenPortal}
                      loading={loadingPortal}
                    >
                      Resilier
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 rounded-2xl bg-gray-50/50 border border-gray-100 flex flex-col sm:flex-row gap-4 sm:gap-6">
        <div className="flex items-start gap-2.5 flex-1">
          <HelpCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-gray-500">
            <span className="font-bold text-gray-700">Sans engagement.</span> Resiliez en un clic, acces actif jusqu&apos;a la fin du mois paye.
          </p>
        </div>
        <div className="flex items-start gap-2.5 flex-1">
          <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-gray-500">
            <span className="font-bold text-gray-700">Donnees securisees.</span> Conservees 30 jours apres resiliation.
          </p>
        </div>
      </div>
    </div>
  );
}
