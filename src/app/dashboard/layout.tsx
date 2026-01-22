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
                  <span className="font-medium">{item.label}</span>
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
            <Link
              href="/contact"
              className="flex items-center w-full gap-3 px-4 py-2.5 text-gray-600 transition-all rounded-xl hover:bg-white hover:shadow-sm mb-1"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-indigo-500" />
              </div>
              <span className="font-medium text-sm">Nous contacter</span>
            </Link>
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
