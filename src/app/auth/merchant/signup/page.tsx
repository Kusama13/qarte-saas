'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Phone,
  Store,
  MapPin,
  Check,
} from 'lucide-react';
import { Button, Input, Select } from '@/components/ui';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { generateSlug, validateFrenchPhone, validateEmail } from '@/lib/utils';
import { SHOP_TYPES, type ShopType } from '@/types';

const shopTypeOptions = Object.entries(SHOP_TYPES).map(([value, label]) => ({
  value,
  label,
}));

export default function MerchantSignupPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    phone: '',
    shopName: '',
    shopType: '' as ShopType | '',
    shopAddress: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!validateEmail(formData.email)) {
      setError('Veuillez entrer une adresse email valide');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      setLoading(false);
      return;
    }

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

    try {
      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : '/auth/callback';

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (signUpError) {
        console.error('Signup error:', signUpError);
        if (signUpError.message.includes('already registered')) {
          setError('Cet email est déjà utilisé');
        } else {
          setError('Erreur lors de la création du compte: ' + signUpError.message);
        }
        return;
      }

      if (authData.user) {
        const slug = generateSlug(formData.shopName);

        // Utiliser l'API route pour créer le marchand (bypass RLS)
        const response = await fetch('/api/merchants/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: authData.user.id,
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

        // Redirection vers la page de vérification email
        window.location.href = `/auth/merchant/verify-email?email=${encodeURIComponent(formData.email)}`;
      }
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
        <Link href="/" className="flex items-center gap-2 mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <span className="text-3xl font-bold text-gray-900">Qarte</span>
        </Link>

        <div className="w-full max-w-md">
          <div className="p-8 bg-white shadow-xl rounded-3xl">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">
                Créer votre compte
              </h1>
              <p className="mt-2 text-gray-600">
                Commencez votre essai gratuit de 14 jours
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
                  type="email"
                  label="Email"
                  placeholder="votre@email.fr"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
                <Mail className="absolute w-5 h-5 text-gray-400 right-4 top-10" />
              </div>

              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  label="Mot de passe"
                  placeholder="Minimum 8 caractères"
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
                  label="Nom de votre commerce"
                  placeholder="Ex: Boulangerie Martin"
                  value={formData.shopName}
                  onChange={(e) =>
                    setFormData({ ...formData, shopName: e.target.value })
                  }
                  required
                />
                <Store className="absolute w-5 h-5 text-gray-400 right-4 top-10" />
              </div>

              <Select
                label="Type de commerce"
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
                  type="text"
                  label="Adresse (optionnel)"
                  placeholder="123 rue du Commerce, Paris"
                  value={formData.shopAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, shopAddress: e.target.value })
                  }
                />
                <MapPin className="absolute w-5 h-5 text-gray-400 right-4 top-10" />
              </div>

              <Button type="submit" loading={loading} className="w-full">
                Créer mon compte
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </form>

            <div className="mt-6 space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-500" />
                <span>Essai gratuit 14 jours</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-500" />
                <span>Configuration en moins d&apos;1 minute</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-500" />
                <span>Support disponible 7j/7</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Déjà un compte ?{' '}
                <Link
                  href="/auth/merchant"
                  className="font-medium text-primary hover:text-primary-600"
                >
                  Se connecter
                </Link>
              </p>
            </div>
          </div>

          <p className="mt-6 text-sm text-center text-gray-500">
            En créant un compte, vous acceptez nos{' '}
            <Link href="/cgv" className="text-primary hover:underline">
              CGV
            </Link>{' '}
            et notre{' '}
            <Link
              href="/politique-confidentialite"
              className="text-primary hover:underline"
            >
              politique de confidentialité
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
