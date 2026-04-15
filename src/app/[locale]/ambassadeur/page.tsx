import { getTranslations } from 'next-intl/server';
import { ScrollToTopButton } from '@/components/landing';
import LandingNav from '@/components/landing/LandingNav';
import AmbassadeurContent from './AmbassadeurContent';

export function generateStaticParams() {
  return [{ locale: 'fr' }];
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'ambassador' });
  return {
    title: t('metaTitle'),
    description: t('metaDesc'),
    openGraph: {
      title: t('metaTitle'),
      description: t('metaDesc'),
      url: 'https://getqarte.com/ambassadeur',
    },
    alternates: {
      canonical: 'https://getqarte.com/ambassadeur',
    },
  };
}

export default function AmbassadeurPage() {
  return (
    <>
      <LandingNav minimal />
      <main className="overflow-hidden">
        <AmbassadeurContent />
      </main>
      <ScrollToTopButton />
    </>
  );
}
