'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Store,
  Users,
  Clock,
  CreditCard,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  MapPin,
  Phone,
  UserPlus,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  color: string;
}

function StatsCard({ title, value, icon: Icon, trend, color }: StatsCardProps) {
  return (
    <div className="group relative p-6 bg-white/80 backdrop-blur-xl rounded-2xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1.5">
      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em] leading-none mb-2">{title}</p>
          <div className="flex flex-col gap-1.5">
            <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight transition-all duration-300 group-hover:scale-[1.02] origin-left">{value}</h3>
            {trend && (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-100/50">
                  <TrendingUp className="w-3 h-3" />
                  {trend}
                </span>
                <span className="text-[10px] text-gray-400 font-medium tracking-wide">vs mois dernier</span>
              </div>
            )}
          </div>
        </div>
        <div className="relative shrink-0">
          <div
            className="absolute inset-0 blur-2xl opacity-10 transition-opacity duration-500 group-hover:opacity-30"
            style={{ backgroundColor: color }}
          />
          <div
            className="relative flex items-center justify-center w-12 h-12 rounded-2xl shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-6"
            style={{
              background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
              boxShadow: `0 10px 15px -3px ${color}30`
            }}
          >
            <Icon className="w-6 h-6 text-white drop-shadow-md" />
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 h-[3px] w-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transition-all duration-700 group-hover:w-full" style={{ backgroundColor: `${color}10` }} />
    </div>
  );
}

interface Merchant {
  id: string;
  shop_name: string;
  shop_address: string | null;
  phone: string;
  subscription_status: string;
  trial_ends_at: string | null;
  created_at: string;
}

interface DemoLead {
  id: string;
  phone_number: string;
  created_at: string;
  converted: boolean;
}

export default function AdminDashboardPage() {
  const supabase = createClientComponentClient();
  const [stats, setStats] = useState({
    totalMerchants: 0,
    trialMerchants: 0,
    activeMerchants: 0,
    totalCustomers: 0,
  });
  const [trialEndingMerchants, setTrialEndingMerchants] = useState<Merchant[]>([]);
  const [recentMerchants, setRecentMerchants] = useState<Merchant[]>([]);
  const [demoLeads, setDemoLeads] = useState<DemoLead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Total commerçants
        const { count: totalMerchants } = await supabase
          .from('merchants')
          .select('*', { count: 'exact', head: true });

        // Commerçants en essai
        const { count: trialMerchants } = await supabase
          .from('merchants')
          .select('*', { count: 'exact', head: true })
          .eq('subscription_status', 'trial');

        // Commerçants abonnés
        const { count: activeMerchants } = await supabase
          .from('merchants')
          .select('*', { count: 'exact', head: true })
          .eq('subscription_status', 'active');

        // Total clients
        const { count: totalCustomers } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true });

        setStats({
          totalMerchants: totalMerchants || 0,
          trialMerchants: trialMerchants || 0,
          activeMerchants: activeMerchants || 0,
          totalCustomers: totalCustomers || 0,
        });

        // Commerçants dont l'essai se termine bientôt (dans les 3 jours)
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

        const { data: endingTrials } = await supabase
          .from('merchants')
          .select('*')
          .eq('subscription_status', 'trial')
          .lte('trial_ends_at', threeDaysFromNow.toISOString())
          .gte('trial_ends_at', new Date().toISOString())
          .order('trial_ends_at', { ascending: true })
          .limit(10);

        setTrialEndingMerchants(endingTrials || []);

        // 5 dernières inscriptions
        const { data: recent } = await supabase
          .from('merchants')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        setRecentMerchants(recent || []);

        // Demo leads (prospects)
        const { data: leads } = await supabase
          .from('demo_leads')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        setDemoLeads(leads || []);
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  const getDaysRemaining = (trialEndsAt: string) => {
    const end = new Date(trialEndsAt);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'trial':
        return (
          <span className="px-2 py-1 text-xs font-medium text-amber-700 bg-amber-100 rounded-full">
            Essai
          </span>
        );
      case 'active':
        return (
          <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
            Actif
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full">
            Annulé
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // Calculate greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  // Format today's date in French
  const formattedDate = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  // Calculate conversion rate (trial to active)
  const conversionRate = stats.totalMerchants > 0
    ? ((stats.activeMerchants / stats.totalMerchants) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-8">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
            {getGreeting()}, <span className="text-gray-500 font-medium">Admin</span> 👋
          </h1>
          <div className="flex items-center gap-2 mt-1 text-gray-500 text-sm">
            <Calendar className="w-4 h-4" />
            <span className="capitalize">{formattedDate}</span>
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="group relative bg-white/80 backdrop-blur-xl border border-emerald-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-emerald-50">
              <Percent className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold text-emerald-600 bg-emerald-50">
              <ArrowUpRight className="w-3 h-3" />
              Actif
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-500">Taux de conversion</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{conversionRate}%</h3>
          </div>
          <div className="absolute bottom-0 left-6 right-6 h-0.5 rounded-full bg-emerald-500/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>

        <div className="group relative bg-white/80 backdrop-blur-xl border border-indigo-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-indigo-50">
              <CreditCard className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold text-indigo-600 bg-indigo-50">
              <ArrowUpRight className="w-3 h-3" />
              MRR
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-500">Revenu mensuel</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.activeMerchants * 29}€</h3>
          </div>
          <div className="absolute bottom-0 left-6 right-6 h-0.5 rounded-full bg-indigo-500/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>

        <div className="group relative bg-white/80 backdrop-blur-xl border border-amber-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-amber-50">
              <UserPlus className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold text-amber-600 bg-amber-50">
              <TrendingUp className="w-3 h-3" />
              Leads
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-500">Leads démo</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{demoLeads.length}</h3>
          </div>
          <div className="absolute bottom-0 left-6 right-6 h-0.5 rounded-full bg-amber-500/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total commerçants"
          value={stats.totalMerchants}
          icon={Store}
          color="#10B981"
        />
        <StatsCard
          title="En essai"
          value={stats.trialMerchants}
          icon={Clock}
          color="#F59E0B"
        />
        <StatsCard
          title="Abonnés"
          value={stats.activeMerchants}
          icon={CreditCard}
          color="#10B981"
        />
        <StatsCard
          title="Total clients"
          value={stats.totalCustomers}
          icon={Users}
          color="#EC4899"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Alertes - Essais se terminant */}
        <div className="group relative p-6 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-amber-500/10 hover:border-amber-200/50 overflow-hidden">
          {/* Subtle animated glow effect */}
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-amber-500/10 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          <div className="relative flex items-center gap-4 mb-6">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                Essais se terminant bientôt
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                </span>
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Action requise</p>
              </div>
            </div>
          </div>

          {trialEndingMerchants.length > 0 ? (
            <div className="space-y-3">
              {trialEndingMerchants.map((merchant) => {
                const daysLeft = getDaysRemaining(merchant.trial_ends_at!);
                return (
                  <Link
                    key={merchant.id}
                    href={`/admin/merchants/${merchant.id}`}
                    className="flex items-center justify-between p-4 rounded-xl bg-amber-50 hover:bg-amber-100 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{merchant.shop_name}</p>
                      {merchant.shop_address && (
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {merchant.shop_address}
                        </p>
                      )}
                    </div>
                    <div className={cn(
                      "px-3 py-1 rounded-full text-sm font-medium",
                      daysLeft <= 1
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    )}>
                      {daysLeft <= 0
                        ? "Expire aujourd'hui"
                        : `${daysLeft} jour${daysLeft > 1 ? 's' : ''} restant${daysLeft > 1 ? 's' : ''}`
                      }
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mb-4 text-gray-300" />
              <p>Aucun essai ne se termine prochainement</p>
            </div>
          )}
        </div>

        {/* Dernières inscriptions */}
        <div className="group relative p-6 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-200/50 overflow-hidden">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-emerald-500/10 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          <div className="relative flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <Store className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                Dernières inscriptions
              </h2>
            </div>
            <Link href="/admin/merchants">
              <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                Voir tout
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          {recentMerchants.length > 0 ? (
            <div className="space-y-3">
              {recentMerchants.map((merchant) => (
                <Link
                  key={merchant.id}
                  href={`/admin/merchants/${merchant.id}`}
                  className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 font-medium text-white rounded-full bg-emerald-600">
                      {merchant.shop_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{merchant.shop_name}</p>
                      {merchant.shop_address && (
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {merchant.shop_address}
                        </p>
                      )}
                      <p className="text-xs text-gray-400">
                        Inscrit le {formatDate(merchant.created_at)}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(merchant.subscription_status)}
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <Store className="w-12 h-12 mb-4 text-gray-300" />
              <p>Aucun commerçant inscrit</p>
            </div>
          )}
        </div>

        {/* Demo Leads - Prospects à rappeler */}
        <div className="group relative p-6 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-200/50 overflow-hidden">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-indigo-500/10 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          <div className="relative flex items-center gap-4 mb-6">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              <UserPlus className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                Leads démo
              </h2>
              <p className="text-xs text-indigo-600 font-semibold">{demoLeads.length} prospects</p>
            </div>
          </div>

          {demoLeads.length > 0 ? (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {demoLeads.map((lead) => (
                <div
                  key={lead.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl transition-colors",
                    lead.converted
                      ? "bg-green-50"
                      : "bg-indigo-50 hover:bg-indigo-100"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex items-center justify-center w-9 h-9 rounded-full",
                      lead.converted ? "bg-green-100" : "bg-indigo-100"
                    )}>
                      <Phone className={cn(
                        "w-4 h-4",
                        lead.converted ? "text-green-600" : "text-indigo-600"
                      )} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{lead.phone_number}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(lead.created_at)}
                      </p>
                    </div>
                  </div>
                  {lead.converted ? (
                    <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                      Converti
                    </span>
                  ) : (
                    <a
                      href={`tel:${lead.phone_number}`}
                      className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-full hover:bg-indigo-200 transition-colors"
                    >
                      Appeler
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <Phone className="w-12 h-12 mb-4 text-gray-300" />
              <p>Aucun lead pour le moment</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
