import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isFr = locale === 'fr';

  return {
    title: isFr
      ? 'No-show salon de beauté : comment éviter les rendez-vous manqués (méthode 2026)'
      : 'No-show at beauty salons: how to stop missed appointments (2026 method)',
    description: isFr
      ? 'Un no-show coûte entre 35 et 80 € à un salon. Voici la méthode complète pour diviser par 4 les rendez-vous manqués : acompte, SMS de rappel, liste d\'attente, politique de réservation.'
      : "A no-show costs a salon between €35 and €80. Complete method to divide missed appointments by 4: deposit, SMS reminders, waitlist, booking policy.",
    keywords: isFr
      ? [
          'no show coiffeur',
          'éviter annulation rendez-vous',
          'acompte réservation salon',
          'rendez-vous manqué coiffure',
          'sms de rappel salon',
          'politique annulation institut',
        ]
      : [
          'no show hair salon',
          'avoid appointment cancellation',
          'booking deposit salon',
          'missed appointment beauty',
          'sms reminder salon',
        ],
    alternates: {
      canonical: `https://getqarte.com/${locale === 'fr' ? '' : 'en/'}blog/eviter-no-show-salon-rendez-vous`,
      languages: {
        fr: 'https://getqarte.com/blog/eviter-no-show-salon-rendez-vous',
        en: 'https://getqarte.com/en/blog/eviter-no-show-salon-rendez-vous',
      },
    },
    openGraph: {
      title: isFr
        ? 'Comment éviter les no-show dans un salon de beauté'
        : 'How to avoid no-shows in a beauty salon',
      description: isFr
        ? 'La méthode complète pour diviser par 4 les rendez-vous manqués : acompte, SMS de rappel, liste d\'attente.'
        : 'Complete method to divide missed appointments by 4: deposit, SMS reminders, waitlist.',
      url: `https://getqarte.com/${locale === 'fr' ? '' : 'en/'}blog/eviter-no-show-salon-rendez-vous`,
      type: 'article',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?auto=format&fit=crop&w=1200&q=80',
          width: 1200,
          height: 630,
          alt: isFr ? 'Salon de beauté avec réservation en ligne' : 'Beauty salon with online booking',
        },
      ],
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
