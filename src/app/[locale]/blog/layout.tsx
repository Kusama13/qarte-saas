import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://getqarte.com';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();

  if (locale === 'en') {
    return {
      title: {
        template: '%s | Qarte Blog',
        default: 'Blog — Loyalty tips for beauty salons | Qarte',
      },
      description:
        'Tips, guides and strategies to boost client retention in hair salons, nail studios and beauty salons. By Qarte, the digital loyalty card.',
      openGraph: {
        title: 'Qarte Blog — Beauty loyalty tips',
        description: 'Practical guides to boost client retention in beauty salons.',
        type: 'website',
        locale: 'en_US',
      },
      alternates: {
        canonical: `${baseUrl}/en/blog`,
        languages: { fr: `${baseUrl}/blog`, en: `${baseUrl}/en/blog` },
      },
    };
  }

  return {
    title: {
      template: '%s | Blog Qarte',
      default: 'Blog — Conseils fidélisation pour salons de beauté | Qarte',
    },
    description:
      'Conseils, guides et astuces pour fidéliser vos clientes en salon de coiffure, onglerie et institut de beauté. Par Qarte, la carte de fidélité digitale.',
    keywords: [
      'fidélisation salon beauté',
      'carte fidélité coiffeur',
      'programme fidélité onglerie',
      'fidélisation institut beauté',
      'carte fidélité digitale',
      'blog salon de coiffure',
    ],
    openGraph: {
      title: 'Blog Qarte — Conseils fidélisation beauté',
      description: 'Guides pratiques pour fidéliser vos clientes en salon de beauté.',
      type: 'website',
      locale: 'fr_FR',
    },
    alternates: {
      canonical: `${baseUrl}/blog`,
      languages: { fr: `${baseUrl}/blog`, en: `${baseUrl}/en/blog` },
    },
  };
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
