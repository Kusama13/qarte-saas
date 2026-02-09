'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import {
  Download,
  ArrowLeft,
  Check,
  Loader2,
  Copy,
  Instagram,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { toPng } from 'html-to-image';
import { SocialMediaTemplate } from '@/components/marketing/SocialMediaTemplate';
import { useMerchant } from '@/contexts/MerchantContext';

export default function SocialKitPage() {
  const { merchant, loading } = useMerchant();
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState<number | null>(null);
  const socialExportRef = useRef<HTMLDivElement>(null);

  const downloadPng = async () => {
    if (!socialExportRef.current || !merchant) return;

    setIsGenerating(true);

    try {
      const image = await toPng(socialExportRef.current, {
        pixelRatio: 4,
        cacheBust: true,
      });

      const link = document.createElement('a');
      link.download = `${merchant.shop_name.toLowerCase().replace(/\s+/g, '-')}-fidelite.png`;
      link.href = image;
      link.click();

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (error) {
      console.error('Error generating PNG:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyCaption = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCaption(index);
      setTimeout(() => setCopiedCaption(null), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedCaption(index);
      setTimeout(() => setCopiedCaption(null), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!merchant) return null;

  const tier2Text = merchant.tier2_enabled && merchant.tier2_reward_description
    ? ` Et ce n'est pas tout : après ${merchant.tier2_stamps_required} passages, recevez ${merchant.tier2_reward_description} !`
    : '';

  const captions = [
    {
      label: 'Simple et efficace',
      icon: '✨',
      text: `Votre fidélité mérite d'être récompensée ! 🎁 Après ${merchant.stamps_required} passages chez ${merchant.shop_name}, recevez ${merchant.reward_description}.${tier2Text} Demandez à scanner le QR code lors de votre prochain rendez-vous ! #fidélité #${merchant.shop_name.replace(/\s+/g, '')}`,
    },
    {
      label: 'Engageante',
      icon: '💬',
      text: `NOUVEAU chez ${merchant.shop_name} ! ✨ On lance notre carte de fidélité digitale. Pas d'application, pas de carte à perdre — juste un scan rapide à chaque visite. Votre récompense ? ${merchant.reward_description} !${tier2Text} À bientôt 💜`,
    },
    {
      label: 'Story Instagram',
      icon: '📱',
      text: `La fidélité, ça se récompense ! 💅 Demandez à scanner le QR code en caisse. ${merchant.reward_description} après ${merchant.stamps_required} passages.${tier2Text} C'est cadeau !`,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 p-4 md:p-6 rounded-2xl bg-[#4b0082]/[0.04] border border-[#4b0082]/[0.08]">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Link>
        <h1 className="text-xl md:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#4b0082] to-violet-600">
          Kit Réseaux Sociaux
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Téléchargez votre visuel et partagez-le sur Instagram, Facebook, WhatsApp...
        </p>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: Image Preview */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-purple-500" />
            Visuel pour vos réseaux
          </div>

          <div className="relative flex items-center justify-center p-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl">
            <div className="absolute inset-0 m-8 bg-black/10 blur-2xl rounded-2xl transform translate-y-4" />
            <div className="relative transform hover:scale-[1.02] transition-transform duration-300">
              <SocialMediaTemplate
                shopName={merchant.shop_name}
                primaryColor={merchant.primary_color}
                secondaryColor={merchant.secondary_color}
                logoUrl={merchant.logo_url || undefined}
                rewardDescription={merchant.reward_description || 'Récompense fidélité'}
                stampsRequired={merchant.stamps_required}
                scale={0.75}
                tier2Enabled={merchant.tier2_enabled}
                tier2StampsRequired={merchant.tier2_stamps_required}
                tier2RewardDescription={merchant.tier2_reward_description}
              />
            </div>
          </div>

          {/* Download Button */}
          <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <Button
              onClick={downloadPng}
              disabled={isGenerating}
              className="w-full h-14 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-200 transition-all"
            >
              {isGenerating ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : downloadSuccess ? (
                <Check className="w-5 h-5 mr-2" />
              ) : (
                <Download className="w-5 h-5 mr-2" />
              )}
              {downloadSuccess ? 'Téléchargé !' : 'Télécharger l\'image HD'}
            </Button>

            <p className="text-center text-xs text-gray-400">
              Format 4:5 — idéal pour Instagram, Facebook et WhatsApp
            </p>
          </div>
        </div>

        {/* Right: Captions */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wider">
            <Instagram className="w-4 h-4 text-purple-500" />
            Légendes prêtes à copier
          </div>

          <div className="space-y-3">
            {captions.map((caption, index) => (
              <div
                key={index}
                className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <span>{caption.icon}</span>
                    {caption.label}
                  </span>
                  <button
                    onClick={() => copyCaption(caption.text, index)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all"
                    style={
                      copiedCaption === index
                        ? { backgroundColor: '#d1fae5', color: '#059669' }
                        : { backgroundColor: '#f3f4f6', color: '#6b7280' }
                    }
                  >
                    {copiedCaption === index ? (
                      <>
                        <Check className="w-3 h-3" />
                        Copié !
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copier
                      </>
                    )}
                  </button>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {caption.text}
                </p>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div className="p-5 bg-purple-50 rounded-2xl border border-purple-100">
            <h3 className="font-bold text-purple-900 mb-3 text-sm">Conseils pour maximiser l&apos;impact</h3>
            <ul className="space-y-2 text-sm text-purple-800">
              <li className="flex items-start gap-2">
                <span className="font-bold text-purple-500 mt-0.5">1.</span>
                Postez en story ET en publication
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-purple-500 mt-0.5">2.</span>
                Épinglez la publication en haut de votre profil
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-purple-500 mt-0.5">3.</span>
                Parlez-en à chaque client(e) en caisse
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-purple-500 mt-0.5">4.</span>
                Envoyez l&apos;image dans vos groupes WhatsApp
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="mt-12 mb-8 flex flex-col sm:flex-row gap-4">
        <Link
          href="/dashboard/qr-download"
          className="flex-1 flex items-center justify-center gap-3 py-5 bg-white hover:bg-gray-50 text-gray-700 font-bold text-base rounded-2xl border-2 border-gray-200 hover:border-gray-300 shadow-sm transition-all"
        >
          Télécharger mon QR code
        </Link>
        <Link
          href="/dashboard"
          className="flex-1 flex items-center justify-center gap-3 py-5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-base rounded-2xl shadow-xl shadow-indigo-200 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          Tableau de bord
        </Link>
      </div>

      {/* Hidden high-res template for export */}
      <div className="fixed left-[-9999px] top-0">
        <SocialMediaTemplate
          ref={socialExportRef}
          shopName={merchant.shop_name}
          primaryColor={merchant.primary_color}
          secondaryColor={merchant.secondary_color}
          logoUrl={merchant.logo_url || undefined}
          rewardDescription={merchant.reward_description || 'Récompense fidélité'}
          stampsRequired={merchant.stamps_required}
          scale={2.7}
          tier2Enabled={merchant.tier2_enabled}
          tier2StampsRequired={merchant.tier2_stamps_required}
          tier2RewardDescription={merchant.tier2_reward_description}
        />
      </div>
    </div>
  );
}
