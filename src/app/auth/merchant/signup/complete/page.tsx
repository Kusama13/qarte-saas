'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  Phone,
  Store,
  MapPin,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { Button, Input, Select } from '@/components/ui';
import { getSupabase } from '@/lib/supabase';
import { generateSlug, validateFrenchPhone } from '@/lib/utils';
import { SHOP_TYPES, type ShopType } from '@/types';
import { trackPageView, trackSetupCompleted } from '@/lib/analytics';
import { FacebookPixel, fbEvents } from '@/components/FacebookPixel';

const shopTypeOptions = Object.entries(SHOP_TYPES).map(([value, label]) => ({
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
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    phone: '',
    shopName: '',
    shopType: '' as ShopType | '',
    shopAddress: '',
  });

  // Track page view
  useEffect(() => {
    trackPageView('signup_complete_page');
  }, []);

  // Check auth state - user must be logged in
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        // No auth user, redirect back to signup
        router.replace('/auth/merchant/signup');
        return;
      }

      // Check if merchant already exists (in case user refreshes after completing)
      const response = await fetch('/api/merchants/check', {
        headers: session.access_token
          ? { 'Authorization': `Bearer ${session.access_token}` }
          : {},
      });

      if (response.ok) {
        const data = await response.json();
        if (data.exists) {
          // Merchant already created, go to dashboard
          router.replace('/dashboard');
          return;
        }
      }

      setUserId(session.user.id);
      setAccessToken(session.access_token);
      setCheckingAuth(false);
    };

    checkAuth();
  }, [supabase, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!validateFrenchPhone(formData.phone)) {
      setError('Veuillez entrer un numéro de téléphone français valide');
      setLoading(false);
      return;
    }

    if (!formData.shopType) {
      setError('Veuillez sélectionner un type de commerce');
      setLoading(false);
      return;
    }

    if (!formData.shopAddress || formData.shopAddress.trim().length < 10) {
      setError('Veuillez entrer une adresse complète');
      setLoading(false);
      return;
    }

    try {
      const slug = generateSlug(formData.shopName);

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
          slug,
          shop_name: formData.shopName,
          shop_type: formData.shopType,
          shop_address: formData.shopAddress || null,
          phone: formData.phone,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Merchant creation error:', result.error);
        setError('Erreur lors de la création du profil: ' + result.error);
        return;
      }

      // Track merchant creation + FB CompleteRegistration
      trackSetupCompleted(result.merchant?.id || userId!, formData.shopType || undefined);
      fbEvents.completeRegistration();

      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 relative overflow-hidden">
      <FacebookPixel />

      {/* Background decorative blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute top-1/3 right-0 w-80 h-80 bg-gradient-to-br from-secondary/15 to-primary/15 rounded-full blur-3xl translate-x-1/2" />
      <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-gradient-to-br from-primary/10 to-secondary/20 rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        <Link href="/" className="flex items-center gap-2 mb-8 group">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/25 group-hover:scale-110 transition-transform duration-300">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <span className="text-3xl font-bold text-gray-900">Qarte</span>
        </Link>

        <div className="w-full max-w-md">
          <div className="p-8 bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl shadow-primary/10 rounded-3xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
                Étape 2 sur 2
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Parlez-nous de votre commerce
              </h1>
              <p className="mt-2 text-gray-600">
                Plus que quelques infos pour lancer votre programme
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-4 text-sm text-red-700 bg-red-50 rounded-xl">
                  {error}
                </div>
              )}

              <div className="relative">
                <Input
                  type="text"
                  label="Votre établissement"
                  placeholder="Ex: Institut Beauté Marie"
                  value={formData.shopName}
                  onChange={(e) =>
                    setFormData({ ...formData, shopName: e.target.value })
                  }
                  required
                />
                <Store className="absolute w-5 h-5 text-gray-400 right-4 top-10" />
              </div>

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

              <div className="relative">
                <Input
                  type="tel"
                  label="Téléphone"
                  placeholder="06 12 34 56 78"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  required
                />
                <Phone className="absolute w-5 h-5 text-gray-400 right-4 top-10" />
              </div>

              <div className="relative">
                <Input
                  type="text"
                  label="Adresse"
                  placeholder="123 rue du Commerce, 75001 Paris"
                  value={formData.shopAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, shopAddress: e.target.value })
                  }
                  required
                />
                <MapPin className="absolute w-5 h-5 text-gray-400 right-4 top-10" />
              </div>

              <Button type="submit" loading={loading} className="w-full">
                Lancer mon essai gratuit
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                30 secondes et c&apos;est terminé
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
