'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });
import {
  LayoutDashboard,
  Store,
  TrendingUp,
  ArrowLeft,
  Menu,
  X,
  Shield,
  LogOut,
  Wallet,
  UserPlus,
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/merchants', icon: Store, label: 'Commerçants' },
  { href: '/admin/leads', icon: UserPlus, label: 'Leads' },
  { href: '/admin/metriques', icon: TrendingUp, label: 'Métriques' },
  { href: '/admin/depenses', icon: Wallet, label: 'Dépenses' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const supabase = createClientComponentClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth/admin';
  };

  return (
    <div className={`min-h-screen bg-[#f8fafc] ${inter.className}`}>
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed z-40 p-2.5 bg-white border border-gray-100 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95 top-4 left-4 lg:hidden"
      >
        <Menu className="w-6 h-6 text-[#5167fc]" />
      </button>

      {/* Backdrop mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/20 backdrop-blur-[2px] lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 w-72 h-full bg-white border-r border-gray-200 transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-[#5167fc]/10 rounded-lg">
                <Shield className="w-5 h-5 text-[#5167fc]" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900 tracking-tight">Qarte</span>
                <span className="block text-xs text-gray-500 font-medium">Admin Panel</span>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 lg:hidden text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/admin' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group',
                    isActive
                      ? 'bg-[#5167fc] text-white shadow-md shadow-[#5167fc]/20'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  )}
                >
                  <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-white" : "text-gray-400 group-hover:text-[#5167fc]")} />
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 space-y-1.5">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 group"
            >
              <ArrowLeft className="w-5 h-5 transition-colors text-gray-400 group-hover:text-[#5167fc]" />
              <span className="font-medium text-sm">Retour commerçant</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group"
            >
              <LogOut className="w-5 h-5 transition-colors text-gray-400 group-hover:text-red-500" />
              <span className="font-medium text-sm">Déconnexion</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-72">
        <div className="min-h-screen p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
