'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CreditCard, Mail, CheckCircle2, RefreshCw, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui';
import { getSupabase } from '@/lib/supabase';

export default function VerifyEmailPage() {
  const router = useRouter();
  const supabase = getSupabase();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  // Récupérer l'email depuis l'URL côté client
  useEffect(() => {
    const urlEmail = new URLSearchParams(window.location.search).get('email');
    setEmail(urlEmail);
  }, []);

  // Vérifier si l'utilisateur a déjà une session (cas où il a confirmé sur le même appareil)
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
      }
    };
    checkSession();

    // Écouter les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: { user?: { id: string } } | null) => {
      if (event === 'SIGNED_IN' && session) {
        router.push('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  // Rediriger vers la page de connexion avec l'email pré-rempli
  const handleGoToLogin = () => {
    if (email) {
      router.push(`/auth/merchant?email=${encodeURIComponent(email)}`);
    } else {
      router.push('/auth/merchant');
    }
  };

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
              onClick={handleGoToLogin}
              className="w-full"
            >
              J'ai confirmé mon email
              <ArrowRight className="w-5 h-5 ml-2" />
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
