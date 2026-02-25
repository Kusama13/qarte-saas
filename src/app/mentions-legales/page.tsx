import Link from 'next/link';
import { ArrowLeft, CreditCard } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mentions Légales | Qarte',
  description: 'Mentions légales de Qarte, la solution de fidélité digitale pour les commerçants indépendants.',
};

export default function LegalMentionsPage() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Mentions Légales
        </h1>
        <p className="text-gray-500 mb-10">
          Dernière mise à jour : Février 2026
        </p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Éditeur du site
            </h2>
            <p className="text-gray-600">
              <strong>Qarte</strong><br />
              [Forme juridique — à compléter : SAS, SARL, EI, etc.]<br />
              Capital social : [à compléter]<br />
              Siège social : [adresse complète — à compléter]<br />
              SIRET : [à compléter]<br />
              RCS : [ville — à compléter]<br />
              N° TVA intracommunautaire : [à compléter]<br />
              <br />
              Email :{' '}
              <a href="mailto:contact@getqarte.com" className="text-indigo-600 hover:text-indigo-800 underline">
                contact@getqarte.com
              </a><br />
              Téléphone : [à compléter]
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Directeur de la publication
            </h2>
            <p className="text-gray-600">
              [Nom et prénom du directeur de publication — à compléter]
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Hébergement
            </h2>
            <p className="text-gray-600">
              <strong>Application web :</strong><br />
              Vercel Inc.<br />
              440 N Barranca Ave #4133<br />
              Covina, CA 91723<br />
              États-Unis<br />
              <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 underline">vercel.com</a>
            </p>
            <p className="text-gray-600 mt-4">
              <strong>Base de données :</strong><br />
              Supabase Inc.<br />
              970 Toa Payoh North #07-04<br />
              Singapore 318992<br />
              Données hébergées en Union Européenne (AWS eu-central-1, Francfort)<br />
              <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 underline">supabase.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Propriété intellectuelle
            </h2>
            <p className="text-gray-600">
              L&apos;ensemble du contenu de ce site (textes, images, logos, graphismes, code source, interface utilisateur) est la propriété exclusive de Qarte et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle.
            </p>
            <p className="text-gray-600 mt-2">
              Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie du contenu du site, quel que soit le moyen ou le procédé utilisé, est interdite sans autorisation écrite préalable de Qarte.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Limitation de responsabilité
            </h2>
            <p className="text-gray-600">
              Qarte s&apos;efforce d&apos;assurer l&apos;exactitude des informations diffusées sur ce site. Toutefois, Qarte ne peut garantir l&apos;exactitude, la complétude ou l&apos;actualité des informations mises à disposition.
            </p>
            <p className="text-gray-600 mt-2">
              Qarte ne saurait être tenue responsable des dommages directs ou indirects résultant de l&apos;accès au site ou de l&apos;utilisation du service. Pour les conditions détaillées, consultez nos{' '}
              <Link href="/cgv" className="text-indigo-600 hover:text-indigo-800 underline">
                Conditions Générales de Vente
              </Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Données personnelles
            </h2>
            <p className="text-gray-600">
              Qarte collecte et traite des données personnelles dans le cadre de son activité. Pour en savoir plus sur la collecte, l&apos;utilisation et la protection de vos données, consultez notre{' '}
              <Link href="/politique-confidentialite" className="text-indigo-600 hover:text-indigo-800 underline">
                Politique de Confidentialité
              </Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Cookies
            </h2>
            <p className="text-gray-600">
              Ce site utilise des cookies. Pour en savoir plus sur les cookies utilisés et gérer vos préférences, consultez notre{' '}
              <Link href="/politique-confidentialite#cookies" className="text-indigo-600 hover:text-indigo-800 underline">
                section Cookies de la Politique de Confidentialité
              </Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Droit applicable
            </h2>
            <p className="text-gray-600">
              Les présentes mentions légales sont soumises au droit français.
              En cas de litige, et après tentative de résolution amiable, les tribunaux français seront seuls compétents.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
