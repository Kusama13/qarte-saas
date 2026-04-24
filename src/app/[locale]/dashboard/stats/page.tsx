'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from '@/i18n/navigation';
import {
  Euro,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  UserX,
  Users,
  UserPlus,
  Share2,
  Loader2,
  Scissors,
  Crown,
  Lock,
  Sparkles,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';
import { useMerchant } from '@/contexts/MerchantContext';
import { safeFetchJson } from '@/lib/fetch';
import { formatCurrency } from '@/lib/utils';
import { getPlanFeatures } from '@/lib/plan-tiers';
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

const MONTH_NAMES = ['Janv.', 'Févr.', 'Mars', 'Avril', 'Mai', 'Juin', 'Juill.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'];
const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

// Les statistiques ne remontent jamais avant avril 2026 — on n'avait pas encore
// les donnees de planning en ligne etablies avant.
const STATS_FLOOR_YEAR = 2026;
const STATS_FLOOR_MONTH = 4; // avril (1-indexed)

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

function isoDay(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function labelForMonthKey(key: string, showYear: boolean): string {
  const [y, m] = key.split('-');
  const name = MONTH_NAMES[parseInt(m, 10) - 1];
  return showYear ? `${name} ${y.slice(2)}` : name;
}

/** Liste des mois disponibles depuis le floor jusqu'au mois en cours (ordre decroissant). */
function availableMonths(): string[] {
  const now = new Date();
  const months: string[] = [];
  const cursor = new Date(now.getFullYear(), now.getMonth(), 1);
  const floor = new Date(STATS_FLOOR_YEAR, STATS_FLOOR_MONTH - 1, 1);
  while (cursor >= floor) {
    months.push(monthKey(cursor));
    cursor.setMonth(cursor.getMonth() - 1);
  }
  return months;
}

/**
 * Decoupe un mois en semaines civiles (lundi -> dimanche), clampees au mois.
 * Retourne une liste d'intervalles { from, to, label, dateRange }.
 * Ex. avril 2026 : Sem 1 = 01-05 (mer-dim), Sem 2 = 06-12, ...
 * dateRange = "1-5" ou "6-12" (jours du mois uniquement)
 */
function weeksInMonth(monthKey: string): Array<{ idx: number; from: string; to: string; label: string; dateRange: string }> {
  const [y, m] = monthKey.split('-').map((n) => parseInt(n, 10));
  const firstDay = new Date(y, m - 1, 1);
  const lastDay = new Date(y, m, 0);
  const weeks: Array<{ idx: number; from: string; to: string; label: string; dateRange: string }> = [];
  const cursor = new Date(firstDay);
  let idx = 1;
  while (cursor <= lastDay) {
    const jsDay = cursor.getDay();
    const offsetToMonday = jsDay === 0 ? 6 : jsDay - 1;
    const monday = new Date(cursor);
    monday.setDate(cursor.getDate() - offsetToMonday);
    const weekFrom = monday < firstDay ? new Date(firstDay) : monday;
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const weekTo = sunday > lastDay ? new Date(lastDay) : sunday;
    const fromDay = weekFrom.getDate();
    const toDay = weekTo.getDate();
    const dateRange = fromDay === toDay ? `${fromDay}` : `${fromDay}–${toDay}`;
    weeks.push({
      idx,
      from: isoDay(weekFrom),
      to: isoDay(weekTo),
      label: `Sem ${idx}`,
      dateRange,
    });
    idx++;
    cursor.setTime(sunday.getTime());
    cursor.setDate(sunday.getDate() + 1);
  }
  return weeks;
}

function monthRangeForKey(monthKey: string): { from: string; to: string } {
  const [y, m] = monthKey.split('-').map((n) => parseInt(n, 10));
  const from = `${y}-${pad2(m)}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const to = `${y}-${pad2(m)}-${pad2(lastDay)}`;
  return { from, to };
}

const TOOLTIP_STYLE = {
  fontSize: '12px',
  borderRadius: '12px',
  border: '1px solid #f3f4f6',
  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)',
  padding: '8px 10px',
};

interface StatsResponse {
  period: { from: string; to: string; days: number; bookingMode: string };
  previousPeriod: { from: string; to: string } | null;
  planning: {
    revenue: { current: number; previous: number; delta: number };
    bookings: { current: number; previous: number; delta: number };
    fillRate: { current: number; previous: number; bookedMinutes: number; availableMinutes: number };
    noShowRate: { current: number; previous: number; marked: number; noShows: number };
    topServices: Array<{ service_id: string; name: string; count: number; revenue: number }>;
    timeline: Array<{ date: string; revenue: number; bookings: number }>;
    fillByDayOfWeek: Array<{ day: number; fillRate: number; bookedMin: number; availableMin: number }>;
  };
  fidelite: {
    newCustomers: { current: number; previous: number; delta: number };
    returningRate: { current: number; returning: number; distinct: number };
    vouchersRedeemed: { current: number; previous: number; delta: number };
    topClients: Array<{ loyalty_card_id: string; name: string; visits: number }>;
    newCustomersTimeline: Array<{ date: string; count: number }>;
    referrals: { invited: number; converted: number; conversionRate: number };
  };
}

function DeltaPill({ delta }: { delta: number }) {
  if (delta === 0) {
    return <span className="text-[10px] text-slate-400">—</span>;
  }
  const positive = delta > 0;
  const TrendIcon = positive ? TrendingUp : TrendingDown;
  const classes = positive
    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
    : 'bg-red-50 text-red-600 border-red-100';
  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1.5 py-0 rounded-full border text-[10px] font-bold ${classes}`}
    >
      <TrendIcon className="w-2.5 h-2.5 stroke-[3]" />
      {positive ? '+' : ''}{delta}%
    </span>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  delta,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  delta?: number;
  color: 'emerald' | 'indigo' | 'rose' | 'amber' | 'cyan' | 'violet';
}) {
  // Hex dominants pour le gradient d'icone (pattern StatsCard)
  const hexMap: Record<'emerald' | 'indigo' | 'rose' | 'amber' | 'cyan' | 'violet', string> = {
    emerald: '#10b981',
    indigo: '#6366f1',
    rose: '#f43f5e',
    amber: '#f59e0b',
    cyan: '#06b6d4',
    violet: '#8b5cf6',
  };
  const hex = hexMap[color];

  return (
    <div className="h-full p-4 md:p-5 bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0 shadow-md"
          style={{
            background: `linear-gradient(135deg, ${hex}, ${hex}cc)`,
            boxShadow: `0 4px 12px ${hex}33`,
          }}
        >
          <Icon className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider leading-tight line-clamp-2 flex-1 min-w-0">
          {label}
        </p>
      </div>
      <div className="flex items-baseline flex-wrap gap-x-1.5 gap-y-0.5">
        <h3 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-[-0.03em] tabular-nums leading-none">
          {value}
        </h3>
        {delta !== undefined && <DeltaPill delta={delta} />}
      </div>
      {sub && <p className="text-[11px] text-slate-500 leading-snug">{sub}</p>}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-1 mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
      {children}
    </p>
  );
}

function UpgradeLock() {
  return (
    <div className="rounded-3xl border border-gray-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-8 md:p-12 text-center">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4">
        <Lock className="w-6 h-6 text-indigo-500" />
      </div>
      <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">Tes statistiques complètes</h2>
      <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
        Suis ton chiffre d&apos;affaires, ton taux de remplissage, tes tops prestations et le comportement de tes clientes — tout ce qu&apos;il te faut pour piloter ton salon. Inclus dans le plan Tout-en-un.
      </p>
      <Link
        href="/dashboard/subscription"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4b0082] text-white text-sm font-semibold hover:bg-[#3a0066] transition-colors active:scale-95 touch-manipulation"
      >
        <Crown className="w-4 h-4" />
        Passer au Tout-en-un
      </Link>
    </div>
  );
}

export default function StatsPage() {
  const { merchant, loading: merchantLoading } = useMerchant();
  const [month, setMonth] = useState<string>(() => monthKey(new Date()));
  // weekIdx = 0 -> mois entier, 1..N -> semaine N du mois courant
  const [weekIdx, setWeekIdx] = useState<number>(0);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const planFeatures = useMemo(() => getPlanFeatures(merchant), [merchant]);
  const hasAccess = planFeatures.planning;

  const months = useMemo(() => availableMonths(), []);
  const showYears = useMemo(() => {
    const years = new Set(months.map((m) => m.slice(0, 4)));
    return years.size > 1;
  }, [months]);

  const weeks = useMemo(() => weeksInMonth(month), [month]);
  const range = useMemo(() => {
    if (weekIdx === 0) return monthRangeForKey(month);
    const w = weeks.find((x) => x.idx === weekIdx);
    return w ? { from: w.from, to: w.to } : monthRangeForKey(month);
  }, [month, weekIdx, weeks]);

  // Reset week selection when month changes
  useEffect(() => {
    setWeekIdx(0);
  }, [month]);

  const fetchStats = useCallback(async () => {
    if (!merchant?.id) return;
    setLoading(true);
    setError(null);
    const data = await safeFetchJson<StatsResponse>(`/api/dashboard/stats?merchantId=${merchant.id}&from=${range.from}&to=${range.to}`);
    if (!data) {
      setError('Impossible de charger tes statistiques.');
    } else {
      setStats(data);
    }
    setLoading(false);
  }, [merchant?.id, range.from, range.to]);

  useEffect(() => {
    if (hasAccess) fetchStats();
    else setLoading(false);
  }, [hasAccess, fetchStats]);

  if (merchantLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Tes statistiques</h1>
        <p className="mt-0.5 text-xs md:text-sm text-slate-500">Ton CA, ton remplissage, tes tops prestations et ta fidélité.</p>
      </div>

      {!hasAccess ? (
        <UpgradeLock />
      ) : (
        <>
          {/* Mois + semaines du mois actif */}
          <div className="space-y-2">
            {/* Niveau 1 : mois */}
            <div className="-mx-4 px-4 overflow-x-auto scrollbar-none">
              <div className="flex gap-1.5 min-w-max">
                {months.map((key) => {
                  const active = month === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setMonth(key)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors touch-manipulation whitespace-nowrap ${
                        active
                          ? 'bg-[#4b0082] text-white shadow-sm'
                          : 'bg-white text-slate-600 border border-gray-100 hover:text-slate-900 hover:border-gray-200'
                      }`}
                    >
                      {labelForMonthKey(key, showYears)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Niveau 2 : semaines du mois actif */}
            {weeks.length > 1 && (
              <div className="-mx-4 px-4 overflow-x-auto scrollbar-none">
                <div className="flex gap-1.5 min-w-max">
                  <button
                    type="button"
                    onClick={() => setWeekIdx(0)}
                    className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors touch-manipulation whitespace-nowrap ${
                      weekIdx === 0
                        ? 'bg-slate-900 text-white'
                        : 'bg-transparent text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Tout le mois
                  </button>
                  {weeks.map((w) => {
                    const active = weekIdx === w.idx;
                    return (
                      <button
                        key={w.idx}
                        type="button"
                        onClick={() => setWeekIdx(w.idx)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-colors touch-manipulation whitespace-nowrap ${
                          active
                            ? 'bg-slate-900 text-white'
                            : 'bg-transparent text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        <span>{w.label}</span>
                        <span className={active ? 'text-white/70' : 'text-slate-400'}>
                          {w.dateRange}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center min-h-[40vh]">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="rounded-2xl bg-rose-50 border border-rose-100 p-4 text-sm text-rose-700">{error}</div>
          ) : stats ? (
            <>
              {/* ─── Section Planning ─── */}
              <div>
                <SectionLabel>Planning & réservation</SectionLabel>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <KpiCard
                    icon={Euro}
                    label="Chiffre d'affaires"
                    value={formatCurrency(stats.planning.revenue.current, merchant?.country)}
                    delta={stats.planning.revenue.delta}
                    color="emerald"
                  />
                  <KpiCard
                    icon={CalendarDays}
                    label="Réservations"
                    value={String(stats.planning.bookings.current)}
                    delta={stats.planning.bookings.delta}
                    color="cyan"
                  />
                  <KpiCard
                    icon={TrendingUp}
                    label="Remplissage"
                    value={stats.planning.fillRate.availableMinutes ? `${Math.round(stats.planning.fillRate.current * 100)}%` : '—'}
                    sub={stats.planning.fillRate.availableMinutes
                      ? `${Math.round(stats.planning.fillRate.bookedMinutes / 60)}h / ${Math.round(stats.planning.fillRate.availableMinutes / 60)}h ouvertes`
                      : 'Renseigne tes horaires'}
                    color="indigo"
                  />
                  <KpiCard
                    icon={UserX}
                    label="Taux no-show"
                    value={stats.planning.noShowRate.marked ? `${Math.round(stats.planning.noShowRate.current * 100)}%` : '—'}
                    sub={stats.planning.noShowRate.marked ? `${stats.planning.noShowRate.noShows}/${stats.planning.noShowRate.marked} marqués` : 'Aucun RDV marqué'}
                    color="rose"
                  />
                </div>
              </div>

              {/* Revenue timeline */}
              {stats.planning.timeline.length > 0 && (
                <div>
                  <SectionLabel>Ton CA sur la période</SectionLabel>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.planning.timeline} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                            tickFormatter={(d: string) => d.slice(5)}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={TOOLTIP_STYLE}
                            formatter={(value: number) => [formatCurrency(value, merchant?.country), 'CA']}
                            labelFormatter={(d: string) => d}
                          />
                          <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.4} fill="url(#revenueGradient)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Fill rate by day of week */}
              <div>
                <SectionLabel>Remplissage par jour</SectionLabel>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stats.planning.fillByDayOfWeek.map((d) => ({
                          label: DAY_LABELS[d.day - 1],
                          pct: Math.round(d.fillRate * 100),
                          bookedH: Math.round(d.bookedMin / 60 * 10) / 10,
                          availableH: Math.round(d.availableMin / 60 * 10) / 10,
                        }))}
                        margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip
                          contentStyle={TOOLTIP_STYLE}
                          cursor={{ fill: '#f8fafc' }}
                          formatter={(_value: number, _name: string, entry) => {
                            const d = entry.payload as { pct: number; bookedH: number; availableH: number };
                            return [`${d.pct}% (${d.bookedH}h / ${d.availableH}h)`, 'Remplissage'];
                          }}
                        />
                        <Bar dataKey="pct" fill="#6366f1" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Top services */}
              {stats.planning.topServices.length > 0 && (
                <div>
                  <SectionLabel>Tes tops prestations</SectionLabel>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-100">
                      <Scissors className="w-4 h-4 text-violet-500 shrink-0" strokeWidth={2} />
                      <span className="text-sm font-bold text-slate-900">Les plus demandées</span>
                    </div>
                    <ul className="divide-y divide-slate-100">
                      {stats.planning.topServices.map((svc, i) => (
                        <li key={svc.service_id} className="flex items-center gap-3 px-4 py-3">
                          <span className="w-6 h-6 rounded-full bg-violet-50 text-violet-600 text-[11px] font-bold flex items-center justify-center shrink-0">
                            {i + 1}
                          </span>
                          <p className="flex-1 text-sm font-medium text-slate-800 truncate">{svc.name}</p>
                          <p className="text-[11px] text-slate-400 tabular-nums shrink-0">{svc.count}×</p>
                          <p className="text-sm font-bold text-emerald-600 tabular-nums min-w-[72px] text-right shrink-0">
                            {formatCurrency(svc.revenue, merchant?.country)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* ─── Section Fidélité ─── */}
              <div>
                <SectionLabel>Fidélité & clientes</SectionLabel>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <KpiCard
                    icon={UserPlus}
                    label="Nouvelles clientes"
                    value={String(stats.fidelite.newCustomers.current)}
                    delta={stats.fidelite.newCustomers.delta}
                    color="emerald"
                  />
                  <KpiCard
                    icon={Users}
                    label="Taux de retour"
                    value={stats.fidelite.returningRate.distinct ? `${Math.round(stats.fidelite.returningRate.current * 100)}%` : '—'}
                    sub={stats.fidelite.returningRate.distinct ? `${stats.fidelite.returningRate.returning}/${stats.fidelite.returningRate.distinct} clientes` : 'Pas encore de données'}
                    color="rose"
                  />
                  <KpiCard
                    icon={Sparkles}
                    label="Récompenses utilisées"
                    value={String(stats.fidelite.vouchersRedeemed.current)}
                    delta={stats.fidelite.vouchersRedeemed.delta}
                    color="amber"
                  />
                  <KpiCard
                    icon={Share2}
                    label="Parrainages convertis"
                    value={`${stats.fidelite.referrals.converted}/${stats.fidelite.referrals.invited}`}
                    sub={stats.fidelite.referrals.invited ? `${Math.round(stats.fidelite.referrals.conversionRate * 100)}% conversion` : undefined}
                    color="violet"
                  />
                </div>
              </div>

              {/* New customers timeline */}
              {stats.fidelite.newCustomersTimeline.length > 0 && (
                <div>
                  <SectionLabel>Tes nouvelles clientes</SectionLabel>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.fidelite.newCustomersTimeline} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                            tickFormatter={(d: string) => d.slice(5)}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#f8fafc' }} />
                          <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Top clients */}
              {stats.fidelite.topClients.length > 0 && (
                <div>
                  <SectionLabel>Tes meilleures clientes</SectionLabel>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-100">
                      <Crown className="w-4 h-4 text-amber-500 shrink-0" strokeWidth={2} />
                      <span className="text-sm font-bold text-slate-900">Le podium de ta semaine</span>
                    </div>
                    <ul className="divide-y divide-slate-100">
                      {stats.fidelite.topClients.map((c, i) => (
                        <li key={c.loyalty_card_id} className="flex items-center gap-3 px-4 py-3">
                          <span className="w-6 h-6 rounded-full bg-amber-50 text-amber-600 text-[11px] font-bold flex items-center justify-center shrink-0">
                            {i + 1}
                          </span>
                          <p className="flex-1 text-sm font-medium text-slate-800 truncate">{c.name}</p>
                          <p className="text-[11px] text-slate-400 tabular-nums shrink-0">
                            {c.visits} visite{c.visits > 1 ? 's' : ''}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Empty state pour les périodes sans data */}
              {stats.planning.bookings.current === 0 &&
                stats.fidelite.newCustomers.current === 0 && (
                  <div className="rounded-3xl border border-gray-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-8 md:p-10 text-center">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4">
                      <BarChart3 className="w-6 h-6 text-indigo-500" />
                    </div>
                    <p className="text-base font-bold text-slate-900 mb-1">Pas encore de données</p>
                    <p className="text-sm text-slate-600 max-w-sm mx-auto">
                      Reviens voir quand tes clientes auront défilé sur cette période.
                    </p>
                  </div>
                )}
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
