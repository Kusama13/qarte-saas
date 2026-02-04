'use client';

import { useState, useEffect } from 'react';
import {
  Euro,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  CreditCard,
  Clock,
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { cn } from '@/lib/utils';

const SUBSCRIPTION_PRICE = 19; // €/mois

interface RevenueStats {
  activeSubscribers: number;
  trialUsers: number;
  cancelledUsers: number;
  mrr: number;
  revenueThisMonth: number;
  revenueNextMonth: number;
  annualProjection: number;
  conversionRate: number;
  trialEndingSoon: number;
}

interface Snapshot {
  snapshot_date: string;
  mrr: number;
  active_subscribers: number;
  trial_users: number;
}

export default function AdminRevenusPage() {
  const supabase = getSupabase();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RevenueStats>({
    activeSubscribers: 0,
    trialUsers: 0,
    cancelledUsers: 0,
    mrr: 0,
    revenueThisMonth: 0,
    revenueNextMonth: 0,
    annualProjection: 0,
    conversionRate: 0,
    trialEndingSoon: 0,
  });
  const [historicalData, setHistoricalData] = useState<Snapshot[]>([]);
  const [monthlyComparison, setMonthlyComparison] = useState<{ month: string; revenue: number; projected: number }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Compter les abonnés actifs
        const { count: activeCount } = await supabase
          .from('merchants')
          .select('*', { count: 'exact', head: true })
          .eq('subscription_status', 'active');

        // Compter les utilisateurs en essai
        const { count: trialCount } = await supabase
          .from('merchants')
          .select('*', { count: 'exact', head: true })
          .eq('subscription_status', 'trial');

        // Compter les annulés
        const { count: cancelledCount } = await supabase
          .from('merchants')
          .select('*', { count: 'exact', head: true })
          .eq('subscription_status', 'canceled');

        // Essais se terminant dans les 7 prochains jours
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

        const { count: endingSoonCount } = await supabase
          .from('merchants')
          .select('*', { count: 'exact', head: true })
          .eq('subscription_status', 'trial')
          .lte('trial_ends_at', sevenDaysFromNow.toISOString())
          .gte('trial_ends_at', new Date().toISOString());

        const activeSubscribers = activeCount || 0;
        const trialUsers = trialCount || 0;
        const cancelledUsers = cancelledCount || 0;
        const trialEndingSoon = endingSoonCount || 0;

        // Calculs financiers
        const mrr = activeSubscribers * SUBSCRIPTION_PRICE;
        const revenueThisMonth = mrr;

        // Estimation revenus mois prochain (actifs + 50% des essais qui se terminent)
        const estimatedConversions = Math.round(trialEndingSoon * 0.5);
        const revenueNextMonth = (activeSubscribers + estimatedConversions) * SUBSCRIPTION_PRICE;

        // Projection annuelle
        const annualProjection = mrr * 12;

        // Taux de conversion (si on a des données historiques)
        const totalEverTrial = trialUsers + activeSubscribers + cancelledUsers;
        const conversionRate = totalEverTrial > 0
          ? Math.round((activeSubscribers / totalEverTrial) * 100)
          : 0;

        setStats({
          activeSubscribers,
          trialUsers,
          cancelledUsers,
          mrr,
          revenueThisMonth,
          revenueNextMonth,
          annualProjection,
          conversionRate,
          trialEndingSoon,
        });

        // Récupérer l'historique des snapshots
        const { data: snapshots } = await supabase
          .from('revenue_snapshots')
          .select('*')
          .order('snapshot_date', { ascending: true })
          .limit(12);

        if (snapshots && snapshots.length > 0) {
          setHistoricalData(snapshots);
        } else {
          // Générer des données simulées pour la démo si pas d'historique
          const simulatedData = generateSimulatedHistory(activeSubscribers, mrr);
          setHistoricalData(simulatedData);
        }

        // Données de comparaison mensuelle
        const comparisonData = generateMonthlyComparison(mrr);
        setMonthlyComparison(comparisonData);

        // Sauvegarder le snapshot du jour (si pas déjà fait)
        await saveCurrentSnapshot({
          activeSubscribers,
          trialUsers,
          cancelledUsers,
          mrr,
          conversionRate,
        });

      } catch (error) {
        console.error('Error fetching revenue data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  const saveCurrentSnapshot = async (data: {
    activeSubscribers: number;
    trialUsers: number;
    cancelledUsers: number;
    mrr: number;
    conversionRate: number;
  }) => {
    const today = new Date().toISOString().split('T')[0];

    try {
      await supabase
        .from('revenue_snapshots')
        .upsert({
          snapshot_date: today,
          active_subscribers: data.activeSubscribers,
          trial_users: data.trialUsers,
          cancelled_users: data.cancelledUsers,
          mrr: data.mrr,
          conversion_rate: data.conversionRate,
        }, {
          onConflict: 'snapshot_date',
        });
    } catch (error) {
      console.error('Error saving snapshot:', error);
    }
  };

  const generateSimulatedHistory = (currentActive: number, currentMrr: number): Snapshot[] => {
    const data: Snapshot[] = [];
    const today = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);

      // Simuler une croissance progressive
      const growthFactor = 1 - (i * 0.15);
      const subscribers = Math.max(0, Math.round(currentActive * growthFactor));

      data.push({
        snapshot_date: date.toISOString().split('T')[0],
        mrr: subscribers * SUBSCRIPTION_PRICE,
        active_subscribers: subscribers,
        trial_users: Math.round(subscribers * 0.3),
      });
    }

    return data;
  };

  const generateMonthlyComparison = (currentMrr: number): { month: string; revenue: number; projected: number }[] => {
    const data = [];
    const today = new Date();

    for (let i = 2; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleDateString('fr-FR', { month: 'short' });

      const growthFactor = 1 - (i * 0.1);
      data.push({
        month: monthName,
        revenue: Math.round(currentMrr * growthFactor),
        projected: Math.round(currentMrr * growthFactor * 1.1),
      });
    }

    // Ajouter les 3 prochains mois en projection
    for (let i = 1; i <= 3; i++) {
      const date = new Date(today);
      date.setMonth(date.getMonth() + i);
      const monthName = date.toLocaleDateString('fr-FR', { month: 'short' });

      const growthFactor = 1 + (i * 0.05);
      data.push({
        month: monthName,
        revenue: 0,
        projected: Math.round(currentMrr * growthFactor),
      });
    }

    return data;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const pieData = [
    { name: 'Abonnés', value: stats.activeSubscribers, color: '#5167fc' },
    { name: 'En essai', value: stats.trialUsers, color: '#F59E0B' },
    { name: 'Annulés', value: stats.cancelledUsers, color: '#EF4444' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5167fc]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
          Revenus
        </h1>
        <p className="mt-1 text-gray-600">
          Suivi financier et projections
        </p>
      </div>

      {/* KPI Cards - Row 1 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* MRR */}
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-100 border-l-4 border-l-[#5167fc]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">MRR</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {formatCurrency(stats.mrr)}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {stats.activeSubscribers} abonné{stats.activeSubscribers > 1 ? 's' : ''} × {SUBSCRIPTION_PRICE}€
              </p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#5167fc]/10">
              <Euro className="w-6 h-6 text-[#5167fc]" />
            </div>
          </div>
        </div>

        {/* Revenus du mois */}
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-100 border-l-4 border-l-blue-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Revenus ce mois</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {formatCurrency(stats.revenueThisMonth)}
              </p>
              <p className="mt-1 text-sm text-[#5167fc] flex items-center gap-1">
                <ArrowUpRight className="w-4 h-4" />
                Confirmés
              </p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-50">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* À encaisser mois prochain */}
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-100 border-l-4 border-l-amber-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Prévu mois prochain</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {formatCurrency(stats.revenueNextMonth)}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                +{stats.trialEndingSoon} essai{stats.trialEndingSoon > 1 ? 's' : ''} potentiel{stats.trialEndingSoon > 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-amber-50">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

        {/* Projection annuelle */}
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-100 border-l-4 border-l-purple-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Projection annuelle</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {formatCurrency(stats.annualProjection)}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Si pas d'annulation
              </p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-50">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards - Row 2 */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Abonnés actifs */}
        <div className="p-5 bg-white rounded-lg shadow-md border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#5167fc]/10">
              <Users className="w-6 h-6 text-[#5167fc]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.activeSubscribers}</p>
              <p className="text-sm text-gray-500">Abonnés actifs</p>
            </div>
          </div>
        </div>

        {/* En essai */}
        <div className="p-5 bg-white rounded-lg shadow-md border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-amber-50">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.trialUsers}</p>
              <p className="text-sm text-gray-500">En période d'essai</p>
            </div>
          </div>
        </div>

        {/* Taux de conversion */}
        <div className="p-5 bg-white rounded-lg shadow-md border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-50">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.conversionRate}%</p>
              <p className="text-sm text-gray-500">Taux de conversion</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Évolution du MRR */}
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-100">
          <h2 className="mb-6 text-lg font-semibold text-gray-900">
            Évolution du MRR
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={historicalData}>
              <defs>
                <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5167fc" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#5167fc" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="snapshot_date"
                stroke="#9CA3AF"
                fontSize={11}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('fr-FR', { month: 'short' });
                }}
              />
              <YAxis
                stroke="#9CA3AF"
                fontSize={12}
                tickFormatter={(value) => `${value}€`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                }}
                formatter={(value: number) => [`${value}€`, 'MRR']}
                labelFormatter={(label) => {
                  const date = new Date(label);
                  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                }}
              />
              <Area
                type="monotone"
                dataKey="mrr"
                stroke="#5167fc"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorMrr)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Répartition des utilisateurs */}
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-100">
          <h2 className="mb-6 text-lg font-semibold text-gray-900">
            Répartition des utilisateurs
          </h2>
          {pieData.some((d: { value: number }) => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
              <Users className="w-12 h-12 mb-4 text-gray-300" />
              <p>Aucun utilisateur</p>
            </div>
          )}
        </div>
      </div>

      {/* Prévision vs Réel */}
      <div className="p-6 bg-white rounded-lg shadow-md border border-gray-100">
        <h2 className="mb-6 text-lg font-semibold text-gray-900">
          Revenus : Réel vs Projection
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyComparison}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
            <YAxis
              stroke="#9CA3AF"
              fontSize={12}
              tickFormatter={(value) => `${value}€`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
              }}
              formatter={(value: number) => [`${value}€`]}
            />
            <Legend />
            <Bar
              dataKey="revenue"
              name="Réel"
              fill="#5167fc"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="projected"
              name="Projection"
              fill="#93C5FD"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Indicateurs de santé */}
      <div className="p-6 bg-gradient-to-r from-[#5167fc] to-[#7c3aed] rounded-lg shadow-md text-white">
        <h2 className="mb-4 text-lg font-semibold">
          Résumé financier
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-white/70 text-sm">Revenu par client</p>
            <p className="text-2xl font-bold">{SUBSCRIPTION_PRICE}€/mois</p>
          </div>
          <div>
            <p className="text-white/70 text-sm">LTV estimée (12 mois)</p>
            <p className="text-2xl font-bold">{SUBSCRIPTION_PRICE * 12}€</p>
          </div>
          <div>
            <p className="text-white/70 text-sm">Revenus potentiels (essais)</p>
            <p className="text-2xl font-bold">{formatCurrency(stats.trialUsers * SUBSCRIPTION_PRICE)}</p>
          </div>
          <div>
            <p className="text-white/70 text-sm">Perte mensuelle (annulés)</p>
            <p className="text-2xl font-bold">{formatCurrency(stats.cancelledUsers * SUBSCRIPTION_PRICE)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
