'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  Shield,
  Gift,
} from 'lucide-react';
import { Button, Input, Select } from '@/components/ui';
import { getSupabase } from '@/lib/supabase';
import { formatPhoneNumber, validatePhone, PHONE_CONFIG } from '@/lib/utils';
import { SHOP_TYPES, type ShopType, COUNTRIES, type MerchantCountry } from '@/types';
import { trackPageView, trackSetupCompleted, trackSignupCompleted } from '@/lib/analytics';
import { FacebookPixel, fbEvents } from '@/components/analytics/FacebookPixel';
import { TikTokPixel, ttEvents, ttIdentify } from '@/components/analytics/TikTokPixel';

const shopTypeOptions = Object.entries(SHOP_TYPES).map(([value, label]) => ({
  value,
  label,
}));

const countryOptions = Object.entries(COUNTRIES).map(([value, label]) => ({
  value,
  label,
}));

export default function CompleteProfilePage() {
  const router = useRouter();
  const supabase = getSupabase();
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
    country: 'FR' as MerchantCountry,
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
      setError('Veuillez entrer un numéro de téléphone valide');
      setLoading(false);
      return;
    }

    if (!formData.shopType) {
      setError('Veuillez sélectionner un type de commerce');
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
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Merchant creation error:', result.error);
        setError('Erreur lors de la création du profil: ' + result.error);
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

      // Redirect to program config
      window.location.href = '/dashboard/program';
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-pink-50">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 relative overflow-hidden">
      <FacebookPixel />
      <TikTokPixel />

      {/* Background decorative blobs — blue/pink */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/25 to-purple-400/20 rounded-full blur-3xl -translate-x-1/3 -translate-y-1/3" />
      <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-gradient-to-br from-pink-400/25 to-rose-300/20 rounded-full blur-3xl translate-x-1/4" />
      <div className="absolute bottom-0 left-1/3 w-[350px] h-[350px] bg-gradient-to-br from-violet-400/15 to-pink-400/20 rounded-full blur-3xl translate-y-1/4" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        <Link href="/" className="mb-8 inline-block text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
          Qarte
        </Link>

        <div className="w-full max-w-md">
          <div className="p-5 md:p-8 bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl shadow-primary/10 rounded-3xl">
            <div className="text-center mb-5">
              <h1 className="text-2xl font-bold text-gray-900">
                Créez votre carte de fidélité
              </h1>
              <p className="mt-2 text-gray-500 text-sm">
                3 infos et c&apos;est parti
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
                Vos clients vont adorer
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
                label="Votre établissement"
                placeholder="Ex: Institut Beauté Marie"
                value={formData.shopName}
                onChange={(e) =>
                  setFormData({ ...formData, shopName: e.target.value })
                }
                required
              />

              <Select
                label="Activité"
                placeholder="Sélectionnez..."
                options={shopTypeOptions}
                value={formData.shopType}
                onChange={(e) =>
                  setFormData({ ...formData, shopType: e.target.value as ShopType })
                }
                required
              />

              <div className="grid grid-cols-[120px_1fr] gap-2">
                <Select
                  label="Pays"
                  options={countryOptions}
                  value={formData.country}
                  onChange={(e) =>
                    setFormData({ ...formData, country: e.target.value as MerchantCountry })
                  }
                  required
                />
                <Input
                  type="tel"
                  label="Téléphone"
                  placeholder={PHONE_CONFIG[formData.country].placeholder}
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  required
                />
              </div>

              <Button type="submit" loading={loading} className="w-full bg-gradient-to-r from-indigo-600 to-pink-500 hover:from-indigo-700 hover:to-pink-600 shadow-lg shadow-indigo-200/50">
                Lancer mon essai gratuit
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </form>

            {/* Reassurance */}
            <div className="mt-4 flex items-center justify-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                Sans carte bancaire
              </span>
              <span>·</span>
              <span>Annulation en 1 clic</span>
            </div>

            {/* Back link */}
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Retour
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
