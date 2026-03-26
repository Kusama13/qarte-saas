'use client';

import { useState, useEffect } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Eye,
  EyeOff,
  ArrowRight,
  Clock,
  Globe,
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

function FloatingCard({ color, initials, stamps, total, delay, x, y, rotate }: { color: string; initials: string; stamps: number; total: number; delay: number; x: string; y: string; rotate: number }) {
  return (
    <motion.div className="absolute pointer-events-none select-none" style={{ left: x, top: y }} initial={{ opacity: 0, scale: 0.8, rotate: rotate - 5 }} animate={{ opacity: [0, 0.55, 0.55, 0], scale: [0.8, 1, 1, 0.9], rotate: [rotate - 5, rotate, rotate + 3, rotate], y: [0, -18, -18, 0] }} transition={{ duration: 8, delay, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}>
      <div className="w-[160px] h-[100px] rounded-2xl shadow-2xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)` }}>
        <div className="flex items-center gap-2 px-3 pt-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-[11px] ring-1 ring-white/20" style={{ backgroundColor: `${color}99` }}>{initials}</div>
          <div className="flex-1"><div className="h-1.5 w-14 bg-white/30 rounded-full" /><div className="h-1 w-8 bg-white/20 rounded-full mt-1" /></div>
        </div>
        <div className="flex items-center gap-1 px-3 mt-3">
          {Array.from({ length: total }).map((_, i) => (<div key={i} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: i < stamps ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.2)' }} />))}
        </div>
        <div className="mx-3 mt-2 h-1 bg-white/15 rounded-full overflow-hidden"><div className="h-full bg-white/60 rounded-full" style={{ width: `${(stamps / total) * 100}%` }} /></div>
      </div>
    </motion.div>
  );
}

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
    <div className="min-h-screen bg-[#f7f6fb] relative overflow-hidden">
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

      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-[600px] h-[600px] rounded-full blur-[160px] opacity-30" style={{ background: 'radial-gradient(circle, #818cf8, #7c3aed)', top: '-15%', left: '-10%', animation: 'drift1 12s ease-in-out infinite alternate' }} />
        <div className="absolute w-[500px] h-[500px] rounded-full blur-[140px] opacity-20" style={{ background: 'radial-gradient(circle, #c084fc, #e879f9)', bottom: '-10%', right: '-15%', animation: 'drift2 14s ease-in-out infinite alternate' }} />
        <div className="absolute w-[400px] h-[400px] rounded-full blur-[120px] opacity-15" style={{ background: 'radial-gradient(circle, #6366f1, #8b5cf6)', top: '40%', left: '50%', animation: 'drift3 10s ease-in-out infinite alternate' }} />
      </div>

      {/* Floating loyalty cards */}
      <div className="absolute inset-0 overflow-hidden">
        <FloatingCard color="#654EDA" initials="L" stamps={6} total={8} delay={0} x="5%" y="12%" rotate={-12} />
        <FloatingCard color="#e879f9" initials="S" stamps={4} total={10} delay={3} x="68%" y="8%" rotate={8} />
        <FloatingCard color="#f59e0b" initials="B" stamps={9} total={10} delay={5.5} x="72%" y="65%" rotate={-6} />
        <FloatingCard color="#10b981" initials="M" stamps={3} total={6} delay={1.5} x="-2%" y="60%" rotate={10} />
      </div>

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

      <style jsx global>{`
        @keyframes drift1 { 0% { transform: translate(0, 0) scale(1); } 100% { transform: translate(80px, 60px) scale(1.15); } }
        @keyframes drift2 { 0% { transform: translate(0, 0) scale(1); } 100% { transform: translate(-70px, -50px) scale(1.1); } }
        @keyframes drift3 { 0% { transform: translate(-50%, 0) scale(1); } 100% { transform: translate(calc(-50% + 40px), -40px) scale(1.2); } }
      `}</style>
    </div>
  );
}
