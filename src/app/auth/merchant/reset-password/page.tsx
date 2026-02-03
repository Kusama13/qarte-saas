'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';
import { CreditCard, Eye, EyeOff, CheckCircle2, Lock } from 'lucide-react';
import { Button, Input } from '@/components/ui';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = getSupabase();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      // Vérifier si l'utilisateur a une session valide (via le lien email)
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setValidSession(true);
      } else {
        // Essayer de récupérer la session depuis les paramètres URL
        const code = searchParams.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) {
            setValidSession(true);
          }
        }
      }
      setChecking(false);
    };

    checkSession();
  }, [supabase, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);

      // Redirection après 3 secondes
      setTimeout(() => {
        router.push('/auth/merchant?reset=success');
      }, 3000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!validSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="max-w-md w-full mx-4">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-900">Qarte</span>
            </Link>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Lien invalide ou expiré
            </h1>
            <p className="text-gray-600 mb-6">
              Ce lien de réinitialisation n&apos;est plus valide.
              Veuillez en demander un nouveau.
            </p>
            <Link href="/auth/merchant/forgot-password">
              <Button className="w-full">
                Demander un nouveau lien
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="max-w-md w-full mx-4">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-900">Qarte</span>
            </Link>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full bg-green-100">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Mot de passe modifié !
            </h1>
            <p className="text-gray-600 mb-6">
              Votre mot de passe a été mis à jour avec succès.
              Vous allez être redirigé vers la page de connexion...
            </p>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-bold text-gray-900">Qarte</span>
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Nouveau mot de passe
            </h1>
            <p className="text-gray-600">
              Choisissez un nouveau mot de passe sécurisé
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                label="Nouveau mot de passe"
                placeholder="Minimum 8 caractères"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                disabled={loading}
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
                type={showPassword ? 'text' : 'password'}
                label="Confirmer le mot de passe"
                placeholder="Répétez le mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                disabled={loading}
              />
              <Lock className="absolute w-5 h-5 text-gray-400 right-4 top-10" />
            </div>

            <Button type="submit" loading={loading} className="w-full">
              Modifier le mot de passe
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
