'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Euro,
  Users,
  Store,
  Clock,
  TrendingUp,
  TrendingDown,
  UserX,
  MessageCircle,
  CheckCircle,
  Trash2,
  Calendar,
  Eye,
  UserPlus,
  Loader2,
  Zap,
  ArrowRight,
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
} from 'recharts';
import { cn } from '@/lib/utils';

const SUBSCRIPTION_PRICE = 19;
const WHATSAPP_PREFIX = 'https://wa.me/33';

interface DemoLead {
  id: string;
  phone_number: string;
  created_at: string;
  converted: boolean;
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
  });

  // Activity metrics
  const [activity, setActivity] = useState({
    totalMerchants: 0,
    totalCustomers: 0,
    totalVisits: 0,
    signupsThisWeek: 0,
    signupsThisMonth: 0,
  });

  // Leads
  const [leads, setLeads] = useState<DemoLead[]>([]);
  const [leadsStats, setLeadsStats] = useState({ total: 0, pending: 0, converted: 0 });

  // Activation metrics
  const [activation, setActivation] = useState({
    activationRate: 0,
    avgTimeToFirstScan: 0,
    avgTimeTo10Customers: 0,
    recentMerchantCount: 0,
  });

  // Funnel
  const [funnel, setFunnel] = useState({ total: 0, withProgram: 0, withFirstScan: 0, paid: 0 });

  // Charts data
  const [mrrHistory, setMrrHistory] = useState<{ month: string; mrr: number }[]>([]);
  const [weeklySignups, setWeeklySignups] = useState<{ week: string; count: number }[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const now = new Date();
      const oneWeekAgo = new Date(now);
      oneWeekAgo.setDate(now.getDate() - 7);
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(now.getMonth() - 1);
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(now.getMonth() - 6);

      // Fetch all data in parallel
      const [
        { data: allMerchants },
        { count: totalCustomers },
        { count: totalVisits },
        { data: leadsData },
        { data: superAdmins },
        { data: allVisitsData },
        { data: allLoyaltyCards },
      ] = await Promise.all([
        supabase.from('merchants').select('id, user_id, subscription_status, created_at, reward_description'),
        supabase.from('customers').select('*', { count: 'exact', head: true }),
        supabase.from('visits').select('*', { count: 'exact', head: true }),
        supabase.from('demo_leads').select('*').order('created_at', { ascending: false }),
        supabase.from('super_admins').select('user_id'),
        supabase.from('visits').select('merchant_id, visited_at'),
        supabase.from('loyalty_cards').select('merchant_id, created_at'),
      ]);

      // Get super admin user_ids
      const superAdminUserIds = new Set((superAdmins || []).map((sa: { user_id: string }) => sa.user_id));

      // Filter out super admin merchants
      type MerchantData = { id: string; user_id: string; subscription_status: string; created_at: string; reward_description: string | null };
      const merchants = (allMerchants || []).filter((m: MerchantData) => !superAdminUserIds.has(m.user_id));

      // Revenue calculations
      const active = merchants.filter((m: MerchantData) => m.subscription_status === 'active').length;
      const trial = merchants.filter((m: MerchantData) => m.subscription_status === 'trial').length;
      const churned = merchants.filter((m: MerchantData) => m.subscription_status === 'canceled').length;
      const total = merchants.length;
      const mrr = active * SUBSCRIPTION_PRICE;
      const conversionRate = total > 0 ? Math.round((active / total) * 100) : 0;
      const churnRate = (active + churned) > 0 ? Math.round((churned / (active + churned)) * 100) : 0;

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
      });

      // Activity
      setActivity({
        totalMerchants: total,
        totalCustomers: totalCustomers || 0,
        totalVisits: totalVisits || 0,
        signupsThisWeek: weekMerchants.length,
        signupsThisMonth: monthMerchants.length,
      });

      // Leads
      const allLeads = leadsData || [];
      setLeads(allLeads);
      setLeadsStats({
        total: allLeads.length,
        pending: allLeads.filter((l: { converted?: boolean }) => !l.converted).length,
        converted: allLeads.filter((l: { converted?: boolean }) => l.converted).length,
      });

      // MRR History (last 6 months) - simplified calculation
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

      // ====== ACTIVATION + FUNNEL ======
      // Build visits maps
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

      // Build loyalty cards count per merchant (for time to 10 customers)
      const cardDatesPerMerchant = new Map<string, Date[]>();
      (allLoyaltyCards || []).forEach((c: { merchant_id: string; created_at: string }) => {
        if (!cardDatesPerMerchant.has(c.merchant_id)) {
          cardDatesPerMerchant.set(c.merchant_id, []);
        }
        cardDatesPerMerchant.get(c.merchant_id)!.push(new Date(c.created_at));
      });
      // Sort each merchant's card dates
      cardDatesPerMerchant.forEach((dates) => dates.sort((a, b) => a.getTime() - b.getTime()));

      // Activation rate: % of merchants created in last 30 days with ≥1 scan
      const recentCreated = merchants.filter((m: MerchantData) => new Date(m.created_at) >= oneMonthAgo);
      const recentActivated = recentCreated.filter((m: MerchantData) => merchantsWithAnyVisit.has(m.id));
      const activationRate = recentCreated.length > 0 ? Math.round((recentActivated.length / recentCreated.length) * 100) : 0;

      // Avg time to first scan (for all merchants with a first visit)
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

      // Avg time to 10 customers
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
        avgTimeToFirstScan: avgTimeToFirstScan,
        avgTimeTo10Customers: avgTimeTo10,
        recentMerchantCount: recentCreated.length,
      });

      // Funnel
      setFunnel({
        total: merchants.length,
        withProgram: merchants.filter((m: MerchantData) => m.reward_description !== null).length,
        withFirstScan: merchants.filter((m: MerchantData) => merchantsWithAnyVisit.has(m.id)).length,
        paid: active,
      });

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

    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatPhone = (phone: string) => {
    // Remove spaces and special chars, convert 06... to 6...
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      return cleaned.substring(1);
    }
    if (cleaned.startsWith('33')) {
      return cleaned.substring(2);
    }
    return cleaned;
  };

  const openWhatsApp = (phone: string) => {
    const formattedPhone = formatPhone(phone);
    const message = encodeURIComponent('Bonjour, vous avez téléchargé notre guide sur la fidélisation. Avez-vous des questions ?');
    window.open(`${WHATSAPP_PREFIX}${formattedPhone}?text=${message}`, '_blank');
  };

  const markLeadConverted = async (id: string) => {
    const { error } = await supabase
      .from('demo_leads')
      .update({ converted: true, converted_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      setLeads(leads.map((l: DemoLead) => l.id === id ? { ...l, converted: true } : l));
      setLeadsStats(prev => ({ ...prev, pending: prev.pending - 1, converted: prev.converted + 1 }));
    }
  };

  const deleteLead = async (id: string) => {
    if (!confirm('Supprimer ce lead ?')) return;
    const { error } = await supabase.from('demo_leads').delete().eq('id', id);
    if (!error) {
      const lead = leads.find((l: DemoLead) => l.id === id);
      setLeads(leads.filter((l: DemoLead) => l.id !== id));
      setLeadsStats(prev => ({
        total: prev.total - 1,
        pending: lead?.converted ? prev.pending : prev.pending - 1,
        converted: lead?.converted ? prev.converted - 1 : prev.converted,
      }));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
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
        <p className="mt-1 text-gray-600">Vue d'ensemble business</p>
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
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
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
          <MetricCard
            label="Projection annuelle"
            value={`${revenue.annualProjection}€`}
            icon={Calendar}
            color="purple"
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
          <MetricCard
            label="Commerçants"
            value={activity.totalMerchants}
            icon={Store}
            color="indigo"
          />
          <MetricCard
            label="Clients"
            value={activity.totalCustomers}
            icon={Users}
            color="blue"
          />
          <MetricCard
            label="Visites"
            value={activity.totalVisits}
            icon={Eye}
            color="green"
          />
          <MetricCard
            label="Inscrits 7j"
            value={activity.signupsThisWeek}
            icon={UserPlus}
            color="amber"
          />
          <MetricCard
            label="Inscrits 30j"
            value={activity.signupsThisMonth}
            icon={UserPlus}
            color="purple"
          />
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

      {/* FUNNEL DE CONVERSION */}
      {funnel.total > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-[#5167fc]" />
            Funnel de conversion
          </h2>
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

      {/* LEADS EBOOK */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-[#5167fc]" />
          Leads Ebook
        </h2>

        {/* Leads stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <MetricCard label="Total" value={leadsStats.total} icon={UserPlus} color="indigo" />
          <MetricCard label="À contacter" value={leadsStats.pending} icon={Clock} color="amber" />
          <MetricCard label="Convertis" value={leadsStats.converted} icon={CheckCircle} color="green" />
        </div>

        {/* Leads list */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {leads.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Aucun lead pour le moment</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  className={cn(
                    'p-4 flex items-center justify-between gap-4',
                    lead.converted ? 'bg-green-50/50' : 'hover:bg-gray-50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      lead.converted ? 'bg-green-100' : 'bg-[#5167fc]/10'
                    )}>
                      <MessageCircle className={cn(
                        'w-5 h-5',
                        lead.converted ? 'text-green-600' : 'text-[#5167fc]'
                      )} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{lead.phone_number}</p>
                      <p className="text-xs text-gray-500">{formatDate(lead.created_at)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {lead.converted ? (
                      <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                        Converti
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => openWhatsApp(lead.phone_number)}
                          className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1.5"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Contacter
                        </button>
                        <button
                          onClick={() => markLeadConverted(lead.id)}
                          className="px-3 py-1.5 text-sm font-medium text-[#5167fc] bg-[#5167fc]/10 rounded-lg hover:bg-[#5167fc]/20 transition-colors"
                        >
                          Converti
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => deleteLead(lead.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
