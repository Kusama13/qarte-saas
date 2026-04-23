'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  BarChart3,
  Euro,
  Filter,
  Zap,
  TrendingUp,
  Bell,
  Users,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
} from 'recharts';
import { getSupabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';

type TabKey = 'revenue' | 'funnel' | 'activation' | 'engagement' | 'automations' | 'growth';

interface TrendPoint {
  date: string;
  count: number;
}

interface DayBreakdown {
  date: string;
  label: string;
  signups: number;
  trials: number;
  paid: number;
}

interface WeeklyCohort {
  key: string;
  label: string;
  signups: number;
  trials: number;
  paid: number;
  conversionRate: number;
  dailyBreakdown: DayBreakdown[];
}

interface AnalyticsData {
  revenue: {
    mrr: number;
    monthlyMrr: number;
    annualMrr: number;
    monthlyCount: number;
    annualCount: number;
    paid: number;
    churnRate: number;
    churned: number;
    newPaidByMonth: { month: string; count: number }[];
    tierMix: { fidelity: number; all_in: number };
    arpu: number;
  };
  funnel: {
    total: number;
    trialActive: number;
    paid: number;
    canceled: number;
    expired: number;
    trialToPaidRate: number;
    trialEnded30d: number;
    trialConverted30d: number;
    avgTimeToConvert: number;
    bySource: { source: string; count: number }[];
    signupTrend: TrendPoint[];
    cohorts: WeeklyCohort[];
  };
  activation: {
    activationRate: number;
    recentMerchantCount: number;
    recentActivatedCount: number;
    avgTimeToFirstScan: number;
    avgTimeTo10Customers: number;
    featureAdoption: { label: string; count: number; total: number; pct: number }[];
  };
  engagement: {
    active7d: number;
    active30d: number;
    avgScansPerWeek: number;
    scansTrend: TrendPoint[];
    top10: { id: string; shopName: string; scans: number }[];
  };
  automations: {
    manualPushSent: number;
    automationBreakdown: { type: string; count: number }[];
    pendingEmailsByDay: { day: string; count: number }[];
    reactivationByDay: { day: string; count: number }[];
    bookingSlots: { created: number; booked: number; conversionRate: number };
    offers: { active: number; totalClaims: number };
  };
  growth: {
    totalCustomers: number;
    newCustomersTrend: TrendPoint[];
    referrals: { total: number; pending: number; completed: number };
    vouchersBySource: { source: string; count: number }[];
  };
}

const BRAND = '#4b0082';
const INDIGO = '#6366f1';
const EMERALD = '#10b981';
const AMBER = '#f59e0b';

function formatNum(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n);
}

const formatEur = (n: number) => formatCurrency(Math.round(n), 'FR', 'fr', 0);

function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5">
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl md:text-3xl font-bold mt-1 ${accent || 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function ChartCard({
  title,
  children,
  className = '',
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5 ${className}`}>
      {title && <p className="text-sm font-semibold text-gray-700 mb-3">{title}</p>}
      {children}
    </div>
  );
}

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'revenue', label: 'Revenue', icon: Euro },
  { key: 'funnel', label: 'Funnel', icon: Filter },
  { key: 'activation', label: 'Activation', icon: Zap },
  { key: 'engagement', label: 'Engagement', icon: TrendingUp },
  { key: 'automations', label: 'Automations', icon: Bell },
  { key: 'growth', label: 'Growth', icon: Users },
];

export default function AnalyticsPage() {
  const supabase = getSupabase();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [active, setActive] = useState<TabKey>('revenue');

  const fetchData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/admin/analytics', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('fetch failed');
      setData(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-center text-gray-500 mt-20">Erreur de chargement</p>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 pb-20">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="w-11 h-11 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
          <BarChart3 className="w-5 h-5 text-[#4b0082]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500">Toutes les métriques business</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="-mx-4 px-4 mb-6 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {TABS.map((t) => {
            const isActive = active === t.key;
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setActive(t.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                  isActive
                    ? 'bg-[#4b0082] text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {active === 'revenue' && <RevenueTab data={data.revenue} />}
      {active === 'funnel' && <FunnelTab data={data.funnel} />}
      {active === 'activation' && <ActivationTab data={data.activation} />}
      {active === 'engagement' && <EngagementTab data={data.engagement} />}
      {active === 'automations' && <AutomationsTab data={data.automations} />}
      {active === 'growth' && <GrowthTab data={data.growth} />}
    </div>
  );
}

/* ─── Revenue ─── */

function SplitBar({ label, count, amount, pct, color }: { label: string; count: number; amount?: string; pct: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">
          {count} {amount ? `· ${amount}` : `(${pct}%)`}
        </span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function RevenueTab({ data }: { data: AnalyticsData['revenue'] }) {
  const paid = data.paid;
  const pct = (n: number) => paid > 0 ? Math.round((n / paid) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="MRR actuel" value={formatEur(data.mrr)} accent="text-[#4b0082]" sub={`${paid} abonnés payants`} />
        <KpiCard label="Mensuel / Annuel" value={`${data.monthlyCount} / ${data.annualCount}`} sub={`${formatEur(data.monthlyMrr)} · ${formatEur(data.annualMrr)}`} />
        <KpiCard label="ARPU" value={formatEur(data.arpu)} sub="Revenu moyen / merchant" />
        <KpiCard label="Churn rate" value={`${data.churnRate}%`} sub={`${data.churned} churned`} accent={data.churnRate > 5 ? 'text-red-600' : 'text-gray-900'} />
      </div>

      <ChartCard title="Nouveaux abonnés payants par mois">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data.newPaidByMonth}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill={BRAND} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid md:grid-cols-2 gap-4">
        <ChartCard title="Répartition billing">
          <div className="space-y-4">
            <SplitBar label="Mensuel" count={data.monthlyCount} amount={formatEur(data.monthlyMrr)} pct={pct(data.monthlyCount)} color="bg-[#4b0082]" />
            <SplitBar label="Annuel" count={data.annualCount} amount={formatEur(data.annualMrr)} pct={pct(data.annualCount)} color="bg-violet-400" />
          </div>
        </ChartCard>

        <ChartCard title="Mix tier">
          <div className="space-y-4">
            <SplitBar label="Fidélité 19€" count={data.tierMix.fidelity} pct={pct(data.tierMix.fidelity)} color="bg-indigo-500" />
            <SplitBar label="Tout-en-un 24€" count={data.tierMix.all_in} pct={pct(data.tierMix.all_in)} color="bg-emerald-500" />
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

/* ─── Funnel ─── */

function FunnelTab({ data }: { data: AnalyticsData['funnel'] }) {
  const [expandedCohort, setExpandedCohort] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Total inscrits" value={formatNum(data.total)} />
        <KpiCard label="Essais actifs" value={formatNum(data.trialActive)} accent="text-amber-600" />
        <KpiCard label="Payants" value={formatNum(data.paid)} accent="text-emerald-600" />
        <KpiCard label="Expirés" value={formatNum(data.expired)} sub={`${data.canceled} annulés`} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <KpiCard label="Trial → Paid (30j)" value={`${data.trialToPaidRate}%`} sub={`${data.trialConverted30d} / ${data.trialEnded30d}`} accent="text-[#4b0082]" />
        <KpiCard label="Temps conv. moyen" value={`${data.avgTimeToConvert.toFixed(1)} j`} sub="Signup → paid" />
        <KpiCard label="Taux conversion total" value={`${data.total > 0 ? ((data.paid / data.total) * 100).toFixed(1) : '0'}%`} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <ChartCard title="Sources d'inscription">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.bySource} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="source" tick={{ fontSize: 11 }} width={120} />
              <Tooltip />
              <Bar dataKey="count" fill={BRAND} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Inscriptions — 90 derniers jours">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.signupTrend}>
              <defs>
                <linearGradient id="gradSignup" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BRAND} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d: string) => d.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke={BRAND} fill="url(#gradSignup)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {data.cohorts.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#4b0082]" />
            Cohortes hebdomadaires
          </h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="grid grid-cols-5 gap-2 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <span className="col-span-1">Semaine</span>
              <span className="text-center">Inscrits</span>
              <span className="text-center">En essai</span>
              <span className="text-center">Payants</span>
              <span className="text-center">Conversion</span>
            </div>
            <div className="divide-y divide-gray-100">
              {data.cohorts.map((cohort) => (
                <div key={cohort.key}>
                  <button
                    onClick={() => setExpandedCohort(expandedCohort === cohort.key ? null : cohort.key)}
                    className="w-full grid grid-cols-5 gap-2 px-5 py-3 hover:bg-gray-50 transition-colors items-center"
                  >
                    <span className="col-span-1 text-sm font-medium text-gray-700 text-left flex items-center gap-1.5">
                      <ChevronDown className={cn('w-3.5 h-3.5 text-gray-400 transition-transform shrink-0', expandedCohort === cohort.key && 'rotate-180')} />
                      {cohort.label}
                    </span>
                    <span className="text-sm font-bold text-gray-900 text-center">{cohort.signups}</span>
                    <span className="text-sm text-amber-600 text-center">{cohort.trials}</span>
                    <span className="text-sm text-emerald-600 font-semibold text-center">{cohort.paid}</span>
                    <span className={cn(
                      'text-sm font-bold text-center',
                      cohort.conversionRate >= 50 ? 'text-emerald-600' : cohort.conversionRate >= 20 ? 'text-amber-600' : 'text-red-500',
                    )}>
                      {cohort.conversionRate}%
                    </span>
                  </button>
                  {expandedCohort === cohort.key && (
                    <div className="bg-gray-50/50 border-t border-gray-100">
                      {cohort.dailyBreakdown.map((day) => (
                        <div key={day.date} className="grid grid-cols-5 gap-2 px-5 py-2 pl-10">
                          <span className="col-span-1 text-xs text-gray-500">{day.label}</span>
                          <span className="text-xs text-gray-700 text-center">{day.signups || '-'}</span>
                          <span className="text-xs text-amber-500 text-center">{day.trials || '-'}</span>
                          <span className="text-xs text-emerald-600 text-center">{day.paid || '-'}</span>
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
    </div>
  );
}

/* ─── Activation ─── */

function ActivationTab({ data }: { data: AnalyticsData['activation'] }) {
  const sorted = [...data.featureAdoption].sort((a, b) => b.pct - a.pct);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Taux activation 30j" value={`${data.activationRate}%`} sub={`${data.recentActivatedCount} / ${data.recentMerchantCount}`} accent="text-[#4b0082]" />
        <KpiCard label="Avg → 1er scan" value={`${data.avgTimeToFirstScan.toFixed(1)} j`} />
        <KpiCard label="Avg → 10e client" value={`${data.avgTimeTo10Customers.toFixed(1)} j`} />
        <KpiCard label="Merchants récents" value={formatNum(data.recentMerchantCount)} sub="30 derniers jours" />
      </div>

      <ChartCard title="Adoption des fonctionnalités">
        <div className="space-y-3">
          {sorted.map((f) => (
            <div key={f.label}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">{f.label}</span>
                <span className="text-gray-500">
                  {f.count}/{f.total} ({f.pct}%)
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-500 transition-all duration-500"
                  style={{ width: `${f.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}

/* ─── Engagement ─── */

function EngagementTab({ data }: { data: AnalyticsData['engagement'] }) {
  const maxScans = data.top10[0]?.scans || 0;
  const total30d = data.scansTrend.reduce((s, d) => s + d.count, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Actifs 7j" value={formatNum(data.active7d)} accent="text-indigo-600" />
        <KpiCard label="Actifs 30j" value={formatNum(data.active30d)} />
        <KpiCard label="Scans/sem (moy.)" value={data.avgScansPerWeek.toFixed(1)} />
        <KpiCard label="Scans 30j" value={formatNum(total30d)} />
      </div>

      <ChartCard title="Scans quotidiens — 30 jours">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data.scansTrend}>
            <defs>
              <linearGradient id="gradScans" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={INDIGO} stopOpacity={0.3} />
                <stop offset="100%" stopColor={INDIGO} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d: string) => d.slice(5)} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Area type="monotone" dataKey="count" stroke={INDIGO} fill="url(#gradScans)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Top 10 merchants (90j)">
        <div className="space-y-2">
          {data.top10.map((m, i) => (
            <div key={m.id} className="flex items-center gap-3">
              <span className="w-6 text-xs font-bold text-gray-400 text-right">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 truncate">{m.shopName}</span>
                  <span className="text-sm font-bold text-indigo-600 ml-2">{formatNum(m.scans)}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full mt-1">
                  <div
                    className="h-full rounded-full bg-indigo-500"
                    style={{ width: `${maxScans > 0 ? Math.round((m.scans / maxScans) * 100) : 0}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
          {data.top10.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-6">Aucune donnée</p>
          )}
        </div>
      </ChartCard>
    </div>
  );
}

/* ─── Automations ─── */

function AutomationsTab({ data }: { data: AnalyticsData['automations'] }) {
  const totalPending = data.pendingEmailsByDay.reduce((s, d) => s + d.count, 0);
  const totalReact = data.reactivationByDay.reduce((s, d) => s + d.count, 0);
  const totalAuto = data.automationBreakdown.reduce((s, a) => s + a.count, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Push manuels" value={formatNum(data.manualPushSent)} accent="text-[#4b0082]" />
        <KpiCard label="Push automatiques" value={formatNum(totalAuto)} sub="Sur la période" />
        <KpiCard label="Conv. réservation" value={`${data.bookingSlots.conversionRate}%`} sub={`${data.bookingSlots.booked} / ${data.bookingSlots.created}`} accent="text-emerald-600" />
        <KpiCard label="Offres actives" value={formatNum(data.offers.active)} sub={`${data.offers.totalClaims} claims`} />
      </div>

      <ChartCard title="Push automatiques par type">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data.automationBreakdown} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
            <YAxis type="category" dataKey="type" tick={{ fontSize: 11 }} width={140} />
            <Tooltip />
            <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid md:grid-cols-2 gap-4">
        <ChartCard title="Emails pending par jour">
          <div className="flex items-baseline justify-between mb-2">
            <p className="text-2xl font-bold text-gray-900">{formatNum(totalPending)}</p>
            <p className="text-xs text-gray-400">Total</p>
          </div>
          <div className="space-y-1.5">
            {data.pendingEmailsByDay.slice(-7).map((d) => (
              <div key={d.day} className="flex items-center justify-between text-xs">
                <span className="text-gray-500">{d.day}</span>
                <span className="font-semibold text-gray-700">{d.count}</span>
              </div>
            ))}
            {data.pendingEmailsByDay.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-2">Aucune donnée</p>
            )}
          </div>
        </ChartCard>

        <ChartCard title="Réactivation par jour">
          <div className="flex items-baseline justify-between mb-2">
            <p className="text-2xl font-bold text-gray-900">{formatNum(totalReact)}</p>
            <p className="text-xs text-gray-400">Total</p>
          </div>
          <div className="space-y-1.5">
            {data.reactivationByDay.slice(-7).map((d) => (
              <div key={d.day} className="flex items-center justify-between text-xs">
                <span className="text-gray-500">{d.day}</span>
                <span className="font-semibold text-gray-700">{d.count}</span>
              </div>
            ))}
            {data.reactivationByDay.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-2">Aucune donnée</p>
            )}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

/* ─── Growth ─── */

function GrowthTab({ data }: { data: AnalyticsData['growth'] }) {
  const newCustomers30d = data.newCustomersTrend.reduce((s, d) => s + d.count, 0);
  const totalVouchers = data.vouchersBySource.reduce((s, v) => s + v.count, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Total clients" value={formatNum(data.totalCustomers)} accent="text-emerald-600" />
        <KpiCard label="Nouveaux 30j" value={formatNum(newCustomers30d)} />
        <KpiCard label="Parrainages" value={formatNum(data.referrals.total)} sub={`${data.referrals.completed} complétés · ${data.referrals.pending} en attente`} />
        <KpiCard label="Vouchers émis" value={formatNum(totalVouchers)} />
      </div>

      <ChartCard title="Nouveaux clients — 30 jours">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data.newCustomersTrend}>
            <defs>
              <linearGradient id="gradCustomers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={EMERALD} stopOpacity={0.3} />
                <stop offset="100%" stopColor={EMERALD} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d: string) => d.slice(5)} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Area type="monotone" dataKey="count" stroke={EMERALD} fill="url(#gradCustomers)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid md:grid-cols-2 gap-4">
        <ChartCard title="Parrainages">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">Complétés</span>
                <span className="text-gray-500">{data.referrals.completed}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${data.referrals.total > 0 ? (data.referrals.completed / data.referrals.total) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">En attente</span>
                <span className="text-gray-500">{data.referrals.pending}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-400"
                  style={{ width: `${data.referrals.total > 0 ? (data.referrals.pending / data.referrals.total) * 100 : 0}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-gray-400 pt-2">
              Taux de complétion :{' '}
              <span className="font-semibold text-gray-600">
                {data.referrals.total > 0 ? ((data.referrals.completed / data.referrals.total) * 100).toFixed(1) : '0'}%
              </span>
            </p>
          </div>
        </ChartCard>

        <ChartCard title="Vouchers par source">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.vouchersBySource} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="source" tick={{ fontSize: 11 }} width={100} />
              <Tooltip />
              <Bar dataKey="count" fill={AMBER} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
