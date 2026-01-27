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
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
            <Crown className="w-10 h-10 text-amber-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun programme</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Créez votre premier programme membre pour offrir des avantages exclusifs à vos meilleurs clients
          </p>
          <Button
            onClick={() => setCreateProgramOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Créer un programme
          </Button>
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
            label="Durée par défaut"
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

// Program Card Component
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
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="group relative p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-amber-200 transition-all text-left w-full"
    >
      <div className="absolute top-4 right-4">
        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
      </div>

      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200/50">
          <Crown className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-900 mb-1">{program.name}</h3>
          <p className="text-amber-600 font-semibold text-sm mb-3">{program.benefit_label}</p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {memberCount} membre{memberCount > 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {program.duration_months} mois
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

// Member Item Component
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
    <div className={`flex items-center gap-4 p-4 bg-white rounded-xl border transition-all ${
      isValid ? 'border-gray-100 hover:border-amber-200' : 'border-gray-100 opacity-60'
    }`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold ${
        isValid
          ? 'bg-gradient-to-br from-amber-400 to-orange-500'
          : 'bg-gray-300'
      }`}>
        {member.customer?.first_name?.charAt(0) || '?'}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900">
          {member.customer?.first_name} {member.customer?.last_name}
        </p>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span>{member.customer?.phone_number}</span>
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <span>Jusqu&apos;au {formatDate(member.valid_until)}</span>
        </div>
      </div>

      {isValid && daysRemaining <= 7 && (
        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
          {daysRemaining}j
        </span>
      )}

      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
        isValid
          ? 'bg-emerald-50 text-emerald-600'
          : 'bg-gray-100 text-gray-500'
      }`}>
        {isValid ? 'Actif' : 'Expiré'}
      </span>

      <div className="flex gap-1">
        <button
          onClick={onExtend}
          className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
          title="Prolonger"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <button
          onClick={onRemove}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Retirer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
