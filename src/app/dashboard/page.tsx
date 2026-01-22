'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, UserCheck, Calendar, Gift, TrendingUp, ArrowRight } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { formatRelativeTime } from '@/lib/utils';
import { Button } from '@/components/ui';
import { useMerchant } from '@/contexts/MerchantContext';
import PendingPointsWidget from '@/components/PendingPointsWidget';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  color: string;
}

function StatsCard({ title, value, icon: Icon, trend, color }: StatsCardProps) {
  return (
    <div className="group relative p-6 bg-white/80 backdrop-blur-xl border border-white/40 rounded-3xl shadow-xl shadow-indigo-100/50 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-200/50 hover:-translate-y-1 overflow-hidden">
      <div className="relative flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] leading-none">{title}</p>
          <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">{value}</h3>
          {trend && (
            <div className="flex items-center gap-1 mt-3 px-2 py-1 w-fit rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/10">
              <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="text-xs font-bold">{trend}</span>
            </div>
          )}
        </div>
        <div
          className="relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6"
          style={{
            background: `linear-gradient(135deg, ${color}15 0%, ${color}30 100%)`,
            boxShadow: `0 8px 20px -6px ${color}60`
          }}
        >
          <div
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-40 transition-opacity blur-md"
            style={{ backgroundColor: color }}
          />
          <Icon className="relative w-6 h-6 transition-transform duration-500" style={{ color }} />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { merchant, loading: merchantLoading } = useMerchant();
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
    if (merchantLoading) return;
    if (!merchant) return;

    const fetchData = async () => {
      try {

      const { count: totalCustomers } = await supabase
        .from('loyalty_cards')
        .select('*', { count: 'exact', head: true })
        .eq('merchant_id', merchant.id);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: activeCustomers } = await supabase
        .from('loyalty_cards')
        .select('*', { count: 'exact', head: true })
        .eq('merchant_id', merchant.id)
        .gte('last_visit_date', thirtyDaysAgo.toISOString().split('T')[0]);

      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);

      const { count: visitsThisMonth } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .eq('merchant_id', merchant.id)
        .gte('visited_at', firstDayOfMonth.toISOString());

      const { count: redemptionsThisMonth } = await supabase
        .from('redemptions')
        .select('*', { count: 'exact', head: true })
        .eq('merchant_id', merchant.id)
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
        .eq('merchant_id', merchant.id)
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
          .eq('merchant_id', merchant.id)
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
  }, [merchant, merchantLoading, router]);

  if (merchantLoading || loading) {
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

  if (!merchant) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="relative">
        <div className="absolute -left-8 -top-8 -z-10 h-32 w-32 rounded-full bg-indigo-50/60 blur-3xl" />
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 md:text-3xl">
          Bonjour, <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            {merchant?.shop_name}
          </span>
        </h1>
        <div className="mt-2 flex items-center gap-2.5">
          <div className="flex h-2 w-2 items-center justify-center">
            <span className="absolute h-2 w-2 animate-ping rounded-full bg-indigo-400/50" />
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
          </div>
          <p className="text-sm font-medium text-gray-500 md:text-base">
            Voici un aperçu de votre programme de fidélité
          </p>
        </div>
      </div>

      {/* Qarte Shield - Points en attente */}
      <PendingPointsWidget
        merchantId={merchant.id}
        loyaltyMode={merchant.loyalty_mode}
        productName={merchant.product_name}
      />

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
        {/* Analytics Card */}
        <div className="group relative overflow-hidden bg-white/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-xl shadow-indigo-100/50 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-200/50">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-600 to-violet-600" />
          <div className="p-8">
            <h2 className="mb-8 text-xl font-bold tracking-tight text-gray-900">
              Visites des 7 derniers jours
            </h2>
            {chartData.some((d) => d.visits > 0) ? (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#654EDA" />
                        <stop offset="100%" stopColor="#7C3AED" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid #E5E7EB',
                        borderRadius: '16px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      }}
                      itemStyle={{ color: '#654EDA', fontWeight: 600 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="visits"
                      stroke="url(#lineGradient)"
                      strokeWidth={4}
                      dot={{ fill: '#654EDA', strokeWidth: 2, r: 4, stroke: '#fff' }}
                      activeDot={{ r: 7, fill: '#654EDA', stroke: '#fff', strokeWidth: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[250px] text-gray-500">
                <div className="p-4 mb-4 rounded-2xl bg-indigo-50/50">
                  <Calendar className="w-10 h-10 text-indigo-200" />
                </div>
                <p className="font-medium text-gray-900">Aucune visite enregistrée</p>
                <p className="text-sm">Les données apparaîtront après vos premiers scans</p>
              </div>
            )}
          </div>
        </div>

        {/* Activity Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-xl shadow-indigo-100/50 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-200/50">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold tracking-tight text-gray-900">
                Activité récente
              </h2>
              <Link href="/dashboard/customers">
                <Button variant="ghost" size="sm" className="font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl">
                  Voir tout
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            {recentCustomers.length > 0 ? (
              <div className="space-y-3">
                {recentCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="group/item flex items-center justify-between p-4 rounded-2xl bg-indigo-50/30 border border-transparent hover:bg-white hover:border-indigo-100 hover:shadow-md hover:shadow-indigo-100/50 transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-12 h-12 font-bold text-white rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-200/50">
                        {customer.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{customer.name}</p>
                        <p className="text-sm text-gray-500">
                          {customer.lastVisit
                            ? formatRelativeTime(customer.lastVisit)
                            : 'Nouveau client'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold text-indigo-600">{customer.stamps}</span>
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">/ {merchant?.stamps_required}</span>
                      </div>
                      <div className="h-1.5 w-16 bg-gray-200/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full transition-all duration-500"
                          style={{ width: `${(customer.stamps / (merchant?.stamps_required || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <div className="p-4 mb-4 rounded-2xl bg-indigo-50/50">
                  <Users className="w-10 h-10 text-indigo-200" />
                </div>
                <p className="font-medium text-gray-900">Aucun client pour le moment</p>
                <p className="text-sm">Affichez votre QR code pour commencer !</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
