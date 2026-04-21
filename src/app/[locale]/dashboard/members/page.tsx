'use client';

import { useState } from 'react';
import {
  Plus,
  Loader2,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui';
import { useMembersData, useCreateProgram, useAssignCustomer, useMemberActions } from './hooks';
import ProgramCard from './ProgramCard';
import ProgramDetailView from './ProgramDetailView';
import EmptyState from './EmptyState';
import HowItWorks from './HowItWorks';
import { CreateProgramModal } from './Modals';
import { getPlanFeatures } from '@/lib/plan-tiers';
import PlanUpgradeCTA from '@/components/dashboard/PlanUpgradeCTA';

export default function MembersPage() {
  const t = useTranslations('members');
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
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!getPlanFeatures(data.merchant).memberPrograms) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <PlanUpgradeCTA
          title={t('upgradeTitle')}
          description={t('upgradeDesc')}
        />
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
        isCagnotte={data.merchant?.loyalty_mode === 'cagnotte'}
        assign={assign}
        actions={actions}
      />
    );
  }

  // Programs list view
  return (
    <div className="max-w-4xl mx-auto pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 md:mb-6">
        <div>
          <h1 className="text-lg md:text-2xl font-bold tracking-tight text-slate-900">{t('title')}</h1>
          <p className="mt-0.5 text-xs md:text-sm text-slate-500">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowHowItWorks(!showHowItWorks)}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">{t('howItWorks')}</span>
            <span className="sm:hidden">{t('help')}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showHowItWorks ? 'rotate-180' : ''}`} />
          </button>
          <Button
            onClick={() => createProgram.setCreateProgramOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4 mr-1.5 sm:mr-2" />
            {t('newProgram')}
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
        discountPercent={createProgram.discountPercent}
        setDiscountPercent={createProgram.setDiscountPercent}
        skipDeposit={createProgram.skipDeposit}
        setSkipDeposit={createProgram.setSkipDeposit}
        creatingProgram={createProgram.creatingProgram}
        onCreateProgram={createProgram.handleCreateProgram}
      />
    </div>
  );
}
