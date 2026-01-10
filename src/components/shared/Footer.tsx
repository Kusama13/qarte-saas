import Link from 'next/link';
import { CreditCard } from 'lucide-react';

export function Footer() {
  return (
    <footer className="py-12 bg-gray-50 border-t border-gray-100">
      <div className="px-4 mx-auto max-w-7xl">
        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Qarte</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
            <Link href="/cgv" className="hover:text-primary transition-colors">
              CGV
            </Link>
            <Link href="/politique-confidentialite" className="hover:text-primary transition-colors">
              Politique de confidentialité
            </Link>
            <Link href="/mentions-legales" className="hover:text-primary transition-colors">
              Mentions légales
            </Link>
            <Link
              href="/auth/merchant"
              className="text-primary font-medium hover:text-primary-600 transition-colors"
            >
              Connexion commerçant
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            © 2026 Qarte - Fidélisez mieux, dépensez moins
          </p>
          <p className="mt-4 text-sm text-gray-600 hover:text-primary transition-colors cursor-default">
            🇫🇷 Conçu avec ❤️ en France
          </p>
        </div>
      </div>
    </footer>
  );
}
