'use client';

import { useTranslations } from 'next-intl';

export function SuspendedBanner() {
  const t = useTranslations('common');
  return (
    <div className="sticky top-0 z-50 bg-red-600 text-white text-center py-3 px-4 font-semibold text-sm tracking-wide shadow-lg">
      ⚠️ {t('suspendedBanner')}
    </div>
  );
}
