'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';
import { CreditCard, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { validateEmail } from '@/lib/utils';

export default function ForgotPasswordPage() {
  const supabase = getSupabase();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!validateEmail(email)) {
      setError('Veuillez entrer une adresse email valide');
      setLoading(false);
      return;
    }

    try {
      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback?next=/auth/merchant/reset-password`
        : '/auth/callback?next=/auth/merchant/reset-password';

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (resetError) {
        throw resetError;
      }

      setSuccess(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
              Email envoyé !
            </h1>
            <p className="text-gray-600 mb-6">
              Si un compte existe avec l&apos;adresse <strong>{email}</strong>,
              vous recevrez un lien pour réinitialiser votre mot de passe.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Pensez à vérifier vos spams si vous ne voyez pas l&apos;email.
            </p>
            <Link href="/auth/merchant">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à la connexion
              </Button>
            </Link>
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
              Mot de passe oublié ?
            </h1>
            <p className="text-gray-600">
              Entrez votre email pour recevoir un lien de réinitialisation
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
                type="email"
                label="Email"
                placeholder="votre@email.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
              <Mail className="absolute w-5 h-5 text-gray-400 right-4 top-10" />
            </div>

            <Button type="submit" loading={loading} className="w-full">
              Envoyer le lien
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/auth/merchant"
              className="text-sm text-gray-600 hover:text-primary flex items-center justify-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
