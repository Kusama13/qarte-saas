import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ScrollToTopButton } from '@/components/landing';
import LandingNav from '@/components/landing/LandingNav';
import CompareContent from './CompareContent';

const COMPETITORS = ['planity', 'booksy', 'bookinbeautiful'] as const;
type Competitor = (typeof COMPETITORS)[number];

function isValidCompetitor(c: string): c is Competitor {
  return COMPETITORS.includes(c as Competitor);
}

export async function generateStaticParams() {
  return COMPETITORS.map((competitor) => ({ competitor }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; competitor: string }> }) {
  const { locale, competitor } = await params;
  if (!isValidCompetitor(competitor)) return {};
  const t = await getTranslations({ locale, namespace: 'compare' });
  const metaKeys: Record<string, { title: string; desc: string }> = {
    planity: { title: 'metaTitlePlanity', desc: 'metaDescPlanity' },
    booksy: { title: 'metaTitleBooksy', desc: 'metaDescBooksy' },
    bookinbeautiful: { title: 'metaTitleBookinbeautiful', desc: 'metaDescBookinbeautiful' },
  };
  const { title: key, desc: descKey } = metaKeys[competitor];
  return {
    title: t(key),
    description: t(descKey),
    openGraph: {
      title: t(key),
      description: t(descKey),
      url: `https://getqarte.com/compare/${competitor}`,
    },
    alternates: {
      canonical: `https://getqarte.com/compare/${competitor}`,
    },
  };
}

export default async function ComparePage({ params }: { params: Promise<{ locale: string; competitor: string }> }) {
  const { competitor } = await params;
  if (!isValidCompetitor(competitor)) notFound();

  return (
    <>
      <LandingNav />
      <main className="overflow-hidden">
        <CompareContent competitor={competitor} />
      </main>
      <ScrollToTopButton />
    </>
  );
}
