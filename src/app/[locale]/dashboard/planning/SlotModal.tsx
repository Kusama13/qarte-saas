'use client';

import { X, Loader2, Trash2, Search, UserCheck, Plus } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import type { PlanningSlot } from '@/types';
import { formatTime, toBCP47 } from '@/lib/utils';

interface CustomerResult {
  id: string;
  first_name: string;
  last_name: string | null;
  phone_number: string;
}

interface SlotModalProps {
  editSlot: PlanningSlot;
  editName: string;
  editPhone: string;
  editNotes: string;
  editCustomerId: string | null;
  editServiceId: string | null;
  services: { id: string; name: string }[];
  customerResults: CustomerResult[];
  showCustomerSearch: boolean;
  searchDone: boolean;
  creatingCustomer: boolean;
  saving: boolean;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onServiceChange: (value: string | null) => void;
  onCustomerIdChange: (value: string | null) => void;
  onShowCustomerSearch: (value: boolean) => void;
  onSelectCustomer: (c: CustomerResult) => void;
  onCreateCustomer: () => void;
  onClearSlot: () => void;
  onSave: () => void;
  onDelete: (slotId: string) => void;
  onClose: () => void;
  phonePlaceholder?: string;
}

export default function SlotModal({
  editSlot,
  editName,
  editPhone,
  editNotes,
  editCustomerId,
  editServiceId,
  services,
  customerResults,
  showCustomerSearch,
  searchDone,
  creatingCustomer,
  saving,
  onNameChange,
  onPhoneChange,
  onNotesChange,
  onServiceChange,
  onCustomerIdChange,
  onShowCustomerSearch,
  onSelectCustomer,
  onCreateCustomer,
  onClearSlot,
  onSave,
  onDelete,
  onClose,
  phonePlaceholder = '06 12 34 56 78',
}: SlotModalProps) {
  const locale = useLocale();
  const t = useTranslations('planning');
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full sm:max-w-md p-5 shadow-xl max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">{formatTime(editSlot.start_time, locale)}</h3>
            <p className="text-xs text-gray-400 capitalize">
              {new Date(editSlot.slot_date + 'T00:00:00').toLocaleDateString(toBCP47(locale), { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-400" /></button>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <label className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1.5">
              {t('clientName')}
              {editCustomerId && <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded-full"><UserCheck className="w-2.5 h-2.5" />{t('clientLinked')}</span>}
            </label>
            <div className="relative">
              <input
                type="text"
                value={editName}
                onChange={(e) => onNameChange(e.target.value)}
                onFocus={() => { if (customerResults.length > 0) onShowCustomerSearch(true); }}
                onBlur={() => setTimeout(() => onShowCustomerSearch(false), 200)}
                placeholder={t('searchPlaceholder')}
                maxLength={100}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
              />
              {editName.length >= 2 && !editCustomerId && (
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
              )}
            </div>
            {/* Customer autocomplete dropdown */}
            {showCustomerSearch && searchDone && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                {customerResults.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onMouseDown={() => onSelectCustomer(c)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 transition-colors flex items-center justify-between"
                  >
                    <span className="font-medium text-gray-800">{c.first_name}{c.last_name ? ` ${c.last_name}` : ''}</span>
                    <span className="text-[11px] text-gray-400">{c.phone_number}</span>
                  </button>
                ))}
                {customerResults.length === 0 && editName.trim().length >= 2 && (
                  <div className="px-3 py-2 text-xs text-gray-400">
                    {t('noClientFound')}
                  </div>
                )}
              </div>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">
              {t('phoneLabel')} {editCustomerId ? t('phoneOptional') : t('phoneRequiredHint')}
            </label>
            <input type="tel" value={editPhone} onChange={(e) => { onPhoneChange(e.target.value); if (editCustomerId) onCustomerIdChange(null); }} placeholder={phonePlaceholder} maxLength={20} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" />
          </div>
          {/* Create customer button — shown when name + phone filled but no customer linked */}
          {editName.trim().length >= 2 && editPhone.trim().length >= 6 && !editCustomerId && (
            <button
              type="button"
              onClick={onCreateCustomer}
              disabled={creatingCustomer}
              className="w-full py-2 px-3 rounded-xl border border-dashed border-emerald-300 bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {creatingCustomer ? (
                <><Loader2 className="w-3 h-3 animate-spin" /> {t('creating')}</>
              ) : (
                <><Plus className="w-3 h-3" /> {t('createAsNewClient', { name: editName.trim() })}</>
              )}
            </button>
          )}
          {services.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">{t('serviceLabel')}</label>
              <select value={editServiceId || ''} onChange={(e) => onServiceChange(e.target.value || null)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-white">
                <option value="">{t('serviceNone')}</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">{t('notesLabel')}</label>
            <textarea value={editNotes} onChange={(e) => onNotesChange(e.target.value)} placeholder={t('notesPlaceholder')} maxLength={300} rows={2} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 resize-none" />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button onClick={onSave} disabled={saving} className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t('save')}
          </button>
          <button onClick={() => onDelete(editSlot.id)} className="px-4 py-3 rounded-xl bg-red-50 text-red-500 font-bold text-sm hover:bg-red-100 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {editSlot.client_name && (
          <button
            onClick={onClearSlot}
            className="w-full mt-2 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            {t('clearSlot')}
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}
