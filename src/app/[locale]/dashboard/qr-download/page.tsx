'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
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
  AlertTriangle,
  Gift,
  Users,
  X,
  CreditCard,
  Nfc,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { generateQRCodeSVG, getScanUrl } from '@/lib/utils';
import { SocialMediaTemplate } from '@/components/marketing/SocialMediaTemplate';
import { toPng } from 'html-to-image';
import { useMerchant } from '@/contexts/MerchantContext';

type Tab = 'qr' | 'social' | 'nfc';


export default function QRDownloadPage() {
  const t = useTranslations('qrDownload');
  const { merchant, loading } = useMerchant();
  const [activeTab, setActiveTab] = useState<Tab>('qr');
  const [qrSvg, setQrSvg] = useState<string>('');
  const [scanUrl, setScanUrl] = useState<string>('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [socialDownloadSuccess, setSocialDownloadSuccess] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState<number | null>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [showPostDownloadModal, setShowPostDownloadModal] = useState(false);

  const socialExportRef = useRef<HTMLDivElement>(null);
  const qrCardRef = useRef<HTMLDivElement>(null);

  // Generate QR code when merchant data is available
  useEffect(() => {
    if (!merchant?.scan_code) return;
    const url = getScanUrl(merchant.scan_code);
    setScanUrl(url);
    generateQRCodeSVG(url).then(setQrSvg).catch(console.error);
  }, [merchant?.scan_code]);

  // Pre-fetch logo as base64 to avoid CORS issues with html-to-image export
  useEffect(() => {
    if (!merchant?.logo_url) return;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d')!.drawImage(img, 0, 0);
      setLogoDataUrl(canvas.toDataURL('image/png'));
    };
    img.onerror = () => setLogoDataUrl(null);
    img.src = merchant.logo_url;
  }, [merchant?.logo_url]);

  /** Convert data URL to File for Web Share API */
  const dataUrlToFile = async (dataUrl: string, filename: string): Promise<File> => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: 'image/png' });
  };

  /** Share or download a PNG — uses native share sheet on mobile, fallback to download on desktop */
  const shareOrDownload = async (dataUrl: string, filename: string) => {
    const file = await dataUrlToFile(dataUrl, filename);
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file] });
    } else {
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();
    }
  };

  const saveQrImage = async () => {
    if (!qrCardRef.current || !merchant) return;
    try {
      const image = await toPng(qrCardRef.current, {
        pixelRatio: 4,
      });
      await shareOrDownload(image, `qr-${merchant.slug}.png`);

      // Track QR download for onboarding checklist (fire and forget)
      fetch('/api/onboarding/status', { method: 'POST' }).catch(() => {});

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);

      // Show post-download modal (one-shot via localStorage, delayed for UX)
      const POST_QR_KEY = 'qarte_post_qr_seen';
      if (!localStorage.getItem(POST_QR_KEY)) {
        localStorage.setItem(POST_QR_KEY, '1');
        setTimeout(() => setShowPostDownloadModal(true), 1200);
      }
    } catch (error) {
      console.error('Error generating QR image:', error);
    }
  };

  const downloadSocialPng = async () => {
    if (!socialExportRef.current || !merchant) return;
    setIsGenerating(true);
    try {
      const image = await toPng(socialExportRef.current, {
        pixelRatio: 2,
      });
      await shareOrDownload(image, `${merchant.shop_name.toLowerCase().replace(/\s+/g, '-')}-fidelite.png`);

      // Track social kit download (fire and forget)
      fetch('/api/onboarding/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'social_kit' }),
      }).catch(() => {});

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
      // Clipboard API not available (e.g. non-HTTPS)
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

  const hasPalier1 = !!merchant.reward_description;

  const isCagnotte = merchant.loyalty_mode === 'cagnotte';

  const tier2Text = merchant.tier2_enabled && (merchant.tier2_reward_description || (isCagnotte && merchant.cagnotte_tier2_percent))
    ? isCagnotte
      ? ` Et ce n'est pas tout : après ${merchant.tier2_stamps_required} passages, profitez de ${merchant.cagnotte_tier2_percent}% sur votre cagnotte fidélité !`
      : ` Et ce n'est pas tout : après ${merchant.tier2_stamps_required} passages, recevez ${merchant.tier2_reward_description} !`
    : '';

  const captionText = isCagnotte
    ? `Votre fidélité mérite d'être récompensée ! 🎁 Après ${merchant.stamps_required} passages chez ${merchant.shop_name}, profitez de ${merchant.cagnotte_percent}% sur votre cagnotte fidélité.${tier2Text} Demandez à scanner le QR code lors de votre prochain rendez-vous ! #fidélité #${merchant.shop_name.replace(/\s+/g, '')}`
    : `Votre fidélité mérite d'être récompensée ! 🎁 Après ${merchant.stamps_required} passages chez ${merchant.shop_name}, recevez ${merchant.reward_description}.${tier2Text} Demandez à scanner le QR code lors de votre prochain rendez-vous ! #fidélité #${merchant.shop_name.replace(/\s+/g, '')}`;

  const captions = [
    {
      label: t('captionSimple'),
      icon: '✨',
      text: captionText,
    },
  ];

  return (
    <div className="max-w-lg lg:max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 p-4 md:p-6 rounded-2xl bg-[#4b0082]/[0.04] border border-[#4b0082]/[0.08]">
        <h1 className="text-xl md:text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#4b0082] to-violet-600">
          {t('title')}
        </h1>
        <p className="mt-1 text-sm text-gray-500 font-medium">
          {t('subtitle')}
        </p>
      </div>

      {/* Comment ça marche (QR tab only) */}
      {activeTab === 'qr' && <div className="mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3">{t('howTitle')}</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <QrCode className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{t('howQrTitle')}</p>
                <p className="text-xs text-gray-500">{t('howQrDesc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Gift className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{t('howRewardTitle')}</p>
                <p className="text-xs text-gray-500">{t('howRewardDesc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Smartphone className="w-4 h-4 text-pink-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{t('howMobileTitle')}</p>
                <p className="text-xs text-gray-500">{t('howMobileDesc')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>}

      {/* Tabs */}
      <div className="flex gap-1.5 p-1.5 bg-gray-100/80 rounded-2xl mb-6 lg:max-w-xl border border-gray-200/60">
        <button
          onClick={() => setActiveTab('qr')}
          className={`flex items-center justify-center gap-2 flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200 ${
            activeTab === 'qr'
              ? 'bg-white text-indigo-700 shadow-md shadow-indigo-100/50 ring-1 ring-indigo-100'
              : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
          }`}
        >
          <QrCode className={`w-4 h-4 ${activeTab === 'qr' ? 'text-indigo-500' : ''}`} />
          {t('tabQr')}
        </button>
        <button
          onClick={() => setActiveTab('social')}
          className={`flex items-center justify-center gap-2 flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200 ${
            activeTab === 'social'
              ? 'bg-white text-purple-700 shadow-md shadow-purple-100/50 ring-1 ring-purple-100'
              : 'text-purple-600 bg-purple-50 hover:bg-purple-100 ring-1 ring-purple-200'
          }`}
        >
          <Image className="w-4 h-4 text-purple-500" />
          {t('tabSocial')}
          {activeTab !== 'social' && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-purple-600 text-white rounded-full">NEW</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('nfc')}
          className={`flex items-center justify-center gap-2 flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200 ${
            activeTab === 'nfc'
              ? 'bg-white text-violet-700 shadow-md shadow-violet-100/50 ring-1 ring-violet-100'
              : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
          }`}
        >
          <Nfc className={`w-4 h-4 ${activeTab === 'nfc' ? 'text-violet-500' : ''}`} />
          {t('tabNfc')}
        </button>
      </div>

      {/* TAB 1: QR CODE */}
      {activeTab === 'qr' && (
        <div className="animate-in fade-in duration-300 lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start">
          {/* Left: Preview */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <QrCode className="w-3.5 h-3.5" />
              {t('preview')}
            </div>

            {/* Gray container */}
            <div className="relative flex items-center justify-center p-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl">
              <div className="absolute inset-0 m-8 bg-black/10 blur-2xl rounded-2xl transform translate-y-4" />
              <div className="relative">
                {/* QR Card */}
                <div
                  ref={qrCardRef}
                  className="relative overflow-hidden"
                  style={{
                    width: '280px',
                    height: '350px',
                    background: `linear-gradient(145deg, ${merchant.primary_color}, ${merchant.secondary_color})`,
                    borderRadius: '16px',
                    clipPath: 'inset(0px round 16px)',
                  }}
                >
                  {/* Decorative circles */}
                  <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-white/10" />
                  <div className="absolute -bottom-6 -left-6 w-16 h-16 rounded-full bg-white/[0.07]" />
                  <div className="absolute top-1/2 -right-4 w-10 h-10 rounded-full bg-white/[0.05]" />

                  <div className="relative h-full px-5 py-4 flex flex-col items-center text-center">
                    {/* Top: Logo + Name */}
                    <div className="flex-shrink-0 flex flex-col items-center">
                      {merchant.logo_url ? (
                        <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/30">
                          <img
                            src={logoDataUrl || merchant.logo_url}
                            alt={merchant.shop_name}
                            className="w-full h-full object-cover"
                            crossOrigin="anonymous"
                          />
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center">
                          <span className="text-sm font-black text-white">
                            {merchant.shop_name[0]?.toUpperCase()}
                          </span>
                        </div>
                      )}
                      <h2 className="mt-1 text-sm font-black text-white tracking-tight leading-tight">
                        {merchant.shop_name}
                      </h2>
                      <p className="mt-0.5 text-[7px] text-white/50 font-semibold uppercase tracking-[0.2em]">
                        {t('loyaltyProgram')}
                      </p>
                    </div>

                    {/* Center: CTA + QR + Scannez-moi */}
                    <div className="flex-1 flex flex-col items-center justify-center min-h-0">
                      <p className="text-[11px] text-white/70 font-medium mb-2">
                        {t('addCard')}
                      </p>
                      <div className="flex-shrink-0 bg-white rounded-xl p-2 overflow-hidden">
                        {qrSvg ? (
                          <div
                            style={{ width: '120px', height: '120px' }}
                            dangerouslySetInnerHTML={{
                              __html: qrSvg
                                .replace(/width="[^"]*"/, 'width="100%"')
                                .replace(/height="[^"]*"/, 'height="100%"'),
                            }}
                          />
                        ) : (
                          <div className="w-[120px] h-[120px] flex items-center justify-center">
                            <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
                          </div>
                        )}
                      </div>
                      <p className="mt-2 text-sm font-black text-white tracking-tight">
                        {t('scanMe')}
                      </p>
                    </div>

                    {/* Bottom: Branding */}
                    <div className="flex-shrink-0 px-3 py-1 rounded-full bg-white/90">
                      <p className="text-[7px] text-gray-400 font-medium">
                        {t('poweredBy')} <span className="font-bold text-gray-600">getqarte.com</span>
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
              {t('actions')}
            </div>

            {/* Download */}
            <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-3">
              {!hasPalier1 && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <p className="text-xs text-amber-700 font-medium">
                    {t('configureTier1')}
                  </p>
                </div>
              )}
              <Button
                onClick={saveQrImage}
                disabled={!qrSvg || !hasPalier1}
                className="w-full h-12 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {downloadSuccess ? (
                  <Check className="w-4 h-4 mr-2" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                {downloadSuccess ? t('imageSaved') : t('saveImage')}
              </Button>
              <p className="text-center text-xs text-gray-500">
                {t('keepPhone')}
              </p>
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 font-medium leading-relaxed">
                  {t('dontPublishQr')}
                </p>
              </div>
            </div>

            {/* Test */}
            {scanUrl && (
              hasPalier1 ? (
                <a
                  href={scanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    fetch('/api/onboarding/status', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ step: 'preview' }),
                    }).catch(() => {});
                  }}
                  className="flex flex-col items-center justify-center w-full py-3 px-4 bg-white border-2 border-indigo-200 hover:border-indigo-400 rounded-xl transition-all hover:shadow-md active:scale-[0.98]"
                >
                  <span className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                    <Play className="w-4 h-4" />
                    {t('testExperience')}
                  </span>
                  <span className="text-[11px] text-gray-400 mt-0.5">{t('testExperienceHint')}</span>
                </a>
              ) : (
                <div className="flex flex-col items-center justify-center w-full py-3 px-4 bg-white border-2 border-gray-200 rounded-xl opacity-50 cursor-not-allowed">
                  <span className="flex items-center gap-2 text-gray-400 font-bold text-sm">
                    <Play className="w-4 h-4" />
                    {t('testExperience')}
                  </span>
                  <span className="text-[11px] text-gray-300 mt-0.5">{t('testExperienceHint')}</span>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SOCIAL KIT */}
      {activeTab === 'social' && (
        <div className="animate-in fade-in duration-300 lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start">
          {/* Left: Preview + Download */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              {t('socialVisual')}
              <div className="flex items-center gap-1 ml-1">
                <span className="w-5 h-5 rounded-md bg-gradient-to-br from-pink-500 via-red-500 to-yellow-400 flex items-center justify-center">
                  <Instagram className="w-3 h-3 text-white" />
                </span>
                <span className="w-5 h-5 rounded-md bg-[#1877F2] flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-white">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </span>
                <span className="w-5 h-5 rounded-md bg-black flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-white">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                </span>
              </div>
            </div>

            {/* Gray container */}
            <div className="relative flex items-center justify-center p-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl">
              <div className="absolute inset-0 m-8 bg-black/10 blur-2xl rounded-2xl transform translate-y-4" />
              <div className="relative">
                <SocialMediaTemplate
                  shopName={merchant.shop_name}
                  primaryColor={merchant.primary_color}
                  secondaryColor={merchant.secondary_color}
                  logoUrl={logoDataUrl || merchant.logo_url || undefined}
                  rewardDescription={merchant.reward_description || t('defaultReward')}
                  stampsRequired={merchant.stamps_required}
                  scale={0.7}
                  tier2Enabled={merchant.tier2_enabled}
                  tier2StampsRequired={merchant.tier2_stamps_required}
                  tier2RewardDescription={merchant.tier2_reward_description}
                  loyaltyMode={merchant.loyalty_mode}
                  cagnottePercent={merchant.cagnotte_percent}
                  cagnotteTier2Percent={merchant.cagnotte_tier2_percent}
                />
              </div>
            </div>

            {/* Download */}
            <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-3">
              {!hasPalier1 && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <p className="text-xs text-amber-700 font-medium">
                    {t('configureTier1')}
                  </p>
                </div>
              )}
              <Button
                onClick={downloadSocialPng}
                disabled={isGenerating || !hasPalier1}
                className="w-full h-12 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-200 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : socialDownloadSuccess ? (
                  <Check className="w-4 h-4 mr-2" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                {socialDownloadSuccess ? t('downloaded') : t('downloadHd')}
              </Button>
            </div>

          </div>

          {/* Right: Captions + Tips + Bio link */}
          <div className="mt-6 lg:mt-0 space-y-4">

            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <Instagram className="w-3.5 h-3.5" />
              {t('captionLabel')}
            </div>

            <div className="space-y-3">
              {captions.map((caption, index) => (
                <div
                  key={index}
                  className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-end mb-2">
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
                          {t('copied')}
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          {t('copyButton')}
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
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('sharingTitle')}</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-pink-50 rounded-xl border border-pink-100">
                  <p className="text-xs font-semibold text-pink-900">{t('tipStory')}</p>
                  <p className="text-[11px] text-pink-600 mt-0.5">{t('tipStoryDesc')}</p>
                </div>
                <div className="p-3 bg-violet-50 rounded-xl border border-violet-100">
                  <p className="text-xs font-semibold text-violet-900">{t('tipBio')}</p>
                  <p className="text-[11px] text-violet-600 mt-0.5">{t('tipBioDesc')}</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-xs font-semibold text-amber-900">{t('tipCheckout')}</p>
                  <p className="text-[11px] text-amber-600 mt-0.5">{t('tipCheckoutDesc')}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-xs font-semibold text-emerald-900">{t('tipWhatsapp')}</p>
                  <p className="text-[11px] text-emerald-600 mt-0.5">{t('tipWhatsappDesc')}</p>
                </div>
              </div>
              <a href="/dashboard/public-page" className="block p-3 bg-indigo-50 rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-colors">
                <p className="text-xs font-semibold text-indigo-700">{t('completePageTitle')}</p>
                <p className="text-[11px] text-indigo-500 mt-0.5">{t('completePageDesc')}</p>
              </a>
            </div>



          </div>
        </div>
      )}

      {/* TAB 3: CARTE NFC */}
      {activeTab === 'nfc' && (
        <div className="animate-in fade-in duration-300 lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start">
          {/* Left: Card image */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <Nfc className="w-3.5 h-3.5" />
              {t('nfcCard')}
            </div>
            <div className="relative flex items-center justify-center p-8 bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl border border-violet-100/50">
              <div className="relative">
                <img
                  src="/images/Carte NFC QARTE .png"
                  alt={t('nfcCard')}
                  className="w-[300px] rounded-2xl shadow-2xl shadow-violet-200/50"
                />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-2 border-violet-300/50 animate-ping" style={{ animationDuration: '2s' }} />
              </div>
            </div>
          </div>

          {/* Right: How it works + CTA */}
          <div className="mt-6 lg:mt-0 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <CreditCard className="w-3.5 h-3.5" />
              {t('nfcHowTitle')}
            </div>

            {/* How it works */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CreditCard className="w-4 h-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t('nfcKeepVisible')}</p>
                    <p className="text-xs text-gray-500">{t('nfcKeepVisibleDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Smartphone className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t('nfcTap')}</p>
                    <p className="text-xs text-gray-500">{t('nfcTapDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Gift className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t('nfcSameProgram')}</p>
                    <p className="text-xs text-gray-500">{t('nfcSameProgramDesc')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
            <a
              href="https://wa.me/33612345678?text=Bonjour%2C%20je%20suis%20int%C3%A9ress%C3%A9(e)%20par%20la%20carte%20NFC%20Qarte"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full h-12 bg-[#25D366] hover:bg-[#1ebe5b] text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all text-sm"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              {t('nfcWhatsapp')}
            </a>
          </div>
          </div>
        </div>
      )}

      {/* Hidden high-res template for social kit export — only rendered when needed */}
      {activeTab === 'social' && (
        <div className="fixed left-[-9999px] top-0">
          <SocialMediaTemplate
            ref={socialExportRef}
            shopName={merchant.shop_name}
            primaryColor={merchant.primary_color}
            secondaryColor={merchant.secondary_color}
            logoUrl={logoDataUrl || merchant.logo_url || undefined}
            rewardDescription={merchant.reward_description || t('defaultReward')}
            stampsRequired={merchant.stamps_required}
            scale={2.7}
            tier2Enabled={merchant.tier2_enabled}
            tier2StampsRequired={merchant.tier2_stamps_required}
            tier2RewardDescription={merchant.tier2_reward_description}
            loyaltyMode={merchant.loyalty_mode}
            cagnottePercent={merchant.cagnotte_percent}
            cagnotteTier2Percent={merchant.cagnotte_tier2_percent}
          />
        </div>
      )}

      {/* Post-download modal */}
      {showPostDownloadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPostDownloadModal(false)} />
          <div className="relative w-full max-w-xs bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-center">
            <button
              onClick={() => setShowPostDownloadModal(false)}
              className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
            <div className="px-6 pt-8 pb-6">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-200">
                <Users className="w-6 h-6 text-white" />
              </div>
              <p className="text-lg font-black text-gray-900">{t('postDownloadTitle')}</p>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                {t('postDownloadDesc')}
              </p>
              <a
                href="/dashboard/public-page"
                onClick={() => setShowPostDownloadModal(false)}
                className="mt-5 w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-indigo-200 inline-block"
              >
                {t('postDownloadCta')}
              </a>
              <button
                onClick={() => setShowPostDownloadModal(false)}
                className="mt-2 text-xs text-gray-300 hover:text-gray-500 transition-colors block mx-auto"
              >
                {t('postDownloadLater')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
