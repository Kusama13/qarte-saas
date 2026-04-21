'use client';

import { usePathname, Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { MoreHorizontal, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PRIMARY_ITEMS } from './nav-config';
import { useVirtualKeyboardVisible } from '@/hooks/useVirtualKeyboardVisible';
import { useMerchant } from '@/contexts/MerchantContext';

interface BottomNavProps {
  onOpenMore: () => void;
  moreOpen: boolean;
}

// Couleurs sémantiques toujours visibles (inactif = tone légèrement estompé, actif = tone plein + bold)
const TAB_COLORS: Record<string, { inactive: string; active: string; dot: string; label: string }> = {
  '/dashboard': {
    inactive: 'text-indigo-400',
    active: 'text-indigo-600',
    dot: 'bg-indigo-500',
    label: 'text-indigo-600',
  },
  '/dashboard/planning': {
    inactive: 'text-cyan-400',
    active: 'text-cyan-600',
    dot: 'bg-cyan-500',
    label: 'text-cyan-600',
  },
  '/dashboard/customers': {
    inactive: 'text-emerald-400',
    active: 'text-emerald-600',
    dot: 'bg-emerald-500',
    label: 'text-emerald-600',
  },
  '/dashboard/qr-download': {
    inactive: 'text-violet-400',
    active: 'text-violet-600',
    dot: 'bg-violet-500',
    label: 'text-violet-600',
  },
};

const PLUS_COLORS = {
  inactive: 'text-slate-500',
  active: 'text-violet-600',
  dot: 'bg-gradient-to-r from-indigo-500 to-violet-500',
  label: 'text-violet-600',
};

const triggerHaptic = () => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate?.(8);
};

export default function BottomNav({ onOpenMore, moreOpen }: BottomNavProps) {
  const pathname = usePathname();
  const t = useTranslations('navShort');
  const { merchant } = useMerchant();
  const kbVisible = useVirtualKeyboardVisible();

  if (kbVisible) return null;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200/80 pb-[env(safe-area-inset-bottom)] pt-2"
      aria-label="Navigation principale"
    >
      <div className="grid grid-cols-5 max-w-lg mx-auto">
        {PRIMARY_ITEMS.map((item) => {
          const active = pathname === item.href;
          const locked = item.locked?.(merchant) ?? false;
          const Icon = item.icon;
          const c = TAB_COLORS[item.href];

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={triggerHaptic}
              className="flex flex-col items-center justify-center gap-1 py-1.5 min-h-[56px] active:scale-95 transition-transform touch-manipulation"
              aria-current={active ? 'page' : undefined}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    'w-6 h-6 transition-colors duration-200',
                    active ? c.active : c.inactive
                  )}
                  strokeWidth={active ? 2.4 : 2}
                />
                {locked && (
                  <Lock className="absolute -top-1 -right-1.5 w-3 h-3 text-slate-400 bg-white rounded-full" />
                )}
              </div>
              <span
                className={cn(
                  'text-[11px] leading-none transition-colors duration-200',
                  active ? cn('font-bold', c.label) : 'font-medium text-slate-500'
                )}
              >
                {t(item.shortLabelKey as 'home')}
              </span>
              <span
                className={cn(
                  'w-1 h-1 rounded-full transition-all duration-200',
                  active ? cn('scale-100', c.dot) : 'scale-0 bg-transparent'
                )}
              />
            </Link>
          );
        })}

        <button
          onClick={() => {
            triggerHaptic();
            onOpenMore();
          }}
          aria-label={t('more')}
          aria-expanded={moreOpen}
          className="flex flex-col items-center justify-center gap-1 py-1.5 min-h-[56px] active:scale-95 transition-transform touch-manipulation"
        >
          <MoreHorizontal
            className={cn(
              'w-6 h-6 transition-colors duration-200',
              moreOpen ? PLUS_COLORS.active : PLUS_COLORS.inactive
            )}
            strokeWidth={moreOpen ? 2.4 : 2}
          />
          <span
            className={cn(
              'text-[11px] leading-none transition-colors duration-200',
              moreOpen ? cn('font-bold', PLUS_COLORS.label) : 'font-medium text-slate-500'
            )}
          >
            {t('more')}
          </span>
          <span
            className={cn(
              'w-1 h-1 rounded-full transition-all duration-200',
              moreOpen ? cn('scale-100', PLUS_COLORS.dot) : 'scale-0 bg-transparent'
            )}
          />
        </button>
      </div>
    </nav>
  );
}
