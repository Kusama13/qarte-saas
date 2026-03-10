'use client';

import {
  Search,
  Plus,
  Loader2,
  UserPlus,
  RefreshCw,
  ArrowLeft,
  Lightbulb,
  Check,
} from 'lucide-react';
import { Button, Input, Modal } from '@/components/ui';
import type { MemberCard } from '@/types';
import type { ProgramWithCount, CustomerWithCard, DurationUnit } from './types';
import { DURATION_UNITS, PROGRAM_NAME_SUGGESTIONS, BENEFIT_SUGGESTIONS } from './types';

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
  creatingProgram,
  onCreateProgram,
}: CreateProgramModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nouveau programme membre"
      size="lg"
    >
      <div className="space-y-6">
        {/* Program Name */}
        <div>
          <Input
            label="Nom du programme"
            placeholder="Ex: VIP Gold, Premium, Fid\u00e8le..."
            value={programName}
            onChange={(e) => setProgramName(e.target.value)}
          />
          <div className="mt-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>Suggestions populaires</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PROGRAM_NAME_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setProgramName(suggestion)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border transition-all ${
                    programName === suggestion
                      ? 'bg-amber-100 border-amber-300 text-amber-800'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-amber-50 hover:border-amber-200'
                  }`}
                >
                  <span>{suggestion}</span>
                  {programName === suggestion && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Benefit */}
        <div>
          <Input
            label="Avantage"
            placeholder="Ex: -10% sur tout, Caf\u00e9 offert..."
            value={programBenefit}
            onChange={(e) => setProgramBenefit(e.target.value)}
          />
          <div className="mt-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>Avantages les plus courants</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {BENEFIT_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setProgramBenefit(suggestion)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border transition-all ${
                    programBenefit === suggestion
                      ? 'bg-amber-100 border-amber-300 text-amber-800'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-amber-50 hover:border-amber-200'
                  }`}
                >
                  <span>{suggestion}</span>
                  {programBenefit === suggestion && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Duration - Two step selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Dur&eacute;e de l&apos;adh&eacute;sion
          </label>

          {/* Step 1: Select unit */}
          <div className="flex gap-2 mb-4">
            {DURATION_UNITS.map((unit) => (
              <button
                key={unit.value}
                type="button"
                onClick={() => {
                  setDurationUnit(unit.value as DurationUnit);
                  if (unit.value === 'day') setDurationNumber(7);
                  else if (unit.value === 'week') setDurationNumber(2);
                  else setDurationNumber(12);
                }}
                className={`flex-1 py-3 px-4 rounded-xl border-2 font-medium transition-all ${
                  durationUnit === unit.value
                    ? 'bg-amber-50 border-amber-400 text-amber-800'
                    : 'bg-white border-gray-100 text-gray-600 hover:border-amber-200 hover:bg-amber-50/50'
                }`}
              >
                {unit.label}
              </button>
            ))}
          </div>

          {/* Step 2: Enter number */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <input
                type="number"
                min="1"
                max={durationUnit === 'day' ? 365 : durationUnit === 'week' ? 52 : 120}
                value={durationNumber || ''}
                onChange={(e) => setDurationNumber(parseInt(e.target.value) || 0)}
                onBlur={() => { if (durationNumber < 1) setDurationNumber(1); }}
                className="w-full h-12 px-4 text-center text-lg font-semibold border-2 border-gray-100 rounded-xl focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all"
              />
            </div>
            <span className="text-gray-500 font-medium min-w-[100px]">
              {durationUnit === 'day' && (durationNumber > 1 ? 'jours' : 'jour')}
              {durationUnit === 'week' && (durationNumber > 1 ? 'semaines' : 'semaine')}
              {durationUnit === 'month' && 'mois'}
            </span>
          </div>

          {/* Preview */}
          <p className="mt-3 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
            Dur&eacute;e du programme : <span className="font-semibold text-amber-700">
              {durationNumber} {durationUnit === 'day' && (durationNumber > 1 ? 'jours' : 'jour')}
              {durationUnit === 'week' && (durationNumber > 1 ? 'semaines' : 'semaine')}
              {durationUnit === 'month' && 'mois'}
            </span>
          </p>
        </div>

        <Button
          onClick={onCreateProgram}
          disabled={!programName.trim() || !programBenefit.trim() || durationNumber < 1 || creatingProgram}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white"
        >
          {creatingProgram ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          Cr&eacute;er le programme
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
  newCustomerStartAmount,
  setNewCustomerStartAmount,
  newCustomerStartStamps,
  setNewCustomerStartStamps,
  isCagnotte,
  creatingCustomer,
  onCreateCustomer,
}: AssignModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
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
              {filteredCustomers.slice(0, 20).map((c) => {
                const isSelected = selectedCustomers.some(s => s.id === c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleCustomerSelection(c)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                      isSelected
                        ? 'bg-amber-50 border-2 border-amber-300'
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                      isSelected ? 'bg-amber-500 border-amber-500' : 'border-gray-300'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold shrink-0">
                      {c.customer?.first_name?.charAt(0) || '?'}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {c.customer?.first_name} {c.customer?.last_name}
                      </p>
                      <p className="text-sm text-gray-500">{c.customer?.phone_number}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowNewCustomerForm(true)}
              className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-amber-300 hover:text-amber-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Cr&eacute;er un nouveau client
            </button>

            {assignError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 font-medium">
                {assignError}
              </div>
            )}

            <Button
              onClick={onAssign}
              disabled={selectedCustomers.length === 0 || assigning}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
            >
              {assigning ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              {selectedCustomers.length > 1
                ? `Ajouter ${selectedCustomers.length} membres`
                : 'Ajouter au programme'}
            </Button>
          </>
        ) : (
          <>
            <button
              onClick={() => setShowNewCustomerForm(false)}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour &agrave; la liste
            </button>

            <Input
              placeholder="Pr&eacute;nom *"
              value={newCustomerFirstName}
              onChange={(e) => setNewCustomerFirstName(e.target.value)}
            />
            <Input
              placeholder="Nom"
              value={newCustomerLastName}
              onChange={(e) => setNewCustomerLastName(e.target.value)}
            />
            <Input
              placeholder="06 12 34 56 78"
              type="tel"
              value={newCustomerPhone}
              onChange={(e) => setNewCustomerPhone(e.target.value)}
            />
            {setNewCustomerStartStamps && (
              <Input
                placeholder="Tampons de d&eacute;part (optionnel)"
                type="number"
                min="0"
                step="1"
                value={newCustomerStartStamps || ''}
                onChange={(e) => setNewCustomerStartStamps(e.target.value)}
              />
            )}
            {isCagnotte && setNewCustomerStartAmount && (
              <Input
                placeholder="Montant d&eacute;j&agrave; d&eacute;pens&eacute; (optionnel)"
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
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
            >
              {creatingCustomer ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Cr&eacute;er et s&eacute;lectionner
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
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Prolonger l'adh\u00e9sion"
    >
      <div className="space-y-4">
        <p className="text-gray-600">
          Prolonger l&apos;adh&eacute;sion de{' '}
          <strong>
            {selectedMember?.customer?.first_name} {selectedMember?.customer?.last_name}
          </strong>
        </p>

        {/* Duration selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Dur&eacute;e de prolongation
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
                    ? 'bg-amber-50 border-amber-400 text-amber-800'
                    : 'bg-white border-gray-100 text-gray-600 hover:border-amber-200 hover:bg-amber-50/50'
                }`}
              >
                {unit.label}
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
                className="w-full h-12 px-4 text-center text-lg font-semibold border-2 border-gray-100 rounded-xl focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all"
              />
            </div>
            <span className="text-gray-500 font-medium min-w-[80px]">
              {extendDurationUnit === 'day' && (extendDurationNumber > 1 ? 'jours' : 'jour')}
              {extendDurationUnit === 'week' && (extendDurationNumber > 1 ? 'semaines' : 'semaine')}
              {extendDurationUnit === 'month' && 'mois'}
            </span>
          </div>
        </div>

        <Button
          onClick={onExtend}
          disabled={extendDurationNumber < 1 || extending}
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
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Retirer du programme"
    >
      <div className="space-y-4">
        <p className="text-gray-600">
          Es-tu s&ucirc;r de vouloir retirer{' '}
          <strong>
            {selectedMember?.customer?.first_name} {selectedMember?.customer?.last_name}
          </strong>{' '}
          de ce programme ?
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            onClick={onDelete}
            disabled={deleting}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Retirer
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
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Supprimer le programme"
    >
      <div className="space-y-4">
        <p className="text-gray-600">
          Es-tu s&ucirc;r de vouloir supprimer le programme{' '}
          <strong>{programName}</strong> ?
        </p>
        <p className="text-sm text-red-600">
          Tous les membres seront automatiquement retir&eacute;s du programme.
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            onClick={onDelete}
            disabled={deletingProgram}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white"
          >
            {deletingProgram ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Supprimer
          </Button>
        </div>
      </div>
    </Modal>
  );
}
