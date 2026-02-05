'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Check,
} from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { getSupabase } from '@/lib/supabase';
import { validateEmail } from '@/lib/utils';
import { trackPageView, trackSignupStarted } from '@/lib/analytics';
import { FacebookPixel, fbEvents } from '@/components/FacebookPixel';

export default function MerchantSignupPage() {
  const router = useRouter();
  const supabase = getSupabase();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Track page view
  useEffect(() => {
    trackPageView('signup_page');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Track signup started
    trackSignupStarted('email');

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

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
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
        // Track Facebook Pixel Lead event (Phase 1 completed)
        fbEvents.lead();

        // Redirect to Phase 2 (complete profile)
        router.push('/auth/merchant/signup/complete');
      } else {
        setError('Erreur lors de la création du compte. Veuillez réessayer.');
      }
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

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
              <span className="inline-block px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full mb-3">
                Étape 1 sur 2
              </span>
              <h1 className="text-2xl font-bold text-gray-900">
                Créer votre compte
              </h1>
              <p className="mt-2 text-gray-600">
                Commencez votre essai gratuit de 15 jours
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

              <Button type="submit" loading={loading} className="w-full">
                Continuer
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </form>

            <div className="mt-6 space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-500" />
                <span>Essai gratuit 15 jours</span>
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
