import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tarifs — Vitrine en ligne & fidélité tout inclus dès 19 €/mois',
  description: 'Un prix unique pour tout : votre vitrine en ligne (bio, prestations, planning, photos) et programme de fidélité (tampons, cagnotte, relances auto, avis Google). Essai gratuit 7 jours, sans carte bancaire.',
  openGraph: {
    title: 'Tarifs — Vitrine en ligne & fidélité tout inclus dès 19 €/mois | Qarte',
    description: 'Vitrine en ligne + programme de fidélité pour salons de beauté. 19 €/mois tout inclus, essai gratuit 7 jours sans carte bancaire.',
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
