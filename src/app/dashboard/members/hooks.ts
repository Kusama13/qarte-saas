import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatPhoneNumber } from '@/lib/utils';
import type { Merchant, MemberCard, Customer } from '@/types';
import type { ProgramWithCount, CustomerWithCard, DurationUnit } from './types';
import { calculateDurationMonths } from './types';

export function useMembersData() {
  const router = useRouter();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [programs, setPrograms] = useState<ProgramWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected program view
  const [selectedProgram, setSelectedProgram] = useState<ProgramWithCount | null>(null);
  const [programMembers, setProgramMembers] = useState<MemberCard[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Customers for assign modal
  const [customers, setCustomers] = useState<CustomerWithCard[]>([]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedProgram) {
      fetchProgramMembers(selectedProgram.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProgram]);

  return {
    merchant,
    programs,
    loading,
    selectedProgram,
    setSelectedProgram,
    programMembers,
    setProgramMembers,
    loadingMembers,
    customers,
    setCustomers,
    fetchPrograms,
    fetchProgramMembers,
  };
}

export function useCreateProgram(fetchPrograms: () => Promise<void>) {
  const [createProgramOpen, setCreateProgramOpen] = useState(false);
  const [programName, setProgramName] = useState('');
  const [programBenefit, setProgramBenefit] = useState('');
  const [durationUnit, setDurationUnit] = useState<DurationUnit>('month');
  const [durationNumber, setDurationNumber] = useState(12);
  const [creatingProgram, setCreatingProgram] = useState(false);

  const handleCreateProgram = async () => {
    if (!programName.trim() || !programBenefit.trim() || durationNumber < 1) return;

    setCreatingProgram(true);
    try {
      const durationMonths = calculateDurationMonths(durationUnit, durationNumber);

      const response = await fetch('/api/member-programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: programName.trim(),
          benefit_label: programBenefit.trim(),
          duration_months: durationMonths,
        }),
      });

      if (response.ok) {
        setCreateProgramOpen(false);
        setProgramName('');
        setProgramBenefit('');
        setDurationUnit('month');
        setDurationNumber(12);
        await fetchPrograms();
      }
    } catch (error) {
      console.error('Error creating program:', error);
    }
    setCreatingProgram(false);
  };

  const closeCreateModal = () => {
    setCreateProgramOpen(false);
    setProgramName('');
    setProgramBenefit('');
    setDurationUnit('month');
    setDurationNumber(12);
  };

  return {
    createProgramOpen,
    setCreateProgramOpen,
    programName,
    setProgramName,
    programBenefit,
    setProgramBenefit,
    durationUnit,
    setDurationUnit,
    durationNumber,
    setDurationNumber,
    creatingProgram,
    handleCreateProgram,
    closeCreateModal,
  };
}

export function useAssignCustomer(
  merchant: Merchant | null,
  selectedProgram: ProgramWithCount | null,
  customers: CustomerWithCard[],
  setCustomers: React.Dispatch<React.SetStateAction<CustomerWithCard[]>>,
  fetchProgramMembers: (id: string) => Promise<void>,
  fetchPrograms: () => Promise<void>,
) {
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithCard | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  // New customer creation within assign modal
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerFirstName, setNewCustomerFirstName] = useState('');
  const [newCustomerLastName, setNewCustomerLastName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [creatingCustomer, setCreatingCustomer] = useState(false);

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
          phone_number: formatPhoneNumber(newCustomerPhone.trim(), merchant.country || 'FR'),
          merchant_id: merchant.id,
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

  const handleAssignCustomer = async () => {
    if (!selectedCustomer || !selectedProgram) return;

    setAssigning(true);
    setAssignError(null);
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
        await fetchPrograms();
      } else {
        const data = await response.json();
        setAssignError(data.error || 'Erreur lors de l\'assignation');
      }
    } catch (error) {
      console.error('Error assigning customer:', error);
      setAssignError('Erreur de connexion');
    }
    setAssigning(false);
  };

  const closeAssignModal = () => {
    setAssignModalOpen(false);
    setSelectedCustomer(null);
    setCustomerSearch('');
    setShowNewCustomerForm(false);
    setAssignError(null);
  };

  // Filter customers for search
  const filteredCustomers = useMemo(() => {
    const search = customerSearch.toLowerCase();
    return customers.filter((c) =>
      c.customer?.first_name?.toLowerCase().includes(search) ||
      c.customer?.last_name?.toLowerCase().includes(search) ||
      c.customer?.phone_number?.includes(search)
    );
  }, [customers, customerSearch]);

  return {
    assignModalOpen,
    setAssignModalOpen,
    customerSearch,
    setCustomerSearch,
    selectedCustomer,
    setSelectedCustomer,
    assigning,
    assignError,
    setAssignError,
    showNewCustomerForm,
    setShowNewCustomerForm,
    newCustomerFirstName,
    setNewCustomerFirstName,
    newCustomerLastName,
    setNewCustomerLastName,
    newCustomerPhone,
    setNewCustomerPhone,
    creatingCustomer,
    handleCreateCustomer,
    handleAssignCustomer,
    closeAssignModal,
    filteredCustomers,
  };
}

export function useMemberActions(
  selectedProgram: ProgramWithCount | null,
  fetchProgramMembers: (id: string) => Promise<void>,
  fetchPrograms: () => Promise<void>,
  setSelectedProgram: (p: ProgramWithCount | null) => void,
  setProgramMembers: (m: MemberCard[]) => void,
) {
  // Extend modal
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberCard | null>(null);
  const [extendDurationUnit, setExtendDurationUnit] = useState<DurationUnit>('month');
  const [extendDurationNumber, setExtendDurationNumber] = useState(3);
  const [extending, setExtending] = useState(false);

  // Delete member modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Delete program modal
  const [deleteProgramModalOpen, setDeleteProgramModalOpen] = useState(false);
  const [deletingProgram, setDeletingProgram] = useState(false);

  const handleExtendMember = async () => {
    if (!selectedMember || extendDurationNumber < 1) return;

    setExtending(true);
    try {
      const durationMonths = calculateDurationMonths(extendDurationUnit, extendDurationNumber);

      const response = await fetch(`/api/member-cards/${selectedMember.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration_months: durationMonths }),
      });

      if (response.ok && selectedProgram) {
        setExtendModalOpen(false);
        setSelectedMember(null);
        setExtendDurationUnit('month');
        setExtendDurationNumber(3);
        await fetchProgramMembers(selectedProgram.id);
      }
    } catch (error) {
      console.error('Error extending membership:', error);
    }
    setExtending(false);
  };

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
        await fetchPrograms();
      }
    } catch (error) {
      console.error('Error removing member:', error);
    }
    setDeleting(false);
  };

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

  const closeExtendModal = () => {
    setExtendModalOpen(false);
    setSelectedMember(null);
    setExtendDurationUnit('month');
    setExtendDurationNumber(3);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setSelectedMember(null);
  };

  return {
    extendModalOpen,
    setExtendModalOpen,
    selectedMember,
    setSelectedMember,
    extendDurationUnit,
    setExtendDurationUnit,
    extendDurationNumber,
    setExtendDurationNumber,
    extending,
    handleExtendMember,
    closeExtendModal,
    deleteModalOpen,
    setDeleteModalOpen,
    deleting,
    handleRemoveMember,
    closeDeleteModal,
    deleteProgramModalOpen,
    setDeleteProgramModalOpen,
    deletingProgram,
    handleDeleteProgram,
  };
}
