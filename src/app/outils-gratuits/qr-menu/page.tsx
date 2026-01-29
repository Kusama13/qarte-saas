'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import {
  QrCode,
  Download,
  Mail,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Link as LinkIcon,
  Upload,
  Palette,
  Image as ImageIcon,
  X,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { Header } from '@/components/shared/Header';
import { generateQRCode, validateEmail } from '@/lib/utils';
import { toPng } from 'html-to-image';
import { QRCardTemplate } from '@/components/marketing/QRCardTemplate';

type Step = 'input' | 'result' | 'capture' | 'success';

export default function QRMenuPage() {
  const [step, setStep] = useState<Step>('input');
  const [menuUrl, setMenuUrl] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [secondaryColor, setSecondaryColor] = useState('#8b5cf6');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const qrCardRef = useRef<HTMLDivElement>(null);
  const qrCardExportRef = useRef<HTMLDivElement>(null);

  // Handle logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Veuillez selectionner une image');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('L\'image ne doit pas depasser 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setLogoUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Generate QR Code
  const handleGenerateQR = async () => {
    if (!menuUrl) return;

    setIsGenerating(true);
    try {
      let url = menuUrl.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      const qrCode = await generateQRCode(url);
      setQrCodeDataUrl(qrCode);
      setStep('result');
    } catch (error) {
      console.error('Error generating QR:', error);
      alert('Erreur lors de la generation du QR code');
    } finally {
      setIsGenerating(false);
    }
  };

  // Download QR Code as designed PNG
  const downloadQRCode = async () => {
    if (!qrCardExportRef.current) return;

    setIsGenerating(true);
    try {
      const dataUrl = await toPng(qrCardExportRef.current, {
        pixelRatio: 3,
        cacheBust: true,
      });

      const link = document.createElement('a');
      link.download = `qr-menu-${businessName || 'restaurant'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error generating PNG:', error);
      const link = document.createElement('a');
      link.download = `qr-menu-${businessName || 'restaurant'}.png`;
      link.href = qrCodeDataUrl;
      link.click();
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle email submission
  const handleEmailSubmit = async () => {
    if (!validateEmail(email)) {
      setEmailError('Veuillez entrer une adresse email valide');
      return;
    }

    setEmailError('');
    setIsSubmitting(true);

    try {
      await fetch('/api/leads/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          source: 'qr-menu',
          generatedValue: menuUrl,
          businessName: businessName || undefined,
        }),
      });

      await fetch('/api/emails/qrcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          menuUrl,
          businessName: businessName || undefined,
        }),
      });

      setStep('success');
    } catch (error) {
      console.error('Error saving lead:', error);
      setStep('success');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setStep('input');
    setMenuUrl('');
    setQrCodeDataUrl('');
    setEmail('');
    setEmailError('');
    setBusinessName('');
    setLogoUrl('');
    setPrimaryColor('#6366f1');
    setSecondaryColor('#8b5cf6');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Header minimal />

      <main className="px-4 py-12 mx-auto max-w-4xl pt-24 md:pt-28">
        {/* Example Preview - Only show on input step */}
        {step === 'input' && (
          <div className="mb-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 font-medium text-sm">
                <Sparkles className="w-4 h-4" />
                <span>100% gratuit</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Generateur QR Code Menu</h1>
              <p className="text-gray-600">Creez un QR code design avec votre logo - pas juste un QR basique !</p>
            </div>

            {/* Premium Comparison Section */}
            <div className="grid md:grid-cols-2 gap-8 mb-12 items-stretch">
              {/* Competitors - Dull/Basic */}
              <div className="bg-slate-50/50 rounded-3xl p-8 border border-slate-200 flex flex-col items-center justify-center grayscale opacity-60 transition-all duration-300">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-6">Standards du marche</p>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="w-32 h-32 bg-slate-100 rounded-md flex items-center justify-center border-2 border-dashed border-slate-200">
                    <QrCode className="w-16 h-16 text-slate-300" />
                  </div>
                </div>
                <p className="text-sm text-slate-400 text-center mt-6 italic">Generique, statique et impersonnel</p>
              </div>

              {/* Qarte - Premium/Striking */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 animate-pulse-slow"></div>
                <div className="relative bg-white rounded-[2rem] p-8 border border-indigo-100 shadow-xl hover-glow hover-lift transition-all duration-500 overflow-hidden">
                  <div className="absolute top-0 right-0 p-4">
                    <div className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded-full uppercase tracking-tighter shadow-lg shadow-indigo-200">
                      Signature Qarte
                    </div>
                  </div>

                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-6">Notre Experience</p>

                  <div className="flex justify-center mb-6">
                    <div className="relative w-44 h-56 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white transition-transform duration-500 group-hover:scale-105" style={{ background: 'linear-gradient(165deg, #4f46e5 0%, #7c3aed 100%)' }}>
                      {/* Subtle Glass Pattern */}
                      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.8),transparent)]"></div>

                      {/* Premium UI Preview */}
                      <div className="absolute inset-0 flex flex-col items-center justify-between py-5 px-4">
                        <div className="text-center animate-fade-in">
                          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-2 shadow-inner border border-white/30">
                            <span className="text-white font-black text-sm">LB</span>
                          </div>
                          <p className="text-white font-extrabold text-sm tracking-tight">Le Petit Bistro</p>
                          <div className="h-0.5 w-6 bg-white/40 mx-auto mt-1 rounded-full"></div>
                        </div>

                        <div className="relative group/qr">
                          <div className="absolute -inset-2 bg-white/20 blur-xl rounded-full scale-0 group-hover/qr:scale-100 transition-transform duration-700"></div>
                          <div className="relative bg-white rounded-2xl p-2.5 shadow-2xl shadow-indigo-900/40">
                            <QrCode className="w-16 h-16 text-indigo-950" />
                          </div>
                        </div>

                        <div className="space-y-1 text-center">
                          <p className="text-indigo-100 font-bold text-[10px] tracking-wide">SCANNEZ POUR COMMANDER</p>
                          <div className="flex gap-1 justify-center">
                            <div className="w-1 h-1 rounded-full bg-indigo-300"></div>
                            <div className="w-1 h-1 rounded-full bg-indigo-300"></div>
                            <div className="w-1 h-1 rounded-full bg-indigo-300"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-center">
                    <p className="text-lg font-bold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">Design Haute Couture</p>
                    <p className="text-sm text-slate-500 font-medium">Identite visuelle, logo integre et finitions premium</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 max-w-2xl mx-auto">

          {/* Input Step */}
          {step === 'input' && (
            <div className="space-y-6">

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom de votre etablissement (optionnel)
                </label>
                <Input
                  placeholder="Ex: Le Petit Bistro"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  URL de votre menu *
                </label>
                <Input
                  placeholder="Ex: votresite.com/menu ou lien Google Drive"
                  value={menuUrl}
                  onChange={(e) => setMenuUrl(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Accepte: lien vers votre site, Google Drive, Dropbox, PDF en ligne...
                </p>
              </div>

              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Upload className="w-4 h-4 inline mr-1" />
                  Logo (optionnel)
                </label>
                {logoUrl ? (
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-gray-200">
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    </div>
                    <button
                      onClick={() => setLogoUrl('')}
                      className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                      Supprimer
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors">
                    <div className="text-center">
                      <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                      <span className="text-sm text-gray-500">Cliquez pour ajouter</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Color Pickers */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Palette className="w-4 h-4 inline mr-1" />
                  Couleurs du design
                </label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Principale</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200"
                      />
                      <Input
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="flex-1 font-mono text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Secondaire</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200"
                      />
                      <Input
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="flex-1 font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Live Preview */}
                <div className="mt-4">
                  <p className="text-xs text-gray-500 mb-2">Apercu :</p>
                  <div className="flex justify-center">
                    <div
                      className="w-40 h-52 rounded-xl relative overflow-hidden shadow-lg"
                      style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` }}
                    >
                      <div className="absolute inset-0 flex flex-col items-center justify-between p-3">
                        {/* Logo & Name */}
                        <div className="text-center">
                          {logoUrl ? (
                            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/30 mx-auto mb-1">
                              <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30 mx-auto mb-1">
                              <span className="text-white font-bold text-sm">
                                {businessName?.[0]?.toUpperCase() || 'Q'}
                              </span>
                            </div>
                          )}
                          <p className="text-white font-bold text-xs leading-tight">
                            {businessName || 'Mon Restaurant'}
                          </p>
                        </div>

                        {/* QR Code */}
                        <div className="bg-white/90 rounded-lg p-2">
                          <QrCode className="w-14 h-14 text-gray-800" />
                        </div>

                        {/* Scan text */}
                        <p className="text-white/80 text-[10px] font-medium">Scannez-moi !</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleGenerateQR}
                disabled={!menuUrl || isGenerating}
                className="w-full h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-lg rounded-xl"
              >
                {isGenerating ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <QrCode className="w-5 h-5 mr-2" />
                )}
                Generer mon QR Code
              </Button>

              {/* Qarte CTA */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <a href="https://getqarte.com" className="flex items-center gap-3 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 hover:border-indigo-200 transition-colors">
                  <TrendingUp className="w-8 h-8 text-indigo-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">Augmentez votre CA avec Qarte</p>
                    <p className="text-xs text-gray-600">Fidelisez vos clients et boostez leur frequence de visite</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-indigo-600" />
                </a>
              </div>
            </div>
          )}

          {/* Result Step */}
          {step === 'result' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Votre QR Code est pret !</h2>
                <p className="text-gray-600">Scannez-le pour verifier qu&apos;il fonctionne</p>
              </div>

              <div className="flex justify-center">
                <div className="relative transform hover:scale-[1.02] transition-transform">
                  <QRCardTemplate
                    ref={qrCardRef}
                    businessName={businessName || 'Mon Restaurant'}
                    primaryColor={primaryColor}
                    secondaryColor={secondaryColor}
                    logoUrl={logoUrl || undefined}
                    qrCodeUrl={qrCodeDataUrl}
                    menuUrl={menuUrl}
                    scale={0.7}
                  />
                </div>
              </div>

              <div className="bg-indigo-50 rounded-xl p-4">
                <p className="text-sm text-indigo-700 font-medium flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  {menuUrl}
                </p>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <p className="text-center text-gray-700 font-medium mb-2">
                  Recevez les deux formats par email
                </p>
                <p className="text-center text-gray-500 text-sm mb-4">
                  QR code simple + QR code design avec logo
                </p>
                <Button
                  onClick={() => setStep('capture')}
                  className="w-full h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-lg rounded-xl"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Telecharger gratuitement
                </Button>
              </div>
            </div>
          )}

          {/* Email Capture Step */}
          {step === 'capture' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Derniere etape</h2>
                <p className="text-gray-600 mt-2">
                  Entrez votre email pour telecharger votre QR code
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Votre adresse email
                </label>
                <Input
                  type="email"
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError('');
                  }}
                  className={emailError ? 'border-red-500' : ''}
                />
                {emailError && (
                  <p className="text-sm text-red-600 mt-1">{emailError}</p>
                )}
              </div>

              <Button
                onClick={handleEmailSubmit}
                disabled={!email || isSubmitting}
                className="w-full h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-lg rounded-xl"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                )}
                Confirmer
              </Button>

              <p className="text-xs text-center text-gray-500">
                En confirmant, vous acceptez de recevoir des conseils et actualites de Qarte.
                Desinscription possible a tout moment.
              </p>
            </div>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">C&apos;est fait !</h2>
                <p className="text-gray-600 mt-2">
                  Telechargez vos deux QR codes
                </p>
              </div>

              {/* Two download options */}
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">QR Code Simple</p>
                      <p className="text-sm text-gray-500">Format standard</p>
                    </div>
                    <Button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.download = `qr-simple-${businessName || 'menu'}.png`;
                        link.href = qrCodeDataUrl;
                        link.click();
                      }}
                      variant="outline"
                      className="h-10"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Telecharger
                    </Button>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border-2 border-indigo-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">QR Code Design</p>
                      <p className="text-sm text-indigo-600">Avec logo et couleurs</p>
                    </div>
                    <Button
                      onClick={downloadQRCode}
                      disabled={isGenerating}
                      className="h-10 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                    >
                      {isGenerating ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      Telecharger
                    </Button>
                  </div>
                </div>
              </div>

              {/* Loyalty Program CTA */}
              <div className="mt-8 pt-8 border-t border-gray-100">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        Augmentez votre chiffre d&apos;affaires
                      </h3>
                      <p className="text-gray-600 text-sm mb-2">
                        Un client fidele depense en moyenne <span className="font-bold text-indigo-600">67% de plus</span> qu&apos;un nouveau client.
                      </p>
                      <p className="text-gray-600 text-sm mb-4">
                        Avec Qarte, fidelisez vos clients avec des cartes digitales. Plus de tampons perdus,
                        plus de cartes en papier. Tout se fait via QR code !
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <a href="https://getqarte.com">
                          <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold">
                            Decouvrir Qarte
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </a>
                      </div>
                      <p className="text-xs text-gray-500 mt-3">
                        15 jours d&apos;essai gratuit, sans engagement
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={resetForm}
                className="w-full text-center text-gray-500 hover:text-gray-700 font-medium py-2"
              >
                Creer un autre QR code
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Hidden high-res QR Card for PNG export */}
      {qrCodeDataUrl && (
        <div className="fixed left-[-9999px] top-0">
          <QRCardTemplate
            ref={qrCardExportRef}
            businessName={businessName || 'Mon Restaurant'}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            logoUrl={logoUrl || undefined}
            qrCodeUrl={qrCodeDataUrl}
            menuUrl={menuUrl}
            scale={1}
          />
        </div>
      )}
    </div>
  );
}
