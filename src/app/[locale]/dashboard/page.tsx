'use client';

import { useState, useEffect, useCallback } from 'react';
import { Link } from '@/i18n/navigation';
import { Users, Gift, AlertTriangle, X, Eye, UserPlus, Sparkles } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { getSupabase } from '@/lib/supabase';
import { formatRelativeTime, getTodayForCountry, unwrapJoin } from '@/lib/utils';
import { Button } from '@/components/ui';
import { useMerchant } from '@/contexts/MerchantContext';
import { showPlanningUi } from '@/lib/plan-tiers';
import PendingPointsWidget from '@/components/dashboard/PendingPointsWidget';
import PendingDepositsWidget from '@/components/dashboard/PendingDepositsWidget';
import OnboardingChecklist from '@/components/dashboard/OnboardingChecklist';
import ZeroScansCoach from '@/components/dashboard/ZeroScansCoach';
import HeroToday from '@/components/dashboard/HeroToday';
import ToSeeList, { type ToSeeItem } from '@/components/dashboard/ToSeeList';
import WeekTiles from '@/components/dashboard/WeekTiles';
import SmsRecent from '@/components/dashboard/SmsRecent';
import MilestoneModal from '@/components/dashboard/MilestoneModal';
import type { MilestoneType } from '@/components/dashboard/MilestoneModal';

// Cache for dashboard stats
const STATS_CACHE_KEY = 'qarte_dashboard_stats_v2';
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
};

const initialWeeklyData = { thisWeek: 0, lastWeek: 0 };

interface ActivityEvent {
  type: 'scan' | 'reward' | 'referral' | 'welcome';
  timestamp: string;
  title: string;
  subtitle: string;
  customerId?: string;
}

const EVENT_CONFIG: Record<ActivityEvent['type'], { icon: React.ElementType; href: string; color: string }> = {
  scan:     { icon: Eye,      href: '/dashboard/customers', color: 'text-emerald-500' },
  reward:   { icon: Gift,     href: '/dashboard/customers', color: 'text-pink-500' },
  referral: { icon: UserPlus, href: '/dashboard/referrals', color: 'text-blue-500' },
  welcome:  { icon: Sparkles, href: '/dashboard/customers', color: 'text-amber-500' },
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

  const [pendingReferrals, setPendingReferrals] = useState(0);
  const [welcomeVouchers, setWelcomeVouchers] = useState(0);
  const [todayVisitsCount, setTodayVisitsCount] = useState(0);
  const [todayRedemptionsCount, setTodayRedemptionsCount] = useState(0);
  const [thisWeekRedemptions, setThisWeekRedemptions] = useState(0);
  const [lastWeekRedemptions, setLastWeekRedemptions] = useState(0);
  const [nearRewardCustomers, setNearRewardCustomers] = useState<Array<{
    id: string; firstName: string; remaining: number;
  }>>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<Array<{
    id: string; slot_date: string; start_time: string; client_name: string; deposit_confirmed: boolean | null;
    total_duration_minutes: number | null;
    services: Array<{ name: string; duration: number | null; price: number | null }>;
  }>>([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<Array<{
    firstName: string; lastName: string; birthMonth: number; birthDay: number;
  }>>([]);
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
        const firstDayOfNextMonth = new Date(todayBase.getFullYear(), todayBase.getMonth() + 1, 1);

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

        // Today bounds (timezone-aware)
        const todayStartIso = new Date(`${todayStr}T00:00:00`).toISOString();
        const todayEndIso = new Date(new Date(`${todayStr}T00:00:00`).getTime() + 24 * 60 * 60 * 1000).toISOString();

        const stampsRequired = merchant.stamps_required || 0;
        const tier1Threshold = stampsRequired > 1 ? stampsRequired - 1 : null; // proche palier 1

        const [
          totalCustomersResult,
          feedVisitsResult,
          thisWeekVisitsResult,
          lastWeekVisitsResult,
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
          todayVisitsResult,
          todayRedemptionsResult,
          thisWeekRedemptionsResult,
          lastWeekRedemptionsResult,
          nearRewardResult,
        ] = await Promise.all([
          supabase
            .from('loyalty_cards')
            .select('*', { count: 'exact', head: true })
            .eq('merchant_id', merchant.id),
          supabase
            .from('visits')
            .select('visited_at, points_earned, loyalty_card:loyalty_cards!inner(customer_id, customer:customers(first_name, last_name))')
            .eq('merchant_id', merchant.id)
            .gte('visited_at', thirtyDaysAgo.toISOString())
            .eq('status', 'confirmed')
            .order('visited_at', { ascending: false })
            .limit(8),
          supabase
            .from('visits')
            .select('*', { count: 'exact', head: true })
            .eq('merchant_id', merchant.id)
            .gte('visited_at', sevenDaysAgo.toISOString()),
          supabase
            .from('visits')
            .select('*', { count: 'exact', head: true })
            .eq('merchant_id', merchant.id)
            .gte('visited_at', fourteenDaysAgo.toISOString())
            .lt('visited_at', sevenDaysAgo.toISOString()),
          merchant.referral_program_enabled
            ? supabase.from('referrals').select('*', { count: 'exact', head: true }).eq('merchant_id', merchant.id).eq('status', 'pending')
            : Promise.resolve({ count: 0 }),
          merchant.welcome_offer_enabled
            ? supabase.from('vouchers').select('*', { count: 'exact', head: true }).eq('merchant_id', merchant.id).eq('source', 'welcome')
            : Promise.resolve({ count: 0 }),
          merchant.planning_enabled
            ? supabase
                .from('merchant_planning_slots')
                .select('id, slot_date, start_time, client_name, deposit_confirmed, total_duration_minutes, planning_slot_services(service:merchant_services!service_id(name, duration, price))')
                .eq('merchant_id', merchant.id)
                .not('client_name', 'is', null)
                .neq('client_name', '__blocked__')
                .is('primary_slot_id', null)
                .gte('slot_date', todayStr)
                .order('slot_date', { ascending: true })
                .order('start_time', { ascending: true })
                .limit(5)
            : Promise.resolve({ data: [] }),
          supabase
            .from('redemptions')
            .select('redeemed_at, tier, loyalty_card:loyalty_cards!inner(customer_id, customer:customers(first_name))')
            .eq('merchant_id', merchant.id)
            .gte('redeemed_at', thirtyDaysAgo.toISOString())
            .order('redeemed_at', { ascending: false })
            .limit(8),
          merchant.birthday_gift_enabled
            ? supabase
                .from('loyalty_cards')
                .select('customer:customers(id, first_name, last_name, birth_month, birth_day)')
                .eq('merchant_id', merchant.id)
                .not('customer.birth_month', 'is', null)
                .in('customer.birth_month', [...new Set(birthdayDates.map(d => d.month))])
            : Promise.resolve({ data: [] }),
          merchant.subscription_status === 'trial'
            ? supabase.from('merchant_services').select('*', { count: 'exact', head: true }).eq('merchant_id', merchant.id)
            : Promise.resolve({ count: 0 }),
          merchant.subscription_status === 'trial'
            ? supabase.from('redemptions').select('*', { count: 'exact', head: true }).eq('merchant_id', merchant.id)
            : Promise.resolve({ count: 0 }),
          merchant.subscription_status === 'trial' && merchant.planning_enabled
            ? supabase.from('merchant_planning_slots').select('*', { count: 'exact', head: true }).eq('merchant_id', merchant.id).not('client_name', 'is', null).neq('client_name', '__blocked__')
            : Promise.resolve({ count: 0 }),
          supabase.from('referrals').select('created_at, status').eq('merchant_id', merchant.id).order('created_at', { ascending: false }).limit(8),
          merchant.welcome_offer_enabled
            ? supabase.from('vouchers').select('created_at, customer_id, customer:customers(first_name)').eq('merchant_id', merchant.id).eq('source', 'welcome').order('created_at', { ascending: false }).limit(8)
            : Promise.resolve({ data: [] }),
          // Today : visites + redemptions (utilises uniquement par HeroToday mode fidelite)
          !merchant.planning_enabled
            ? supabase.from('visits').select('*', { count: 'exact', head: true })
                .eq('merchant_id', merchant.id)
                .eq('status', 'confirmed')
                .gte('visited_at', todayStartIso)
                .lt('visited_at', todayEndIso)
            : Promise.resolve({ count: 0 }),
          !merchant.planning_enabled
            ? supabase.from('redemptions').select('*', { count: 'exact', head: true })
                .eq('merchant_id', merchant.id)
                .gte('redeemed_at', todayStartIso)
                .lt('redeemed_at', todayEndIso)
            : Promise.resolve({ count: 0 }),
          // Récompenses cette semaine vs précédente (pour WeekTiles)
          supabase.from('redemptions').select('*', { count: 'exact', head: true })
            .eq('merchant_id', merchant.id)
            .gte('redeemed_at', sevenDaysAgo.toISOString()),
          supabase.from('redemptions').select('*', { count: 'exact', head: true })
            .eq('merchant_id', merchant.id)
            .gte('redeemed_at', fourteenDaysAgo.toISOString())
            .lt('redeemed_at', sevenDaysAgo.toISOString()),
          // Proches recompense (palier 1) — HeroToday mode fidelite uniquement
          !merchant.planning_enabled && merchant.loyalty_mode !== 'cagnotte' && tier1Threshold !== null
            ? supabase.from('loyalty_cards')
                .select('id, current_stamps, customer:customers(id, first_name)')
                .eq('merchant_id', merchant.id)
                .gte('current_stamps', tier1Threshold)
                .lt('current_stamps', stampsRequired)
                .order('current_stamps', { ascending: false })
                .limit(3)
            : Promise.resolve({ data: [] }),
        ]);

        setPendingReferrals(pendingReferralsResult.count || 0);
        setWelcomeVouchers(welcomeVouchersResult.count || 0);
        setTodayVisitsCount(todayVisitsResult.count || 0);
        setTodayRedemptionsCount(todayRedemptionsResult.count || 0);
        setThisWeekRedemptions(thisWeekRedemptionsResult.count || 0);
        setLastWeekRedemptions(lastWeekRedemptionsResult.count || 0);

        // Near reward customers
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const nearReward = ((nearRewardResult.data || []) as any[]).map((row) => {
          const cust = unwrapJoin(row.customer);
          return {
            id: row.id as string,
            firstName: (cust?.first_name as string) || t('defaultClient'),
            remaining: stampsRequired - (row.current_stamps as number),
          };
        });
        setNearRewardCustomers(nearReward);

        if (upcomingBookingsResult.data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mapped = (upcomingBookingsResult.data as any[]).map((b) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const services = (b.planning_slot_services || []).map((ps: any) => {
              const s = unwrapJoin(ps.service);
              return s ? { name: s.name, duration: s.duration ?? null, price: s.price != null ? Number(s.price) : null } : null;
            }).filter(Boolean);
            return {
              id: b.id,
              slot_date: b.slot_date,
              start_time: b.start_time,
              client_name: b.client_name,
              deposit_confirmed: b.deposit_confirmed,
              total_duration_minutes: b.total_duration_minutes ?? null,
              services,
            };
          });
          setUpcomingBookings(mapped);
        }

        // Set upcoming birthdays
        if (birthdayResult.data) {
          const birthdays = (birthdayResult.data as Array<{ customer: { id: string; first_name: string; last_name: string; birth_month: number; birth_day: number } | null }>)
            .map(c => c.customer)
            .filter((c): c is NonNullable<typeof c> => c !== null && birthdayDates.some(d => d.month === c.birth_month && d.day === c.birth_day))
            .map(c => ({ firstName: c.first_name, lastName: c.last_name, birthMonth: c.birth_month, birthDay: c.birth_day }));
          setUpcomingBirthdays(birthdays);
        }

        // Milestone data
        setServicesCount(servicesCountResult.count || 0);
        setTotalRedemptions(allRedemptionsResult.count || 0);
        setHasAnyBooking((allBookingsResult.count || 0) >= 1);

        const newStats = {
          totalCustomers: totalCustomersResult.count || 0,
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
        feed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setActivityFeed(feed.slice(0, 5));

        const newWeeklyData = {
          thisWeek: thisWeekVisitsResult.count || 0,
          lastWeek: lastWeekVisitsResult.count || 0,
        };
        setWeeklyData(newWeeklyData);

        setCachedStats(merchant.id, { stats: newStats, weeklyData: newWeeklyData });

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

  const MOTIVATION_KEYS = ['motivationSunday', 'motivationMonday', 'motivationTuesday', 'motivationWednesday', 'motivationThursday', 'motivationFriday', 'motivationSaturday'] as const;
  const motivationKey = MOTIVATION_KEYS[new Date().getDay()];
  const todayStrK = getTodayForCountry(merchant.country);
  const todayBookingsForHero = upcomingBookings
    .filter(b => b.slot_date === todayStrK)
    .map(b => ({
      id: b.id,
      client_name: b.client_name,
      start_time: b.start_time,
      totalPrice: b.services.reduce((s, sv) => s + (sv.price || 0), 0),
      servicesLabel: b.services.map(s => s.name).join(' · '),
      deposit_confirmed: b.deposit_confirmed,
    }));

  const toSeeItems: ToSeeItem[] = [];
  if (upcomingBirthdays.length > 0) {
    const names = upcomingBirthdays.slice(0, 3).map(b => b.firstName).join(', ');
    toSeeItems.push({
      key: 'birthdays',
      icon: 'cake',
      label: upcomingBirthdays.length === 1
        ? t('toSeeBirthdaysOne', { name: names })
        : t('toSeeBirthdaysMany', { count: upcomingBirthdays.length, names }),
      count: upcomingBirthdays.length,
      href: '/dashboard/customers',
    });
  }
  if (pendingReferrals > 0) {
    toSeeItems.push({
      key: 'referrals',
      icon: 'userPlus',
      label: t('toSeeReferrals', { count: pendingReferrals }),
      count: pendingReferrals,
      href: '/dashboard/referrals',
    });
  }
  if (welcomeVouchers > 0) {
    toSeeItems.push({
      key: 'welcome',
      icon: 'sparkles',
      label: t('toSeeWelcome', { count: welcomeVouchers }),
      count: welcomeVouchers,
      href: '/dashboard/customers',
    });
  }

  return (
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            {t('greeting')} {merchant?.shop_name}
          </h1>
          <p className="mt-0.5 text-xs md:text-sm text-slate-500">{t(motivationKey)}</p>
        </div>

      <OnboardingChecklist />

      <HeroToday
        merchant={merchant}
        todayBookings={todayBookingsForHero}
        todayVisitsCount={todayVisitsCount}
        todayRedemptionsCount={todayRedemptionsCount}
        nearRewardCustomers={nearRewardCustomers}
      />

      {merchant.planning_enabled && (
        <PendingDepositsWidget
          merchantId={merchant.id}
          country={merchant.country}
          depositFixed={merchant.deposit_amount}
          depositPercent={merchant.deposit_percent}
          planningEnabled={merchant.planning_enabled}
        />
      )}

      <ToSeeList items={toSeeItems} />

      <WeekTiles
        tiles={[
          {
            label: t('weekVisitsLabel'),
            value: weeklyData.thisWeek,
            thisWeek: weeklyData.thisWeek,
            lastWeek: weeklyData.lastWeek,
          },
          {
            label: t('weekRewardsLabel'),
            value: thisWeekRedemptions,
            thisWeek: thisWeekRedemptions,
            lastWeek: lastWeekRedemptions,
          },
        ]}
      />


      {stats.totalCustomers > 0 && (
        <PendingPointsWidget
          merchantId={merchant.id}
          shieldEnabled={shieldEnabled}
          onShieldToggle={handleShieldToggle}
        />
      )}

      {activityFeed.length > 0 ? (
        <div>
          <p className="px-1 mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            {t('recentActivity')}
          </p>
          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
            <ul className="divide-y divide-slate-100">
              {activityFeed.map((event, i) => {
                const config = EVENT_CONFIG[event.type];
                const Icon = config.icon;
                return (
                  <li key={`${event.type}-${i}`}>
                    <Link
                      href={event.customerId ? `${config.href}?customer=${event.customerId}` : config.href}
                      className="flex items-center gap-3 px-4 py-2.5 active:bg-slate-50 transition-colors touch-manipulation"
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${config.color}`} strokeWidth={2} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-slate-800 truncate">
                          {event.title}
                          {event.subtitle && (
                            <span className="text-slate-400 font-normal"> · {event.subtitle}</span>
                          )}
                        </p>
                      </div>
                      <span className="text-[11px] text-slate-400 shrink-0 whitespace-nowrap">
                        {formatRelativeTime(event.timestamp, locale)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : merchant?.reward_description ? (
        <ZeroScansCoach merchant={merchant} />
      ) : null}

      <SmsRecent
        merchantId={merchant.id}
        smsUsage={smsUsage}
        showQuota={showPlanningUi(merchant)}
      />

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
                <li className="flex items-start gap-2"><span className="text-red-400 mt-1">•</span><span>{t('disableShieldRisk1')}</span></li>
                <li className="flex items-start gap-2"><span className="text-red-400 mt-1">•</span><span>{t('disableShieldRisk2')}</span></li>
                <li className="flex items-start gap-2"><span className="text-red-400 mt-1">•</span><span>{t('disableShieldRisk3')}</span></li>
              </ul>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowShieldWarning(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors">{t('disableShieldCancel')}</button>
              <button type="button" onClick={confirmDisableShield} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors">{t('disableShieldConfirm')}</button>
            </div>
          </div>
        </div>
      )}

      {activeMilestone && (
        <MilestoneModal type={activeMilestone} onClose={() => setActiveMilestone(null)} />
      )}
      </div>
  );
}
