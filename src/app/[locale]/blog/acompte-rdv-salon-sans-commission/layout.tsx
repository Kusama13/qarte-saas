import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isFr = locale === 'fr';
  const path = 'blog/acompte-rdv-salon-sans-commission';

  return {
    title: isFr
      ? 'Acompte salon de beauté : encaisser 100% direct sur ton compte (0% commission)'
      : 'Salon deposits: collect 100% straight to your account (0% commission)',
    description: isFr
      ? 'Comment demander un acompte pour tes RDV et l\'encaisser en entier sur ton compte pro, en 24h, via ton lien Revolut, PayPal ou SumUp. 0% de commission Qarte.'
      : 'How to ask for a deposit on your appointments and collect it in full to your pro account within 24h, via your Revolut, PayPal or SumUp link. 0% Qarte commission.',
    keywords: isFr
      ? [
          'acompte rdv salon',
          'demander un acompte coiffure',
          'acompte salon sans commission',
          'acompte revolut paypal salon',
          'encaisser acompte sur compte pro',
        ]
      : [
          'salon appointment deposit',
          'ask for a deposit hair salon',
          'deposit without commission',
          'revolut paypal deposit salon',
          'collect deposit pro account',
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
        ? 'Acompte salon : 100% sur ton compte, 0% de commission'
        : 'Salon deposits: 100% to your account, 0% commission',
      description: isFr
        ? 'Encaisse tes acomptes en entier sur ton compte pro, en 24h, via ton lien Revolut, PayPal ou SumUp.'
        : 'Collect your deposits in full to your pro account within 24h, via your Revolut, PayPal or SumUp link.',
      url: `https://getqarte.com/${isFr ? '' : 'en/'}${path}`,
      type: 'article',
      images: [
        {
          url: 'https://getqarte.com/blog/social/article-10-cover.png',
          width: 1080,
          height: 1080,
          alt: isFr
            ? 'Acompte de RDV salon encaissé directement sur le compte pro'
            : 'Salon appointment deposit collected straight to the pro account',
        },
      ],
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
