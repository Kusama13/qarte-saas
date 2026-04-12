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
        default: 'Qarte — Online booking, loyalty & salon page for beauty pros',
        template: '%s | Qarte',
      },
      description: 'Online booking with 0% commission, digital loyalty program and SEO salon page. Each client who books gets their loyalty card automatically. Free trial.',
      openGraph: {
        title: 'Qarte — Online booking, loyalty & salon page for beauty pros',
        description: 'Online booking with 0% commission, digital loyalty program and SEO salon page. Each client who books gets their loyalty card automatically. Free trial.',
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
      default: 'Qarte — Réservation en ligne, fidélité et vitrine pour salons de beauté',
      template: '%s | Qarte',
    },
    description: 'Réservation en ligne 0% commission, programme de fidélité et vitrine SEO pour salons de beauté. Chaque cliente qui réserve reçoit sa carte de fidélité. Essai gratuit.',
    openGraph: {
      title: 'Qarte — Réservation en ligne, fidélité et vitrine pour salons de beauté',
      description: 'Réservation en ligne 0% commission, programme de fidélité et vitrine SEO pour salons de beauté. Chaque cliente qui réserve reçoit sa carte de fidélité. Essai gratuit.',
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
