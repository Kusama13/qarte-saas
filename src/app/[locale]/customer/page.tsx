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

/* ── Floating loyalty card ─────────────────────────────── */
function FloatingCard({
  color,
  initials,
  stamps,
  total,
  delay,
  x,
  y,
  rotate,
}: {
  color: string;
  initials: string;
  stamps: number;
  total: number;
  delay: number;
  x: string;
  y: string;
  rotate: number;
}) {
  return (
    <motion.div
      className="absolute pointer-events-none select-none"
      style={{ left: x, top: y }}
      initial={{ opacity: 0, scale: 0.8, rotate: rotate - 5 }}
      animate={{
        opacity: [0, 0.55, 0.55, 0],
        scale: [0.8, 1, 1, 0.9],
        rotate: [rotate - 5, rotate, rotate + 3, rotate],
        y: [0, -18, -18, 0],
      }}
      transition={{
        duration: 8,
        delay,
        repeat: Infinity,
        repeatDelay: 2,
        ease: 'easeInOut',
      }}
    >
      <div
        className="w-[160px] h-[100px] rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${color}, ${color}bb)`,
        }}
      >
        {/* Card header */}
        <div className="flex items-center gap-2 px-3 pt-3">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-[11px] ring-1 ring-white/20"
            style={{ backgroundColor: `${color}99` }}
          >
            {initials}
          </div>
          <div className="flex-1">
            <div className="h-1.5 w-14 bg-white/30 rounded-full" />
            <div className="h-1 w-8 bg-white/20 rounded-full mt-1" />
          </div>
        </div>
        {/* Stamp dots */}
        <div className="flex items-center gap-1 px-3 mt-3">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full"
              style={{
                backgroundColor: i < stamps ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.2)',
              }}
            />
          ))}
        </div>
        {/* Progress bar */}
        <div className="mx-3 mt-2 h-1 bg-white/15 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/60 rounded-full"
            style={{ width: `${(stamps / total) * 100}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
}

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

      {/* ── Animated gradient mesh background ── */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-[160px] opacity-30"
          style={{
            background: 'radial-gradient(circle, #818cf8, #7c3aed)',
            top: '-15%',
            left: '-10%',
            animation: 'drift1 12s ease-in-out infinite alternate',
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full blur-[140px] opacity-20"
          style={{
            background: 'radial-gradient(circle, #c084fc, #e879f9)',
            bottom: '-10%',
            right: '-15%',
            animation: 'drift2 14s ease-in-out infinite alternate',
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full blur-[120px] opacity-15"
          style={{
            background: 'radial-gradient(circle, #6366f1, #8b5cf6)',
            top: '40%',
            left: '50%',
            animation: 'drift3 10s ease-in-out infinite alternate',
          }}
        />
      </div>

      {/* ── Floating loyalty cards ── */}
      <div className="absolute inset-0 overflow-hidden">
        <FloatingCard
          color="#654EDA"
          initials="L"
          stamps={6}
          total={8}
          delay={0}
          x="5%"
          y="12%"
          rotate={-12}
        />
        <FloatingCard
          color="#e879f9"
          initials="S"
          stamps={4}
          total={10}
          delay={3}
          x="68%"
          y="8%"
          rotate={8}
        />
        <FloatingCard
          color="#f59e0b"
          initials="B"
          stamps={9}
          total={10}
          delay={5.5}
          x="72%"
          y="65%"
          rotate={-6}
        />
        <FloatingCard
          color="#10b981"
          initials="M"
          stamps={3}
          total={6}
          delay={1.5}
          x="-2%"
          y="60%"
          rotate={10}
        />
      </div>

      {/* ── Header ── */}
      <header className="relative z-10 py-5 px-6">
        <div className="flex items-center justify-center">
          <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
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
          <span className="text-xs font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
            Qarte
          </span>
          <span className="text-xs text-gray-400 group-hover:text-gray-500">{t('inFrance')}</span>
        </Link>
      </footer>

      {/* ── CSS keyframes for gradient drift ── */}
      <style jsx global>{`
        @keyframes drift1 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(80px, 60px) scale(1.15); }
        }
        @keyframes drift2 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(-70px, -50px) scale(1.1); }
        }
        @keyframes drift3 {
          0% { transform: translate(-50%, 0) scale(1); }
          100% { transform: translate(calc(-50% + 40px), -40px) scale(1.2); }
        }
      `}</style>
    </div>
  );
}
