'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Users,
  Calendar,
  Clock,
} from 'lucide-react';

interface PendingCampaign {
  id: string;
  merchant_id: string;
  merchant: { id: string; shop_name: string; country: string | null } | null;
  body: string;
  audience_filter: Record<string, unknown>;
  recipient_count: number | null;
  scheduled_at: string | null;
  cost_cents: number | null;
  created_at: string;
  kind: string;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatCostCents(cents: number | null): string {
  if (cents == null) return '—';
  return (cents / 100).toFixed(2) + ' €';
}

function describeFilter(f: Record<string, unknown>): string {
  const type = f.type as string | undefined;
  if (type === 'all') return 'Toutes les clientes';
  if (type === 'inactive') return `Inactives depuis ${f.days}j`;
  if (type === 'new') return `Nouvelles (${f.days}j)`;
  if (type === 'vip') {
    const parts = [];
    if (f.minStamps) parts.push(`${f.minStamps}+ tampons`);
    if (f.minAmount) parts.push(`${f.minAmount}€+ cagnotte`);
    return `VIP (${parts.join(', ') || '—'})`;
  }
  if (type === 'birthday_month') return 'Anniversaires du mois';
  if (type === 'unused_voucher') return `Récompense non utilisée ${f.olderThanDays}j+`;
  return type || 'Filtre inconnu';
}

export default function AdminSmsReviewPage() {
  const [campaigns, setCampaigns] = useState<PendingCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectNoteById, setRejectNoteById] = useState<Record<string, string>>({});
  const [showRejectFormFor, setShowRejectFormFor] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/sms-campaigns/pending');
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const handleApprove = async (id: string) => {
    if (processing) return;
    setProcessing(id);
    try {
      const res = await fetch(`/api/admin/sms-campaigns/${id}/approve`, { method: 'POST' });
      if (res.ok) {
        setCampaigns((prev) => prev.filter((c) => c.id !== id));
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Erreur à l\'approbation');
      }
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    if (processing) return;
    const note = (rejectNoteById[id] || '').trim();
    if (note.length < 3) { alert('Motif requis (3+ caractères)'); return; }
    setProcessing(id);
    try {
      const res = await fetch(`/api/admin/sms-campaigns/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      });
      if (res.ok) {
        setCampaigns((prev) => prev.filter((c) => c.id !== id));
        setShowRejectFormFor(null);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Erreur au refus');
      }
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Modération SMS</h1>
          <p className="text-xs text-gray-400">Campagnes custom en attente de validation</p>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-700">Rien à modérer</p>
          <p className="text-xs text-gray-400 mt-1">Aucune campagne en attente.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {c.merchant?.shop_name || '—'}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {c.merchant?.country || 'FR'} · Soumis {formatDate(c.created_at)}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold">
                  <Clock className="w-3 h-3" />
                  En attente
                </span>
              </div>

              <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 mb-3">
                <p className="text-xs text-gray-800 whitespace-pre-wrap">{c.body}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-600">{c.recipient_count ?? 0} destinataires</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400">Filtre:</span>
                  <span className="text-gray-600 font-medium">{describeFilter(c.audience_filter)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-600">{formatDate(c.scheduled_at)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400">Coût:</span>
                  <span className="text-gray-600 font-bold">{formatCostCents(c.cost_cents)}</span>
                </div>
              </div>

              {showRejectFormFor === c.id ? (
                <div className="space-y-2">
                  <textarea
                    value={rejectNoteById[c.id] || ''}
                    onChange={(e) => setRejectNoteById((p) => ({ ...p, [c.id]: e.target.value }))}
                    placeholder="Motif du refus (visible par le merchant)…"
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReject(c.id)}
                      disabled={processing === c.id}
                      className="flex-1 py-2 bg-red-500 text-white font-bold text-xs rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {processing === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                      Confirmer le refus
                    </button>
                    <button
                      onClick={() => setShowRejectFormFor(null)}
                      disabled={processing === c.id}
                      className="px-4 py-2 bg-gray-100 text-gray-600 font-bold text-xs rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(c.id)}
                    disabled={processing === c.id}
                    className="flex-1 py-2 bg-emerald-500 text-white font-bold text-xs rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {processing === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Approuver
                  </button>
                  <button
                    onClick={() => setShowRejectFormFor(c.id)}
                    disabled={processing === c.id}
                    className="flex-1 py-2 bg-red-50 text-red-600 font-bold text-xs rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 border border-red-200"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Refuser
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
