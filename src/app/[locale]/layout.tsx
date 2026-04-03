import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import CookieBanner from '@/components/shared/CookieBanner';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://getqarte.com';

  if (locale === 'en') {
    return {
      title: {
        default: 'Qarte — Salon page & loyalty for beauty pros',
        template: '%s | Qarte',
      },
      description: 'Create your salon page in 5 min: services, photos, schedule, Google reviews. Built-in loyalty program. For hair salons, barbers and nail studios. Free trial.',
      openGraph: {
        title: 'Qarte — Salon page & loyalty for beauty pros',
        description: 'Create your salon page in 5 min: services, photos, schedule, Google reviews. Built-in loyalty program. Free trial.',
        locale: 'en_US',
        alternateLocale: ['fr_FR'],
      },
      alternates: {
        canonical: `${baseUrl}/en`,
        languages: { fr: baseUrl, en: `${baseUrl}/en` },
      },
    };
  }

  // FR: title + description + alternates + og:locale:alternate
  return {
    title: {
      default: 'Qarte — Vitrine digitale et fidélité pour salons de beauté',
      template: '%s | Qarte',
    },
    description: 'Créez votre vitrine en ligne en 5 min : prestations, photos, planning, avis Google. Programme de fidélité intégré. Essai gratuit.',
    openGraph: {
      title: 'Qarte — Vitrine digitale et fidélité pour salons de beauté',
      description: 'Créez votre vitrine en ligne en 5 min : prestations, photos, planning, avis Google. Programme de fidélité intégré. Essai gratuit.',
      locale: 'fr_FR',
      alternateLocale: ['en_US'],
    },
    alternates: {
      canonical: baseUrl,
      languages: { fr: baseUrl, en: `${baseUrl}/en` },
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Validate locale
  if (!routing.locales.includes(locale as 'fr' | 'en')) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
      <CookieBanner />
    </NextIntlClientProvider>
  );
}
