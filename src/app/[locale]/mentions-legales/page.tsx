import { Link } from '@/i18n/navigation';
import { ArrowLeft, CreditCard } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, getLocale } from 'next-intl/server';
import NoRightClick from '@/components/NoRightClick';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('mentions');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

function MentionsContentFR() {
  return (
    <div className="prose prose-gray max-w-none space-y-8">
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          Éditeur du site
        </h2>
        <p className="text-gray-600">
          <strong>Qarte</strong><br />
          SAS Tenga Labs<br />
          Capital social : 5 000 €<br />
          Siège social : 58 rue de Monceau, CS 48756, 75380 Paris Cedex 08<br />
          SIRET : [à compléter]<br />
          RCS : [ville — à compléter]<br />
          N° TVA intracommunautaire : [à compléter]<br />
          <br />
          Email :{' '}
          <a href="mailto:contact@getqarte.com" className="text-indigo-600 hover:text-indigo-800 underline">
            contact@getqarte.com
          </a><br />
          Téléphone : +33 6 07 44 74 20
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
  );
}

function MentionsContentEN() {
  return (
    <div className="prose prose-gray max-w-none space-y-8">
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          Website Publisher
        </h2>
        <p className="text-gray-600">
          <strong>Qarte</strong><br />
          SAS Tenga Labs<br />
          Share capital: 5,000 EUR<br />
          Registered office: 60 rue Fran&ccedil;ois 1er, 75008 Paris, France<br />
          SIRET: [to be completed]<br />
          RCS: [city -- to be completed]<br />
          EU VAT number: [to be completed]<br />
          <br />
          Email:{' '}
          <a href="mailto:contact@getqarte.com" className="text-indigo-600 hover:text-indigo-800 underline">
            contact@getqarte.com
          </a><br />
          Phone: +33 6 07 44 74 20
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          Publication Director
        </h2>
        <p className="text-gray-600">
          [To be completed]
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          Hosting
        </h2>
        <p className="text-gray-600">
          <strong>Web application:</strong><br />
          Vercel Inc.<br />
          440 N Barranca Ave #4133<br />
          Covina, CA 91723<br />
          United States<br />
          <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 underline">vercel.com</a>
        </p>
        <p className="text-gray-600 mt-4">
          <strong>Database:</strong><br />
          Supabase Inc.<br />
          970 Toa Payoh North #07-04<br />
          Singapore 318992<br />
          Data hosted in the European Union (AWS eu-central-1, Frankfurt, Germany)<br />
          <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 underline">supabase.com</a>
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          Intellectual Property
        </h2>
        <p className="text-gray-600">
          All content on this website (text, images, logos, graphics, source code, user interface) is the exclusive property of Qarte and is protected by French and international intellectual property laws.
        </p>
        <p className="text-gray-600 mt-2">
          Any reproduction, representation, modification, publication, or adaptation of all or part of the website content, by any means or process, is prohibited without prior written authorization from Qarte.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          Limitation of Liability
        </h2>
        <p className="text-gray-600">
          Qarte endeavors to ensure the accuracy of the information published on this website. However, Qarte cannot guarantee the accuracy, completeness, or timeliness of the information provided.
        </p>
        <p className="text-gray-600 mt-2">
          Qarte shall not be held liable for any direct or indirect damages resulting from access to the website or use of the service. For detailed terms, please refer to our{' '}
          <Link href="/cgv" className="text-indigo-600 hover:text-indigo-800 underline">
            Terms and Conditions
          </Link>.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          Personal Data
        </h2>
        <p className="text-gray-600">
          Qarte collects and processes personal data as part of its business operations. To learn more about how we collect, use, and protect your data, please refer to our{' '}
          <Link href="/politique-confidentialite" className="text-indigo-600 hover:text-indigo-800 underline">
            Privacy Policy
          </Link>.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          Cookies
        </h2>
        <p className="text-gray-600">
          This website uses cookies. To learn more about the cookies we use and to manage your preferences, please refer to the{' '}
          <Link href="/politique-confidentialite#cookies" className="text-indigo-600 hover:text-indigo-800 underline">
            Cookies section of our Privacy Policy
          </Link>.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          Governing Law
        </h2>
        <p className="text-gray-600">
          This legal notice is governed by French law.
          In the event of a dispute, and after an attempt at amicable resolution, the French courts shall have exclusive jurisdiction.
        </p>
      </section>
    </div>
  );
}

export default async function LegalMentionsPage() {
  const [t, tCommon, locale] = await Promise.all([
    getTranslations('mentions'),
    getTranslations('legalCommon'),
    getLocale(),
  ]);

  return (
    <NoRightClick>
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
            {tCommon('back')}
          </Link>
        </div>
      </header>

      <main className="px-4 py-12 mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('title')}
        </h1>
        <p className="text-gray-500 mb-10">
          {tCommon('lastUpdate', { date: locale === 'fr' ? 'Mars 2026' : 'March 2026' })}
        </p>

        {locale === 'fr' ? <MentionsContentFR /> : <MentionsContentEN />}
      </main>
    </div>
    </NoRightClick>
  );
}
