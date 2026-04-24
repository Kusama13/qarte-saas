import {
  Home,
  Heart,
  Globe,
  QrCode,
  CalendarDays,
  Users,
  UserPlus,
  Megaphone,
  Wallet,
  Settings,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';
import type { Merchant } from '@/types';
import { getPlanFeatures } from '@/lib/plan-tiers';

export type NavItem = {
  href: string;
  labelKey: string;       // cle i18n dashNav.* (sidebar desktop + more sheet)
  shortLabelKey?: string; // cle i18n navShort.* (bottom nav mobile, ~10 chars max)
  icon: LucideIcon;
  color: string;          // tailwind text color (desktop sidebar)
  bg: string;             // tailwind bg color (desktop sidebar)
  primary: boolean;       // true = affiche dans le bottom nav mobile
  locked?: (m: Merchant | null) => boolean;
};

export const NAV_ITEMS: NavItem[] = [
  // Primary — bottom nav mobile (4 routes + "Plus")
  { href: '/dashboard', labelKey: 'home', shortLabelKey: 'home', icon: Home, color: 'text-indigo-500', bg: 'bg-indigo-50', primary: true },
  { href: '/dashboard/planning', labelKey: 'planning', shortLabelKey: 'planning', icon: CalendarDays, color: 'text-cyan-500', bg: 'bg-cyan-50', primary: true, locked: (m) => !getPlanFeatures(m).planning },
  { href: '/dashboard/customers', labelKey: 'customers', shortLabelKey: 'customers', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50', primary: true },
  { href: '/dashboard/qr-download', labelKey: 'qrCode', shortLabelKey: 'qrCode', icon: QrCode, color: 'text-violet-500', bg: 'bg-violet-50', primary: true },

  // Secondary — dans le sheet "Plus" uniquement sur mobile, sidebar complete sur desktop
  { href: '/dashboard/program', labelKey: 'program', icon: Heart, color: 'text-pink-500', bg: 'bg-pink-50', primary: false },
  { href: '/dashboard/public-page', labelKey: 'publicPage', icon: Globe, color: 'text-violet-500', bg: 'bg-violet-50', primary: false },
  { href: '/dashboard/stats', labelKey: 'stats', icon: BarChart3, color: 'text-indigo-500', bg: 'bg-indigo-50', primary: false, locked: (m) => !getPlanFeatures(m).planning },
  { href: '/dashboard/marketing', labelKey: 'notifications', icon: Megaphone, color: 'text-orange-500', bg: 'bg-orange-50', primary: false },
  { href: '/dashboard/referrals', labelKey: 'referrals', icon: UserPlus, color: 'text-blue-500', bg: 'bg-blue-50', primary: false },
  { href: '/dashboard/subscription', labelKey: 'subscription', icon: Wallet, color: 'text-teal-500', bg: 'bg-teal-50', primary: false },
  { href: '/dashboard/settings', labelKey: 'settings', icon: Settings, color: 'text-slate-500', bg: 'bg-slate-50', primary: false },
];

export const PRIMARY_ITEMS = NAV_ITEMS.filter((i) => i.primary);
export const SECONDARY_ITEMS = NAV_ITEMS.filter((i) => !i.primary);
