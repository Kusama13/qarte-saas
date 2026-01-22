'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Minus,
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
} from 'lucide-react';
import { Button, Input, Textarea } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { formatDateTime } from '@/lib/utils';

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
}

type Tab = 'adjust' | 'history' | 'danger';

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
}: CustomerManagementModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('adjust');
  const [adjustment, setAdjustment] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // History state
  const [visits, setVisits] = useState<Visit[]>([]);
  const [adjustments, setAdjustments] = useState<PointAdjustment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(true);

  // Danger zone state
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [banConfirm, setBanConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [banning, setBanning] = useState(false);

  useEffect(() => {
    if (isOpen && activeTab === 'history') {
      fetchHistory();
    }
  }, [isOpen, activeTab, loyaltyCardId]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      // Fetch visits
      const { data: visitsData } = await supabase
        .from('visits')
        .select('id, visited_at, points_earned')
        .eq('loyalty_card_id', loyaltyCardId)
        .order('visited_at', { ascending: false })
        .limit(50);

      // Fetch adjustments
      const { data: adjustmentsData } = await supabase
        .from('point_adjustments')
        .select('id, created_at, adjustment, reason')
        .eq('loyalty_card_id', loyaltyCardId)
        .order('created_at', { ascending: false })
        .limit(50);

      setVisits(visitsData || []);
      setAdjustments(adjustmentsData || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleQuickAdjust = (value: number) => {
    setAdjustment(value);
  };

  const handleSubmit = async () => {
    if (adjustment === 0) {
      setError('Veuillez sélectionner un ajustement');
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

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'ajustement');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (deleteConfirm !== 'SUPPRIMER') {
      setError('Veuillez taper SUPPRIMER pour confirmer');
      return;
    }

    setDeleting(true);
    setError('');

    try {
      // Delete visits first
      await supabase.from('visits').delete().eq('loyalty_card_id', loyaltyCardId);

      // Delete adjustments
      await supabase.from('point_adjustments').delete().eq('loyalty_card_id', loyaltyCardId);

      // Delete redemptions
      await supabase.from('redemptions').delete().eq('loyalty_card_id', loyaltyCardId);

      // Delete loyalty card
      await supabase.from('loyalty_cards').delete().eq('id', loyaltyCardId);

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1500);
    } catch (err) {
      console.error('Delete error:', err);
      setError('Erreur lors de la suppression');
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
      // Add to banned_numbers table
      const { error: banError } = await supabase.from('banned_numbers').insert({
        phone_number: phoneNumber,
        merchant_id: merchantId,
        reason: `Banni par le commerçant - Client: ${customerName}`,
      });

      if (banError && !banError.message.includes('duplicate')) {
        throw banError;
      }

      // Delete the loyalty card and related data
      await supabase.from('visits').delete().eq('loyalty_card_id', loyaltyCardId);
      await supabase.from('point_adjustments').delete().eq('loyalty_card_id', loyaltyCardId);
      await supabase.from('redemptions').delete().eq('loyalty_card_id', loyaltyCardId);
      await supabase.from('loyalty_cards').delete().eq('id', loyaltyCardId);

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1500);
    } catch (err) {
      console.error('Ban error:', err);
      setError('Erreur lors du bannissement');
    } finally {
      setBanning(false);
    }
  };

  const handleClose = () => {
    setAdjustment(0);
    setReason('');
    setError('');
    setSuccess(false);
    setDeleteConfirm('');
    setBanConfirm(false);
    setActiveTab('adjust');
    onClose();
  };

  const newStamps = Math.max(0, currentStamps + adjustment);

  // Combine and sort history items
  const historyItems = [
    ...visits.map((v) => ({ type: 'visit' as const, date: v.visited_at, points: v.points_earned, id: v.id })),
    ...adjustments.map((a) => ({
      type: 'adjustment' as const,
      date: a.created_at,
      points: a.adjustment,
      reason: a.reason,
      id: a.id,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
        <button
          onClick={handleClose}
          className="absolute p-2 transition-colors rounded-lg top-4 right-4 hover:bg-gray-100 z-10"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Gestion client</h2>
          <p className="text-gray-600">{customerName}</p>
          <p className="text-sm text-gray-400">{phoneNumber}</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('adjust')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              activeTab === 'adjust'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Ajuster
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <History className="w-4 h-4" />
            Historique
          </button>
          <button
            onClick={() => setActiveTab('danger')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              activeTab === 'danger'
                ? 'text-red-600 border-b-2 border-red-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Supprimer
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-green-100">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-lg font-medium text-gray-900">
                Opération réussie !
              </p>
            </div>
          ) : (
            <>
              {/* Adjust Tab */}
              {activeTab === 'adjust' && (
                <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-gray-50">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Actuellement</span>
                      <span className="font-semibold text-gray-900">
                        {currentStamps} / {stampsRequired} passages
                      </span>
                    </div>
                    {adjustment !== 0 && (
                      <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-gray-200">
                        <span className="text-gray-600">Après ajustement</span>
                        <span className={`font-semibold ${adjustment > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {newStamps} / {stampsRequired} passages
                        </span>
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="p-3 text-sm text-red-700 bg-red-50 rounded-xl">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="block mb-3 text-sm font-medium text-gray-700">
                      Ajustement rapide
                    </label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => handleQuickAdjust(1)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                          adjustment === 1
                            ? 'bg-green-600 text-white'
                            : 'bg-green-50 text-green-700 hover:bg-green-100'
                        }`}
                      >
                        <Plus className="w-5 h-5" />
                        +1 point
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAdjust(-1)}
                        disabled={currentStamps === 0}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                          adjustment === -1
                            ? 'bg-red-600 text-white'
                            : 'bg-red-50 text-red-700 hover:bg-red-100'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <Minus className="w-5 h-5" />
                        -1 point
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Ou entrez une valeur
                    </label>
                    <Input
                      type="number"
                      placeholder="Ex: 2 ou -3"
                      value={adjustment === 0 ? '' : adjustment}
                      onChange={(e) => setAdjustment(parseInt(e.target.value) || 0)}
                      className="text-center text-lg"
                    />
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

              {/* History Tab */}
              {activeTab === 'history' && (
                <div className="space-y-4">
                  {historyLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                    </div>
                  ) : historyItems.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <History className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>Aucun historique</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                          {historyItems.length} entrée{historyItems.length > 1 ? 's' : ''}
                        </p>
                        <button
                          onClick={() => setHistoryExpanded(!historyExpanded)}
                          className="text-sm text-indigo-600 flex items-center gap-1"
                        >
                          {historyExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          {historyExpanded ? 'Réduire' : 'Voir tout'}
                        </button>
                      </div>

                      <ul className="space-y-2">
                        {(historyExpanded ? historyItems : historyItems.slice(0, 5)).map((item) => (
                          <li
                            key={item.id}
                            className={`flex items-center justify-between p-3 rounded-xl ${
                              item.type === 'visit' ? 'bg-indigo-50' : 'bg-amber-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                  item.type === 'visit' ? 'bg-indigo-100' : 'bg-amber-100'
                                }`}
                              >
                                {item.type === 'visit' ? (
                                  <Check className="w-4 h-4 text-indigo-600" />
                                ) : (
                                  <SlidersHorizontal className="w-4 h-4 text-amber-600" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {item.type === 'visit' ? 'Passage' : 'Ajustement manuel'}
                                </p>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDateTime(item.date)}
                                </p>
                                {item.type === 'adjustment' && item.reason && (
                                  <p className="text-xs text-gray-400 italic mt-0.5">{item.reason}</p>
                                )}
                              </div>
                            </div>
                            <span
                              className={`text-sm font-bold px-2 py-1 rounded-lg ${
                                item.points > 0
                                  ? 'text-green-700 bg-green-100'
                                  : 'text-red-700 bg-red-100'
                              }`}
                            >
                              {item.points > 0 ? '+' : ''}
                              {item.points}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}

              {/* Danger Zone Tab */}
              {activeTab === 'danger' && (
                <div className="space-y-6">
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-red-900">Zone dangereuse</p>
                        <p className="text-sm text-red-700 mt-1">
                          Ces actions sont irréversibles. Procédez avec précaution.
                        </p>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 text-sm text-red-700 bg-red-50 rounded-xl">
                      {error}
                    </div>
                  )}

                  {/* Delete Customer */}
                  <div className="p-4 border border-gray-200 rounded-xl space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                        <Trash2 className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Supprimer le client</p>
                        <p className="text-sm text-gray-500">
                          Supprime la carte et tout l&apos;historique
                        </p>
                      </div>
                    </div>

                    <Input
                      placeholder='Tapez "SUPPRIMER" pour confirmer'
                      value={deleteConfirm}
                      onChange={(e) => setDeleteConfirm(e.target.value)}
                      className="text-center"
                    />

                    <Button
                      onClick={handleDeleteCustomer}
                      loading={deleting}
                      disabled={deleteConfirm !== 'SUPPRIMER'}
                      className="w-full bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer définitivement
                    </Button>
                  </div>

                  {/* Ban Number */}
                  <div className="p-4 border border-gray-200 rounded-xl space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                        <Ban className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Bannir ce numéro</p>
                        <p className="text-sm text-gray-500">
                          Bloque le numéro {phoneNumber} de votre commerce
                        </p>
                      </div>
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={banConfirm}
                        onChange={(e) => setBanConfirm(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-700">
                        Je confirme vouloir bannir ce numéro
                      </span>
                    </label>

                    <Button
                      onClick={handleBanNumber}
                      loading={banning}
                      disabled={!banConfirm}
                      variant="outline"
                      className="w-full border-orange-200 text-orange-700 hover:bg-orange-50"
                    >
                      <Ban className="w-4 h-4 mr-2" />
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
