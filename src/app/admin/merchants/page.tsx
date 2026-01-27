'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Store, ChevronRight, Filter, MapPin } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { cn } from '@/lib/utils';

interface Merchant {
  id: string;
  shop_name: string;
  shop_address: string | null;
  phone: string;
  subscription_status: string;
  trial_ends_at: string | null;
  created_at: string;
  stamps_required: number;
  reward_description: string;
  _count?: {
    customers: number;
  };
}

type FilterStatus = 'all' | 'trial' | 'active' | 'cancelled';

export default function AdminMerchantsPage() {
  const supabase = createClientComponentClient();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [filteredMerchants, setFilteredMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');

  useEffect(() => {
    const fetchMerchants = async () => {
      try {
        const { data: merchantsData, error } = await supabase
          .from('merchants')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Pour chaque commerçant, compter les clients
        const merchantsWithCounts = await Promise.all(
          (merchantsData || []).map(async (merchant) => {
            const { count } = await supabase
              .from('loyalty_cards')
              .select('*', { count: 'exact', head: true })
              .eq('merchant_id', merchant.id);

            return {
              ...merchant,
              _count: { customers: count || 0 },
            };
          })
        );

        setMerchants(merchantsWithCounts);
        setFilteredMerchants(merchantsWithCounts);
      } catch (error) {
        console.error('Error fetching merchants:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMerchants();
  }, [supabase]);

  useEffect(() => {
    let filtered = merchants;

    // Filtrer par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter((m) => m.subscription_status === statusFilter);
    }

    // Filtrer par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.shop_name.toLowerCase().includes(query) ||
          m.phone.includes(query)
      );
    }

    setFilteredMerchants(filtered);
  }, [merchants, searchQuery, statusFilter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
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
            <span className="px-2 py-1 text-xs font-medium text-amber-700 bg-amber-100 rounded-full">
              Essai
            </span>
            {daysLeft !== null && (
              <span className={cn(
                "text-xs",
                daysLeft <= 3 ? "text-red-600" : "text-gray-500"
              )}>
                {daysLeft <= 0 ? "Expiré" : `${daysLeft}j restant${daysLeft > 1 ? 's' : ''}`}
              </span>
            )}
          </div>
        );
      }
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
            {merchant.subscription_status}
          </span>
        );
    }
  };

  const filterButtons: { label: string; value: FilterStatus }[] = [
    { label: 'Tous', value: 'all' },
    { label: 'En essai', value: 'trial' },
    { label: 'Actifs', value: 'active' },
    { label: 'Annulés', value: 'cancelled' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5167fc]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
          Commerçants
        </h1>
        <p className="mt-1 text-gray-600">
          {merchants.length} commerçant{merchants.length > 1 ? 's' : ''} inscrit{merchants.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Filtres et recherche */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un commerçant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5167fc] focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
            {filterButtons.map((btn) => (
              <button
                key={btn.value}
                onClick={() => setStatusFilter(btn.value)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                  statusFilter === btn.value
                    ? "bg-white text-[#5167fc] shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Liste des commerçants */}
      <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
        {filteredMerchants.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredMerchants.map((merchant) => (
              <Link
                key={merchant.id}
                href={`/admin/merchants/${merchant.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 font-bold text-white rounded-lg bg-[#5167fc]">
                    {merchant.shop_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{merchant.shop_name}</p>
                    {merchant.shop_address && (
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {merchant.shop_address}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                      <span>{merchant.phone}</span>
                      <span>·</span>
                      <span>{merchant._count?.customers || 0} client{(merchant._count?.customers || 0) > 1 ? 's' : ''}</span>
                      <span>·</span>
                      <span>Inscrit le {formatDate(merchant.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {getStatusBadge(merchant)}
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <Store className="w-12 h-12 mb-4 text-gray-300" />
            <p className="font-medium">Aucun commerçant trouvé</p>
            <p className="text-sm">Essayez de modifier vos filtres</p>
          </div>
        )}
      </div>
    </div>
  );
}
