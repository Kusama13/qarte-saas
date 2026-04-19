import type { Metadata } from 'next';
import { ScrollToTopButton } from '@/components/landing';
import LandingNav from '@/components/landing/LandingNav';
import BooksyCostCalculator from './BooksyCostCalculator';

export const metadata: Metadata = {
  title: 'Combien te coûte vraiment Booksy ? — Calculateur 2026',
  description: 'Calcule en 30 secondes combien tu perds chaque année en commissions, SMS et abonnement Booksy. Compare avec Qarte (24€/mois, 0% commission, SMS inclus).',
  openGraph: {
    title: 'Combien te coûte vraiment Booksy ? — Calculateur 2026',
    description: 'Calcule en 30 secondes combien tu perds chaque année en commissions, SMS et abonnement Booksy.',
    url: 'https://getqarte.com/combien-coute-booksy',
  },
  alternates: {
    canonical: 'https://getqarte.com/combien-coute-booksy',
  },
};

export default function BooksyCostPage() {
  return (
    <>
      <LandingNav />
      <main className="overflow-hidden">
        <BooksyCostCalculator />
      </main>
      <ScrollToTopButton />
    </>
  );
}
