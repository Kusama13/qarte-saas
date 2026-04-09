'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from '@/i18n/navigation';
import { Users, UserCheck, UserPlus, Calendar, CalendarDays, Clock, Gift, Sparkles, ArrowRight, ArrowUpRight, ArrowDownRight, AlertTriangle, X, Shield, QrCode, CreditCard, Coins, Globe, Heart, Cake, Eye, MessageSquare } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { getSupabase } from '@/lib/supabase';
import { formatRelativeTime, getTodayForCountry, formatCurrency, unwrapJoin } from '@/lib/utils';
import { Button } from '@/components/ui';
import { useMerchant } from '@/contexts/MerchantContext';
import PendingPointsWidget from '@/components/dashboard/PendingPointsWidget';
import OnboardingChecklist from '@/components/dashboard/OnboardingChecklist';
import ZeroScansCoach from '@/components/dashboard/ZeroScansCoach';
import StatsCard from '@/components/dashboard/StatsCard';
import MilestoneModal from '@/components/dashboard/MilestoneModal';
import type { MilestoneType } from '@/components/dashboard/MilestoneModal';

// Cache for dashboard stats
const STATS_CACHE_KEY = 'qarte_dashboard_stats';
const STATS_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

// Try to load cached stats for instant display
function getCachedStats(merchantId: string) {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(`${STATS_CACHE_KEY}_${merchantId}`);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < STATS_CACHE_DURATION) {
        return data;
      }
    }
  } catch {
    // Ignore cache errors
  }
  return null;
}

function setCachedStats(merchantId: string, data: { stats: typeof initialStats; weeklyData: typeof initialWeeklyData }) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STATS_CACHE_KEY}_${merchantId}`, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch {
    // Ignore storage errors
  }
}

const initialStats = {
  totalCustomers: 0,
  activeCustomers: 0,
  visitsThisMonth: 0,
  redemptionsThisMonth: 0,
};

const initialWeeklyData = { thisWeek: 0, lastWeek: 0 };

interface ActivityEvent {
  type: 'scan' | 'reward' | 'referral' | 'welcome';
  timestamp: string;
  title: string;
  subtitle: string;
  customerId?: string;
}

const EVENT_CONFIG: Record<ActivityEvent['type'], { icon: React.ElementType; color: string; bg: string; href: string }> = {
  scan:     { icon: Eye,          color: 'text-emerald-600', bg: 'bg-emerald-50', href: '/dashboard/customers' },
  reward:   { icon: Gift,         color: 'text-pink-600',    bg: 'bg-pink-50',    href: '/dashboard/customers' },
  referral: { icon: UserPlus,     color: 'text-violet-600',  bg: 'bg-violet-50',  href: '/dashboard/referrals' },
  welcome:  { icon: Sparkles,     color: 'text-orange-600',  bg: 'bg-orange-50',  href: '/dashboard/customers' },
};

export default function DashboardPage() {
  const supabase = getSupabase();
  const { merchant, loading: merchantLoading, refetch } = useMerchant();
  const t = useTranslations('dashHome');
  const locale = useLocale();

  // Initialize from cache if available for instant display
  const [stats, setStats] = useState(() => {
    if (merchant?.id) {
      const cached = getCachedStats(merchant.id);
      return cached?.stats || initialStats;
    }
    return initialStats;
  });
  const [activityFeed, setActivityFeed] = useState<ActivityEvent[]>([]);
  const [weeklyData, setWeeklyData] = useState(() => {
    if (merchant?.id) {
      const cached = getCachedStats(merchant.id);
      return cached?.weeklyData || initialWeeklyData;
    }
    return initialWeeklyData;
  });

  const [cagnotteStats, setCagnotteStats] = useState({ totalCumul: 0, totalCashback: 0 });
  const [pendingReferrals, setPendingReferrals] = useState(0);
  const [welcomeVouchers, setWelcomeVouchers] = useState(0);
  const [upcomingBookings, setUpcomingBookings] = useState<Array<{
    id: string; slot_date: string; start_time: string; client_name: string; deposit_confirmed: boolean | null;
  }>>([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<Array<{
    firstName: string; lastName: string; birthMonth: number; birthDay: number;
  }>>([]);
  const birthdayDatesRef = useRef<Array<{ month: number; day: number }>>([]);
  const [smsUsage, setSmsUsage] = useState<{ sent: number; remaining: number; overageCount: number; overageCost: number; periodStart: string } | null>(null);

  // Fetch SMS usage
  useEffect(() => {
    if (!merchant?.id) return;
    fetch(`/api/sms/usage?merchantId=${merchant.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setSmsUsage(data); })
      .catch(() => {});
  }, [merchant?.id]);

  // If we have cached data, don't show loading state
  const [loading, setLoading] = useState(() => {
    if (merchant?.id) {
      const cached = getCachedStats(merchant.id);
      return !cached;
    }
    return true;
  });
  const [error, setError] = useState<string | null>(null);
  const [showShieldWarning, setShowShieldWarning] = useState(false);
  const [shieldEnabled, setShieldEnabled] = useState(true);
  const [activeMilestone, setActiveMilestone] = useState<MilestoneType | null>(null);
  const [servicesCount, setServicesCount] = useState(0);
  const [totalRedemptions, setTotalRedemptions] = useState(0);
  const [hasAnyBooking, setHasAnyBooking] = useState(false);


  // Sync shield status with merchant data
  useEffect(() => {
    if (merchant) {
      setShieldEnabled(merchant.shield_enabled !== false);
    }
  }, [merchant]);

  // Handle shield toggle
  const handleShieldToggle = useCallback(async (enabled: boolean) => {
    if (!merchant) return;

    if (!enabled) {
      // Show warning before disabling
      setShowShieldWarning(true);
      return;
    }

    // Enable shield directly
    try {
      const { error } = await supabase
        .from('merchants')
        .update({ shield_enabled: true })
        .eq('id', merchant.id);
      if (error) throw error;
      setShieldEnabled(true);
      refetch().catch(() => {});
    } catch (err) {
      console.error('Error enabling shield:', err);
    }
  }, [merchant, supabase, refetch]);

  // Confirm disable shield
  const confirmDisableShield = useCallback(async () => {
    if (!merchant) return;

    try {
      const { error } = await supabase
        .from('merchants')
        .update({ shield_enabled: false })
        .eq('id', merchant.id);
      if (error) throw error;
      setShieldEnabled(false);
      setShowShieldWarning(false);
      refetch().catch(() => {});
    } catch (err) {
      console.error('Error disabling shield:', err);
    }
  }, [merchant, supabase, refetch]);

  useEffect(() => {
    if (merchantLoading) return;
    if (!merchant) return;

    const fetchData = async () => {
      try {
        // Use merchant timezone for all date calculations
        const todayStr = getTodayForCountry(merchant.country);
        const todayBase = new Date(todayStr);

        const thirtyDaysAgo = new Date(todayBase);
        thirtyDaysAgo.setDate(todayBase.getDate() - 30);

        const firstDayOfMonth = new Date(todayBase.getFullYear(), todayBase.getMonth(), 1);

        // Week comparison date ranges
        const sevenDaysAgo = new Date(todayBase);
        sevenDaysAgo.setDate(todayBase.getDate() - 7);

        const fourteenDaysAgo = new Date(todayBase);
        fourteenDaysAgo.setDate(todayBase.getDate() - 14);

        // Birthday dates (today, +1, +2) for upcoming birthdays
        const birthdayDates: { month: number; day: number }[] = [];
        for (let i = 0; i < 3; i++) {
          const d = new Date(todayBase);
          d.setDate(todayBase.getDate() + i);
          birthdayDates.push({ month: d.getMonth() + 1, day: d.getDate() });
        }
        birthdayDatesRef.current = birthdayDates;

        // Execute ALL queries in parallel for maximum speed
        const [
          totalCustomersResult,
          activeCustomersResult,
          visitsThisMonthResult,
          redemptionsThisMonthResult,
          feedVisitsResult,
          thisWeekVisitsResult,
          lastWeekVisitsResult,
          cagnotteCardsResult,
          pendingReferralsResult,
          welcomeVouchersResult,
          upcomingBookingsResult,
          feedRedemptionsResult,
          birthdayResult,
          servicesCountResult,
          allRedemptionsResult,
          allBookingsResult,
          feedReferralsResult,
          feedWelcomeResult,
        ] = await Promise.all([
          // Stats queries
          supabase
            .from('loyalty_cards')
            .select('*', { count: 'exact', head: true })
            .eq('merchant_id', merchant.id),
          supabase
            .from('loyalty_cards')
            .select('*', { count: 'exact', head: true })
            .eq('merchant_id', merchant.id)
            .gte('last_visit_date', thirtyDaysAgo.toISOString().split('T')[0]),
          supabase
            .from('visits')
            .select('*', { count: 'exact', head: true })
            .eq('merchant_id', merchant.id)
            .gte('visited_at', firstDayOfMonth.toISOString()),
          supabase
            .from('redemptions')
            .select('*', { count: 'exact', head: true })
            .eq('merchant_id', merchant.id)
            .gte('redeemed_at', firstDayOfMonth.toISOString()),
          // Recent visits for activity feed
          supabase
            .from('visits')
            .select('visited_at, points_earned, loyalty_card:loyalty_cards!inner(customer_id, customer:customers(first_name, last_name))')
            .eq('merchant_id', merchant.id)
            .gte('visited_at', thirtyDaysAgo.toISOString())
            .eq('status', 'confirmed')
            .order('visited_at', { ascending: false })
            .limit(8),
          // This week visits (last 7 days)
          supabase
            .from('visits')
            .select('*', { count: 'exact', head: true })
            .eq('merchant_id', merchant.id)
            .gte('visited_at', sevenDaysAgo.toISOString()),
          // Previous week visits (7-14 days ago)
          supabase
            .from('visits')
            .select('*', { count: 'exact', head: true })
            .eq('merchant_id', merchant.id)
            .gte('visited_at', fourteenDaysAgo.toISOString())
            .lt('visited_at', sevenDaysAgo.toISOString()),
          // Cagnotte: fetch all current_amount values
          merchant.loyalty_mode === 'cagnotte'
            ? supabase
                .from('loyalty_cards')
                .select('current_amount')
                .eq('merchant_id', merchant.id)
            : Promise.resolve({ data: null }),
          // Pending referrals
          merchant.referral_program_enabled
            ? supabase
                .from('referrals')
                .select('*', { count: 'exact', head: true })
                .eq('merchant_id', merchant.id)
                .eq('status', 'pending')
            : Promise.resolve({ count: 0 }),
          // Welcome offer voucher signups
          merchant.welcome_offer_enabled
            ? supabase
                .from('vouchers')
                .select('*', { count: 'exact', head: true })
                .eq('merchant_id', merchant.id)
                .eq('source', 'welcome')
            : Promise.resolve({ count: 0 }),
          // Upcoming booked planning slots (primary slots only)
          merchant.planning_enabled
            ? supabase
                .from('merchant_planning_slots')
                .select('id, slot_date, start_time, client_name, deposit_confirmed')
                .eq('merchant_id', merchant.id)
                .not('client_name', 'is', null)
                .is('primary_slot_id', null)
                .gte('slot_date', todayStr)
                .order('slot_date', { ascending: true })
                .order('start_time', { ascending: true })
                .limit(5)
            : Promise.resolve({ data: [] }),
          // Recent redemptions for activity feed
          supabase
            .from('redemptions')
            .select('redeemed_at, tier, loyalty_card:loyalty_cards!inner(customer_id, customer:customers(first_name))')
            .eq('merchant_id', merchant.id)
            .gte('redeemed_at', thirtyDaysAgo.toISOString())
            .order('redeemed_at', { ascending: false })
            .limit(8),
          // Upcoming birthdays (next 3 days)
          merchant.birthday_gift_enabled
            ? supabase
                .from('loyalty_cards')
                .select('customer:customers(id, first_name, last_name, birth_month, birth_day)')
                .eq('merchant_id', merchant.id)
                .not('customer.birth_month', 'is', null)
                .in('customer.birth_month', [...new Set(birthdayDates.map(d => d.month))])
            : Promise.resolve({ data: [] }),
          // Milestone queries (trial only)
          merchant.subscription_status === 'trial'
            ? supabase
                .from('merchant_services')
                .select('*', { count: 'exact', head: true })
                .eq('merchant_id', merchant.id)
            : Promise.resolve({ count: 0 }),
          merchant.subscription_status === 'trial'
            ? supabase
                .from('redemptions')
                .select('*', { count: 'exact', head: true })
                .eq('merchant_id', merchant.id)
            : Promise.resolve({ count: 0 }),
          merchant.subscription_status === 'trial' && merchant.planning_enabled
            ? supabase
                .from('merchant_planning_slots')
                .select('*', { count: 'exact', head: true })
                .eq('merchant_id', merchant.id)
                .not('client_name', 'is', null)
            : Promise.resolve({ count: 0 }),
          // Activity feed: referrals, welcome
          supabase
            .from('referrals')
            .select('created_at, status')
            .eq('merchant_id', merchant.id)
            .order('created_at', { ascending: false })
            .limit(8),
          merchant.welcome_offer_enabled
            ? supabase
                .from('vouchers')
                .select('created_at, customer_id, customer:customers(first_name)')
                .eq('merchant_id', merchant.id)
                .eq('source', 'welcome')
                .order('created_at', { ascending: false })
                .limit(8)
            : Promise.resolve({ data: [] }),
        ]);

        // Set pending referrals + welcome vouchers
        setPendingReferrals(pendingReferralsResult.count || 0);
        setWelcomeVouchers(welcomeVouchersResult.count || 0);

        if (upcomingBookingsResult.data) {
          setUpcomingBookings(upcomingBookingsResult.data as typeof upcomingBookings);
        }

        // Set upcoming birthdays
        if (birthdayResult.data) {
          const birthdays = (birthdayResult.data as Array<{ customer: { id: string; first_name: string; last_name: string; birth_month: number; birth_day: number } | null }>)
            .map(c => c.customer)
            .filter((c): c is NonNullable<typeof c> => c !== null && birthdayDates.some(d => d.month === c.birth_month && d.day === c.birth_day))
            .map(c => ({ firstName: c.first_name, lastName: c.last_name, birthMonth: c.birth_month, birthDay: c.birth_day }));
          setUpcomingBirthdays(birthdays);
        }

        // Compute cagnotte stats
        if (merchant.loyalty_mode === 'cagnotte' && cagnotteCardsResult.data) {
          const amounts = cagnotteCardsResult.data as { current_amount: number }[];
          const totalCumul = amounts.reduce((sum, c) => sum + Number(c.current_amount || 0), 0);
          const percent = Number(merchant.cagnotte_percent || 0);
          const totalCashback = Math.round(totalCumul * percent) / 100;
          setCagnotteStats({ totalCumul, totalCashback });
        }

        // Milestone data
        setServicesCount(servicesCountResult.count || 0);
        setTotalRedemptions(allRedemptionsResult.count || 0);
        setHasAnyBooking((allBookingsResult.count || 0) >= 1);

        const newStats = {
          totalCustomers: totalCustomersResult.count || 0,
          activeCustomers: activeCustomersResult.count || 0,
          visitsThisMonth: visitsThisMonthResult.count || 0,
          redemptionsThisMonth: redemptionsThisMonthResult.count || 0,
        };
        setStats(newStats);

        // Build activity feed
        const feed: ActivityEvent[] = [];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const v of (feedVisitsResult.data || []) as any[]) {
          const card = unwrapJoin(v.loyalty_card);
          const cust = unwrapJoin(card?.customer);
          const name = cust ? `${cust.first_name} ${cust.last_name?.charAt(0) || ''}`.trim() : t('defaultClient');
          feed.push({ type: 'scan', timestamp: v.visited_at, title: name, subtitle: t('activityScan', { points: v.points_earned }), customerId: card?.customer_id });
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const r of (feedRedemptionsResult.data || []) as any[]) {
          const card = unwrapJoin(r.loyalty_card);
          const cust = unwrapJoin(card?.customer);
          feed.push({ type: 'reward', timestamp: r.redeemed_at, title: cust?.first_name || t('defaultClient'), subtitle: t('activityReward'), customerId: card?.customer_id });
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const ref of (feedReferralsResult.data || []) as any[]) {
          feed.push({ type: 'referral', timestamp: ref.created_at, title: ref.status === 'completed' ? t('activityReferralDone') : t('activityReferral'), subtitle: '' });
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const w of (feedWelcomeResult.data || []) as any[]) {
          const cust = unwrapJoin(w.customer);
          feed.push({ type: 'welcome', timestamp: w.created_at, title: cust?.first_name || t('defaultClient'), subtitle: t('activityWelcome'), customerId: w.customer_id });
        }

        // Sort by timestamp DESC and take 8
        feed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setActivityFeed(feed.slice(0, 8));

        // Process weekly comparison
        const newWeeklyData = {
          thisWeek: thisWeekVisitsResult.count || 0,
          lastWeek: lastWeekVisitsResult.count || 0,
        };
        setWeeklyData(newWeeklyData);

        setCachedStats(merchant.id, {
          stats: newStats,
          weeklyData: newWeeklyData,
        });

      } catch (err) {
        console.error('Dashboard error:', err);
        setError(t('errorLoading'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchant, merchantLoading]);

  // Milestone celebration detection (trial only)
  useEffect(() => {
    if (!merchant || loading) return;
    if (merchant.subscription_status !== 'trial') return;

    const PRIORITY: MilestoneType[] = [
      'vitrine_live', 'services_added', 'planning_active',
      'first_scan', 'first_booking', 'first_reward',
    ];

    const checks: Record<MilestoneType, boolean> = {
      vitrine_live: !!(merchant.bio && merchant.shop_address),
      services_added: servicesCount >= 1,
      planning_active: merchant.planning_enabled === true,
      first_scan: stats.totalCustomers >= 1,
      first_booking: hasAnyBooking,
      first_reward: totalRedemptions >= 1,
    };

    for (const type of PRIORITY) {
      const key = `qarte_milestone_${type}_${merchant.id}`;
      if (checks[type] && !localStorage.getItem(key)) {
        localStorage.setItem(key, Date.now().toString());
        setActiveMilestone(type);
        break;
      }
    }
  }, [merchant, loading, stats.totalCustomers, servicesCount, totalRedemptions, hasAnyBooking]);

  if (merchantLoading || loading) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Header skeleton */}
        <div>
          <div className="h-8 w-64 bg-gray-200 rounded-lg mb-2"></div>
          <div className="h-4 w-48 bg-gray-100 rounded-lg"></div>
        </div>

        {/* Stats skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-6 bg-white rounded-3xl shadow-sm">
              <div className="flex justify-between">
                <div>
                  <div className="h-3 w-20 bg-gray-200 rounded mb-3"></div>
                  <div className="h-8 w-16 bg-gray-300 rounded"></div>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-2xl"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts skeleton */}
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="p-8 bg-white rounded-3xl shadow-sm">
            <div className="h-6 w-48 bg-gray-200 rounded mb-8"></div>
            <div className="h-[250px] bg-gray-50 rounded-2xl"></div>
          </div>
          <div className="p-8 bg-white rounded-3xl shadow-sm">
            <div className="h-6 w-32 bg-gray-200 rounded mb-8"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                  <div className="w-12 h-12 bg-gray-200 rounded-2xl"></div>
                  <div className="flex-1">
                    <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 w-16 bg-gray-100 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>{t('retry')}</Button>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderDepositBadge = (status: boolean | null) => {
    if (status === false) return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        {t('depositPending')}
      </span>
    );
    if (status === true) return (
      <span className="text-[10px] font-bold text-emerald-600">{t('depositOk')}</span>
    );
    return null;
  };

  return (
      <div className="space-y-8">
        <div className="p-4 md:p-6 rounded-2xl bg-[#4b0082]/[0.04] border border-[#4b0082]/[0.08]">
          <h1 className="text-xl md:text-3xl font-extrabold tracking-tight text-gray-900">
          {t('greeting')} <span className="bg-gradient-to-r from-[#4b0082] to-violet-600 bg-clip-text text-transparent">
            {merchant?.shop_name}
          </span>
        </h1>
        <p className="mt-1 text-sm md:text-base font-medium text-gray-500">
          {stats.totalCustomers === 0
            ? t('subtitleNoClients')
            : stats.activeCustomers > 0
              ? t('subtitleActive', { count: stats.activeCustomers })
              : t('subtitleInactive')}
        </p>
      </div>

      {/* Onboarding Checklist */}
      <OnboardingChecklist />

      {/* Raccourcis rapides */}
      <div className="md:hidden space-y-2">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 px-1">{t('shortcuts')}</p>
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { href: '/dashboard/public-page', icon: Globe, label: t('shortcutPage'), color: 'text-white', bg: 'bg-white/25', gradient: true, gradientColors: 'from-indigo-500 to-violet-600 border-indigo-400/30 shadow-indigo-500/20' },
            { href: '/dashboard/program', icon: Heart, label: t('shortcutLoyalty'), color: 'text-white', bg: 'bg-white/25', gradient: true, gradientColors: 'from-pink-500 to-rose-600 border-pink-400/30 shadow-pink-500/20' },
            { href: '/dashboard/planning', icon: CalendarDays, label: t('shortcutPlanning'), color: 'text-white', bg: 'bg-white/25', gradient: true, gradientColors: 'from-cyan-500 to-blue-600 border-cyan-400/30 shadow-cyan-500/20' },
            { href: '/dashboard/customers', icon: Users, label: t('shortcutClients'), color: 'text-gray-500', bg: 'bg-gray-50' },
            { href: '/dashboard/qr-download', icon: QrCode, label: t('shortcutQr'), color: 'text-gray-500', bg: 'bg-gray-50' },
            { href: '/dashboard/subscription', icon: CreditCard, label: t('shortcutSubscription'), color: 'text-gray-500', bg: 'bg-gray-50' },
          ].map(({ href, icon: Icon, label, color, bg, gradient, gradientColors }: { href: string; icon: React.ElementType; label: string; color: string; bg: string; gradient?: boolean; gradientColors?: string }) => (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-2 p-3 rounded-2xl active:scale-95 transition-transform ${
                gradient
                  ? `bg-gradient-to-br ${gradientColors || 'from-indigo-600 to-violet-600 border-indigo-500/20'} border shadow-md`
                  : 'bg-white border border-gray-100 shadow-sm'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <span className={`text-[11px] font-semibold text-center leading-tight ${gradient ? 'text-white' : 'text-gray-600'}`}>{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Upcoming Bookings Widget */}
      {merchant.planning_enabled && upcomingBookings.length > 0 && (() => {
        const todayStr2 = getTodayForCountry(merchant.country);
        const tomorrowDate = new Date(todayStr2);
        tomorrowDate.setDate(tomorrowDate.getDate() + 1);
        const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

        const todayBookings = upcomingBookings.filter(b => b.slot_date === todayStr2);
        const laterBookings = upcomingBookings.filter(b => b.slot_date !== todayStr2);

        return (
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl md:rounded-3xl shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-cyan-400 to-blue-400" />
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-cyan-500" />
                  <h2 className="text-sm md:text-base font-bold text-gray-900">{t('upcomingBookings')}</h2>
                </div>
                <Link href="/dashboard/planning" className="flex items-center gap-1 text-xs font-semibold text-cyan-600 hover:text-cyan-700">
                  {t('viewPlanning')}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Today section */}
              {todayBookings.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-cyan-500 mb-2">{t('today')}</p>
                  <div className="space-y-1.5">
                    {todayBookings.map((b) => (
                      <Link key={b.id} href={`/dashboard/planning?slot=${b.id}`} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-cyan-50/60 border border-cyan-100 hover:bg-cyan-50 transition-colors cursor-pointer active:scale-[0.99]">
                        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-cyan-500 text-white shrink-0">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{b.client_name}</p>
                          {renderDepositBadge(b.deposit_confirmed)}
                        </div>
                        <span className="text-sm font-bold text-cyan-700 shrink-0">{b.start_time}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Later section */}
              {laterBookings.length > 0 && (
                <div>
                  {todayBookings.length > 0 && (
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 mb-2">{t('upcoming')}</p>
                  )}
                  <div className="space-y-1.5">
                    {laterBookings.map((b) => {
                      const isTomorrow = b.slot_date === tomorrowStr;
                      const slotDate = new Date(b.slot_date + 'T12:00:00');
                      const dayLabel = isTomorrow
                        ? t('tomorrow')
                        : slotDate.toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

                      return (
                        <Link key={b.id} href={`/dashboard/planning?slot=${b.id}`} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50/80 hover:bg-gray-100/80 transition-colors cursor-pointer active:scale-[0.99]">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{b.client_name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-[11px] text-gray-400">{dayLabel}</p>
                              {renderDepositBadge(b.deposit_confirmed)}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 text-xs font-medium text-gray-400">
                            <Clock className="w-3 h-3" />
                            {b.start_time}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Upcoming Birthdays — near bookings for urgency */}
      {merchant?.birthday_gift_enabled && upcomingBirthdays.length > 0 && (
        <div className="bg-pink-50/50 border border-pink-100 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-pink-100">
              <Cake className="w-4 h-4 text-pink-600" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">{t('upcomingBirthdays')}</h3>
          </div>
          <div className="space-y-1.5">
            {upcomingBirthdays.map((b, i) => {
              const bd = birthdayDatesRef.current;
              const label = bd[0]?.month === b.birthMonth && bd[0]?.day === b.birthDay
                ? t('birthdayToday')
                : bd[1]?.month === b.birthMonth && bd[1]?.day === b.birthDay
                  ? t('birthdayTomorrow')
                  : t('birthdayIn2Days');
              return (
                <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/70">
                  <div className="flex items-center justify-center w-8 h-8 shrink-0 text-xs font-bold text-white rounded-lg bg-gradient-to-br from-pink-500 to-rose-500">
                    {b.firstName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {b.firstName} {b.lastName?.charAt(0) ? `${b.lastName.charAt(0)}.` : ''}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-pink-600 bg-pink-100 px-2 py-0.5 rounded-full shrink-0">{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Shield Disable Warning Modal */}
      {showShieldWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-red-100">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900">{t('disableShieldTitle')}</h4>
                <p className="text-sm text-gray-500">{t('disableShieldSubtitle')}</p>
              </div>
              <button
                onClick={() => setShowShieldWarning(false)}
                className="ml-auto p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-red-50 border border-red-100 mb-6">
              <p className="text-sm text-red-800 font-medium mb-2">{t('disableShieldRisks')}</p>
              <ul className="text-sm text-red-700 space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span>{t('disableShieldRisk1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span>{t('disableShieldRisk2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span>{t('disableShieldRisk3')}</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowShieldWarning(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                {t('disableShieldCancel')}
              </button>
              <button
                type="button"
                onClick={confirmDisableShield}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
              >
                {t('disableShieldConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Link href="/dashboard/customers" className="block">
          <StatsCard
            title={t('totalClients')}
            value={stats.totalCustomers}
            icon={Users}
            color="#654EDA"
          />
        </Link>
        <Link href="/dashboard/customers" className="block">
          <StatsCard
            title={t('activeClients')}
            value={stats.activeCustomers}
            icon={UserCheck}
            color="#10B981"
          />
        </Link>
        <StatsCard
          title={t('visitsMonth')}
          value={stats.visitsThisMonth}
          icon={Calendar}
          color="#F59E0B"
        />
        <StatsCard
          title={t('rewardsMonth')}
          value={stats.redemptionsThisMonth}
          icon={Gift}
          color="#EC4899"
        />
      </div>

      {merchant?.loyalty_mode === 'cagnotte' && (
        <div className="grid grid-cols-2 gap-3">
          <StatsCard
            title={t('cumulClients')}
            value={formatCurrency(cagnotteStats.totalCumul, merchant?.country)}
            icon={Coins}
            color="#059669"
          />
          <StatsCard
            title={t('cashbackOngoing')}
            value={formatCurrency(cagnotteStats.totalCashback, merchant?.country)}
            icon={Gift}
            color="#D97706"
          />
        </div>
      )}

      {/* Referrals + Welcome offer highlights */}
      {(pendingReferrals > 0 || welcomeVouchers > 0) && (
        <div className="grid grid-cols-2 gap-3">
          {pendingReferrals > 0 && (
            <Link href="/dashboard/referrals" className="block">
              <StatsCard
                title={t('pendingReferrals')}
                value={pendingReferrals}
                icon={UserPlus}
                color="#3B82F6"
              />
            </Link>
          )}
          {welcomeVouchers > 0 && (
            <Link href="/dashboard/customers" className="block">
              <StatsCard
                title={t('welcomeOffer')}
                value={welcomeVouchers}
                icon={Gift}
                color="#8B5CF6"
              />
            </Link>
          )}
        </div>
      )}

      {stats.totalCustomers > 0 && (
        <PendingPointsWidget
          merchantId={merchant.id}
          shieldEnabled={shieldEnabled}
          onShieldToggle={handleShieldToggle}
        />
      )}

      {/* SMS Quota Widget */}
      {smsUsage && (() => {
        const isPaid = merchant?.subscription_status === 'active' || merchant?.subscription_status === 'canceling' || merchant?.subscription_status === 'past_due';
        const pct = Math.min(100, Math.round((smsUsage.sent / 100) * 100));
        const isOverage = smsUsage.sent > 100;
        const periodStartDate = new Date(smsUsage.periodStart);
        const periodEndDate = new Date(periodStartDate);
        periodEndDate.setMonth(periodEndDate.getMonth() + 1);
        const fmtDate = (d: Date) => d.toLocaleDateString(locale === 'en' ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'short' });
        return (
          <div className={`backdrop-blur-xl border rounded-2xl md:rounded-3xl shadow-sm p-4 md:p-6 ${isPaid ? 'bg-white/80 border-white/20' : 'bg-amber-50/80 border-amber-200/40'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${isOverage ? 'bg-amber-50' : 'bg-emerald-50'}`}>
                  <MessageSquare className={`w-4 h-4 ${isOverage ? 'text-amber-600' : 'text-emerald-600'}`} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{t('smsQuotaTitle')}</h3>
                  <p className="text-[10px] text-gray-400">{t('smsQuotaDesc')}</p>
                </div>
              </div>
              {isPaid && (
                <div className="text-right">
                  <span className="text-xs font-bold text-gray-700">{t('smsQuotaUsed', { sent: smsUsage.sent })}</span>
                  <p className="text-[9px] text-gray-400">{fmtDate(periodStartDate)} — {fmtDate(periodEndDate)}</p>
                </div>
              )}
            </div>
            {isPaid ? (
              <div className="mt-2">
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isOverage ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {isOverage && (
                  <p className="text-[11px] font-semibold text-amber-600 mt-1.5">
                    {t('smsOverage', { count: smsUsage.overageCount, cost: smsUsage.overageCost.toFixed(2) })}
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-[11px] text-gray-500">{t('smsQuotaTrialHint')}</p>
                <Link href="/dashboard/subscription" className="shrink-0 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-[11px] font-bold hover:shadow-md transition-all">
                  {t('smsQuotaTrialCta')}
                </Link>
              </div>
            )}
          </div>
        );
      })()}

      <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
        {/* Weekly Comparison Card */}
        <div className="group relative overflow-hidden bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl md:rounded-3xl shadow-xl shadow-indigo-100/50 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-200/50">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-600 to-violet-600" />
          <div className="p-5 md:p-8">
            <p className="text-[10px] font-black text-slate-400/80 uppercase tracking-[0.2em] mb-4 md:mb-6">
              {t('last7Days')}
            </p>
            {weeklyData.thisWeek > 0 || weeklyData.lastWeek > 0 ? (
              <div>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-3xl md:text-5xl font-black tracking-[-0.03em] text-slate-900">
                    {weeklyData.thisWeek}
                  </span>
                  <span className="text-sm md:text-base font-semibold text-slate-400">
                    {weeklyData.thisWeek !== 1 ? t('visitsPlural') : t('visits')}
                  </span>
                </div>

                {weeklyData.lastWeek > 0 ? (() => {
                  const change = Math.round(((weeklyData.thisWeek - weeklyData.lastWeek) / weeklyData.lastWeek) * 100);
                  const isPositive = change >= 0;
                  return (
                    <div className="flex items-center gap-2.5 mt-3">
                      <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${
                        isPositive
                          ? 'bg-emerald-50/80 text-emerald-600 border border-emerald-100/50'
                          : 'bg-red-50/80 text-red-600 border border-red-100/50'
                      }`}>
                        {isPositive ? (
                          <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5 stroke-[3]" />
                        )}
                        {change > 0 ? '+' : ''}{change}%
                      </div>
                      <span className="text-sm text-slate-500">
                        {t('vsLastWeek', { count: weeklyData.lastWeek })}
                      </span>
                    </div>
                  );
                })() : (
                  <p className="text-sm text-slate-400 mt-3">
                    {t('noPrevWeekData')}
                  </p>
                )}

                {/* Visual comparison bars */}
                <div className="mt-8 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider w-20 shrink-0">{t('thisWeek')}</span>
                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700"
                        style={{ width: `${Math.min((weeklyData.thisWeek / Math.max(weeklyData.thisWeek, weeklyData.lastWeek, 1)) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-slate-700 w-8 text-right tabular-nums">{weeklyData.thisWeek}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-20 shrink-0">{t('prevWeek')}</span>
                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-300 rounded-full transition-all duration-700"
                        style={{ width: `${Math.min((weeklyData.lastWeek / Math.max(weeklyData.thisWeek, weeklyData.lastWeek, 1)) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-slate-400 w-8 text-right tabular-nums">{weeklyData.lastWeek}</span>
                  </div>
                </div>

                {/* Trend message */}
                {weeklyData.lastWeek > 0 && (() => {
                  const change = Math.round(((weeklyData.thisWeek - weeklyData.lastWeek) / weeklyData.lastWeek) * 100);
                  if (change > 0) return <p className="text-xs text-emerald-600 font-medium mt-4">{t('trendUp', { percent: change })}</p>;
                  if (change < 0) return <p className="text-xs text-red-500 font-medium mt-4">{t('trendDown', { percent: Math.abs(change) })}</p>;
                  return <p className="text-xs text-gray-400 font-medium mt-4">{t('trendStable')}</p>;
                })()}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-gray-500">
                <div className="p-4 mb-4 rounded-2xl bg-indigo-50/50">
                  <Calendar className="w-10 h-10 text-indigo-200" />
                </div>
                <p className="font-medium text-gray-900">{t('noVisits')}</p>
                <p className="text-sm">{t('noVisitsHint')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Activity Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl md:rounded-3xl shadow-xl shadow-indigo-100/50 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-200/50">
          <div className="p-4 md:p-6">
            <h2 className="text-base md:text-xl font-bold tracking-tight text-gray-900 mb-3">
              {t('recentActivity')}
            </h2>

            {activityFeed.length > 0 ? (
              <div className="space-y-1.5">
                {activityFeed.map((event, i) => {
                  const config = EVENT_CONFIG[event.type];
                  const Icon = config.icon;
                  return (
                    <Link
                      key={`${event.type}-${i}`}
                      href={event.customerId ? `${config.href}?customer=${event.customerId}` : config.href}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gray-50/80 border border-transparent hover:bg-white hover:border-gray-200 hover:shadow-sm transition-all duration-150 cursor-pointer"
                    >
                      <div className={`flex items-center justify-center w-8 h-8 shrink-0 rounded-lg ${config.bg}`}>
                        <Icon className={`w-4 h-4 ${config.color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-gray-900 truncate">{event.title}</p>
                        </div>
                        {event.subtitle && (
                          <p className="text-[11px] text-gray-400 leading-none mt-0.5">{event.subtitle}</p>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 shrink-0 whitespace-nowrap">
                        {formatRelativeTime(event.timestamp, locale)}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : merchant?.reward_description ? (
              <ZeroScansCoach merchant={merchant} />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <div className="p-4 mb-4 rounded-2xl bg-indigo-50/50">
                  <Users className="w-10 h-10 text-indigo-200" />
                </div>
                <p className="font-medium text-gray-900">{t('noClientsYet')}</p>
                <p className="text-sm">{t('noClientsHint')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {activeMilestone && (
        <MilestoneModal type={activeMilestone} onClose={() => setActiveMilestone(null)} />
      )}
      </div>
  );
}
