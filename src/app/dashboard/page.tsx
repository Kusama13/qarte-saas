'use client';

import { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, UserCheck, Calendar, Gift, TrendingUp, ArrowRight, AlertTriangle, X } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { formatRelativeTime } from '@/lib/utils';
import { Button } from '@/components/ui';
import { useMerchant } from '@/contexts/MerchantContext';
import PendingPointsWidget from '@/components/PendingPointsWidget';
import GuidedTour from '@/components/GuidedTour';
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

const StatsCard = memo(function StatsCard({ title, value, icon: Icon, trend, color }: StatsCardProps) {
  return (
    <div className="group relative p-6 bg-white/70 backdrop-blur-2xl border border-white/50 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 hover:shadow-[0_20px_50px_rgba(79,70,229,0.1)] hover:-translate-y-1.5 overflow-hidden">
      {/* Premium Gradient Border Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative flex items-center justify-between">
        <div className="flex flex-col">
          <p className="text-[10px] font-black text-slate-400/80 uppercase tracking-[0.2em] mb-1.5">{title}</p>
          <div className="flex items-baseline gap-2.5">
            <h3 className="text-3xl font-bold text-slate-900 tracking-[-0.03em] tabular-nums">{value}</h3>
            {trend && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50/80 text-emerald-600 border border-emerald-100/50 shadow-sm">
                <TrendingUp className="w-3 h-3 stroke-[3]" />
                <span className="text-[10px] font-black">{trend}</span>
              </div>
            )}
          </div>
        </div>

        <div className="relative group/icon">
          <div
            className="absolute inset-0 rounded-2xl blur-xl opacity-20 group-hover/icon:opacity-40 transition-all duration-500 scale-75 group-hover/icon:scale-110"
            style={{ backgroundColor: color }}
          />
          <div
            className="relative flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-500 ease-out border border-white/50 shadow-inner group-hover:shadow-lg"
            style={{
              background: `linear-gradient(145deg, ${color}10, ${color}25)`
            }}
          >
            <Icon
              className="w-7 h-7 transition-all duration-500 ease-out group-hover:-rotate-12 group-hover:scale-110"
              style={{ color }}
            />
            {/* Animated Highlight */}
            <div className="absolute top-0 left-0 w-full h-full rounded-2xl overflow-hidden pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { merchant, loading: merchantLoading, refetch } = useMerchant();
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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showShieldWarning, setShowShieldWarning] = useState(false);
  const [shieldEnabled, setShieldEnabled] = useState(true);

  // Show onboarding guide if merchant hasn't completed it yet
  useEffect(() => {
    if (merchant && !merchant.onboarding_completed) {
      setShowOnboarding(true);
    }
  }, [merchant]);

  // Sync shield status with merchant data
  useEffect(() => {
    if (merchant) {
      setShieldEnabled(merchant.shield_enabled !== false);
    }
  }, [merchant]);

  // Handle shield toggle
  const handleShieldToggle = useCallback(async (enabled: boolean) => {
    if (!merchant) return;

    if (!enabled) {
      // Show warning before disabling
      setShowShieldWarning(true);
      return;
    }

    // Enable shield directly
    try {
      await supabase
        .from('merchants')
        .update({ shield_enabled: true })
        .eq('id', merchant.id);
      setShieldEnabled(true);
      refetch();
    } catch (err) {
      console.error('Error enabling shield:', err);
    }
  }, [merchant, supabase, refetch]);

  // Confirm disable shield
  const confirmDisableShield = useCallback(async () => {
    if (!merchant) return;

    try {
      await supabase
        .from('merchants')
        .update({ shield_enabled: false })
        .eq('id', merchant.id);
      setShieldEnabled(false);
      setShowShieldWarning(false);
      refetch();
    } catch (err) {
      console.error('Error disabling shield:', err);
    }
  }, [merchant, supabase, refetch]);

  const handleOnboardingComplete = useCallback(async () => {
    if (!merchant) return;

    try {
      await supabase
        .from('merchants')
        .update({ onboarding_completed: true })
        .eq('id', merchant.id);

      setShowOnboarding(false);
      refetch();
    } catch (err) {
      console.error('Error completing onboarding:', err);
      setShowOnboarding(false);
    }
  }, [merchant, supabase, refetch]);

  const handleOnboardingSkip = useCallback(async () => {
    if (!merchant) return;

    try {
      await supabase
        .from('merchants')
        .update({ onboarding_completed: true })
        .eq('id', merchant.id);

      setShowOnboarding(false);
      refetch();
    } catch (err) {
      console.error('Error skipping onboarding:', err);
      setShowOnboarding(false);
    }
  }, [merchant, supabase, refetch]);

  useEffect(() => {
    if (merchantLoading) return;
    if (!merchant) return;

    const fetchData = async () => {
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const firstDayOfMonth = new Date();
        firstDayOfMonth.setDate(1);
        firstDayOfMonth.setHours(0, 0, 0, 0);

        // Prepare chart date range
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          last7Days.push({
            date: date.toISOString().split('T')[0],
            label: date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
          });
        }
        const sevenDaysAgo = last7Days[0].date;

        // Execute ALL queries in parallel for maximum speed
        const [
          totalCustomersResult,
          activeCustomersResult,
          visitsThisMonthResult,
          redemptionsThisMonthResult,
          recentCardsResult,
          last7DaysVisitsResult,
        ] = await Promise.all([
          // Stats queries
          supabase
            .from('loyalty_cards')
            .select('*', { count: 'exact', head: true })
            .eq('merchant_id', merchant.id),
          supabase
            .from('loyalty_cards')
            .select('*', { count: 'exact', head: true })
            .eq('merchant_id', merchant.id)
            .gte('last_visit_date', thirtyDaysAgo.toISOString().split('T')[0]),
          supabase
            .from('visits')
            .select('*', { count: 'exact', head: true })
            .eq('merchant_id', merchant.id)
            .gte('visited_at', firstDayOfMonth.toISOString()),
          supabase
            .from('redemptions')
            .select('*', { count: 'exact', head: true })
            .eq('merchant_id', merchant.id)
            .gte('redeemed_at', firstDayOfMonth.toISOString()),
          // Recent customers
          supabase
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
            .limit(5),
          // Chart data - single query for all 7 days
          supabase
            .from('visits')
            .select('visited_at')
            .eq('merchant_id', merchant.id)
            .gte('visited_at', `${sevenDaysAgo}T00:00:00`),
        ]);

        // Set stats
        setStats({
          totalCustomers: totalCustomersResult.count || 0,
          activeCustomers: activeCustomersResult.count || 0,
          visitsThisMonth: visitsThisMonthResult.count || 0,
          redemptionsThisMonth: redemptionsThisMonthResult.count || 0,
        });

        // Set recent customers
        if (recentCardsResult.data) {
          setRecentCustomers(
            recentCardsResult.data.map((card) => {
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

        // Process chart data - count visits per day
        const visitCounts: Record<string, number> = {};
        last7Days.forEach(day => { visitCounts[day.date] = 0; });

        if (last7DaysVisitsResult.data) {
          last7DaysVisitsResult.data.forEach((visit) => {
            const visitDate = visit.visited_at.split('T')[0];
            if (visitCounts[visitDate] !== undefined) {
              visitCounts[visitDate]++;
            }
          });
        }

        setChartData(last7Days.map(day => ({
          date: day.label,
          visits: visitCounts[day.date] || 0,
        })));

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
      <div className="space-y-8 animate-pulse">
        {/* Header skeleton */}
        <div>
          <div className="h-8 w-64 bg-gray-200 rounded-lg mb-2"></div>
          <div className="h-4 w-48 bg-gray-100 rounded-lg"></div>
        </div>

        {/* Stats skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-6 bg-white rounded-3xl shadow-sm">
              <div className="flex justify-between">
                <div>
                  <div className="h-3 w-20 bg-gray-200 rounded mb-3"></div>
                  <div className="h-8 w-16 bg-gray-300 rounded"></div>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-2xl"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts skeleton */}
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="p-8 bg-white rounded-3xl shadow-sm">
            <div className="h-6 w-48 bg-gray-200 rounded mb-8"></div>
            <div className="h-[250px] bg-gray-50 rounded-2xl"></div>
          </div>
          <div className="p-8 bg-white rounded-3xl shadow-sm">
            <div className="h-6 w-32 bg-gray-200 rounded mb-8"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                  <div className="w-12 h-12 bg-gray-200 rounded-2xl"></div>
                  <div className="flex-1">
                    <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 w-16 bg-gray-100 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
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
    <>
      {/* Guided Tour */}
      {showOnboarding && (
        <GuidedTour
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}

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
        shieldEnabled={shieldEnabled}
        onShieldToggle={handleShieldToggle}
      />

      {/* Shield Disable Warning Modal */}
      {showShieldWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-red-100">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900">Désactiver Qarte Shield ?</h4>
                <p className="text-sm text-gray-500">Cette action expose votre programme</p>
              </div>
              <button
                onClick={() => setShowShieldWarning(false)}
                className="ml-auto p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-red-50 border border-red-100 mb-6">
              <p className="text-sm text-red-800 font-medium mb-2">Risques potentiels :</p>
              <ul className="text-sm text-red-700 space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span>Scans multiples frauduleux le même jour</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span>Accumulation rapide de points non légitimes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span>Récompenses obtenues de manière abusive</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowShieldWarning(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDisableShield}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
              >
                Désactiver
              </button>
            </div>
          </div>
        </div>
      )}

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
    </>
  );
}
