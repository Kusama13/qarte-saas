import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact - Une question sur votre fidélité digitale ?',
  description: 'Besoin d\'aide pour votre carte de fidélité digitale ? Notre équipe vous répond sous 24h. Accompagnement personnalisé pour votre salon de beauté.',
  openGraph: {
    title: 'Contact | Qarte',
    description: 'Besoin d\'aide pour votre carte de fidélité digitale ? Notre équipe vous répond sous 24h.',
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
