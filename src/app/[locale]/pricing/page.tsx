'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { Check, CreditCard, ArrowRight, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('pricingPage');

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Error:', err);
      setError(t('redirectError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50">
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
            <Link href="/auth/merchant">
              <Button variant="outline">{t('login')}</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="px-4 py-20 mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-primary/10 text-primary font-medium">
            <Sparkles className="w-4 h-4" />
            <span>{t('launchBadge')}</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            {t('titleLine1')}<br />
            <span className="text-primary">{t('titleLine2')}</span>
          </h1>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-lg mx-auto mb-20">
          <div className="relative">
            {/* Badge "Populaire" */}
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10">
              <div className="px-6 py-2 rounded-full bg-gradient-to-r from-primary to-purple-600 text-white font-semibold shadow-lg">
                {t('popular')}
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl p-10 border-2 border-primary/20">
              {/* Prix */}
              <div className="text-center mb-10">
                <div className="flex items-end justify-center gap-2 mb-2">
                  <span className="text-6xl font-bold text-gray-900">{t('price')}</span>
                  <span className="text-2xl text-gray-500 mb-3">{t('perMonth')}</span>
                </div>
                <p className="text-gray-600">{t('noCommitment')}</p>
              </div>

              {/* Error message */}
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 font-medium text-center">
                  {error}
                </div>
              )}

              {/* CTA Button */}
              <Button
                onClick={handleSubscribe}
                loading={loading}
                disabled={loading}
                className="w-full h-14 text-lg mb-8 bg-gradient-to-r from-primary to-purple-600 hover:shadow-xl transition-all"
              >
                {t('cta')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              {/* Features */}
              <div className="mb-8">
                <p className="font-semibold text-gray-900 text-center mb-4">
                  {t('everythingYouNeed')}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {[t('f1'), t('f2'), t('f3'), t('f4'), t('f5'), t('f6'), t('f7'), t('f8')].map((feature, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trust badges */}
              <div className="pt-8 border-t border-gray-100">
                <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>{t('securePayment')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>{t('gdpr')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="text-center mb-20">
          <p className="text-gray-600 mb-6">{t('trustTitle')}</p>
          <div className="flex items-center justify-center gap-12 flex-wrap opacity-60">
            <div className="text-2xl font-bold text-gray-400">Cafe du Coin</div>
            <div className="text-2xl font-bold text-gray-400">Boulangerie Paul</div>
            <div className="text-2xl font-bold text-gray-400">Salon de the</div>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            {t('faqTitle')}
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">
                {t('faqQ1')}
              </h3>
              <p className="text-gray-600">
                {t('faqA1')}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">
                {t('faqQ2')}
              </h3>
              <p className="text-gray-600">
                {t('faqA2')}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">
                {t('faqQ3')}
              </h3>
              <p className="text-gray-600">
                {t('faqA3')}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">
                {t('faqQ4')}
              </h3>
              <p className="text-gray-600">
                {t('faqA4')}
              </p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-20 text-center bg-gradient-to-r from-primary to-purple-600 rounded-3xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">
            {t('finalCtaTitle')}
          </h2>
          <p className="text-xl mb-8 text-white/90">
            {t('finalCtaSub')}
          </p>
          <Button
            onClick={handleSubscribe}
            loading={loading}
            className="bg-white text-primary hover:bg-gray-50 h-14 px-8 text-lg"
          >
            {t('finalCtaBtn')}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/50 backdrop-blur-md py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600">
          <p>{t('copyright')}</p>
          <div className="flex items-center justify-center gap-6 mt-4">
            <Link href="/mentions-legales" className="hover:text-primary transition">
              {t('legalNotices')}
            </Link>
            <Link href="/politique-confidentialite" className="hover:text-primary transition">
              {t('privacy')}
            </Link>
            <Link href="/contact" className="hover:text-primary transition">
              {t('contact')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
