'use client';

import { useLocale } from 'next-intl';
import { Globe } from 'lucide-react';
import { usePathname, useRouter } from '@/i18n/navigation';

interface LocaleSwitcherProps {
  /** 'dark' for dark backgrounds (footer), 'light' for white backgrounds (nav, auth) */
  variant?: 'dark' | 'light';
}

export default function LocaleSwitcher({ variant = 'dark' }: LocaleSwitcherProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const toggle = () => {
    const next = locale === 'fr' ? 'en' : 'fr';
    router.replace(pathname, { locale: next });
  };

  const styles = variant === 'light'
    ? 'bg-gray-100 border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300'
    : 'bg-white/10 border-white/20 text-gray-300 hover:text-white hover:border-white/40';

  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors ${styles}`}
      aria-label={locale === 'fr' ? 'Switch to English' : 'Passer en français'}
    >
      <Globe className="w-3.5 h-3.5" />
      {locale === 'fr' ? 'EN' : 'FR'}
    </button>
  );
}
