'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  Store,
  ChevronRight,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Shield,
  MessageCircle,
  AlertTriangle,
  Mail,
  CalendarX,
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import type { Merchant, MerchantCountry } from '@/types';

// --- Types ---

interface MerchantsDataResponse {
  merchants: Merchant[];
  superAdminIds: string[];
  customerCounts: Record<string, number>;
  lastVisitDates: Record<string, string>;
  todayScans: Record<string, number>;
  weeklyScans: Record<string, number>;
  emailTracking: Record<string, number[]>;
  reactivationTracking: Record<string, number[]>;
  userEmails: Record<string, string>;
}

interface LifecycleStage {
  label: string;
  color: string;
  bgColor: string;
  urgency: number;
}

interface EmailSteps {
  steps: { code: string; sent: boolean }[];
  summary: string;
}

type FilterStatus = 'all' | 'trial' | 'trial_expired' | 'active' | 'canceling' | 'canceled';

// --- Lifecycle Stage ---

function getLifecycleStage(
  merchant: Merchant,
  lastVisit: string | null,
  todayScans: number,
  hasProgram: boolean,
): LifecycleStage {
  const now = new Date();
  const trialEnd = merchant.trial_ends_at ? new Date(merchant.trial_ends_at) : null;
  const status = merchant.subscription_status;

  // Essai expire
  if (status === 'trial' && trialEnd && trialEnd < now) {
    return { label: 'Essai expiré', color: 'text-orange-700', bgColor: 'bg-orange-100', urgency: 0 };
  }

  // Impaye
  if (status === 'past_due') {
    return { label: 'Impayé', color: 'text-red-700', bgColor: 'bg-red-100', urgency: 1 };
  }

  // Essai J-X (3 jours ou moins)
  if (status === 'trial' && trialEnd) {
    const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 3 && daysLeft > 0) {
      return { label: `Essai J-${daysLeft}`, color: 'text-orange-700', bgColor: 'bg-orange-100', urgency: 1 };
    }
  }

  // Config programme manquante
  if ((status === 'trial' || status === 'active') && !hasProgram) {
    return { label: 'Config programme', color: 'text-amber-700', bgColor: 'bg-amber-100', urgency: 2 };
  }

  // 1er scan attendu (aucune visite)
  if ((status === 'trial' || status === 'active') && !lastVisit) {
    return { label: '1er scan attendu', color: 'text-amber-700', bgColor: 'bg-amber-100', urgency: 3 };
  }

  // Inactif >7j
  if ((status === 'trial' || status === 'active') && lastVisit) {
    const daysSince = Math.floor((now.getTime() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince > 7) {
      return { label: `Inactif ${daysSince}j`, color: 'text-red-700', bgColor: 'bg-red-100', urgency: 3 };
    }
  }

  // Annulation programmee
  if (status === 'canceling') {
    return { label: 'Annulation', color: 'text-purple-700', bgColor: 'bg-purple-100', urgency: 4 };
  }

  // Churned
  if (status === 'canceled') {
    return { label: 'Churned', color: 'text-gray-600', bgColor: 'bg-gray-100', urgency: 5 };
  }

  // En essai normal
  if (status === 'trial') {
    const daysLeft = trialEnd ? Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : '?';
    return { label: `Essai J-${daysLeft}`, color: 'text-blue-700', bgColor: 'bg-blue-100', urgency: 7 };
  }

  // Actif avec scans aujourd'hui
  if (status === 'active' && todayScans > 0) {
    return { label: 'Actif', color: 'text-green-700', bgColor: 'bg-green-100', urgency: 10 };
  }

  // Actif
  if (status === 'active') {
    return { label: 'Actif', color: 'text-green-700', bgColor: 'bg-green-100', urgency: 9 };
  }

  return { label: status, color: 'text-gray-600', bgColor: 'bg-gray-100', urgency: 6 };
}

// --- Email Pipeline ---

// Milestone codes: -103=QR, -104=Kit, -100=1er scan, -101=Recompense
function getEmailSteps(
  merchantId: string,
  emailTracking: Record<string, number[]>,
  reactivationTracking: Record<string, number[]>,
): EmailSteps {
  const codes = emailTracking[merchantId] || [];
  const steps = [
    { code: 'QR', sent: codes.includes(-103) },
    { code: 'Kit', sent: codes.includes(-104) },
    { code: '1er', sent: codes.includes(-100) },
    { code: 'Réc', sent: codes.includes(-101) },
  ];
  const sentCount = steps.filter((s) => s.sent).length;
  return { steps, summary: `${sentCount}/4` };
}

// --- Activity Label ---

function getActivityLabel(lastVisit: string | null): { text: string; color: string } {
  if (!lastVisit) return { text: 'Jamais', color: 'text-red-600' };
  const daysSince = Math.floor((Date.now() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24));
  if (daysSince === 0) return { text: "Auj.", color: 'text-green-600' };
  if (daysSince <= 3) return { text: `${daysSince}j`, color: 'text-green-600' };
  if (daysSince <= 7) return { text: `${daysSince}j`, color: 'text-amber-600' };
  return { text: `${daysSince}j`, color: 'text-red-600' };
}

// --- WhatsApp ---

function formatPhoneForWhatsApp(phone: string) {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) return '33' + cleaned.substring(1);
  return cleaned;
}

// --- Component ---

export default function AdminMerchantsPage() {
  const supabase = getSupabase();
  const [data, setData] = useState<MerchantsDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [countryFilter, setCountryFilter] = useState<'all' | MerchantCountry>('all');
  const [showAdmins, setShowAdmins] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/merchants-data');
      if (!res.ok) throw new Error('Fetch failed');
      const json: MerchantsDataResponse = await res.json();
      setData(json);
    } catch (error) {
      console.error('Error fetching merchants data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Realtime refresh on loyalty_cards changes
    const channel = supabase
      .channel('loyalty_cards_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loyalty_cards' }, () => {
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, fetchData]);

  const superAdminIds = useMemo(() => new Set(data?.superAdminIds || []), [data]);

  // Helper
  const isTrialExpired = (m: Merchant) =>
    m.subscription_status === 'trial' && m.trial_ends_at && new Date(m.trial_ends_at) < new Date();

  // Stats
  const stats = useMemo(() => {
    if (!data) return { total: 0, trial: 0, trialExpired: 0, active: 0, canceling: 0, canceled: 0, adminCount: 0 };
    const nonAdmin = data.merchants.filter((m) => !superAdminIds.has(m.user_id));
    return {
      total: nonAdmin.length,
      trial: nonAdmin.filter((m) => m.subscription_status === 'trial' && !isTrialExpired(m)).length,
      trialExpired: nonAdmin.filter((m) => isTrialExpired(m)).length,
      active: nonAdmin.filter((m) => m.subscription_status === 'active').length,
      canceling: nonAdmin.filter((m) => m.subscription_status === 'canceling').length,
      canceled: nonAdmin.filter((m) => m.subscription_status === 'canceled').length,
      adminCount: data.merchants.filter((m) => superAdminIds.has(m.user_id)).length,
    };
  }, [data, superAdminIds]);

  // Filtered & sorted merchants
  const sortedMerchants = useMemo(() => {
    if (!data) return [];
    let filtered = data.merchants;

    // Hide admins
    if (!showAdmins) {
      filtered = filtered.filter((m) => !superAdminIds.has(m.user_id));
    }

    // Status filter
    if (statusFilter === 'trial') {
      filtered = filtered.filter((m) => m.subscription_status === 'trial' && !isTrialExpired(m));
    } else if (statusFilter === 'trial_expired') {
      filtered = filtered.filter((m) => isTrialExpired(m));
    } else if (statusFilter !== 'all') {
      filtered = filtered.filter((m) => m.subscription_status === statusFilter);
    }

    // Country filter
    if (countryFilter !== 'all') {
      filtered = filtered.filter((m) => (m.country || 'FR') === countryFilter);
    }

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.shop_name.toLowerCase().includes(q) ||
          m.phone.includes(q) ||
          (m.shop_address && m.shop_address.toLowerCase().includes(q)),
      );
    }

    // Sort by urgency ASC, then created_at DESC
    return filtered
      .map((m) => ({
        merchant: m,
        lifecycle: getLifecycleStage(
          m,
          data.lastVisitDates[m.id] || null,
          data.todayScans[m.id] || 0,
          m.reward_description !== null,
        ),
        isAdmin: superAdminIds.has(m.user_id),
      }))
      .sort((a, b) => {
        if (a.lifecycle.urgency !== b.lifecycle.urgency) return a.lifecycle.urgency - b.lifecycle.urgency;
        return new Date(b.merchant.created_at).getTime() - new Date(a.merchant.created_at).getTime();
      });
  }, [data, searchQuery, statusFilter, countryFilter, showAdmins, superAdminIds]);

  const openWhatsApp = (phone: string, name?: string) => {
    const formattedPhone = formatPhoneForWhatsApp(phone);
    const message = encodeURIComponent(name ? `Bonjour ${name}, ` : 'Bonjour, ');
    window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#5167fc]" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-8 pt-10 lg:pt-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Commerçants</h1>
        <p className="mt-1 text-sm sm:text-base text-gray-600">Vue lifecycle — trié par urgence</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 lg:grid-cols-6 lg:gap-4">
        {[
          { label: 'Total', value: stats.total, icon: Store, iconBg: 'bg-[#5167fc]/10', iconColor: 'text-[#5167fc]', extra: stats.adminCount > 0 ? `+${stats.adminCount} admin` : undefined },
          { label: 'En essai', value: stats.trial, icon: Clock, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
          { label: 'Expirés', value: stats.trialExpired, icon: CalendarX, iconBg: 'bg-orange-50', iconColor: 'text-orange-600' },
          { label: 'Actifs', value: stats.active, icon: CheckCircle, iconBg: 'bg-green-50', iconColor: 'text-green-600' },
          { label: 'Annulation', value: stats.canceling, icon: AlertTriangle, iconBg: 'bg-purple-50', iconColor: 'text-purple-600' },
          { label: 'Churned', value: stats.canceled, icon: XCircle, iconBg: 'bg-red-50', iconColor: 'text-red-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-3 sm:p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={cn("w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center", stat.iconBg)}>
                <stat.icon className={cn("w-4 h-4 sm:w-5 sm:h-5", stat.iconColor)} />
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-[10px] sm:text-xs text-gray-500">{stat.label}</p>
                {stat.extra && <p className="text-[10px] text-purple-600">{stat.extra}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-row sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher nom, téléphone, adresse..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5167fc] focus:border-transparent"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 sm:flex-wrap -mx-4 px-4 sm:mx-0 sm:px-0">
          {([
            { label: 'Tous', value: 'all' as FilterStatus, count: stats.total },
            { label: 'Essai', value: 'trial' as FilterStatus, count: stats.trial },
            { label: 'Expirés', value: 'trial_expired' as FilterStatus, count: stats.trialExpired },
            { label: 'Actifs', value: 'active' as FilterStatus, count: stats.active },
            { label: 'Annulation', value: 'canceling' as FilterStatus, count: stats.canceling },
            { label: 'Churned', value: 'canceled' as FilterStatus, count: stats.canceled },
          ]).map((btn) => (
            <button
              key={btn.value}
              onClick={() => setStatusFilter(btn.value)}
              className={cn(
                "px-3 py-2 text-xs sm:text-sm font-medium rounded-xl transition-colors whitespace-nowrap flex-shrink-0",
                statusFilter === btn.value
                  ? "bg-[#5167fc] text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50",
              )}
            >
              {btn.label} ({btn.count})
            </button>
          ))}
          <div className="w-px h-6 bg-gray-200 flex-shrink-0 hidden sm:block self-center" />
          {(['all', 'FR', 'BE', 'CH', 'LU'] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCountryFilter(c)}
              className={cn(
                "px-3 py-2 text-xs sm:text-sm font-medium rounded-xl transition-colors whitespace-nowrap flex-shrink-0",
                countryFilter === c
                  ? "bg-violet-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50",
              )}
            >
              {c === 'all' ? 'Pays' : c}
            </button>
          ))}
          {stats.adminCount > 0 && (
            <button
              onClick={() => setShowAdmins(!showAdmins)}
              className={cn(
                "px-3 py-2 text-xs sm:text-sm font-medium rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5 flex-shrink-0",
                showAdmins
                  ? "bg-purple-600 text-white"
                  : "bg-white text-purple-600 border border-purple-200 hover:bg-purple-50",
              )}
            >
              <Shield className="w-3.5 h-3.5" />
              Admin
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500">{sortedMerchants.length} commerçant{sortedMerchants.length > 1 ? 's' : ''}</p>

      {/* Table Desktop / Cards Mobile */}
      {sortedMerchants.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <Store className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="font-medium text-gray-900">Aucun commerçant trouvé</p>
          <p className="text-sm text-gray-500 mt-1">Essayez de modifier vos filtres</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Commerçant</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Étape</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Activité</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Auj.</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Clients</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Emails</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedMerchants.map(({ merchant, lifecycle, isAdmin }) => {
                  const lastVisit = data?.lastVisitDates[merchant.id] || null;
                  const activity = getActivityLabel(lastVisit);
                  const today = data?.todayScans[merchant.id] || 0;
                  const customers = data?.customerCounts[merchant.id] || 0;
                  const emailSteps = getEmailSteps(
                    merchant.id,
                    data?.emailTracking || {},
                    data?.reactivationTracking || {},
                  );

                  return (
                    <tr key={merchant.id} className="hover:bg-gray-50/50 transition-colors group">
                      {/* Commercant */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-[#5167fc] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {merchant.shop_name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900 truncate max-w-[200px]">{merchant.shop_name}</p>
                              {isAdmin && (
                                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-purple-100 text-purple-700 rounded-full flex-shrink-0">
                                  Admin
                                </span>
                              )}
                            </div>
                            {merchant.shop_address && (
                              <p className="text-xs text-gray-400 truncate max-w-[250px]">{merchant.shop_address}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Etape */}
                      <td className="px-4 py-3">
                        <span className={cn("px-2.5 py-1 text-xs font-semibold rounded-full", lifecycle.bgColor, lifecycle.color)}>
                          {lifecycle.label}
                        </span>
                      </td>

                      {/* Activite */}
                      <td className="px-4 py-3 text-center">
                        <span className={cn("text-sm font-medium", activity.color)}>{activity.text}</span>
                      </td>

                      {/* Scans aujourd'hui */}
                      <td className="px-4 py-3 text-center">
                        <span className={cn(
                          "text-sm font-bold",
                          today > 0 ? "text-green-600" : "text-gray-300",
                        )}>
                          {today}
                        </span>
                      </td>

                      {/* Clients */}
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-medium text-gray-700">{customers}</span>
                      </td>

                      {/* Emails */}
                      <td className="px-4 py-3 text-center">
                        <div className="group/tooltip relative inline-block">
                          <span className={cn(
                            "text-sm font-medium cursor-default",
                            emailSteps.summary === '4/4' ? "text-green-600" :
                            emailSteps.summary === '0/4' ? "text-gray-400" : "text-amber-600"
                          )}>
                            {emailSteps.summary}
                          </span>
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block z-10">
                            <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                              <div className="space-y-1">
                                {emailSteps.steps.map((step) => (
                                  <div key={step.code} className="flex items-center gap-2">
                                    <span className={step.sent ? 'text-green-400' : 'text-gray-500'}>{step.sent ? '✓' : '✗'}</span>
                                    <span>{step.code}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                                <div className="border-4 border-transparent border-t-gray-900" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {merchant.phone && !isAdmin && (
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); openWhatsApp(merchant.phone, merchant.shop_name); }}
                              className="p-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                              title="WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          )}
                          <Link
                            href={`/admin/merchants/${merchant.id}`}
                            className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                            title="Détail"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-2">
            {sortedMerchants.map(({ merchant, lifecycle, isAdmin }) => {
              const lastVisit = data?.lastVisitDates[merchant.id] || null;
              const activity = getActivityLabel(lastVisit);
              const today = data?.todayScans[merchant.id] || 0;
              const customers = data?.customerCounts[merchant.id] || 0;
              const emailSteps = getEmailSteps(
                merchant.id,
                data?.emailTracking || {},
                data?.reactivationTracking || {},
              );

              return (
                <div key={merchant.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-[#5167fc] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {merchant.shop_name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 truncate">{merchant.shop_name}</p>
                          {isAdmin && (
                            <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-purple-100 text-purple-700 rounded-full flex-shrink-0">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={cn("px-2 py-0.5 text-[10px] font-semibold rounded-full", lifecycle.bgColor, lifecycle.color)}>
                            {lifecycle.label}
                          </span>
                          <span className={cn("text-xs font-medium", activity.color)}>{activity.text}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {merchant.phone && !isAdmin && (
                        <button
                          onClick={() => openWhatsApp(merchant.phone, merchant.shop_name)}
                          className="p-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      )}
                      <Link
                        href={`/admin/merchants/${merchant.id}`}
                        className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>

                  {/* Bottom row: metrics */}
                  <div className="flex items-center gap-4 mt-2 pl-12 text-xs text-gray-500">
                    <span className={cn("font-medium", today > 0 ? "text-green-600" : "text-gray-400")}>
                      Auj: {today}
                    </span>
                    <span>
                      <Users className="w-3 h-3 inline mr-0.5" />{customers}
                    </span>
                    <span className={cn(
                      "font-medium",
                      emailSteps.summary === '4/4' ? "text-green-600" :
                      emailSteps.summary === '0/4' ? "text-gray-400" : "text-amber-600"
                    )}>
                      <Mail className="w-3 h-3 inline mr-0.5" />{emailSteps.summary}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
