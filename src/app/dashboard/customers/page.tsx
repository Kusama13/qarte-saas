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
  Bell,
  BellOff,
  Plus,
  UserPlus,
  Trophy,
} from 'lucide-react';
import { Button, Input, Modal } from '@/components/ui';
import { CustomerManagementModal } from '@/components/dashboard/CustomerManagementModal';
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
  const [subscriberIds, setSubscriberIds] = useState<string[]>([]);
  const [filterPushOnly, setFilterPushOnly] = useState(false);
  const [tier1RedeemedCards, setTier1RedeemedCards] = useState<Set<string>>(new Set());

  // Create customer modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

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

      // Fetch tier 1 redemptions for tier2 merchants to show "Palier 1 utilisé"
      if (merchantData.tier2_enabled) {
        const cardIds = cardsData.map((c: CustomerWithCard) => c.id);
        const { data: redemptionsData } = await supabase
          .from('redemptions')
          .select('loyalty_card_id, tier, redeemed_at')
          .in('loyalty_card_id', cardIds)
          .order('redeemed_at', { ascending: false });

        if (redemptionsData) {
          // For each card, check if tier 1 was redeemed after last tier 2
          const tier1Redeemed = new Set<string>();
          const cardRedemptions = new Map<string, Array<{ tier: number; redeemed_at: string }>>();

          // Group redemptions by card
          redemptionsData.forEach((r: { loyalty_card_id: string; tier: number; redeemed_at: string }) => {
            if (!cardRedemptions.has(r.loyalty_card_id)) {
              cardRedemptions.set(r.loyalty_card_id, []);
            }
            cardRedemptions.get(r.loyalty_card_id)!.push({ tier: r.tier, redeemed_at: r.redeemed_at });
          });

          // Check each card
          cardRedemptions.forEach((redemptions, cardId) => {
            const tier2Redemptions = redemptions.filter(r => r.tier === 2);
            const lastTier2Date = tier2Redemptions.length > 0
              ? new Date(tier2Redemptions[0].redeemed_at).getTime()
              : 0;

            const tier1AfterTier2 = redemptions.some(
              r => r.tier === 1 && new Date(r.redeemed_at).getTime() > lastTier2Date
            );

            if (tier1AfterTier2) {
              tier1Redeemed.add(cardId);
            }
          });

          setTier1RedeemedCards(tier1Redeemed);
        }
      }
    }

    // Fetch push subscriber IDs
    try {
      const response = await fetch(`/api/push/subscribers?merchantId=${merchantData.id}`);
      const data = await response.json();
      if (response.ok && data.subscriberIds) {
        setSubscriberIds(data.subscriberIds);
      }
    } catch (err) {
      console.error('Error fetching subscriber IDs:', err);
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

  const handleCreateCustomer = async () => {
    if (!newFirstName.trim() || !newPhone.trim() || !merchant) return;

    setCreatingCustomer(true);
    setCreateError(null);

    try {
      const response = await fetch('/api/customers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: newFirstName.trim(),
          last_name: newLastName.trim() || null,
          phone_number: newPhone.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setCreateError(data.error || 'Erreur lors de la création');
        setCreatingCustomer(false);
        return;
      }

      // Close modal and refresh data
      setCreateModalOpen(false);
      setNewFirstName('');
      setNewLastName('');
      setNewPhone('');
      setCreateError(null);
      await fetchData();
    } catch (error) {
      console.error('Error:', error);
      setCreateError('Une erreur est survenue. Veuillez réessayer.');
    }
    setCreatingCustomer(false);
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  useEffect(() => {
    let filtered = customers;

    // Apply push filter
    if (filterPushOnly) {
      filtered = filtered.filter((card) => subscriberIds.includes(card.customer_id));
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((card) => {
        const name = `${card.customer?.first_name || ''} ${card.customer?.last_name || ''}`.toLowerCase();
        const phone = card.customer?.phone_number || '';
        return name.includes(query) || phone.includes(query);
      });
    }

    setFilteredCustomers(filtered);
  }, [searchQuery, customers, filterPushOnly, subscriberIds]);

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
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
            Gestion <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Clients</span>
          </h1>
          <p className="mt-2 text-base font-medium text-gray-500">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 mr-2 border border-indigo-100">
              {customers.length} total
            </span>
            {customers.length > 1 ? 'Clients inscrits' : 'Client inscrit'} sur la plateforme
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="h-11 px-5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl transition-all duration-200 shadow-lg shadow-indigo-200"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Nouveau client
          </Button>
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
      </div>

      <div className="p-8 bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl shadow-indigo-100/50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-600 to-violet-600 opacity-80" />

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md group">
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
          <button
            onClick={() => setFilterPushOnly(!filterPushOnly)}
            className={`inline-flex items-center gap-2 px-4 h-12 rounded-2xl border transition-all duration-200 font-medium ${
              filterPushOnly
                ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-200'
                : 'bg-white/50 text-gray-600 border-gray-200 hover:border-amber-300 hover:bg-amber-50'
            }`}
          >
            <Bell className={`w-4 h-4 ${filterPushOnly ? 'text-white' : 'text-amber-500'}`} />
            <span>Abonnés push</span>
            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
              filterPushOnly ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
            }`}>
              {subscriberIds.length}
            </span>
          </button>
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
                  const isTier1Ready = card.current_stamps >= (merchant?.stamps_required || 10);
                  const isTier2Ready = merchant?.tier2_enabled && merchant?.tier2_stamps_required && card.current_stamps >= merchant.tier2_stamps_required;
                  const progress = Math.min((card.current_stamps / (merchant?.stamps_required || 10)) * 100, 100);
                  const isPushSubscriber = subscriberIds.includes(card.customer_id);

                  // Determine badge to show
                  const getBadge = () => {
                    if (merchant?.tier2_enabled) {
                      if (isTier2Ready) {
                        return { text: 'Palier 2 prêt', color: 'text-violet-700 bg-violet-100' };
                      }
                      if (isTier1Ready) {
                        // Check if tier 1 was already redeemed in this cycle
                        if (tier1RedeemedCards.has(card.id)) {
                          return { text: 'Palier 1 utilisé', color: 'text-gray-500 bg-gray-100' };
                        }
                        return { text: 'Palier 1 prêt', color: 'text-emerald-700 bg-emerald-100' };
                      }
                    } else if (isTier1Ready) {
                      return { text: 'Récompense prête', color: 'text-green-700 bg-green-100' };
                    }
                    return null;
                  };
                  const badge = getBadge();

                  return (
                    <tr key={card.id} className="group hover:bg-indigo-50/30 transition-all duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <div className={`relative flex items-center justify-center w-10 h-10 font-bold text-white rounded-xl shadow-md group-hover:scale-105 transition-transform ${
                            isPushSubscriber
                              ? 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-100'
                              : 'bg-gradient-to-br from-indigo-600 to-violet-600 shadow-indigo-100'
                          }`}>
                            {card.customer?.first_name?.charAt(0) || 'C'}
                            {badge && (
                              <div className={`absolute -top-1 -right-1 w-3 h-3 border-2 border-white rounded-full animate-pulse ${isTier2Ready ? 'bg-violet-500' : 'bg-green-500'}`} />
                            )}
                            {isPushSubscriber && !badge && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow">
                                <Bell className="w-2.5 h-2.5 text-amber-500" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900">
                                {card.customer?.first_name} {card.customer?.last_name}
                              </p>
                              {isPushSubscriber && (
                                <Bell className="w-3.5 h-3.5 text-amber-500" />
                              )}
                            </div>
                            {badge && (
                              <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md ${badge.color}`}>
                                {badge.text}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {card.customer?.phone_number}
                      </td>
                      <td className="px-6 py-4">
                        {merchant?.tier2_enabled && merchant?.tier2_stamps_required ? (
                          /* Dual Tier Progress */
                          <div className="space-y-2">
                            {/* Tier 1 */}
                            <div className="flex items-center gap-2">
                              <Gift className={`w-3.5 h-3.5 shrink-0 ${card.current_stamps >= (merchant.stamps_required || 10) ? 'text-emerald-500' : 'text-indigo-400'}`} />
                              <div className="flex-1 w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ease-out ${
                                    card.current_stamps >= (merchant.stamps_required || 10)
                                      ? 'bg-emerald-500'
                                      : 'bg-gradient-to-r from-indigo-500 to-violet-500'
                                  }`}
                                  style={{ width: `${Math.min((card.current_stamps / (merchant.stamps_required || 10)) * 100, 100)}%` }}
                                />
                              </div>
                              <span className={`text-[10px] font-bold tabular-nums ${card.current_stamps >= (merchant.stamps_required || 10) ? 'text-emerald-600' : 'text-gray-500'}`}>
                                {Math.min(card.current_stamps, merchant.stamps_required || 10)}/{merchant.stamps_required}
                              </span>
                            </div>
                            {/* Tier 2 */}
                            <div className="flex items-center gap-2">
                              <Trophy className={`w-3.5 h-3.5 shrink-0 ${card.current_stamps >= (merchant.tier2_stamps_required || 20) ? 'text-violet-500' : 'text-gray-300'}`} />
                              <div className="flex-1 w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ease-out ${
                                    card.current_stamps >= (merchant.tier2_stamps_required || 20)
                                      ? 'bg-violet-500'
                                      : 'bg-gradient-to-r from-gray-300 to-gray-400'
                                  }`}
                                  style={{ width: `${Math.min((card.current_stamps / (merchant.tier2_stamps_required || 20)) * 100, 100)}%` }}
                                />
                              </div>
                              <span className={`text-[10px] font-bold tabular-nums ${card.current_stamps >= (merchant.tier2_stamps_required || 20) ? 'text-violet-600' : 'text-gray-400'}`}>
                                {card.current_stamps}/{merchant.tier2_stamps_required}
                              </span>
                            </div>
                          </div>
                        ) : (
                          /* Single Tier Progress */
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
                        )}
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
        <CustomerManagementModal
          isOpen={adjustModalOpen}
          onClose={() => {
            setAdjustModalOpen(false);
            setSelectedCustomer(null);
          }}
          customerName={`${selectedCustomer.customer?.first_name || ''} ${selectedCustomer.customer?.last_name || ''}`.trim()}
          customerId={selectedCustomer.customer_id}
          merchantId={merchant.id}
          loyaltyCardId={selectedCustomer.id}
          currentStamps={selectedCustomer.current_stamps}
          stampsRequired={merchant.stamps_required}
          phoneNumber={selectedCustomer.customer?.phone_number || ''}
          onSuccess={handleAdjustSuccess}
          tier2Enabled={merchant.tier2_enabled}
          tier2StampsRequired={merchant.tier2_stamps_required || undefined}
          tier2RewardDescription={merchant.tier2_reward_description || undefined}
          rewardDescription={merchant.reward_description || undefined}
        />
      )}

      {/* Create Customer Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setNewFirstName('');
          setNewLastName('');
          setNewPhone('');
          setCreateError(null);
        }}
        title="Nouveau client"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500 mb-4">
            Créez un nouveau client et sa carte de fidélité associée.
          </p>

          {createError && (
            <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
              {createError}
            </div>
          )}

          <Input
            label="Prénom"
            placeholder="Jean"
            value={newFirstName}
            onChange={(e) => setNewFirstName(e.target.value)}
          />
          <Input
            label="Nom"
            placeholder="Dupont"
            value={newLastName}
            onChange={(e) => setNewLastName(e.target.value)}
          />
          <Input
            label="Téléphone"
            placeholder="06 12 34 56 78"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
          />
          <Button
            onClick={handleCreateCustomer}
            disabled={!newFirstName.trim() || !newPhone.trim() || creatingCustomer}
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white"
          >
            {creatingCustomer ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <UserPlus className="w-4 h-4 mr-2" />
            )}
            Créer le client
          </Button>
        </div>
      </Modal>
    </div>
  );
}
