'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Euro,
  Users,
  Store,
  Clock,
  TrendingUp,
  TrendingDown,
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

const SUBSCRIPTION_PRICE = 19;

interface Snapshot {
  snapshot_date: string;
  mrr: number;
  active_subscribers: number;
  trial_users: number;
}

export default function MetriquesPage() {
  const supabase = getSupabase();
  const [loading, setLoading] = useState(true);

  // Revenue metrics
  const [revenue, setRevenue] = useState({
    mrr: 0,
    activeSubscribers: 0,
    trialUsers: 0,
    churned: 0,
    conversionRate: 0,
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

  // Trial-to-paid (P4) + Time-to-convert (P6)
  const [trialConversion, setTrialConversion] = useState({
    trialToPaidRate: 0,
    trialEnded30d: 0,
    trialConverted30d: 0,
    avgTimeToConvert: 0,
  });

  // Funnel — store raw data for period filtering (P5)
  type FunnelMerchant = { id: string; created_at: string; reward_description: string | null; subscription_status: string };
  const [funnelMerchants, setFunnelMerchants] = useState<FunnelMerchant[]>([]);
  const [funnelVisitSet, setFunnelVisitSet] = useState<Set<string>>(new Set());
  const [funnelPeriod, setFunnelPeriod] = useState<'7' | '30' | '90' | 'all'>('all');

  // Computed funnel based on period
  const funnel = useMemo(() => {
    let filtered = funnelMerchants;
    if (funnelPeriod !== 'all') {
      const days = parseInt(funnelPeriod);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      filtered = funnelMerchants.filter(m => new Date(m.created_at) >= cutoff);
    }
    return {
      total: filtered.length,
      withProgram: filtered.filter(m => m.reward_description !== null).length,
      withFirstScan: filtered.filter(m => funnelVisitSet.has(m.id)).length,
      paid: filtered.filter(m => m.subscription_status === 'active').length,
    };
  }, [funnelMerchants, funnelVisitSet, funnelPeriod]);

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
        { data: allVisitsData },
        { data: allLoyaltyCards },
        { count: endingSoonCount },
        { data: snapshots },
      ] = await Promise.all([
        supabase.from('merchants').select('id, user_id, subscription_status, created_at, reward_description, trial_ends_at'),
        supabase.from('super_admins').select('user_id'),
        supabase.from('visits').select('merchant_id, visited_at'),
        supabase.from('loyalty_cards').select('merchant_id, created_at'),
        supabase.from('merchants')
          .select('*', { count: 'exact', head: true })
          .eq('subscription_status', 'trial')
          .lte('trial_ends_at', sevenDaysFromNow.toISOString())
          .gte('trial_ends_at', now.toISOString()),
        supabase.from('revenue_snapshots')
          .select('*')
          .order('snapshot_date', { ascending: true })
          .limit(12),
      ]);

      // Get super admin user_ids
      const superAdminUserIds = new Set((superAdmins || []).map((sa: { user_id: string }) => sa.user_id));

      // Filter out super admin merchants
      type MerchantData = { id: string; user_id: string; subscription_status: string; created_at: string; reward_description: string | null; trial_ends_at: string | null };
      const merchants = (allMerchants || []).filter((m: MerchantData) => !superAdminUserIds.has(m.user_id));

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

      // Revenue calculations
      const active = merchants.filter((m: MerchantData) => m.subscription_status === 'active').length;
      const trial = merchants.filter((m: MerchantData) => m.subscription_status === 'trial').length;
      const churned = merchants.filter((m: MerchantData) => m.subscription_status === 'canceled').length;
      const total = merchants.length;
      const mrr = active * SUBSCRIPTION_PRICE;
      const conversionRate = (active + churned) > 0 ? Math.round((active / (active + churned)) * 100) : 0;
      const churnRate = (active + churned) > 0 ? Math.round((churned / (active + churned)) * 100) : 0;

      // P4: Trial-to-paid rate (compute early for projection P8)
      const trialEndedRecently = merchants.filter((m: MerchantData) => {
        if (!m.trial_ends_at) return false;
        const trialEnd = new Date(m.trial_ends_at);
        return trialEnd < now && trialEnd >= oneMonthAgo;
      });
      const trialConvertedCount = trialEndedRecently.filter((m: MerchantData) => m.subscription_status === 'active').length;
      const trialToPaidRate = trialEndedRecently.length > 0
        ? Math.round((trialConvertedCount / trialEndedRecently.length) * 100)
        : 0;

      // P6: Time-to-convert
      const activeMerchantsList = merchants.filter((m: MerchantData) => m.subscription_status === 'active');
      let totalConvertDays = 0;
      let convertCount = 0;
      activeMerchantsList.forEach((m: MerchantData) => {
        if (m.trial_ends_at) {
          const created = new Date(m.created_at);
          const trialEnd = new Date(m.trial_ends_at);
          const days = (trialEnd.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
          if (days > 0 && days < 60) {
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

      // Revenue projections — use real trial-to-paid rate if available (P8)
      const trialEndingSoon = endingSoonCount || 0;
      const estimatedConversionRate = trialToPaidRate > 0 ? trialToPaidRate / 100 : 0.5;
      const estimatedConversions = Math.round(trialEndingSoon * estimatedConversionRate);
      const revenueNextMonth = (active + estimatedConversions) * SUBSCRIPTION_PRICE;

      // Time-based stats
      const weekMerchants = merchants.filter((m: MerchantData) => new Date(m.created_at) >= oneWeekAgo);
      const monthMerchants = merchants.filter((m: MerchantData) => new Date(m.created_at) >= oneMonthAgo);
      const sixMonthMerchants = merchants.filter((m: MerchantData) => new Date(m.created_at) >= sixMonthsAgo);

      setRevenue({
        mrr,
        activeSubscribers: active,
        trialUsers: trial,
        churned,
        conversionRate,
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

        sixMonthMerchants.forEach((m: { subscription_status: string; created_at: string }) => {
          if (m.subscription_status === 'active') {
            const date = new Date(m.created_at);
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
            merchantsByMonth.set(monthKey, (merchantsByMonth.get(monthKey) || 0) + 1);
          }
        });

        let cumulativeActive = active - sixMonthMerchants.filter((m: { subscription_status: string }) => m.subscription_status === 'active').length;
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
          const monthName = date.toLocaleDateString('fr-FR', { month: 'short' });

          cumulativeActive += merchantsByMonth.get(monthKey) || 0;
          mrrData.push({
            month: monthName,
            mrr: Math.max(0, cumulativeActive) * SUBSCRIPTION_PRICE,
          });
        }
        setMrrHistory(mrrData);
      }

      // Monthly comparison (Real vs Projection) - use real snapshots
      const comparisonData: { month: string; revenue: number; projected: number }[] = [];
      if (snapshots && snapshots.length >= 2) {
        // Use real snapshot data for past months
        const recentSnapshots = snapshots.slice(-3);
        recentSnapshots.forEach((s: Snapshot) => {
          comparisonData.push({
            month: new Date(s.snapshot_date).toLocaleDateString('fr-FR', { month: 'short' }),
            revenue: s.mrr,
            projected: s.mrr,
          });
        });
        // Compute average monthly growth from snapshots for projection
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
        // Not enough snapshot data — show current month + projections only
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
      const merchantsWithAnyVisit = new Set<string>();
      const firstVisitPerMerchant = new Map<string, Date>();

      (allVisitsData || []).forEach((v: { merchant_id: string; visited_at: string }) => {
        merchantsWithAnyVisit.add(v.merchant_id);
        const vDate = new Date(v.visited_at);
        const existing = firstVisitPerMerchant.get(v.merchant_id);
        if (!existing || vDate < existing) {
          firstVisitPerMerchant.set(v.merchant_id, vDate);
        }
      });

      const cardDatesPerMerchant = new Map<string, Date[]>();
      (allLoyaltyCards || []).forEach((c: { merchant_id: string; created_at: string }) => {
        if (!cardDatesPerMerchant.has(c.merchant_id)) {
          cardDatesPerMerchant.set(c.merchant_id, []);
        }
        cardDatesPerMerchant.get(c.merchant_id)!.push(new Date(c.created_at));
      });
      cardDatesPerMerchant.forEach((dates) => dates.sort((a, b) => a.getTime() - b.getTime()));

      const recentCreated = merchants.filter((m: MerchantData) => new Date(m.created_at) >= oneMonthAgo);
      const recentActivated = recentCreated.filter((m: MerchantData) => merchantsWithAnyVisit.has(m.id));
      const activationRate = recentCreated.length > 0 ? Math.round((recentActivated.length / recentCreated.length) * 100) : 0;

      let totalDaysToFirst = 0;
      let countWithFirst = 0;
      firstVisitPerMerchant.forEach((firstDate, merchantId) => {
        const merchant = merchants.find((m: MerchantData) => m.id === merchantId);
        if (merchant) {
          const days = (firstDate.getTime() - new Date(merchant.created_at).getTime()) / (1000 * 60 * 60 * 24);
          totalDaysToFirst += Math.max(0, days);
          countWithFirst++;
        }
      });
      const avgTimeToFirstScan = countWithFirst > 0 ? Math.round((totalDaysToFirst / countWithFirst) * 10) / 10 : 0;

      let totalDaysTo10 = 0;
      let countWith10 = 0;
      cardDatesPerMerchant.forEach((dates, merchantId) => {
        if (dates.length >= 10) {
          const merchant = merchants.find((m: MerchantData) => m.id === merchantId);
          if (merchant) {
            const days = (dates[9].getTime() - new Date(merchant.created_at).getTime()) / (1000 * 60 * 60 * 24);
            totalDaysTo10 += Math.max(0, days);
            countWith10++;
          }
        }
      });
      const avgTimeTo10 = countWith10 > 0 ? Math.round((totalDaysTo10 / countWith10) * 10) / 10 : 0;

      setActivation({
        activationRate,
        avgTimeToFirstScan,
        avgTimeTo10Customers: avgTimeTo10,
        recentMerchantCount: recentCreated.length,
      });

      // Store raw data for funnel period filtering (P5)
      setFunnelMerchants(merchants as FunnelMerchant[]);
      setFunnelVisitSet(merchantsWithAnyVisit);

      // Weekly signups (last 8 weeks)
      const weeklyData: { week: string; count: number }[] = [];
      for (let i = 7; i >= 0; i--) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const count = sixMonthMerchants.filter((m: MerchantData) => {
          const created = new Date(m.created_at);
          return created >= weekStart && created < weekEnd;
        }).length;

        weeklyData.push({
          week: `S${8 - i}`,
          count,
        });
      }
      setWeeklySignups(weeklyData);

      // Save daily snapshot (fire-and-forget, from Revenus page)
      const today = new Date().toISOString().split('T')[0];
      supabase
        .from('revenue_snapshots')
        .upsert({
          snapshot_date: today,
          active_subscribers: active,
          trial_users: trial,
          cancelled_users: churned,
          mrr,
          conversion_rate: conversionRate,
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

      {/* REVENUS */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Euro className="w-5 h-5 text-[#5167fc]" />
          Revenus
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="MRR"
            value={`${revenue.mrr}€`}
            sub={`${revenue.activeSubscribers} × ${SUBSCRIPTION_PRICE}€`}
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
            label="Prévu mois prochain"
            value={formatCurrency(revenue.revenueNextMonth)}
            sub={`+${revenue.trialEndingSoon} essai${revenue.trialEndingSoon > 1 ? 's' : ''} potentiel${revenue.trialEndingSoon > 1 ? 's' : ''}`}
            icon={Target}
            color="amber"
          />
          <MetricCard
            label="Projection annuelle"
            value={formatCurrency(revenue.annualProjection)}
            icon={Calendar}
            color="purple"
          />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <MetricCard
            label="En essai"
            value={revenue.trialUsers}
            icon={Clock}
            color="amber"
          />
          <MetricCard
            label="Churned"
            value={revenue.churned}
            sub={`${revenue.churnRate}% taux`}
            icon={UserX}
            color="red"
          />
          <MetricCard
            label="Taux conversion"
            value={`${revenue.conversionRate}%`}
            icon={TrendingUp}
            color="blue"
          />
          <MetricCard
            label="Taux churn"
            value={`${revenue.churnRate}%`}
            icon={TrendingDown}
            color="orange"
          />
        </div>
      </section>

      {/* ACTIVITÉ */}
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

      {/* ACTIVATION */}
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

      {/* CONVERSION ESSAI (P4 + P6) */}
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

      {/* FUNNEL DE CONVERSION (P5: filtrable) */}
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

      {/* GRAPHIQUES */}
      <section className="grid lg:grid-cols-2 gap-6">
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
      </section>

      {/* Réel vs Projection (from Revenus page) */}
      <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
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
      </section>

      {/* Résumé financier (from Revenus page) */}
      <section className="p-6 bg-gradient-to-r from-[#5167fc] to-[#7c3aed] rounded-xl shadow-md text-white">
        <h2 className="mb-4 text-lg font-semibold">Résumé financier</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-white/70 text-sm">Revenu par client</p>
            <p className="text-2xl font-bold">{SUBSCRIPTION_PRICE}€/mois</p>
          </div>
          <div>
            <p className="text-white/70 text-sm">LTV estimée</p>
            <p className="text-2xl font-bold">
              {revenue.churnRate > 0
                ? formatCurrency(Math.round(SUBSCRIPTION_PRICE / (revenue.churnRate / 100)))
                : `${SUBSCRIPTION_PRICE * 12}€`}
            </p>
            <p className="text-white/50 text-xs mt-0.5">
              {revenue.churnRate > 0
                ? `ARPU / ${revenue.churnRate}% churn`
                : 'Estimation 12 mois'}
            </p>
          </div>
          <div>
            <p className="text-white/70 text-sm">Revenus potentiels (essais)</p>
            <p className="text-2xl font-bold">{formatCurrency(revenue.trialUsers * SUBSCRIPTION_PRICE)}</p>
          </div>
          <div>
            <p className="text-white/70 text-sm">Perte mensuelle (annulés)</p>
            <p className="text-2xl font-bold">{formatCurrency(revenue.churned * SUBSCRIPTION_PRICE)}</p>
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
