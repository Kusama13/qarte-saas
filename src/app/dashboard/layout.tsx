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
  HelpCircle,
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getDaysRemaining } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { MerchantProvider, useMerchant } from '@/contexts/MerchantContext';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Accueil' },
  { href: '/dashboard/program', icon: Gift, label: 'Mon Programme' },
  { href: '/dashboard/qr-download', icon: QrCode, label: 'Télécharger QR' },
  { href: '/dashboard/customers', icon: Users, label: 'Clients' },
  { href: '/dashboard/subscription', icon: CardIcon, label: 'Abonnement' },
  { href: '/dashboard/settings', icon: Settings, label: 'Paramètres' },
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

  const daysRemaining = merchant?.trial_ends_at
    ? getDaysRemaining(merchant.trial_ends_at)
    : 0;
  const isTrialExpiring = merchant?.subscription_status === 'trial' && daysRemaining <= 3;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (pathname === '/dashboard/setup' || pathname === '/dashboard/qr-download') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed z-40 p-3 bg-white border border-gray-200 rounded-xl shadow-lg top-4 left-4 lg:hidden"
      >
        <Menu className="w-6 h-6 text-gray-700" />
      </button>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 w-72 h-full bg-white border-r border-gray-100 transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Qarte</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 lg:hidden"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {merchant?.subscription_status === 'trial' && (
            <div
              className={cn(
                'mx-4 mt-4 p-4 rounded-xl text-sm',
                isTrialExpiring
                  ? 'bg-red-50 text-red-700'
                  : 'bg-primary-50 text-primary-700'
              )}
            >
              {isTrialExpiring && <AlertTriangle className="w-4 h-4 inline mr-2" />}
              <span className="font-medium">
                {daysRemaining > 0
                  ? `${daysRemaining} jour${daysRemaining > 1 ? 's' : ''} d'essai restant${daysRemaining > 1 ? 's' : ''}`
                  : 'Essai expiré'}
              </span>
              <Link
                href="/dashboard/subscription"
                className="block mt-1 underline hover:no-underline"
              >
                Ajouter une carte bancaire
              </Link>
            </div>
          )}

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors',
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 px-4 py-3 mb-2">
              <div className="flex items-center justify-center w-10 h-10 font-bold text-white rounded-full bg-primary">
                {merchant?.shop_name?.charAt(0) || 'M'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {merchant?.shop_name}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {merchant?.phone}
                </p>
              </div>
            </div>
            <a
              href="mailto:support@qarte.app"
              className="flex items-center w-full gap-3 px-4 py-3 text-gray-600 transition-colors rounded-xl hover:bg-gray-100 mb-1"
            >
              <HelpCircle className="w-5 h-5" />
              <span className="font-medium">Besoin d&apos;aide ?</span>
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center w-full gap-3 px-4 py-3 text-red-600 transition-colors rounded-xl hover:bg-red-50"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Déconnexion</span>
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
