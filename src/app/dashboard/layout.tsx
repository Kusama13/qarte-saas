'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  CreditCard,
  Home,
  Gift,
  QrCode,
  Users,
  CreditCard as CardIcon,
  Settings,
  LogOut,
  Menu,
  X,
  AlertTriangle,
  MessageCircle,
  Megaphone,
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getTrialStatus } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { MerchantProvider, useMerchant } from '@/contexts/MerchantContext';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Accueil', color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { href: '/dashboard/program', icon: Gift, label: 'Mon Programme', color: 'text-pink-500', bg: 'bg-pink-50' },
  { href: '/dashboard/qr-download', icon: QrCode, label: 'Télécharger QR', color: 'text-violet-500', bg: 'bg-violet-50' },
  { href: '/dashboard/customers', icon: Users, label: 'Clients', color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { href: '/dashboard/marketing', icon: Megaphone, label: 'Notifications', color: 'text-orange-500', bg: 'bg-orange-50' },
  { href: '/dashboard/subscription', icon: CardIcon, label: 'Abonnement', color: 'text-amber-500', bg: 'bg-amber-50' },
  { href: '/dashboard/settings', icon: Settings, label: 'Paramètres', color: 'text-slate-500', bg: 'bg-slate-50' },
];

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClientComponentClient();
  const { merchant, loading } = useMerchant();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  if (pathname === '/dashboard/setup' || pathname === '/dashboard/qr-download') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed z-40 p-3 bg-white/90 backdrop-blur-xl border border-gray-100 rounded-2xl shadow-xl shadow-indigo-100/50 top-4 left-4 lg:hidden hover:scale-105 active:scale-95 transition-all duration-200"
      >
        <Menu className="w-6 h-6 text-indigo-600" />
      </button>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 w-72 h-full bg-white/95 backdrop-blur-xl border-r border-gray-100/50 transition-transform duration-300 lg:translate-x-0 shadow-xl shadow-gray-200/20',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-100/50 bg-white/40 backdrop-blur-md sticky top-0 z-10">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-200/40 transition-transform group-hover:scale-105 duration-200">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
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
                'mx-4 mt-4 p-4 rounded-xl text-sm',
                trialStatus.daysRemaining <= 3
                  ? 'bg-red-50 text-red-700'
                  : 'bg-primary-50 text-primary-700'
              )}
            >
              {trialStatus.daysRemaining <= 3 && <AlertTriangle className="w-4 h-4 inline mr-2" />}
              <span className="font-medium">
                {trialStatus.daysRemaining} jour{trialStatus.daysRemaining > 1 ? 's' : ''} d&apos;essai restant{trialStatus.daysRemaining > 1 ? 's' : ''}
              </span>
              <Link
                href="/dashboard/subscription"
                className="block mt-1 underline hover:no-underline"
              >
                Ajouter une carte bancaire
              </Link>
            </div>
          )}

          {/* Banner période de grâce - URGENT */}
          {trialStatus.isInGracePeriod && (
            <div className="mx-4 mt-4 p-4 rounded-xl text-sm bg-red-100 text-red-800 border border-red-300">
              <AlertTriangle className="w-4 h-4 inline mr-2" />
              <span className="font-bold">Essai expiré</span>
              <p className="mt-2 text-red-700">
                Vos données seront supprimées dans{' '}
                <strong>{trialStatus.daysUntilDeletion} jour{trialStatus.daysUntilDeletion > 1 ? 's' : ''}</strong>.
              </p>
              <p className="mt-1 text-xs text-red-600">
                Fonctionnalités limitées : lecture seule
              </p>
              <Link
                href="/dashboard/subscription"
                className="block mt-3 px-4 py-2 bg-red-600 text-white text-center rounded-lg font-medium hover:bg-red-700"
              >
                Souscrire maintenant
              </Link>
            </div>
          )}

          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
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
                  <span className="font-medium flex-1">{item.label}</span>
                  {item.badge && (
                    <span className={cn(
                      'px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full',
                      isActive ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-600'
                    )}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-100/50 bg-gray-50/30">
            <div className="flex items-center gap-3 px-3 py-3 mb-3 bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-center w-10 h-10 font-bold text-white rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-md shadow-indigo-200/50">
                {merchant?.shop_name?.charAt(0) || 'M'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {merchant?.shop_name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {merchant?.phone}
                </p>
              </div>
            </div>
            <a
              href="https://wa.me/33607447420?text=Bonjour%2C%20j%27ai%20besoin%20d%27aide%20avec%20Qarte"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center w-full gap-3 px-4 py-2.5 text-gray-600 transition-all rounded-xl hover:bg-green-50 hover:shadow-sm mb-1 group"
            >
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-green-600">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <span className="font-medium text-sm group-hover:text-green-700 transition-colors">Besoin d&apos;aide ?</span>
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center w-full gap-3 px-4 py-2.5 text-red-600 transition-all rounded-xl hover:bg-red-50"
            >
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                <LogOut className="w-4 h-4 text-red-500" />
              </div>
              <span className="font-medium text-sm">Déconnexion</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="lg:ml-72">
        <div className="min-h-screen p-4 md:p-8">{children}</div>
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
