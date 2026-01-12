'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CreditCard,
  Download,
  FileText,
  Image as ImageIcon,
  ArrowRight,
  Check,
  Loader2,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { generateQRCode, getScanUrl } from '@/lib/utils';
import { jsPDF } from 'jspdf';
import { loadRobotoFonts } from '@/lib/fonts/loadFont';
import type { Merchant } from '@/types';

export default function QRDownloadPage() {
  const router = useRouter();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<'pdf' | 'png' | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/merchant');
        return;
      }

      const { data } = await supabase
        .from('merchants')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setMerchant(data);
        const scanUrl = getScanUrl(data.slug);
        const qr = await generateQRCode(scanUrl);
        setQrCodeUrl(qr);
      }
      setLoading(false);
    };

    fetchData();
  }, [router]);

  const downloadPNG = async () => {
    if (!qrCodeUrl) return;
    setDownloading('png');

    try {
      const link = document.createElement('a');
      link.download = `qr-code-${merchant?.slug}.png`;
      link.href = qrCodeUrl;
      link.click();
    } finally {
      setDownloading(null);
    }
  };

  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 101, g: 78, b: 218 };
  };

  const downloadPDF = async () => {
    if (!qrCodeUrl || !merchant) return;
    setDownloading('pdf');

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Charger la police Roboto pour les accents français
      await loadRobotoFonts(pdf);

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const primaryColor = hexToRgb(merchant.primary_color);

      // Fond de page
      pdf.setFillColor(250, 250, 252);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');

      // Barre colorée en haut
      pdf.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
      pdf.rect(0, 0, pageWidth, 10, 'F');

      const cardMargin = 20;
      const cardWidth = pageWidth - cardMargin * 2;
      const cardHeight = 200;
      const cardY = 20;

      // Ombre de la carte
      pdf.setFillColor(230, 230, 235);
      pdf.roundedRect(cardMargin + 2, cardY + 2, cardWidth, cardHeight, 8, 8, 'F');

      // Carte blanche principale
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(cardMargin, cardY, cardWidth, cardHeight, 8, 8, 'F');

      pdf.setDrawColor(240, 240, 245);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(cardMargin, cardY, cardWidth, cardHeight, 8, 8, 'S');

      // Titre accrocheur
      pdf.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
      pdf.setFontSize(14);
      pdf.setFont('Roboto', 'bold');
      const titleY = cardY + 18;
      pdf.text('Votre fidélité est récompensée chez', pageWidth / 2, titleY, { align: 'center' });

      // Nom du commerce en grand
      pdf.setTextColor(30, 30, 40);
      pdf.setFontSize(24);
      pdf.setFont('Roboto', 'bold');
      const shopNameY = titleY + 12;
      pdf.text(merchant.shop_name.toUpperCase(), pageWidth / 2, shopNameY, { align: 'center' });

      // Ligne décorative
      const lineWidth = 50;
      pdf.setDrawColor(primaryColor.r, primaryColor.g, primaryColor.b);
      pdf.setLineWidth(2);
      pdf.line(
        pageWidth / 2 - lineWidth / 2,
        shopNameY + 5,
        pageWidth / 2 + lineWidth / 2,
        shopNameY + 5
      );

      // Texte "Scannez le QR code"
      pdf.setTextColor(100, 100, 110);
      pdf.setFontSize(11);
      pdf.setFont('Roboto', 'normal');
      pdf.text('Scannez le QR code', pageWidth / 2, shopNameY + 18, { align: 'center' });

      // QR Code
      const qrSize = 70;
      const qrX = (pageWidth - qrSize) / 2;
      const qrY = shopNameY + 24;

      // Cadre autour du QR
      const framePadding = 4;
      pdf.setDrawColor(primaryColor.r, primaryColor.g, primaryColor.b);
      pdf.setLineWidth(1.5);
      pdf.roundedRect(
        qrX - framePadding,
        qrY - framePadding,
        qrSize + framePadding * 2,
        qrSize + framePadding * 2,
        4,
        4,
        'S'
      );

      pdf.addImage(qrCodeUrl, 'PNG', qrX, qrY, qrSize, qrSize);

      // Badge récompense avec icône cadeau - PLUS GRAND
      const badgeY = qrY + qrSize + 10;
      const badgeHeight = 46;
      const badgePadding = 22;

      pdf.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
      const rewardText = merchant.reward_description || 'Récompense';
      const stampsText = `Après ${merchant.stamps_required} passages`;

      // Calculer largeur basée sur les deux lignes
      pdf.setFont('Roboto', 'bold');
      pdf.setFontSize(16);
      const giftSymbol = '★ ';
      const rewardWithIcon = giftSymbol + rewardText;
      const rewardWidth = pdf.getTextWidth(rewardWithIcon);
      pdf.setFontSize(14);
      const stampsWidth = pdf.getTextWidth(stampsText);
      const maxWidth = Math.max(rewardWidth, stampsWidth);
      const textWidth = maxWidth + badgePadding * 2;

      const badgeX = (pageWidth - textWidth) / 2;
      pdf.roundedRect(badgeX, badgeY, textWidth, badgeHeight, 14, 14, 'F');

      // Ligne 1 : Icône cadeau + Description récompense (PLUS GRAND - 16px)
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('Roboto', 'bold');
      pdf.setFontSize(16);
      pdf.text(rewardWithIcon, pageWidth / 2, badgeY + 17, { align: 'center' });

      // Ligne 2 : Après X passages (PLUS GRAND - 14px)
      pdf.setFont('Roboto', 'bold');
      pdf.setFontSize(14);
      pdf.text(stampsText, pageWidth / 2, badgeY + 35, { align: 'center' });

      // Section instructions
      const instructionsY = cardY + cardHeight + 12;
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(cardMargin, instructionsY, cardWidth, 40, 6, 6, 'F');
      pdf.setDrawColor(240, 240, 245);
      pdf.roundedRect(cardMargin, instructionsY, cardWidth, 40, 6, 6, 'S');

      pdf.setTextColor(50, 50, 60);
      pdf.setFontSize(10);
      pdf.setFont('Roboto', 'bold');
      pdf.text('Comment ça marche ?', cardMargin + 12, instructionsY + 12);

      pdf.setFont('Roboto', 'normal');
      pdf.setTextColor(90, 90, 100);
      pdf.setFontSize(9);
      const instructions = [
        '1. Scannez le QR code avec votre téléphone',
        '2. Validez votre passage à chaque visite',
        `3. Cumulez ${merchant.stamps_required} passages et recevez votre récompense !`,
      ];
      instructions.forEach((text, i) => {
        pdf.text(text, cardMargin + 12, instructionsY + 21 + i * 6);
      });

      // Footer - Créé avec amour en France
      pdf.setFontSize(9);
      pdf.setTextColor(140, 140, 150);
      pdf.setFont('Roboto', 'normal');
      pdf.text('Créé avec', pageWidth / 2 - 18, pageHeight - 16, { align: 'center' });

      // Coeur rouge
      pdf.setTextColor(220, 50, 50);
      pdf.setFont('Roboto', 'bold');
      pdf.text('♥', pageWidth / 2 - 2, pageHeight - 16, { align: 'center' });

      pdf.setTextColor(140, 140, 150);
      pdf.setFont('Roboto', 'normal');
      pdf.text('en France', pageWidth / 2 + 12, pageHeight - 16, { align: 'center' });

      // URL getqarte.com
      pdf.setFont('Roboto', 'bold');
      pdf.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
      pdf.setFontSize(10);
      pdf.text('getqarte.com', pageWidth / 2, pageHeight - 9, { align: 'center' });

      pdf.save(`qr-code-${merchant.slug}.pdf`);
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-4 mx-auto max-w-7xl">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Qarte</span>
          </Link>
        </div>
      </header>

      <main className="px-4 py-8 mx-auto max-w-3xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-green-100">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Votre QR code est prêt !
          </h1>
          <p className="mt-2 text-gray-600">
            Téléchargez-le et affichez-le dans votre commerce
          </p>
        </div>

        <div className="p-8 bg-white shadow-xl rounded-3xl">
          <div className="flex flex-col items-center">
            {qrCodeUrl && (
              <div className="p-4 mb-6 bg-white border-4 border-gray-100 rounded-2xl">
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="w-64 h-64 md:w-80 md:h-80"
                />
              </div>
            )}

            <div className="p-4 mb-6 text-center rounded-xl bg-primary-50">
              <p className="font-medium text-primary">
                Gagnez {merchant?.reward_description} après{' '}
                {merchant?.stamps_required} passages
              </p>
            </div>

            <div className="flex flex-col w-full gap-4 sm:flex-row sm:justify-center">
              <Button
                onClick={downloadPDF}
                loading={downloading === 'pdf'}
                disabled={downloading !== null}
                className="sm:w-48"
              >
                <FileText className="w-5 h-5 mr-2" />
                Télécharger PDF
              </Button>
              <Button
                variant="outline"
                onClick={downloadPNG}
                loading={downloading === 'png'}
                disabled={downloading !== null}
                className="sm:w-48"
              >
                <ImageIcon className="w-5 h-5 mr-2" />
                Télécharger PNG
              </Button>
            </div>

            <div className="mt-6 p-4 w-full rounded-xl bg-gray-50">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Share2 className="w-4 h-4" />
                <span className="font-medium">Lien de scan :</span>
              </div>
              <p className="mt-1 text-sm text-primary break-all">
                {getScanUrl(merchant?.slug || '')}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/dashboard">
            <Button>
              Accéder à mon tableau de bord
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>

        <div className="mt-8 p-6 bg-primary-50 rounded-2xl">
          <h3 className="font-semibold text-gray-900 mb-3">
            Conseils pour afficher votre QR code
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 text-green-500" />
              Imprimez le PDF au format A4 pour une meilleure visibilité
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 text-green-500" />
              Placez-le près de la caisse ou sur le comptoir
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 text-green-500" />
              Assurez-vous qu&apos;il soit à hauteur des yeux du client
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 text-green-500" />
              Plastifiez-le pour le protéger de l&apos;usure
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
