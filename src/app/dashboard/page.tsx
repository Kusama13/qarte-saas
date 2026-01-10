'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, UserCheck, Calendar, Gift, TrendingUp, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { Button } from '@/components/ui';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { Merchant, LoyaltyCard } from '@/types';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  color: string;
}

function StatsCard({ title, value, icon: Icon, trend, color }: StatsCardProps) {
  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className="flex items-center gap-1 mt-2 text-sm text-green-600">
              <TrendingUp className="w-4 h-4" />
              {trend}
            </p>
          )}
        </div>
        <div
          className="flex items-center justify-center w-12 h-12 rounded-xl"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    visitsThisMonth: 0,
    redemptionsThisMonth: 0,
  });
  const [recentCustomers, setRecentCustomers] = useState<Array<{
    id: string;
    name: string;
    stamps: number;
    lastVisit: string;
  }>>([]);
  const [chartData, setChartData] = useState<Array<{ date: string; visits: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      console.log('Dashboard: Starting fetchData...');
      try {
        console.log('Dashboard: Getting user...');
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        console.log('Dashboard: User result:', { user: !!user, error: authError });

        if (authError) {
          console.error('Auth error:', authError);
          setError('Erreur d\'authentification: ' + authError.message);
          setLoading(false);
          return;
        }

        if (!user) {
          console.log('Dashboard: No user, redirecting...');
          router.push('/auth/merchant');
          setLoading(false);
          return;
        }

      console.log('Dashboard: Getting merchant...');
      const { data: merchantData, error: merchantError } = await supabase
        .from('merchants')
        .select('*')
        .eq('user_id', user.id)
        .single();
      console.log('Dashboard: Merchant result:', { merchant: !!merchantData, error: merchantError });

      if (merchantError) {
        console.error('Merchant error:', merchantError);
        setError('Erreur: ' + merchantError.message);
        setLoading(false);
        return;
      }

      if (!merchantData) {
        console.log('Dashboard: No merchant, redirecting...');
        router.push('/auth/merchant');
        setLoading(false);
        return;
      }

      if (!merchantData.onboarding_completed) {
        console.log('Dashboard: Onboarding not completed, redirecting...');
        router.push('/dashboard/setup');
        setLoading(false);
        return;
      }

      console.log('Dashboard: Loading stats...');

      setMerchant(merchantData);

      const { count: totalCustomers } = await supabase
        .from('loyalty_cards')
        .select('*', { count: 'exact', head: true })
        .eq('merchant_id', merchantData.id);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: activeCustomers } = await supabase
        .from('loyalty_cards')
        .select('*', { count: 'exact', head: true })
        .eq('merchant_id', merchantData.id)
        .gte('last_visit_date', thirtyDaysAgo.toISOString().split('T')[0]);

      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);

      const { count: visitsThisMonth } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .eq('merchant_id', merchantData.id)
        .gte('visited_at', firstDayOfMonth.toISOString());

      const { count: redemptionsThisMonth } = await supabase
        .from('redemptions')
        .select('*', { count: 'exact', head: true })
        .eq('merchant_id', merchantData.id)
        .gte('redeemed_at', firstDayOfMonth.toISOString());

      setStats({
        totalCustomers: totalCustomers || 0,
        activeCustomers: activeCustomers || 0,
        visitsThisMonth: visitsThisMonth || 0,
        redemptionsThisMonth: redemptionsThisMonth || 0,
      });

      const { data: recentCards } = await supabase
        .from('loyalty_cards')
        .select(`
          id,
          current_stamps,
          last_visit_date,
          customer:customers (
            first_name,
            last_name
          )
        `)
        .eq('merchant_id', merchantData.id)
        .order('updated_at', { ascending: false })
        .limit(5);

      if (recentCards) {
        setRecentCustomers(
          recentCards.map((card) => {
            const customer = Array.isArray(card.customer) ? card.customer[0] : card.customer;
            return {
              id: card.id,
              name: `${customer?.first_name || ''} ${customer?.last_name || ''}`.trim() || 'Client',
              stamps: card.current_stamps,
              lastVisit: card.last_visit_date || '',
            };
          })
        );
      }

      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        last7Days.push({
          date: date.toISOString().split('T')[0],
          label: date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
        });
      }

      const chartPromises = last7Days.map(async (day) => {
        const startOfDay = `${day.date}T00:00:00`;
        const endOfDay = `${day.date}T23:59:59`;

        const { count } = await supabase
          .from('visits')
          .select('*', { count: 'exact', head: true })
          .eq('merchant_id', merchantData.id)
          .gte('visited_at', startOfDay)
          .lte('visited_at', endOfDay);

        return { date: day.label, visits: count || 0 };
      });

      const chartResults = await Promise.all(chartPromises);
      setChartData(chartResults);
      } catch (err) {
        console.error('Dashboard error:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Réessayer</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
          Bonjour, {merchant?.shop_name}
        </h1>
        <p className="mt-1 text-gray-600">
          Voici un aperçu de votre programme de fidélité
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Clients inscrits"
          value={stats.totalCustomers}
          icon={Users}
          color="#654EDA"
        />
        <StatsCard
          title="Clients actifs (30j)"
          value={stats.activeCustomers}
          icon={UserCheck}
          color="#10B981"
        />
        <StatsCard
          title="Visites ce mois"
          value={stats.visitsThisMonth}
          icon={Calendar}
          color="#F59E0B"
        />
        <StatsCard
          title="Récompenses ce mois"
          value={stats.redemptionsThisMonth}
          icon={Gift}
          color="#EC4899"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="p-6 bg-white rounded-2xl shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-gray-900">
            Visites des 7 derniers jours
          </h2>
          {chartData.some((d) => d.visits > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="visits"
                  stroke="#654EDA"
                  strokeWidth={2}
                  dot={{ fill: '#654EDA', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[250px] text-gray-500">
              <Calendar className="w-12 h-12 mb-4 text-gray-300" />
              <p>Aucune visite enregistrée</p>
              <p className="text-sm">Les données apparaîtront ici</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-white rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Activité récente
            </h2>
            <Link href="/dashboard/customers">
              <Button variant="ghost" size="sm">
                Voir tout
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          {recentCustomers.length > 0 ? (
            <div className="space-y-4">
              {recentCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 font-medium text-white rounded-full bg-primary">
                      {customer.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{customer.name}</p>
                      <p className="text-sm text-gray-500">
                        {customer.lastVisit
                          ? `Dernière visite: ${formatRelativeTime(customer.lastVisit)}`
                          : 'Nouveau client'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">
                      {customer.stamps}/{merchant?.stamps_required}
                    </p>
                    <p className="text-xs text-gray-500">passages</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Users className="w-12 h-12 mb-4 text-gray-300" />
              <p>Aucun client pour le moment</p>
              <p className="text-sm">Affichez votre QR code !</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
