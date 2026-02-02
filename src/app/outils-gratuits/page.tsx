'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  QrCode,
  Star,
  Download,
  Mail,
  ArrowRight,
  CreditCard,
  CheckCircle2,
  Sparkles,
  Gift,
  Copy,
  ExternalLink,
  Loader2,
  Menu,
  Link as LinkIcon,
} from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { generateQRCode, validateEmail } from '@/lib/utils';

type ToolType = 'qr-menu' | 'google-review';
type Step = 'input' | 'result' | 'capture' | 'success';

interface LeadData {
  email: string;
  source: ToolType;
  generatedValue: string;
  businessName?: string;
}

export default function FreeToolsPage() {
  // Tool states
  const [activeTool, setActiveTool] = useState<ToolType | null>(null);
  const [step, setStep] = useState<Step>('input');

  // QR Menu states
  const [menuUrl, setMenuUrl] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [businessName, setBusinessName] = useState('');

  // Google Review states
  const [placeId, setPlaceId] = useState('');
  const [googleReviewLink, setGoogleReviewLink] = useState('');

  // Lead capture
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate QR Code for menu
  const handleGenerateQR = async () => {
    if (!menuUrl) return;

    setIsGenerating(true);
    try {
      // Ensure URL has protocol
      let url = menuUrl.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      const qrCode = await generateQRCode(url);
      setQrCodeDataUrl(qrCode);
      setStep('result');
    } catch (error) {
      console.error('Error generating QR:', error);
      alert('Erreur lors de la génération du QR code');
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate Google Review Link
  const handleGenerateReviewLink = () => {
    if (!placeId) return;

    setIsGenerating(true);

    // Google review link format
    const reviewLink = `https://search.google.com/local/writereview?placeid=${placeId.trim()}`;
    setGoogleReviewLink(reviewLink);
    setStep('result');
    setIsGenerating(false);
  };

  // Handle email capture and lead submission
  const handleEmailSubmit = async () => {
    if (!validateEmail(email)) {
      setEmailError('Veuillez entrer une adresse email valide');
      return;
    }

    setEmailError('');
    setIsSubmitting(true);

    try {
      // Save lead to database
      const leadData: LeadData = {
        email: email.trim().toLowerCase(),
        source: activeTool!,
        generatedValue: activeTool === 'qr-menu' ? menuUrl : googleReviewLink,
        businessName: businessName || undefined,
      };

      await fetch('/api/leads/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData),
      });

      // Send email with QR code for qr-menu tool
      if (activeTool === 'qr-menu') {
        await fetch('/api/emails/qrcode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            menuUrl,
            businessName: businessName || undefined,
          }),
        });
      }

      setStep('success');
    } catch (error) {
      console.error('Error saving lead:', error);
      // Still show success to user
      setStep('success');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Download QR Code
  const downloadQRCode = () => {
    if (!qrCodeDataUrl) return;

    const link = document.createElement('a');
    link.download = `qr-menu-${businessName || 'restaurant'}.png`;
    link.href = qrCodeDataUrl;
    link.click();
  };

  // Copy link to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Reset tool
  const resetTool = () => {
    setStep('input');
    setMenuUrl('');
    setQrCodeDataUrl('');
    setPlaceId('');
    setGoogleReviewLink('');
    setEmail('');
    setEmailError('');
    setBusinessName('');
  };

  // Tool card component
  const ToolCard = ({
    type,
    icon: Icon,
    title,
    description,
    color
  }: {
    type: ToolType;
    icon: React.ElementType;
    title: string;
    description: string;
    color: string;
  }) => (
    <button
      onClick={() => {
        setActiveTool(type);
        resetTool();
      }}
      className={`relative w-full p-8 rounded-3xl border-2 transition-all duration-300 text-left group hover:shadow-xl ${
        activeTool === type
          ? `border-${color}-500 bg-${color}-50 shadow-lg`
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${
        type === 'qr-menu'
          ? 'from-indigo-500 to-purple-600'
          : 'from-amber-500 to-orange-600'
      } flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
        <Icon className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
      {activeTool === type && (
        <div className="absolute top-4 right-4">
          <CheckCircle2 className="w-6 h-6 text-green-500" />
        </div>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-amber-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-4 mx-auto max-w-7xl">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Qarte</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-gray-600 hover:text-gray-900 font-medium hidden sm:block">
              Tarifs
            </Link>
            <Link href="/auth/merchant">
              <Button variant="outline">Se connecter</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="px-4 py-16 mx-auto max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 font-medium">
            <Sparkles className="w-4 h-4" />
            <span>Outils 100% gratuits</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Outils gratuits pour<br />
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              votre commerce
            </span>
          </h1>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Generez un QR code pour votre menu ou obtenez votre lien d&apos;avis Google en quelques secondes.
          </p>
        </div>

        {/* Tool Selection */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <ToolCard
            type="qr-menu"
            icon={QrCode}
            title="QR Code Menu"
            description="Creez un QR code pour que vos clients accedent a votre menu en un scan."
            color="indigo"
          />
          <ToolCard
            type="google-review"
            icon={Star}
            title="Lien Avis Google"
            description="Obtenez le lien direct pour que vos clients laissent un avis sur Google."
            color="amber"
          />
        </div>

        {/* Active Tool Interface */}
        {activeTool && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">

              {/* QR Menu Tool */}
              {activeTool === 'qr-menu' && (
                <>
                  {step === 'input' && (
                    <div className="space-y-6">
                      <div className="text-center mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                          <QrCode className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Generateur QR Code Menu</h2>
                        <p className="text-gray-600 mt-2">Entrez l&apos;URL de votre menu pour generer un QR code</p>
                      </div>

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
                    </div>
                  )}

                  {step === 'result' && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Votre QR Code est pret !</h2>
                        <p className="text-gray-600">Scannez-le pour verifier qu&apos;il fonctionne</p>
                      </div>

                      <div className="flex justify-center">
                        <div className="p-4 bg-white rounded-2xl shadow-lg border-2 border-indigo-100">
                          <img
                            src={qrCodeDataUrl}
                            alt="QR Code Menu"
                            className="w-64 h-64"
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
                        <p className="text-center text-gray-700 font-medium mb-4">
                          Entrez votre email pour telecharger le QR code en haute qualite
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
                </>
              )}

              {/* Google Review Tool */}
              {activeTool === 'google-review' && (
                <>
                  {step === 'input' && (
                    <div className="space-y-6">
                      <div className="text-center mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-4">
                          <Star className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Generateur Lien Avis Google</h2>
                        <p className="text-gray-600 mt-2">Obtenez le lien direct pour recevoir des avis</p>
                      </div>

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
                          Place ID Google *
                        </label>
                        <Input
                          placeholder="Ex: ChIJN1t_tDeuEmsRUsoyG83frY4"
                          value={placeId}
                          onChange={(e) => setPlaceId(e.target.value)}
                        />
                      </div>

                      <div className="bg-amber-50 rounded-xl p-4">
                        <p className="text-sm font-semibold text-amber-800 mb-2">Comment trouver votre Place ID ?</p>
                        <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
                          <li>Allez sur <a href="https://developers.google.com/maps/documentation/places/web-service/place-id" target="_blank" rel="noopener noreferrer" className="underline">Google Place ID Finder</a></li>
                          <li>Recherchez votre etablissement</li>
                          <li>Copiez le Place ID affiche</li>
                        </ol>
                      </div>

                      <Button
                        onClick={handleGenerateReviewLink}
                        disabled={!placeId || isGenerating}
                        className="w-full h-14 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-lg rounded-xl"
                      >
                        {isGenerating ? (
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        ) : (
                          <Star className="w-5 h-5 mr-2" />
                        )}
                        Generer mon lien
                      </Button>
                    </div>
                  )}

                  {step === 'result' && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                          <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Votre lien est pret !</h2>
                        <p className="text-gray-600">Partagez-le avec vos clients pour recevoir des avis</p>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={googleReviewLink}
                            className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm font-mono text-gray-700"
                          />
                          <Button
                            onClick={() => copyToClipboard(googleReviewLink)}
                            variant="outline"
                            className="px-4"
                          >
                            {copied ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                          </Button>
                        </div>
                      </div>

                      <Button
                        onClick={() => window.open(googleReviewLink, '_blank')}
                        variant="outline"
                        className="w-full"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Tester le lien
                      </Button>

                      <div className="border-t border-gray-100 pt-6">
                        <p className="text-center text-gray-700 font-medium mb-4">
                          Entrez votre email pour recevoir le lien et des conseils
                        </p>
                        <Button
                          onClick={() => setStep('capture')}
                          className="w-full h-14 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-lg rounded-xl"
                        >
                          <Mail className="w-5 h-5 mr-2" />
                          Recevoir par email
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Email Capture Step (shared) */}
              {step === 'capture' && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Derniere etape</h2>
                    <p className="text-gray-600 mt-2">
                      Entrez votre email pour {activeTool === 'qr-menu' ? 'telecharger' : 'recevoir'} votre {activeTool === 'qr-menu' ? 'QR code' : 'lien'}
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
                    className={`w-full h-14 text-white font-bold text-lg rounded-xl ${
                      activeTool === 'qr-menu'
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                        : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700'
                    }`}
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

              {/* Success Step (shared) */}
              {step === 'success' && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">C&apos;est fait !</h2>
                    <p className="text-gray-600 mt-2">
                      {activeTool === 'qr-menu'
                        ? 'Votre QR code est pret a etre telecharge'
                        : 'Votre lien a ete copie'
                      }
                    </p>
                  </div>

                  {activeTool === 'qr-menu' && (
                    <Button
                      onClick={downloadQRCode}
                      className="w-full h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-lg rounded-xl"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Telecharger le QR Code
                    </Button>
                  )}

                  {activeTool === 'google-review' && (
                    <Button
                      onClick={() => copyToClipboard(googleReviewLink)}
                      className="w-full h-14 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-lg rounded-xl"
                    >
                      {copied ? <CheckCircle2 className="w-5 h-5 mr-2" /> : <Copy className="w-5 h-5 mr-2" />}
                      {copied ? 'Copie !' : 'Copier le lien'}
                    </Button>
                  )}

                  {/* Loyalty Program CTA */}
                  <div className="mt-8 pt-8 border-t border-gray-100">
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <Gift className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-1">
                            Avez-vous pense a mettre en place un programme de fidelite ?
                          </h3>
                          <p className="text-gray-600 text-sm mb-4">
                            Fidelisez vos clients avec des cartes digitales. Plus de tampons perdus,
                            plus de cartes en papier. Tout se fait via QR code !
                          </p>
                          <div className="flex flex-wrap gap-3">
                            <Link href="/auth/merchant">
                              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold">
                                Essayer gratuitement
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </Button>
                            </Link>
                            <Link href="/pricing">
                              <Button variant="outline">
                                Voir les tarifs
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setActiveTool(null);
                      resetTool();
                    }}
                    className="w-full text-center text-gray-500 hover:text-gray-700 font-medium py-2"
                  >
                    Utiliser un autre outil
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Benefits Section */}
        {!activeTool && (
          <div className="mt-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">Pourquoi ces outils ?</h2>
              <p className="text-gray-600 mt-2">Simplifiez votre quotidien de commercant</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                  <Menu className="w-7 h-7 text-indigo-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Menu accessible</h3>
                <p className="text-gray-600">
                  Vos clients scannent le QR code et accedent instantanement a votre menu sur leur telephone.
                </p>
              </div>

              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
                  <Star className="w-7 h-7 text-amber-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Plus d&apos;avis</h3>
                <p className="text-gray-600">
                  Un lien direct simplifie la demarche. Vos clients satisfaits laissent plus facilement un avis.
                </p>
              </div>

              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">100% gratuit</h3>
                <p className="text-gray-600">
                  Pas de compte requis, pas de frais caches. Utilisez ces outils autant que vous le souhaitez.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Final CTA */}
        <div className="mt-20 text-center">
          <div className="inline-block bg-white rounded-3xl shadow-xl p-10 border border-gray-100 max-w-2xl">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-6">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Passez au niveau superieur avec Qarte
            </h2>
            <p className="text-gray-600 mb-6">
              Digitalisez votre carte de fidelite et fidelisez vos clients efficacement.
              Essai gratuit de 14 jours, sans engagement.
            </p>
            <Link href="/auth/merchant">
              <Button className="h-14 px-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-lg rounded-xl">
                Commencer gratuitement
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <p className="text-sm text-gray-500 mt-4">
              A partir de 19EUR/mois apres l&apos;essai
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-100 mt-20">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-900">Qarte</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <Link href="/mentions-legales" className="hover:text-gray-900">Mentions legales</Link>
              <Link href="/politique-confidentialite" className="hover:text-gray-900">Confidentialite</Link>
              <Link href="/contact" className="hover:text-gray-900">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
