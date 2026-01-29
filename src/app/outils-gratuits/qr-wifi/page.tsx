'use client';

import { useState } from 'react';
import {
  QrCode,
  Download,
  Mail,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Wifi,
  Lock,
  Eye,
  EyeOff,
  TrendingUp,
  Shield,
  Copy,
  Check,
} from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { Header } from '@/components/shared/Header';
import { generateQRCode, validateEmail } from '@/lib/utils';

type Step = 'input' | 'result' | 'capture' | 'success';
type SecurityType = 'WPA' | 'WEP' | 'nopass';

export default function QRWifiPage() {
  const [step, setStep] = useState<Step>('input');
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [securityType, setSecurityType] = useState<SecurityType>('WPA');
  const [showPassword, setShowPassword] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate WiFi QR Code string
  const generateWifiString = () => {
    // Format: WIFI:T:WPA;S:mynetwork;P:mypassword;H:false;;
    const escapedSsid = ssid.replace(/[\\;,:]/g, '\\$&');
    const escapedPassword = password.replace(/[\\;,:]/g, '\\$&');

    if (securityType === 'nopass') {
      return `WIFI:T:nopass;S:${escapedSsid};;`;
    }
    return `WIFI:T:${securityType};S:${escapedSsid};P:${escapedPassword};;`;
  };

  // Generate QR Code
  const handleGenerateQR = async () => {
    if (!ssid) return;
    if (securityType !== 'nopass' && !password) return;

    setIsGenerating(true);
    try {
      const wifiString = generateWifiString();
      const qrCode = await generateQRCode(wifiString);
      setQrCodeDataUrl(qrCode);
      setStep('result');
    } catch (error) {
      console.error('Error generating QR:', error);
      alert('Erreur lors de la generation du QR code');
    } finally {
      setIsGenerating(false);
    }
  };

  // Download QR Code
  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.download = `qr-wifi-${businessName || ssid || 'network'}.png`;
    link.href = qrCodeDataUrl;
    link.click();
  };

  // Copy password
  const copyPassword = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          source: 'qr-wifi',
          generatedValue: ssid,
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
    setSsid('');
    setPassword('');
    setSecurityType('WPA');
    setQrCodeDataUrl('');
    setEmail('');
    setEmailError('');
    setBusinessName('');
    setShowPassword(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-blue-50">
      <Header minimal />

      <main className="px-4 py-12 mx-auto max-w-4xl pt-24 md:pt-28">
        {/* Header - Only show on input step */}
        {step === 'input' && (
          <div className="mb-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 rounded-full bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-700 font-medium text-sm">
                <Wifi className="w-4 h-4" />
                <span>100% gratuit - Sans inscription</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Generateur QR Code WiFi</h1>
              <p className="text-gray-600">Vos clients se connectent en un scan - fini de dicter le mot de passe !</p>
            </div>

            {/* Benefits */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center mb-3">
                  <Wifi className="w-5 h-5 text-cyan-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Connexion instantanee</h3>
                <p className="text-sm text-gray-600">Un scan et c&apos;est connecte. Plus besoin de taper le mot de passe.</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Securise</h3>
                <p className="text-sm text-gray-600">Le mot de passe reste invisible. Seul le QR code permet la connexion.</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center mb-3">
                  <QrCode className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Universel</h3>
                <p className="text-sm text-gray-600">Compatible iPhone, Android et tous les appareils recents.</p>
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
                  placeholder="Ex: Cafe de la Place"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">Pour personnaliser le nom du fichier</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Wifi className="w-4 h-4 inline mr-1" />
                  Nom du reseau WiFi (SSID) *
                </label>
                <Input
                  placeholder="Ex: CafeDeLaPlace_Guest"
                  value={ssid}
                  onChange={(e) => setSsid(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Lock className="w-4 h-4 inline mr-1" />
                  Type de securite
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'WPA', label: 'WPA/WPA2' },
                    { value: 'WEP', label: 'WEP' },
                    { value: 'nopass', label: 'Sans mot de passe' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSecurityType(option.value as SecurityType)}
                      className={`px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                        securityType === option.value
                          ? 'bg-cyan-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {securityType !== 'nopass' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mot de passe WiFi *
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Votre mot de passe WiFi"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Le mot de passe est encode dans le QR code, pas stocke sur nos serveurs
                  </p>
                </div>
              )}

              <Button
                onClick={handleGenerateQR}
                disabled={!ssid || (securityType !== 'nopass' && !password) || isGenerating}
                className="w-full h-14 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold text-lg rounded-xl"
              >
                {isGenerating ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <QrCode className="w-5 h-5 mr-2" />
                )}
                Generer mon QR Code WiFi
              </Button>

              {/* Qarte CTA */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <a href="https://getqarte.com" className="flex items-center gap-3 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl border border-cyan-100 hover:border-cyan-200 transition-colors">
                  <TrendingUp className="w-8 h-8 text-cyan-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">Fidelisez vos clients avec Qarte</p>
                    <p className="text-xs text-gray-600">Cartes de fidelite digitales pour commercants</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-cyan-600" />
                </a>
              </div>
            </div>
          )}

          {/* Result Step */}
          {step === 'result' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Votre QR Code WiFi est pret !</h2>
                <p className="text-gray-600">Scannez-le pour tester la connexion</p>
              </div>

              <div className="flex justify-center">
                <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-cyan-100">
                  <img src={qrCodeDataUrl} alt="QR Code WiFi" className="w-48 h-48" />
                </div>
              </div>

              <div className="bg-cyan-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Reseau:</span>
                  <span className="font-semibold text-gray-900">{ssid}</span>
                </div>
                {securityType !== 'nopass' && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Mot de passe:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-gray-900">
                        {showPassword ? password : '••••••••'}
                      </span>
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={copyPassword}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Securite:</span>
                  <span className="font-medium text-gray-900">
                    {securityType === 'nopass' ? 'Ouvert' : securityType}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <p className="text-center text-gray-700 font-medium mb-4">
                  Telechargez votre QR code gratuitement
                </p>
                <Button
                  onClick={() => setStep('capture')}
                  className="w-full h-14 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold text-lg rounded-xl"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Telecharger
                </Button>
              </div>
            </div>
          )}

          {/* Email Capture Step */}
          {step === 'capture' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-cyan-100 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-cyan-600" />
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
                className="w-full h-14 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold text-lg rounded-xl"
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
                  Telechargez votre QR code WiFi
                </p>
              </div>

              {/* QR Code Preview */}
              <div className="flex justify-center mb-4">
                <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-200">
                  <img src={qrCodeDataUrl} alt="QR Code WiFi" className="w-32 h-32" />
                </div>
              </div>

              {/* Download Button */}
              <Button
                onClick={downloadQRCode}
                className="w-full h-14 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold text-lg rounded-xl"
              >
                <Download className="w-5 h-5 mr-2" />
                Telecharger le QR Code
              </Button>

              {/* Tips */}
              <div className="bg-gray-50 rounded-xl p-4 mt-4">
                <p className="text-sm font-semibold text-gray-900 mb-2">Conseils d&apos;utilisation :</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>- Imprimez-le et affichez-le a l&apos;entree ou sur les tables</li>
                  <li>- Ajoutez-le a votre support de table ou menu</li>
                  <li>- Plastifiez-le pour plus de durabilite</li>
                </ul>
              </div>

              {/* Loyalty Program CTA */}
              <div className="mt-8 pt-8 border-t border-gray-100">
                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-6 border border-cyan-100">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        Transformez vos visiteurs en clients fideles
                      </h3>
                      <p className="text-gray-600 text-sm mb-2">
                        Vos clients utilisent deja leur telephone pour se connecter au WiFi.
                      </p>
                      <p className="text-gray-600 text-sm mb-4">
                        Avec Qarte, ils peuvent aussi cumuler des points de fidelite en un scan !
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <a href="https://getqarte.com">
                          <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold">
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
                Creer un autre QR code WiFi
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
