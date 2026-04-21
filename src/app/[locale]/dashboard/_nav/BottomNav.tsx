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

export default function BottomNav({ onOpenMore, moreOpen }: BottomNavProps) {
  const pathname = usePathname();
  const t = useTranslations('navShort');
  const { merchant } = useMerchant();
  const kbVisible = useVirtualKeyboardVisible();

  if (kbVisible) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t border-gray-100 pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_8px_rgba(0,0,0,0.04)]"
      aria-label="Navigation principale"
    >
      <div className="flex items-stretch justify-around h-[60px] max-w-lg mx-auto">
        {PRIMARY_ITEMS.map((item) => {
          const active = pathname === item.href;
          const locked = item.locked?.(merchant) ?? false;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center justify-center flex-1 gap-0.5 touch-manipulation transition-all active:scale-95',
                active ? 'text-indigo-600' : 'text-gray-400'
              )}
              aria-current={active ? 'page' : undefined}
            >
              {/* Indicateur actif : barre gradient en haut */}
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full bg-gradient-to-r from-indigo-600 to-violet-600" />
              )}
              <div className="relative">
                <Icon
                  className={cn(
                    'w-[22px] h-[22px] transition-transform',
                    active && 'drop-shadow-[0_2px_4px_rgba(79,70,229,0.25)]'
                  )}
                  strokeWidth={active ? 2.25 : 2}
                />
                {locked && (
                  <Lock className="absolute -top-1 -right-1.5 w-3 h-3 text-gray-400 bg-white rounded-full" />
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] leading-none transition-all',
                  active ? 'font-bold text-indigo-600' : 'font-medium text-gray-500'
                )}
              >
                {t(item.shortLabelKey as 'home')}
              </span>
            </Link>
          );
        })}

        <button
          onClick={onOpenMore}
          aria-label={t('more')}
          aria-expanded={moreOpen}
          className={cn(
            'relative flex flex-col items-center justify-center flex-1 gap-0.5 touch-manipulation transition-all active:scale-95',
            moreOpen ? 'text-indigo-600' : 'text-gray-400'
          )}
        >
          {moreOpen && (
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full bg-gradient-to-r from-indigo-600 to-violet-600" />
          )}
          <MoreHorizontal
            className={cn(
              'w-[22px] h-[22px] transition-transform',
              moreOpen && 'drop-shadow-[0_2px_4px_rgba(79,70,229,0.25)]'
            )}
            strokeWidth={moreOpen ? 2.25 : 2}
          />
          <span
            className={cn(
              'text-[10px] leading-none transition-all',
              moreOpen ? 'font-bold text-indigo-600' : 'font-medium text-gray-500'
            )}
          >
            {t('more')}
          </span>
        </button>
      </div>
    </nav>
  );
}
