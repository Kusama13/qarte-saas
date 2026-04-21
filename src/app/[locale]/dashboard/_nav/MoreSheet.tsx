'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { LogOut, Lock, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SECONDARY_ITEMS } from './nav-config';
import { useMerchant } from '@/contexts/MerchantContext';
import { getPlanTier } from '@/lib/plan-tiers';
import { getTrialStatus } from '@/lib/utils';
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

  const trialStatus = getTrialStatus(
    merchant?.trial_ends_at || null,
    merchant?.subscription_status || 'trial'
  );
  const isPaid = merchant?.subscription_status === 'active' || merchant?.subscription_status === 'canceling';
  const tier = merchant ? getPlanTier(merchant) : null;

  const tierLabel = isPaid && tier
    ? tier === 'fidelity' ? 'Plan Cœur' : 'Plan Pro'
    : trialStatus.isActive
      ? (locale === 'en' ? `Trial · J-${trialStatus.daysRemaining}` : `Essai · J-${trialStatus.daysRemaining}`)
      : null;

  return (
    <AnimatePresence mode="wait">
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0, pointerEvents: 'none' }}
            animate={{ opacity: 1, pointerEvents: 'auto' }}
            exit={{ opacity: 0, pointerEvents: 'none' }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-slate-900/30 lg:hidden"
            onClick={onClose}
          />

          {/* Floating sheet — moitie droite, marges, ombre teintee violet */}
          <motion.div
            key="sheet"
            initial={{ opacity: 0, y: 20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 20, x: 20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 60 || info.velocity.y > 400) onClose();
            }}
            className="fixed bottom-2 right-2 z-50 lg:hidden w-[52%] max-w-[280px] min-w-[230px] bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-900/10 pb-[env(safe-area-inset-bottom)] overflow-hidden"
            aria-label={tSheet('title')}
          >
            {/* Drag handle — discret */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-8 h-[3px] rounded-full bg-slate-200" />
            </div>

            {/* Header — aligne gauche, avatar puis texte */}
            <div className="flex items-center gap-3 px-4 pt-2 pb-3">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-[#4b0082] flex items-center justify-center overflow-hidden">
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
                  <span className="text-[15px] font-bold text-white tracking-tight">
                    {merchant?.shop_name?.charAt(0) || 'M'}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-slate-900 truncate tracking-tight leading-tight">
                  {merchant?.shop_name}
                </p>
                {tierLabel && (
                  <p className="text-[11px] font-medium text-violet-700 mt-0.5 truncate">{tierLabel}</p>
                )}
              </div>
            </div>

            <div className="h-px bg-slate-100 mx-4" />

            {/* Liste flat — icones monochromes, accent violet a l'interaction */}
            <nav className="px-2 py-2">
              {SECONDARY_ITEMS.map((item) => {
                const locked = item.locked?.(merchant) ?? false;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className="group flex items-center gap-3 px-2.5 py-2.5 rounded-lg active:bg-slate-100 transition-colors touch-manipulation"
                  >
                    <Icon className={cn('w-[18px] h-[18px] shrink-0', item.color)} strokeWidth={2} />
                    <span className="flex-1 text-[14px] font-medium text-slate-800 tracking-tight truncate">
                      {t(item.labelKey as 'home')}
                    </span>
                    {locked && <Lock className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
                  </Link>
                );
              })}

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="group flex items-center gap-3 px-2.5 py-2.5 rounded-lg active:bg-slate-100 transition-colors touch-manipulation"
              >
                <MessageCircle className="w-[18px] h-[18px] text-green-500 shrink-0" strokeWidth={2} />
                <span className="flex-1 text-[14px] font-medium text-slate-800 tracking-tight truncate">
                  {tSheet('help')}
                </span>
              </a>
            </nav>

            <div className="h-px bg-slate-100 mx-4" />

            {/* Logout — avec label, gris, discret (pas anxiogene) */}
            <div className="px-2 py-2">
              <button
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg active:bg-red-50 transition-colors touch-manipulation"
              >
                <LogOut className="w-[18px] h-[18px] text-slate-400 shrink-0" strokeWidth={2} />
                <span className="text-[14px] font-medium text-slate-600 tracking-tight">
                  {tSheet('logout')}
                </span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
