'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { LogOut, Lock, X, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SECONDARY_ITEMS } from './nav-config';
import { useMerchant } from '@/contexts/MerchantContext';
import { getPlanTier } from '@/lib/plan-tiers';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

interface MoreSheetProps {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export default function MoreSheet({ open, onClose, onLogout }: MoreSheetProps) {
  const t = useTranslations('dashNav');
  const tSheet = useTranslations('moreSheet');
  const locale = useLocale();
  const { merchant } = useMerchant();

  useBodyScrollLock(open);

  const whatsappUrl = `https://wa.me/33607447420?text=${encodeURIComponent(
    locale === 'en' ? 'Hi, I need help with Qarte' : "Bonjour, j'ai besoin d'aide avec Qarte"
  )}`;

  const isPaid = merchant?.subscription_status === 'active' || merchant?.subscription_status === 'canceling';
  const tier = merchant ? getPlanTier(merchant) : null;

  return (
    <AnimatePresence mode="wait">
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0, pointerEvents: 'none' }}
            animate={{ opacity: 1, pointerEvents: 'auto' }}
            exit={{ opacity: 0, pointerEvents: 'none' }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 lg:hidden"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 500) onClose();
            }}
            className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col pb-[env(safe-area-inset-bottom)]"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-2 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>

            {/* Header : logo + shop name + badge tier */}
            <div className="px-5 pt-3 pb-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-200/40 flex items-center justify-center overflow-hidden">
                  {merchant?.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={merchant.logo_url}
                      alt={merchant.shop_name || ''}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.textContent = merchant?.shop_name?.charAt(0) || 'M';
                      }}
                    />
                  ) : (
                    <span className="text-base font-black text-white">
                      {merchant?.shop_name?.charAt(0) || 'M'}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{merchant?.shop_name}</p>
                  {isPaid && tier && (
                    <span
                      className={cn(
                        'inline-block mt-0.5 text-[10px] font-black tracking-wider px-2 py-0.5 rounded-full text-white shadow-sm',
                        tier === 'fidelity'
                          ? 'bg-gradient-to-r from-rose-500 to-pink-500'
                          : 'bg-gradient-to-r from-indigo-600 to-violet-600'
                      )}
                    >
                      {tier === 'fidelity' ? 'CŒUR' : 'PRO'}
                    </span>
                  )}
                </div>
                <button
                  onClick={onClose}
                  aria-label={t('closeMenu')}
                  className="shrink-0 p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors touch-manipulation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Nav items */}
            <div className="flex-1 overflow-y-auto px-3 py-3">
              <div className="space-y-1">
                {SECONDARY_ITEMS.map((item) => {
                  const locked = item.locked?.(merchant) ?? false;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors touch-manipulation text-gray-700 active:bg-gray-100"
                    >
                      <div className={cn('flex items-center justify-center w-9 h-9 rounded-lg shrink-0', item.bg)}>
                        <Icon className={cn('w-4 h-4', item.color)} />
                      </div>
                      <span className="font-medium text-sm flex-1">{t(item.labelKey as 'home')}</span>
                      {locked && <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
                    </Link>
                  );
                })}
              </div>

              {/* Support section */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                  {tSheet('supportSection')}
                </p>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors touch-manipulation text-gray-700 active:bg-gray-100"
                >
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0 bg-green-50">
                    <MessageCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <span className="font-medium text-sm">{tSheet('help')}</span>
                </a>
              </div>

              {/* Account section */}
              <div className="mt-4 pt-4 border-t border-gray-100 mb-2">
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                  {tSheet('accountSection')}
                </p>
                <button
                  onClick={() => {
                    onClose();
                    onLogout();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors touch-manipulation text-red-600 active:bg-red-50"
                >
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0 bg-red-50">
                    <LogOut className="w-4 h-4 text-red-500" />
                  </div>
                  <span className="font-medium text-sm">{tSheet('logout')}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
