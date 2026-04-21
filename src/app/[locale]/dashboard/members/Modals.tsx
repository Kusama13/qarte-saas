'use client';

import {
  Search,
  Plus,
  Loader2,
  UserPlus,
  RefreshCw,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button, Input, Modal } from '@/components/ui';
import type { MemberCard } from '@/types';
import { formatPhoneLabel } from '@/lib/utils';
import { PhoneInput } from '@/components/ui/PhoneInput';
import type { MerchantCountry } from '@/types';
import type { ProgramWithCount, CustomerWithCard, DurationUnit } from './types';
import { DURATION_UNITS, PROGRAM_NAME_SUGGESTIONS } from './types';

// ============================================
// Create Program Modal
// ============================================

interface CreateProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  programName: string;
  setProgramName: (v: string) => void;
  programBenefit: string;
  setProgramBenefit: (v: string) => void;
  durationUnit: DurationUnit;
  setDurationUnit: (v: DurationUnit) => void;
  durationNumber: number;
  setDurationNumber: (v: number) => void;
  discountPercent: number | null;
  setDiscountPercent: (v: number | null) => void;
  skipDeposit: boolean;
  setSkipDeposit: (v: boolean) => void;
  creatingProgram: boolean;
  onCreateProgram: () => void;
}

export function CreateProgramModal({
  isOpen,
  onClose,
  programName,
  setProgramName,
  programBenefit,
  setProgramBenefit,
  durationUnit,
  setDurationUnit,
  durationNumber,
  setDurationNumber,
  discountPercent,
  setDiscountPercent,
  skipDeposit,
  setSkipDeposit,
  creatingProgram,
  onCreateProgram,
}: CreateProgramModalProps) {
  const t = useTranslations('members');
  const durationUnitLabels: Record<string, string> = {
    day: t('durationDay'),
    week: t('durationWeek'),
    month: t('durationMonth'),
  };

  const getDurationUnitText = (unit: string, count: number) => {
    if (unit === 'day') return count > 1 ? t('daysPlural') : t('daysSingular');
    if (unit === 'week') return count > 1 ? t('weeksPlural') : t('weeksSingular');
    return t('months');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('createProgramTitle')}
    >
      <div className="space-y-5">
        {/* 1. Nom du programme */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t('programNameLabel')}</label>
          <input
            type="text"
            value={programName}
            onChange={(e) => setProgramName(e.target.value)}
            placeholder={t('programNamePlaceholder')}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {PROGRAM_NAME_SUGGESTIONS.map(s => (
              <button key={s} type="button" onClick={() => setProgramName(s)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                  programName === s ? 'bg-indigo-100 border-indigo-300 text-indigo-800' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-indigo-200'
                }`}>{s}</button>
            ))}
          </div>
        </div>

        {/* 2. Duree */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t('durationLabel')}</label>
          <div className="flex flex-wrap items-center gap-2">
            {DURATION_UNITS.map((unit) => (
              <button key={unit.value} type="button"
                onClick={() => {
                  setDurationUnit(unit.value as DurationUnit);
                  if (unit.value === 'day') setDurationNumber(7);
                  else if (unit.value === 'week') setDurationNumber(2);
                  else setDurationNumber(12);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  durationUnit === unit.value
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'
                }`}
              >{durationUnitLabels[unit.value]}</button>
            ))}
            <div className="flex items-center gap-2 ml-auto sm:ml-0">
              <input
                type="number"
                min="1"
                max={durationUnit === 'day' ? 365 : durationUnit === 'week' ? 52 : 120}
                value={durationNumber || ''}
                onChange={(e) => setDurationNumber(parseInt(e.target.value) || 0)}
                onBlur={() => { if (durationNumber < 1) setDurationNumber(1); }}
                className="w-16 px-2 py-1.5 text-center text-sm font-semibold border border-gray-200 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
              />
              <span className="text-xs text-gray-400">{getDurationUnitText(durationUnit, durationNumber)}</span>
            </div>
          </div>
        </div>

        {/* Separator — Avantages */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">{t('benefitsSection')}</p>

          {/* 3. Reduction */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-700 mb-0.5">{t('discountLabel')}</label>
            <p className="text-[10px] text-gray-400 mb-2">{t('discountHint')}</p>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" onClick={() => setDiscountPercent(null)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  discountPercent === null ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'
                }`}>{t('discountNone')}</button>
              {([5, 10, 15, 20] as const).map(p => (
                <button key={p} type="button" onClick={() => setDiscountPercent(p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    discountPercent === p ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'
                  }`}>-{p}%</button>
              ))}
            </div>
          </div>

          {/* 4. Acompte */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <label className="text-xs font-semibold text-gray-700">{t('skipDepositLabel')}</label>
              <p className="text-[10px] text-gray-400 mt-0.5">{t('skipDepositHint')}</p>
            </div>
            <button type="button" role="switch" aria-checked={skipDeposit}
              onClick={() => setSkipDeposit(!skipDeposit)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${skipDeposit ? 'bg-indigo-600' : 'bg-gray-200'}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${skipDeposit ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* 5. Avantage texte libre */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-0.5">{t('benefitLabel')}</label>
            <p className="text-[10px] text-gray-400 mb-1.5">{t('benefitHint')}</p>
            <input
              type="text"
              value={programBenefit}
              onChange={(e) => setProgramBenefit(e.target.value)}
              placeholder={t('benefitPlaceholder')}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
            />
          </div>
        </div>

        <Button
          onClick={onCreateProgram}
          disabled={!programName.trim() || durationNumber < 1 || (!discountPercent && !skipDeposit && !programBenefit.trim()) || creatingProgram}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-11"
        >
          {creatingProgram ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          {t('createProgram')}
        </Button>
      </div>
    </Modal>
  );
}

// ============================================
// Assign Customer Modal
// ============================================

interface AssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerSearch: string;
  setCustomerSearch: (v: string) => void;
  filteredCustomers: CustomerWithCard[];
  selectedCustomers: CustomerWithCard[];
  toggleCustomerSelection: (c: CustomerWithCard) => void;
  assigning: boolean;
  assignError?: string | null;
  onAssign: () => void;
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
  newCustomerStartAmount?: string;
  setNewCustomerStartAmount?: (v: string) => void;
  newCustomerStartStamps?: string;
  setNewCustomerStartStamps?: (v: string) => void;
  isCagnotte?: boolean;
  creatingCustomer: boolean;
  onCreateCustomer: () => void;
}

export function AssignModal({
  isOpen,
  onClose,
  customerSearch,
  setCustomerSearch,
  filteredCustomers,
  selectedCustomers,
  toggleCustomerSelection,
  assigning,
  assignError,
  onAssign,
  showNewCustomerForm,
  setShowNewCustomerForm,
  newCustomerFirstName,
  setNewCustomerFirstName,
  newCustomerLastName,
  setNewCustomerLastName,
  newCustomerPhone,
  setNewCustomerPhone,
  newCustomerPhoneCountry,
  setNewCustomerPhoneCountry,
  newCustomerStartAmount,
  setNewCustomerStartAmount,
  newCustomerStartStamps,
  setNewCustomerStartStamps,
  isCagnotte,
  creatingCustomer,
  onCreateCustomer,
}: AssignModalProps) {
  const t = useTranslations('members');
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('addMemberTitle')}
    >
      <div className="space-y-4">
        {!showNewCustomerForm ? (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={t('searchClient')}
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {filteredCustomers.slice(0, 20).map((c) => {
                const isSelected = selectedCustomers.some(s => s.id === c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleCustomerSelection(c)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                      isSelected
                        ? 'bg-indigo-50 border-2 border-indigo-300'
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                      isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-semibold shrink-0">
                      {c.customer?.first_name?.charAt(0) || '?'}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {c.customer?.first_name} {c.customer?.last_name}
                      </p>
                      <p className="text-sm text-gray-500">{formatPhoneLabel(c.customer?.phone_number || '')}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowNewCustomerForm(true)}
              className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('createNewClient')}
            </button>

            {assignError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 font-medium">
                {assignError}
              </div>
            )}

            <Button
              onClick={onAssign}
              disabled={selectedCustomers.length === 0 || assigning}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {assigning ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              {selectedCustomers.length > 1
                ? t('addMembers', { count: selectedCustomers.length })
                : t('addToProgram')}
            </Button>
          </>
        ) : (
          <>
            <button
              onClick={() => setShowNewCustomerForm(false)}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('backToList')}
            </button>

            <Input
              placeholder={t('firstNamePlaceholder')}
              value={newCustomerFirstName}
              onChange={(e) => setNewCustomerFirstName(e.target.value)}
            />
            <Input
              placeholder={t('lastNamePlaceholder')}
              value={newCustomerLastName}
              onChange={(e) => setNewCustomerLastName(e.target.value)}
            />
            <PhoneInput
              value={newCustomerPhone}
              onChange={setNewCustomerPhone}
              country={newCustomerPhoneCountry as MerchantCountry}
              onCountryChange={(c) => setNewCustomerPhoneCountry(c)}
              countries={['FR', 'BE', 'CH']}
            />
            {setNewCustomerStartStamps && (
              <Input
                placeholder={t('startStampsPlaceholder')}
                type="number"
                min="0"
                step="1"
                value={newCustomerStartStamps || ''}
                onChange={(e) => setNewCustomerStartStamps(e.target.value)}
              />
            )}
            {isCagnotte && setNewCustomerStartAmount && (
              <Input
                placeholder={t('startAmountPlaceholder')}
                type="number"
                min="0"
                step="0.01"
                value={newCustomerStartAmount || ''}
                onChange={(e) => setNewCustomerStartAmount(e.target.value)}
              />
            )}

            <Button
              onClick={onCreateCustomer}
              disabled={!newCustomerFirstName.trim() || !newCustomerPhone.trim() || creatingCustomer}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {creatingCustomer ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {t('createAndSelect')}
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}

// ============================================
// Extend Member Modal
// ============================================

interface ExtendModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMember: MemberCard | null;
  extendDurationUnit: DurationUnit;
  setExtendDurationUnit: (v: DurationUnit) => void;
  extendDurationNumber: number;
  setExtendDurationNumber: (v: number) => void;
  extending: boolean;
  onExtend: () => void;
}

export function ExtendModal({
  isOpen,
  onClose,
  selectedMember,
  extendDurationUnit,
  setExtendDurationUnit,
  extendDurationNumber,
  setExtendDurationNumber,
  extending,
  onExtend,
}: ExtendModalProps) {
  const t = useTranslations('members');
  const durationUnitLabels: Record<string, string> = {
    day: t('durationDay'),
    week: t('durationWeek'),
    month: t('durationMonth'),
  };

  const getDurationUnitText = (unit: string, count: number) => {
    if (unit === 'day') return count > 1 ? t('daysPlural') : t('daysSingular');
    if (unit === 'week') return count > 1 ? t('weeksPlural') : t('weeksSingular');
    return t('months');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('extendTitle')}
    >
      <div className="space-y-4">
        <p className="text-gray-600">
          {t('extendDescription')}{' '}
          <strong>
            {selectedMember?.customer?.first_name} {selectedMember?.customer?.last_name}
          </strong>
        </p>

        {/* Duration selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            {t('extendDurationLabel')}
          </label>

          {/* Step 1: Select unit */}
          <div className="flex gap-2 mb-4">
            {DURATION_UNITS.map((unit) => (
              <button
                key={unit.value}
                type="button"
                onClick={() => {
                  setExtendDurationUnit(unit.value as DurationUnit);
                  if (unit.value === 'day') setExtendDurationNumber(7);
                  else if (unit.value === 'week') setExtendDurationNumber(2);
                  else setExtendDurationNumber(3);
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl border-2 font-medium text-sm transition-all ${
                  extendDurationUnit === unit.value
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-800'
                    : 'bg-white border-gray-100 text-gray-600 hover:border-indigo-200 hover:bg-indigo-50/50'
                }`}
              >
                {durationUnitLabels[unit.value]}
              </button>
            ))}
          </div>

          {/* Step 2: Enter number */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <input
                type="number"
                min="1"
                max={extendDurationUnit === 'day' ? 365 : extendDurationUnit === 'week' ? 52 : 120}
                value={extendDurationNumber || ''}
                onChange={(e) => setExtendDurationNumber(parseInt(e.target.value) || 0)}
                onBlur={() => { if (extendDurationNumber < 1) setExtendDurationNumber(1); }}
                className="w-full h-12 px-4 text-center text-lg font-semibold border-2 border-gray-100 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
              />
            </div>
            <span className="text-gray-500 font-medium min-w-[80px]">
              {getDurationUnitText(extendDurationUnit, extendDurationNumber)}
            </span>
          </div>
        </div>

        <Button
          onClick={onExtend}
          disabled={extendDurationNumber < 1 || extending}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {extending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          {t('extend')}
        </Button>
      </div>
    </Modal>
  );
}

// ============================================
// Delete Member Modal
// ============================================

interface DeleteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMember: MemberCard | null;
  deleting: boolean;
  onDelete: () => void;
}

export function DeleteMemberModal({
  isOpen,
  onClose,
  selectedMember,
  deleting,
  onDelete,
}: DeleteMemberModalProps) {
  const t = useTranslations('members');
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('removeMemberTitle')}
    >
      <div className="space-y-4">
        <p className="text-gray-600">
          {t('removeMemberConfirm')}{' '}
          <strong>
            {selectedMember?.customer?.first_name} {selectedMember?.customer?.last_name}
          </strong>{' '}
          {t('removeMemberSuffix')}
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            {t('cancelAction')}
          </Button>
          <Button
            onClick={onDelete}
            disabled={deleting}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {t('removeMember')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ============================================
// Delete Program Modal
// ============================================

interface DeleteProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  programName: string;
  deletingProgram: boolean;
  onDelete: () => void;
}

export function DeleteProgramModal({
  isOpen,
  onClose,
  programName,
  deletingProgram,
  onDelete,
}: DeleteProgramModalProps) {
  const t = useTranslations('members');
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('deleteProgramTitle')}
    >
      <div className="space-y-4">
        <p className="text-gray-600">
          {t('deleteProgramConfirm')}{' '}
          <strong>{programName}</strong> ?
        </p>
        <p className="text-sm text-red-600">
          {t('deleteProgramWarning')}
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            {t('cancelAction')}
          </Button>
          <Button
            onClick={onDelete}
            disabled={deletingProgram}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white"
          >
            {deletingProgram ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {t('deleteProgram')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
