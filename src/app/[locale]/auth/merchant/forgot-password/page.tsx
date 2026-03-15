'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';
import { CreditCard, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { validateEmail } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export default function ForgotPasswordPage() {
  const t = useTranslations('forgotPassword');
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
      setError(t('invalidEmail'));
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
              {t('successTitle')}
            </h1>
            <p className="text-gray-600 mb-6">
              {t('successMsg')} <strong>{email}</strong>, {t('successMsg2')}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              {t('checkSpam')}
            </p>
            <Link href="/auth/merchant">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('backToLogin')}
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
              {t('title')}
            </h1>
            <p className="text-gray-600">
              {t('subtitle')}
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
                label={t('emailLabel')}
                placeholder={t('emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
              <Mail className="absolute w-5 h-5 text-gray-400 right-4 top-10" />
            </div>

            <Button type="submit" loading={loading} className="w-full">
              {t('cta')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/auth/merchant"
              className="text-sm text-gray-600 hover:text-primary flex items-center justify-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
