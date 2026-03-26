'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, Link } from '@/i18n/navigation';
import { Users, UserCheck, UserPlus, Calendar, CalendarDays, Clock, Gift, Sparkles, ArrowRight, ArrowUpRight, ArrowDownRight, AlertTriangle, X, Shield, ShieldOff, HelpCircle, QrCode, CreditCard, Coins, Globe, Heart, Cake } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { getSupabase } from '@/lib/supabase';
import { formatRelativeTime, getTodayForCountry, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui';
import { useMerchant } from '@/contexts/MerchantContext';
import PendingPointsWidget from '@/components/dashboard/PendingPointsWidget';
import OnboardingChecklist from '@/components/dashboard/OnboardingChecklist';
import ZeroScansCoach from '@/components/dashboard/ZeroScansCoach';
import StatsCard from '@/components/dashboard/StatsCard';

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

function setCachedStats(merchantId: string, data: { stats: typeof initialStats; recentCustomers: typeof initialRecentCustomers; weeklyData: typeof initialWeeklyData }) {
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

const initialRecentCustomers: Array<{
  id: string;
  name: string;
  stamps: number;
  currentAmount: number;
  lastVisit: string;
}> = [];

const initialWeeklyData = { thisWeek: 0, lastWeek: 0 };

export default function DashboardPage() {
  const router = useRouter();
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
  const [recentCustomers, setRecentCustomers] = useState<Array<{
    id: string;
    name: string;
    stamps: number;
    currentAmount: number;
    lastVisit: string;
  }>>(() => {
    if (merchant?.id) {
      const cached = getCachedStats(merchant.id);
      return cached?.recentCustomers || initialRecentCustomers;
    }
    return initialRecentCustomers;
  });
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
    id: string; slot_date: string; start_time: string; client_name: string;
  }>>([]);
  const [recentWelcomeClaims, setRecentWelcomeClaims] = useState<Array<{
    id: string; created_at: string; customerName: string;
  }>>([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<Array<{
    firstName: string; lastName: string; birthMonth: number; birthDay: number;
  }>>([]);
  const birthdayDatesRef = useRef<Array<{ month: number; day: number }>>([]);

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
  const [showShieldHelp, setShowShieldHelp] = useState(false);
  const [shieldEnabled, setShieldEnabled] = useState(true);


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
      await supabase
        .from('merchants')
        .update({ shield_enabled: true })
        .eq('id', merchant.id);
      setShieldEnabled(true);
      refetch();
    } catch (err) {
      console.error('Error enabling shield:', err);
    }
  }, [merchant, supabase, refetch]);

  // Confirm disable shield
  const confirmDisableShield = useCallback(async () => {
    if (!merchant) return;

    try {
      await supabase
        .from('merchants')
        .update({ shield_enabled: false })
        .eq('id', merchant.id);
      setShieldEnabled(false);
      setShowShieldWarning(false);
      refetch();
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
          recentCardsResult,
          thisWeekVisitsResult,
          lastWeekVisitsResult,
          cagnotteCardsResult,
          pendingReferralsResult,
          welcomeVouchersResult,
          upcomingBookingsResult,
          welcomeClaimsResult,
          birthdayResult,
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
          // Recent customers
          supabase
            .from('loyalty_cards')
            .select(`
              id,
              current_stamps,
              current_amount,
              last_visit_date,
              customer:customers (
                first_name,
                last_name
              )
            `)
            .eq('merchant_id', merchant.id)
            .order('updated_at', { ascending: false })
            .limit(5),
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
          // Upcoming booked planning slots
          merchant.planning_enabled
            ? supabase
                .from('merchant_planning_slots')
                .select('id, slot_date, start_time, client_name')
                .eq('merchant_id', merchant.id)
                .not('client_name', 'is', null)
                .gte('slot_date', todayStr)
                .order('slot_date', { ascending: true })
                .order('start_time', { ascending: true })
                .limit(5)
            : Promise.resolve({ data: [] }),
          // Recent welcome voucher claims (with customer name)
          merchant.welcome_offer_enabled
            ? supabase
                .from('vouchers')
                .select('id, created_at, customer:customers(first_name)')
                .eq('merchant_id', merchant.id)
                .eq('source', 'welcome')
                .order('created_at', { ascending: false })
                .limit(3)
            : Promise.resolve({ data: [] }),
          // Upcoming birthdays (next 3 days)
          merchant.birthday_gift_enabled
            ? supabase
                .from('loyalty_cards')
                .select('customer:customers(id, first_name, last_name, birth_month, birth_day)')
                .eq('merchant_id', merchant.id)
                .not('customer.birth_month', 'is', null)
                .in('customer.birth_month', [...new Set(birthdayDates.map(d => d.month))])
            : Promise.resolve({ data: [] }),
        ]);

        // Set pending referrals + welcome vouchers
        setPendingReferrals(pendingReferralsResult.count || 0);
        setWelcomeVouchers(welcomeVouchersResult.count || 0);

        // Set upcoming bookings
        if (upcomingBookingsResult.data) {
          setUpcomingBookings(upcomingBookingsResult.data as typeof upcomingBookings);
        }

        // Set recent welcome claims
        if (welcomeClaimsResult.data) {
          setRecentWelcomeClaims(
            (welcomeClaimsResult.data as Array<{ id: string; created_at: string; customer: { first_name: string } | { first_name: string }[] | null }>).map(v => {
              const cust = Array.isArray(v.customer) ? v.customer[0] : v.customer;
              return { id: v.id, created_at: v.created_at, customerName: cust?.first_name || 'Client' };
            })
          );
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

        // Set stats
        setStats({
          totalCustomers: totalCustomersResult.count || 0,
          activeCustomers: activeCustomersResult.count || 0,
          visitsThisMonth: visitsThisMonthResult.count || 0,
          redemptionsThisMonth: redemptionsThisMonthResult.count || 0,
        });

        // Set recent customers
        if (recentCardsResult.data) {
          setRecentCustomers(
            recentCardsResult.data.map((card: { id: string; customer: { first_name?: string; last_name?: string } | { first_name?: string; last_name?: string }[]; current_stamps: number; current_amount?: number; last_visit_date?: string }) => {
              const customer = Array.isArray(card.customer) ? card.customer[0] : card.customer;
              return {
                id: card.id,
                name: `${customer?.first_name || ''} ${customer?.last_name || ''}`.trim() || 'Client',
                stamps: card.current_stamps,
                currentAmount: Number(card.current_amount || 0),
                lastVisit: card.last_visit_date || '',
              };
            })
          );
        }

        // Process weekly comparison
        const newWeeklyData = {
          thisWeek: thisWeekVisitsResult.count || 0,
          lastWeek: lastWeekVisitsResult.count || 0,
        };
        setWeeklyData(newWeeklyData);

        // Cache the data for instant display on next visit
        const newStats = {
          totalCustomers: totalCustomersResult.count || 0,
          activeCustomers: activeCustomersResult.count || 0,
          visitsThisMonth: visitsThisMonthResult.count || 0,
          redemptionsThisMonth: redemptionsThisMonthResult.count || 0,
        };
        const newRecentCustomers = recentCardsResult.data
          ? recentCardsResult.data.map((card: { id: string; customer: { first_name?: string; last_name?: string } | { first_name?: string; last_name?: string }[]; current_stamps: number; current_amount?: number; last_visit_date?: string }) => {
              const customer = Array.isArray(card.customer) ? card.customer[0] : card.customer;
              return {
                id: card.id,
                name: `${customer?.first_name || ''} ${customer?.last_name || ''}`.trim() || 'Client',
                stamps: card.current_stamps,
                currentAmount: Number(card.current_amount || 0),
                lastVisit: card.last_visit_date || '',
              };
            })
          : [];

        setCachedStats(merchant.id, {
          stats: newStats,
          recentCustomers: newRecentCustomers,
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
  }, [merchant, merchantLoading, router]);

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
            { href: '/dashboard/public-page', icon: Globe, label: t('shortcutPage'), color: 'text-white', bg: 'bg-white/20', gradient: true, gradientColors: 'from-indigo-400 to-violet-400 border-indigo-300/20' },
            { href: '/dashboard/program', icon: Heart, label: t('shortcutLoyalty'), color: 'text-white', bg: 'bg-white/20', gradient: true, gradientColors: 'from-pink-400 to-rose-400 border-pink-300/20' },
            { href: '/dashboard/planning', icon: CalendarDays, label: t('shortcutPlanning'), color: 'text-white', bg: 'bg-white/20', gradient: true, gradientColors: 'from-cyan-400 to-blue-400 border-cyan-300/20' },
            { href: '/dashboard/customers', icon: Users, label: t('shortcutClients'), color: 'text-gray-500', bg: 'bg-gray-50' },
            { href: '/dashboard/qr-download', icon: QrCode, label: t('shortcutQr'), color: 'text-gray-500', bg: 'bg-gray-50' },
            { href: '/dashboard/subscription', icon: CreditCard, label: t('shortcutSubscription'), color: 'text-gray-500', bg: 'bg-gray-50' },
          ].map(({ href, icon: Icon, label, color, bg, gradient, gradientColors }: { href: string; icon: React.ElementType; label: string; color: string; bg: string; gradient?: boolean; gradientColors?: string }) => (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-2 p-3 rounded-2xl shadow-sm active:scale-95 transition-transform ${
                gradient
                  ? `bg-gradient-to-br ${gradientColors || 'from-indigo-600 to-violet-600 border-indigo-500/20'} border`
                  : 'bg-white border border-gray-100'
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
                            <p className="text-[11px] text-gray-400 mt-0.5">{dayLabel}</p>
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

      {/* Upcoming Birthdays */}
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

      {/* Qarte Shield — only show when merchant has at least 1 client */}
      {stats.totalCustomers > 0 && (
        <>
          <div className="relative">
            <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
              shieldEnabled
                ? 'bg-emerald-50/50 border-emerald-100'
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${shieldEnabled ? 'bg-emerald-100' : 'bg-gray-200'}`}>
                  {shieldEnabled ? (
                    <Shield className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <ShieldOff className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${shieldEnabled ? 'text-emerald-800' : 'text-gray-600'}`}>
                    Qarte Shield {shieldEnabled ? t('shieldActive') : t('shieldInactive')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {shieldEnabled ? t('shieldProtectionOn') : t('shieldProtectionOff')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowShieldHelp(!showShieldHelp)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  aria-label={t('shieldInfoAria')}
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  role="switch"
                  aria-checked={shieldEnabled}
                  aria-label={t('shieldToggleAria')}
                  onClick={() => handleShieldToggle(!shieldEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    shieldEnabled ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                      shieldEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Shield Help Tooltip */}
            {showShieldHelp && (
              <div className="absolute right-0 top-full mt-2 z-20 w-[calc(100vw-3rem)] sm:w-80 rounded-xl border border-gray-200 bg-white p-4 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-sm font-bold text-gray-900">{t('shieldTitle')}</h4>
                  </div>
                  <button
                    onClick={() => setShowShieldHelp(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {t('shieldDesc')}
                </p>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  {t('shieldDesc2')}
                </p>
              </div>
            )}
          </div>

          <PendingPointsWidget
            merchantId={merchant.id}
            shieldEnabled={shieldEnabled}
            onShieldToggle={handleShieldToggle}
          />
        </>
      )}

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
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base md:text-xl font-bold tracking-tight text-gray-900">
                {t('recentActivity')}
              </h2>
              <Link href="/dashboard/customers">
                <Button variant="ghost" size="sm" className="font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl">
                  {t('viewAll')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            {recentCustomers.length > 0 ? (
              <div className="space-y-1.5">
                {recentCustomers.map((customer) => {
                  const stampsReq1 = merchant?.stamps_required || 1;
                  const stamps = Math.min(customer.stamps, stampsReq1);
                  const progress1 = Math.min((customer.stamps / stampsReq1) * 100, 100);

                  return (
                    <Link
                      key={customer.id}
                      href="/dashboard/customers"
                      className="group/item flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-50/80 border border-transparent hover:bg-white hover:border-indigo-100 hover:shadow-sm transition-all duration-150 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex items-center justify-center w-8 h-8 shrink-0 text-xs font-bold text-white rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600">
                          {customer.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{customer.name}</p>
                          <p className="text-[11px] text-gray-400 leading-none mt-0.5">
                            {customer.lastVisit ? formatRelativeTime(customer.lastVisit, locale) : t('newClient')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <div className="h-1 w-14 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full"
                            style={{ width: `${progress1}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-indigo-600 w-8 text-right">{stamps}<span className="text-gray-300 font-normal">/{stampsReq1}</span></span>
                        {merchant?.loyalty_mode === 'cagnotte' && customer.currentAmount > 0 && (
                          <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                            {formatCurrency(customer.currentAmount, merchant?.country)}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}

                {/* Welcome offer claims */}
                {recentWelcomeClaims.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 pt-2 mt-1">
                      <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">{t('welcomeClaims')}</span>
                    </div>
                    {recentWelcomeClaims.map((claim) => (
                      <div key={claim.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-orange-50/50">
                        <div className="flex items-center justify-center w-8 h-8 shrink-0 rounded-lg bg-orange-100">
                          <Sparkles className="w-4 h-4 text-orange-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 truncate">{claim.customerName}</p>
                          <p className="text-[11px] text-gray-400 leading-none mt-0.5">{formatRelativeTime(claim.created_at, locale)}</p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
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
      </div>
  );
}
