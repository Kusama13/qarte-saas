import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ScrollToTopButton } from '@/components/landing';
import LandingNav from '@/components/landing/LandingNav';
import CompareContent from '../../compare/[competitor]/CompareContent';

const COMPETITORS = ['planity', 'booksy', 'bookinbeautiful'] as const;
type Competitor = (typeof COMPETITORS)[number];

function isValidCompetitor(c: string): c is Competitor {
  return COMPETITORS.includes(c as Competitor);
}

export async function generateStaticParams() {
  return COMPETITORS.flatMap((competitor) => [
    { locale: 'fr', competitor },
  ]);
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; competitor: string }> }) {
  const { locale, competitor } = await params;
  if (!isValidCompetitor(competitor)) return {};
  const t = await getTranslations({ locale, namespace: 'compare' });
  const metaKeys: Record<string, { title: string; desc: string }> = {
    planity: { title: 'altMetaTitlePlanity', desc: 'altMetaDescPlanity' },
    booksy: { title: 'altMetaTitleBooksy', desc: 'altMetaDescBooksy' },
    bookinbeautiful: { title: 'altMetaTitleBookinbeautiful', desc: 'altMetaDescBookinbeautiful' },
  };
  const meta = metaKeys[competitor];
  if (!meta) return {};
  const { title: key, desc: descKey } = meta;
  return {
    title: t(key),
    description: t(descKey),
    openGraph: {
      title: t(key),
      description: t(descKey),
      url: `https://getqarte.com/alternatives/${competitor}`,
    },
    alternates: {
      canonical: `https://getqarte.com/alternatives/${competitor}`,
    },
  };
}

export default async function AlternativePage({ params }: { params: Promise<{ locale: string; competitor: string }> }) {
  const { competitor } = await params;
  if (!isValidCompetitor(competitor)) notFound();

  return (
    <>
      <LandingNav />
      <main className="overflow-hidden">
        <CompareContent competitor={competitor} variant="alternative" />
      </main>
      <ScrollToTopButton />
    </>
  );
}
