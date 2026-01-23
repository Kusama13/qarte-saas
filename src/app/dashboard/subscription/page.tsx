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
  'Page fidélité personnalisée',
  'QR code unique prêt à imprimer',
  'Tableau de bord en temps réel',
  'Gestion illimitée des clients',
  'Export CSV des données',
  'Support email 7j/7',
  'Mises à jour gratuites',
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
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Abonnement</h1>
        <p className="mt-1 text-gray-600">
          Gérez votre plan et vos informations de paiement
        </p>
      </div>

      {(trialStatus.isInGracePeriod || trialStatus.isFullyExpired) && (
        <div className="p-4 mb-8 flex items-start gap-3 bg-red-100 border border-red-300 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-800">Votre essai gratuit a expiré</p>
            {trialStatus.isInGracePeriod ? (
              <>
                <p className="text-sm text-red-700 mt-1">
                  <strong>Attention :</strong> Vos données seront définitivement supprimées dans{' '}
                  <strong>{trialStatus.daysUntilDeletion} jour{trialStatus.daysUntilDeletion > 1 ? 's' : ''}</strong>.
                </p>
                <p className="text-sm text-red-600 mt-1">
                  Les fonctionnalités sont limitées : vos clients ne peuvent plus valider leurs passages.
                </p>
              </>
            ) : (
              <p className="text-sm text-red-700 mt-1">
                Souscrivez maintenant pour récupérer l&apos;accès à votre compte et vos données.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="p-6 bg-white rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Plan actuel</h2>
            {trialStatus.isActive && (
              <span className="px-3 py-1 text-sm font-medium text-primary bg-primary-50 rounded-full">
                Essai gratuit
              </span>
            )}
            {trialStatus.isInGracePeriod && (
              <span className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-full">
                Expiré
              </span>
            )}
            {isPaid && (
              <span className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-full">
                Actif
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary-50">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">Plan Pro</p>
              <p className="text-gray-500">19€ / mois</p>
            </div>
          </div>

          {trialStatus.isActive && (
            <div className="p-4 mb-6 rounded-xl bg-primary-50">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="font-medium text-primary">
                  {trialStatus.daysRemaining} jour{trialStatus.daysRemaining > 1 ? 's' : ''} restant{trialStatus.daysRemaining > 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-sm text-primary-700">
                Fin de l&apos;essai le {formatDate(merchant?.trial_ends_at || '')}
              </p>
            </div>
          )}

          {trialStatus.isInGracePeriod && (
            <div className="p-4 mb-6 rounded-xl bg-red-50 border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-700">
                  Suppression dans {trialStatus.daysUntilDeletion} jour{trialStatus.daysUntilDeletion > 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-sm text-red-600">
                Souscrivez maintenant pour conserver vos données
              </p>
            </div>
          )}

          {isPaid && (
            <div className="p-4 mb-6 rounded-xl bg-gray-50">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-900">
                  Carte se terminant par ****
                </span>
              </div>
              <p className="text-sm text-gray-500">
                Prochain prélèvement le {formatDate(new Date().toISOString())}
              </p>
            </div>
          )}

          <div className="space-y-3">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-100">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-gray-600">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-gray-900">
            Paiement
          </h2>

          {!isPaid ? (
            <div className="text-center py-8">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-primary-50">
                <CreditCard className="w-8 h-8 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Ajouter une carte bancaire
              </h3>
              <p className="mb-4 text-gray-600">
                {trialStatus.isActive
                  ? 'Sécurisez votre compte dès maintenant'
                  : 'Ajoutez une carte pour réactiver votre compte'}
              </p>
              {trialStatus.isActive && (
                <div className="p-3 mb-4 bg-green-50 border border-green-200 rounded-xl text-left">
                  <p className="text-sm text-green-800 font-medium flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Aucun prélèvement avant le {formatDate(merchant?.trial_ends_at || '')}
                  </p>
                  <p className="text-xs text-green-700 mt-1 ml-6">
                    Votre essai gratuit continue jusqu'à cette date
                  </p>
                </div>
              )}
              <Button 
                className="w-full"
                onClick={handleSubscribe}
                loading={subscribing}
                disabled={subscribing}
              >
                {subscribing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Redirection...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Ajouter ma carte
                  </>
                )}
              </Button>
              <p className="mt-4 text-xs text-gray-500">
                Paiement sécurisé par Stripe
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg">
                      <CreditCard className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Visa ****4242</p>
                      <p className="text-sm text-gray-500">Expire 12/25</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Modifier
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <Button variant="outline" className="w-full text-red-600 hover:bg-red-50">
                  Résilier l&apos;abonnement
                </Button>
                <p className="mt-2 text-xs text-center text-gray-500">
                  Votre abonnement restera actif jusqu&apos;à la fin de la période payée
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 p-6 bg-gray-50 rounded-2xl">
        <h3 className="mb-4 font-semibold text-gray-900">Questions fréquentes</h3>
        <div className="space-y-4">
          <div>
            <p className="font-medium text-gray-900">
              Puis-je résilier à tout moment ?
            </p>
            <p className="text-sm text-gray-600">
              Oui, vous pouvez résilier en un clic. Votre compte restera actif
              jusqu&apos;à la fin de la période payée.
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-900">
              Mes données sont-elles conservées après résiliation ?
            </p>
            <p className="text-sm text-gray-600">
              Vos données sont conservées 30 jours après résiliation. Vous pouvez
              les exporter à tout moment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
