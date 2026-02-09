'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  Store,
  ChevronRight,
  MapPin,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Scissors,
  Sparkles,
  Heart,
  Hand,
  Flower2,
  MoreHorizontal,
  Loader2,
  Gift,
  AlertCircle,
  Shield,
  MessageCircle,
  AlertTriangle,
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { SHOP_TYPES, type ShopType } from '@/types';

interface Merchant {
  id: string;
  user_id: string;
  shop_name: string;
  shop_type: ShopType;
  shop_address: string | null;
  phone: string;
  subscription_status: string;
  trial_ends_at: string | null;
  created_at: string;
  reward_description: string | null;
  _isSuperAdmin?: boolean;
  _hasProgram?: boolean;
  _count?: {
    customers: number;
  };
  _lastVisitDate?: string | null;
  _visitsThisWeek?: number;
}

type FilterStatus = 'all' | 'trial' | 'trial_expired' | 'active' | 'canceled';

// Icons for shop types (beauté / bien-être)
const SHOP_TYPE_ICONS: Record<ShopType, React.ElementType> = {
  coiffeur: Scissors,
  barbier: Scissors,
  institut_beaute: Sparkles,
  onglerie: Hand,
  spa: Flower2,
  estheticienne: Heart,
  massage: Heart,
  epilation: Sparkles,
  autre: MoreHorizontal,
};

const SHOP_TYPE_COLORS: Record<ShopType, string> = {
  coiffeur: 'bg-slate-100 text-slate-700',
  barbier: 'bg-amber-100 text-amber-700',
  institut_beaute: 'bg-pink-100 text-pink-700',
  onglerie: 'bg-rose-100 text-rose-700',
  spa: 'bg-emerald-100 text-emerald-700',
  estheticienne: 'bg-purple-100 text-purple-700',
  massage: 'bg-teal-100 text-teal-700',
  epilation: 'bg-indigo-100 text-indigo-700',
  autre: 'bg-gray-100 text-gray-700',
};

export default function AdminMerchantsPage() {
  const supabase = getSupabase();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [showAdmins, setShowAdmins] = useState(false);

  const fetchMerchants = useCallback(async () => {
    try {
      // Fetch ALL merchants, super_admins, and visits in parallel
      const [{ data: merchantsData, error }, { data: superAdmins }, { data: allVisits }] = await Promise.all([
        supabase
          .from('merchants')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase.from('super_admins').select('user_id'),
        supabase.from('visits').select('merchant_id, visited_at'),
      ]);

      if (error) throw error;

      // Get super admin user_ids
      const superAdminUserIds = new Set((superAdmins || []).map((sa: { user_id: string }) => sa.user_id));

      // Get all merchant IDs
      const merchantIds = (merchantsData || []).map((m: Merchant) => m.id);

      // Initialize customer count map
      const countMap = new Map<string, number>();

      // Fetch loyalty cards to count customers
      if (merchantIds.length > 0) {
        const { data: loyaltyCards } = await supabase
          .from('loyalty_cards')
          .select('merchant_id')
          .in('merchant_id', merchantIds);

        // Group counts in memory
        (loyaltyCards || []).forEach((card: { merchant_id: string }) => {
          countMap.set(card.merchant_id, (countMap.get(card.merchant_id) || 0) + 1);
        });
      }

      // Build visits maps: last visit + visits this week per merchant
      const lastVisitMap = new Map<string, string>();
      const weeklyVisitMap = new Map<string, number>();
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      (allVisits || []).forEach((v: { merchant_id: string; visited_at: string }) => {
        const existing = lastVisitMap.get(v.merchant_id);
        if (!existing || v.visited_at > existing) {
          lastVisitMap.set(v.merchant_id, v.visited_at);
        }
        if (new Date(v.visited_at) >= oneWeekAgo) {
          weeklyVisitMap.set(v.merchant_id, (weeklyVisitMap.get(v.merchant_id) || 0) + 1);
        }
      });

      // Merge counts, visits, and program status with merchants
      const merchantsWithCounts = (merchantsData || []).map((merchant: Merchant) => ({
        ...merchant,
        _isSuperAdmin: superAdminUserIds.has(merchant.user_id),
        _hasProgram: merchant.reward_description !== null,
        _count: { customers: countMap.get(merchant.id) || 0 },
        _lastVisitDate: lastVisitMap.get(merchant.id) || null,
        _visitsThisWeek: weeklyVisitMap.get(merchant.id) || 0,
      }));

      setMerchants(merchantsWithCounts);
    } catch (error) {
      console.error('Error fetching merchants:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchMerchants();

    // Subscribe to realtime changes on loyalty_cards
    const channel = supabase
      .channel('loyalty_cards_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'loyalty_cards' },
        () => {
          // Refetch when any loyalty_card is added or deleted
          fetchMerchants();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchMerchants]);

  // Helper to check if trial is expired
  const isTrialExpired = (merchant: Merchant) => {
    if (merchant.subscription_status !== 'trial') return false;
    if (!merchant.trial_ends_at) return false;
    return new Date(merchant.trial_ends_at) < new Date();
  };

  // Stats (exclude super admin accounts from counts)
  const stats = useMemo(() => {
    const nonAdminMerchants = merchants.filter((m: Merchant) => !m._isSuperAdmin);
    const adminCount = merchants.filter((m: Merchant) => m._isSuperAdmin).length;

    const total = nonAdminMerchants.length;
    const trialActive = nonAdminMerchants.filter((m: Merchant) => m.subscription_status === 'trial' && !isTrialExpired(m)).length;
    const trialExpired = nonAdminMerchants.filter((m: Merchant) => isTrialExpired(m)).length;
    const active = nonAdminMerchants.filter((m: Merchant) => m.subscription_status === 'active').length;
    const cancelled = nonAdminMerchants.filter((m: Merchant) => m.subscription_status === 'canceled').length;
    const withProgram = nonAdminMerchants.filter((m: Merchant) => m._hasProgram).length;
    const withoutProgram = nonAdminMerchants.filter((m: Merchant) => !m._hasProgram).length;
    const totalCustomers = nonAdminMerchants.reduce((acc, m) => acc + (m._count?.customers || 0), 0);

    const byType: Record<string, number> = {};
    nonAdminMerchants.forEach((m: Merchant) => {
      const type = m.shop_type || 'autre';
      byType[type] = (byType[type] || 0) + 1;
    });

    return { total, trial: trialActive, trialExpired, active, cancelled, byType, adminCount, withProgram, withoutProgram, totalCustomers };
  }, [merchants]);

  // Filtered merchants
  const filteredMerchants = useMemo(() => {
    let filtered = merchants;

    // Hide admins by default
    if (!showAdmins) {
      filtered = filtered.filter((m: Merchant) => !m._isSuperAdmin);
    }

    if (statusFilter === 'trial') {
      // Only active trials (not expired)
      filtered = filtered.filter((m: Merchant) => m.subscription_status === 'trial' && !isTrialExpired(m));
    } else if (statusFilter === 'trial_expired') {
      // Expired trials
      filtered = filtered.filter((m: Merchant) => isTrialExpired(m));
    } else if (statusFilter !== 'all') {
      filtered = filtered.filter((m: Merchant) => m.subscription_status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m: Merchant) =>
          m.shop_name.toLowerCase().includes(query) ||
          m.phone.includes(query) ||
          (m.shop_address && m.shop_address.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [merchants, searchQuery, statusFilter, showAdmins]);

  // Group by shop type
  const groupedMerchants = useMemo(() => {
    const groups: Record<string, Merchant[]> = {};

    filteredMerchants.forEach((merchant: Merchant) => {
      const type = merchant.shop_type || 'autre';
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(merchant);
    });

    // Sort groups by count (descending)
    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  }, [filteredMerchants]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };

  const getDaysRemaining = (trialEndsAt: string | null) => {
    if (!trialEndsAt) return null;
    const end = new Date(trialEndsAt);
    const now = new Date();
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getStatusBadge = (merchant: Merchant) => {
    // Check for expired trial first
    if (isTrialExpired(merchant)) {
      return (
        <span className="px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 rounded-full">
          Essai expiré
        </span>
      );
    }

    switch (merchant.subscription_status) {
      case 'trial': {
        const daysLeft = getDaysRemaining(merchant.trial_ends_at);
        return (
          <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
            Essai · {daysLeft}j
          </span>
        );
      }
      case 'active':
        return (
          <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
            Actif
          </span>
        );
      case 'canceled':
        return (
          <span className="px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full">
            Churned
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
            {merchant.subscription_status}
          </span>
        );
    }
  };

  const formatPhoneForWhatsApp = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) return '33' + cleaned.substring(1);
    if (cleaned.startsWith('33')) return cleaned;
    return '33' + cleaned;
  };

  const openWhatsApp = (phone: string, name?: string) => {
    const formattedPhone = formatPhoneForWhatsApp(phone);
    const message = encodeURIComponent(name ? `Bonjour ${name}, ` : 'Bonjour, ');
    window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank');
  };

  const getActivityLabel = (merchant: Merchant) => {
    if (!merchant._lastVisitDate) {
      return { text: 'Jamais scanné', color: 'text-red-600' };
    }
    const daysSince = Math.floor((Date.now() - new Date(merchant._lastVisitDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince === 0) return { text: "Aujourd'hui", color: 'text-green-600' };
    if (daysSince <= 3) return { text: `il y a ${daysSince}j`, color: 'text-green-600' };
    if (daysSince <= 7) return { text: `il y a ${daysSince}j`, color: 'text-amber-600' };
    return { text: `il y a ${daysSince}j`, color: 'text-red-600' };
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
        <p className="mt-1 text-sm sm:text-base text-gray-600">Gestion et suivi des commerçants</p>
      </div>

      {/* Stats Cards - Row 1: Subscription status */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5 lg:gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#5167fc]/10 flex items-center justify-center">
              <Store className="w-5 h-5 text-[#5167fc]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total</p>
              {stats.adminCount > 0 && (
                <p className="text-[10px] text-purple-600 mt-0.5">+ {stats.adminCount} admin{stats.adminCount > 1 ? 's' : ''}</p>
              )}
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.trial}</p>
              <p className="text-xs text-gray-500">En essai</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.trialExpired}</p>
              <p className="text-xs text-gray-500">Essais expirés</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              <p className="text-xs text-gray-500">Actifs</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.cancelled}</p>
              <p className="text-xs text-gray-500">Churned</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - Row 2: Programs & Customers */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Gift className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.withProgram}</p>
              <p className="text-xs text-gray-500">Avec programme</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.withoutProgram}</p>
              <p className="text-xs text-gray-500">Sans programme</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
              <p className="text-xs text-gray-500">Clients total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats by Type */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Par type de commerce</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(stats.byType)
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => {
              const Icon = SHOP_TYPE_ICONS[type as ShopType] || MoreHorizontal;
              return (
                <div
                  key={type}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium",
                    SHOP_TYPE_COLORS[type as ShopType] || 'bg-gray-100 text-gray-700'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{SHOP_TYPES[type as ShopType] || type}</span>
                  <span className="font-bold">({count})</span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-row sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5167fc] focus:border-transparent"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 sm:flex-wrap -mx-4 px-4 sm:mx-0 sm:px-0">
          {[
            { label: 'Tous', value: 'all' as FilterStatus, count: stats.total },
            { label: 'En essai', value: 'trial' as FilterStatus, count: stats.trial },
            { label: 'Expirés', value: 'trial_expired' as FilterStatus, count: stats.trialExpired },
            { label: 'Actifs', value: 'active' as FilterStatus, count: stats.active },
            { label: 'Churned', value: 'canceled' as FilterStatus, count: stats.cancelled },
          ].map((btn) => (
            <button
              key={btn.value}
              onClick={() => setStatusFilter(btn.value)}
              className={cn(
                "px-3 py-2 text-xs sm:text-sm font-medium rounded-xl transition-colors whitespace-nowrap flex-shrink-0",
                statusFilter === btn.value
                  ? "bg-[#5167fc] text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              )}
            >
              {btn.label} ({btn.count})
            </button>
          ))}
          {/* Admin toggle */}
          {stats.adminCount > 0 && (
            <button
              onClick={() => setShowAdmins(!showAdmins)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-xl transition-colors whitespace-nowrap flex items-center gap-2",
                showAdmins
                  ? "bg-purple-600 text-white"
                  : "bg-white text-purple-600 border border-purple-200 hover:bg-purple-50"
              )}
            >
              <Shield className="w-4 h-4" />
              Admin ({stats.adminCount})
            </button>
          )}
        </div>
      </div>

      {/* Merchants grouped by type */}
      {filteredMerchants.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
              <Store className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="font-medium text-gray-900">Aucun commerçant trouvé</p>
              <p className="text-sm text-gray-500 mt-1">Essayez de modifier vos filtres</p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedMerchants.map(([type, typeMerchants]) => {
                const Icon = SHOP_TYPE_ICONS[type as ShopType] || MoreHorizontal;
                const colorClass = SHOP_TYPE_COLORS[type as ShopType] || 'bg-gray-100 text-gray-700';

                return (
                  <div key={type} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Group Header */}
                    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", colorClass)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <h3 className="font-semibold text-gray-900">
                        {SHOP_TYPES[type as ShopType] || type}
                      </h3>
                      <span className="text-sm text-gray-500">({typeMerchants.length})</span>
                    </div>

                    {/* Merchants List */}
                    <div className="divide-y divide-gray-100">
                      {typeMerchants.map((merchant) => (
                        <Link
                          key={merchant.id}
                          href={`/admin/merchants/${merchant.id}`}
                          className="flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 transition-colors gap-2"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-[#5167fc] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              {merchant.shop_name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-gray-900 truncate">{merchant.shop_name}</p>
                                {merchant._isSuperAdmin && (
                                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-purple-100 text-purple-700 rounded-full flex-shrink-0">
                                    Admin
                                  </span>
                                )}
                                {/* Program Badge */}
                                {merchant._hasProgram ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-700 rounded-full flex-shrink-0">
                                    <Gift className="w-3 h-3" />
                                    Programme
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700 rounded-full flex-shrink-0">
                                    <AlertCircle className="w-3 h-3" />
                                    Sans programme
                                  </span>
                                )}
                              </div>
                              {/* Alert badges */}
                              {!merchant._isSuperAdmin && (
                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                  {!merchant._lastVisitDate && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold bg-red-100 text-red-700 rounded-full">
                                      <AlertTriangle className="w-2.5 h-2.5" /> 0 scan
                                    </span>
                                  )}
                                  {merchant.subscription_status === 'trial' && merchant.trial_ends_at && getDaysRemaining(merchant.trial_ends_at) !== null && getDaysRemaining(merchant.trial_ends_at)! <= 3 && getDaysRemaining(merchant.trial_ends_at)! > 0 && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold bg-orange-100 text-orange-700 rounded-full">
                                      <AlertTriangle className="w-2.5 h-2.5" /> Expire bientôt
                                    </span>
                                  )}
                                </div>
                              )}
                              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                {merchant.shop_address && (
                                  <span className="flex items-center gap-1 truncate">
                                    <MapPin className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{merchant.shop_address}</span>
                                  </span>
                                )}
                                <span className="flex-shrink-0">{formatDate(merchant.created_at)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Activity indicator */}
                            {!merchant._isSuperAdmin && (() => {
                              const activity = getActivityLabel(merchant);
                              return (
                                <span className={cn("text-[10px] font-semibold whitespace-nowrap", activity.color)}>
                                  {activity.text}
                                </span>
                              );
                            })()}
                            {/* Customer count */}
                            <div className={cn(
                              "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold",
                              (merchant._count?.customers || 0) > 0
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-500"
                            )}>
                              <Users className="w-3.5 h-3.5" />
                              <span>{merchant._count?.customers || 0}</span>
                            </div>
                            {getStatusBadge(merchant)}
                            {/* WhatsApp button */}
                            {merchant.phone && !merchant._isSuperAdmin && (
                              <button
                                onClick={(e) => { e.preventDefault(); openWhatsApp(merchant.phone, merchant.shop_name); }}
                                className="p-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                                title="Envoyer WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                            )}
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
    </div>
  );
}
