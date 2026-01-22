'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Search,
  Download,
  Phone,
  Calendar,
  Gift,
  Loader2,
  SlidersHorizontal,
} from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { AdjustPointsModal } from '@/components/AdjustPointsModal';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import type { Merchant, LoyaltyCard, Customer } from '@/types';

interface CustomerWithCard extends LoyaltyCard {
  customer: Customer;
}

export default function CustomersPage() {
  const router = useRouter();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [customers, setCustomers] = useState<CustomerWithCard[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerWithCard[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithCard | null>(null);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/merchant');
      return;
    }

    const { data: merchantData } = await supabase
      .from('merchants')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!merchantData) return;
    setMerchant(merchantData);

    const { data: cardsData } = await supabase
      .from('loyalty_cards')
      .select(`
        *,
        customer:customers (*)
      `)
      .eq('merchant_id', merchantData.id)
      .order('updated_at', { ascending: false });

    if (cardsData) {
      setCustomers(cardsData as CustomerWithCard[]);
      setFilteredCustomers(cardsData as CustomerWithCard[]);
    }

    setLoading(false);
  };

  const handleOpenAdjustModal = (customer: CustomerWithCard) => {
    setSelectedCustomer(customer);
    setAdjustModalOpen(true);
  };

  const handleAdjustSuccess = () => {
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCustomers(customers);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = customers.filter((card) => {
      const name = `${card.customer?.first_name || ''} ${card.customer?.last_name || ''}`.toLowerCase();
      const phone = card.customer?.phone_number || '';
      return name.includes(query) || phone.includes(query);
    });

    setFilteredCustomers(filtered);
  }, [searchQuery, customers]);

  const exportCSV = async () => {
    setExporting(true);

    try {
      const headers = ['Prénom', 'Nom', 'Téléphone', 'Passages', 'Dernière visite', 'Date inscription'];
      const rows = customers.map((card) => [
        card.customer?.first_name || '',
        card.customer?.last_name || '',
        card.customer?.phone_number || '',
        card.current_stamps.toString(),
        card.last_visit_date ? formatDate(card.last_visit_date) : '',
        formatDate(card.created_at),
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `clients-${merchant?.slug}-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between px-1">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
            Gestion <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Clients</span>
          </h1>
          <p className="mt-2 text-base font-medium text-gray-500">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 mr-2 border border-indigo-100">
              {customers.length} total
            </span>
            {customers.length > 1 ? 'Clients inscrits' : 'Client inscrit'} sur la plateforme
          </p>
        </div>
        <Button
          variant="outline"
          onClick={exportCSV}
          loading={exporting}
          disabled={customers.length === 0}
          className="h-11 px-5 border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/50 text-gray-700 rounded-xl transition-all duration-200 shadow-sm"
        >
          <Download className="w-4 h-4 mr-2 text-indigo-600" />
          Exporter CSV
        </Button>
      </div>

      <div className="p-8 bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl shadow-indigo-100/50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-600 to-violet-600 opacity-80" />

        <div className="relative mb-8 max-w-md group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400 transition-all duration-300 group-focus-within:text-indigo-600 group-focus-within:scale-110" />
          </div>
          <Input
            type="text"
            placeholder="Rechercher par nom ou téléphone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 bg-white/50 border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-300 placeholder:text-gray-400"
          />
        </div>

        {filteredCustomers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-y border-gray-100 first:rounded-tl-xl first:border-l last:rounded-tr-xl last:border-r">
                    Client
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-y border-gray-100">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5" />
                      Téléphone
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-y border-gray-100">
                    <div className="flex items-center gap-2">
                      <Gift className="w-3.5 h-3.5" />
                      Progression
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-y border-gray-100">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      Dernière visite
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-y border-gray-100">
                    Inscription
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider border-y border-gray-100 first:border-l last:rounded-tr-xl last:border-r">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.map((card) => {
                  const isRewardReady = card.current_stamps >= (merchant?.stamps_required || 10);
                  const progress = Math.min((card.current_stamps / (merchant?.stamps_required || 10)) * 100, 100);

                  return (
                    <tr key={card.id} className="group hover:bg-indigo-50/30 transition-all duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <div className="relative flex items-center justify-center w-10 h-10 font-bold text-white rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-md shadow-indigo-100 group-hover:scale-105 transition-transform">
                            {card.customer?.first_name?.charAt(0) || 'C'}
                            {isRewardReady && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full animate-pulse" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {card.customer?.first_name} {card.customer?.last_name}
                            </p>
                            {isRewardReady && (
                              <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-100 rounded-md">
                                Prêt
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {card.customer?.phone_number}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 w-28 h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500 ease-out"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-gray-700 tabular-nums">
                            {card.current_stamps}/{merchant?.stamps_required}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {card.last_visit_date ? formatDate(card.last_visit_date) : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(card.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenAdjustModal(card)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-indigo-600 bg-white border border-indigo-100 rounded-xl hover:bg-indigo-600 hover:text-white hover:border-indigo-600 shadow-sm transition-all active:scale-95"
                        >
                          <SlidersHorizontal className="w-4 h-4" />
                          Gérer
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Users className="w-16 h-16 mb-4 text-gray-300" />
            {searchQuery ? (
              <>
                <p className="text-lg font-medium">Aucun résultat</p>
                <p className="text-sm">Essayez une autre recherche</p>
              </>
            ) : (
              <>
                <p className="text-lg font-medium">Aucun client pour le moment</p>
                <p className="text-sm">
                  Vos clients apparaîtront ici après leur premier scan
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {selectedCustomer && merchant && (
        <AdjustPointsModal
          isOpen={adjustModalOpen}
          onClose={() => {
            setAdjustModalOpen(false);
            setSelectedCustomer(null);
          }}
          customerName={`${selectedCustomer.customer?.first_name || ''} ${selectedCustomer.customer?.last_name || ''}`}
          customerId={selectedCustomer.customer_id}
          merchantId={merchant.id}
          loyaltyCardId={selectedCustomer.id}
          currentStamps={selectedCustomer.current_stamps}
          stampsRequired={merchant.stamps_required}
          onSuccess={handleAdjustSuccess}
        />
      )}
    </div>
  );
}
