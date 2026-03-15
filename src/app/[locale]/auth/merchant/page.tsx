'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { Link } from '@/i18n/navigation';
import { CheckCircle2, CreditCard } from 'lucide-react';
import { suggestEmailCorrection } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import LocaleSwitcher from '@/components/shared/LocaleSwitcher';

function MerchantLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = getSupabase();
  const t = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);
  const [fromVerification, setFromVerification] = useState(false);
  const [emailSuggestion, setEmailSuggestion] = useState('');

  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      setVerified(true);
    }
    // Pré-remplir l'email si fourni (venant de verify-email)
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
      setFromVerification(true);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Typo safety net
    const correction = suggestEmailCorrection(email);
    if (correction && !emailSuggestion) {
      setEmailSuggestion(correction);
      setLoading(false);
      return;
    }

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      if (data?.session) {
        // Redirection vers le dashboard (qui redirigera vers setup si nécessaire)
        router.replace('/dashboard');
      }
    } catch (err) {
      console.error('Erreur de connexion:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage === 'Invalid login credentials'
        ? t('invalidCredentials')
        : errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Language switcher */}
      <div className="absolute top-4 right-4 z-20">
        <LocaleSwitcher variant="light" />
      </div>
      {/* Background decorative blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute top-1/3 right-0 w-80 h-80 bg-gradient-to-br from-secondary/15 to-primary/15 rounded-full blur-3xl translate-x-1/2" />
      <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-gradient-to-br from-primary/10 to-secondary/20 rounded-full blur-3xl" />

      <div className="max-w-md w-full mx-4 z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
            Qarte
          </Link>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-primary/10 p-8 border border-white/40">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              {t('welcomeBack')}
            </h1>
          </div>

          {/* Success Message - Email verified */}
          {verified && (
            <div className="mb-6 bg-emerald-50/50 backdrop-blur-sm border border-emerald-200 text-emerald-700 px-4 py-3 rounded-2xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{t('emailVerifiedSuccess')}</span>
            </div>
          )}

          {/* Info Message - Coming from verification page */}
          {fromVerification && !verified && (
            <div className="mb-6 bg-primary-50/50 backdrop-blur-sm border border-primary-200 text-primary-700 px-4 py-3 rounded-2xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{t('enterPasswordPrompt')}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-rose-50/50 backdrop-blur-sm border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-sm font-medium">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 ml-1">
                {t('emailLabel')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailSuggestion(''); }}
                className="w-full px-4 py-3.5 bg-white/50 border border-gray-200/80 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                placeholder={t('emailPlaceholder')}
                required
                disabled={loading}
              />
              {emailSuggestion && (
                <p className="mt-1.5 text-sm text-amber-700">
                  {t('didYouMean')}{' '}
                  <button
                    type="button"
                    className="font-semibold underline hover:text-amber-900"
                    onClick={() => { setEmail(emailSuggestion); setEmailSuggestion(''); }}
                  >
                    {emailSuggestion}
                  </button>
                  {' '}?
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                  {t('passwordLabel')}
                </label>
                <Link
                  href="/auth/merchant/forgot-password"
                  className="text-xs font-semibold text-primary hover:text-primary-600 transition-colors"
                >
                  {t('forgotLink')}
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 bg-white/50 border border-gray-200/80 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-pink-500 hover:from-indigo-700 hover:to-pink-600 text-white py-4 px-4 rounded-2xl font-bold shadow-lg shadow-indigo-200/50 hover:shadow-indigo-300/50 hover:translate-y-[-1px] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('loginLoading')}
                </span>
              ) : t('loginCta')}
            </button>
          </form>

          {/* Link to Signup */}
          <div className="mt-8 text-center text-sm font-medium text-gray-500">
            {t('newToQarte')}{' '}
            <Link href="/auth/merchant/signup" className="text-primary font-bold hover:text-primary-600 transition-colors">
              {t('registerBusiness')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MerchantLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <MerchantLoginContent />
    </Suspense>
  );
}
