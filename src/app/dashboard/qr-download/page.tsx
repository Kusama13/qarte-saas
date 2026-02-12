'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Download,
  Check,
  Loader2,
  Smartphone,
  Play,
  QrCode,
  Image,
  Copy,
  Instagram,
  Sparkles,
  Printer,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { generateQRCode, getScanUrl } from '@/lib/utils';
import { SocialMediaTemplate } from '@/components/marketing/SocialMediaTemplate';
import { toPng } from 'html-to-image';
import { useMerchant } from '@/contexts/MerchantContext';

type Tab = 'qr' | 'social';

export default function QRDownloadPage() {
  const { merchant, loading } = useMerchant();
  const [activeTab, setActiveTab] = useState<Tab>('qr');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [scanUrl, setScanUrl] = useState<string>('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [socialDownloadSuccess, setSocialDownloadSuccess] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState<number | null>(null);
  const socialExportRef = useRef<HTMLDivElement>(null);
  const qrCardRef = useRef<HTMLDivElement>(null);

  // Generate QR code when merchant data is available
  useEffect(() => {
    if (!merchant?.scan_code) return;
    const url = getScanUrl(merchant.scan_code);
    setScanUrl(url);
    generateQRCode(url).then(setQrCodeUrl);
  }, [merchant?.scan_code]);

  const saveQrImage = async () => {
    if (!qrCardRef.current || !merchant) return;
    try {
      const image = await toPng(qrCardRef.current, {
        pixelRatio: 4,
        cacheBust: true,
      });
      const link = document.createElement('a');
      link.download = `qr-${merchant.slug}.png`;
      link.href = image;
      link.click();

      // Track QR download for onboarding checklist (fire and forget)
      fetch('/api/onboarding/status', { method: 'POST' }).catch(() => {});

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (error) {
      console.error('Error generating QR image:', error);
    }
  };

  const downloadSocialPng = async () => {
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
      setSocialDownloadSuccess(true);
      setTimeout(() => setSocialDownloadSuccess(false), 3000);
    } catch (error) {
      console.error('Error generating PNG:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyCaption = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopiedCaption(index);
    setTimeout(() => setCopiedCaption(null), 2000);
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
    <div className="max-w-lg lg:max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 p-4 md:p-6 rounded-2xl bg-[#4b0082]/[0.04] border border-[#4b0082]/[0.08]">
        <h1 className="text-xl md:text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#4b0082] to-violet-600">
          Mon QR code & Kit promo
        </h1>
        <p className="mt-1 text-sm text-gray-500 font-medium">
          Votre QR code et vos visuels marketing en un seul endroit
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 p-1.5 bg-gray-100/80 rounded-2xl mb-6 lg:max-w-md border border-gray-200/60">
        <button
          onClick={() => setActiveTab('qr')}
          className={`flex items-center justify-center gap-2 flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200 ${
            activeTab === 'qr'
              ? 'bg-white text-indigo-700 shadow-md shadow-indigo-100/50 ring-1 ring-indigo-100'
              : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
          }`}
        >
          <QrCode className={`w-4 h-4 ${activeTab === 'qr' ? 'text-indigo-500' : ''}`} />
          Mon QR code
        </button>
        <button
          onClick={() => setActiveTab('social')}
          className={`flex items-center justify-center gap-2 flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200 ${
            activeTab === 'social'
              ? 'bg-white text-purple-700 shadow-md shadow-purple-100/50 ring-1 ring-purple-100'
              : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
          }`}
        >
          <Image className={`w-4 h-4 ${activeTab === 'social' ? 'text-purple-500' : ''}`} />
          Kit réseaux
        </button>
      </div>

      {/* ========================================= */}
      {/* TAB 1: QR CODE                            */}
      {/* ========================================= */}
      {activeTab === 'qr' && (
        <div className="animate-in fade-in duration-300 lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start">
          {/* Left: Preview */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <QrCode className="w-3.5 h-3.5" />
              Aperçu
            </div>

            {/* Gray container */}
            <div className="relative flex items-center justify-center p-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl">
              <div className="absolute inset-0 m-8 bg-black/10 blur-2xl rounded-2xl transform translate-y-4" />
              <div className="relative">
                {/* QR Card — 280x350 = same 4:5 ratio as SocialMediaTemplate at scale 0.7 */}
                <div
                  ref={qrCardRef}
                  className="relative overflow-hidden"
                  style={{
                    width: '280px',
                    height: '350px',
                    background: `linear-gradient(145deg, ${merchant.primary_color}, ${merchant.secondary_color})`,
                    borderRadius: '16px',
                  }}
                >
                  {/* Decorative circles */}
                  <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-white/10" />
                  <div className="absolute -bottom-6 -left-6 w-16 h-16 rounded-full bg-white/[0.07]" />
                  <div className="absolute top-1/2 -right-4 w-10 h-10 rounded-full bg-white/[0.05]" />

                  <div className="relative h-full px-5 py-5 flex flex-col items-center justify-between text-center">
                    {/* Top: Logo + Name */}
                    <div className="flex flex-col items-center">
                      {merchant.logo_url ? (
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/30">
                          <img
                            src={merchant.logo_url}
                            alt={merchant.shop_name}
                            className="w-full h-full object-cover"
                            crossOrigin="anonymous"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center">
                          <span className="text-base font-black text-white">
                            {merchant.shop_name[0]?.toUpperCase()}
                          </span>
                        </div>
                      )}
                      <h2 className="mt-1.5 text-base font-black text-white tracking-tight leading-tight">
                        {merchant.shop_name}
                      </h2>
                      <p className="mt-0.5 text-[7px] text-white/50 font-semibold uppercase tracking-[0.2em]">
                        Programme de fidélité
                      </p>
                    </div>

                    {/* Center: CTA + QR + Scannez-moi */}
                    <div className="flex flex-col items-center">
                      <p className="text-[11px] text-white/70 font-medium mb-2.5">
                        Ajoutez votre carte en 15 secondes
                      </p>
                      <div className="bg-white rounded-xl p-2 shadow-xl">
                        {qrCodeUrl ? (
                          <img src={qrCodeUrl} alt="QR Code" className="w-[120px] h-[120px]" />
                        ) : (
                          <div className="w-[120px] h-[120px] flex items-center justify-center">
                            <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
                          </div>
                        )}
                      </div>
                      <p className="mt-2.5 text-sm font-black text-white tracking-tight">
                        Scannez-moi !
                      </p>
                    </div>

                    {/* Bottom: Branding */}
                    <div className="px-3 py-1 rounded-full bg-white/90 shadow-sm">
                      <p className="text-[7px] text-gray-400 font-medium">
                        Propulsé par <span className="font-bold text-gray-600">getqarte.com</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="mt-6 lg:mt-0 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <Download className="w-3.5 h-3.5" />
              Actions
            </div>

            {/* Download */}
            <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <Button
                onClick={saveQrImage}
                disabled={!qrCodeUrl}
                className="w-full h-12 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all text-sm"
              >
                {downloadSuccess ? (
                  <Check className="w-4 h-4 mr-2" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                {downloadSuccess ? 'Enregistré !' : 'Enregistrer l\'image'}
              </Button>
              <p className="text-center text-xs text-gray-400">
                Format PNG — gardez-le sur votre téléphone
              </p>
            </div>

            {/* Test */}
            {scanUrl && (
              <a
                href={scanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-white border-2 border-indigo-200 hover:border-indigo-400 rounded-xl text-indigo-700 font-bold text-sm transition-all hover:shadow-md active:scale-[0.98]"
              >
                <Play className="w-4 h-4" />
                Tester l&apos;expérience client
              </a>
            )}

            {/* Tip */}
            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Smartphone className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-bold text-indigo-900 text-sm mb-0.5">Astuce</h4>
                  <p className="text-sm text-indigo-700 leading-relaxed">
                    Gardez-le sur votre téléphone et montrez-le à vos client(e)s au moment de payer
                  </p>
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="hidden lg:grid grid-cols-2 gap-3">
              <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
                <div className="text-2xl font-black text-indigo-600">15s</div>
                <p className="text-xs text-gray-500 mt-1 font-medium">Pour s&apos;inscrire</p>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
                <div className="text-2xl font-black text-violet-600">0 appli</div>
                <p className="text-xs text-gray-500 mt-1 font-medium">Rien à installer</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* TAB 2: SOCIAL KIT                         */}
      {/* ========================================= */}
      {activeTab === 'social' && (
        <div className="animate-in fade-in duration-300 lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start">
          {/* Left: Preview + Download */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Visuel pour vos réseaux
            </div>

            {/* Gray container */}
            <div className="relative flex items-center justify-center p-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl">
              <div className="absolute inset-0 m-8 bg-black/10 blur-2xl rounded-2xl transform translate-y-4" />
              <div className="relative">
                <SocialMediaTemplate
                  shopName={merchant.shop_name}
                  primaryColor={merchant.primary_color}
                  secondaryColor={merchant.secondary_color}
                  logoUrl={merchant.logo_url || undefined}
                  rewardDescription={merchant.reward_description || 'Récompense fidélité'}
                  stampsRequired={merchant.stamps_required}
                  scale={0.7}
                  tier2Enabled={merchant.tier2_enabled}
                  tier2StampsRequired={merchant.tier2_stamps_required}
                  tier2RewardDescription={merchant.tier2_reward_description}
                />
              </div>
            </div>

            {/* Download */}
            <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <Button
                onClick={downloadSocialPng}
                disabled={isGenerating}
                className="w-full h-12 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-200 transition-all text-sm"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : socialDownloadSuccess ? (
                  <Check className="w-4 h-4 mr-2" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                {socialDownloadSuccess ? 'Téléchargé !' : 'Télécharger l\'image HD'}
              </Button>
              <p className="text-center text-xs text-gray-400">
                Format 4:5 — idéal pour Instagram, Facebook et WhatsApp
              </p>
            </div>

            {/* Desktop: usage ideas */}
            <div className="hidden lg:block p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 text-sm mb-3">Où partager ce visuel</h3>
              <div className="space-y-2.5">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center flex-shrink-0">
                    <Instagram className="w-4 h-4 text-pink-500" />
                  </div>
                  Post Instagram + Story
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Share2 className="w-4 h-4 text-blue-500" />
                  </div>
                  Publication Facebook
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-green-500">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  Groupes WhatsApp
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                    <Printer className="w-4 h-4 text-orange-500" />
                  </div>
                  Impression comptoir / vitrine
                </div>
              </div>
            </div>
          </div>

          {/* Right: Captions + Tips */}
          <div className="mt-6 lg:mt-0 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <Instagram className="w-3.5 h-3.5" />
              Légendes prêtes à copier
            </div>

            <div className="space-y-3">
              {captions.map((caption, index) => (
                <div
                  key={index}
                  className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
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
            <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
              <h3 className="font-bold text-purple-900 mb-2.5 text-sm">Conseils pour maximiser l&apos;impact</h3>
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
      )}

      {/* Hidden high-res template for social kit export */}
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
