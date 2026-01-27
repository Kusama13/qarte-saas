'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  Check,
  AlertTriangle,
  Calendar,
  Zap,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { getTrialStatus, formatDate } from '@/lib/utils';
import type { Merchant } from '@/types';

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
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false); // AJOUTÉ

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
      }
      setLoading(false);
    };

    fetchMerchant();
  }, [router]);

  // FONCTION AJOUTÉE
  const handleSubscribe = async () => {
    setSubscribing(true);
    
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      if (data.url) {
        // Redirection vers Stripe Checkout
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Erreur lors de la redirection vers le paiement');
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
  const isPaid = merchant?.subscription_status === 'active';

  return (
    <div className="max-w-5xl mx-auto space-y-8 stagger-fade-in">
      <div className="relative overflow-hidden p-8 rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white shadow-2xl">
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight">Abonnement</h1>
          <p className="mt-2 text-indigo-100 font-medium opacity-90">Gérez votre plan et optimisez votre expérience client</p>
        </div>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
      </div>

      {(trialStatus.isInGracePeriod || trialStatus.isFullyExpired) && (
        <div className="card border-red-100 bg-red-50/40 backdrop-blur-md p-5 flex items-start gap-4 rounded-2xl">
          <div className="p-2.5 bg-red-100 rounded-xl">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="font-bold text-red-900 text-lg leading-none mb-1">Attention requise</p>
            {trialStatus.isInGracePeriod ? (
              <p className="text-red-700 text-sm">
                Votre essai a expiré. Données conservées encore <span className="font-extrabold underline">{trialStatus.daysUntilDeletion} jours</span> avant suppression définitive.
              </p>
            ) : (
              <p className="text-red-700 text-sm">Votre compte est inactif. Souscrivez pour débloquer vos fonctionnalités.</p>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3 card bg-white/80 backdrop-blur-xl border-white/40 shadow-xl rounded-3xl p-8 hover-glow transition-all duration-300">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Votre offre</h2>
            {trialStatus.isActive && <span className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary bg-primary-50 rounded-full border border-primary-100">Essai en cours</span>}
            {isPaid && <span className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-green-700 bg-green-50 rounded-full border border-green-100">Actif</span>}
          </div>

          <div className="flex items-center gap-5 p-6 rounded-2xl bg-gradient-to-br from-indigo-50/50 to-violet-50/50 border border-indigo-100/50 mb-8 hover-lift">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white shadow-sm border border-indigo-50">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900 leading-tight">Plan Pro <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest ml-1">SaaS</span></p>
              <p className="text-xl font-bold gradient-text">19,00 € <span className="text-sm font-medium text-gray-400">/ mois</span></p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/40 border border-gray-100/80 hover:bg-white hover:shadow-md transition-all cursor-default">
                <div className="bg-green-100 p-1 rounded-full">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-xs font-bold text-gray-600 truncate">{feature}</span>
              </div>
            ))}
          </div>

          {trialStatus.isActive && (
            <div className="p-5 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-100 flex items-center justify-between overflow-hidden relative">
              <div className="relative z-10 flex items-center gap-4">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-extrabold">{trialStatus.daysRemaining} jours restants</p>
                  <p className="text-xs text-indigo-100 opacity-80">Jusqu&apos;au {formatDate(merchant?.trial_ends_at || '')}</p>
                </div>
              </div>
              <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-white/5 skew-x-12 translate-x-10" />
            </div>
          )}
        </div>

        <div className="lg:col-span-2 card bg-white/80 backdrop-blur-xl border-white/40 shadow-xl rounded-3xl p-8 flex flex-col hover-glow transition-all duration-300">
          <h2 className="text-xl font-extrabold text-gray-900 mb-8 tracking-tight">Facturation</h2>

          <div className="flex-grow flex flex-col justify-center">
            {!isPaid ? (
              <div className="space-y-6">
                <div className="relative group mx-auto w-20 h-20">
                  <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-xl group-hover:bg-primary/30 transition-all" />
                  <div className="relative flex items-center justify-center w-full h-full rounded-3xl bg-white shadow-sm border border-primary-50">
                    <CreditCard className="w-10 h-10 text-primary" />
                  </div>
                </div>

                <div className="text-center">
                  <h3 className="text-lg font-extrabold text-gray-900">Activer le plan</h3>
                  <p className="text-sm text-gray-500 mt-1">Accès illimité à toutes les fonctions.</p>
                </div>

                <Button
                  className="w-full h-12 rounded-2xl font-bold text-base shadow-lg shadow-primary/20 hover-lift active:scale-95"
                  onClick={handleSubscribe}
                  loading={subscribing}
                >
                  {subscribing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Confirmer l\'abonnement'
                  )}
                </Button>

                <div className="flex items-center justify-center gap-2 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
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
                        <p className="font-extrabold text-gray-900">Visa •••• 4242</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Exp 12 / 2025</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="rounded-xl text-primary font-extrabold hover:bg-primary-50">Modifier</Button>
                  </div>
                </div>
                <div className="pt-4 space-y-3">
                  <Button variant="outline" className="w-full h-12 rounded-2xl text-red-600 border-red-100 hover:bg-red-50 font-bold transition-all">
                    Résilier le service
                  </Button>
                  <p className="text-[10px] text-center text-gray-400 font-medium px-4">
                    La résiliation prendra effet à la fin du cycle en cours. Aucune donnée ne sera perdue immédiatement.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-8 rounded-3xl bg-gray-50/50 border border-gray-100 grid md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary font-bold">?</div>
            <h3 className="font-extrabold text-gray-900">Engagement & Résiliation</h3>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed pl-10">
            Sans engagement de durée. Vous pouvez résilier en un clic depuis cet interface. Votre accès reste actif jusqu&apos;à l&apos;échéance de votre mois payé.
          </p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary font-bold">!</div>
            <h3 className="font-extrabold text-gray-900">Sécurité des données</h3>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed pl-10">
            Vos données sont conservées en sécurité pendant 30 jours après la fin de votre abonnement, vous permettant de réactiver votre compte sans perte.
          </p>
        </div>
      </div>
    </div>
  );
}
