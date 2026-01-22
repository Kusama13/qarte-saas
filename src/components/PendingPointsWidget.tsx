'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Check,
  X,
  Clock,
  AlertCircle,
  CheckCircle2,
  ThumbsUp,
  Loader2,
} from 'lucide-react';
import type { PendingVisit } from '@/types';

interface PendingPointsWidgetProps {
  merchantId: string;
}

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

export default function PendingPointsWidget({ merchantId }: PendingPointsWidgetProps) {
  const [visits, setVisits] = useState<PendingVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' });

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

      <div className="overflow-hidden bg-white border border-gray-200 rounded-3xl shadow-xl shadow-gray-100/50">
        {/* Header Section */}
        <div className="relative p-6 border-b border-gray-100 bg-gradient-to-r from-white to-indigo-50/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200">
                <ShieldAlert className="w-6 h-6" />
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
                <p className="text-sm text-gray-500">Qarte Shield - Modération anti-fraude</p>
              </div>
            </div>

            {visits.length > 3 && (
              <div className="hidden sm:flex items-center gap-2">
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
            <div className="divide-y divide-gray-50">
              {visits.map((visit) => (
                <div
                  key={visit.id}
                  className={`group relative flex flex-col sm:flex-row sm:items-center justify-between p-6 transition-all duration-300 hover:bg-gray-50/50 ${
                    processingId === visit.id ? 'opacity-50 pointer-events-none scale-[0.99]' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-lg font-bold shadow-sm">
                        {getInitials(visit.customer?.first_name, visit.customer?.last_name)}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border-2 border-white flex items-center justify-center">
                        <Clock className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900">
                          {visit.customer?.first_name} {visit.customer?.last_name || ''}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                          +{visit.points_earned} pt{visit.points_earned > 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          {formatRelativeTime(visit.visited_at)}
                        </span>
                        {visit.flagged_reason && (
                          <span className="flex items-center gap-1 text-amber-700 font-medium px-2 py-0.5 rounded-full bg-amber-50">
                            <AlertCircle className="w-3 h-3" />
                            {visit.flagged_reason}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 sm:mt-0">
                    <button
                      onClick={() => handleAction(visit.id, 'reject')}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-gray-200"
                    >
                      <X className="w-4 h-4" />
                      Refuser
                    </button>
                    <button
                      onClick={() => handleAction(visit.id, 'confirm')}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl transition-all shadow-sm shadow-emerald-100"
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
