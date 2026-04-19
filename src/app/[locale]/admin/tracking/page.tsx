'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  UserPlus,
  Activity,
  Layers,
  Bell,
  CalendarDays,
  Users,
  BarChart3,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

const BRAND = '#5167fc';
const COLORS = ['#5167fc', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#ef4444'];

/* ── Helpers ── */

function MetricCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4 mt-10 first:mt-0">
      <Icon className="w-5 h-5 text-indigo-500" />
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
    </div>
  );
}

function ChartCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm p-5 ${className}`}>
      {children}
    </div>
  );
}

interface TrendPoint { date: string; count: number }
interface KeyCount { [key: string]: string | number; count: number }
interface Top10Entry { id: string; shopName: string; scans: number }
interface FeatureEntry { label: string; count: number; total: number; pct: number }

interface TrackingData {
  signupFunnel: {
    bySource: KeyCount[];
    byFeatureChoice: KeyCount[];
    signupTrend: TrendPoint[];
    funnel: { total: number; trialActive: number; converted: number; canceled: number; expired: number };
  };
  tierMix: { fidelity: number; all_in: number; mrrEstimateEur: number };
  engagement: {
    active7d: number;
    active30d: number;
    scansTrend: TrendPoint[];
    avgScansPerWeek: number;
    top10: Top10Entry[];
  };
  featureAdoption: FeatureEntry[];
  pushEmail: {
    manualPushSent: number;
    automationBreakdown: KeyCount[];
    pendingEmailsByDay: KeyCount[];
    reactivationByDay: KeyCount[];
  };
  bookingOffers: {
    slotsCreated: number;
    slotsBooked: number;
    conversionRate: number;
    activeOffers: number;
    totalClaims: number;
  };
  customerGrowth: {
    total: number;
    newCustomersTrend: TrendPoint[];
    referrals: { total: number; pending: number; completed: number };
    vouchersBySource: KeyCount[];
  };
}

export default function TrackingPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TrackingData | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/tracking');
      if (!res.ok) throw new Error('fetch failed');
      setData(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-center text-gray-500 mt-20">Erreur de chargement</p>;
  }

  const { signupFunnel, tierMix, engagement, featureAdoption, pushEmail, bookingOffers, customerGrowth } = data;
  const f = signupFunnel.funnel;
  const totalPaid = tierMix.fidelity + tierMix.all_in;
  const fidelityPct = totalPaid > 0 ? Math.round((tierMix.fidelity / totalPaid) * 100) : 0;
  const allInPct = totalPaid > 0 ? 100 - fidelityPct : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 pb-20">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-6 h-6 text-indigo-500" />
          <h1 className="text-2xl font-bold text-gray-900">Tracking</h1>
        </div>
        <p className="text-sm text-gray-500">Analyses et metriques detaillees</p>
      </div>

      {/* ═══ Section 1: Funnel d'inscription ═══ */}
      <SectionHeader icon={UserPlus} title="Funnel d'inscription" />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <MetricCard label="Total inscrits" value={f.total} />
        <MetricCard label="Essais actifs" value={f.trialActive} />
        <MetricCard label="Convertis" value={f.converted} />
        <MetricCard label="Annules" value={f.canceled} />
        <MetricCard label="Expires" value={f.expired} />
      </div>

      {/* Tier mix (paying merchants only) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MetricCard label="Tier Fidélité" value={`${tierMix.fidelity}`} />
        <MetricCard label="Tier Tout-en-un" value={`${tierMix.all_in}`} />
        <MetricCard label="Mix Fidélité" value={`${fidelityPct}%`} />
        <MetricCard label="MRR estimé" value={`${tierMix.mrrEstimateEur}€`} />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <ChartCard>
          <p className="text-sm font-semibold text-gray-700 mb-3">Sources d&apos;inscription</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={signupFunnel.bySource} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="source" tick={{ fontSize: 11 }} width={120} />
              <Tooltip />
              <Bar dataKey="count" fill={BRAND} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard>
          <p className="text-sm font-semibold text-gray-700 mb-3">Premier choix de fonctionnalite</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={signupFunnel.byFeatureChoice}
                dataKey="count"
                nameKey="choice"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ choice, percent }: { choice: string; percent: number }) => `${choice} (${Math.round(percent * 100)}%)`}
              >
                {signupFunnel.byFeatureChoice.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard className="mb-6">
        <p className="text-sm font-semibold text-gray-700 mb-3">Inscriptions (90 derniers jours)</p>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={signupFunnel.signupTrend}>
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

      {/* Funnel bars */}
      <ChartCard className="mb-6">
        <p className="text-sm font-semibold text-gray-700 mb-4">Funnel de conversion</p>
        <div className="space-y-3">
          {[
            { label: 'Inscrits', value: f.total, pct: 100 },
            { label: 'Essai actif', value: f.trialActive, pct: f.total > 0 ? Math.round((f.trialActive / f.total) * 100) : 0 },
            { label: 'Converti payant', value: f.converted, pct: f.total > 0 ? Math.round((f.converted / f.total) * 100) : 0 },
          ].map((step) => (
            <div key={step.label}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">{step.label}</span>
                <span className="text-gray-400">{step.value} ({step.pct}%)</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                  style={{ width: `${step.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </ChartCard>

      {/* ═══ Section 2: Engagement ═══ */}
      <SectionHeader icon={Activity} title="Engagement" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MetricCard label="Actifs 7j" value={engagement.active7d} />
        <MetricCard label="Actifs 30j" value={engagement.active30d} />
        <MetricCard label="Moy. scans/sem" value={engagement.avgScansPerWeek} />
        <MetricCard label="Total scans 30j" value={engagement.scansTrend.reduce((s, d) => s + d.count, 0)} />
      </div>

      <ChartCard className="mb-6">
        <p className="text-sm font-semibold text-gray-700 mb-3">Scans quotidiens (30 jours)</p>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={engagement.scansTrend}>
            <defs>
              <linearGradient id="gradScans" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d: string) => d.slice(5)} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Area type="monotone" dataKey="count" stroke="#10b981" fill="url(#gradScans)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Top 10 */}
      <ChartCard className="mb-6">
        <p className="text-sm font-semibold text-gray-700 mb-3">Top 10 merchants (90j)</p>
        <div className="space-y-2">
          {engagement.top10.map((m, i) => (
            <div key={m.id} className="flex items-center gap-3">
              <span className="w-6 text-xs font-bold text-gray-400 text-right">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 truncate">{m.shopName}</span>
                  <span className="text-sm font-bold text-indigo-600 ml-2">{m.scans}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full mt-1">
                  <div
                    className="h-full rounded-full bg-indigo-500"
                    style={{ width: `${engagement.top10[0]?.scans > 0 ? Math.round((m.scans / engagement.top10[0].scans) * 100) : 0}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </ChartCard>

      {/* ═══ Section 3: Adoption ═══ */}
      <SectionHeader icon={Layers} title="Adoption des fonctionnalites" />

      <ChartCard className="mb-6">
        <div className="space-y-3">
          {featureAdoption.map((f) => (
            <div key={f.label}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">{f.label}</span>
                <span className="text-gray-400">{f.count}/{f.total} ({f.pct}%)</span>
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

      {/* ═══ Section 4: Push & Emails ═══ */}
      <SectionHeader icon={Bell} title="Push & Emails" />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <MetricCard label="Push manuels" value={pushEmail.manualPushSent} />
        <MetricCard
          label="Push automatiques"
          value={pushEmail.automationBreakdown.reduce((s, a) => s + a.count, 0)}
        />
        <MetricCard
          label="Emails envoyes"
          value={
            pushEmail.pendingEmailsByDay.reduce((s, e) => s + e.count, 0) +
            pushEmail.reactivationByDay.reduce((s, e) => s + e.count, 0)
          }
        />
      </div>

      <ChartCard className="mb-6">
        <p className="text-sm font-semibold text-gray-700 mb-3">Push automatiques par type</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={pushEmail.automationBreakdown} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="type" tick={{ fontSize: 11 }} width={130} />
            <Tooltip />
            <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* ═══ Section 5: Planning & Offres ═══ */}
      <SectionHeader icon={CalendarDays} title="Planning & Offres" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MetricCard label="Creneaux crees" value={bookingOffers.slotsCreated} sub="90 derniers jours" />
        <MetricCard label="Creneaux reserves" value={bookingOffers.slotsBooked} />
        <MetricCard label="Taux reservation" value={`${bookingOffers.conversionRate}%`} />
        <MetricCard label="Offres actives" value={bookingOffers.activeOffers} sub={`${bookingOffers.totalClaims} claims total`} />
      </div>

      {/* ═══ Section 6: Croissance clients ═══ */}
      <SectionHeader icon={Users} title="Croissance clients" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MetricCard label="Total clients" value={customerGrowth.total.toLocaleString()} />
        <MetricCard
          label="Nouveaux 30j"
          value={customerGrowth.newCustomersTrend.reduce((s, d) => s + d.count, 0)}
        />
        <MetricCard label="Parrainages" value={customerGrowth.referrals.total} sub={`${customerGrowth.referrals.completed} completes`} />
        <MetricCard
          label="Vouchers emis"
          value={customerGrowth.vouchersBySource.reduce((s, v) => s + v.count, 0)}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <ChartCard>
          <p className="text-sm font-semibold text-gray-700 mb-3">Nouveaux clients (30 jours)</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={customerGrowth.newCustomersTrend}>
              <defs>
                <linearGradient id="gradCustomers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ec4899" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d: string) => d.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#ec4899" fill="url(#gradCustomers)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard>
          <p className="text-sm font-semibold text-gray-700 mb-3">Vouchers par source</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={customerGrowth.vouchersBySource} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="source" tick={{ fontSize: 11 }} width={90} />
              <Tooltip />
              <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
