'use client';

import { useState, useEffect } from 'react';
import {
  Store,
  Users,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
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
  const supabase = createClientComponentClient();
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
        // Stats globales
        const { count: totalMerchants } = await supabase
          .from('merchants')
          .select('*', { count: 'exact', head: true });

        const { count: totalCustomers } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true });

        const { count: totalVisits } = await supabase
          .from('visits')
          .select('*', { count: 'exact', head: true });

        const avgCustomersPerMerchant = totalMerchants && totalMerchants > 0
          ? Math.round((totalCustomers || 0) / totalMerchants)
          : 0;

        setStats({
          totalMerchants: totalMerchants || 0,
          totalCustomers: totalCustomers || 0,
          totalVisits: totalVisits || 0,
          avgCustomersPerMerchant,
        });

        // Données par statut d'abonnement
        const { count: trialCount } = await supabase
          .from('merchants')
          .select('*', { count: 'exact', head: true })
          .eq('subscription_status', 'trial');

        const { count: activeCount } = await supabase
          .from('merchants')
          .select('*', { count: 'exact', head: true })
          .eq('subscription_status', 'active');

        const { count: cancelledCount } = await supabase
          .from('merchants')
          .select('*', { count: 'exact', head: true })
          .eq('subscription_status', 'cancelled');

        setSubscriptionData([
          { name: 'En essai', value: trialCount || 0, color: '#F59E0B' },
          { name: 'Actifs', value: activeCount || 0, color: '#10B981' },
          { name: 'Annulés', value: cancelledCount || 0, color: '#EF4444' },
        ]);

        // Données des 14 derniers jours
        const last14Days: DailyData[] = [];
        for (let i = 13; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          const startOfDay = `${dateStr}T00:00:00`;
          const endOfDay = `${dateStr}T23:59:59`;

          const { count: inscriptions } = await supabase
            .from('merchants')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfDay)
            .lte('created_at', endOfDay);

          const { count: visites } = await supabase
            .from('visits')
            .select('*', { count: 'exact', head: true })
            .gte('visited_at', startOfDay)
            .lte('visited_at', endOfDay);

          last14Days.push({
            date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
            inscriptions: inscriptions || 0,
            visites: visites || 0,
          });
        }
        setDailyData(last14Days);

        // Inscriptions par mois (6 derniers mois)
        const monthlyData: { month: string; count: number }[] = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
          const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

          const { count } = await supabase
            .from('merchants')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', firstDay.toISOString())
            .lte('created_at', lastDay.toISOString());

          monthlyData.push({
            month: date.toLocaleDateString('fr-FR', { month: 'short' }),
            count: count || 0,
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
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
        <div className="p-6 bg-white rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-100">
              <Store className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalMerchants}</p>
              <p className="text-sm text-gray-500">Commerçants</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-white rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalCustomers}</p>
              <p className="text-sm text-gray-500">Clients</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-white rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-100">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalVisits}</p>
              <p className="text-sm text-gray-500">Visites totales</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-white rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-100">
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
        <div className="p-6 bg-white rounded-2xl shadow-sm">
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
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: '#10B981', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="visites"
                name="Visites"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: '#10B981', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Répartition des abonnements */}
        <div className="p-6 bg-white rounded-2xl shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-gray-900">
            Répartition des abonnements
          </h2>
          {subscriptionData.some(d => d.value > 0) ? (
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
      <div className="p-6 bg-white rounded-2xl shadow-sm">
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
              fill="#10B981"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
