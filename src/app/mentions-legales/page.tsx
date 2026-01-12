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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Mentions Légales
        </h1>

        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Éditeur du site
            </h2>
            <p className="text-gray-600">
              Qarte<br />
              [Adresse à compléter]<br />
              Email : contact@getqarte.com<br />
              Téléphone : [À compléter]
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Directeur de la publication
            </h2>
            <p className="text-gray-600">[Nom du directeur de publication]</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Hébergement
            </h2>
            <p className="text-gray-600">
              Vercel Inc.<br />
              340 S Lemon Ave #4133<br />
              Walnut, CA 91789<br />
              États-Unis
            </p>
            <p className="text-gray-600 mt-4">
              Base de données hébergée par :<br />
              Supabase Inc.<br />
              970 Toa Payoh North #07-04<br />
              Singapore 318992
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Propriété intellectuelle
            </h2>
            <p className="text-gray-600">
              L&apos;ensemble du contenu de ce site (textes, images, logos, graphismes)
              est la propriété exclusive de Qarte et est protégé par les lois
              françaises et internationales relatives à la propriété intellectuelle.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Limitation de responsabilité
            </h2>
            <p className="text-gray-600">
              Qarte ne saurait être tenu responsable des dommages directs ou
              indirects résultant de l&apos;utilisation du service. Le service est
              fourni &quot;en l&apos;état&quot; sans garantie d&apos;aucune sorte.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Droit applicable
            </h2>
            <p className="text-gray-600">
              Les présentes mentions légales sont soumises au droit français.
              En cas de litige, les tribunaux français seront seuls compétents.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
