'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Crown,
  Search,
  Plus,
  Loader2,
  Calendar,
  Gift,
  UserPlus,
  Clock,
  MoreVertical,
  Trash2,
  RefreshCw,
  Eye,
  Download,
  CheckCircle2,
  XCircle,
  Phone,
} from 'lucide-react';
import { Button, Input, Modal, Select } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import type { Merchant, MemberCard, Customer } from '@/types';

interface CustomerWithCard {
  id: string;
  customer_id: string;
  customer: Customer;
  current_stamps: number;
}

const DURATION_OPTIONS = [
  { value: '1', label: '1 mois' },
  { value: '3', label: '3 mois' },
  { value: '6', label: '6 mois' },
  { value: '12', label: '1 an' },
];

export default function MembersPage() {
  const router = useRouter();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [memberCards, setMemberCards] = useState<MemberCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<MemberCard | null>(null);

  // Create modal states
  const [customers, setCustomers] = useState<CustomerWithCard[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithCard | null>(null);
  const [benefitLabel, setBenefitLabel] = useState('');
  const [duration, setDuration] = useState('3');
  const [creating, setCreating] = useState(false);

  // New customer creation
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerFirstName, setNewCustomerFirstName] = useState('');
  const [newCustomerLastName, setNewCustomerLastName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  // Extend modal states
  const [extendDuration, setExtendDuration] = useState('3');
  const [extending, setExtending] = useState(false);

  // Delete modal states
  const [deleting, setDeleting] = useState(false);

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

    // Fetch member cards
    const response = await fetch(`/api/member-cards?merchant_id=${merchantData.id}`);
    const data = await response.json();
    if (response.ok && data.memberCards) {
      setMemberCards(data.memberCards);
    }

    // Fetch customers for the create modal
    const { data: cardsData } = await supabase
      .from('loyalty_cards')
      .select(`
        id,
        customer_id,
        current_stamps,
        customer:customers (*)
      `)
      .eq('merchant_id', merchantData.id)
      .order('updated_at', { ascending: false });

    if (cardsData) {
      // Transform the data to match CustomerWithCard type
      const transformed = cardsData.map((card: { id: string; customer_id: string; current_stamps: number; customer: Customer | Customer[] }) => ({
        ...card,
        customer: Array.isArray(card.customer) ? card.customer[0] : card.customer,
      })) as CustomerWithCard[];
      setCustomers(transformed);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  const filteredMemberCards = memberCards.filter((card) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const name = `${card.customer?.first_name || ''} ${card.customer?.last_name || ''}`.toLowerCase();
    const phone = card.customer?.phone_number || '';
    return name.includes(query) || phone.includes(query);
  });

  const filteredCustomers = customers.filter((c) => {
    // Exclude customers who already have a member card
    const hasMemberCard = memberCards.some((mc) => mc.customer_id === c.customer_id);
    if (hasMemberCard) return false;

    if (!customerSearch.trim()) return true;
    const query = customerSearch.toLowerCase();
    const name = `${c.customer?.first_name || ''} ${c.customer?.last_name || ''}`.toLowerCase();
    const phone = c.customer?.phone_number || '';
    return name.includes(query) || phone.includes(query);
  });

  const activeCards = filteredMemberCards.filter((card) => new Date(card.valid_until) > new Date());
  const expiredCards = filteredMemberCards.filter((card) => new Date(card.valid_until) <= new Date());

  const handleCreateNewCustomer = async () => {
    if (!merchant || !newCustomerFirstName.trim() || !newCustomerPhone.trim()) return;

    setCreatingCustomer(true);
    try {
      const response = await fetch('/api/customers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: newCustomerPhone.trim(),
          first_name: newCustomerFirstName.trim(),
          last_name: newCustomerLastName.trim() || null,
          merchant_id: merchant.id,
        }),
      });

      const data = await response.json();
      if (response.ok && data.customer) {
        // Create a loyalty card for the new customer
        const { data: newCard } = await supabase
          .from('loyalty_cards')
          .insert({
            merchant_id: merchant.id,
            customer_id: data.customer.id,
            current_stamps: 0,
            stamps_target: merchant.stamps_required,
          })
          .select(`
            id,
            customer_id,
            current_stamps,
            customer:customers (*)
          `)
          .single();

        if (newCard) {
          const transformedCard: CustomerWithCard = {
            ...newCard,
            customer: Array.isArray(newCard.customer) ? newCard.customer[0] : newCard.customer,
          };
          setCustomers([transformedCard, ...customers]);
          setSelectedCustomer(transformedCard);
          setShowNewCustomerForm(false);
          setNewCustomerFirstName('');
          setNewCustomerLastName('');
          setNewCustomerPhone('');
        }
      }
    } catch (error) {
      console.error('Error creating customer:', error);
    } finally {
      setCreatingCustomer(false);
    }
  };

  const handleCreateMemberCard = async () => {
    if (!merchant || !selectedCustomer || !benefitLabel.trim()) return;

    setCreating(true);
    try {
      const response = await fetch('/api/member-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant_id: merchant.id,
          customer_id: selectedCustomer.customer_id,
          benefit_label: benefitLabel.trim(),
          duration_months: parseInt(duration),
        }),
      });

      const data = await response.json();
      if (response.ok && data.memberCard) {
        setMemberCards([data.memberCard, ...memberCards]);
        setCreateModalOpen(false);
        resetCreateForm();
      }
    } catch (error) {
      console.error('Error creating member card:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleExtendMemberCard = async () => {
    if (!selectedCard) return;

    setExtending(true);
    try {
      const response = await fetch(`/api/member-cards/${selectedCard.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration_months: parseInt(extendDuration),
        }),
      });

      const data = await response.json();
      if (response.ok && data.memberCard) {
        setMemberCards(memberCards.map((mc) =>
          mc.id === data.memberCard.id ? data.memberCard : mc
        ));
        setExtendModalOpen(false);
        setSelectedCard(null);
      }
    } catch (error) {
      console.error('Error extending member card:', error);
    } finally {
      setExtending(false);
    }
  };

  const handleDeleteMemberCard = async () => {
    if (!selectedCard) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/member-cards/${selectedCard.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMemberCards(memberCards.filter((mc) => mc.id !== selectedCard.id));
        setDeleteModalOpen(false);
        setSelectedCard(null);
      }
    } catch (error) {
      console.error('Error deleting member card:', error);
    } finally {
      setDeleting(false);
    }
  };

  const resetCreateForm = () => {
    setSelectedCustomer(null);
    setCustomerSearch('');
    setBenefitLabel('');
    setDuration('3');
    setShowNewCustomerForm(false);
    setNewCustomerFirstName('');
    setNewCustomerLastName('');
    setNewCustomerPhone('');
  };

  const isCardValid = (card: MemberCard) => new Date(card.valid_until) > new Date();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between px-1">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
            Cartes <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">Membre</span>
          </h1>
          <p className="mt-2 text-base font-medium text-gray-500">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 mr-2 border border-amber-100">
              {activeCards.length} actives
            </span>
            Offrez des avantages exclusifs à vos meilleurs clients
          </p>
        </div>
        <Button
          onClick={() => setCreateModalOpen(true)}
          className="h-11 px-5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl transition-all duration-200 shadow-lg shadow-amber-200/50"
        >
          <Plus className="w-4 h-4 mr-2" />
          Créer une carte
        </Button>
      </div>

      {/* Main Content */}
      <div className="p-8 bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl shadow-amber-100/30 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500 opacity-80" />

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-gray-400 transition-all duration-300 group-focus-within:text-amber-500 group-focus-within:scale-110" />
            </div>
            <Input
              type="text"
              placeholder="Rechercher un membre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-white/50 border-gray-100 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all duration-300 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Active Cards */}
        {activeCards.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Cartes actives ({activeCards.length})
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeCards.map((card) => (
                <MemberCardItem
                  key={card.id}
                  card={card}
                  onExtend={() => {
                    setSelectedCard(card);
                    setExtendModalOpen(true);
                  }}
                  onDelete={() => {
                    setSelectedCard(card);
                    setDeleteModalOpen(true);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Expired Cards */}
        {expiredCards.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-500 mb-4 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-gray-400" />
              Cartes expirées ({expiredCards.length})
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 opacity-60">
              {expiredCards.map((card) => (
                <MemberCardItem
                  key={card.id}
                  card={card}
                  onExtend={() => {
                    setSelectedCard(card);
                    setExtendModalOpen(true);
                  }}
                  onDelete={() => {
                    setSelectedCard(card);
                    setDeleteModalOpen(true);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {memberCards.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-4">
              <Crown className="w-10 h-10 text-amber-400" />
            </div>
            <p className="text-lg font-medium text-gray-900 mb-2">Aucune carte membre</p>
            <p className="text-sm text-gray-500 mb-6 text-center max-w-md">
              Créez des cartes membre pour offrir des avantages exclusifs à vos meilleurs clients
            </p>
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer ma première carte
            </Button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          resetCreateForm();
        }}
        title="Créer une carte membre"
      >
        <div className="space-y-6">
          {!selectedCustomer ? (
            <>
              {/* Customer Selection */}
              {!showNewCustomerForm ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sélectionner un client
                    </label>
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Rechercher par nom ou téléphone..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl divide-y">
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.slice(0, 10).map((c) => (
                          <button
                            key={c.id}
                            onClick={() => setSelectedCustomer(c)}
                            className="w-full px-4 py-3 text-left hover:bg-amber-50 transition-colors flex items-center gap-3"
                          >
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
                              {c.customer?.first_name?.charAt(0) || 'C'}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {c.customer?.first_name} {c.customer?.last_name}
                              </p>
                              <p className="text-sm text-gray-500">{c.customer?.phone_number}</p>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-6 text-center text-gray-500">
                          <p className="text-sm">Aucun client trouvé</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-center">
                    <button
                      onClick={() => setShowNewCustomerForm(true)}
                      className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium text-sm"
                    >
                      <UserPlus className="w-4 h-4" />
                      Créer un nouveau client
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* New Customer Form */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">Nouveau client</h3>
                      <button
                        onClick={() => setShowNewCustomerForm(false)}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        Annuler
                      </button>
                    </div>
                    <Input
                      placeholder="Prénom *"
                      value={newCustomerFirstName}
                      onChange={(e) => setNewCustomerFirstName(e.target.value)}
                    />
                    <Input
                      placeholder="Nom (optionnel)"
                      value={newCustomerLastName}
                      onChange={(e) => setNewCustomerLastName(e.target.value)}
                    />
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Téléphone *"
                        value={newCustomerPhone}
                        onChange={(e) => setNewCustomerPhone(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button
                      onClick={handleCreateNewCustomer}
                      loading={creatingCustomer}
                      disabled={!newCustomerFirstName.trim() || !newCustomerPhone.trim()}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                    >
                      Créer et continuer
                    </Button>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              {/* Selected Customer + Benefit Form */}
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {selectedCustomer.customer?.first_name?.charAt(0) || 'C'}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {selectedCustomer.customer?.first_name} {selectedCustomer.customer?.last_name}
                  </p>
                  <p className="text-sm text-gray-600">{selectedCustomer.customer?.phone_number}</p>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                >
                  Changer
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Avantage membre *
                </label>
                <Input
                  placeholder="Ex: -10% sur tout, Café offert, etc."
                  value={benefitLabel}
                  onChange={(e) => setBenefitLabel(e.target.value)}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Cet avantage sera affiché sur la carte membre du client
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durée de validité
                </label>
                <Select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  options={DURATION_OPTIONS}
                />
              </div>

              <Button
                onClick={handleCreateMemberCard}
                loading={creating}
                disabled={!benefitLabel.trim()}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                <Crown className="w-4 h-4 mr-2" />
                Créer la carte membre
              </Button>
            </>
          )}
        </div>
      </Modal>

      {/* Extend Modal */}
      <Modal
        isOpen={extendModalOpen}
        onClose={() => {
          setExtendModalOpen(false);
          setSelectedCard(null);
        }}
        title="Prolonger la carte membre"
      >
        {selectedCard && (
          <div className="space-y-6">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="font-medium text-gray-900">
                {selectedCard.customer?.first_name} {selectedCard.customer?.last_name}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Expire le {formatDate(selectedCard.valid_until)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prolonger de
              </label>
              <Select
                value={extendDuration}
                onChange={(e) => setExtendDuration(e.target.value)}
                options={DURATION_OPTIONS}
              />
            </div>

            <Button
              onClick={handleExtendMemberCard}
              loading={extending}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Prolonger
            </Button>
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedCard(null);
        }}
        title="Supprimer la carte membre"
      >
        {selectedCard && (
          <div className="space-y-6">
            <p className="text-gray-600">
              Êtes-vous sûr de vouloir supprimer la carte membre de{' '}
              <span className="font-semibold text-gray-900">
                {selectedCard.customer?.first_name} {selectedCard.customer?.last_name}
              </span>
              ?
            </p>
            <p className="text-sm text-gray-500">
              Cette action est irréversible.
            </p>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setSelectedCard(null);
                }}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleDeleteMemberCard}
                loading={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// Member Card Item Component - Premium VIP Design
function MemberCardItem({
  card,
  onExtend,
  onDelete,
}: {
  card: MemberCard;
  onExtend: () => void;
  onDelete: () => void;
}) {
  const isValid = new Date(card.valid_until) > new Date();
  const daysRemaining = Math.ceil(
    (new Date(card.valid_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className={`group relative p-6 rounded-[24px] transition-all duration-500 overflow-hidden border ${
      isValid
        ? 'bg-white border-amber-100 shadow-[0_8px_30px_rgb(251,191,36,0.06)] hover:shadow-[0_20px_50px_rgb(251,191,36,0.15)] hover:-translate-y-1'
        : 'bg-gray-50 border-gray-200 opacity-80'
    }`}>
      {/* Premium Shine Animation */}
      {isValid && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 group-hover:animate-shimmer" />
        </div>
      )}

      {/* VIP Crown Badge */}
      <div className="absolute -top-1 -right-1">
        <div className={`relative px-4 py-1.5 rounded-bl-2xl rounded-tr-[24px] ${
          isValid
            ? 'bg-gradient-to-r from-amber-400 to-amber-500 shadow-lg shadow-amber-200/50'
            : 'bg-gray-300'
        }`}>
          <Crown className={`w-4 h-4 ${isValid ? 'text-white' : 'text-gray-500'}`} />
          {isValid && (
            <div className="absolute inset-0 bg-gradient-to-t from-amber-600/20 to-transparent rounded-bl-2xl rounded-tr-[24px]" />
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4 ${
        isValid
          ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100'
          : 'bg-gray-100 text-gray-500'
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${isValid ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
        {isValid ? 'Membre VIP' : 'Expiré'}
      </div>

      {/* Customer Info */}
      <div className="flex items-center gap-4 mb-5">
        <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold shadow-lg ${
          isValid
            ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 text-white shadow-amber-200/50'
            : 'bg-gray-300 text-gray-500'
        }`}>
          {card.customer?.first_name?.charAt(0) || 'C'}
          {isValid && (
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/10 to-transparent" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-lg truncate">
            {card.customer?.first_name} {card.customer?.last_name}
          </p>
          <p className="text-sm text-gray-500 font-medium">{card.customer?.phone_number}</p>
        </div>
      </div>

      {/* Benefit Card */}
      <div className={`relative p-4 rounded-2xl mb-5 overflow-hidden ${
        isValid
          ? 'bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 ring-1 ring-amber-100/50'
          : 'bg-gray-100 ring-1 ring-gray-200'
      }`}>
        {isValid && (
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-amber-200/30 to-transparent rounded-bl-full" />
        )}
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Gift className={`w-4 h-4 ${isValid ? 'text-amber-500' : 'text-gray-400'}`} />
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Avantage exclusif</p>
          </div>
          <p className={`font-bold text-lg ${isValid ? 'text-amber-700' : 'text-gray-500'}`}>
            {card.benefit_label}
          </p>
        </div>
      </div>

      {/* Validity */}
      <div className="flex items-center justify-between mb-5 px-1">
        <div className="flex items-center gap-2 text-gray-500">
          <Calendar className="w-4 h-4" />
          <span className="text-sm font-medium">Jusqu&apos;au {formatDate(card.valid_until)}</span>
        </div>
        {isValid && daysRemaining <= 7 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
            <Clock className="w-3 h-3" />
            {daysRemaining}j
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-gray-100">
        <a
          href={`/api/member-cards/${card.id}/image`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-600 bg-gray-50 rounded-xl hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 group/btn"
        >
          <Download className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
          Image
        </a>
        <button
          onClick={onExtend}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-amber-700 bg-amber-50 rounded-xl hover:bg-amber-100 hover:shadow-md hover:shadow-amber-100/50 transition-all duration-200 group/btn"
        >
          <RefreshCw className="w-4 h-4 group-hover/btn:rotate-180 transition-transform duration-500" />
          Prolonger
        </button>
        <button
          onClick={onDelete}
          className="px-4 py-2.5 text-sm font-semibold text-red-500 bg-red-50 rounded-xl hover:bg-red-100 hover:text-red-600 transition-all duration-200 group/btn"
        >
          <Trash2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
        </button>
      </div>
    </div>
  );
}
