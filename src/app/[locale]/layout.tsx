import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import CookieBanner from '@/components/shared/CookieBanner';
import FreezeDetectorMount from '@/components/shared/FreezeDetectorMount';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

// Note: metadata is defined in the root layout (src/app/layout.tsx) — FR only.
// EN is 301-redirected to FR via middleware, so no per-locale metadata needed here.
// Per-page metadata (blog posts, compare pages, etc.) is defined in each page's layout.

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Validate locale
  if (!routing.locales.includes(locale as 'fr' | 'en')) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <FreezeDetectorMount />
      {children}
      <CookieBanner />
    </NextIntlClientProvider>
  );
}
