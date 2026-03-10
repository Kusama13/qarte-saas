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
  AlertTriangle,
  Gift,
  Cake,
  Users,
  Bell,
  ChevronDown,
  Link2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { generateQRCodeSVG, getScanUrl } from '@/lib/utils';
import { SocialMediaTemplate } from '@/components/marketing/SocialMediaTemplate';
import { toPng } from 'html-to-image';
import { useMerchant } from '@/contexts/MerchantContext';

type Tab = 'qr' | 'social';

export default function QRDownloadPage() {
  const { merchant, loading } = useMerchant();
  const [activeTab, setActiveTab] = useState<Tab>('qr');
  const [qrSvg, setQrSvg] = useState<string>('');
  const [scanUrl, setScanUrl] = useState<string>('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [socialDownloadSuccess, setSocialDownloadSuccess] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState<number | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [howOpen, setHowOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [showPostDownloadModal, setShowPostDownloadModal] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);
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

      // Show pros modal after social download (one-shot, delayed)
      const SOCIAL_PROS_KEY = 'qarte_social_pros_seen';
      if (!localStorage.getItem(SOCIAL_PROS_KEY)) {
        localStorage.setItem(SOCIAL_PROS_KEY, '1');
        setTimeout(() => setShowSocialModal(true), 1200);
      }
    } catch (error) {
      console.error('Error generating PNG:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyProgrammeLink = async () => {
    const url = `https://getqarte.com/p/${merchant?.slug}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch { /* noop */ }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
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
      label: 'Simple et efficace',
      icon: '✨',
      text: captionText,
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

      {/* Comment ça marche + Allez plus loin — collapsible (QR tab only) */}
      {activeTab === 'qr' && <div className="mb-6 grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <button type="button" onClick={() => setHowOpen(!howOpen)} className="w-full flex items-center justify-between p-4 text-left">
            <h3 className="text-sm font-bold text-gray-900">Comment &ccedil;a marche ?</h3>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${howOpen ? 'rotate-180' : ''}`} />
          </button>
          <div className="grid transition-all duration-200" style={{ gridTemplateRows: howOpen ? '1fr' : '0fr' }}>
            <div className="overflow-hidden">
              <div className="px-4 pb-4 space-y-3" style={{ opacity: howOpen ? 1 : 0, transition: 'opacity 200ms' }}>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <QrCode className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">QR code dans votre t&eacute;l&eacute;phone</p>
                    <p className="text-xs text-gray-500">Vos clients scannent votre QR code &agrave; chaque passage pour cumuler des points.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Gift className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">R&eacute;compense automatique</p>
                    <p className="text-xs text-gray-500">Une fois le nombre de passages atteint, le client re&ccedil;oit sa r&eacute;compense directement sur sa carte.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Smartphone className="w-4 h-4 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Sans appli, 100% mobile</p>
                    <p className="text-xs text-gray-500">Aucune application &agrave; installer. La carte s&apos;affiche dans le navigateur et peut s&apos;ajouter &agrave; l&apos;&eacute;cran d&apos;accueil.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <button type="button" onClick={() => setMoreOpen(!moreOpen)} className="w-full flex items-center justify-between p-4 text-left">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Allez plus loin</h3>
              <p className="text-xs text-gray-500 mt-0.5">Les m&ecirc;mes outils que les grandes enseignes.</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${moreOpen ? 'rotate-180' : ''}`} />
          </button>
          <div className="grid transition-all duration-200" style={{ gridTemplateRows: moreOpen ? '1fr' : '0fr' }}>
            <div className="overflow-hidden">
              <div className="px-4 pb-4 space-y-3" style={{ opacity: moreOpen ? 1 : 0, transition: 'opacity 200ms' }}>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Cake className="w-4 h-4 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Cadeaux d&apos;anniversaire</p>
                    <p className="text-xs text-gray-500">Offrez automatiquement un cadeau &agrave; vos clients pour leur anniversaire.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Users className="w-4 h-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Parrainage client</p>
                    <p className="text-xs text-gray-500">Vos clients existants ram&egrave;nent de nouveaux clients, r&eacute;compens&eacute;s des deux c&ocirc;t&eacute;s.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bell className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Notifications automatiques</p>
                    <p className="text-xs text-gray-500">Relancez les clients inactifs et informez-les de vos offres sans rien faire.</p>
                  </div>
                </div>
                <p className="mt-1 text-[11px] text-gray-400 text-center">Activez ces fonctionnalit&eacute;s depuis votre tableau de bord.</p>
              </div>
            </div>
          </div>
        </div>
      </div>}

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
              : 'text-purple-600 bg-purple-50 hover:bg-purple-100 ring-1 ring-purple-200'
          }`}
        >
          <Image className="w-4 h-4 text-purple-500" />
          Kit réseaux
          {activeTab !== 'social' && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-purple-600 text-white rounded-full">NEW</span>
          )}
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
                    clipPath: 'inset(0px round 16px)',
                  }}
                >
                  {/* Decorative circles */}
                  <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-white/10" />
                  <div className="absolute -bottom-6 -left-6 w-16 h-16 rounded-full bg-white/[0.07]" />
                  <div className="absolute top-1/2 -right-4 w-10 h-10 rounded-full bg-white/[0.05]" />

                  <div className="relative h-full px-5 py-4 flex flex-col items-center text-center">
                    {/* Top: Logo + Name — fixed size */}
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
                        Programme de fidélité
                      </p>
                    </div>

                    {/* Center: CTA + QR + Scannez-moi — takes remaining space */}
                    <div className="flex-1 flex flex-col items-center justify-center min-h-0">
                      <p className="text-[11px] text-white/70 font-medium mb-2">
                        Ajoutez votre carte en 15 secondes
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
                        Scannez-moi !
                      </p>
                    </div>

                    {/* Bottom: Branding — fixed size */}
                    <div className="flex-shrink-0 px-3 py-1 rounded-full bg-white/90">
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
              {!hasPalier1 && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <p className="text-xs text-amber-700 font-medium">
                    Configurez votre programme de fidélité (palier 1) avant de télécharger.
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
                {downloadSuccess ? 'Enregistré !' : 'Enregistrer l\'image'}
              </Button>
              <p className="text-center text-xs text-gray-500">
                Gardez-le sur votre t&eacute;l&eacute;phone et montrez-le &agrave; vos client(e)s au moment de payer
              </p>
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 font-medium leading-relaxed">
                  Ne publiez pas votre QR code sur les r&eacute;seaux sociaux — vos clients doivent le scanner <span className="font-bold">sur place uniquement</span>. Pour vos r&eacute;seaux, utilisez l&apos;onglet Kit r&eacute;seaux !
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
                    Tester l&apos;exp&eacute;rience client
                  </span>
                  <span className="text-[11px] text-gray-400 mt-0.5">Vivez le parcours de vos clients lors du scan</span>
                </a>
              ) : (
                <div className="flex flex-col items-center justify-center w-full py-3 px-4 bg-white border-2 border-gray-200 rounded-xl opacity-50 cursor-not-allowed">
                  <span className="flex items-center gap-2 text-gray-400 font-bold text-sm">
                    <Play className="w-4 h-4" />
                    Tester l&apos;exp&eacute;rience client
                  </span>
                  <span className="text-[11px] text-gray-300 mt-0.5">Vivez le parcours de vos clients lors du scan</span>
                </div>
              )
            )}
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
                  rewardDescription={merchant.reward_description || 'Récompense fidélité'}
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
                    Configurez votre programme de fidélité (palier 1) avant de télécharger.
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
                {socialDownloadSuccess ? 'Téléchargé !' : 'Télécharger l\'image HD'}
              </Button>
            </div>

          </div>

          {/* Right: Captions + Tips + Bio link */}
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



            {/* LIEN BIO — masqué temporairement
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <Link2 className="w-3.5 h-3.5" />
              Lien en bio
            </div>
            <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-sm font-bold text-gray-900 mb-0.5">Partagez votre programme en bio</p>
              <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                Ajoutez ce lien dans votre bio Instagram, TikTok ou Facebook pour que vos abonnés voient votre programme de fidélité.
              </p>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-[13px] text-gray-700 font-mono flex-1 truncate">
                  getqarte.com/p/{merchant.slug}
                </p>
                <button
                  onClick={copyProgrammeLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex-shrink-0"
                  style={
                    copiedLink
                      ? { backgroundColor: '#d1fae5', color: '#059669' }
                      : { backgroundColor: '#f3f4f6', color: '#6b7280' }
                  }
                >
                  {copiedLink ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedLink ? 'Copié !' : 'Copier'}
                </button>
              </div>
            </div>
            */}
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
            rewardDescription={merchant.reward_description || 'Récompense fidélité'}
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

      {/* Social pros modal */}
      {showSocialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowSocialModal(false)} />
          <div className="relative w-full max-w-xs bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-center">
            <button
              onClick={() => setShowSocialModal(false)}
              className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
            <div className="px-6 pt-8 pb-6">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-200">
                <Users className="w-6 h-6 text-white" />
              </div>
              <p className="text-lg font-black text-gray-900">Attirez de nouveaux clients</p>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                Plus votre page est compl&egrave;te (photos, adresse, r&eacute;seaux), plus elle remonte sur Google et attire de nouveaux clients.
              </p>
              <a
                href={`/p/${merchant.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowSocialModal(false)}
                className="mt-5 w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-indigo-200 inline-block"
              >
                Voir ma page pro
              </a>
              <button
                onClick={() => setShowSocialModal(false)}
                className="mt-2 text-xs text-gray-300 hover:text-gray-500 transition-colors block mx-auto"
              >
                Plus tard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post-download modal */}
      {showPostDownloadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPostDownloadModal(false)} />
          <div className="relative w-full max-w-xs bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-center">
            <button
              onClick={() => setShowPostDownloadModal(false)}
              className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-white/70" />
            </button>
            <div className="px-6 pt-8 pb-6">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-white/15 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <p className="text-lg font-black text-white">Annoncez la nouvelle !</p>
              <p className="mt-2 text-sm text-white/70 leading-relaxed">
                Vos followers ne savent pas encore que vous avez un programme de fid&eacute;lit&eacute;. Partagez-le sur vos r&eacute;seaux en un clic.
              </p>
              <button
                onClick={() => {
                  setShowPostDownloadModal(false);
                  setActiveTab('social');
                }}
                className="mt-5 w-full py-3 bg-white text-violet-700 font-bold text-sm rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all shadow-lg"
              >
                Voir le kit r&eacute;seaux sociaux
              </button>
              <button
                onClick={() => setShowPostDownloadModal(false)}
                className="mt-2 text-xs text-white/40 hover:text-white/60 transition-colors"
              >
                Plus tard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
