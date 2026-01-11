'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-gray-200 shadow-lg md:p-6">
      <div className="flex flex-col gap-4 mx-auto max-w-4xl md:flex-row md:items-center md:justify-between">
        <div className="flex-1 pr-8">
          <p className="text-sm text-gray-600">
            Ce site utilise uniquement des cookies essentiels pour son fonctionnement
            (authentification, préférences). Aucun cookie publicitaire n&apos;est utilisé.{' '}
            <Link
              href="/politique-confidentialite"
              className="text-primary hover:underline"
            >
              En savoir plus
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={acceptCookies}
            className="px-6 py-2.5 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary-600 transition-colors"
          >
            Accepter
          </button>
        </div>
        <button
          onClick={acceptCookies}
          className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 md:hidden"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
