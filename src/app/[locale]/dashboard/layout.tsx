'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, Link } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
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
  X,
  Megaphone,
  Bell,
  UserPlus,
  CalendarDays,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { getTrialStatus } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { getPlanFeatures, getPlanTier } from '@/lib/plan-tiers';
import { MerchantProvider, useMerchant } from '@/contexts/MerchantContext';
import { ToastProvider } from '@/components/ui/Toast';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import InstallAppBanner from '@/components/dashboard/InstallAppBanner';
import AdminAnnouncementBanner from '@/components/dashboard/AdminAnnouncementBanner';
import StatusBanner from '@/components/dashboard/StatusBanner';
import NotificationBell from '@/components/dashboard/NotificationBell';
import { useMerchantPushNotifications } from '@/hooks/useMerchantPushNotifications';
import BottomNav from './_nav/BottomNav';
import MoreSheet from './_nav/MoreSheet';

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
  const tp = useTranslations('merchantPush');
  const locale = useLocale();
  const {
    showPrompt: showPushPrompt,
    pushSubscribing,
    pushSubscribed,
    pushError,
    subscribe: subscribePush,
    dismiss: dismissPush,
  } = useMerchantPushNotifications();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [previewDone, setPreviewDone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    const mql = window.matchMedia('(max-width: 1023px)');
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // Ferme la sidebar dès que la route change — garantit qu'un clic sur un item
  // de menu ne laisse pas la sidebar "collée" si le setState ne flush pas avant
  // la navigation (cas PWA/iOS standalone). Defense in depth vs onClick handlers.
  useEffect(() => {
    setSidebarOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  // Body scroll lock via counter shared hook (évite les races avec les autres modaux
  // qui mutent body.style.overflow — cause connue du fige iOS PWA).
  useBodyScrollLock(sidebarOpen);

  const planFeatures = getPlanFeatures(merchant);
  const navItems = [
    { href: '/dashboard', icon: Home, label: t('home'), color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { href: '/dashboard/program', icon: Gift, label: t('program'), color: 'text-pink-500', bg: 'bg-pink-50' },
    { href: '/dashboard/public-page', icon: Globe, label: t('publicPage'), color: 'text-violet-500', bg: 'bg-violet-50' },
    { href: '/dashboard/qr-download', icon: QrCode, label: t('qrCode'), color: 'text-violet-500', bg: 'bg-violet-50' },
    { href: '/dashboard/planning', icon: CalendarDays, label: t('planning'), color: 'text-cyan-500', bg: 'bg-cyan-50', locked: !planFeatures.planning },
    { href: '/dashboard/customers', icon: Users, label: t('customers'), color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { href: '/dashboard/referrals', icon: UserPlus, label: t('referrals'), color: 'text-blue-500', bg: 'bg-blue-50' },
    { href: '/dashboard/marketing', icon: Megaphone, label: t('notifications'), color: 'text-orange-500', bg: 'bg-orange-50' },
    { href: '/dashboard/subscription', icon: Wallet, label: t('subscription'), color: 'text-teal-500', bg: 'bg-teal-50' },
    { href: '/dashboard/settings', icon: Settings, label: t('settings'), color: 'text-slate-500', bg: 'bg-slate-50' },
  ];

  // Check if merchant has tested their card (localStorage flag set on qr-download page)
  useEffect(() => {
    try { setPreviewDone(!!localStorage.getItem('qarte_preview_done')); } catch {}
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

  // Skip is intentionally not persisted — merchant sees survey again until they complete it
  const needsSurvey = trialStatus.isFullyExpired && !merchant?.churn_survey_seen_at;

  const shouldRedirectSurvey = !loading
    && !!merchant
    && needsSurvey
    && pathname !== '/dashboard/survey'
    && pathname !== '/dashboard/subscription';

  const shouldRedirectSubscription = !loading
    && !!merchant
    && (trialStatus.isInGracePeriod || (trialStatus.isFullyExpired && !!merchant.churn_survey_seen_at))
    && pathname !== '/dashboard/subscription'
    && pathname !== '/dashboard/survey';

  // Redirection forcée dès la fin de l'essai (grâce ou expiration complète)
  useEffect(() => {
    if (shouldRedirectSurvey) {
      router.push('/dashboard/survey');
    } else if (shouldRedirectSubscription) {
      router.push('/dashboard/subscription');
    }
  }, [shouldRedirectSurvey, shouldRedirectSubscription, router]);


  if (!hasMounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (shouldRedirectSurvey || shouldRedirectSubscription) {
    return null;
  }

  if (pathname === '/dashboard/setup' || pathname === '/dashboard/survey' || pathname === '/dashboard/personalize') {
    return <>{children}</>;
  }

  const hideDistractions =
    pathname === '/dashboard/subscription' &&
    (trialStatus.isInGracePeriod || trialStatus.isFullyExpired);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar mobile sticky — Qarte brand + NotificationBell, backdrop-blur pour rester lisible au-dessus du contenu qui scrolle */}
      {!hideDistractions && (
        <div className="fixed top-0 left-0 right-0 z-40 lg:hidden bg-white/80 backdrop-blur-lg border-b border-slate-100 pt-[env(safe-area-inset-top)]">
          <div className="flex items-center justify-between px-3 h-12">
            <Link
              href="/dashboard"
              aria-label="Qarte"
              className="active:scale-95 transition-transform touch-manipulation"
            >
              <span className="text-lg font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 leading-none">
                Qarte
              </span>
            </Link>
            <NotificationBell />
          </div>
        </div>
      )}

      {/* Backdrop — conditionally rendered (évite les captures de touch sur iOS PWA où
          pointer-events-none ne flush pas après transition opacity). Perte du fade-out
          acceptée pour garantir que le hamburger ne rate jamais un tap. */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* `inert` désactive hit-test + focus + events sur le subtree quand fermée sur mobile
          (plus fiable que pointer-events-none sur iOS PWA où les transitions peuvent ne pas flush). */}
      <aside
        inert={isMobile && !sidebarOpen ? true : undefined}
        className={cn(
          'fixed top-0 left-0 z-50 w-[270px] lg:w-72 h-full bg-white/95 backdrop-blur-xl border-r border-gray-100/50 transition-transform duration-300 lg:translate-x-0 shadow-xl shadow-gray-200/20',
          'pt-[env(safe-area-inset-top)]',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          sidebarOpen ? 'pointer-events-auto' : 'pointer-events-none lg:pointer-events-auto'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-5 py-4 lg:px-6 lg:py-5 border-b border-gray-100/50 bg-white/40 backdrop-blur-md sticky top-0 z-10">
            <Link href="/dashboard" onClick={() => setSidebarOpen(false)} className="flex items-center group touch-manipulation">
              <div className="flex flex-col">
                <span className="text-2xl lg:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 leading-none">
                  Qarte
                </span>
                <span className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase leading-none mt-1">
                  {t('proSpace')}
                </span>
              </div>
            </Link>
            <div className="flex items-center gap-1">
              <div className="hidden lg:block">
                <NotificationBell />
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                aria-label={t('closeMenu')}
                className="p-2 lg:hidden rounded-lg hover:bg-white/80 hover:shadow-sm text-gray-500 transition-all duration-200 active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Banner essai actif */}
          {trialStatus.isActive && (
            <StatusBanner
              variant="trial"
              severity={trialStatus.daysRemaining <= 1 ? 'urgent' : trialStatus.daysRemaining <= 3 ? 'warning' : 'calm'}
              message={trialStatus.daysRemaining > 1 ? t('trialDaysPlural', { count: trialStatus.daysRemaining }) : t('trialDays', { count: trialStatus.daysRemaining })}
              description={!merchant?.stripe_subscription_id ? t('trialSmsHint') : undefined}
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
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group touch-manipulation',
                    isActive
                      ? 'bg-[#4b0082] text-white'
                      : 'text-gray-600 lg:hover:bg-gray-50 active:bg-gray-100'
                  )}
                >
                  <div className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-lg transition-all',
                    isActive ? 'bg-white/20' : item.bg
                  )}>
                    <item.icon className={cn('w-4 h-4', isActive ? 'text-white' : item.color)} />
                  </div>
                  <span className="font-medium flex-1 text-sm">{item.label}</span>
                  {item.locked && (
                    <Lock className={cn('w-3.5 h-3.5 shrink-0', isActive ? 'text-white/80' : 'text-gray-400')} />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="px-3 py-3 lg:px-4 lg:py-4 border-t border-gray-100/50 bg-gray-50/30">
            <Link
              href="/dashboard/settings"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-2.5 px-2.5 py-2 mb-2 bg-white rounded-xl border border-gray-100 shadow-sm lg:hover:border-indigo-200 lg:hover:shadow-md transition-all duration-200 group touch-manipulation"
            >
              <div className="flex items-center justify-center w-9 h-9 font-bold text-white text-sm rounded-lg bg-[#4b0082] shrink-0 overflow-hidden">
                {merchant?.logo_url
                  ? <img src={merchant.logo_url} alt={merchant.shop_name || ''} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.textContent = merchant?.shop_name?.charAt(0) || 'M'; }} />
                  : merchant?.shop_name?.charAt(0) || 'M'
                }
              </div>
              <p className="font-semibold text-gray-900 truncate text-sm flex-1 min-w-0 lg:group-hover:text-indigo-600 transition-colors">
                {merchant?.shop_name}
              </p>
              {(merchant?.subscription_status === 'active' || merchant?.subscription_status === 'canceling') && (
                getPlanTier(merchant) === 'fidelity' ? (
                  <span className="shrink-0 text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-500 text-white">
                    CŒUR
                  </span>
                ) : (
                  <span className="shrink-0 text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#4b0082] text-white">
                    PRO
                  </span>
                )
              )}
            </Link>
            <div className="flex items-center gap-1">
              <a
                href={`https://wa.me/33607447420?text=${encodeURIComponent(locale === 'en' ? 'Hi, I need help with Qarte' : 'Bonjour, j\'ai besoin d\'aide avec Qarte')}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('help')}
                className="flex items-center flex-1 gap-2 px-3 py-2 text-gray-500 transition-all rounded-lg lg:hover:bg-green-50 active:bg-green-50 group touch-manipulation"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-green-500 shrink-0">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="font-medium text-xs lg:group-hover:text-green-700 transition-colors">{t('help')}</span>
              </a>
              <button
                onClick={handleLogout}
                className="flex items-center flex-1 gap-2 px-3 py-2 text-red-500 transition-all rounded-lg lg:hover:bg-red-50 active:bg-red-50 touch-manipulation"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span className="font-medium text-xs">{t('logout')}</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="lg:ml-72 min-h-screen">
        <div className="px-4 lg:pt-8 lg:px-8 lg:pb-8 pt-[calc(48px+env(safe-area-inset-top)+8px)] pb-[calc(60px+env(safe-area-inset-bottom)+16px)]">
          {/* Annonces admin — banner mobile uniquement */}
          <div className="lg:hidden">
            <AdminAnnouncementBanner variant="banner" />
          </div>

          {/* Vitrine banner — shown after merchant tested their card but hasn't configured vitrine yet */}
          {previewDone && merchant && !merchant.bio && !merchant.shop_address && pathname !== '/dashboard/public-page' && (
            <Link
              href="/dashboard/public-page"
              className="flex items-center gap-3 p-4 mb-4 bg-violet-50 border border-violet-100 rounded-2xl hover:bg-violet-100 active:scale-[0.99] touch-manipulation transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5 text-[#4b0082]" strokeWidth={2.25} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{t('vitrineBannerTitle')}</p>
                <p className="text-xs text-gray-500 truncate">{t('vitrineBannerDesc')}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-violet-500 shrink-0 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}

          {/* Push notifications prompt — brand gradient + Bell icon */}
          {showPushPrompt && (
            <div className="relative flex items-center gap-3 p-3.5 mb-4 bg-[#4b0082] rounded-2xl">
              <div className="shrink-0 w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                <Bell className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white leading-tight">{tp('promptTitle')}</p>
                <p className="text-[11px] text-white/80 leading-tight mt-0.5">{tp('promptDesc')}</p>
              </div>
              <button
                onClick={subscribePush}
                disabled={pushSubscribing}
                className="shrink-0 px-3.5 py-1.5 rounded-lg bg-white text-indigo-600 text-xs font-bold hover:bg-indigo-50 disabled:opacity-60 transition-colors active:scale-95"
              >
                {pushSubscribing ? '…' : tp('promptCta')}
              </button>
              <button
                onClick={dismissPush}
                aria-label={tp('promptDismiss')}
                className="shrink-0 p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Push error */}
          {pushError && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
              {tp('error')} : {pushError}
            </div>
          )}

          {children}
        </div>
      </main>

      {!hideDistractions && (
        <>
          <BottomNav onOpenMore={() => setMoreOpen(true)} moreOpen={moreOpen} />
          <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} onLogout={handleLogout} />
        </>
      )}

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
      <ToastProvider>
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
      </ToastProvider>
    </MerchantProvider>
  );
}
