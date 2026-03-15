'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service (Sentry, etc.)
    // For now, we just log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Application error:', error);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
          <AlertTriangle className="w-10 h-10 text-red-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Une erreur est survenue
        </h1>

        <p className="text-gray-600 mb-8">
          Nous sommes d&eacute;sol&eacute;s, quelque chose s&apos;est mal pass&eacute;.
          Veuillez r&eacute;essayer ou retourner &agrave; l&apos;accueil.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={reset}
            className="inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            R&eacute;essayer
          </Button>

          <Link href="/">
            <Button variant="outline" className="inline-flex items-center gap-2 w-full sm:w-auto">
              <Home className="w-4 h-4" />
              Retour &agrave; l&apos;accueil
            </Button>
          </Link>
        </div>

        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg text-left">
            <p className="text-xs font-mono text-gray-600 break-all">
              {error.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
