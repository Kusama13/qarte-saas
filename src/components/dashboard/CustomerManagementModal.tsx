'use client';

import { useState } from 'react';
import {
  X,
  Loader2,
  Check,
  AlertTriangle,
  SlidersHorizontal,
  History,
  Gift,
  Cake,
  Phone,
} from 'lucide-react';
import { displayPhoneNumber } from '@/lib/utils';
import { CustomerAdjustTab } from './CustomerAdjustTab';
import { CustomerRewardsTab } from './CustomerRewardsTab';
import { CustomerHistoryTab } from './CustomerHistoryTab';
import { CustomerDangerZone } from './CustomerDangerZone';

interface CustomerManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  customerId: string;
  merchantId: string;
  loyaltyCardId: string;
  currentStamps: number;
  stampsRequired: number;
  phoneNumber: string;
  onSuccess: () => void;
  tier2Enabled?: boolean;
  tier2StampsRequired?: number;
  tier2RewardDescription?: string;
  rewardDescription?: string;
  birthMonth?: number | null;
  birthDay?: number | null;
  tier1Redeemed?: boolean;
}

const MONTHS_SHORT = ['janv.','fev.','mars','avr.','mai','juin','juil.','aout','sept.','oct.','nov.','dec.'];
const MONTHS_PICKER = ['Jan','Fev','Mar','Avr','Mai','Juin','Juil','Aout','Sep','Oct','Nov','Dec'];

type Tab = 'adjust' | 'rewards' | 'history' | 'danger';

export function CustomerManagementModal({
  isOpen,
  onClose,
  customerName,
  customerId,
  merchantId,
  loyaltyCardId,
  currentStamps,
  stampsRequired,
  phoneNumber,
  onSuccess,
  tier2Enabled = false,
  tier2StampsRequired,
  tier2RewardDescription,
  rewardDescription,
  birthMonth,
  birthDay,
  tier1Redeemed = false,
}: CustomerManagementModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('adjust');
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Birthday edit state
  const [editBirthDay, setEditBirthDay] = useState(birthDay?.toString() || '');
  const [editBirthMonth, setEditBirthMonth] = useState(birthMonth?.toString() || '');
  const [savingBirthday, setSavingBirthday] = useState(false);
  const [editingBirthday, setEditingBirthday] = useState(false);

  const showSuccess = (message: string) => {
    setSuccess(true);
    setSuccessMessage(message);
    setTimeout(() => {
      onSuccess();
      handleClose();
    }, 1500);
  };

  const handleSaveBirthday = async () => {
    setSavingBirthday(true);
    try {
      const res = await fetch('/api/customers/birthday-admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          birth_month: editBirthMonth ? parseInt(editBirthMonth) : null,
          birth_day: editBirthDay ? parseInt(editBirthDay) : null,
        }),
      });
      if (res.ok) {
        setEditingBirthday(false);
        onSuccess();
      }
    } catch {
      // ignore
    } finally {
      setSavingBirthday(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setSuccessMessage('');
    setActiveTab('adjust');
    onClose();
  };

  if (!isOpen) return null;

  const tabs: { key: Tab; label: string; icon: React.ReactNode; activeColor: string }[] = [
    { key: 'adjust', label: 'Points', icon: <SlidersHorizontal className="w-4 h-4" />, activeColor: 'text-indigo-600 border-indigo-600' },
    { key: 'rewards', label: 'Cadeaux', icon: <Gift className="w-4 h-4" />, activeColor: 'text-emerald-600 border-emerald-600' },
    { key: 'history', label: 'Historique', icon: <History className="w-4 h-4" />, activeColor: 'text-indigo-600 border-indigo-600' },
    { key: 'danger', label: 'Supprimer', icon: <AlertTriangle className="w-4 h-4" />, activeColor: 'text-red-600 border-red-600' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
      <div className="relative w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[92vh] sm:max-h-[85vh] overflow-hidden flex flex-col sm:mx-4">
        <button
          onClick={handleClose}
          className="absolute p-1.5 transition-colors rounded-lg top-2.5 right-2.5 hover:bg-gray-100 z-10"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>

        {/* Header */}
        <div className="px-4 pt-3.5 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5 pr-7">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-indigo-600">
                {customerName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-gray-900 truncate">{customerName}</h2>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <Phone className="w-3 h-3" />
                  {displayPhoneNumber(phoneNumber)}
                </span>
                {!editingBirthday ? (
                  <button
                    onClick={() => setEditingBirthday(true)}
                    className="flex items-center gap-1 text-sm text-gray-400 hover:text-pink-500 transition-colors"
                  >
                    <Cake className="w-3 h-3" />
                    {birthMonth && birthDay
                      ? `${birthDay} ${MONTHS_SHORT[birthMonth - 1]}`
                      : 'Anniversaire'}
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    <Cake className="w-3 h-3 text-pink-400" />
                    <select
                      value={editBirthDay}
                      onChange={(e) => setEditBirthDay(e.target.value)}
                      className="px-1.5 py-0.5 rounded border border-gray-200 text-xs bg-white"
                    >
                      <option value="">Jour</option>
                      {Array.from({ length: 31 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                      ))}
                    </select>
                    <select
                      value={editBirthMonth}
                      onChange={(e) => setEditBirthMonth(e.target.value)}
                      className="px-1.5 py-0.5 rounded border border-gray-200 text-xs bg-white"
                    >
                      <option value="">Mois</option>
                      {MONTHS_PICKER.map((m, i) => (
                        <option key={i + 1} value={i + 1}>{m}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleSaveBirthday}
                      disabled={savingBirthday}
                      className="p-1 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50"
                    >
                      {savingBirthday ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={() => setEditingBirthday(false)}
                      className="p-1 bg-gray-100 text-gray-500 rounded hover:bg-gray-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap min-w-0 ${
                activeTab === tab.key
                  ? `${tab.activeColor} border-b-2`
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {success ? (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-12 h-12 mb-2 rounded-full bg-green-100">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">
                {successMessage}
              </p>
            </div>
          ) : (
            <>
              {activeTab === 'adjust' && (
                <CustomerAdjustTab
                  currentStamps={currentStamps}
                  stampsRequired={stampsRequired}
                  tier2Enabled={tier2Enabled}
                  tier2StampsRequired={tier2StampsRequired}
                  tier2RewardDescription={tier2RewardDescription}
                  rewardDescription={rewardDescription}
                  customerId={customerId}
                  merchantId={merchantId}
                  loyaltyCardId={loyaltyCardId}
                  onSuccess={showSuccess}
                  onClose={handleClose}
                />
              )}

              {activeTab === 'rewards' && (
                <CustomerRewardsTab
                  loyaltyCardId={loyaltyCardId}
                  merchantId={merchantId}
                  currentStamps={currentStamps}
                  stampsRequired={stampsRequired}
                  tier2Enabled={tier2Enabled}
                  tier2StampsRequired={tier2StampsRequired}
                  tier2RewardDescription={tier2RewardDescription}
                  rewardDescription={rewardDescription}
                  tier1Redeemed={tier1Redeemed}
                  birthMonth={birthMonth}
                  birthDay={birthDay}
                  onSuccess={showSuccess}
                />
              )}

              {activeTab === 'history' && (
                <CustomerHistoryTab
                  loyaltyCardId={loyaltyCardId}
                  tier2Enabled={tier2Enabled}
                />
              )}

              {activeTab === 'danger' && (
                <CustomerDangerZone
                  loyaltyCardId={loyaltyCardId}
                  phoneNumber={phoneNumber}
                  customerName={customerName}
                  onSuccess={showSuccess}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
