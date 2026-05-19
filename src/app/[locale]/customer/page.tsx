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
import {
  readLoginIntent,
  clearLoginIntent,
  type LoginCtx,
  type LoginIntent,
} from '@/lib/customer-login-intent';

const HERO_KEYS: Record<NonNullable<LoginIntent>, string> = {
  loyalty: 'heroLoyalty',
  booking: 'heroBooking',
  deposit: 'heroDeposit',
};

const SUBTITLE_KEYS: Record<NonNullable<LoginIntent>, { plain: string; shop: string }> = {
  loyalty: { plain: 'subtitleLoyalty', shop: 'subtitleLoyaltyShop' },
  booking: { plain: 'subtitleBooking', shop: 'subtitleBookingShop' },
  deposit: { plain: 'subtitleDeposit', shop: 'subtitleDepositShop' },
};

const NOT_FOUND_KEYS: Record<NonNullable<LoginIntent>, { plain: string; shop: string }> = {
  loyalty: { plain: 'notFound', shop: 'notFound' },
  booking: { plain: 'notFoundBooking', shop: 'notFoundBookingShop' },
  deposit: { plain: 'notFoundDeposit', shop: 'notFoundDepositShop' },
};

const HELPER_BOOKING = { lead: 'newHereBooking', accent: 'bookAction', tail: 'bookActionDesc' };
const HELPER_GENERIC = { lead: 'newHere', accent: 'scanQr', tail: 'scanQrDesc' };

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
  const [ctx, setCtx] = useState<LoginCtx>({ intent: null, fromShop: null, returnTo: null });

  useEffect(() => {
    const stored = readLoginIntent();
    setCtx(stored);

    const checkAuth = async () => {
      try {
        const res = await fetch('/api/customers/me');
        const data = await res.json();
        if (data.authenticated) {
          clearLoginIntent();
          router.replace(stored.returnTo || '/customer/cards');
          return;
        }
      } catch {
        // network error -> treat as unauthenticated, show login form
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
        const notFoundKey = ctx.intent
          ? NOT_FOUND_KEYS[ctx.intent][ctx.fromShop ? 'shop' : 'plain']
          : 'notFound';
        setError(t(notFoundKey, ctx.fromShop ? { shop: ctx.fromShop } : undefined));
        setLoading(false);
        return;
      }

      clearLoginIntent();
      router.push(ctx.returnTo || '/customer/cards');
    } catch (err) {
      console.error('Error:', err);
      setError(t('searchError'));
      setLoading(false);
    }
  };

  const heroKey = ctx.intent ? HERO_KEYS[ctx.intent] : 'heroGeneric';
  const subtitleKey = ctx.intent
    ? SUBTITLE_KEYS[ctx.intent][ctx.fromShop ? 'shop' : 'plain']
    : 'subtitleGeneric';
  const helper = ctx.intent === 'booking' || ctx.intent === 'deposit' ? HELPER_BOOKING : HELPER_GENERIC;

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
            {ctx.fromShop && (
              <span className="inline-block mb-3 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
                {t('contextPill', { shop: ctx.fromShop })}
              </span>
            )}
            <h1 className="text-4xl font-black text-gray-900 leading-none mb-3">
              {t(heroKey)}
            </h1>
            <p className="text-base text-gray-700 font-medium">
              {t(subtitleKey, ctx.fromShop ? { shop: ctx.fromShop } : undefined)}
            </p>
          </div>

          {/* Solid card form */}
          <motion.div
            className="p-8 bg-white border border-gray-100 shadow-md rounded-[2.5rem]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 rounded-2xl bg-rose-50 border border-rose-100"
                >
                  <p className="text-sm font-semibold text-rose-600">{error}</p>
                  <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                    Vous n&apos;avez pas encore de carte ? Scannez le QR code en salon lors de votre prochaine visite.
                  </p>
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
                className="h-14 text-lg bg-white border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-r-2xl transition-all shadow-sm"
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
            className="mt-10 p-5 rounded-3xl bg-white border border-gray-100 shadow-sm text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <p className="text-sm text-gray-700 leading-relaxed">
              {t(helper.lead)} <span className="font-bold text-indigo-600">{t(helper.accent)}</span> {t(helper.tail)}
            </p>
          </motion.div>
        </motion.div>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 py-8 text-center">
        <Link href="/" className="inline-flex items-center gap-1.5 group transition-all duration-300 hover:opacity-70">
          <span className="text-xs text-gray-600 group-hover:text-gray-700">{t('poweredBy')}</span>
          <span className="text-xs font-bold text-indigo-600">
            Qarte
          </span>
          <span className="text-xs text-gray-600 group-hover:text-gray-700">{t('inFrance')}</span>
        </Link>
      </footer>

    </div>
  );
}
