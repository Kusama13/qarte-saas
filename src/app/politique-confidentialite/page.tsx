import Link from 'next/link';
import { ArrowLeft, CreditCard } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-4 mx-auto max-w-4xl">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Qarte</span>
          </Link>
          <Link href="/" className="text-gray-600 hover:text-primary">
            <ArrowLeft className="w-5 h-5 inline mr-1" />
            Retour
          </Link>
        </div>
      </header>

      <main className="px-4 py-12 mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Politique de Confidentialité
        </h1>

        <div className="prose prose-gray max-w-none">
          <p className="text-gray-600 mb-6">
            Dernière mise à jour : Janvier 2026
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              1. Collecte des données
            </h2>
            <p className="text-gray-600">
              Nous collectons les données suivantes : email, numéro de téléphone,
              nom du commerce, et informations de passage des clients. Ces données
              sont nécessaires au fonctionnement du service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              2. Utilisation des données
            </h2>
            <p className="text-gray-600">
              Les données collectées sont utilisées exclusivement pour le
              fonctionnement du service de fidélité : suivi des passages,
              statistiques pour les commerçants, et communication avec les
              utilisateurs.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              3. Stockage et sécurité
            </h2>
            <p className="text-gray-600">
              Les données sont stockées sur des serveurs sécurisés en Europe
              (Supabase). Nous utilisons le chiffrement SSL pour toutes les
              communications et l&apos;authentification sécurisée pour l&apos;accès aux
              comptes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              4. Vos droits (RGPD)
            </h2>
            <p className="text-gray-600 mb-4">
              Conformément au RGPD, vous disposez des droits suivants :
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Droit d&apos;accès à vos données</li>
              <li>Droit de rectification</li>
              <li>Droit à l&apos;effacement</li>
              <li>Droit à la portabilité</li>
              <li>Droit d&apos;opposition</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              5. Conservation des données
            </h2>
            <p className="text-gray-600">
              Les données des commerçants sont conservées pendant la durée de
              l&apos;abonnement et 30 jours après résiliation. Les données des clients
              finaux sont conservées 2 ans après la dernière activité.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              6. Cookies
            </h2>
            <p className="text-gray-600">
              Nous utilisons des cookies essentiels pour le fonctionnement du
              service (authentification, préférences). Aucun cookie publicitaire
              n&apos;est utilisé.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              7. Contact DPO
            </h2>
            <p className="text-gray-600">
              Pour exercer vos droits ou pour toute question relative à vos
              données personnelles, contactez-nous à : dpo@qarte.fr
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
