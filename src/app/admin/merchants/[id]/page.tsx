'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Store,
  Phone,
  Calendar,
  Gift,
  Users,
  Clock,
  CreditCard,
  TrendingUp,
  MapPin,
  Bell,
  Send,
  Tag,
  Zap,
  Settings,
  Repeat,
  ShoppingBag,
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

interface Merchant {
  id: string;
  user_id: string;
  shop_name: string;
  shop_address: string | null;
  phone: string;
  subscription_status: string;
  trial_ends_at: string | null;
  created_at: string;
  stamps_required: number;
  reward_description: string;
  loyalty_mode: 'visit' | 'article';
  // Offer fields
  offer_active: boolean;
  offer_title: string | null;
  offer_description: string | null;
  offer_expires_at: string | null;
  offer_created_at: string | null;
}

interface Customer {
  id: string;
  first_name: string;
  last_name: string | null;
  phone: string;
  loyalty_card: {
    current_stamps: number;
    last_visit_date: string | null;
    created_at: string;
  };
}

interface Stats {
  totalCustomers: number;
  activeCustomers: number;
  totalVisits: number;
  totalRedemptions: number;
  pushSubscribers: number;
  pushSent: number;
  automationsEnabled: number;
}

export default function MerchantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const merchantId = params.id as string;

  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalCustomers: 0,
    activeCustomers: 0,
    totalVisits: 0,
    totalRedemptions: 0,
    pushSubscribers: 0,
    pushSent: 0,
    automationsEnabled: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupérer le commerçant
        const { data: merchantData, error: merchantError } = await supabase
          .from('merchants')
          .select('*')
          .eq('id', merchantId)
          .single();

        if (merchantError) throw merchantError;
        setMerchant(merchantData);

        // Récupérer les stats
        const { count: totalCustomers } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true })
          .eq('merchant_id', merchantId);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { count: activeCustomers } = await supabase
          .from('loyalty_cards')
          .select('*', { count: 'exact', head: true })
          .eq('merchant_id', merchantId)
          .gte('last_visit_date', thirtyDaysAgo.toISOString().split('T')[0]);

        const { count: totalVisits } = await supabase
          .from('visits')
          .select('*', { count: 'exact', head: true })
          .eq('merchant_id', merchantId);

        const { count: totalRedemptions } = await supabase
          .from('redemptions')
          .select('*', { count: 'exact', head: true })
          .eq('merchant_id', merchantId);

        // Get push subscribers count via loyalty cards
        const { data: loyaltyCards } = await supabase
          .from('loyalty_cards')
          .select('customer_id')
          .eq('merchant_id', merchantId);

        let pushSubscribers = 0;
        if (loyaltyCards && loyaltyCards.length > 0) {
          const customerIds = [...new Set(loyaltyCards.map(c => c.customer_id))];
          const { count: subCount } = await supabase
            .from('push_subscriptions')
            .select('*', { count: 'exact', head: true })
            .in('customer_id', customerIds);
          pushSubscribers = subCount || 0;
        }

        // Get push history count (notifications sent)
        const { count: pushSentCount } = await supabase
          .from('push_history')
          .select('*', { count: 'exact', head: true })
          .eq('merchant_id', merchantId);

        // Get automations enabled count
        const { data: automationsData } = await supabase
          .from('push_automations')
          .select('*')
          .eq('merchant_id', merchantId)
          .single();

        let automationsEnabled = 0;
        if (automationsData) {
          if (automationsData.welcome_enabled) automationsEnabled++;
          if (automationsData.close_to_reward_enabled) automationsEnabled++;
          if (automationsData.reward_ready_enabled) automationsEnabled++;
          if (automationsData.inactive_reminder_enabled) automationsEnabled++;
          if (automationsData.reward_reminder_enabled) automationsEnabled++;
        }

        setStats({
          totalCustomers: totalCustomers || 0,
          activeCustomers: activeCustomers || 0,
          totalVisits: totalVisits || 0,
          totalRedemptions: totalRedemptions || 0,
          pushSubscribers,
          pushSent: pushSentCount || 0,
          automationsEnabled,
        });

        // Récupérer les clients directement (ils ont maintenant un merchant_id)
        const { data: customersData } = await supabase
          .from('customers')
          .select(`
            id,
            first_name,
            last_name,
            phone_number,
            created_at,
            loyalty_cards!inner (
              current_stamps,
              last_visit_date,
              created_at
            )
          `)
          .eq('merchant_id', merchantId)
          .order('created_at', { ascending: false })
          .limit(20);

        if (customersData) {
          const formattedCustomers = customersData.map((customer) => {
            const card = Array.isArray(customer.loyalty_cards) ? customer.loyalty_cards[0] : customer.loyalty_cards;
            return {
              id: customer.id,
              first_name: customer.first_name || '',
              last_name: customer.last_name || '',
              phone: customer.phone_number || '',
              loyalty_card: {
                current_stamps: card?.current_stamps || 0,
                last_visit_date: card?.last_visit_date || null,
                created_at: card?.created_at || customer.created_at,
              },
            };
          });
          setCustomers(formattedCustomers);
        }
      } catch (error) {
        console.error('Error fetching merchant data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [merchantId, supabase]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatRelativeDate = (dateString: string | null) => {
    if (!dateString) return 'Jamais';
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diff === 0) return "Aujourd'hui";
    if (diff === 1) return 'Hier';
    if (diff < 7) return `Il y a ${diff} jours`;
    if (diff < 30) return `Il y a ${Math.floor(diff / 7)} semaine${Math.floor(diff / 7) > 1 ? 's' : ''}`;
    return formatDate(dateString);
  };

  const getDaysRemaining = (trialEndsAt: string | null) => {
    if (!trialEndsAt) return null;
    const end = new Date(trialEndsAt);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getStatusBadge = (merchant: Merchant) => {
    switch (merchant.subscription_status) {
      case 'trial': {
        const daysLeft = getDaysRemaining(merchant.trial_ends_at);
        return (
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-100 rounded-full">
              En essai
            </span>
            {daysLeft !== null && (
              <span className={cn(
                "text-sm",
                daysLeft <= 3 ? "text-red-600 font-medium" : "text-gray-500"
              )}>
                {daysLeft <= 0 ? "Expiré" : `${daysLeft} jour${daysLeft > 1 ? 's' : ''} restant${daysLeft > 1 ? 's' : ''}`}
              </span>
            )}
          </div>
        );
      }
      case 'active':
        return (
          <span className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 rounded-full">
            Abonné actif
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 rounded-full">
            Annulé
          </span>
        );
      default:
        return (
          <span className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-full">
            {merchant.subscription_status}
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

  if (!merchant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Store className="w-12 h-12 mb-4 text-gray-300" />
        <p className="text-gray-600 mb-4">Commerçant non trouvé</p>
        <Link href="/admin/merchants">
          <Button>Retour à la liste</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/merchants">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </Link>
        </div>
      </div>

      {/* Info commerçant */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-16 h-16 font-bold text-2xl text-white rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600">
              {merchant.shop_name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{merchant.shop_name}</h1>
              {merchant.shop_address && (
                <p className="text-gray-600 flex items-center gap-1 mt-1">
                  <MapPin className="w-4 h-4" />
                  {merchant.shop_address}
                </p>
              )}
              <div className="flex items-center gap-4 mt-2 text-gray-500">
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {merchant.phone}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Inscrit le {formatDate(merchant.created_at)}
                </span>
              </div>
            </div>
          </div>
          {getStatusBadge(merchant)}
        </div>

        {/* Programme de fidélité */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="p-4 bg-emerald-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-5 h-5 text-emerald-600" />
              <span className="font-medium text-emerald-900">Programme de fidélité</span>
            </div>
            <p className="text-emerald-700">
              <span className="font-semibold">{merchant.stamps_required} {merchant.loyalty_mode === 'article' ? 'articles' : 'passages'}</span> pour obtenir : {merchant.reward_description || 'Non configuré'}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-200 text-emerald-800">
                Mode: {merchant.loyalty_mode === 'article' ? 'Par article' : 'Par visite'}
              </span>
            </div>
          </div>

        </div>

        {/* Current Temporary Offer */}
        {merchant.offer_active && merchant.offer_title && (
          <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-amber-600" />
                <span className="font-medium text-amber-900">Offre temporaire en cours</span>
              </div>
              {merchant.offer_expires_at && (
                <span className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-full",
                  new Date(merchant.offer_expires_at) < new Date()
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                )}>
                  {new Date(merchant.offer_expires_at) < new Date()
                    ? "Expirée"
                    : `Expire le ${formatDate(merchant.offer_expires_at)}`}
                </span>
              )}
            </div>
            <p className="font-semibold text-amber-800">{merchant.offer_title}</p>
            {merchant.offer_description && (
              <p className="text-amber-700 text-sm mt-1">{merchant.offer_description}</p>
            )}
          </div>
        )}
      </div>

      {/* Stats - Row 1 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="p-5 bg-white rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-100">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
              <p className="text-sm text-gray-500">Clients inscrits</p>
            </div>
          </div>
        </div>
        <div className="p-5 bg-white rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.activeCustomers}</p>
              <p className="text-sm text-gray-500">Actifs (30j)</p>
            </div>
          </div>
        </div>
        <div className="p-5 bg-white rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-100">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalVisits}</p>
              <p className="text-sm text-gray-500">Visites totales</p>
            </div>
          </div>
        </div>
        <div className="p-5 bg-white rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-pink-100">
              <Gift className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalRedemptions}</p>
              <p className="text-sm text-gray-500">Récompenses</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats - Row 2: Push & Marketing */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="p-5 bg-white rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pushSubscribers}</p>
              <p className="text-sm text-gray-500">Abonnés push</p>
            </div>
          </div>
        </div>
        <div className="p-5 bg-white rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100">
              <Send className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pushSent}</p>
              <p className="text-sm text-gray-500">Notifs envoyées</p>
            </div>
          </div>
        </div>
        <div className="p-5 bg-white rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-100">
              <Zap className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.automationsEnabled}/5</p>
              <p className="text-sm text-gray-500">Automations actives</p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des clients */}
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            Clients ({stats.totalCustomers})
          </h2>
        </div>

        {customers.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {customers.map((customer) => (
              <div
                key={customer.id}
                className="flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 font-medium text-white rounded-full bg-gray-400">
                    {customer.first_name?.charAt(0) || customer.last_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {customer.first_name} {customer.last_name || ''}
                    </p>
                    <p className="text-sm text-gray-500">{customer.phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-emerald-600">
                    {customer.loyalty_card.current_stamps}/{merchant.stamps_required}
                  </p>
                  <p className="text-xs text-gray-500">
                    Dernière visite: {formatRelativeDate(customer.loyalty_card.last_visit_date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Users className="w-12 h-12 mb-4 text-gray-300" />
            <p>Aucun client pour ce commerçant</p>
          </div>
        )}
      </div>
    </div>
  );
}
