'use client';

import { useState } from 'react';
import {
  Plus,
  Loader2,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { useMembersData, useCreateProgram, useAssignCustomer, useMemberActions } from './hooks';
import ProgramCard from './ProgramCard';
import ProgramDetailView from './ProgramDetailView';
import EmptyState from './EmptyState';
import HowItWorks from './HowItWorks';
import { CreateProgramModal } from './Modals';

export default function MembersPage() {
  const data = useMembersData();
  const createProgram = useCreateProgram(data.fetchPrograms);

  const assign = useAssignCustomer(
    data.merchant,
    data.selectedProgram,
    data.customers,
    data.setCustomers,
    data.fetchProgramMembers,
    data.fetchPrograms,
  );

  const actions = useMemberActions(
    data.selectedProgram,
    data.fetchProgramMembers,
    data.fetchPrograms,
    data.setSelectedProgram,
    data.setProgramMembers,
  );

  // How it works toggle
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  // Loading state
  if (data.loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  // Program detail view
  if (data.selectedProgram) {
    return (
      <ProgramDetailView
        selectedProgram={data.selectedProgram}
        programMembers={data.programMembers}
        loadingMembers={data.loadingMembers}
        onBack={() => {
          data.setSelectedProgram(null);
          data.setProgramMembers([]);
        }}
        assign={assign}
        actions={actions}
      />
    );
  }

  // Programs list view
  return (
    <div className="max-w-4xl mx-auto pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 p-4 md:p-6 rounded-2xl bg-[#4b0082]/[0.04] border border-[#4b0082]/[0.08]">
        <div>
          <h1 className="text-xl md:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#4b0082] to-violet-600">Programmes Membres</h1>
          <p className="mt-1 text-sm md:text-base text-gray-500 font-medium">Cr&eacute;ez des programmes VIP pour vos clients</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowHowItWorks(!showHowItWorks)}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Comment &ccedil;a marche ?</span>
            <span className="sm:hidden">Aide</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showHowItWorks ? 'rotate-180' : ''}`} />
          </button>
          <Button
            onClick={() => createProgram.setCreateProgramOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Nouveau programme</span>
          </Button>
        </div>
      </div>

      {/* How It Works Section */}
      <HowItWorks show={showHowItWorks} />

      {/* Programs grid */}
      {data.programs.length === 0 ? (
        <EmptyState onCreateProgram={() => createProgram.setCreateProgramOpen(true)} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.programs.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              onClick={() => data.setSelectedProgram(program)}
            />
          ))}
        </div>
      )}

      {/* Create Program Modal */}
      <CreateProgramModal
        isOpen={createProgram.createProgramOpen}
        onClose={createProgram.closeCreateModal}
        programName={createProgram.programName}
        setProgramName={createProgram.setProgramName}
        programBenefit={createProgram.programBenefit}
        setProgramBenefit={createProgram.setProgramBenefit}
        durationUnit={createProgram.durationUnit}
        setDurationUnit={createProgram.setDurationUnit}
        durationNumber={createProgram.durationNumber}
        setDurationNumber={createProgram.setDurationNumber}
        creatingProgram={createProgram.creatingProgram}
        onCreateProgram={createProgram.handleCreateProgram}
      />
    </div>
  );
}
