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
  Trash2,
  RefreshCw,
  ChevronRight,
  Users,
  Settings,
  ArrowLeft,
  Phone,
  X,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Input, Modal, Select } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import type { Merchant, MemberProgram, MemberCard, Customer } from '@/types';

interface ProgramWithCount extends MemberProgram {
  member_cards: { count: number }[];
}

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
  { value: '24', label: '2 ans' },
];

export default function MembersPage() {
  const router = useRouter();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [programs, setPrograms] = useState<ProgramWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected program view
  const [selectedProgram, setSelectedProgram] = useState<ProgramWithCount | null>(null);
  const [programMembers, setProgramMembers] = useState<MemberCard[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Create program modal
  const [createProgramOpen, setCreateProgramOpen] = useState(false);
  const [programName, setProgramName] = useState('');
  const [programBenefit, setProgramBenefit] = useState('');
  const [programDuration, setProgramDuration] = useState('12');
  const [creatingProgram, setCreatingProgram] = useState(false);

  // Assign customer modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [customers, setCustomers] = useState<CustomerWithCard[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithCard | null>(null);
  const [assigning, setAssigning] = useState(false);

  // New customer creation within assign modal
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerFirstName, setNewCustomerFirstName] = useState('');
  const [newCustomerLastName, setNewCustomerLastName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  // Extend modal
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberCard | null>(null);
  const [extendDuration, setExtendDuration] = useState('3');
  const [extending, setExtending] = useState(false);

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Delete program modal
  const [deleteProgramModalOpen, setDeleteProgramModalOpen] = useState(false);
  const [deletingProgram, setDeletingProgram] = useState(false);

  const fetchPrograms = async () => {
    const response = await fetch('/api/member-programs');
    const data = await response.json();
    if (response.ok && data.programs) {
      setPrograms(data.programs);
    }
    setLoading(false);
  };

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

    await fetchPrograms();

    // Fetch customers for assign modal
    const { data: cardsData } = await supabase
      .from('loyalty_cards')
      .select(`
        id,
        customer_id,
        current_stamps,
        customer:customers (*)
      `)
      .eq('merchant_id', merchantData.id)
      .order('created_at', { ascending: false });

    if (cardsData) {
      const transformed = cardsData.map((card) => ({
        ...card,
        customer: Array.isArray(card.customer) ? card.customer[0] : card.customer,
      })) as CustomerWithCard[];
      setCustomers(transformed);
    }
  };

  const fetchProgramMembers = async (programId: string) => {
    setLoadingMembers(true);
    const response = await fetch(`/api/member-cards?program_id=${programId}`);
    const data = await response.json();
    if (response.ok && data.memberCards) {
      const transformed = data.memberCards.map((card: { customer: Customer | Customer[] }) => ({
        ...card,
        customer: Array.isArray(card.customer) ? card.customer[0] : card.customer,
      }));
      setProgramMembers(transformed);
    }
    setLoadingMembers(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedProgram) {
      fetchProgramMembers(selectedProgram.id);
    }
  }, [selectedProgram]);

  // Create program
  const handleCreateProgram = async () => {
    if (!programName.trim() || !programBenefit.trim()) return;

    setCreatingProgram(true);
    try {
      const response = await fetch('/api/member-programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: programName.trim(),
          benefit_label: programBenefit.trim(),
          duration_months: parseInt(programDuration),
        }),
      });

      if (response.ok) {
        setCreateProgramOpen(false);
        setProgramName('');
        setProgramBenefit('');
        setProgramDuration('12');
        await fetchPrograms();
      }
    } catch (error) {
      console.error('Error creating program:', error);
    }
    setCreatingProgram(false);
  };

  // Create new customer and assign
  const handleCreateCustomer = async () => {
    if (!newCustomerFirstName.trim() || !newCustomerPhone.trim() || !merchant) return;

    setCreatingCustomer(true);
    try {
      // Create customer
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          first_name: newCustomerFirstName.trim(),
          last_name: newCustomerLastName.trim() || null,
          phone_number: newCustomerPhone.trim(),
        })
        .select()
        .single();

      if (customerError || !newCustomer) {
        console.error('Error creating customer:', customerError);
        setCreatingCustomer(false);
        return;
      }

      // Create loyalty card for this customer
      const { data: newCard, error: cardError } = await supabase
        .from('loyalty_cards')
        .insert({
          customer_id: newCustomer.id,
          merchant_id: merchant.id,
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

      if (cardError || !newCard) {
        console.error('Error creating loyalty card:', cardError);
        setCreatingCustomer(false);
        return;
      }

      // Transform and select the new customer
      const transformedCard = {
        ...newCard,
        customer: Array.isArray(newCard.customer) ? newCard.customer[0] : newCard.customer,
      } as CustomerWithCard;

      setCustomers(prev => [transformedCard, ...prev]);
      setSelectedCustomer(transformedCard);
      setShowNewCustomerForm(false);
      setNewCustomerFirstName('');
      setNewCustomerLastName('');
      setNewCustomerPhone('');
    } catch (error) {
      console.error('Error:', error);
    }
    setCreatingCustomer(false);
  };

  // Assign customer to program
  const handleAssignCustomer = async () => {
    if (!selectedCustomer || !selectedProgram) return;

    setAssigning(true);
    try {
      const response = await fetch('/api/member-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_id: selectedProgram.id,
          customer_id: selectedCustomer.customer.id,
        }),
      });

      if (response.ok) {
        setAssignModalOpen(false);
        setSelectedCustomer(null);
        setCustomerSearch('');
        await fetchProgramMembers(selectedProgram.id);
        await fetchPrograms(); // Update counts
      } else {
        const data = await response.json();
        alert(data.error || 'Erreur lors de l\'assignation');
      }
    } catch (error) {
      console.error('Error assigning customer:', error);
    }
    setAssigning(false);
  };

  // Extend membership
  const handleExtendMember = async () => {
    if (!selectedMember) return;

    setExtending(true);
    try {
      const response = await fetch(`/api/member-cards/${selectedMember.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration_months: parseInt(extendDuration) }),
      });

      if (response.ok && selectedProgram) {
        setExtendModalOpen(false);
        setSelectedMember(null);
        await fetchProgramMembers(selectedProgram.id);
      }
    } catch (error) {
      console.error('Error extending membership:', error);
    }
    setExtending(false);
  };

  // Remove member from program
  const handleRemoveMember = async () => {
    if (!selectedMember) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/member-cards/${selectedMember.id}`, {
        method: 'DELETE',
      });

      if (response.ok && selectedProgram) {
        setDeleteModalOpen(false);
        setSelectedMember(null);
        await fetchProgramMembers(selectedProgram.id);
        await fetchPrograms(); // Update counts
      }
    } catch (error) {
      console.error('Error removing member:', error);
    }
    setDeleting(false);
  };

  // Delete program
  const handleDeleteProgram = async () => {
    if (!selectedProgram) return;

    setDeletingProgram(true);
    try {
      const response = await fetch(`/api/member-programs/${selectedProgram.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDeleteProgramModalOpen(false);
        setSelectedProgram(null);
        setProgramMembers([]);
        await fetchPrograms();
      }
    } catch (error) {
      console.error('Error deleting program:', error);
    }
    setDeletingProgram(false);
  };

  // Filter customers for search
  const filteredCustomers = customers.filter((c) => {
    const search = customerSearch.toLowerCase();
    return (
      c.customer?.first_name?.toLowerCase().includes(search) ||
      c.customer?.last_name?.toLowerCase().includes(search) ||
      c.customer?.phone_number?.includes(search)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  // Program detail view
  if (selectedProgram) {
    const memberCount = programMembers.length;
    const activeMembers = programMembers.filter(m => new Date(m.valid_until) > new Date()).length;

    return (
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => {
              setSelectedProgram(null);
              setProgramMembers([]);
            }}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux programmes
          </button>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-gray-900">{selectedProgram.name}</h1>
                  <p className="text-amber-600 font-semibold">{selectedProgram.benefit_label}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  {memberCount} membre{memberCount > 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  Durée: {selectedProgram.duration_months} mois
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setAssignModalOpen(true)}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Ajouter un membre
              </Button>
              <Button
                variant="outline"
                onClick={() => setDeleteProgramModalOpen(true)}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Membres actifs</p>
            <p className="text-3xl font-black text-emerald-600">{activeMembers}</p>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Membres expirés</p>
            <p className="text-3xl font-black text-gray-400">{memberCount - activeMembers}</p>
          </div>
        </div>

        {/* Members list */}
        {loadingMembers ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          </div>
        ) : programMembers.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-50 flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-amber-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Aucun membre</h3>
            <p className="text-gray-500 mb-6">Commencez par ajouter des clients à ce programme</p>
            <Button
              onClick={() => setAssignModalOpen(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Ajouter un membre
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {programMembers.map((member) => (
              <MemberItem
                key={member.id}
                member={member}
                onExtend={() => {
                  setSelectedMember(member);
                  setExtendModalOpen(true);
                }}
                onRemove={() => {
                  setSelectedMember(member);
                  setDeleteModalOpen(true);
                }}
              />
            ))}
          </div>
        )}

        {/* Assign Modal */}
        <Modal
          isOpen={assignModalOpen}
          onClose={() => {
            setAssignModalOpen(false);
            setSelectedCustomer(null);
            setCustomerSearch('');
            setShowNewCustomerForm(false);
          }}
          title="Ajouter un membre"
        >
          <div className="space-y-4">
            {!showNewCustomerForm ? (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher un client..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2">
                  {filteredCustomers.slice(0, 10).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCustomer(c)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                        selectedCustomer?.id === c.id
                          ? 'bg-amber-50 border-2 border-amber-300'
                          : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold">
                        {c.customer?.first_name?.charAt(0) || '?'}
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-semibold text-gray-900">
                          {c.customer?.first_name} {c.customer?.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{c.customer?.phone_number}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowNewCustomerForm(true)}
                  className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-amber-300 hover:text-amber-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Créer un nouveau client
                </button>

                <Button
                  onClick={handleAssignCustomer}
                  disabled={!selectedCustomer || assigning}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                >
                  {assigning ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <UserPlus className="w-4 h-4 mr-2" />
                  )}
                  Ajouter au programme
                </Button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowNewCustomerForm(false)}
                  className="flex items-center gap-2 text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour à la liste
                </button>

                <Input
                  placeholder="Prénom *"
                  value={newCustomerFirstName}
                  onChange={(e) => setNewCustomerFirstName(e.target.value)}
                />
                <Input
                  placeholder="Nom"
                  value={newCustomerLastName}
                  onChange={(e) => setNewCustomerLastName(e.target.value)}
                />
                <Input
                  placeholder="Téléphone *"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                />

                <Button
                  onClick={handleCreateCustomer}
                  disabled={!newCustomerFirstName.trim() || !newCustomerPhone.trim() || creatingCustomer}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                >
                  {creatingCustomer ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Créer et sélectionner
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
            setSelectedMember(null);
          }}
          title="Prolonger l'adhésion"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Prolonger l&apos;adhésion de{' '}
              <strong>
                {selectedMember?.customer?.first_name} {selectedMember?.customer?.last_name}
              </strong>
            </p>
            <Select
              value={extendDuration}
              onChange={(e) => setExtendDuration(e.target.value)}
              options={DURATION_OPTIONS}
              label="Durée de prolongation"
            />
            <Button
              onClick={handleExtendMember}
              disabled={extending}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
            >
              {extending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Prolonger
            </Button>
          </div>
        </Modal>

        {/* Delete Member Modal */}
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setSelectedMember(null);
          }}
          title="Retirer du programme"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Êtes-vous sûr de vouloir retirer{' '}
              <strong>
                {selectedMember?.customer?.first_name} {selectedMember?.customer?.last_name}
              </strong>{' '}
              de ce programme ?
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleRemoveMember}
                disabled={deleting}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Retirer
              </Button>
            </div>
          </div>
        </Modal>

        {/* Delete Program Modal */}
        <Modal
          isOpen={deleteProgramModalOpen}
          onClose={() => setDeleteProgramModalOpen(false)}
          title="Supprimer le programme"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Êtes-vous sûr de vouloir supprimer le programme{' '}
              <strong>{selectedProgram?.name}</strong> ?
            </p>
            <p className="text-sm text-red-600">
              Tous les membres seront automatiquement retirés du programme.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteProgramModalOpen(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleDeleteProgram}
                disabled={deletingProgram}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              >
                {deletingProgram ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Supprimer
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  // Programs list view
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Programmes Membres</h1>
          <p className="text-gray-500">Créez des programmes VIP et assignez-les à vos clients</p>
        </div>
        <Button
          onClick={() => setCreateProgramOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouveau programme
        </Button>
      </div>

      {/* Programs grid */}
      {programs.length === 0 ? (
        <div className="relative overflow-hidden text-center py-20 bg-gradient-to-b from-white to-amber-50/40 rounded-[2rem] border border-amber-100/60 shadow-xl shadow-amber-900/5">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent opacity-50" />

          <div className="relative mx-auto mb-10 group inline-block">
            <div className="absolute inset-0 bg-amber-400 opacity-20 blur-3xl rounded-full animate-pulse group-hover:opacity-30 transition-opacity" />
            <div className="relative w-24 h-24 rounded-[2rem] bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 p-1 shadow-[0_10px_40px_-10px_rgba(245,158,11,0.5)] rotate-3 group-hover:rotate-0 transition-transform duration-700 ease-out">
              <div className="w-full h-full rounded-[1.75rem] bg-white flex items-center justify-center overflow-hidden">
                <Crown className="w-12 h-12 text-amber-500 drop-shadow-sm group-hover:scale-110 transition-transform duration-500" />
              </div>
            </div>
            <Sparkles className="absolute -top-2 -right-4 w-8 h-8 text-amber-400 animate-pulse" />
            <Sparkles className="absolute -bottom-2 -left-4 w-6 h-6 text-amber-300 opacity-60 animate-bounce" />
          </div>

          <div className="relative z-10 px-8">
            <h3 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">
              Inaugurez votre <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600">Expérience Elite</span>
            </h3>
            <p className="text-gray-500 mb-10 max-w-md mx-auto text-lg leading-relaxed">
              Transformez vos clients fidèles en membres privilégiés. Commencez par créer votre premier programme d&apos;exception.
            </p>
            <Button
              onClick={() => setCreateProgramOpen(true)}
              className="relative h-14 px-10 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl shadow-lg shadow-amber-500/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer" />
              <Plus className="w-5 h-5 mr-3 group-hover:rotate-90 transition-transform duration-500" />
              Démarrez maintenant
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {programs.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              onClick={() => setSelectedProgram(program)}
            />
          ))}
        </div>
      )}

      {/* Create Program Modal */}
      <Modal
        isOpen={createProgramOpen}
        onClose={() => {
          setCreateProgramOpen(false);
          setProgramName('');
          setProgramBenefit('');
          setProgramDuration('12');
        }}
        title="Nouveau programme membre"
      >
        <div className="space-y-4">
          <Input
            label="Nom du programme"
            placeholder="Ex: VIP Gold, Premium, Fidèle..."
            value={programName}
            onChange={(e) => setProgramName(e.target.value)}
          />
          <Input
            label="Avantage"
            placeholder="Ex: -10% sur tout, Café offert..."
            value={programBenefit}
            onChange={(e) => setProgramBenefit(e.target.value)}
          />
          <Select
            label="Durée de l'adhésion"
            value={programDuration}
            onChange={(e) => setProgramDuration(e.target.value)}
            options={DURATION_OPTIONS}
          />
          <Button
            onClick={handleCreateProgram}
            disabled={!programName.trim() || !programBenefit.trim() || creatingProgram}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white"
          >
            {creatingProgram ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Créer le programme
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// Program Card Component - Premium VIP Design
function ProgramCard({
  program,
  onClick,
}: {
  program: ProgramWithCount;
  onClick: () => void;
}) {
  const memberCount = program.member_cards?.[0]?.count || 0;

  return (
    <motion.button
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group relative overflow-hidden p-6 bg-white/70 backdrop-blur-xl rounded-2xl border border-amber-100 shadow-md hover:shadow-2xl hover:shadow-amber-200/30 hover:border-amber-400 transition-all text-left w-full"
    >
      {/* Golden Shine & Glass Effects */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl group-hover:bg-amber-400/20 transition-colors duration-500" />

      {/* Decorative Particles */}
      <div className="absolute top-4 left-1/4 w-1 h-1 bg-amber-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      <div className="absolute bottom-6 right-1/3 w-1.5 h-1.5 bg-amber-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

      <div className="relative flex items-center gap-5">
        <div className="relative shrink-0">
          {/* Prestigious Crown Badge */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-[0_8px_16px_-4px_rgba(245,158,11,0.5)] group-hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all duration-500">
            <Crown className="w-8 h-8 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]" />
          </div>
          <div className="absolute -inset-1 border border-amber-200/50 rounded-[1.25rem] scale-100 group-hover:scale-110 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <h3 className="text-xl font-extrabold text-gray-900 tracking-tight group-hover:text-amber-900 transition-colors">
              {program.name}
            </h3>
            <ChevronRight className="w-5 h-5 text-amber-300 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
          </div>

          <div className="inline-flex px-2 py-0.5 rounded bg-amber-50 border border-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-widest mb-3">
            {program.benefit_label}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-gray-500 group-hover:text-amber-800 transition-colors">
              <div className="p-1 rounded bg-gray-50 group-hover:bg-amber-50 transition-colors">
                <Users className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <span className="text-xs font-semibold">{memberCount} membre{memberCount > 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-500 group-hover:text-amber-800 transition-colors">
              <div className="p-1 rounded bg-gray-50 group-hover:bg-amber-50 transition-colors">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <span className="text-xs font-semibold">{program.duration_months} mois</span>
            </div>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

// Member Item Component - Premium VIP Design
function MemberItem({
  member,
  onExtend,
  onRemove,
}: {
  member: MemberCard;
  onExtend: () => void;
  onRemove: () => void;
}) {
  const isValid = new Date(member.valid_until) > new Date();
  const daysRemaining = Math.ceil(
    (new Date(member.valid_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${
      isValid
        ? 'bg-white/70 backdrop-blur-md border-amber-100 shadow-sm hover:shadow-xl hover:shadow-amber-900/5 hover:border-amber-300 hover:-translate-y-0.5'
        : 'bg-gray-50/50 border-gray-100 opacity-60 grayscale-[0.5]'
    }`}>
      {/* Premium Avatar with Glow */}
      <div className="relative">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold relative z-10 overflow-hidden ${
          isValid
            ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 shadow-lg shadow-amber-200'
            : 'bg-gray-400'
        }`}>
          {isValid && <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent animate-shimmer" />}
          {member.customer?.first_name?.charAt(0) || '?'}
        </div>
        {isValid && (
          <div className="absolute -inset-1 bg-amber-400/20 blur-lg rounded-xl transition-opacity opacity-0 group-hover:opacity-100" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 tracking-tight flex items-center gap-2">
          {member.customer?.first_name} {member.customer?.last_name}
          {isValid && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />}
        </p>
        <div className="flex items-center gap-2.5 text-[13px] text-gray-500">
          <span className="font-medium">{member.customer?.phone_number}</span>
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <span className="flex items-center gap-1">
            <span className="opacity-60">Expire le</span>
            <span className={isValid ? 'text-amber-700 font-medium' : ''}>{formatDate(member.valid_until)}</span>
          </span>
        </div>
      </div>

      {/* Dynamic Status Badges */}
      <div className="flex items-center gap-3">
        {isValid && daysRemaining <= 7 && (
          <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black uppercase tracking-wider rounded-lg shadow-sm">
            {daysRemaining} jours
          </span>
        )}

        <div className={`px-3 py-1 text-[11px] font-bold uppercase tracking-widest rounded-full transition-all border ${
          isValid
            ? 'bg-emerald-50/50 border-emerald-100 text-emerald-600'
            : 'bg-gray-100 border-gray-200 text-gray-500'
        }`}>
          {isValid ? 'Actif' : 'Expiré'}
        </div>
      </div>

      {/* Premium Actions */}
      <div className="flex items-center gap-1.5 ml-2">
        <button
          onClick={onExtend}
          className="p-2.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all active:scale-95 border border-transparent hover:border-amber-100"
          title="Renouveler"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <button
          onClick={onRemove}
          className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-95 border border-transparent hover:border-red-100"
          title="Retirer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
