'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CreditCard, Mail, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function VerifyEmailPage() {
  const supabase = createClientComponentClient();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  // Récupérer l'email depuis l'URL si disponible
  const email = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('email')
    : null;

  const handleResend = async () => {
    if (!email) return;

    setResending(true);
    try {
      await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    } catch (error) {
      console.error('Error resending email:', error);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-bold text-gray-900">Qarte</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
          {/* Icon */}
          <div className="mx-auto w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mb-6">
            <Mail className="w-10 h-10 text-primary" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Vérifiez votre email
          </h1>

          {/* Description */}
          <p className="text-gray-600 mb-6">
            Nous avons envoyé un lien de confirmation à
            {email && (
              <span className="block font-semibold text-gray-900 mt-1">
                {email}
              </span>
            )}
          </p>

          {/* Instructions */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-6 text-left">
            <p className="text-sm text-gray-600 mb-4">
              Pour activer votre compte :
            </p>
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </span>
                <span className="text-sm text-gray-700">
                  Ouvrez votre boîte mail
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </span>
                <span className="text-sm text-gray-700">
                  Cliquez sur le lien dans l'email de Qarte
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </span>
                <span className="text-sm text-gray-700">
                  Connectez-vous avec vos identifiants
                </span>
              </li>
            </ol>
          </div>

          {/* Resend button */}
          {email && (
            <div className="mb-6">
              {resent ? (
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-medium">Email renvoyé !</span>
                </div>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="text-sm text-gray-500 hover:text-primary transition-colors inline-flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
                  {resending ? 'Envoi en cours...' : 'Renvoyer l\'email'}
                </button>
              )}
            </div>
          )}

          {/* Spam notice */}
          <p className="text-xs text-gray-400 mb-6">
            Vous ne trouvez pas l'email ? Vérifiez vos spams.
          </p>

          {/* Login link */}
          <Link href="/auth/merchant">
            <Button variant="outline" className="w-full">
              Retour à la connexion
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Besoin d'aide ?{' '}
          <a href="mailto:support@qarte.app" className="text-primary hover:underline">
            Contactez-nous
          </a>
        </p>
      </div>
    </div>
  );
}
