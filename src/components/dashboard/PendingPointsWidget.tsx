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
  Loader2,
  Phone,
  Footprints,
  HelpCircle,
} from 'lucide-react';
import type { PendingVisit } from '@/types';

interface PendingPointsWidgetProps {
  merchantId: string;
  shieldEnabled: boolean;
  onShieldToggle: (enabled: boolean) => void;
}

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

export default function PendingPointsWidget({ merchantId, shieldEnabled, onShieldToggle }: PendingPointsWidgetProps) {
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
      showToast(action === 'confirm' ? 'Point validé' : 'Visite refusée');
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
      showToast('Erreur lors du traitement', 'error');
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

  // Don't render anything while loading or if no pending visits
  if (loading) {
    return null;
  }

  if (visits.length === 0) {
    return null;
  }

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
                  <h4 className="font-bold text-indigo-900">Protection anti-fraude</h4>
                </div>
                <p className="text-sm text-indigo-700">
                  Un client ne peut valider qu&apos;<strong>1 passage par jour</strong>. Toute tentative supplémentaire sera mise en quarantaine pour validation manuelle.
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

      <div className="overflow-hidden bg-white border border-gray-200 rounded-2xl shadow-lg">
        {/* Compact Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-rose-50 to-orange-50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-md">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                Points en attente
                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white">
                  {visits.length}
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHelp(true)}
              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Comment ça fonctionne ?"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            {visits.length > 2 && (
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={() => handleBulkAction('reject')}
                  disabled={bulkProcessing}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  Tout refuser
                </button>
                <button
                  onClick={() => handleBulkAction('confirm')}
                  disabled={bulkProcessing}
                  className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-all disabled:opacity-50 flex items-center gap-1"
                >
                  {bulkProcessing && <Loader2 className="w-3 h-3 animate-spin" />}
                  Tout valider
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Visits List - Compact */}
        <div className="divide-y divide-gray-100">
          {visits.map((visit) => (
            <div
              key={visit.id}
              className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                processingId === visit.id ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-sm font-bold shrink-0">
                  {getInitials(visit.customer?.first_name, visit.customer?.last_name)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {visit.customer?.first_name} {visit.customer?.last_name || ''}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(visit.visited_at)}
                    </span>
                    {visit.flagged_reason && (
                      <span className="flex items-center gap-1 text-amber-600 font-medium">
                        <AlertCircle className="w-3 h-3" />
                        {visit.flagged_reason}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <button
                  onClick={() => handleAction(visit.id, 'reject')}
                  className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                  title="Refuser"
                >
                  <X className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleAction(visit.id, 'confirm')}
                  className="p-2 text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-all shadow-sm"
                  title="Valider"
                >
                  <Check className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Bulk Actions */}
        {visits.length > 2 && (
          <div className="sm:hidden flex items-center gap-2 p-3 border-t border-gray-100 bg-gray-50">
            <button
              onClick={() => handleBulkAction('reject')}
              disabled={bulkProcessing}
              className="flex-1 py-2 text-sm font-semibold text-rose-600 bg-white border border-rose-200 rounded-lg disabled:opacity-50"
            >
              Tout refuser
            </button>
            <button
              onClick={() => handleBulkAction('confirm')}
              disabled={bulkProcessing}
              className="flex-1 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {bulkProcessing && <Loader2 className="w-3 h-3 animate-spin" />}
              Tout valider
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
