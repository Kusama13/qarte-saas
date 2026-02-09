'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Download,
  FileText,
  Image as ImageIcon,
  Check,
  Loader2,
  Palette,
  Sparkles,
  Smartphone,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { generateQRCode, getScanUrl } from '@/lib/utils';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import { FlyerTemplate } from '@/components/marketing/FlyerTemplate';
import { useMerchant } from '@/contexts/MerchantContext';

export default function QRDownloadPage() {
  const { merchant, loading } = useMerchant();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const flyerPreviewRef = useRef<HTMLDivElement>(null);
  const flyerExportRef = useRef<HTMLDivElement>(null);

  // Generate QR code when merchant data is available
  useEffect(() => {
    if (!merchant?.scan_code) return;
    const scanUrl = getScanUrl(merchant.scan_code);
    generateQRCode(scanUrl).then(setQrCodeUrl);
    // Track visit for onboarding checklist
    localStorage.setItem(`qarte_checklist_qr_${merchant.id}`, '1');
  }, [merchant?.scan_code]);

  const generatePdf = async () => {
    if (!flyerExportRef.current || !merchant) return;

    setIsGenerating(true);

    try {
      const flyerImage = await toPng(flyerExportRef.current, {
        pixelRatio: 4,
        cacheBust: true,
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const flyerWidth = 105;
      const flyerHeight = 148;

      const positions = [
        { x: 0, y: 0 },
        { x: flyerWidth, y: 0 },
        { x: 0, y: flyerHeight },
        { x: flyerWidth, y: flyerHeight },
      ];

      positions.forEach((pos) => {
        pdf.addImage(flyerImage, 'PNG', pos.x, pos.y, flyerWidth, flyerHeight);
      });

      pdf.setDrawColor(200, 200, 200);
      pdf.setLineDashPattern([2, 2], 0);
      pdf.setLineWidth(0.3);

      pdf.line(pageWidth / 2, 0, pageWidth / 2, pageHeight);
      pdf.line(0, pageHeight / 2, pageWidth, pageHeight / 2);

      pdf.save(`qr-flyer-${merchant.slug}.pdf`);

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
      <div className="mb-6 md:mb-8 p-4 md:p-6 rounded-2xl bg-[#4b0082]/[0.04] border border-[#4b0082]/[0.08]">
        <h1 className="text-xl md:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#4b0082] to-violet-600">
          Télécharger QR
        </h1>
        <p className="mt-1 text-sm md:text-base text-gray-500 font-medium">
          Imprimez ou partagez votre QR code
        </p>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6 md:gap-8">
        {/* Left Column: Flyer Preview */}
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center gap-2 text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            Aperçu du Flyer A6
          </div>

          <div className="relative flex items-center justify-center p-4 md:p-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl md:rounded-3xl">
            <div className="absolute inset-0 m-8 bg-black/10 blur-2xl rounded-2xl transform translate-y-4" />

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
                  tier2Enabled={merchant.tier2_enabled}
                  tier2StampsRequired={merchant.tier2_stamps_required}
                  tier2RewardDescription={merchant.tier2_reward_description}
                />
              )}
            </div>
          </div>

          <p className="text-center text-xs text-gray-400">
            Le flyer s&apos;adapte automatiquement à vos couleurs
          </p>
        </div>

        {/* Right Column: Actions & Info */}
        <div className="space-y-4 md:space-y-6">
          {/* Design Detected Panel */}
          <div className="p-4 md:p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
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
          <div className="p-4 md:p-6 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-3 md:space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm md:text-base">
              <Download className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" />
              Télécharger
            </h3>

            <Button
              onClick={generatePdf}
              disabled={isGenerating}
              className="w-full h-12 md:h-14 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all text-sm md:text-base"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin mr-2" />
              ) : downloadSuccess ? (
                <Check className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              ) : (
                <FileText className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              )}
              {downloadSuccess ? 'Téléchargé !' : 'Télécharger le PDF (A4 - 4 flyers)'}
            </Button>

            <Button
              onClick={downloadPng}
              disabled={isGenerating}
              variant="outline"
              className="w-full h-10 md:h-12 border-2 border-gray-200 hover:border-indigo-200 hover:bg-indigo-50 font-semibold rounded-xl transition-all text-sm"
            >
              <ImageIcon className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              Télécharger en PNG (1 flyer)
            </Button>
          </div>

          {/* Info Message */}
          <div className="p-3 md:p-4 bg-indigo-50 rounded-xl md:rounded-2xl border border-indigo-100">
            <div className="flex items-center gap-2.5 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" />
              </div>
              <p className="text-xs md:text-sm text-indigo-800">
                Vous pouvez imprimer ce flyer ou le présenter directement sur votre téléphone, ça marche aussi !
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Social Kit Banner */}
      <div className="mt-6 md:mt-8 p-4 md:p-6 bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl border border-purple-100">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-200">
            <Share2 className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-sm md:text-base">Partagez sur vos réseaux</h3>
            <p className="text-xs md:text-sm text-gray-600">Téléchargez un visuel prêt à poster sur Instagram, Facebook...</p>
          </div>
          <Link
            href="/dashboard/social-kit"
            className="px-4 py-2 md:px-5 md:py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all text-xs md:text-sm whitespace-nowrap"
          >
            Voir le kit
          </Link>
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
            tier2Enabled={merchant.tier2_enabled}
            tier2StampsRequired={merchant.tier2_stamps_required}
            tier2RewardDescription={merchant.tier2_reward_description}
          />
        )}
      </div>
    </div>
  );
}
