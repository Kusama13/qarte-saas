'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Loader2,
  Check,
  Trash2,
  Ban,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  History,
  Gift,
  Trophy,
  Cake,
  Undo2,
  Phone,
} from 'lucide-react';
import { Button, Input, Textarea } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { formatDateTime, displayPhoneNumber } from '@/lib/utils';

interface Visit {
  id: string;
  visited_at: string;
  points_earned: number;
}

interface PointAdjustment {
  id: string;
  created_at: string;
  adjustment: number;
  reason: string | null;
}

interface Redemption {
  id: string;
  redeemed_at: string;
  stamps_used: number;
  tier: number;
}

interface ActiveVoucher {
  id: string;
  reward_description: string;
  expires_at: string;
  source: string;
  is_used: boolean;
  created_at: string;
}

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
  const [adjustment, setAdjustment] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // History state
  const [visits, setVisits] = useState<Visit[]>([]);
  const [adjustments, setAdjustments] = useState<PointAdjustment[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(true);

  // Rewards state
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [lastRedemption, setLastRedemption] = useState<Redemption | null>(null);
  const [rewardsLoading, setRewardsLoading] = useState(false);
  const [activeVoucher, setActiveVoucher] = useState<ActiveVoucher | null>(null);
  const [birthdayGiftEnabled, setBirthdayGiftEnabled] = useState(false);
  const [birthdayGiftDescription, setBirthdayGiftDescription] = useState('');
  const [voucherLoading, setVoucherLoading] = useState(false);

  // Birthday edit state
  const [editBirthDay, setEditBirthDay] = useState(birthDay?.toString() || '');
  const [editBirthMonth, setEditBirthMonth] = useState(birthMonth?.toString() || '');
  const [savingBirthday, setSavingBirthday] = useState(false);
  const [editingBirthday, setEditingBirthday] = useState(false);

  // Danger zone state
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [banConfirm, setBanConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [banning, setBanning] = useState(false);

  useEffect(() => {
    if (isOpen && activeTab === 'history') {
      fetchHistory();
    }
  }, [isOpen, activeTab, loyaltyCardId]);

  useEffect(() => {
    if (isOpen && activeTab === 'rewards') {
      fetchRewardsData();
    }
  }, [isOpen, activeTab, loyaltyCardId]);

  const fetchRewardsData = async () => {
    setRewardsLoading(true);
    try {
      const [redemptionResult, voucherResult, merchantResult] = await Promise.all([
        supabase
          .from('redemptions')
          .select('id, redeemed_at, stamps_used, tier')
          .eq('loyalty_card_id', loyaltyCardId)
          .order('redeemed_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('vouchers')
          .select('id, reward_description, expires_at, source, is_used, created_at')
          .eq('loyalty_card_id', loyaltyCardId)
          .eq('source', 'birthday')
          .eq('is_used', false)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('merchants')
          .select('birthday_gift_enabled, birthday_gift_description')
          .eq('id', merchantId)
          .single(),
      ]);
      setLastRedemption(redemptionResult.data);
      setActiveVoucher(voucherResult.data);
      if (merchantResult.data) {
        setBirthdayGiftEnabled(merchantResult.data.birthday_gift_enabled || false);
        setBirthdayGiftDescription(merchantResult.data.birthday_gift_description || '');
      }
    } catch {
      // ignore
    } finally {
      setRewardsLoading(false);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const [visitsResult, adjustmentsResult, redemptionsResult] = await Promise.all([
        supabase
          .from('visits')
          .select('id, visited_at, points_earned')
          .eq('loyalty_card_id', loyaltyCardId)
          .order('visited_at', { ascending: false })
          .limit(50),
        supabase
          .from('point_adjustments')
          .select('id, created_at, adjustment, reason')
          .eq('loyalty_card_id', loyaltyCardId)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('redemptions')
          .select('id, redeemed_at, stamps_used, tier')
          .eq('loyalty_card_id', loyaltyCardId)
          .order('redeemed_at', { ascending: false })
          .limit(50),
      ]);

      setVisits(visitsResult.data || []);
      setAdjustments(adjustmentsResult.data || []);
      setRedemptions(redemptionsResult.data || []);
    } catch {
      // ignore
    } finally {
      setHistoryLoading(false);
    }
  };

  if (!isOpen) return null;

  const maxAdjustment = stampsRequired - 1 - currentStamps;
  const newStamps = Math.min(Math.max(0, currentStamps + adjustment), stampsRequired - 1);

  // Reward availability
  const isTier1Ready = currentStamps >= stampsRequired;
  const isTier2Ready = tier2Enabled && tier2StampsRequired ? currentStamps >= tier2StampsRequired : false;
  const canRedeemTier1 = isTier1Ready && !tier1Redeemed;
  const canRedeemTier2 = isTier2Ready;

  const handleSubmit = async () => {
    if (adjustment === 0) {
      setError('Veuillez saisir un ajustement');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/adjust-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          merchant_id: merchantId,
          loyalty_card_id: loyaltyCardId,
          adjustment,
          reason: reason.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'ajustement');
      }

      showSuccess('Points ajustes !');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'ajustement');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (tier: 1 | 2) => {
    setRedeemLoading(true);
    setError('');

    try {
      const response = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loyalty_card_id: loyaltyCardId,
          tier,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la validation');
      }

      showSuccess(`Recompense palier ${tier} validee !`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la validation');
    } finally {
      setRedeemLoading(false);
    }
  };

  const handleCancelReward = async () => {
    if (!cancelConfirm) {
      setError('Veuillez confirmer l\'annulation');
      return;
    }

    setCancelLoading(true);
    setError('');

    try {
      const response = await fetch('/api/rewards/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loyalty_card_id: loyaltyCardId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'annulation');
      }

      showSuccess('Recompense annulee !');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'annulation');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleCreateBirthdayVoucher = async () => {
    setVoucherLoading(true);
    setError('');

    try {
      const response = await fetch('/api/vouchers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loyalty_card_id: loyaltyCardId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la creation');
      }

      showSuccess('Cadeau anniversaire offert !');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la creation');
    } finally {
      setVoucherLoading(false);
    }
  };

  const showSuccess = (message: string) => {
    setSuccess(true);
    setSuccessMessage(message);
    setTimeout(() => {
      onSuccess();
      handleClose();
    }, 1500);
  };

  const handleDeleteCustomer = async () => {
    if (!deleteConfirm) {
      setError('Veuillez confirmer la suppression');
      return;
    }

    setDeleting(true);
    setError('');

    try {
      const response = await fetch('/api/customers/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loyalty_card_id: loyaltyCardId,
          ban_number: false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      showSuccess('Client supprime !');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const handleBanNumber = async () => {
    if (!banConfirm) {
      setError('Veuillez confirmer le bannissement');
      return;
    }

    setBanning(true);
    setError('');

    try {
      const response = await fetch('/api/customers/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loyalty_card_id: loyaltyCardId,
          ban_number: true,
          phone_number: phoneNumber,
          customer_name: customerName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du bannissement');
      }

      showSuccess('Numero banni !');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du bannissement');
    } finally {
      setBanning(false);
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
    setAdjustment(0);
    setReason('');
    setError('');
    setSuccess(false);
    setSuccessMessage('');
    setDeleteConfirm(false);
    setBanConfirm(false);
    setCancelConfirm(false);
    setActiveTab('adjust');
    onClose();
  };

  // Combine and sort history items
  const historyItems = [
    ...visits.map((v) => ({ type: 'visit' as const, date: v.visited_at, points: v.points_earned, id: v.id, tier: undefined as number | undefined, reason: undefined as string | null | undefined })),
    ...adjustments.map((a) => ({
      type: 'adjustment' as const,
      date: a.created_at,
      points: a.adjustment,
      reason: a.reason,
      id: a.id,
      tier: undefined as number | undefined,
    })),
    ...redemptions.map((r) => ({
      type: 'redemption' as const,
      date: r.redeemed_at,
      points: r.stamps_used,
      id: r.id,
      tier: r.tier,
      reason: undefined as string | null | undefined,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
              {/* ─── Adjust Tab ─── */}
              {activeTab === 'adjust' && (
                <div className="space-y-3.5">
                  {/* Progress display */}
                  {tier2Enabled && tier2StampsRequired ? (
                    <div className="space-y-2">
                      <TierProgress
                        icon={<Gift className={`w-4 h-4 ${currentStamps >= stampsRequired ? 'text-emerald-500' : 'text-indigo-500'}`} />}
                        label="Palier 1"
                        description={rewardDescription || 'Recompense'}
                        current={Math.min(currentStamps, stampsRequired)}
                        required={stampsRequired}
                        reached={currentStamps >= stampsRequired}
                        reachedBadgeClass="text-emerald-600 bg-emerald-50"
                        reachedTextClass="text-emerald-600"
                        barClass="bg-emerald-500"
                        barBaseClass="bg-indigo-500"
                      />
                      <TierProgress
                        icon={<Trophy className={`w-4 h-4 ${currentStamps >= tier2StampsRequired ? 'text-violet-500' : 'text-gray-400'}`} />}
                        label="Palier 2"
                        description={tier2RewardDescription || 'Recompense palier 2'}
                        current={currentStamps}
                        required={tier2StampsRequired}
                        reached={currentStamps >= tier2StampsRequired}
                        reachedBadgeClass="text-violet-600 bg-violet-50"
                        reachedTextClass="text-violet-600"
                        barClass="bg-violet-500"
                        barBaseClass="bg-gray-300"
                      />
                      {adjustment !== 0 && (
                        <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-indigo-700 font-medium">Apres ajustement</span>
                            <span className={`font-bold ${adjustment > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {newStamps} points ({adjustment > 0 ? '+' : ''}{adjustment})
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-gray-50">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Actuellement</span>
                        <span className="font-semibold text-gray-900">
                          {currentStamps} / {stampsRequired} passages
                        </span>
                      </div>
                      {adjustment !== 0 && (
                        <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-gray-200">
                          <span className="text-gray-600">Apres ajustement</span>
                          <span className={`font-semibold ${adjustment > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {newStamps} / {stampsRequired} passages
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {error && activeTab === 'adjust' && (
                    <div className="p-3 text-sm text-red-700 bg-red-50 rounded-xl">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-700">
                      Nombre de points
                    </label>
                    <Input
                      type="number"
                      placeholder="Ex: 2 ou -3"
                      value={adjustment === 0 ? '' : adjustment}
                      onChange={(e) => {
                        let val = parseInt(e.target.value) || 0;
                        if (val < -currentStamps) val = -currentStamps;
                        if (val > maxAdjustment) val = maxAdjustment;
                        setAdjustment(val);
                      }}
                      className="text-center text-lg"
                    />
                    <p className="mt-1 text-xs text-gray-400">
                      Positif pour ajouter, negatif pour retirer (max {stampsRequired - 1} au total)
                    </p>
                  </div>

                  <Textarea
                    label="Raison (optionnel)"
                    placeholder="Ex: Erreur de scan, geste commercial..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    maxLength={100}
                    showCount
                  />

                  <div className="flex gap-3">
                    <Button variant="ghost" onClick={handleClose} className="flex-1" disabled={loading}>
                      Annuler
                    </Button>
                    <Button onClick={handleSubmit} loading={loading} disabled={adjustment === 0} className="flex-1">
                      Valider
                    </Button>
                  </div>
                </div>
              )}

              {/* ─── Rewards Tab ─── */}
              {activeTab === 'rewards' && (
                <div className="space-y-3.5">
                  {rewardsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                    </div>
                  ) : (
                    <>
                      {/* Tier status cards */}
                      <div className="space-y-2.5">
                        {/* Tier 1 */}
                        <div className={`p-3 rounded-xl border ${
                          canRedeemTier1 ? 'border-emerald-200 bg-emerald-50' :
                          tier1Redeemed ? 'border-gray-200 bg-gray-50' :
                          'border-gray-100 bg-gray-50'
                        }`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <Gift className={`w-3.5 h-3.5 ${canRedeemTier1 ? 'text-emerald-600' : tier1Redeemed ? 'text-gray-400' : 'text-indigo-500'}`} />
                              <span className="text-sm font-semibold text-gray-900">
                                {tier2Enabled ? 'Palier 1' : 'Recompense'}
                              </span>
                              <span className="text-xs text-gray-400">
                                {Math.min(currentStamps, stampsRequired)}/{stampsRequired}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mb-1.5">{rewardDescription || 'Recompense fidelite'}</p>

                          {/* Progress bar */}
                          <div className="h-1 bg-gray-200 rounded-full overflow-hidden mb-2.5">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isTier1Ready ? 'bg-emerald-500' : 'bg-indigo-500'
                              }`}
                              style={{ width: `${Math.min((currentStamps / stampsRequired) * 100, 100)}%` }}
                            />
                          </div>

                          {/* Status + action */}
                          {canRedeemTier1 ? (
                            <Button
                              onClick={() => handleRedeem(1)}
                              loading={redeemLoading}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-sm"
                            >
                              <Gift className="w-4 h-4 mr-1.5" />
                              Valider la recompense
                            </Button>
                          ) : tier1Redeemed ? (
                            <div className="flex items-center gap-1.5 text-sm text-gray-500">
                              <Check className="w-4 h-4 text-gray-400" />
                              <span>Deja utilisee dans ce cycle</span>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400">
                              Encore {stampsRequired - currentStamps} passage{stampsRequired - currentStamps > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>

                        {/* Tier 2 (if enabled) */}
                        {tier2Enabled && tier2StampsRequired && (
                          <div className={`p-3 rounded-xl border ${
                            canRedeemTier2 ? 'border-violet-200 bg-violet-50' : 'border-gray-100 bg-gray-50'
                          }`}>
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-1.5">
                                <Trophy className={`w-3.5 h-3.5 ${canRedeemTier2 ? 'text-violet-600' : 'text-gray-400'}`} />
                                <span className="text-sm font-semibold text-gray-900">Palier 2</span>
                                <span className="text-xs text-gray-400">
                                  {currentStamps}/{tier2StampsRequired}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mb-1.5">{tier2RewardDescription || 'Recompense palier 2'}</p>

                            <div className="h-1 bg-gray-200 rounded-full overflow-hidden mb-2.5">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  canRedeemTier2 ? 'bg-violet-500' : 'bg-gray-300'
                                }`}
                                style={{ width: `${Math.min((currentStamps / tier2StampsRequired) * 100, 100)}%` }}
                              />
                            </div>

                            {canRedeemTier2 ? (
                              <Button
                                onClick={() => handleRedeem(2)}
                                loading={redeemLoading}
                                className="w-full bg-violet-600 hover:bg-violet-700 text-sm"
                              >
                                <Trophy className="w-4 h-4 mr-1.5" />
                                Valider la recompense palier 2
                              </Button>
                            ) : (
                              <div className="text-sm text-gray-400">
                                Encore {tier2StampsRequired - currentStamps} passage{tier2StampsRequired - currentStamps > 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {error && activeTab === 'rewards' && (
                        <div className="p-3 text-sm text-red-700 bg-red-50 rounded-xl">
                          {error}
                        </div>
                      )}

                      {/* Cancel last reward */}
                      {lastRedemption && (
                        <div className="border-t border-gray-100 pt-3">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Derniere recompense
                          </p>
                          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-1.5">
                                {lastRedemption.tier === 2 ? (
                                  <Trophy className="w-4 h-4 text-violet-600" />
                                ) : (
                                  <Gift className="w-4 h-4 text-emerald-600" />
                                )}
                                <span className="text-sm font-medium text-gray-900">
                                  {tier2Enabled ? `Palier ${lastRedemption.tier}` : 'Recompense'}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {formatDateTime(lastRedemption.redeemed_at)}
                              </span>
                            </div>

                            <label className="flex items-center gap-2 mb-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={cancelConfirm}
                                onChange={(e) => setCancelConfirm(e.target.checked)}
                                className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                              />
                              <span className="text-xs text-amber-700">
                                Confirmer l&apos;annulation
                              </span>
                            </label>

                            <Button
                              onClick={handleCancelReward}
                              loading={cancelLoading}
                              disabled={!cancelConfirm}
                              variant="outline"
                              className="w-full text-sm border-amber-200 text-amber-700 hover:bg-amber-100"
                            >
                              <Undo2 className="w-4 h-4 mr-1.5" />
                              Annuler cette recompense
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Birthday voucher section — only show when actionable */}
                      {birthdayGiftEnabled && (activeVoucher || (birthMonth && birthDay)) && (
                        <div className="border-t border-gray-100 pt-3">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Cadeau anniversaire
                          </p>
                          {activeVoucher ? (
                            <div className="p-2.5 rounded-xl bg-pink-50 border border-pink-100">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <Cake className="w-4 h-4 text-pink-500" />
                                <span className="text-sm font-medium text-gray-900">
                                  {activeVoucher.reward_description}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500">
                                Expire le {formatDateTime(activeVoucher.expires_at).split(' a ')[0]}
                              </p>
                              <div className="flex items-center gap-1.5 mt-2 text-xs text-pink-600 font-medium">
                                <Check className="w-3.5 h-3.5" />
                                Cadeau actif — en attente d&apos;utilisation
                              </div>
                            </div>
                          ) : (
                            <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                              <div className="flex items-center gap-1.5 mb-1">
                                <Cake className="w-3.5 h-3.5 text-pink-400" />
                                <span className="text-sm text-gray-600">
                                  {birthdayGiftDescription || 'Cadeau anniversaire'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 mb-2">
                                Anniversaire : {birthDay} {MONTHS_SHORT[(birthMonth || 1) - 1]} — Aucun cadeau actif
                              </p>
                              <Button
                                onClick={handleCreateBirthdayVoucher}
                                loading={voucherLoading}
                                variant="outline"
                                className="w-full text-sm border-pink-200 text-pink-700 hover:bg-pink-50"
                              >
                                <Cake className="w-4 h-4 mr-1.5" />
                                Offrir le cadeau anniversaire
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ─── History Tab ─── */}
              {activeTab === 'history' && (
                <div className="space-y-3">
                  {historyLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                    </div>
                  ) : historyItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <History className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">Aucun historique</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                          {historyItems.length} entree{historyItems.length > 1 ? 's' : ''}
                        </p>
                        <button
                          onClick={() => setHistoryExpanded(!historyExpanded)}
                          className="text-sm text-indigo-600 flex items-center gap-1"
                        >
                          {historyExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          {historyExpanded ? 'Reduire' : 'Voir tout'}
                        </button>
                      </div>

                      <ul className="space-y-1.5">
                        {(historyExpanded ? historyItems : historyItems.slice(0, 5)).map((item) => {
                          const isRedemption = item.type === 'redemption';
                          const isAdjustment = item.type === 'adjustment';

                          const getBgColor = () => {
                            if (isRedemption) return item.tier === 2 ? 'bg-violet-50' : 'bg-emerald-50';
                            if (isAdjustment) return 'bg-amber-50';
                            return 'bg-indigo-50';
                          };

                          const getIconBgColor = () => {
                            if (isRedemption) return item.tier === 2 ? 'bg-violet-100' : 'bg-emerald-100';
                            if (isAdjustment) return 'bg-amber-100';
                            return 'bg-indigo-100';
                          };

                          const getIcon = () => {
                            if (isRedemption) {
                              return item.tier === 2
                                ? <Trophy className="w-4 h-4 text-violet-600" />
                                : <Gift className="w-4 h-4 text-emerald-600" />;
                            }
                            if (isAdjustment) return <SlidersHorizontal className="w-4 h-4 text-amber-600" />;
                            return <Check className="w-4 h-4 text-indigo-600" />;
                          };

                          const getLabel = () => {
                            if (isRedemption) {
                              const tierLabel = tier2Enabled ? ` palier ${item.tier}` : '';
                              return `Cadeau${tierLabel} utilise`;
                            }
                            if (isAdjustment) return 'Ajustement manuel';
                            return 'Passage';
                          };

                          return (
                            <li
                              key={item.id}
                              className={`flex items-center justify-between p-2 rounded-lg ${getBgColor()}`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${getIconBgColor()}`}>
                                  {getIcon()}
                                </div>
                                <div className="min-w-0">
                                  <p className={`text-sm font-medium truncate ${isRedemption ? 'text-emerald-700' : 'text-gray-900'}`}>
                                    {getLabel()}
                                  </p>
                                  <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3 flex-shrink-0" />
                                    {formatDateTime(item.date)}
                                  </p>
                                  {isAdjustment && item.reason && (
                                    <p className="text-xs text-gray-400 italic mt-0.5 truncate">{item.reason}</p>
                                  )}
                                </div>
                              </div>
                              {!isRedemption ? (
                                <span
                                  className={`text-sm font-bold px-2 py-1 rounded-lg flex-shrink-0 ml-2 ${
                                    item.points > 0
                                      ? 'text-green-700 bg-green-100'
                                      : 'text-red-700 bg-red-100'
                                  }`}
                                >
                                  {item.points > 0 ? '+' : ''}
                                  {item.points}
                                </span>
                              ) : (
                                <span className={`text-sm font-bold px-2 py-1 rounded-lg flex-shrink-0 ml-2 ${item.tier === 2 ? 'text-violet-700 bg-violet-100' : 'text-emerald-700 bg-emerald-100'}`}>
                                  ✓
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </>
                  )}
                </div>
              )}

              {/* ─── Danger Zone Tab ─── */}
              {activeTab === 'danger' && (
                <div className="space-y-3.5">
                  <div className="p-2.5 bg-red-50 border border-red-100 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                      <p className="text-xs text-red-700">
                        Ces actions sont irreversibles.
                      </p>
                    </div>
                  </div>

                  {error && activeTab === 'danger' && (
                    <div className="p-3 text-sm text-red-700 bg-red-50 rounded-xl">
                      {error}
                    </div>
                  )}

                  {/* Delete Customer */}
                  <div className="p-3 border border-gray-200 rounded-xl space-y-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">Supprimer le client</p>
                        <p className="text-xs text-gray-500">Carte et historique supprimes</p>
                      </div>
                    </div>

                    <label className="flex items-center gap-2.5 p-2 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={deleteConfirm}
                        onChange={(e) => setDeleteConfirm(e.target.checked)}
                        className="w-4 h-4 rounded border-red-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-xs text-red-700 font-medium">
                        Je confirme vouloir supprimer ce client
                      </span>
                    </label>

                    <Button
                      onClick={handleDeleteCustomer}
                      loading={deleting}
                      disabled={!deleteConfirm}
                      className="w-full bg-red-600 hover:bg-red-700 text-sm"
                    >
                      <Trash2 className="w-4 h-4 mr-1.5" />
                      Supprimer definitivement
                    </Button>
                  </div>

                  {/* Ban Number */}
                  <div className="p-3 border border-gray-200 rounded-xl space-y-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <Ban className="w-3.5 h-3.5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">Bannir ce numero</p>
                        <p className="text-xs text-gray-500">
                          Bloque {displayPhoneNumber(phoneNumber)}
                        </p>
                      </div>
                    </div>

                    <label className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-orange-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={banConfirm}
                        onChange={(e) => setBanConfirm(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-xs text-gray-700">
                        Je confirme vouloir bannir ce numero
                      </span>
                    </label>

                    <Button
                      onClick={handleBanNumber}
                      loading={banning}
                      disabled={!banConfirm}
                      variant="outline"
                      className="w-full border-orange-200 text-orange-700 hover:bg-orange-50 text-sm"
                    >
                      <Ban className="w-4 h-4 mr-1.5" />
                      Bannir et supprimer
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tier Progress Sub-component ───
function TierProgress({
  icon,
  label,
  description,
  current,
  required,
  reached,
  reachedBadgeClass,
  reachedTextClass,
  barClass,
  barBaseClass,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  current: number;
  required: number;
  reached: boolean;
  reachedBadgeClass: string;
  reachedTextClass: string;
  barClass: string;
  barBaseClass: string;
}) {
  return (
    <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</span>
        {reached && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${reachedBadgeClass}`}>
            Atteint
          </span>
        )}
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500 text-xs">{description}</span>
        <span className={`font-semibold ${reached ? reachedTextClass : 'text-gray-900'}`}>
          {current}/{required}
        </span>
      </div>
      <div className="h-1 bg-gray-200 rounded-full mt-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${reached ? barClass : barBaseClass}`}
          style={{ width: `${Math.min((current / required) * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}
