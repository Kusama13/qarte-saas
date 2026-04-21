import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://getqarte.com';
const slug = 'programme-fidelite-onglerie-guide';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();

  if (locale === 'en') {
    return {
      title: 'Nail salon loyalty program: the complete guide to retaining clients',
      description:
        'Infills, gel, semi-permanent... your clients come back every 3 weeks. Discover how to create a profitable loyalty program for your nail salon: which type to choose, real examples and step-by-step setup.',
      openGraph: {
        title: 'Nail salon loyalty program: the complete guide to retaining clients',
        description:
          'Infills every 3 weeks, semi-permanent every month... Turn this natural recurrence into a profitable loyalty program. Complete guide with real examples.',
        type: 'article',
        locale: 'en_US',
      },
      alternates: {
        canonical: `${baseUrl}/en/blog/${slug}`,
        languages: { fr: `${baseUrl}/blog/${slug}`, en: `${baseUrl}/en/blog/${slug}` },
      },
    };
  }

  return {
    title: 'Programme fidélité onglerie : le guide complet pour fidéliser vos clientes',
    description:
      'Remplissage, semi-permanent, gel... vos clientes reviennent toutes les 3 semaines. Découvrez comment créer un programme de fidélité rentable pour votre onglerie : quel type choisir, exemples concrets et mise en place pas à pas.',
    keywords: [
      'programme fidélité onglerie',
      'carte fidélité onglerie',
      'fidéliser clientes onglerie',
      'programme fidélité nail art',
      'carte fidélité prothésiste ongulaire',
      'fidélisation onglerie',
      'programme fidélité manucure',
      'fidéliser clientes nail salon',
    ],
    openGraph: {
      title: 'Programme fidélité onglerie : le guide complet pour fidéliser vos clientes',
      description:
        'Remplissage toutes les 3 semaines, semi-permanent tous les mois... Transformez cette récurrence naturelle en programme de fidélité rentable. Guide complet avec exemples concrets.',
      type: 'article',
      locale: 'fr_FR',
    },
    alternates: {
      canonical: `${baseUrl}/blog/${slug}`,
      languages: { fr: `${baseUrl}/blog/${slug}`, en: `${baseUrl}/en/blog/${slug}` },
    },
  };
}

export default function ArticleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
