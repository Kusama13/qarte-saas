'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Users,
  Calendar,
  Clock,
} from 'lucide-react';

interface MerchantSms {
  merchant_id: string;
  shop_name: string;
  sent_this_month: number;
  free_remaining: number;
  overage_cost: number;
  period_start: string;
  period_end: string;
}

interface SmsData {
  totalAll: number;
  totalMonth: number;
  totalWeek: number;
  totalFailed: number;
  totalCost: number;
  merchants: MerchantSms[];
}

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

function MetricCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
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
  const filters = (f?.filters as Array<Record<string, unknown>>) || [f];
  return filters.map((entry) => {
    const type = entry.type as string | undefined;
    if (type === 'all') return 'Toutes';
    if (type === 'inactive') return `Inactives ${entry.days}j`;
    if (type === 'new') return `Nouvelles (${entry.days}j)`;
    if (type === 'vip') {
      const parts: string[] = [];
      if (entry.minStamps) parts.push(`${entry.minStamps}+ tampons`);
      if (entry.minAmount) parts.push(`${entry.minAmount}€+ cagnotte`);
      return `VIP (${parts.join(', ') || '—'})`;
    }
    if (type === 'birthday_month') return 'Anniversaires';
    if (type === 'unused_voucher') return `Voucher ${entry.olderThanDays}j+`;
    return type || 'inconnu';
  }).join(' + ');
}

export default function AdminSmsPage() {
  const [tab, setTab] = useState<'overview' | 'review'>('overview');

  const [data, setData] = useState<SmsData | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);

  const [campaigns, setCampaigns] = useState<PendingCampaign[]>([]);
  const [loadingReview, setLoadingReview] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectNoteById, setRejectNoteById] = useState<Record<string, string>>({});
  const [showRejectFormFor, setShowRejectFormFor] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    const res = await fetch('/api/admin/sms');
    if (res.ok) setData(await res.json());
    setLoadingOverview(false);
  }, []);

  const fetchPending = useCallback(async () => {
    setLoadingReview(true);
    try {
      const res = await fetch('/api/admin/sms-campaigns/pending');
      if (res.ok) {
        const body = await res.json();
        setCampaigns(body.campaigns || []);
      }
    } finally {
      setLoadingReview(false);
    }
  }, []);

  useEffect(() => { fetchOverview(); fetchPending(); }, [fetchOverview, fetchPending]);

  const handleApprove = async (id: string) => {
    if (processing) return;
    setProcessing(id);
    try {
      const res = await fetch(`/api/admin/sms-campaigns/${id}/approve`, { method: 'POST' });
      if (res.ok) setCampaigns((prev) => prev.filter((c) => c.id !== id));
      else alert((await res.json().catch(() => ({}))).error || 'Erreur à l\'approbation');
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
        alert((await res.json().catch(() => ({}))).error || 'Erreur au refus');
      }
    } finally {
      setProcessing(null);
    }
  };

  const pendingCount = campaigns.length;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">SMS</h1>
          <p className="text-xs text-gray-400">Consommation et modération des campagnes</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 bg-gray-100 rounded-xl w-fit">
        <button
          onClick={() => setTab('overview')}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            tab === 'overview' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Aperçu
        </button>
        <button
          onClick={() => setTab('review')}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            tab === 'review' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Modération
          {pendingCount > 0 && (
            <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {tab === 'overview' && (
        loadingOverview ? (
          <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : !data ? (
          <div className="text-center text-gray-400 py-20">Erreur de chargement</div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <MetricCard label="Total SMS" value={data.totalAll} />
              <MetricCard label="Ce mois" value={data.totalMonth} />
              <MetricCard label="Cette semaine" value={data.totalWeek} />
              <MetricCard label="Échecs" value={data.totalFailed} sub={data.totalCost > 0 ? `Coût total: ${data.totalCost.toFixed(2)}€` : undefined} />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 sm:px-5 py-3 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-800">SMS par merchant (cycle de facturation)</h2>
              </div>
              {data.merchants.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Aucun SMS envoyé ce mois</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50">
                        <th className="px-4 py-2">Merchant</th>
                        <th className="px-4 py-2">Cycle</th>
                        <th className="px-4 py-2 text-right">Envoyés</th>
                        <th className="px-4 py-2 text-right">Restant gratuit</th>
                        <th className="px-4 py-2 text-right">Dépassement</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.merchants.map((m) => (
                        <tr key={m.merchant_id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                          <td className="px-4 py-2.5 text-sm font-medium text-gray-700">{m.shop_name}</td>
                          <td className="px-4 py-2.5 text-xs text-gray-400">
                            {new Date(m.period_start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            {' — '}
                            {new Date(m.period_end).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </td>
                          <td className="px-4 py-2.5 text-sm text-right text-gray-600">{m.sent_this_month}</td>
                          <td className="px-4 py-2.5 text-sm text-right">
                            <span className={`font-medium ${m.free_remaining === 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                              {m.free_remaining}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-sm text-right">
                            {m.overage_cost > 0 ? (
                              <span className="font-medium text-amber-600">{m.overage_cost.toFixed(2)}€</span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )
      )}

      {tab === 'review' && (
        loadingReview ? (
          <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : campaigns.length === 0 ? (
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
                    <p className="text-sm font-bold text-gray-900">{c.merchant?.shop_name || '—'}</p>
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
        )
      )}
    </div>
  );
}
