import Link from 'next/link';
import { ArrowLeft, CreditCard } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Conditions Générales de Vente | Qarte',
  description: 'Consultez les conditions générales de vente de Qarte, la solution de fidélité digitale pour commerçants.',
};

export default function CGVPage() {
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
          Conditions Générales de Vente
        </h1>

        <div className="prose prose-gray max-w-none">
          <p className="text-gray-600 mb-6">
            Dernière mise à jour : Janvier 2026
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              1. Objet
            </h2>
            <p className="text-gray-600">
              Les présentes Conditions Générales de Vente régissent l&apos;utilisation
              du service Qarte, une plateforme SaaS de digitalisation de cartes
              de fidélité pour les commerçants.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              2. Description du Service
            </h2>
            <p className="text-gray-600">
              Qarte propose aux commerçants une solution permettant de créer et
              gérer un programme de fidélité digital. Le service inclut la
              génération de QR codes, un tableau de bord de suivi, et la gestion
              des clients.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              3. Tarification
            </h2>
            <p className="text-gray-600">
              Le service est proposé à 19€ HT par mois, sans engagement. Un essai
              gratuit de 7 jours est disponible sans carte bancaire.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              4. Résiliation
            </h2>
            <p className="text-gray-600">
              L&apos;abonnement peut être résilié à tout moment depuis le tableau de
              bord. La résiliation prend effet à la fin de la période de
              facturation en cours.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              5. Protection des données
            </h2>
            <p className="text-gray-600">
              Qarte s&apos;engage à protéger les données personnelles conformément au
              RGPD. Pour plus d&apos;informations, consultez notre politique de
              confidentialité.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              6. Contact
            </h2>
            <p className="text-gray-600">
              Pour toute question concernant ces CGV, contactez-nous à
              contact@getqarte.com.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
