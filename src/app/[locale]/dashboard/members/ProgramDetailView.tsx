'use client';

import {
  Crown,
  Loader2,
  UserPlus,
  Trash2,
  Users,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui';
import type { MemberCard, MerchantCountry } from '@/types';
import type { ProgramWithCount, CustomerWithCard, DurationUnit } from './types';
import { formatDuration } from './types';
import MemberItem from './MemberItem';
import {
  AssignModal,
  ExtendModal,
  DeleteMemberModal,
  DeleteProgramModal,
} from './Modals';

interface ProgramDetailViewProps {
  selectedProgram: ProgramWithCount;
  programMembers: MemberCard[];
  loadingMembers: boolean;
  onBack: () => void;
  isCagnotte?: boolean;
  // Assign modal
  assign: {
    assignModalOpen: boolean;
    setAssignModalOpen: (v: boolean) => void;
    customerSearch: string;
    setCustomerSearch: (v: string) => void;
    selectedCustomers: CustomerWithCard[];
    toggleCustomerSelection: (c: CustomerWithCard) => void;
    assigning: boolean;
    assignError: string | null;
    setAssignError: (v: string | null) => void;
    handleAssignCustomer: () => void;
    closeAssignModal: () => void;
    showNewCustomerForm: boolean;
    setShowNewCustomerForm: (v: boolean) => void;
    newCustomerFirstName: string;
    setNewCustomerFirstName: (v: string) => void;
    newCustomerLastName: string;
    setNewCustomerLastName: (v: string) => void;
    newCustomerPhone: string;
    setNewCustomerPhone: (v: string) => void;
    newCustomerPhoneCountry: MerchantCountry;
    setNewCustomerPhoneCountry: (v: MerchantCountry) => void;
    newCustomerStartAmount: string;
    setNewCustomerStartAmount: (v: string) => void;
    newCustomerStartStamps: string;
    setNewCustomerStartStamps: (v: string) => void;
    creatingCustomer: boolean;
    handleCreateCustomer: () => void;
    filteredCustomers: CustomerWithCard[];
  };
  // Member actions
  actions: {
    extendModalOpen: boolean;
    setExtendModalOpen: (v: boolean) => void;
    selectedMember: MemberCard | null;
    setSelectedMember: (m: MemberCard | null) => void;
    extendDurationUnit: DurationUnit;
    setExtendDurationUnit: (v: DurationUnit) => void;
    extendDurationNumber: number;
    setExtendDurationNumber: (v: number) => void;
    extending: boolean;
    handleExtendMember: () => void;
    closeExtendModal: () => void;
    deleteModalOpen: boolean;
    setDeleteModalOpen: (v: boolean) => void;
    deleting: boolean;
    handleRemoveMember: () => void;
    closeDeleteModal: () => void;
    deleteProgramModalOpen: boolean;
    setDeleteProgramModalOpen: (v: boolean) => void;
    deletingProgram: boolean;
    handleDeleteProgram: () => void;
  };
}

export default function ProgramDetailView({
  selectedProgram,
  programMembers,
  loadingMembers,
  onBack,
  isCagnotte,
  assign,
  actions,
}: ProgramDetailViewProps) {
  const memberCount = programMembers.length;
  const activeMembers = programMembers.filter(m => new Date(m.valid_until) > new Date()).length;

  return (
    <div className="max-w-4xl mx-auto pb-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux programmes
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shrink-0">
                <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 truncate">{selectedProgram.name}</h1>
                <p className="text-amber-600 font-semibold text-sm sm:text-base truncate">{selectedProgram.benefit_label}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 mt-4 text-xs sm:text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                {memberCount} membre{memberCount > 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {formatDuration(selectedProgram.duration_months)}
              </span>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              onClick={() => assign.setAssignModalOpen(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white flex-1 sm:flex-none text-sm sm:text-base"
            >
              <UserPlus className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Ajouter un</span> membre
            </Button>
            <Button
              variant="outline"
              onClick={() => actions.setDeleteProgramModalOpen(true)}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="p-4 sm:p-5 bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs sm:text-sm text-gray-500 mb-1">Membres actifs</p>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600">{activeMembers}</p>
        </div>
        <div className="p-4 sm:p-5 bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs sm:text-sm text-gray-500 mb-1">Membres expir&eacute;s</p>
          <p className="text-2xl sm:text-3xl font-black text-gray-400">{memberCount - activeMembers}</p>
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
          <p className="text-gray-500 mb-6">Commencez par ajouter des clients &agrave; ce programme</p>
          <Button
            onClick={() => assign.setAssignModalOpen(true)}
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
                actions.setSelectedMember(member);
                actions.setExtendModalOpen(true);
              }}
              onRemove={() => {
                actions.setSelectedMember(member);
                actions.setDeleteModalOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Assign Modal */}
      <AssignModal
        isOpen={assign.assignModalOpen}
        onClose={assign.closeAssignModal}
        customerSearch={assign.customerSearch}
        setCustomerSearch={assign.setCustomerSearch}
        filteredCustomers={assign.filteredCustomers}
        selectedCustomers={assign.selectedCustomers}
        toggleCustomerSelection={assign.toggleCustomerSelection}
        assigning={assign.assigning}
        assignError={assign.assignError}
        onAssign={assign.handleAssignCustomer}
        showNewCustomerForm={assign.showNewCustomerForm}
        setShowNewCustomerForm={assign.setShowNewCustomerForm}
        newCustomerFirstName={assign.newCustomerFirstName}
        setNewCustomerFirstName={assign.setNewCustomerFirstName}
        newCustomerLastName={assign.newCustomerLastName}
        setNewCustomerLastName={assign.setNewCustomerLastName}
        newCustomerPhone={assign.newCustomerPhone}
        setNewCustomerPhone={assign.setNewCustomerPhone}
        newCustomerPhoneCountry={assign.newCustomerPhoneCountry}
        setNewCustomerPhoneCountry={assign.setNewCustomerPhoneCountry}
        newCustomerStartAmount={assign.newCustomerStartAmount}
        setNewCustomerStartAmount={assign.setNewCustomerStartAmount}
        newCustomerStartStamps={assign.newCustomerStartStamps}
        setNewCustomerStartStamps={assign.setNewCustomerStartStamps}
        isCagnotte={isCagnotte}
        creatingCustomer={assign.creatingCustomer}
        onCreateCustomer={assign.handleCreateCustomer}
      />

      {/* Extend Modal */}
      <ExtendModal
        isOpen={actions.extendModalOpen}
        onClose={actions.closeExtendModal}
        selectedMember={actions.selectedMember}
        extendDurationUnit={actions.extendDurationUnit}
        setExtendDurationUnit={actions.setExtendDurationUnit}
        extendDurationNumber={actions.extendDurationNumber}
        setExtendDurationNumber={actions.setExtendDurationNumber}
        extending={actions.extending}
        onExtend={actions.handleExtendMember}
      />

      {/* Delete Member Modal */}
      <DeleteMemberModal
        isOpen={actions.deleteModalOpen}
        onClose={actions.closeDeleteModal}
        selectedMember={actions.selectedMember}
        deleting={actions.deleting}
        onDelete={actions.handleRemoveMember}
      />

      {/* Delete Program Modal */}
      <DeleteProgramModal
        isOpen={actions.deleteProgramModalOpen}
        onClose={() => actions.setDeleteProgramModalOpen(false)}
        programName={selectedProgram.name}
        deletingProgram={actions.deletingProgram}
        onDelete={actions.handleDeleteProgram}
      />
    </div>
  );
}
