import { getTranslations } from 'next-intl/server';
import { Store, Smartphone, Palette } from 'lucide-react';
import { FooterSection, ScrollToTopButton } from '@/components/landing';
import ClientShell from '@/components/landing/ClientShell';
import LandingNav from '@/components/landing/LandingNav';
import { Link } from '@/i18n/navigation';
import { DEMO_BASE_SLUGS } from '@/lib/demo-merchants';
import ExempleCard from './ExempleCard';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'exemples' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: { canonical: 'https://getqarte.com/exemples' },
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: 'https://getqarte.com/exemples',
    },
  };
}

export default async function ExemplesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'exemples' });

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <ClientShell />
      <LandingNav minimal />

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 pt-[140px] pb-10 text-center">
        <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
          {t('badge')}
        </span>
        <h1 className="mb-4 text-3xl font-bold leading-tight text-gray-900 md:text-5xl">
          {t('heading1')}{' '}
          <span className="text-indigo-600">{t('heading2')}</span>
        </h1>
        <p className="mx-auto mb-5 max-w-xl text-base leading-relaxed text-gray-500 md:text-lg">{t('subtitle')}</p>

        <p className="mx-auto mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600">
          <Palette className="h-4 w-4 text-indigo-600" />
          {t('customizable')}
        </p>

        {/* Légende des deux liens */}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-gray-500">
          <span className="inline-flex items-center gap-1.5">
            <Store className="h-4 w-4 text-violet-600" />
            {t('legendVitrine')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Smartphone className="h-4 w-4 text-rose-500" />
            {t('legendCard')}
          </span>
        </div>
      </section>

      {/* Grille des métiers */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">
          {DEMO_BASE_SLUGS.map((slug) => (
            <ExempleCard key={slug} slug={slug} locale={locale} />
          ))}
        </div>
      </section>

      {/* CTA bas de page */}
      <section className="mx-auto max-w-2xl px-6 pb-20 text-center">
        <h2 className="mb-3 text-2xl font-bold text-gray-900 md:text-3xl">{t('bottomTitle')}</h2>
        <p className="mx-auto mb-6 max-w-md text-base leading-relaxed text-gray-500">{t('bottomDesc')}</p>
        <Link
          href="/auth/merchant/signup"
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-indigo-500/25 transition-[transform,box-shadow] duration-200 hover:scale-[1.02] hover:shadow-indigo-500/40 active:scale-[0.98]"
        >
          {t('ctaCreate')}
        </Link>
        <p className="mt-2 text-xs font-medium text-gray-500">{t('ctaSubtext')}</p>
      </section>

      <FooterSection />
      <ScrollToTopButton />
    </div>
  );
}
