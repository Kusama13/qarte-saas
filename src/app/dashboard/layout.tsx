'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  CreditCard,
  Home,
  Gift,
  QrCode,
  Users,
  Wallet,
  Settings,
  LogOut,
  Menu,
  X,
  AlertTriangle,
  Megaphone,
  Crown,
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { getTrialStatus } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { MerchantProvider, useMerchant } from '@/contexts/MerchantContext';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Accueil', color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { href: '/dashboard/program', icon: Gift, label: 'Mon Programme', color: 'text-pink-500', bg: 'bg-pink-50' },
  { href: '/dashboard/qr-download', icon: QrCode, label: 'Télécharger QR', color: 'text-violet-500', bg: 'bg-violet-50' },
  { href: '/dashboard/customers', icon: Users, label: 'Clients', color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { href: '/dashboard/members', icon: Crown, label: 'Membres', color: 'text-amber-500', bg: 'bg-amber-50' },
  { href: '/dashboard/marketing', icon: Megaphone, label: 'Marketing', color: 'text-orange-500', bg: 'bg-orange-50' },
  { href: '/dashboard/subscription', icon: Wallet, label: 'Abonnement', color: 'text-teal-500', bg: 'bg-teal-50' },
  { href: '/dashboard/settings', icon: Settings, label: 'Paramètres', color: 'text-slate-500', bg: 'bg-slate-50' },
];

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = getSupabase();
  const { merchant, loading } = useMerchant();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Swipe-to-close
  const touchStartX = useRef(0);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 60) setSidebarOpen(false);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth/merchant';
  };

  // Wait for merchant data to load before checking trial status
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const trialStatus = getTrialStatus(
    merchant?.trial_ends_at || null,
    merchant?.subscription_status || 'trial'
  );

  // Redirection forcée si plus de 7 jours après expiration
  if (trialStatus.isFullyExpired && pathname !== '/dashboard/subscription') {
    router.push('/dashboard/subscription');
    return null;
  }

  if (pathname === '/dashboard/setup') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed z-40 p-2.5 bg-white/90 backdrop-blur-xl border border-gray-100 rounded-xl shadow-lg top-3 left-3 lg:hidden hover:scale-105 active:scale-95 transition-all duration-200"
      >
        <Menu className="w-5 h-5 text-indigo-600" />
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
                <CreditCard className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
              </div>
              <span className="text-lg lg:text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                Qarte
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 lg:hidden rounded-lg hover:bg-white/80 hover:shadow-sm text-gray-500 transition-all duration-200 active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Banner essai actif */}
          {trialStatus.isActive && (
            <div
              className={cn(
                'mx-3 mt-3 p-3 rounded-xl text-sm',
                trialStatus.daysRemaining <= 3
                  ? 'bg-red-50 text-red-700'
                  : 'bg-primary-50 text-primary-700'
              )}
            >
              {trialStatus.daysRemaining <= 3 && <AlertTriangle className="w-4 h-4 inline mr-1.5" />}
              <span className="font-medium">
                {trialStatus.daysRemaining} jour{trialStatus.daysRemaining > 1 ? 's' : ''} d&apos;essai restant{trialStatus.daysRemaining > 1 ? 's' : ''}
              </span>
              <Link
                href="/dashboard/subscription"
                onClick={() => setSidebarOpen(false)}
                className="block mt-1 text-xs underline hover:no-underline"
              >
                {merchant?.stripe_subscription_id ? 'Voir l\'abonnement' : 'Ajouter une carte bancaire'}
              </Link>
            </div>
          )}

          {/* Banner période de grâce - URGENT */}
          {trialStatus.isInGracePeriod && (
            <div className="mx-3 mt-3 p-3 rounded-xl text-sm bg-red-100 text-red-800 border border-red-300">
              <AlertTriangle className="w-4 h-4 inline mr-1.5" />
              <span className="font-bold">Essai expiré</span>
              <p className="mt-1.5 text-red-700 text-xs">
                Données supprimées dans{' '}
                <strong>{trialStatus.daysUntilDeletion}j</strong>. Lecture seule.
              </p>
              <Link
                href="/dashboard/subscription"
                onClick={() => setSidebarOpen(false)}
                className="block mt-2 px-3 py-1.5 bg-red-600 text-white text-center rounded-lg font-medium text-xs hover:bg-red-700"
              >
                Souscrire maintenant
              </Link>
            </div>
          )}

          {/* Banner annulation en cours */}
          {merchant?.subscription_status === 'canceling' && (
            <div className="mx-3 mt-3 p-3 rounded-xl text-sm bg-orange-50 text-orange-700">
              <AlertTriangle className="w-4 h-4 inline mr-1.5" />
              <span className="font-medium">Annulation en fin de période</span>
              <Link
                href="/dashboard/subscription"
                onClick={() => setSidebarOpen(false)}
                className="block mt-1 text-xs underline hover:no-underline"
              >
                Annuler la résiliation
              </Link>
            </div>
          )}

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
            <div className="flex items-center gap-2.5 px-2.5 py-2 mb-2 bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-center w-9 h-9 font-bold text-white text-sm rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 shadow-md shadow-indigo-200/50 shrink-0">
                {merchant?.shop_name?.charAt(0) || 'M'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate text-sm">
                  {merchant?.shop_name}
                </p>
                <p className="text-[11px] text-gray-400 truncate">
                  {merchant?.phone}
                </p>
              </div>
            </div>
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
                <span className="font-medium text-xs group-hover:text-green-700 transition-colors">Aide</span>
              </a>
              <button
                onClick={handleLogout}
                className="flex items-center flex-1 gap-2 px-3 py-2 text-red-500 transition-all rounded-lg hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span className="font-medium text-xs">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="lg:ml-72 min-h-screen">
        <div className="px-4 pt-14 pb-20 lg:pt-8 lg:px-8 lg:pb-8">{children}</div>
      </main>
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
