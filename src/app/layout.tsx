import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Qarte - Digitalisez vos cartes de fidélité',
  description: 'La solution la moins chère du marché pour digitaliser vos cartes de fidélité. Essai gratuit 14 jours.',
  keywords: 'carte de fidélité, fidélisation client, commerce, QR code, digital',
  authors: [{ name: 'Qarte' }],
  openGraph: {
    title: 'Qarte - Digitalisez vos cartes de fidélité',
    description: 'La solution la moins chère du marché pour digitaliser vos cartes de fidélité.',
    type: 'website',
    locale: 'fr_FR',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
