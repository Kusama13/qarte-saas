'use client';

import { useState, useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import {
  CreditCard,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  Gift,
  Clock,
} from 'lucide-react';
import { Button, Input, Select } from '@/components/ui';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { getSupabase } from '@/lib/supabase';
import { formatPhoneNumber, validatePhone } from '@/lib/utils';
import { SHOP_TYPES, type ShopType, COUNTRIES, COUNTRIES_BY_LOCALE, type MerchantCountry } from '@/types';
import { trackPageView, trackSetupCompleted, trackSignupCompleted } from '@/lib/analytics';
import { FacebookPixel, fbEvents } from '@/components/analytics/FacebookPixel';
import { TikTokPixel, ttEvents, ttIdentify } from '@/components/analytics/TikTokPixel';
import LocaleSwitcher from '@/components/shared/LocaleSwitcher';
import AuthBackground from '@/components/shared/AuthBackground';

export default function CompleteProfilePage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('signupComplete');
  const tShop = useTranslations('shopTypes');
  const tCountry = useTranslations('countries');
  const supabase = getSupabase();

  const shopTypeOptions = Object.keys(SHOP_TYPES).map((value) => ({
    value,
    label: tShop(value),
  }));

  const countryKeys = COUNTRIES_BY_LOCALE[locale] || COUNTRIES_BY_LOCALE.fr;
  const countryOptions = countryKeys.map((value) => ({
    value,
    label: tCountry(value),
  }));
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    phone: '',
    shopName: '',
    shopType: '' as ShopType | '',
    country: (COUNTRIES_BY_LOCALE[locale] || COUNTRIES_BY_LOCALE.fr)[0] as MerchantCountry,
  });

  // Track page view
  useEffect(() => {
    trackPageView('signup_complete_page');
  }, []);

  // Check auth state - user must be logged in
  useEffect(() => {
    const checkAuth = async () => {
      // getUser() validates the JWT server-side (more secure than getSession)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/auth/merchant/signup');
        return;
      }

      // Get session for access token (needed for API calls)
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Check if merchant already exists (in case user refreshes after completing)
      const response = await fetch('/api/merchants/check', {
        headers: token
          ? { 'Authorization': `Bearer ${token}` }
          : {},
      });

      if (response.ok) {
        const data = await response.json();
        if (data.exists) {
          router.replace('/dashboard');
          return;
        }
      }

      setUserId(user.id);
      setUserEmail(user.email || null);
      setAccessToken(token || null);
      setCheckingAuth(false);
    };

    checkAuth();
  }, [supabase, router]);

  // Auto-focus first field when ready
  useEffect(() => {
    if (!checkingAuth) {
      setTimeout(() => nameRef.current?.focus(), 100);
    }
  }, [checkingAuth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formattedPhone = formatPhoneNumber(formData.phone, formData.country);
    if (!validatePhone(formattedPhone, formData.country)) {
      setError(t('invalidPhone'));
      setLoading(false);
      return;
    }

    if (!formData.shopType) {
      setError(t('selectShopType'));
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/merchants/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && {
            'Authorization': `Bearer ${accessToken}`,
          }),
        },
        body: JSON.stringify({
          user_id: userId,
          shop_name: formData.shopName,
          shop_type: formData.shopType,
          shop_address: null,
          phone: formattedPhone,
          country: formData.country,
          signup_source: (() => { try { const s = localStorage.getItem('qarte_signup_source'); if (s) localStorage.removeItem('qarte_signup_source'); return s; } catch { return null; } })(),
          locale,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Merchant creation error:', result.error);
        setError(t('profileError') + ': ' + result.error);
        return;
      }

      // Track signup completed + merchant creation + FB CompleteRegistration + StartTrial
      trackSignupCompleted(userId!, 'email');
      trackSetupCompleted({ merchant_id: result.merchant?.id || userId!, business_type: formData.shopType || undefined });
      fbEvents.completeRegistration();
      fbEvents.startTrial();
      // TikTok: identify user (await pour que le hash soit prêt) + CompleteRegistration + StartTrial
      await ttIdentify({ email: userEmail || undefined, phone: formattedPhone, externalId: userId || undefined });
      ttEvents.completeRegistration();
      ttEvents.startTrial();

      // Redirect to personalize screen
      router.push('/dashboard/personalize');
    } catch {
      setError(t('genericError'));
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f6fb]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f6fb] relative overflow-hidden">
      <FacebookPixel />
      <TikTokPixel />

      {/* Language switcher */}
      <div className="absolute top-4 right-4 z-20">
        <LocaleSwitcher variant="light" />
      </div>

      <AuthBackground />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        <Link href="/" className="mb-8 inline-block text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
          Qarte
        </Link>

        <div className="w-full max-w-md">
          <div className="p-5 md:p-8 bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl shadow-primary/10 rounded-3xl">
            <div className="text-center mb-5">
              <h1 className="text-2xl font-bold text-gray-900">
                {t('title')}
              </h1>
              <p className="mt-2 text-gray-500 text-sm">
                {t('subtitle')}
              </p>

              {/* Mini stamp card teaser */}
              <div className="mt-4 flex items-center justify-center gap-2">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      i < 5
                        ? 'bg-gradient-to-br from-primary to-secondary text-white shadow-sm shadow-primary/20'
                        : 'relative border-2 border-dashed border-primary/30 text-primary/40 overflow-hidden'
                    }`}
                  >
                    {i < 5 ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <>
                        <Gift className="w-3.5 h-3.5 relative z-10" />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-[shimmer_2s_infinite] -skew-x-12" />
                      </>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-gray-400">
                {t('clientsWillLove')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-700 bg-red-50 rounded-xl">
                  {error}
                </div>
              )}

              <Input
                ref={nameRef}
                type="text"
                label={t('shopNameLabel')}
                placeholder={t('shopNamePlaceholder')}
                value={formData.shopName}
                onChange={(e) =>
                  setFormData({ ...formData, shopName: e.target.value })
                }
                required
              />

              <Select
                label={t('activityLabel')}
                placeholder={t('activityPlaceholder')}
                options={shopTypeOptions}
                value={formData.shopType}
                onChange={(e) =>
                  setFormData({ ...formData, shopType: e.target.value as ShopType })
                }
                required
              />

              <PhoneInput
                label={t('phoneLabel')}
                value={formData.phone}
                onChange={(phone) => setFormData({ ...formData, phone })}
                country={formData.country}
                onCountryChange={(c) => setFormData({ ...formData, country: c })}
                countries={countryKeys}
                required
              />

              <Button type="submit" loading={loading} className="w-full bg-gradient-to-r from-indigo-600 to-pink-500 hover:from-indigo-700 hover:to-pink-600 shadow-lg shadow-indigo-200/50">
                {t('cta')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </form>

            {/* Reassurance */}
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

            {/* Back link */}
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {t('back')}
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
