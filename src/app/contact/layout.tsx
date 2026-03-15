import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact — Une question sur Qarte ?',
  description: 'Besoin d\'aide pour votre vitrine en ligne ou votre programme de fidélité ? Notre équipe vous répond sous 24h. Accompagnement personnalisé pour votre salon de beauté.',
  openGraph: {
    title: 'Contact | Qarte',
    description: 'Besoin d\'aide pour votre vitrine en ligne ou programme de fidélité ? Notre équipe vous répond sous 24h.',
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
