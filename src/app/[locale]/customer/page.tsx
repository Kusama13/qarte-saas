'use client';

import { useState, useEffect } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Search,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { formatPhoneNumber, validatePhone } from '@/lib/utils';
import { COUNTRIES_BY_LOCALE } from '@/types';
import type { MerchantCountry } from '@/types';
import AuthBackground from '@/components/shared/AuthBackground';

/* ── Main page ─────────────────────────────────────────── */
export default function CustomerLoginPage() {
  const t = useTranslations('customerLogin');
  const locale = useLocale();
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const defaultCountry = (COUNTRIES_BY_LOCALE[locale] || COUNTRIES_BY_LOCALE.fr)[0] as MerchantCountry;
  const [country, setCountry] = useState<MerchantCountry>(defaultCountry);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');

  // Check if already logged in via HttpOnly cookie
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/customers/me');
        const data = await res.json();
        if (data.authenticated) {
          router.replace('/customer/cards');
          return;
        }
      } catch {
        // Not authenticated
      }
      setChecking(false);
    };
    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validatePhone(formatPhoneNumber(phoneNumber, country), country)) {
      setError(t('invalidPhone'));
      return;
    }

    setLoading(true);

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber, country);

      // Login API — sets HttpOnly cookie on success
      const response = await fetch('/api/customers/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: formattedPhone }),
      });
      const data = await response.json();

      if (!data.found) {
        setError(t('notFound'));
        setLoading(false);
        return;
      }

      // Redirect to cards page — cookie is already set by the API
      router.push('/customer/cards');
    } catch (err) {
      console.error('Error:', err);
      setError(t('searchError'));
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f7f6fb]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f6fb] relative overflow-hidden flex flex-col">

      <AuthBackground />

      {/* ── Header ── */}
      <header className="relative z-10 py-5 px-6">
        <div className="flex items-center justify-center">
          <span className="text-2xl font-black text-indigo-600">
            Qarte
          </span>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-gray-900 leading-none mb-3">
              {t('myCards')}
            </h1>
            <p className="text-base text-gray-400 font-medium">
              {t('findCards')}
            </p>
          </div>

          {/* Glass card form */}
          <motion.div
            className="p-8 bg-white/70 backdrop-blur-2xl border border-white/80 shadow-[0_8px_60px_rgba(99,102,241,0.10)] rounded-[2.5rem]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 text-sm font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-2xl"
                >
                  {error}
                </motion.div>
              )}

              <PhoneInput
                label={t('phoneLabel')}
                value={phoneNumber}
                onChange={setPhoneNumber}
                country={country}
                onCountryChange={setCountry}
                countries={['FR', 'BE', 'CH']}
                required
                autoFocus
                className="h-14 text-lg bg-white/60 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-r-2xl transition-all shadow-sm"
              />

              <Button
                type="submit"
                loading={loading}
                className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-200/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Search className="w-5 h-5 mr-2" />
                {t('continue')}
              </Button>
            </form>
          </motion.div>

          <motion.div
            className="mt-10 p-5 rounded-3xl bg-white/40 backdrop-blur-lg border border-white/60 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <p className="text-sm text-gray-500 leading-relaxed">
              {t('newHere')} <span className="font-bold text-indigo-600">{t('scanQr')}</span> {t('scanQrDesc')}
            </p>
          </motion.div>
        </motion.div>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 py-8 text-center">
        <Link href="/" className="inline-flex items-center gap-1.5 group transition-all duration-300 hover:opacity-70">
          <span className="text-xs text-gray-400 group-hover:text-gray-500">{t('poweredBy')}</span>
          <span className="text-xs font-bold text-indigo-600">
            Qarte
          </span>
          <span className="text-xs text-gray-400 group-hover:text-gray-500">{t('inFrance')}</span>
        </Link>
      </footer>

    </div>
  );
}
