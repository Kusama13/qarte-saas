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

interface Merchant {
  id: string;
  shop_name: string;
  phone: string;
  subscription_status: string;
  trial_ends_at: string | null;
  created_at: string;
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
          Dashboard Admin
        </h1>
        <p className="mt-1 text-gray-600">
          Vue d&apos;ensemble de la plateforme Qarte
        </p>
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

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Alertes - Essais se terminant */}
        <div className="p-6 bg-white rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              Essais se terminant bientôt
            </h2>
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
                      <p className="text-sm text-gray-500">{merchant.phone}</p>
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
        <div className="p-6 bg-white rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Dernières inscriptions
            </h2>
            <Link href="/admin/merchants">
              <Button variant="ghost" size="sm">
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
                      <p className="text-sm text-gray-500">
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
      </div>
    </div>
  );
}
