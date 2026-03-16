import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <span className="text-8xl font-bold text-primary">404</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Page introuvable
        </h1>

        <p className="text-gray-600 mb-8">
          D&eacute;sol&eacute;, la page que vous recherchez n&apos;existe pas ou a &eacute;t&eacute; d&eacute;plac&eacute;e.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors"
          >
            <Home className="w-4 h-4" />
            Retour &agrave; l&apos;accueil
          </Link>

          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Nous contacter
          </Link>
        </div>
      </div>
    </div>
  );
}
