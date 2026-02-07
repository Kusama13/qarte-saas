import Link from 'next/link';
import { Button } from '@/components/ui';
import { Check, Zap, ShieldCheck, Clock, CreditCard } from 'lucide-react';

const features = [
  'Page fidélité personnalisée',
  'QR code unique prêt à imprimer',
  'Tableau de bord en temps réel',
  'Gestion illimitée des clients',
  'Export CSV des données',
  'Support email 7j/7',
  'Mises à jour gratuites',
  'Pas de frais cachés',
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="px-4 mx-auto max-w-7xl">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="section-title">Un seul tarif, tout inclus</h2>
          <p className="section-subtitle">
            Pas d&apos;offres compliquées, pas de frais cachés.
            Juste le meilleur prix du marché.
          </p>
        </div>

        <div className="max-w-lg mx-auto mt-16">
          <div className="relative overflow-hidden bg-white border-2 border-primary rounded-3xl shadow-xl">
            <div className="absolute top-0 right-0 px-4 py-2 text-sm font-medium text-white bg-primary rounded-bl-2xl">
              Le plus populaire
            </div>

            <div className="p-8 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Zap className="w-6 h-6 text-primary" />
                <span className="text-lg font-semibold text-primary">Plan Pro</span>
              </div>

              <div className="flex items-baseline justify-center gap-2 mb-2">
                <span className="text-6xl font-bold text-gray-900">19€</span>
                <span className="text-xl text-gray-500">/mois</span>
              </div>

              <p className="text-gray-500">Sans engagement, résiliable à tout moment</p>

              <Link href="/auth/merchant/signup" className="block mt-8">
                <Button size="lg" className="w-full">
                  Démarrer l&apos;essai gratuit
                </Button>
              </Link>

              <p className="mt-4 text-sm text-gray-500">
                15 jours d&apos;essai gratuit • Sans carte bancaire
              </p>
            </div>

            <div className="p-8 bg-gray-50 border-t border-gray-100">
              <p className="mb-4 text-sm font-medium text-gray-900 uppercase tracking-wide">
                Tout est inclus
              </p>
              <ul className="grid gap-3 sm:grid-cols-2">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-100">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Objection handling */}
          <div className="grid gap-4 mt-12 sm:grid-cols-3 max-w-2xl mx-auto">
            <div className="flex flex-col items-center text-center p-4">
              <div className="flex items-center justify-center w-10 h-10 mb-3 rounded-full bg-green-100">
                <ShieldCheck className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">Sans engagement</p>
              <p className="mt-1 text-xs text-gray-500">
                Résiliez en 1 clic depuis votre tableau de bord, sans justification
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="flex items-center justify-center w-10 h-10 mb-3 rounded-full bg-blue-100">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">Sans carte bancaire</p>
              <p className="mt-1 text-xs text-gray-500">
                Testez 15 jours gratuitement, aucun moyen de paiement demandé
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="flex items-center justify-center w-10 h-10 mb-3 rounded-full bg-purple-100">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">Prêt en 2 minutes</p>
              <p className="mt-1 text-xs text-gray-500">
                Créez votre programme, imprimez le QR code et commencez à fidéliser
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
