'use client';

import { useState, useEffect } from 'react';
import {
  Store,
  Users,
  TrendingUp,
  Calendar,
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
} from 'recharts';

interface DailyData {
  date: string;
  inscriptions: number;
  visites: number;
}

interface SubscriptionData {
  name: string;
  value: number;
  color: string;
}

export default function AdminAnalyticsPage() {
  const supabase = getSupabase();
  const [loading, setLoading] = useState(true);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData[]>([]);
  const [monthlyMerchants, setMonthlyMerchants] = useState<{ month: string; count: number }[]>([]);
  const [stats, setStats] = useState({
    totalMerchants: 0,
    totalCustomers: 0,
    totalVisits: 0,
    avgCustomersPerMerchant: 0,
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Calculate date ranges
        const now = new Date();
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(now.getDate() - 14);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(now.getMonth() - 6);

        // Run ALL queries in parallel for maximum performance
        const [
          { count: totalMerchants },
          { count: totalCustomers },
          { count: totalVisits },
          { count: trialCount },
          { count: activeCount },
          { count: cancelledCount },
          { data: recentMerchants },
          { data: recentVisits },
          { data: monthlyMerchantsData },
        ] = await Promise.all([
          // Stats globales
          supabase.from('merchants').select('*', { count: 'exact', head: true }),
          supabase.from('customers').select('*', { count: 'exact', head: true }),
          supabase.from('visits').select('*', { count: 'exact', head: true }),
          // Subscription status counts
          supabase.from('merchants').select('*', { count: 'exact', head: true }).eq('subscription_status', 'trial'),
          supabase.from('merchants').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active'),
          supabase.from('merchants').select('*', { count: 'exact', head: true }).eq('subscription_status', 'canceled'),
          // Raw data for last 14 days (to aggregate client-side)
          supabase.from('merchants').select('created_at').gte('created_at', fourteenDaysAgo.toISOString()),
          supabase.from('visits').select('visited_at').gte('visited_at', fourteenDaysAgo.toISOString()),
          // Raw data for last 6 months
          supabase.from('merchants').select('created_at').gte('created_at', sixMonthsAgo.toISOString()),
        ]);

        // Set global stats
        const avgCustomersPerMerchant = totalMerchants && totalMerchants > 0
          ? Math.round((totalCustomers || 0) / totalMerchants)
          : 0;

        setStats({
          totalMerchants: totalMerchants || 0,
          totalCustomers: totalCustomers || 0,
          totalVisits: totalVisits || 0,
          avgCustomersPerMerchant,
        });

        // Set subscription data
        setSubscriptionData([
          { name: 'En essai', value: trialCount || 0, color: '#F59E0B' },
          { name: 'Actifs', value: activeCount || 0, color: '#5167fc' },
          { name: 'Annulés', value: cancelledCount || 0, color: '#EF4444' },
        ]);

        // Process daily data (last 14 days) - aggregate client-side
        const merchantsByDay = new Map<string, number>();
        const visitsByDay = new Map<string, number>();

        (recentMerchants || []).forEach((m: { created_at: string }) => {
          const day = new Date(m.created_at).toISOString().split('T')[0];
          merchantsByDay.set(day, (merchantsByDay.get(day) || 0) + 1);
        });

        (recentVisits || []).forEach((v: { visited_at: string }) => {
          const day = new Date(v.visited_at).toISOString().split('T')[0];
          visitsByDay.set(day, (visitsByDay.get(day) || 0) + 1);
        });

        const last14Days: DailyData[] = [];
        for (let i = 13; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          last14Days.push({
            date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
            inscriptions: merchantsByDay.get(dateStr) || 0,
            visites: visitsByDay.get(dateStr) || 0,
          });
        }
        setDailyData(last14Days);

        // Process monthly data (last 6 months) - aggregate client-side
        const merchantsByMonth = new Map<string, number>();
        (monthlyMerchantsData || []).forEach((m: { created_at: string }) => {
          const date = new Date(m.created_at);
          const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
          merchantsByMonth.set(monthKey, (merchantsByMonth.get(monthKey) || 0) + 1);
        });

        const monthlyData: { month: string; count: number }[] = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
          monthlyData.push({
            month: date.toLocaleDateString('fr-FR', { month: 'short' }),
            count: merchantsByMonth.get(monthKey) || 0,
          });
        }
        setMonthlyMerchants(monthlyData);

      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [supabase]);

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
          Analytics
        </h1>
        <p className="mt-1 text-gray-600">
          Vue d&apos;ensemble des performances de la plateforme
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#5167fc]/10">
              <Store className="w-6 h-6 text-[#5167fc]" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalMerchants}</p>
              <p className="text-sm text-gray-500">Commerçants</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-50">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalCustomers}</p>
              <p className="text-sm text-gray-500">Clients</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-50">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalVisits}</p>
              <p className="text-sm text-gray-500">Visites totales</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-amber-50">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{stats.avgCustomersPerMerchant}</p>
              <p className="text-sm text-gray-500">Clients/commerçant</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Activité des 14 derniers jours */}
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-100">
          <h2 className="mb-6 text-lg font-semibold text-gray-900">
            Activité (14 derniers jours)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} />
              <YAxis stroke="#9CA3AF" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="inscriptions"
                name="Inscriptions"
                stroke="#5167fc"
                strokeWidth={2}
                dot={{ fill: '#5167fc', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="visites"
                name="Visites"
                stroke="#5167fc"
                strokeWidth={2}
                dot={{ fill: '#5167fc', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Répartition des abonnements */}
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-100">
          <h2 className="mb-6 text-lg font-semibold text-gray-900">
            Répartition des abonnements
          </h2>
          {subscriptionData.some((d: { value: number }) => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={subscriptionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {subscriptionData.map((entry, index) => (
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
              <Store className="w-12 h-12 mb-4 text-gray-300" />
              <p>Aucune donnée disponible</p>
            </div>
          )}
        </div>
      </div>

      {/* Inscriptions par mois */}
      <div className="p-6 bg-white rounded-lg shadow-md border border-gray-100">
        <h2 className="mb-6 text-lg font-semibold text-gray-900">
          Inscriptions par mois (6 derniers mois)
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyMerchants}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
            <YAxis stroke="#9CA3AF" fontSize={12} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
              }}
            />
            <Bar
              dataKey="count"
              name="Inscriptions"
              fill="#5167fc"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
