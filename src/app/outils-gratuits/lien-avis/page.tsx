'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Star,
  ArrowRight,
  CheckCircle2,
  Gift,
  Copy,
  ExternalLink,
  HelpCircle,
  Search,
  Sparkles,
  X,
  TrendingUp,
} from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { Header } from '@/components/shared/Header';

export default function LienAvisPage() {
  const [step, setStep] = useState<'input' | 'result'>('input');
  const [businessName, setBusinessName] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [googleReviewLink, setGoogleReviewLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showPromoPopup, setShowPromoPopup] = useState(false);

  // Generate Google Review Link
  const handleGenerateReviewLink = () => {
    if (!placeId) return;
    const reviewLink = `https://search.google.com/local/writereview?placeid=${placeId.trim()}`;
    setGoogleReviewLink(reviewLink);
    setStep('result');
    // Show promo popup after a short delay
    setTimeout(() => setShowPromoPopup(true), 1500);
  };

  // Copy link to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Reset form
  const resetForm = () => {
    setStep('input');
    setPlaceId('');
    setGoogleReviewLink('');
    setBusinessName('');
    setShowPromoPopup(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <Header minimal />

      <main className="px-4 py-12 mx-auto max-w-2xl pt-24 md:pt-28">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">

          {/* Input Step */}
          {step === 'input' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 font-medium text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>100% gratuit</span>
                </div>
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-4">
                  <Star className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Generateur Lien Avis Google</h1>
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

              {/* Help Section */}
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                <button
                  onClick={() => setShowHelp(!showHelp)}
                  className="flex items-center gap-2 text-amber-800 font-semibold text-sm w-full"
                >
                  <HelpCircle className="w-4 h-4" />
                  Comment trouver mon Place ID ?
                  <span className="ml-auto">{showHelp ? '−' : '+'}</span>
                </button>

                {showHelp && (
                  <div className="mt-4 space-y-4">
                    <ol className="text-sm text-amber-700 space-y-3">
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-200 flex items-center justify-center text-amber-800 font-bold text-xs">1</span>
                        <span>Allez sur Google Maps et recherchez votre etablissement</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-200 flex items-center justify-center text-amber-800 font-bold text-xs">2</span>
                        <span>Cliquez sur votre etablissement pour ouvrir sa fiche</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-200 flex items-center justify-center text-amber-800 font-bold text-xs">3</span>
                        <span>Dans l&apos;URL, copiez le code apres <code className="bg-amber-100 px-1 rounded">place/</code> et avant le prochain <code className="bg-amber-100 px-1 rounded">/</code></span>
                      </li>
                    </ol>

                    <div className="bg-white rounded-lg p-3 border border-amber-200">
                      <p className="text-xs text-gray-500 mb-1">Exemple d&apos;URL Google Maps :</p>
                      <p className="text-xs font-mono text-gray-700 break-all">
                        https://www.google.com/maps/place/<span className="bg-amber-200 px-1">ChIJN1t_tDeuEmsRUsoyG83frY4</span>/...
                      </p>
                    </div>

                    <a
                      href="https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-amber-700 hover:text-amber-800 font-medium"
                    >
                      <Search className="w-4 h-4" />
                      Utiliser l&apos;outil officiel Google Place ID Finder
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              <Button
                onClick={handleGenerateReviewLink}
                disabled={!placeId}
                className="w-full h-14 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-lg rounded-xl"
              >
                <Star className="w-5 h-5 mr-2" />
                Generer mon lien
              </Button>

              {/* Qarte CTA */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <a href="https://getqarte.com" className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100 hover:border-amber-200 transition-colors">
                  <TrendingUp className="w-8 h-8 text-amber-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">Augmentez votre CA avec Qarte</p>
                    <p className="text-xs text-gray-600">Fidelisez vos clients et boostez leur frequence de visite</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-amber-600" />
                </a>
              </div>
            </div>
          )}

          {/* Result Step */}
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

              <div className="flex gap-3">
                <Button
                  onClick={() => copyToClipboard(googleReviewLink)}
                  className="flex-1 h-12 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-xl"
                >
                  {copied ? <CheckCircle2 className="w-5 h-5 mr-2" /> : <Copy className="w-5 h-5 mr-2" />}
                  {copied ? 'Copie !' : 'Copier le lien'}
                </Button>
                <Button
                  onClick={() => window.open(googleReviewLink, '_blank')}
                  variant="outline"
                  className="h-12"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>

              {/* Tips */}
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                <p className="text-sm font-semibold text-amber-800 mb-2">Conseils pour obtenir plus d&apos;avis :</p>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>- Envoyez le lien par SMS apres une visite</li>
                  <li>- Ajoutez-le sur vos tickets de caisse</li>
                  <li>- Creez un QR code qui pointe vers ce lien</li>
                </ul>
              </div>

              <button
                onClick={resetForm}
                className="w-full text-center text-gray-500 hover:text-gray-700 font-medium py-2"
              >
                Creer un autre lien
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Promo Popup */}
      {showPromoPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowPromoPopup(false)}
          />

          {/* Modal */}
          <div className="relative bg-white/95 backdrop-blur-md rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(79,70,229,0.2)] max-w-md w-full p-8 border border-white/40 animate-in zoom-in-95 fade-in duration-300">
            {/* Ambient Background Glow */}
            <div className="absolute -z-10 inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 rounded-[2.5rem]" />

            {/* Close button */}
            <button
              onClick={() => setShowPromoPopup(false)}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-indigo-600 transition-colors bg-gray-50 hover:bg-indigo-50 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Content */}
            <div className="text-center relative">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full animate-pulse" />
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-xl transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                  <TrendingUp className="w-10 h-10 text-white" />
                </div>
              </div>

              <h3 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-3">
                Boostez votre <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">chiffre d&apos;affaires</span>
              </h3>

              <p className="text-gray-500 text-[15px] leading-relaxed mb-8">
                Avec <span className="font-semibold text-indigo-600">Qarte</span>, fidelisez vos clients et augmentez leur frequence de visite.
                Un client fidele depense en moyenne <span className="font-bold text-gray-900">67% de plus</span>.
              </p>

              {/* Benefits Cards */}
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-indigo-50 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-300">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Carte de fidelite 100% digitale</span>
                </div>
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-indigo-50 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-300">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Fini les tampons et cartes perdues</span>
                </div>
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-indigo-50 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-300">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Statistiques en temps reel</span>
                </div>
              </div>

              <a href="https://getqarte.com" className="block">
                <Button className="w-full h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-lg rounded-2xl shadow-lg shadow-indigo-200/50 hover-glow hover-lift transition-all duration-300">
                  Decouvrir Qarte
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </a>

              <div className="mt-5 flex items-center justify-center gap-2 opacity-80">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em]">
                  15 jours d&apos;essai gratuit - Sans engagement
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
