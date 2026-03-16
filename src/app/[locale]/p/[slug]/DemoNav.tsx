'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

const DEMOS = [
  { slug: 'demo-onglerie', labelKey: 'nailSalon' as const, emoji: '\u{1F485}' },
  { slug: 'demo-tatouage', labelKey: 'tattoo' as const, emoji: '\u{1F58B}\uFE0F' },
  { slug: 'demo-coiffure', labelKey: 'hairSalon' as const, emoji: '\u2702\uFE0F' },
];

export default function DemoNav({ current }: { current: string }) {
  const t = useTranslations('demoNav');
  return (
    <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm">
      <div className="flex items-center justify-center gap-1 px-3 py-2 max-w-lg mx-auto">
        {DEMOS.map((d) => {
          const active = d.slug === current;
          return (
            <Link
              key={d.slug}
              href={`/p/${d.slug}`}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                active
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
              }`}
            >
              <span>{d.emoji}</span>
              <span>{t(d.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
