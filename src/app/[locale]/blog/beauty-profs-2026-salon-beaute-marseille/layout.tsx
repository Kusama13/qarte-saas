import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isFr = locale === 'fr';
  const path = 'blog/beauty-profs-2026-salon-beaute-marseille';

  return {
    title: isFr
      ? 'Beauty Profs 2026 : le salon des pros de l\'ongle et du regard (Marseille)'
      : 'Beauty Profs 2026: the trade show for nail and lash pros (Marseille)',
    description: isFr
      ? 'Beauty Profs 2026, le salon pro de l\'esthétique à Marseille (14-15 novembre, Parc Chanot) : pourquoi y aller quand tu travailles l\'ongle ou le regard, les temps forts et comment rentabiliser ta visite.'
      : 'Beauty Profs 2026, the pro beauty trade show in Marseille (Nov 14-15, Parc Chanot): why to go if you work on nails or lashes, the highlights, and how to make your visit pay off.',
    keywords: isFr
      ? [
          'beauty profs 2026',
          'beauty profs marseille',
          'salon professionnel beauté marseille',
          'salon prothésiste ongulaire 2026',
          'nailympion france 2026',
          'salon esthétique cils sourcils',
        ]
      : [
          'beauty profs 2026',
          'beauty profs marseille',
          'beauty trade show france',
          'nail technician trade show 2026',
          'nailympion france 2026',
        ],
    alternates: {
      canonical: `https://getqarte.com/${isFr ? '' : 'en/'}${path}`,
      languages: {
        fr: `https://getqarte.com/${path}`,
        en: `https://getqarte.com/en/${path}`,
      },
    },
    openGraph: {
      title: isFr
        ? 'Beauty Profs 2026 : le salon des pros de l\'ongle et du regard'
        : 'Beauty Profs 2026: the trade show for nail and lash pros',
      description: isFr
        ? 'Marseille, 14-15 novembre 2026, Parc Chanot. Pourquoi y aller et comment transformer ta visite en nouvelles clientes.'
        : 'Marseille, Nov 14-15 2026, Parc Chanot. Why to go and how to turn your visit into new clients.',
      url: `https://getqarte.com/${isFr ? '' : 'en/'}${path}`,
      type: 'article',
      images: [
        {
          url: 'https://getqarte.com/blog/social/article-12-cover.png',
          width: 1080,
          height: 1080,
          alt: isFr
            ? 'Salon professionnel Beauty Profs à Marseille'
            : 'Beauty Profs professional trade show in Marseille',
        },
      ],
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
