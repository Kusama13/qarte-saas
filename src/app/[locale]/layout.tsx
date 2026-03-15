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
        default: 'Qarte — The Linktree for beauty pros + loyalty program',
        template: '%s | Qarte',
      },
      description: 'One link to showcase everything: bio, services, schedule, photos, Google reviews. A loyalty program that brings your clients back (stamps, cashback, auto follow-ups). For hair salons, barbers, beauty salons and nail studios. $19/month, free trial.',
      openGraph: {
        title: 'Qarte — The Linktree for beauty pros + loyalty program',
        description: 'One link to showcase everything + a loyalty program that brings your clients back. $19/month, free trial.',
        locale: 'en_US',
        alternateLocale: ['fr_FR'],
      },
      alternates: {
        canonical: `${baseUrl}/en`,
        languages: { fr: baseUrl, en: `${baseUrl}/en` },
      },
    };
  }

  // FR: add alternates + og:locale:alternate
  return {
    openGraph: {
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
