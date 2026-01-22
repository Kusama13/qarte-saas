'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Download,
  FileText,
  Image as ImageIcon,
  ArrowLeft,
  Check,
  Loader2,
  Printer,
  Lightbulb,
  Palette,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { generateQRCode, getScanUrl } from '@/lib/utils';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import { FlyerTemplate } from '@/components/marketing/FlyerTemplate';
import type { Merchant } from '@/types';

export default function QRDownloadPage() {
  const router = useRouter();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const flyerPreviewRef = useRef<HTMLDivElement>(null);
  const flyerExportRef = useRef<HTMLDivElement>(null);

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
        const scanUrl = getScanUrl(data.scan_code);
        const qr = await generateQRCode(scanUrl);
        setQrCodeUrl(qr);
      }
      setLoading(false);
    };

    fetchData();
  }, [router]);

  const generatePdf = async () => {
    if (!flyerExportRef.current || !merchant) return;

    setIsGenerating(true);

    try {
      // Capture the flyer as a high-resolution PNG
      const flyerImage = await toPng(flyerExportRef.current, {
        pixelRatio: 4, // HD quality
        cacheBust: true,
      });

      // Create A4 PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm

      // A6 dimensions: 105mm x 148mm
      // 4 flyers fit perfectly on A4 (2x2 grid)
      const flyerWidth = 105;
      const flyerHeight = 148;

      // Position of each flyer (2x2 grid)
      const positions = [
        { x: 0, y: 0 },
        { x: flyerWidth, y: 0 },
        { x: 0, y: flyerHeight },
        { x: flyerWidth, y: flyerHeight },
      ];

      // Add each flyer
      positions.forEach((pos) => {
        pdf.addImage(flyerImage, 'PNG', pos.x, pos.y, flyerWidth, flyerHeight);
      });

      // Add cut guides (dashed lines)
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineDashPattern([2, 2], 0);
      pdf.setLineWidth(0.3);

      // Vertical line in center
      pdf.line(pageWidth / 2, 0, pageWidth / 2, pageHeight);
      // Horizontal line in center
      pdf.line(0, pageHeight / 2, pageWidth, pageHeight / 2);

      // Save the PDF
      pdf.save(`kit-marketing-${merchant.slug}.pdf`);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPng = async () => {
    if (!flyerExportRef.current || !merchant) return;

    setIsGenerating(true);

    try {
      const flyerImage = await toPng(flyerExportRef.current, {
        pixelRatio: 4,
        cacheBust: true,
      });

      const link = document.createElement('a');
      link.download = `flyer-${merchant.slug}.png`;
      link.href = flyerImage;
      link.click();

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (error) {
      console.error('Error generating PNG:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden mb-8 p-8 rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700">
        {/* Decorative elements */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />

        <div className="relative">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au tableau de bord
          </Link>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            Votre Kit Marketing
          </h1>
          <p className="mt-2 text-white/80 font-medium">
            Imprimez vos flyers pour vos clients
          </p>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column: Flyer Preview */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            Aperçu du Flyer A6
          </div>

          {/* Flyer Mockup with realistic shadow */}
          <div className="relative flex items-center justify-center p-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl">
            {/* Paper shadow effect */}
            <div className="absolute inset-0 m-8 bg-black/10 blur-2xl rounded-2xl transform translate-y-4" />

            {/* Flyer Component */}
            <div className="relative transform hover:scale-[1.02] transition-transform duration-300">
              {qrCodeUrl && merchant && (
                <FlyerTemplate
                  ref={flyerPreviewRef}
                  shopName={merchant.shop_name}
                  primaryColor={merchant.primary_color}
                  secondaryColor={merchant.secondary_color}
                  logoUrl={merchant.logo_url || undefined}
                  qrCodeUrl={qrCodeUrl}
                  rewardDescription={merchant.reward_description || 'Récompense fidélité'}
                  stampsRequired={merchant.stamps_required}
                  scale={0.65}
                />
              )}
            </div>
          </div>

          <p className="text-center text-xs text-gray-400">
            Le flyer s&apos;adapte automatiquement à vos couleurs
          </p>
        </div>

        {/* Right Column: Actions & Info */}
        <div className="space-y-6">
          {/* Design Detected Panel */}
          <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                <Palette className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Design détecté</h3>
                <p className="text-sm text-gray-500">Basé sur votre configuration</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full">
                <div
                  className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: merchant?.primary_color }}
                />
                <span className="text-xs font-medium text-gray-600">Couleur principale</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full">
                <div
                  className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: merchant?.secondary_color }}
                />
                <span className="text-xs font-medium text-gray-600">Couleur secondaire</span>
              </div>
              {merchant?.logo_url && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full">
                  <Check className="w-3 h-3 text-green-600" />
                  <span className="text-xs font-medium text-gray-600">Logo inclus</span>
                </div>
              )}
            </div>
          </div>

          {/* Download Buttons */}
          <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Download className="w-5 h-5 text-indigo-600" />
              Télécharger
            </h3>

            {/* Primary: PDF with 4 flyers */}
            <Button
              onClick={generatePdf}
              disabled={isGenerating}
              className="w-full h-14 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all"
            >
              {isGenerating ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : downloadSuccess ? (
                <Check className="w-5 h-5 mr-2" />
              ) : (
                <FileText className="w-5 h-5 mr-2" />
              )}
              {downloadSuccess ? 'Téléchargé !' : 'Télécharger le PDF (A4 - 4 flyers)'}
            </Button>

            {/* Secondary: Single PNG */}
            <Button
              onClick={downloadPng}
              disabled={isGenerating}
              variant="outline"
              className="w-full h-12 border-2 border-gray-200 hover:border-indigo-200 hover:bg-indigo-50 font-semibold rounded-xl transition-all"
            >
              <ImageIcon className="w-5 h-5 mr-2" />
              Télécharger en PNG (1 flyer)
            </Button>
          </div>

          {/* Printing Tips */}
          <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-amber-900 mb-2">Conseils d&apos;impression</h3>
                <ul className="space-y-2 text-sm text-amber-800">
                  <li className="flex items-start gap-2">
                    <Printer className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Imprimez sur du <strong>papier cartonné</strong> (200-250g) pour un meilleur rendu</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
                    <span>Le PDF contient 4 flyers A6 sur une page A4, découpez le long des pointillés</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
                    <span>Placez les flyers près de la caisse ou sur les tables</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* QR Code Info */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 text-center">
              Le QR code redirige vers <span className="font-mono text-indigo-600">{getScanUrl(merchant?.scan_code || '')}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Hidden high-res flyer for PDF generation */}
      <div className="fixed left-[-9999px] top-0">
        {qrCodeUrl && merchant && (
          <FlyerTemplate
            ref={flyerExportRef}
            shopName={merchant.shop_name}
            primaryColor={merchant.primary_color}
            secondaryColor={merchant.secondary_color}
            logoUrl={merchant.logo_url || undefined}
            qrCodeUrl={qrCodeUrl}
            rewardDescription={merchant.reward_description || 'Récompense fidélité'}
            stampsRequired={merchant.stamps_required}
            scale={1}
          />
        )}
      </div>
    </div>
  );
}
