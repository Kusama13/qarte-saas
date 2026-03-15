'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  CreditCard,
  Home,
  Gift,
  Globe,
  QrCode,
  Users,
  Wallet,
  Settings,
  LogOut,
  Menu,
  X,
  Megaphone,
  UserPlus,
  CalendarDays,
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { getTrialStatus } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { MerchantProvider, useMerchant } from '@/contexts/MerchantContext';
import InstallAppBanner from '@/components/dashboard/InstallAppBanner';
import AdminAnnouncementBanner from '@/components/dashboard/AdminAnnouncementBanner';
import StatusBanner from '@/components/dashboard/StatusBanner';


function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = getSupabase();
  const { merchant, loading } = useMerchant();
  const t = useTranslations('dashNav');

  const navItems = [
    { href: '/dashboard', icon: Home, label: t('home'), color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { href: '/dashboard/program', icon: Gift, label: t('program'), color: 'text-pink-500', bg: 'bg-pink-50' },
    { href: '/dashboard/public-page', icon: Globe, label: t('publicPage'), color: 'text-violet-500', bg: 'bg-violet-50' },
    { href: '/dashboard/qr-download', icon: QrCode, label: t('qrCode'), color: 'text-violet-500', bg: 'bg-violet-50' },
    { href: '/dashboard/planning', icon: CalendarDays, label: t('planning'), color: 'text-cyan-500', bg: 'bg-cyan-50' },
    { href: '/dashboard/customers', icon: Users, label: t('customers'), color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { href: '/dashboard/referrals', icon: UserPlus, label: t('referrals'), color: 'text-blue-500', bg: 'bg-blue-50' },
    { href: '/dashboard/marketing', icon: Megaphone, label: t('notifications'), color: 'text-orange-500', bg: 'bg-orange-50' },
    { href: '/dashboard/subscription', icon: Wallet, label: t('subscription'), color: 'text-teal-500', bg: 'bg-teal-50' },
    { href: '/dashboard/settings', icon: Settings, label: t('settings'), color: 'text-slate-500', bg: 'bg-slate-50' },
  ];
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => { setHasMounted(true); }, []);

  // Swipe-to-close
  const SWIPE_CLOSE_THRESHOLD = 60;
  const touchStartX = useRef(0);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > SWIPE_CLOSE_THRESHOLD) setSidebarOpen(false);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/merchant');
  };

  // Compute trial status + useEffect BEFORE any early return to preserve hooks order (React #310)
  const trialStatus = getTrialStatus(
    merchant?.trial_ends_at || null,
    merchant?.subscription_status || 'trial'
  );

  const shouldRedirect = !loading
    && (trialStatus.isInGracePeriod || trialStatus.isFullyExpired)
    && pathname !== '/dashboard/subscription';

  // Redirection forcée dès la fin de l'essai (grâce ou expiration complète)
  useEffect(() => {
    if (shouldRedirect) {
      router.push('/dashboard/subscription');
    }
  }, [shouldRedirect, router]);


  if (!hasMounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (shouldRedirect) {
    return null;
  }

  if (pathname === '/dashboard/setup') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <button
        onClick={() => setSidebarOpen(true)}
        aria-label={t('openMenu')}
        className="fixed z-40 flex items-center gap-1.5 px-3 py-2 bg-white/90 backdrop-blur-xl border border-gray-100 rounded-xl shadow-lg top-3 left-3 lg:hidden hover:scale-105 active:scale-95 transition-all duration-200"
      >
        <Menu className="w-5 h-5 text-indigo-600" />
        <span className="text-sm font-medium text-indigo-600">{t('menu')}</span>
      </button>

      {/* Backdrop — always rendered, animated opacity */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/40 lg:hidden transition-opacity duration-300',
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={cn(
          'fixed top-0 left-0 z-50 w-[270px] lg:w-72 h-full bg-white/95 backdrop-blur-xl border-r border-gray-100/50 transition-transform duration-300 lg:translate-x-0 shadow-xl shadow-gray-200/20',
          'pt-[env(safe-area-inset-top)]',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-5 py-4 lg:px-6 lg:py-5 border-b border-gray-100/50 bg-white/40 backdrop-blur-md sticky top-0 z-10">
            <Link href="/dashboard" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 group">
              <div className="flex items-center justify-center w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-200/40 transition-transform group-hover:scale-105 duration-200">
                <span className="text-sm lg:text-base font-black text-white">Q</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg lg:text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 leading-none">
                  Qarte
                </span>
                <span className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase leading-none mt-0.5">
                  {t('proSpace')}
                </span>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              aria-label={t('closeMenu')}
              className="p-2 lg:hidden rounded-lg hover:bg-white/80 hover:shadow-sm text-gray-500 transition-all duration-200 active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Banner essai actif */}
          {trialStatus.isActive && (
            <StatusBanner
              variant="trial"
              urgent={trialStatus.daysRemaining <= 3}
              message={trialStatus.daysRemaining > 1 ? t('trialDaysPlural', { count: trialStatus.daysRemaining }) : t('trialDays', { count: trialStatus.daysRemaining })}
              linkText={merchant?.stripe_subscription_id ? t('viewSubscription') : t('addPayment')}
              linkHref="/dashboard/subscription"
              onLinkClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Banner période de grâce - URGENT */}
          {trialStatus.isInGracePeriod && (
            <StatusBanner
              variant="grace"
              message={t('trialExpired')}
              description={t('graceDescription', { days: trialStatus.daysUntilDeletion })}
              linkText={t('subscribeNow')}
              linkHref="/dashboard/subscription"
              onLinkClick={() => setSidebarOpen(false)}
              linkAsButton
            />
          )}

          {/* Banner annulation en cours */}
          {merchant?.subscription_status === 'canceling' && (
            <StatusBanner
              variant="canceling"
              message={t('cancelingBanner')}
              linkText={t('cancelCancellation')}
              linkHref="/dashboard/subscription"
              onLinkClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Banner paiement échoué */}
          {merchant?.subscription_status === 'past_due' && (
            <StatusBanner
              variant="past_due"
              message={t('paymentFailed')}
              linkText={t('updatePayment')}
              linkHref="/dashboard/subscription"
              onLinkClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Annonces admin — sidebar desktop uniquement */}
          <div className="hidden lg:block">
            <AdminAnnouncementBanner variant="sidebar" />
          </div>

          <nav className="flex-1 px-3 py-3 lg:px-4 lg:py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group',
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200/50'
                      : 'text-gray-600 hover:bg-gray-50 hover:translate-x-1'
                  )}
                >
                  <div className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-lg transition-all',
                    isActive ? 'bg-white/20' : item.bg
                  )}>
                    <item.icon className={cn('w-4 h-4', isActive ? 'text-white' : item.color)} />
                  </div>
                  <span className="font-medium flex-1 text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="px-3 py-3 lg:px-4 lg:py-4 border-t border-gray-100/50 bg-gray-50/30">
            <Link
              href="/dashboard/settings"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-2.5 px-2.5 py-2 mb-2 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-center justify-center w-9 h-9 font-bold text-white text-sm rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 shadow-md shadow-indigo-200/50 shrink-0 overflow-hidden">
                {merchant?.logo_url
                  ? <img src={merchant.logo_url} alt={merchant.shop_name || ''} className="w-full h-full object-cover" />
                  : merchant?.shop_name?.charAt(0) || 'M'
                }
              </div>
              <p className="font-semibold text-gray-900 truncate text-sm flex-1 min-w-0 group-hover:text-indigo-600 transition-colors">
                {merchant?.shop_name}
              </p>
              {(merchant?.subscription_status === 'active' || merchant?.subscription_status === 'canceling') && (
                <span className="shrink-0 text-[10px] font-black tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm">
                  PRO
                </span>
              )}
            </Link>
            <div className="flex items-center gap-1">
              <a
                href="https://wa.me/33607447420?text=Bonjour%2C%20j%27ai%20besoin%20d%27aide%20avec%20Qarte"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center flex-1 gap-2 px-3 py-2 text-gray-500 transition-all rounded-lg hover:bg-green-50 group"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-green-500 shrink-0">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="font-medium text-xs group-hover:text-green-700 transition-colors">{t('help')}</span>
              </a>
              <button
                onClick={handleLogout}
                className="flex items-center flex-1 gap-2 px-3 py-2 text-red-500 transition-all rounded-lg hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span className="font-medium text-xs">{t('logout')}</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="lg:ml-72 min-h-screen">
        <div className="px-4 pt-14 pb-20 lg:pt-8 lg:px-8 lg:pb-8">
          {/* Annonces admin — banner mobile uniquement */}
          <div className="lg:hidden">
            <AdminAnnouncementBanner variant="banner" />
          </div>
          {children}
        </div>
      </main>

      <InstallAppBanner />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MerchantProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </MerchantProvider>
  );
}
