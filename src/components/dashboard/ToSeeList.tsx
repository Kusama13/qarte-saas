'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ChevronRight, Cake, UserPlus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const ICONS = {
  cake: Cake,
  userPlus: UserPlus,
  sparkles: Sparkles,
};

const ICON_COLORS: Record<keyof typeof ICONS, string> = {
  cake: 'text-pink-500',
  userPlus: 'text-blue-500',
  sparkles: 'text-amber-500',
};

export interface ToSeeItem {
  key: string;
  icon: keyof typeof ICONS;
  label: string;
  count?: number;
  href: string;
}

interface Props {
  items: ToSeeItem[];
}

export default function ToSeeList({ items }: Props) {
  const t = useTranslations('toSee');
  if (items.length === 0) return null;

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <h2 className="text-sm font-bold text-slate-900">{t('title')}</h2>
        <span className="text-[10px] font-bold text-slate-400 tabular-nums">{items.length}</span>
      </div>
      <ul className="divide-y divide-slate-100">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 active:bg-slate-50 transition-colors touch-manipulation"
              >
                <Icon className={cn('w-4 h-4 shrink-0', ICON_COLORS[item.icon])} strokeWidth={2} />
                <span className="flex-1 text-[14px] font-medium text-slate-800 truncate">
                  {item.label}
                </span>
                {item.count != null && (
                  <span className="shrink-0 text-[11px] font-bold tabular-nums px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                    {item.count}
                  </span>
                )}
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
