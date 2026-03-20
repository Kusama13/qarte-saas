'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
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
  Pencil,
  Ticket,
  Award,
} from 'lucide-react';
import { displayPhoneNumber } from '@/lib/utils';
import { CustomerAdjustTab } from './CustomerAdjustTab';
import { CustomerRewardsTab } from './CustomerRewardsTab';
import { CustomerOffersTab } from './CustomerOffersTab';
import { CustomerHistoryTab } from './CustomerHistoryTab';
import { CustomerDangerZone } from './CustomerDangerZone';

interface CustomerManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  firstName: string;
  lastName: string;
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
  isCagnotte?: boolean;
  currentAmount?: number;
  cagnottePercent?: number;
  cagnotteTier2Percent?: number | null;
  country?: string;
}

type Tab = 'adjust' | 'rewards' | 'offers' | 'history' | 'danger';

export function CustomerManagementModal({
  isOpen,
  onClose,
  firstName,
  lastName,
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
  isCagnotte = false,
  currentAmount = 0,
  cagnottePercent = 0,
  cagnotteTier2Percent,
  country,
}: CustomerManagementModalProps) {
  const t = useTranslations('customerModal');
  const [activeTab, setActiveTab] = useState<Tab>('adjust');
  const [successMessage, setSuccessMessage] = useState('');

  // Name edit state
  const [editingName, setEditingName] = useState(false);
  const [editFirstName, setEditFirstName] = useState(firstName);
  const [editLastName, setEditLastName] = useState(lastName);
  const [savingName, setSavingName] = useState(false);

  // Birthday edit state
  const [editBirthDay, setEditBirthDay] = useState(birthDay?.toString() || '');
  const [editBirthMonth, setEditBirthMonth] = useState(birthMonth?.toString() || '');
  const [savingBirthday, setSavingBirthday] = useState(false);
  const [editingBirthday, setEditingBirthday] = useState(false);

  const MONTHS_SHORT = t('monthsShort').split(',');
  const MONTHS_PICKER = t('monthsPicker').split(',');

  const customerName = `${editFirstName} ${editLastName}`.trim();

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    onSuccess();
    setTimeout(() => {
      setSuccessMessage('');
    }, 2000);
  };

  const showSuccessAndClose = (message: string) => {
    onSuccess();
    handleClose();
  };

  const handleSaveName = async () => {
    const trimmed = editFirstName.trim();
    if (!trimmed) return;
    setSavingName(true);
    try {
      const res = await fetch('/api/customers/update-name', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          first_name: trimmed,
          last_name: editLastName.trim(),
        }),
      });
      if (res.ok) {
        setEditingName(false);
        onSuccess();
      }
    } catch {
      // ignore
    } finally {
      setSavingName(false);
    }
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
    setSuccessMessage('');
    setActiveTab('adjust');
    onClose();
  };

  if (!isOpen) return null;

  const tabs: { key: Tab; label: string; icon: React.ReactNode; activeColor: string }[] = [
    { key: 'adjust', label: t('tabPoints'), icon: <SlidersHorizontal className="w-4 h-4" />, activeColor: 'text-indigo-600 border-indigo-600' },
    { key: 'rewards', label: t('tabRewards'), icon: <Award className="w-4 h-4" />, activeColor: 'text-emerald-600 border-emerald-600' },
    { key: 'offers', label: t('tabOffers'), icon: <Ticket className="w-4 h-4" />, activeColor: 'text-amber-600 border-amber-600' },
    { key: 'history', label: t('tabHistory'), icon: <History className="w-4 h-4" />, activeColor: 'text-indigo-600 border-indigo-600' },
    { key: 'danger', label: t('tabDelete'), icon: <AlertTriangle className="w-4 h-4" />, activeColor: 'text-red-600 border-red-600' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
      <div className="relative w-full max-w-lg lg:max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[92vh] sm:max-h-[85vh] overflow-hidden flex flex-col sm:mx-4">
        <button
          onClick={handleClose}
          className="absolute p-2.5 transition-colors rounded-lg top-2 right-2 hover:bg-gray-100 z-10"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>

        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-start gap-3.5 pr-7">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-sm font-bold text-white">
                {customerName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              {/* Name */}
              {!editingName ? (
                <button
                  onClick={() => { setEditFirstName(firstName); setEditLastName(lastName); setEditingName(true); }}
                  className="flex items-center gap-1.5 group -mt-0.5"
                >
                  <h2 className="text-lg font-bold text-gray-900 truncate leading-tight">{customerName}</h2>
                  <Pencil className="w-3 h-3 text-gray-300 group-hover:text-indigo-500 transition-colors flex-shrink-0" />
                </button>
              ) : (
                <div className="flex items-center gap-1.5 -mt-0.5">
                  <input
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    placeholder={t('firstNamePlaceholder')}
                    className="flex-1 min-w-0 px-2 py-1 rounded-lg border border-gray-200 text-sm font-medium bg-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20 focus:outline-none transition-shadow"
                  />
                  <input
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    placeholder={t('lastNamePlaceholder')}
                    className="flex-1 min-w-0 px-2 py-1 rounded-lg border border-gray-200 text-sm font-medium bg-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20 focus:outline-none transition-shadow"
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={savingName || !editFirstName.trim()}
                    className="p-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 transition-colors"
                  >
                    {savingName ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={() => setEditingName(false)}
                    className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Info pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 text-xs font-medium text-gray-600">
                  <Phone className="w-3 h-3 text-gray-400" />
                  {displayPhoneNumber(phoneNumber)}
                </span>

                {!editingBirthday ? (
                  <button
                    onClick={() => setEditingBirthday(true)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      birthMonth && birthDay
                        ? 'bg-pink-50 text-pink-600 hover:bg-pink-100'
                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                    }`}
                  >
                    <Cake className="w-3 h-3" />
                    {birthMonth && birthDay
                      ? `${birthDay} ${MONTHS_SHORT[birthMonth - 1]}`
                      : t('birthday')}
                    <Pencil className="w-2.5 h-2.5 opacity-40" />
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-pink-50">
                      <Cake className="w-3 h-3 text-pink-400" />
                      <select
                        value={editBirthDay}
                        onChange={(e) => setEditBirthDay(e.target.value)}
                        className="px-1 py-0 rounded border-0 text-xs bg-transparent text-pink-700 focus:outline-none focus:ring-0"
                      >
                        <option value="">{t('dayOption')}</option>
                        {Array.from({ length: 31 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1}</option>
                        ))}
                      </select>
                      <select
                        value={editBirthMonth}
                        onChange={(e) => setEditBirthMonth(e.target.value)}
                        className="px-1 py-0 rounded border-0 text-xs bg-transparent text-pink-700 focus:outline-none focus:ring-0"
                      >
                        <option value="">{t('monthOption')}</option>
                        {MONTHS_PICKER.map((m, i) => (
                          <option key={i + 1} value={i + 1}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={handleSaveBirthday}
                      disabled={savingBirthday}
                      className="p-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 transition-colors"
                    >
                      {savingBirthday ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={() => setEditingBirthday(false)}
                      className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-colors"
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
              aria-label={tab.label}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap min-w-0 ${
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
          {successMessage && (
            <div className="flex items-center gap-2 p-2.5 mb-3 rounded-xl bg-green-50 border border-green-100 animate-in fade-in duration-200">
              <Check className="w-4 h-4 text-green-600 shrink-0" />
              <p className="text-sm font-medium text-green-700">{successMessage}</p>
            </div>
          )}

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
                  isCagnotte={isCagnotte}
                  currentAmount={currentAmount}
                  cagnottePercent={cagnottePercent}
                  cagnotteTier2Percent={cagnotteTier2Percent}
                  tier1Redeemed={tier1Redeemed}
                  country={country}
                />
              )}

              {activeTab === 'rewards' && (
                <CustomerRewardsTab
                  loyaltyCardId={loyaltyCardId}
                  currentStamps={currentStamps}
                  stampsRequired={stampsRequired}
                  tier2Enabled={tier2Enabled}
                  tier2StampsRequired={tier2StampsRequired}
                  tier2RewardDescription={tier2RewardDescription}
                  rewardDescription={rewardDescription}
                  tier1Redeemed={tier1Redeemed}
                  onSuccess={showSuccess}
                  isCagnotte={isCagnotte}
                />
              )}

              {activeTab === 'offers' && (
                <CustomerOffersTab
                  customerId={customerId}
                  merchantId={merchantId}
                  onSuccess={showSuccess}
                />
              )}

              {activeTab === 'history' && (
                <CustomerHistoryTab
                  loyaltyCardId={loyaltyCardId}
                  merchantId={merchantId}
                  tier2Enabled={tier2Enabled}
                  isCagnotte={isCagnotte}
                  country={country}
                />
              )}

              {activeTab === 'danger' && (
                <CustomerDangerZone
                  loyaltyCardId={loyaltyCardId}
                  phoneNumber={phoneNumber}
                  customerName={customerName}
                  onSuccess={showSuccessAndClose}
                />
              )}
        </div>
      </div>
    </div>
  );
}
