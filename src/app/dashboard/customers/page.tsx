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
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="mt-1 text-gray-600">
            {customers.length} client{customers.length > 1 ? 's' : ''} inscrit{customers.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={exportCSV}
          loading={exporting}
          disabled={customers.length === 0}
        >
          <Download className="w-5 h-5 mr-2" />
          Exporter CSV
        </Button>
      </div>

      <div className="p-6 bg-white rounded-2xl shadow-sm">
        <div className="relative mb-6">
          <Search className="absolute w-5 h-5 text-gray-400 left-4 top-1/2 transform -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Rechercher par nom ou téléphone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12"
          />
        </div>

        {filteredCustomers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                    Client
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      Téléphone
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                    <div className="flex items-center gap-1">
                      <Gift className="w-4 h-4" />
                      Passages
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Dernière visite
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                    Inscription
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredCustomers.map((card) => {
                  const isRewardReady = card.current_stamps >= (merchant?.stamps_required || 10);
                  return (
                    <tr key={card.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 font-medium text-white rounded-full bg-primary">
                            {card.customer?.first_name?.charAt(0) || 'C'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {card.customer?.first_name} {card.customer?.last_name}
                            </p>
                            {isRewardReady && (
                              <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                                Récompense disponible
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-600">
                        {card.customer?.phone_number}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{
                                width: `${Math.min(
                                  (card.current_stamps / (merchant?.stamps_required || 10)) * 100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {card.current_stamps}/{merchant?.stamps_required}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-600">
                        {card.last_visit_date
                          ? formatDate(card.last_visit_date)
                          : '-'}
                      </td>
                      <td className="px-4 py-4 text-gray-600">
                        {formatDate(card.created_at)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() => handleOpenAdjustModal(card)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-colors"
                        >
                          <SlidersHorizontal className="w-4 h-4" />
                          Ajuster
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
