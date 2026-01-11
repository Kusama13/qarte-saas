import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact | Qarte - Programme de fidélité digital',
  description: 'Contactez l\'équipe Qarte pour toute question sur notre solution de fidélité digitale. Nous sommes là pour vous aider.',
  openGraph: {
    title: 'Contact | Qarte',
    description: 'Contactez l\'équipe Qarte pour toute question sur notre solution de fidélité digitale.',
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
