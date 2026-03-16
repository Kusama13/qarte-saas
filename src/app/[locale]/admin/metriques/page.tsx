'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Euro,
  Users,
  Store,
  Clock,
  TrendingUp,
  UserX,
  Calendar,
  Eye,
  UserPlus,
  Loader2,
  Zap,
  ArrowRight,
  Target,
  Filter,
  Timer,
  ChevronDown,
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

const MONTHLY_PRICE = 19;
const ANNUAL_PRICE = 190;
const ANNUAL_MONTHLY_EQUIV = Math.round((ANNUAL_PRICE / 12) * 100) / 100; // 15.83

interface Snapshot {
  snapshot_date: string;
  mrr: number;
  active_subscribers: number;
  trial_users: number;
}

type MerchantData = {
  id: string;
  user_id: string;
  subscription_status: string;
  billing_interval: 'monthly' | 'annual' | null;
  created_at: string;
  reward_description: string | null;
  trial_ends_at: string | null;
  logo_url: string | null;
  referral_program_enabled: boolean;
  birthday_gift_enabled: boolean;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  booking_url: string | null;
  review_link: string | null;
  shield_enabled: boolean;
  tier2_enabled: boolean;
  pwa_installed_at: string | null;
  offer_active: boolean;
  welcome_offer_enabled: boolean;
  double_days_enabled: boolean;
  shop_address: string | null;
  loyalty_mode: 'visit' | 'cagnotte';
  slug: string | null;
  first_feature_choice: 'loyalty' | 'vitrine' | null;
};

export default function MetriquesPage() {
  const supabase = getSupabase();
  const [loading, setLoading] = useState(true);

  // Revenue metrics
  const [revenue, setRevenue] = useState({
    mrr: 0,
    activeSubscribers: 0,
    monthlyCount: 0,
    annualCount: 0,
    trialUsers: 0,
    churned: 0,
    churnRate: 0,
    annualProjection: 0,
    revenueNextMonth: 0,
    trialEndingSoon: 0,
  });

  // Activity metrics
  const [activity, setActivity] = useState({
    totalMerchants: 0,
    totalCustomers: 0,
    totalVisits: 0,
    signupsThisWeek: 0,
    signupsThisMonth: 0,
  });

  // Activation metrics
  const [activation, setActivation] = useState({
    activationRate: 0,
    avgTimeToFirstScan: 0,
    avgTimeTo10Customers: 0,
    recentMerchantCount: 0,
  });

  // Trial-to-paid + Time-to-convert
  const [trialConversion, setTrialConversion] = useState({
    trialToPaidRate: 0,
    trialEnded30d: 0,
    trialConverted30d: 0,
    avgTimeToConvert: 0,
  });

  // Funnel — raw data for period filtering
  const [funnelMerchants, setFunnelMerchants] = useState<MerchantData[]>([]);
  const [funnelFirstVisitMap, setFunnelFirstVisitMap] = useState<Map<string, Date>>(new Map());
  const [funnelPeriod, setFunnelPeriod] = useState<'7' | '30' | '90' | 'all'>('all');
  const [merchantsWithServices, setMerchantsWithServices] = useState<Set<string>>(new Set());
  const [merchantsWithPhotos, setMerchantsWithPhotos] = useState<Set<string>>(new Set());

  // UI toggles
  const [adoptionOpen, setAdoptionOpen] = useState(false);
  const [expandedCohort, setExpandedCohort] = useState<string | null>(null);

  // Computed funnel based on period (with visit date filtering)
  const funnel = useMemo(() => {
    let filtered = funnelMerchants;
    let cutoff: Date | null = null;
    if (funnelPeriod !== 'all') {
      const days = parseInt(funnelPeriod);
      cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      filtered = funnelMerchants.filter(m => new Date(m.created_at) >= cutoff!);
    }
    return {
      total: filtered.length,
      withProgram: filtered.filter(m => m.reward_description !== null).length,
      withFirstScan: filtered.filter(m => {
        const firstVisit = funnelFirstVisitMap.get(m.id);
        if (!firstVisit) return false;
        // If period filter is active, only count visits within the period
        if (cutoff && firstVisit < cutoff) return false;
        return true;
      }).length,
      paid: filtered.filter(m => m.subscription_status === 'active').length,
    };
  }, [funnelMerchants, funnelFirstVisitMap, funnelPeriod]);

  // Charts data
  const [mrrHistory, setMrrHistory] = useState<{ month: string; mrr: number }[]>([]);
  const [weeklySignups, setWeeklySignups] = useState<{ week: string; count: number }[]>([]);
  const [monthlyComparison, setMonthlyComparison] = useState<{ month: string; revenue: number; projected: number }[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const now = new Date();
      const oneWeekAgo = new Date(now);
      oneWeekAgo.setDate(now.getDate() - 7);
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(now.getMonth() - 1);
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(now.getMonth() - 6);

      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      // Fetch all data in parallel
      const [
        { data: allMerchants },
        { data: superAdmins },
        { data: firstVisitsRpc },
        { data: tenthCardsRpc },
        { count: endingSoonCount },
        { data: snapshots },
        { data: servicesList },
        { data: photosList },
      ] = await Promise.all([
        supabase.from('merchants').select('id, user_id, subscription_status, billing_interval, created_at, reward_description, trial_ends_at, logo_url, referral_program_enabled, birthday_gift_enabled, instagram_url, facebook_url, tiktok_url, booking_url, review_link, shield_enabled, tier2_enabled, pwa_installed_at, offer_active, welcome_offer_enabled, double_days_enabled, shop_address, loyalty_mode, slug, first_feature_choice'),
        supabase.from('super_admins').select('user_id'),
        supabase.rpc('get_first_visit_per_merchant'),
        supabase.rpc('get_tenth_card_date_per_merchant'),
        supabase.from('merchants')
          .select('*', { count: 'exact', head: true })
          .eq('subscription_status', 'trial')
          .lte('trial_ends_at', sevenDaysFromNow.toISOString())
          .gte('trial_ends_at', now.toISOString()),
        supabase.from('revenue_snapshots')
          .select('*')
          .order('snapshot_date', { ascending: true })
          .limit(12),
        supabase.from('merchant_services').select('merchant_id').limit(10000),
        supabase.from('merchant_photos').select('merchant_id').limit(10000),
      ]);

      // Get super admin user_ids
      const superAdminUserIds = new Set((superAdmins || []).map((sa: { user_id: string }) => sa.user_id));

      // Filter out super admin merchants
      const merchants = (allMerchants || []).filter((m: MerchantData) => !superAdminUserIds.has(m.user_id)) as MerchantData[];

      // Count customers and visits excluding admin merchants
      const adminMerchantIds = (allMerchants || []).filter((m: MerchantData) => superAdminUserIds.has(m.user_id)).map((m: MerchantData) => m.id);
      let totalCustomers = 0;
      let totalVisits = 0;
      if (adminMerchantIds.length > 0) {
        const [{ count: custCount }, { count: visitCount }] = await Promise.all([
          supabase.from('customers').select('*', { count: 'exact', head: true }).not('merchant_id', 'in', `(${adminMerchantIds.join(',')})`),
          supabase.from('visits').select('*', { count: 'exact', head: true }).not('merchant_id', 'in', `(${adminMerchantIds.join(',')})`),
        ]);
        totalCustomers = custCount || 0;
        totalVisits = visitCount || 0;
      } else {
        const [{ count: custCount }, { count: visitCount }] = await Promise.all([
          supabase.from('customers').select('*', { count: 'exact', head: true }),
          supabase.from('visits').select('*', { count: 'exact', head: true }),
        ]);
        totalCustomers = custCount || 0;
        totalVisits = visitCount || 0;
      }

      // Revenue calculations (monthly vs annual)
      const activeMerchants = merchants.filter(m => m.subscription_status === 'active');
      const active = activeMerchants.length;
      const monthlyCount = activeMerchants.filter(m => m.billing_interval !== 'annual').length;
      const annualCount = activeMerchants.filter(m => m.billing_interval === 'annual').length;
      const trial = merchants.filter(m => m.subscription_status === 'trial').length;
      const churned = merchants.filter(m => m.subscription_status === 'canceled').length;
      const total = merchants.length;
      const mrr = Math.round(monthlyCount * MONTHLY_PRICE + annualCount * ANNUAL_MONTHLY_EQUIV);
      const churnRate = (active + churned) > 0 ? Math.round((churned / (active + churned)) * 100) : 0;

      // Trial-to-paid rate (compute early for projection)
      const trialEndedRecently = merchants.filter((m) => {
        if (!m.trial_ends_at) return false;
        const trialEnd = new Date(m.trial_ends_at);
        return trialEnd < now && trialEnd >= oneMonthAgo;
      });
      const trialConvertedCount = trialEndedRecently.filter(m => m.subscription_status === 'active').length;
      const trialToPaidRate = trialEndedRecently.length > 0
        ? Math.round((trialConvertedCount / trialEndedRecently.length) * 100)
        : 0;

      // Time-to-convert (no arbitrary cap)
      let totalConvertDays = 0;
      let convertCount = 0;
      activeMerchants.forEach((m) => {
        if (m.trial_ends_at) {
          const created = new Date(m.created_at);
          const trialEnd = new Date(m.trial_ends_at);
          const days = (trialEnd.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
          if (days > 0) {
            totalConvertDays += days;
            convertCount++;
          }
        }
      });
      const avgTimeToConvert = convertCount > 0 ? Math.round((totalConvertDays / convertCount) * 10) / 10 : 0;

      setTrialConversion({
        trialToPaidRate,
        trialEnded30d: trialEndedRecently.length,
        trialConverted30d: trialConvertedCount,
        avgTimeToConvert,
      });

      // Revenue projections
      const trialEndingSoon = endingSoonCount || 0;
      const estimatedConversionRate = trialToPaidRate > 0 ? trialToPaidRate / 100 : 0.5;
      const estimatedConversions = Math.round(trialEndingSoon * estimatedConversionRate);
      const revenueNextMonth = Math.round((active + estimatedConversions) * (mrr > 0 && active > 0 ? mrr / active : MONTHLY_PRICE));

      // Time-based stats
      const weekMerchants = merchants.filter(m => new Date(m.created_at) >= oneWeekAgo);
      const monthMerchants = merchants.filter(m => new Date(m.created_at) >= oneMonthAgo);
      const sixMonthMerchants = merchants.filter(m => new Date(m.created_at) >= sixMonthsAgo);

      setRevenue({
        mrr,
        activeSubscribers: active,
        monthlyCount,
        annualCount,
        trialUsers: trial,
        churned,
        churnRate,
        annualProjection: mrr * 12,
        revenueNextMonth,
        trialEndingSoon,
      });

      // Activity
      setActivity({
        totalMerchants: total,
        totalCustomers: totalCustomers || 0,
        totalVisits: totalVisits || 0,
        signupsThisWeek: weekMerchants.length,
        signupsThisMonth: monthMerchants.length,
      });

      // MRR History - use real snapshots if available, else calculate
      if (snapshots && snapshots.length > 0) {
        setMrrHistory(snapshots.map((s: Snapshot) => ({
          month: new Date(s.snapshot_date).toLocaleDateString('fr-FR', { month: 'short' }),
          mrr: s.mrr,
        })));
      } else {
        const mrrData: { month: string; mrr: number }[] = [];
        const merchantsByMonth = new Map<string, number>();

        sixMonthMerchants.forEach((m) => {
          if (m.subscription_status === 'active') {
            const date = new Date(m.created_at);
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
            merchantsByMonth.set(monthKey, (merchantsByMonth.get(monthKey) || 0) + 1);
          }
        });

        let cumulativeActive = active - sixMonthMerchants.filter(m => m.subscription_status === 'active').length;
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
          const monthName = date.toLocaleDateString('fr-FR', { month: 'short' });

          cumulativeActive += merchantsByMonth.get(monthKey) || 0;
          mrrData.push({
            month: monthName,
            mrr: Math.max(0, cumulativeActive) * MONTHLY_PRICE,
          });
        }
        setMrrHistory(mrrData);
      }

      // Monthly comparison (Real vs Projection) - use real snapshots
      const comparisonData: { month: string; revenue: number; projected: number }[] = [];
      if (snapshots && snapshots.length >= 2) {
        const recentSnapshots = snapshots.slice(-3);
        recentSnapshots.forEach((s: Snapshot) => {
          comparisonData.push({
            month: new Date(s.snapshot_date).toLocaleDateString('fr-FR', { month: 'short' }),
            revenue: s.mrr,
            projected: s.mrr,
          });
        });
        const lastMrr = recentSnapshots[recentSnapshots.length - 1].mrr;
        const firstMrr = recentSnapshots[0].mrr;
        const monthlyGrowth = recentSnapshots.length > 1 && firstMrr > 0
          ? Math.pow(lastMrr / firstMrr, 1 / (recentSnapshots.length - 1))
          : 1.05;
        for (let i = 1; i <= 3; i++) {
          const date = new Date();
          date.setMonth(date.getMonth() + i);
          comparisonData.push({
            month: date.toLocaleDateString('fr-FR', { month: 'short' }),
            revenue: 0,
            projected: Math.round(lastMrr * Math.pow(monthlyGrowth, i)),
          });
        }
      } else {
        comparisonData.push({
          month: new Date().toLocaleDateString('fr-FR', { month: 'short' }),
          revenue: mrr,
          projected: mrr,
        });
        for (let i = 1; i <= 3; i++) {
          const date = new Date();
          date.setMonth(date.getMonth() + i);
          comparisonData.push({
            month: date.toLocaleDateString('fr-FR', { month: 'short' }),
            revenue: 0,
            projected: Math.round(mrr * (1 + i * 0.05)),
          });
        }
      }
      setMonthlyComparison(comparisonData);

      // ====== ACTIVATION + FUNNEL ======
      // Build first visit map from RPC (1 row per merchant instead of all visits)
      const firstVisitPerMerchant = new Map<string, Date>();
      (firstVisitsRpc || []).forEach((row: { merchant_id: string; first_visit_date: string }) => {
        firstVisitPerMerchant.set(row.merchant_id, new Date(row.first_visit_date));
      });

      const recentCreated = merchants.filter(m => new Date(m.created_at) >= oneMonthAgo);
      const recentActivated = recentCreated.filter(m => firstVisitPerMerchant.has(m.id));
      const activationRate = recentCreated.length > 0 ? Math.round((recentActivated.length / recentCreated.length) * 100) : 0;

      let totalDaysToFirst = 0;
      let countWithFirst = 0;
      firstVisitPerMerchant.forEach((firstDate, merchantId) => {
        const merchant = merchants.find(m => m.id === merchantId);
        if (merchant) {
          const days = (firstDate.getTime() - new Date(merchant.created_at).getTime()) / (1000 * 60 * 60 * 24);
          totalDaysToFirst += Math.max(0, days);
          countWithFirst++;
        }
      });
      const avgTimeToFirstScan = countWithFirst > 0 ? Math.round((totalDaysToFirst / countWithFirst) * 10) / 10 : 0;

      // Build avg time to 10 customers from RPC (1 row per merchant with 10+ cards)
      let totalDaysTo10 = 0;
      let countWith10 = 0;
      (tenthCardsRpc || []).forEach((row: { merchant_id: string; tenth_card_date: string }) => {
        const merchant = merchants.find(m => m.id === row.merchant_id);
        if (merchant) {
          const days = (new Date(row.tenth_card_date).getTime() - new Date(merchant.created_at).getTime()) / (1000 * 60 * 60 * 24);
          totalDaysTo10 += Math.max(0, days);
          countWith10++;
        }
      });
      const avgTimeTo10 = countWith10 > 0 ? Math.round((totalDaysTo10 / countWith10) * 10) / 10 : 0;

      setActivation({
        activationRate,
        avgTimeToFirstScan,
        avgTimeTo10Customers: avgTimeTo10,
        recentMerchantCount: recentCreated.length,
      });

      // Build services/photos sets for feature adoption
      const servicesSet = new Set<string>();
      (servicesList || []).forEach((s: { merchant_id: string }) => servicesSet.add(s.merchant_id));
      setMerchantsWithServices(servicesSet);

      const photosSet = new Set<string>();
      (photosList || []).forEach((p: { merchant_id: string }) => photosSet.add(p.merchant_id));
      setMerchantsWithPhotos(photosSet);

      // Store raw data for funnel period filtering
      setFunnelMerchants(merchants);
      setFunnelFirstVisitMap(firstVisitPerMerchant);

      // Weekly signups (last 8 weeks)
      const weeklyData: { week: string; count: number }[] = [];
      for (let i = 7; i >= 0; i--) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const count = sixMonthMerchants.filter((m) => {
          const created = new Date(m.created_at);
          return created >= weekStart && created < weekEnd;
        }).length;

        weeklyData.push({
          week: `S${8 - i}`,
          count,
        });
      }
      setWeeklySignups(weeklyData);

      // Save daily snapshot (fire-and-forget)
      const today = new Date().toISOString().split('T')[0];
      supabase
        .from('revenue_snapshots')
        .upsert({
          snapshot_date: today,
          active_subscribers: active,
          trial_users: trial,
          cancelled_users: churned,
          mrr,
        }, { onConflict: 'snapshot_date' })
        .then(() => {});

    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const arpu = revenue.activeSubscribers > 0
    ? Math.round((revenue.mrr / revenue.activeSubscribers) * 100) / 100
    : MONTHLY_PRICE;

  const featureAdoption = useMemo(() => {
    const eligible = funnelMerchants.filter(
      m => m.subscription_status === 'active' || m.subscription_status === 'trial'
    );
    const total = eligible.length;
    if (total === 0) return [];

    const features: { label: string; count: number; pct: number }[] = [
      { label: 'Programme configure', count: eligible.filter(m => m.reward_description !== null).length, pct: 0 },
      { label: 'Logo', count: eligible.filter(m => !!m.logo_url).length, pct: 0 },
      { label: 'Reseaux sociaux', count: eligible.filter(m => m.instagram_url || m.facebook_url || m.tiktok_url).length, pct: 0 },
      { label: 'Parrainage', count: eligible.filter(m => m.referral_program_enabled).length, pct: 0 },
      { label: 'Cadeau anniversaire', count: eligible.filter(m => m.birthday_gift_enabled).length, pct: 0 },
      { label: 'Lien reservation', count: eligible.filter(m => !!m.booking_url).length, pct: 0 },
      { label: 'Avis Google', count: eligible.filter(m => !!m.review_link).length, pct: 0 },
      { label: 'Offre active', count: eligible.filter(m => m.offer_active).length, pct: 0 },
      { label: 'PWA installee', count: eligible.filter(m => !!m.pwa_installed_at).length, pct: 0 },
      { label: 'Shield', count: eligible.filter(m => m.shield_enabled).length, pct: 0 },
      { label: 'Palier 2', count: eligible.filter(m => m.tier2_enabled).length, pct: 0 },
      { label: 'Offre bienvenue', count: eligible.filter(m => m.welcome_offer_enabled).length, pct: 0 },
      { label: 'Double jours', count: eligible.filter(m => m.double_days_enabled).length, pct: 0 },
      { label: 'Adresse', count: eligible.filter(m => !!m.shop_address).length, pct: 0 },
      { label: 'Mode cagnotte', count: eligible.filter(m => m.loyalty_mode === 'cagnotte').length, pct: 0 },
      { label: 'Prestations', count: eligible.filter(m => merchantsWithServices.has(m.id)).length, pct: 0 },
      { label: 'Photos', count: eligible.filter(m => merchantsWithPhotos.has(m.id)).length, pct: 0 },
    ];

    features.forEach(f => { f.pct = Math.round((f.count / total) * 100); });
    features.sort((a, b) => b.pct - a.pct);
    return features;
  }, [funnelMerchants, merchantsWithServices, merchantsWithPhotos]);

  // First feature choice distribution
  const firstFeatureStats = useMemo(() => {
    const eligible = funnelMerchants.filter(
      m => m.subscription_status === 'active' || m.subscription_status === 'trial'
    );
    const total = eligible.length;
    if (total === 0) return null;

    const loyalty = eligible.filter(m => m.first_feature_choice === 'loyalty').length;
    const vitrine = eligible.filter(m => m.first_feature_choice === 'vitrine').length;
    const notSet = total - loyalty - vitrine;

    return { loyalty, vitrine, notSet, total };
  }, [funnelMerchants]);

  // Weekly cohorts: group merchants by 7-day creation windows
  const weeklyCohorts = useMemo(() => {
    if (funnelMerchants.length === 0) return [];

    // Find earliest and latest merchant creation dates
    const sorted = [...funnelMerchants].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const earliest = new Date(sorted[0].created_at);
    const now = new Date();

    // Build 7-day windows from earliest to now
    const cohorts: {
      key: string;
      startDate: Date;
      endDate: Date;
      label: string;
      merchants: MerchantData[];
      signups: number;
      trials: number;
      paid: number;
      conversionRate: number;
      dailyBreakdown: { date: string; label: string; signups: number; trials: number; paid: number }[];
    }[] = [];

    const windowStart = new Date(earliest);
    windowStart.setHours(0, 0, 0, 0);

    while (windowStart < now) {
      const windowEnd = new Date(windowStart);
      windowEnd.setDate(windowEnd.getDate() + 7);

      const cohortMerchants = funnelMerchants.filter(m => {
        const created = new Date(m.created_at);
        return created >= windowStart && created < windowEnd;
      });

      // Daily breakdown within the 7-day window
      const dailyBreakdown: { date: string; label: string; signups: number; trials: number; paid: number }[] = [];

      for (let d = 0; d < 7; d++) {
        const dayStart = new Date(windowStart);
        dayStart.setDate(dayStart.getDate() + d);
        if (dayStart > now) break;
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const dayMerchants = cohortMerchants.filter(m => {
          const created = new Date(m.created_at);
          return created >= dayStart && created < dayEnd;
        });

        if (dayMerchants.length > 0) {
          dailyBreakdown.push({
            date: dayStart.toISOString().split('T')[0],
            label: dayStart.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }),
            signups: dayMerchants.length,
            trials: dayMerchants.filter(m => m.subscription_status === 'trial').length,
            paid: dayMerchants.filter(m => m.subscription_status === 'active').length,
          });
        }
      }

      if (cohortMerchants.length > 0) {
        const paid = cohortMerchants.filter(m => m.subscription_status === 'active').length;
        cohorts.push({
          key: windowStart.toISOString().split('T')[0],
          startDate: new Date(windowStart),
          endDate: new Date(windowEnd),
          label: `${windowStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} — ${new Date(windowEnd.getTime() - 86400000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`,
          merchants: cohortMerchants,
          signups: cohortMerchants.length,
          trials: cohortMerchants.filter(m => m.subscription_status === 'trial').length,
          paid,
          conversionRate: Math.round((paid / cohortMerchants.length) * 100),
          dailyBreakdown,
        });
      }

      windowStart.setDate(windowStart.getDate() + 7);
    }

    // Most recent first
    return cohorts.reverse();
  }, [funnelMerchants]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#5167fc]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Métriques</h1>
        <p className="mt-1 text-gray-600">Vue d&apos;ensemble business et revenus</p>
      </div>

      {/* 1. SITUATION ACTUELLE */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Euro className="w-5 h-5 text-[#5167fc]" />
          Situation actuelle
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="MRR"
            value={formatCurrency(revenue.mrr)}
            sub={revenue.annualCount > 0
              ? `${revenue.monthlyCount} mensuel, ${revenue.annualCount} annuel`
              : `${revenue.activeSubscribers} abonnés`}
            icon={Euro}
            color="indigo"
          />
          <MetricCard
            label="Abonnés actifs"
            value={revenue.activeSubscribers}
            icon={Users}
            color="green"
          />
          <MetricCard
            label="En essai"
            value={revenue.trialUsers}
            icon={Clock}
            color="amber"
          />
          <MetricCard
            label="Churned"
            value={revenue.churned}
            sub={`${revenue.churnRate}% taux churn`}
            icon={UserX}
            color="red"
          />
        </div>

        {/* Split mensuel / annuel */}
        {(revenue.monthlyCount > 0 || revenue.annualCount > 0) && (
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div className="bg-white/80 px-4 py-3 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Mensuel</p>
                <p className="text-lg font-bold text-gray-900">{revenue.monthlyCount}</p>
              </div>
              <p className="text-sm font-semibold text-[#5167fc]">{revenue.monthlyCount * MONTHLY_PRICE}€/mois</p>
            </div>
            <div className="bg-white/80 px-4 py-3 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Annuel</p>
                <p className="text-lg font-bold text-gray-900">{revenue.annualCount}</p>
              </div>
              <p className="text-sm font-semibold text-purple-600">{Math.round(revenue.annualCount * ANNUAL_MONTHLY_EQUIV)}€/mois</p>
            </div>
          </div>
        )}
      </section>

      {/* 2. CONVERSION */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-[#5167fc]" />
          Conversion essai (30 derniers jours)
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Essai → Payant"
            value={`${trialConversion.trialToPaidRate}%`}
            sub={`${trialConversion.trialConverted30d}/${trialConversion.trialEnded30d} essais terminés`}
            icon={TrendingUp}
            color="green"
          />
          <MetricCard
            label="Essais terminés"
            value={trialConversion.trialEnded30d}
            sub="30 derniers jours"
            icon={Clock}
            color="amber"
          />
          <MetricCard
            label="Convertis"
            value={trialConversion.trialConverted30d}
            sub="Passés payants"
            icon={Users}
            color="indigo"
          />
          <MetricCard
            label="Temps conversion"
            value={trialConversion.avgTimeToConvert > 0 ? `${trialConversion.avgTimeToConvert}j` : '-'}
            sub="Moy. création → abo"
            icon={Timer}
            color="blue"
          />
        </div>
      </section>

      {/* FUNNEL DE CONVERSION (filtrable) */}
      {funnel.total > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <ArrowRight className="w-5 h-5 text-[#5167fc]" />
              Funnel de conversion
            </h2>
            <div className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-gray-400" />
              {(['7', '30', '90', 'all'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setFunnelPeriod(period)}
                  className={cn(
                    "px-2.5 py-1 text-xs font-medium rounded-lg transition-colors",
                    funnelPeriod === period
                      ? "bg-[#5167fc] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {period === 'all' ? 'Tout' : `${period}j`}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <FunnelBarMetric label="Inscrits" count={funnel.total} total={funnel.total} color="#5167fc" />
            <FunnelBarMetric label="Programme configuré" count={funnel.withProgram} total={funnel.total} color="#7c8afc" prevCount={funnel.total} />
            <FunnelBarMetric label="1er scan reçu" count={funnel.withFirstScan} total={funnel.total} color="#a3adfd" prevCount={funnel.withProgram} />
            <FunnelBarMetric label="Abonnés payants" count={funnel.paid} total={funnel.total} color="#10B981" prevCount={funnel.withFirstScan} />
          </div>
        </section>
      )}

      {/* 3. ACTIVATION */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-[#5167fc]" />
          Activation (30 derniers jours)
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Taux activation"
            value={`${activation.activationRate}%`}
            sub={`${activation.recentMerchantCount} inscrits 30j`}
            icon={Zap}
            color="green"
          />
          <MetricCard
            label="Temps 1er scan"
            value={activation.avgTimeToFirstScan > 0 ? `${activation.avgTimeToFirstScan}j` : '-'}
            sub="Création → 1er scan"
            icon={Clock}
            color="blue"
          />
          <MetricCard
            label="Temps 10 clients"
            value={activation.avgTimeTo10Customers > 0 ? `${activation.avgTimeTo10Customers}j` : '-'}
            sub="Création → 10e client"
            icon={Users}
            color="purple"
          />
          <MetricCard
            label="Inscrits récents"
            value={activation.recentMerchantCount}
            sub="Derniers 30 jours"
            icon={UserPlus}
            color="amber"
          />
        </div>
      </section>

      {/* 4. ACTIVITÉ GLOBALE */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Store className="w-5 h-5 text-[#5167fc]" />
          Activité
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard label="Commerçants" value={activity.totalMerchants} icon={Store} color="indigo" />
          <MetricCard label="Clients" value={activity.totalCustomers} icon={Users} color="blue" />
          <MetricCard label="Visites" value={activity.totalVisits} icon={Eye} color="green" />
          <MetricCard label="Inscrits 7j" value={activity.signupsThisWeek} icon={UserPlus} color="amber" />
          <MetricCard label="Inscrits 30j" value={activity.signupsThisMonth} icon={UserPlus} color="purple" />
        </div>
      </section>

      {/* 4b. ADOPTION DES FONCTIONNALITES (collapsible) */}
      {featureAdoption.length > 0 && (
        <section>
          <button
            onClick={() => setAdoptionOpen(!adoptionOpen)}
            className="w-full text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2 hover:text-[#5167fc] transition-colors"
          >
            <Zap className="w-5 h-5 text-[#5167fc]" />
            Adoption des fonctionnalites
            <ChevronDown className={cn("w-4 h-4 ml-auto transition-transform", adoptionOpen && "rotate-180")} />
          </button>
          {adoptionOpen && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="grid grid-cols-1 divide-y divide-gray-100">
                {featureAdoption.map((feature) => (
                  <div key={feature.label} className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm font-medium text-gray-700">{feature.label}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 bg-[#5167fc]"
                          style={{ width: `${Math.max(feature.pct, 2)}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-gray-900 w-10 text-right">{feature.pct}%</span>
                      <span className="text-xs text-gray-400 w-6 text-right">{feature.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 4b2. PREMIER SUPER-POUVOIR CHOISI */}
      {firstFeatureStats && (firstFeatureStats.loyalty > 0 || firstFeatureStats.vitrine > 0) && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-[#5167fc]" />
            Premier super-pouvoir choisi
          </h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 rounded-xl bg-indigo-50">
                <p className="text-2xl font-black text-indigo-600">{firstFeatureStats.loyalty}</p>
                <p className="text-xs font-medium text-indigo-500 mt-1">Programme fidelite</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-violet-50">
                <p className="text-2xl font-black text-violet-600">{firstFeatureStats.vitrine}</p>
                <p className="text-xs font-medium text-violet-500 mt-1">Vitrine en ligne</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-gray-50">
                <p className="text-2xl font-black text-gray-400">{firstFeatureStats.notSet}</p>
                <p className="text-xs font-medium text-gray-400 mt-1">Pas encore choisi</p>
              </div>
            </div>
            {/* Visual bar */}
            {(firstFeatureStats.loyalty + firstFeatureStats.vitrine) > 0 && (
              <div className="flex rounded-full h-3 overflow-hidden bg-gray-100">
                <div
                  className="bg-indigo-500 transition-all duration-700"
                  style={{ width: `${Math.round((firstFeatureStats.loyalty / (firstFeatureStats.loyalty + firstFeatureStats.vitrine)) * 100)}%` }}
                />
                <div
                  className="bg-violet-500 transition-all duration-700"
                  style={{ width: `${Math.round((firstFeatureStats.vitrine / (firstFeatureStats.loyalty + firstFeatureStats.vitrine)) * 100)}%` }}
                />
              </div>
            )}
            {(firstFeatureStats.loyalty + firstFeatureStats.vitrine) > 0 && (
              <div className="flex justify-between mt-2 text-xs font-medium">
                <span className="text-indigo-600">
                  Fidelite {Math.round((firstFeatureStats.loyalty / (firstFeatureStats.loyalty + firstFeatureStats.vitrine)) * 100)}%
                </span>
                <span className="text-violet-600">
                  Vitrine {Math.round((firstFeatureStats.vitrine / (firstFeatureStats.loyalty + firstFeatureStats.vitrine)) * 100)}%
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 4c. COHORTES HEBDOMADAIRES */}
      {weeklyCohorts.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#5167fc]" />
            Cohortes hebdomadaires
          </h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-5 gap-2 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <span className="col-span-1">Semaine</span>
              <span className="text-center">Inscrits</span>
              <span className="text-center">En essai</span>
              <span className="text-center">Payants</span>
              <span className="text-center">Conversion</span>
            </div>
            <div className="divide-y divide-gray-100">
              {weeklyCohorts.map((cohort) => (
                <div key={cohort.key}>
                  <button
                    onClick={() => setExpandedCohort(expandedCohort === cohort.key ? null : cohort.key)}
                    className="w-full grid grid-cols-5 gap-2 px-5 py-3 hover:bg-gray-50 transition-colors items-center"
                  >
                    <span className="col-span-1 text-sm font-medium text-gray-700 text-left flex items-center gap-1.5">
                      <ChevronDown className={cn("w-3.5 h-3.5 text-gray-400 transition-transform shrink-0", expandedCohort === cohort.key && "rotate-180")} />
                      {cohort.label}
                    </span>
                    <span className="text-sm font-bold text-gray-900 text-center">{cohort.signups}</span>
                    <span className="text-sm text-amber-600 text-center">{cohort.trials}</span>
                    <span className="text-sm text-green-600 font-semibold text-center">{cohort.paid}</span>
                    <span className={cn(
                      "text-sm font-bold text-center",
                      cohort.conversionRate >= 50 ? "text-green-600" : cohort.conversionRate >= 20 ? "text-amber-600" : "text-red-500"
                    )}>
                      {cohort.conversionRate}%
                    </span>
                  </button>
                  {/* Daily breakdown */}
                  {expandedCohort === cohort.key && (
                    <div className="bg-gray-50/50 border-t border-gray-100">
                      {cohort.dailyBreakdown.map((day) => (
                        <div key={day.date} className="grid grid-cols-5 gap-2 px-5 py-2 pl-10">
                          <span className="col-span-1 text-xs text-gray-500">{day.label}</span>
                          <span className="text-xs text-gray-700 text-center">{day.signups || '-'}</span>
                          <span className="text-xs text-amber-500 text-center">{day.trials || '-'}</span>
                          <span className="text-xs text-green-600 text-center">{day.paid || '-'}</span>
                          <span className="text-xs text-gray-400 text-center">
                            {day.signups > 0 ? `${Math.round((day.paid / day.signups) * 100)}%` : '-'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. GRAPHIQUES & PROJECTIONS */}
      <section className="space-y-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* MRR Evolution */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Évolution MRR (6 mois)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={mrrHistory}>
                <defs>
                  <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5167fc" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#5167fc" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickFormatter={(v) => `${v}€`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  formatter={(value: number) => [`${value}€`, 'MRR']}
                />
                <Area type="monotone" dataKey="mrr" stroke="#5167fc" strokeWidth={2} fill="url(#colorMrr)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Weekly Signups */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Inscriptions par semaine</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklySignups}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" stroke="#9CA3AF" fontSize={11} />
                <YAxis stroke="#9CA3AF" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  formatter={(value: number) => [value, 'Inscriptions']}
                />
                <Bar dataKey="count" fill="#5167fc" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Réel vs Projection */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Revenus : Réel vs Projection</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(v) => `${v}€`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value: number) => [`${value}€`]}
              />
              <Legend />
              <Bar dataKey="revenue" name="Réel" fill="#5167fc" radius={[4, 4, 0, 0]} />
              <Bar dataKey="projected" name="Projection" fill="#93C5FD" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Projections cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard
            label="Prévu mois prochain"
            value={formatCurrency(revenue.revenueNextMonth)}
            sub={`+${revenue.trialEndingSoon} essai${revenue.trialEndingSoon > 1 ? 's' : ''} potentiel${revenue.trialEndingSoon > 1 ? 's' : ''}`}
            icon={Target}
            color="amber"
          />
          <MetricCard
            label="Projection annuelle"
            value={formatCurrency(revenue.annualProjection)}
            sub={`MRR × 12`}
            icon={Calendar}
            color="purple"
          />
          <MetricCard
            label="ARPU"
            value={`${arpu}€/mois`}
            sub="Revenu moyen par abonné"
            icon={Euro}
            color="blue"
          />
        </div>
      </section>

      {/* 6. RÉSUMÉ FINANCIER */}
      <section className="p-6 bg-gradient-to-r from-[#5167fc] to-[#7c3aed] rounded-xl shadow-md text-white">
        <h2 className="mb-4 text-lg font-semibold">Résumé financier</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-white/70 text-sm">ARPU</p>
            <p className="text-2xl font-bold">{arpu}€/mois</p>
          </div>
          <div>
            <p className="text-white/70 text-sm">LTV estimée</p>
            <p className="text-2xl font-bold">
              {revenue.churnRate > 0
                ? formatCurrency(Math.round(arpu / (revenue.churnRate / 100)))
                : formatCurrency(arpu * 12)}
            </p>
            <p className="text-white/50 text-xs mt-0.5">
              {revenue.churnRate > 0
                ? `ARPU / ${revenue.churnRate}% churn`
                : 'Estimation 12 mois'}
            </p>
          </div>
          <div>
            <p className="text-white/70 text-sm">Revenus potentiels (essais)</p>
            <p className="text-2xl font-bold">{formatCurrency(revenue.trialUsers * MONTHLY_PRICE)}</p>
          </div>
          <div>
            <p className="text-white/70 text-sm">Perte mensuelle (annulés)</p>
            <p className="text-2xl font-bold">{formatCurrency(revenue.churned * arpu)}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

// Metric Card Component
function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: 'indigo' | 'green' | 'amber' | 'red' | 'blue' | 'orange' | 'purple';
}) {
  const colorMap = {
    indigo: 'bg-[#5167fc]/10 text-[#5167fc]',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    blue: 'bg-blue-50 text-blue-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colorMap[color])}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

// Funnel Bar Component
function FunnelBarMetric({
  label,
  count,
  total,
  color,
  prevCount,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
  prevCount?: number;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const dropOff = prevCount !== undefined && prevCount > 0
    ? Math.round(((prevCount - count) / prevCount) * 100)
    : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900">{count}</span>
          <span className="text-xs text-gray-400">({pct}%)</span>
          {dropOff !== null && dropOff > 0 && (
            <span className="text-xs font-medium text-red-500">-{dropOff}%</span>
          )}
        </div>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-7 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.max(pct, 3)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
