'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { Menu, X, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui';
import { useTranslations } from 'next-intl';

interface HeaderProps {
  minimal?: boolean;
}

export function Header({ minimal = false }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const t = useTranslations('nav');

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
      <nav className="px-4 mx-auto max-w-7xl">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Qarte</span>
          </Link>

          {!minimal && (
            <>
              <div className="hidden md:flex md:items-center md:gap-8">
                <a
                  href="#pricing"
                  className="text-gray-600 transition-colors hover:text-primary"
                >
                  {t('pricing')}
                </a>
                <Link
                  href="/contact"
                  className="text-gray-600 transition-colors hover:text-primary"
                >
                  {t('contact')}
                </Link>
                <Link href="/auth/merchant">
                  <Button variant="outline" size="sm">
                    {t('proSpace')}
                  </Button>
                </Link>
              </div>

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 md:hidden"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? (
                  <X className="w-6 h-6 text-gray-900" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-900" />
                )}
              </button>
            </>
          )}
        </div>

        {!minimal && isMenuOpen && (
          <div className="py-4 border-t border-gray-100 md:hidden">
            <div className="flex flex-col gap-4">
              <a
                href="#pricing"
                onClick={() => setIsMenuOpen(false)}
                className="px-4 py-2 text-gray-600 transition-colors hover:text-primary"
              >
                {t('pricing')}
              </a>
              <Link
                href="/contact"
                onClick={() => setIsMenuOpen(false)}
                className="px-4 py-2 text-gray-600 transition-colors hover:text-primary"
              >
                {t('contact')}
              </Link>
              <Link
                href="/auth/merchant"
                onClick={() => setIsMenuOpen(false)}
                className="px-4 py-2 text-gray-600 transition-colors hover:text-primary"
              >
                {t('proSpace')}
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
