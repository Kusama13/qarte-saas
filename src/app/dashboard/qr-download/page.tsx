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
  ChevronDown,
  ChevronUp,
  Scissors,
  MapPin,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { generateQRCode, getScanUrl } from '@/lib/utils';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import { FlyerTemplate } from '@/components/marketing/FlyerTemplate';
import type { Merchant } from '@/types';

const PRINTING_INSTRUCTIONS = [
  {
    icon: Printer,
    title: 'Type de papier',
    description: 'Imprimez sur du papier cartonné (200-250g) pour un meilleur rendu et une meilleure durabilité.',
  },
  {
    icon: Scissors,
    title: 'Découpe',
    description: 'Le PDF contient 4 flyers A6 sur une page A4. Découpez le long des pointillés gris.',
  },
  {
    icon: MapPin,
    title: 'Placement',
    description: 'Placez les flyers près de la caisse, sur les tables ou à l\'entrée de votre établissement.',
  },
];

export default function QRDownloadPage() {
  const router = useRouter();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
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

  const downloadInstructions = () => {
    const instructions = `
INSTRUCTIONS D'IMPRESSION - Kit Marketing ${merchant?.shop_name}
================================================================

1. TYPE DE PAPIER
   Imprimez sur du papier cartonné (200-250g) pour un meilleur rendu
   et une meilleure durabilité.

2. DÉCOUPE
   Le PDF contient 4 flyers A6 sur une page A4.
   Découpez le long des pointillés gris.

3. PLACEMENT
   Placez les flyers près de la caisse, sur les tables
   ou à l'entrée de votre établissement.

4. CONSEILS SUPPLÉMENTAIRES
   - Utilisez une imprimante couleur pour un meilleur rendu
   - Plastifiez les flyers pour une meilleure résistance
   - Renouvelez régulièrement les flyers abîmés

================================================================
Généré par Qarte - La fidélité simplifiée
    `.trim();

    const blob = new Blob([instructions], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `instructions-impression-${merchant?.slug}.txt`;
    link.click();
    URL.revokeObjectURL(url);
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

          <div className="relative flex items-center justify-center p-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl">
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
                  loyaltyMode={merchant.loyalty_mode as 'visit' | 'article'}
                  productName={merchant.product_name || undefined}
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

          {/* Instructions Section with Dropdown */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <button
              onClick={() => setInstructionsOpen(!instructionsOpen)}
              className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-amber-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-gray-900">Instructions d&apos;impression</h3>
                  <p className="text-sm text-gray-500">Conseils pour un résultat optimal</p>
                </div>
              </div>
              {instructionsOpen ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {instructionsOpen && (
              <div className="px-6 pb-6 border-t border-gray-100">
                <ul className="space-y-4 mt-4">
                  {PRINTING_INSTRUCTIONS.map((instruction, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                        <instruction.icon className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{instruction.title}</p>
                        <p className="text-sm text-gray-600">{instruction.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={downloadInstructions}
                  variant="outline"
                  className="w-full mt-4 h-10 border-amber-200 text-amber-700 hover:bg-amber-50 rounded-xl"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Télécharger les instructions
                </Button>
              </div>
            )}
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
            loyaltyMode={merchant.loyalty_mode as 'visit' | 'article'}
            productName={merchant.product_name || undefined}
            scale={1}
          />
        )}
      </div>
    </div>
  );
}
