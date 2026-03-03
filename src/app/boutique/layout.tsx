import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Carte NFC Qarte — Fidélisez en un geste',
  description:
    'La carte NFC Qarte ouvre la page fidélité en un tap. Plus besoin de scanner un QR code. 20 €, livraison sous 1 à 2 semaines.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
