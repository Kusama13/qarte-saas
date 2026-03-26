'use client';

import { useState, useEffect } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import {
  CreditCard,
  Eye,
  EyeOff,
  ArrowRight,
  Check,
  Clock,
  Globe,
  Shield,
  Zap,
  Sparkles,
} from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { getSupabase } from '@/lib/supabase';
import { validateEmail, suggestEmailCorrection } from '@/lib/utils';
import { trackPageView, trackSignupStarted } from '@/lib/analytics';
import { FacebookPixel, fbEvents } from '@/components/analytics/FacebookPixel';
import { TikTokPixel } from '@/components/analytics/TikTokPixel';
import { useTranslations, useLocale } from 'next-intl';
import LocaleSwitcher from '@/components/shared/LocaleSwitcher';

export default function MerchantSignupPage() {
  const router = useRouter();
  const supabase = getSupabase();
  const t = useTranslations('signup');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [emailSuggestion, setEmailSuggestion] = useState('');
  const [affiliateName, setAffiliateName] = useState<string | null>(null);
  const locale = useLocale();

  // Track page view + capture affiliate ref
  useEffect(() => {
    trackPageView('signup_page');

    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      try {
        localStorage.setItem('qarte_signup_source', `affiliate_${ref}`);
      } catch { /* private browsing */ }
      fetch(`/api/affiliate/resolve?slug=${encodeURIComponent(ref)}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) setAffiliateName(d.name); })
        .catch(() => {});
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Track signup started
    trackSignupStarted('email');

    if (!validateEmail(formData.email)) {
      setError(t('invalidEmail'));
      setLoading(false);
      return;
    }

    // Typo safety net — suggest correction before sending to Supabase
    const correction = suggestEmailCorrection(formData.email);
    if (correction && !emailSuggestion) {
      setEmailSuggestion(correction);
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError(t('passwordTooShort'));
      setLoading(false);
      return;
    }

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (signUpError) {
        console.error('Signup error:', signUpError);
        if (signUpError.message.includes('already registered')) {
          setError(t('emailAlreadyUsed'));
        } else {
          setError(t('createError') + ': ' + signUpError.message);
        }
        return;
      }

      if (authData.user) {
        // Track Facebook Pixel Lead event (Phase 1 completed)
        fbEvents.lead();

        // Schedule reminder email (await to ensure emailId is stored before Phase 2)
        // This prevents race condition where Phase 2 completes before emailId is saved
        try {
          await fetch('/api/emails/schedule-incomplete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: authData.user.id,
              email: formData.email,
            }),
          });
        } catch {
          // Don't block signup if email scheduling fails
        }

        // Redirect to Phase 2 (complete profile)
        router.push('/auth/merchant/signup/complete');
      } else {
        setError(t('genericError'));
      }
    } catch {
      setError(t('genericError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 relative overflow-hidden">
      <FacebookPixel />
      <TikTokPixel />

      {/* Language switcher */}
      <div className="absolute top-4 right-4 z-20">
        <LocaleSwitcher variant="light" />
      </div>

      {/* Language hint for non-FR visitors */}
      {locale === 'fr' && (
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-2rem)] max-w-md md:w-auto">
          <Link
            href="/auth/merchant/signup"
            locale="en"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-white/90 backdrop-blur-md border border-gray-200/60 shadow-lg shadow-gray-200/30 text-[11px] md:text-xs text-gray-500 hover:text-indigo-600 hover:border-indigo-200 transition-all duration-200 text-center"
          >
            <Globe className="w-3.5 h-3.5 shrink-0" />
            <span>Available in English for US, UK, Canada &amp; Australia. <span className="font-semibold text-gray-700">Switch to English</span></span>
            <ArrowRight className="w-3 h-3 shrink-0" />
          </Link>
        </div>
      )}

      {/* Background decorative blobs — blue/pink */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/25 to-purple-400/20 rounded-full blur-3xl -translate-x-1/3 -translate-y-1/3" />
      <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-gradient-to-br from-pink-400/25 to-rose-300/20 rounded-full blur-3xl translate-x-1/4" />
      <div className="absolute bottom-0 left-1/3 w-[350px] h-[350px] bg-gradient-to-br from-violet-400/15 to-pink-400/20 rounded-full blur-3xl translate-y-1/4" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        <Link href="/" className="mb-8 inline-block text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
          Qarte
        </Link>

        <div className="w-full max-w-md">
          {affiliateName && (
            <div className="mb-4 flex items-center gap-3 px-5 py-3.5 bg-indigo-50/80 backdrop-blur-sm border border-indigo-100 rounded-2xl">
              <div className="p-2 rounded-xl bg-indigo-100">
                <Sparkles className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-sm text-gray-700">
                <strong className="text-indigo-700">{affiliateName}</strong> {t('affiliateRecommends')}
              </p>
            </div>
          )}

          <div className="p-5 md:p-8 bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl shadow-primary/10 rounded-3xl">
            <div className="text-center mb-5">
              <h1 className="text-xl font-bold text-gray-900">
                {t('title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">{t('titleBold')}</span> {t('titleEnd')}
              </h1>
              <p className="mt-2 text-gray-600">
                {t('subtitle')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-4 text-sm text-red-700 bg-red-50 rounded-xl">
                  {error}
                </div>
              )}

              <div>
                <Input
                  type="email"
                  label={t('emailLabel')}
                  placeholder={t('emailPlaceholder')}
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    setEmailSuggestion('');
                  }}
                  required
                />
                {emailSuggestion && (
                  <p className="mt-1.5 text-sm text-amber-700">
                    {t('didYouMean')}{' '}
                    <button
                      type="button"
                      className="font-semibold underline hover:text-amber-900"
                      onClick={() => {
                        setFormData({ ...formData, email: emailSuggestion });
                        setEmailSuggestion('');
                      }}
                    >
                      {emailSuggestion}
                    </button>
                    {' '}?
                  </p>
                )}
              </div>

              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  label={t('passwordLabel')}
                  placeholder={t('passwordPlaceholder')}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute text-gray-400 right-4 top-10 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              <Button type="submit" loading={loading} className="w-full bg-gradient-to-r from-indigo-600 to-pink-500 hover:from-indigo-700 hover:to-pink-600 shadow-lg shadow-indigo-200/50">
                {t('cta')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500 font-medium">
                <span className="flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5" />
                  {t('noCreditCard')}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {t('readyIn2min')}
                </span>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                {t('alreadyAccount')}{' '}
                <Link
                  href="/auth/merchant"
                  className="font-medium text-primary hover:text-primary-600"
                >
                  {t('login')}
                </Link>
              </p>
            </div>
          </div>

          <p className="mt-6 text-sm text-center text-gray-500">
            {t('termsIntro')}{' '}
            <Link href="/cgv" className="text-primary hover:underline">
              {t('termsLink')}
            </Link>{' '}
            {t('and')}{' '}
            <Link
              href="/politique-confidentialite"
              className="text-primary hover:underline"
            >
              {t('privacyLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
