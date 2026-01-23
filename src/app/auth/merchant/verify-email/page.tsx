'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CreditCard, Mail, CheckCircle2, RefreshCw, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function VerifyEmailPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [checking, setChecking] = useState(false);

  // Récupérer l'email depuis l'URL si disponible
  const email = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('email')
    : null;

  // Fonction pour vérifier si l'utilisateur est maintenant connecté
  const checkEmailConfirmed = useCallback(async (manual = false) => {
    if (manual) setChecking(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // L'utilisateur est maintenant authentifié, rediriger vers le dashboard
        router.push('/dashboard');
        return true;
      }

      // Essayer de rafraîchir la session (au cas où le token existe mais la session n'est pas chargée)
      const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();

      if (refreshedSession) {
        router.push('/dashboard');
        return true;
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      if (manual) setChecking(false);
    }

    return false;
  }, [supabase, router]);

  // Polling automatique toutes les 5 secondes pour détecter la confirmation
  useEffect(() => {
    const interval = setInterval(() => {
      checkEmailConfirmed(false);
    }, 5000);

    // Vérifier immédiatement au chargement
    checkEmailConfirmed(false);

    return () => clearInterval(interval);
  }, [checkEmailConfirmed]);

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

          {/* Action buttons */}
          <div className="space-y-4 mb-6">
            {/* J'ai confirmé mon email button */}
            <Button
              onClick={() => checkEmailConfirmed(true)}
              disabled={checking}
              className="w-full"
            >
              {checking ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Vérification...
                </>
              ) : (
                <>
                  J'ai confirmé mon email
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>

            {/* Resend button */}
            {email && (
              <div>
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
          </div>

          {/* Auto-check indicator */}
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mb-4">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span>Détection automatique activée</span>
          </div>

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
          <a href="mailto:support@getqarte.com" className="text-primary hover:underline">
            Contactez-nous
          </a>
        </p>
      </div>
    </div>
  );
}
