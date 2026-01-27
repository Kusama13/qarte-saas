'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Shield,
  ShieldOff,
  Check,
  X,
  Clock,
  AlertCircle,
  CheckCircle2,
  ThumbsUp,
  Loader2,
  Phone,
  Footprints,
  ShoppingBag,
  HelpCircle,
} from 'lucide-react';
import type { PendingVisit, LoyaltyMode } from '@/types';

interface PendingPointsWidgetProps {
  merchantId: string;
  loyaltyMode: LoyaltyMode;
  productName?: string | null;
  shieldEnabled: boolean;
  onShieldToggle: (enabled: boolean) => void;
}

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

export default function PendingPointsWidget({ merchantId, loyaltyMode, productName, shieldEnabled, onShieldToggle }: PendingPointsWidgetProps) {
  const [visits, setVisits] = useState<PendingVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' });
  const [showHelp, setShowHelp] = useState(false);

  const fetchVisits = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/visits/moderate?merchant_id=${merchantId}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setVisits(data.visits || []);
    } catch (error) {
      console.error('Error fetching pending visits:', error);
    } finally {
      setLoading(false);
    }
  }, [merchantId]);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const handleAction = async (visitId: string, action: 'confirm' | 'reject') => {
    setProcessingId(visitId);
    try {
      const response = await fetch('/api/visits/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visit_id: visitId,
          action,
          merchant_id: merchantId,
        }),
      });

      if (!response.ok) throw new Error('Action failed');

      setVisits(prev => prev.filter(v => v.id !== visitId));
      showToast(action === 'confirm' ? 'Point validé avec succès' : 'Visite refusée');
    } catch (error) {
      showToast('Une erreur est survenue', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleBulkAction = async (action: 'confirm' | 'reject') => {
    setBulkProcessing(true);
    try {
      const visitIds = visits.map(v => v.id);
      const response = await fetch('/api/visits/moderate', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visit_ids: visitIds,
          action,
          merchant_id: merchantId,
        }),
      });

      if (!response.ok) throw new Error('Bulk action failed');

      const result = await response.json();
      setVisits([]);
      showToast(result.message || (action === 'confirm' ? 'Tous les points validés' : 'Toutes les visites refusées'));
    } catch (error) {
      showToast('Erreur lors du traitement groupé', 'error');
    } finally {
      setBulkProcessing(false);
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);

    const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    if (date >= todayStart) return `Aujourd'hui ${time}`;
    if (date >= yesterdayStart) return `Hier ${time}`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) + ` ${time}`;
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.[0]?.toUpperCase() || '';
    const last = lastName?.[0]?.toUpperCase() || '';
    return first + last || '?';
  };

  return (
    <div className="relative w-full">
      {/* Toast Notification */}
      <div
        className={`fixed top-6 right-6 z-50 transition-all duration-300 transform ${
          toast.show ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'
        }`}
      >
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md ${
            toast.type === 'success'
              ? 'bg-emerald-50/90 border-emerald-200 text-emerald-800'
              : 'bg-rose-50/90 border-rose-200 text-rose-800'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-500" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowHelp(false)}>
          <div
            className="relative w-full max-w-lg mx-4 p-6 bg-white rounded-3xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowHelp(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Qarte Shield</h3>
                <p className="text-sm text-gray-500">Protection anti-fraude</p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600">
                Qarte Shield protège votre programme de fidélité en détectant les comportements suspects.
              </p>

              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <div className="flex items-center gap-2 mb-2">
                  <Footprints className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-bold text-indigo-900">Mode Passage</h4>
                </div>
                <p className="text-sm text-indigo-700">
                  Un client ne peut valider qu&apos;<strong>1 passage par jour</strong>. Toute tentative supplémentaire sera mise en quarantaine.
                </p>
              </div>

              <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingBag className="w-5 h-5 text-orange-600" />
                  <h4 className="font-bold text-orange-900">Mode Article</h4>
                </div>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li>• Maximum <strong>2 scans par jour</strong> par client</li>
                  <li>• Maximum <strong>3 articles par scan</strong></li>
                </ul>
                <p className="text-sm text-orange-700 mt-2">
                  Tout dépassement sera mis en quarantaine pour validation manuelle.
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl">
                <p className="text-sm text-gray-600">
                  <strong>Validez</strong> si le client était réellement présent. <strong>Refusez</strong> en cas de doute ou de fraude suspectée.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="w-full mt-6 py-3 font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-200"
            >
              J&apos;ai compris
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden bg-white border border-gray-200 rounded-3xl shadow-xl shadow-gray-100/50">
        {/* Header Section */}
        <div className="relative p-6 border-b border-gray-100 bg-gradient-to-r from-white to-indigo-50/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`flex items-center justify-center w-12 h-12 rounded-2xl text-white shadow-lg transition-all duration-300 ${shieldEnabled ? 'bg-gradient-to-br from-indigo-600 to-violet-600 shadow-indigo-200' : 'bg-gradient-to-br from-gray-400 to-gray-500 shadow-gray-200'}`}>
                {shieldEnabled ? <Shield className="w-6 h-6" /> : <ShieldOff className="w-6 h-6" />}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  Points en attente
                  {visits.length > 0 && (
                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white animate-pulse">
                      {visits.length}
                    </span>
                  )}
                </h2>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500">Qarte Shield - Modération anti-fraude</p>
                  <button
                    onClick={() => setShowHelp(true)}
                    className="p-1.5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Comment ça fonctionne ?"
                  >
                    <HelpCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Shield Toggle */}
              <div className="flex items-center gap-3">
                <span className={`text-sm font-semibold transition-colors ${shieldEnabled ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {shieldEnabled ? 'Actif' : 'Inactif'}
                </span>
                <button
                  type="button"
                  onClick={() => onShieldToggle(!shieldEnabled)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    shieldEnabled
                      ? 'bg-emerald-500 focus:ring-emerald-500'
                      : 'bg-gray-300 focus:ring-gray-400'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                      shieldEnabled ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {visits.length > 3 && (
                <div className="hidden sm:flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
                  <button
                    onClick={() => handleBulkAction('reject')}
                    disabled={bulkProcessing}
                    className="px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-50"
                  >
                    Tout refuser
                  </button>
                  <button
                    onClick={() => handleBulkAction('confirm')}
                    disabled={bulkProcessing}
                    className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-100 disabled:opacity-50 flex items-center gap-2"
                  >
                    {bulkProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                    Tout valider
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="min-h-[200px]">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-gray-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-1/4" />
                    <div className="h-3 bg-gray-50 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : visits.length > 0 ? (
            <div className="p-4 space-y-0">
              {visits.map((visit) => (
                <div
                  key={visit.id}
                  className={`group relative flex flex-col lg:flex-row lg:items-center justify-between p-6 mb-4 bg-white border border-gray-100 rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-100 ${
                    processingId === visit.id ? 'opacity-50 pointer-events-none scale-[0.98]' : ''
                  }`}
                >
                  <div className="flex items-start md:items-center gap-5">
                    {/* Customer Avatar */}
                    <div className="shrink-0">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xl font-bold shadow-indigo-200 shadow-lg group-hover:scale-110 transition-transform duration-500">
                        {getInitials(visit.customer?.first_name, visit.customer?.last_name)}
                      </div>
                    </div>

                    {/* Information Grid */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-extrabold text-gray-900 text-xl leading-none mb-1.5">
                        {visit.customer?.first_name} {visit.customer?.last_name || ''}
                      </h3>

                      <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm mb-3">
                        {loyaltyMode === 'visit' ? (
                          <>
                            <Footprints className="w-4 h-4" />
                            <span>A tenté de valider un passage</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-4 h-4" />
                            <span>
                              A tenté de valider {visit.points_earned} {visit.points_earned > 1 ? (productName || 'articles') : (productName?.replace(/s$/, '') || 'article')}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500">
                        <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span className="tracking-wide">
                            {visit.customer?.phone_number?.replace(/(\d{2})(?=\d)/g, '$1 ') || '-- -- -- -- --'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span>{formatRelativeTime(visit.visited_at)}</span>
                        </div>
                      </div>

                      {visit.flagged_reason && (
                        <div className="mt-3 flex items-start gap-3 p-3 bg-amber-50/80 border-l-4 border-amber-400 rounded-r-xl">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div className="text-xs leading-relaxed">
                            <span className="block font-bold text-amber-800 uppercase tracking-tight mb-0.5">Alerte sécurité</span>
                            <span className="text-amber-900 font-medium">{visit.flagged_reason}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Section */}
                  <div className="flex items-center gap-3 mt-6 lg:mt-0 lg:ml-6 shrink-0">
                    <button
                      onClick={() => handleAction(visit.id, 'reject')}
                      className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-gray-600 hover:text-rose-600 hover:bg-rose-50 border border-gray-200 hover:border-rose-200 rounded-xl transition-all active:scale-95"
                    >
                      <X className="w-4 h-4" />
                      Refuser
                    </button>
                    <button
                      onClick={() => handleAction(visit.id, 'confirm')}
                      className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-8 py-3 text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-500/30 rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-500/10"
                    >
                      <Check className="w-4 h-4" />
                      Valider
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Tout est en ordre !</h3>
              <p className="text-gray-500 max-w-xs mx-auto">
                Aucune visite suspecte en attente. Votre programme de fidélité est protégé par Qarte Shield.
              </p>
            </div>
          )}
        </div>

        {/* Footer Section */}
        <div className="p-4 bg-gray-50/50 border-t border-gray-100">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
              <ThumbsUp className="w-4 h-4 text-indigo-500" />
            </div>
            <p>
              <span className="font-bold text-gray-700">Conseil :</span> Validez si le client était bien présent. Refusez en cas de doute ou de fraude suspectée.
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Bulk Actions */}
      {visits.length > 3 && (
        <div className="sm:hidden mt-4 flex items-center gap-2">
          <button
            onClick={() => handleBulkAction('reject')}
            disabled={bulkProcessing}
            className="flex-1 py-3 text-sm font-bold text-rose-600 bg-rose-50 rounded-2xl disabled:opacity-50"
          >
            Tout refuser
          </button>
          <button
            onClick={() => handleBulkAction('confirm')}
            disabled={bulkProcessing}
            className="flex-1 py-3 text-sm font-bold bg-indigo-600 text-white rounded-2xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {bulkProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
            Tout valider
          </button>
        </div>
      )}
    </div>
  );
}
