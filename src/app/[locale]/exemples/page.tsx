import { getTranslations } from 'next-intl/server';
import { Store, Smartphone, ArrowRight } from 'lucide-react';
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
      <section className="mx-auto max-w-4xl px-4 pt-[140px] pb-8 text-center">
        <h1 className="mb-4 text-4xl font-black leading-tight text-gray-900 md:text-5xl">
          {t('heading1')}
          <br />
          <span className="text-indigo-600">{t('heading2')}</span>
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-gray-600">{t('subtitle')}</p>

        {/* Les deux faces de Qarte */}
        <div className="mx-auto mb-8 grid max-w-2xl gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-2xl border border-violet-100 bg-violet-50/60 p-4 text-left">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-violet-600">
              <Store className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{t('faceVitrineLabel')}</p>
              <p className="text-xs leading-relaxed text-gray-600">{t('faceVitrineDesc')}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50/60 p-4 text-left">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-rose-500">
              <Smartphone className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{t('faceCardLabel')}</p>
              <p className="text-xs leading-relaxed text-gray-600">{t('faceCardDesc')}</p>
            </div>
          </div>
        </div>

        <Link
          href="/auth/merchant/signup"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-indigo-500/25 transition-[transform,box-shadow] duration-200 hover:scale-[1.02] hover:shadow-indigo-500/40 active:scale-[0.98]"
        >
          {t('ctaCreate')}
        </Link>
        <p className="mt-2 text-xs font-medium text-gray-500">{t('ctaSubtext')}</p>
      </section>

      {/* Grille des métiers */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {DEMO_BASE_SLUGS.map((slug) => (
            <ExempleCard key={slug} slug={slug} locale={locale} />
          ))}
        </div>
      </section>

      {/* CTA bas de page */}
      <section className="mx-auto max-w-3xl px-4 pb-20">
        <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-center md:p-12">
          <h2 className="mb-3 text-2xl font-bold text-white md:text-3xl">{t('bottomTitle')}</h2>
          <p className="mx-auto mb-6 max-w-md text-base leading-relaxed text-indigo-100">{t('bottomDesc')}</p>
          <Link
            href="/auth/merchant/signup"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-bold text-indigo-700 shadow-lg transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            {t('ctaCreate')}
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      <FooterSection />
      <ScrollToTopButton />
    </div>
  );
}
