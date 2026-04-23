'use client';

import { Fragment, useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Users,
  Calendar,
  Clock,
  AlertTriangle,
  History,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface MerchantSms {
  merchant_id: string;
  shop_name: string;
  plan_tier?: 'fidelity' | 'all_in';
  quota?: number;
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

interface SmsFailure {
  id: string;
  merchant_id: string;
  shop_name: string;
  phone_to: string;
  sms_type: string;
  error_message: string;
  created_at: string;
}

interface HistoryLog {
  id: string;
  source: 'sms' | 'essai';
  merchant_id: string;
  shop_name: string;
  phone_to: string | null;
  sms_type: string;
  category: string;
  message_body: string;
  status: string;
  error_message: string | null;
  created_at: string;
}

const CATEGORY_CONFIG: Record<string, { label: string; pill: string }> = {
  rappel:       { label: 'Rappel RDV',   pill: 'bg-indigo-100 text-indigo-700' },
  confirmation: { label: 'Confirmation', pill: 'bg-blue-100 text-blue-700' },
  fidelite:     { label: 'Fidélité',     pill: 'bg-rose-100 text-rose-700' },
  conversion:   { label: 'Conversion',   pill: 'bg-amber-100 text-amber-700' },
  avis:         { label: 'Avis',         pill: 'bg-emerald-100 text-emerald-700' },
  campagne:     { label: 'Campagne',     pill: 'bg-violet-100 text-violet-700' },
  essai:        { label: 'Essai',        pill: 'bg-orange-100 text-orange-700' },
};

const SMS_TYPE_LABELS: Record<string, string> = {
  reminder_j1: 'J-1',
  reminder_j0: 'J-0',
  confirmation_no_deposit: 'Confirmation',
  confirmation_deposit: 'Dépôt',
  booking_moved: 'Déplacé',
  booking_cancelled: 'Annulé',
  birthday: 'Anniversaire',
  referral_reward: 'Parrainage',
  near_reward: 'Proche récomp.',
  welcome: 'Bienvenue',
  inactive_reminder: 'Relance',
  voucher_expiry: 'Expiration',
  referral_invite: 'Invitation',
  review_request: 'Avis client',
  campaign: 'Campagne',
  celebration_fidelity: 'Check-in fidélité',
  celebration_planning: 'Check-in planning',
  celebration_vitrine: 'Check-in vitrine',
  checkin_nudge: 'Check-in nudge',
  checkin_combo: 'Check-in combo',
  trial_pre_loss: 'Pré-churn',
  churn_survey: 'Sondage',
};

const CATEGORY_FILTERS = [
  { key: 'all',          label: 'Tous' },
  { key: 'rappel',       label: 'Rappel' },
  { key: 'confirmation', label: 'Confirmation' },
  { key: 'fidelite',     label: 'Fidélité' },
  { key: 'conversion',   label: 'Conversion' },
  { key: 'avis',         label: 'Avis' },
  { key: 'campagne',     label: 'Campagne' },
  { key: 'essai',        label: 'Essai' },
];

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
  const [tab, setTab] = useState<'overview' | 'review' | 'failures' | 'history'>('overview');

  const [data, setData] = useState<SmsData | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);

  const [campaigns, setCampaigns] = useState<PendingCampaign[]>([]);
  const [loadingReview, setLoadingReview] = useState(true);

  const [failures, setFailures] = useState<SmsFailure[]>([]);
  const [loadingFailures, setLoadingFailures] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectNoteById, setRejectNoteById] = useState<Record<string, string>>({});
  const [showRejectFormFor, setShowRejectFormFor] = useState<string | null>(null);

  const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyStats, setHistoryStats] = useState<Record<string, number>>({});
  const [historyCategory, setHistoryCategory] = useState('all');
  const [historyPage, setHistoryPage] = useState(0);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

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

  const fetchFailures = useCallback(async () => {
    setLoadingFailures(true);
    try {
      const res = await fetch('/api/admin/sms/failures');
      if (res.ok) {
        const body = await res.json();
        setFailures(body.failures || []);
      }
    } finally {
      setLoadingFailures(false);
    }
  }, []);

  const fetchHistory = useCallback(async (cat: string, pg: number) => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/admin/sms/history?category=${cat}&page=${pg}`);
      if (res.ok) {
        const body = await res.json();
        setHistoryLogs(body.logs || []);
        setHistoryTotal(body.total || 0);
        setHistoryStats(body.stats || {});
      }
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => { fetchOverview(); fetchPending(); }, [fetchOverview, fetchPending]);
  useEffect(() => { if (tab === 'failures' && failures.length === 0 && !loadingFailures) fetchFailures(); }, [tab, failures.length, loadingFailures, fetchFailures]);
  useEffect(() => { if (tab === 'history') fetchHistory(historyCategory, historyPage); }, [tab, historyCategory, historyPage, fetchHistory]);

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
        <button
          onClick={() => setTab('failures')}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            tab === 'failures' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Échecs
          {data && data.totalFailed > 0 && (
            <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold">
              {data.totalFailed}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('history')}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            tab === 'history' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          Historique
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
              <button
                onClick={() => setTab('failures')}
                className="text-left bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:border-rose-200 hover:bg-rose-50/30 transition-colors"
              >
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  Échecs
                  {data.totalFailed > 0 && <AlertTriangle className="w-3 h-3 text-rose-500" />}
                </p>
                <p className={`text-2xl font-bold mt-1 ${data.totalFailed > 0 ? 'text-rose-600' : 'text-gray-900'}`}>{data.totalFailed}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {data.totalFailed > 0 ? 'Voir détails →' : data.totalCost > 0 ? `Coût total: ${data.totalCost.toFixed(2)}€` : '—'}
                </p>
              </button>
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
                        <th className="px-4 py-2">Tier</th>
                        <th className="px-4 py-2">Cycle</th>
                        <th className="px-4 py-2 text-right">Envoyés / Quota</th>
                        <th className="px-4 py-2 text-right">Restant gratuit</th>
                        <th className="px-4 py-2 text-right">Dépassement</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.merchants.map((m) => (
                        <tr key={m.merchant_id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                          <td className="px-4 py-2.5 text-sm font-medium text-gray-700">{m.shop_name}</td>
                          <td className="px-4 py-2.5 text-xs">
                            <span className={`inline-flex px-2 py-0.5 rounded-md font-semibold ${
                              m.plan_tier === 'fidelity'
                                ? 'bg-slate-100 text-slate-700'
                                : 'bg-violet-100 text-violet-700'
                            }`}>
                              {m.plan_tier === 'fidelity' ? 'Fidélité' : 'Tout-en-un'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-gray-400">
                            {new Date(m.period_start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            {' — '}
                            {new Date(m.period_end).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </td>
                          <td className="px-4 py-2.5 text-sm text-right text-gray-600">{m.sent_this_month} / {m.quota || 100}</td>
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

      {tab === 'history' && (
        <div>
          {/* Category filters */}
          <div className="flex gap-1.5 flex-wrap mb-4">
            {CATEGORY_FILTERS.map(({ key, label }) => {
              const count = historyStats[key] ?? 0;
              const active = historyCategory === key;
              return (
                <button
                  key={key}
                  onClick={() => { setHistoryCategory(key); setHistoryPage(0); setExpandedLogId(null); }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors border ${
                    active
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {label}
                  {count > 0 && (
                    <span className={`ml-1.5 ${active ? 'text-gray-300' : 'text-gray-400'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {loadingHistory ? (
            <div className="flex items-center justify-center min-h-[40vh]">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : historyLogs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-700">Aucun SMS dans cette catégorie</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 sm:px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-bold text-gray-800">
                  {historyTotal} SMS
                  {historyCategory !== 'all' && CATEGORY_CONFIG[historyCategory] && (
                    <span className="ml-2 font-normal text-gray-400">— {CATEGORY_CONFIG[historyCategory].label}</span>
                  )}
                </p>
                <p className="text-xs text-gray-400">
                  Page {historyPage + 1} / {Math.max(1, Math.ceil(historyTotal / 50))}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50">
                      <th className="px-4 py-2 whitespace-nowrap">Date</th>
                      <th className="px-4 py-2">Merchant</th>
                      <th className="px-4 py-2">Catégorie</th>
                      <th className="px-4 py-2">Type</th>
                      <th className="px-4 py-2">Tél</th>
                      <th className="px-4 py-2">Statut</th>
                      <th className="px-4 py-2">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyLogs.map((log) => {
                      const catCfg = CATEGORY_CONFIG[log.category];
                      const isExpanded = expandedLogId === log.id;
                      return (
                        <Fragment key={log.id}>
                          <tr
                            className={`border-b border-gray-50 last:border-0 cursor-pointer ${
                              isExpanded ? 'bg-gray-50' : 'hover:bg-gray-50/50'
                            }`}
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          >
                            <td className="px-4 py-2.5 text-xs text-gray-400 whitespace-nowrap">
                              {new Date(log.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                              {' '}
                              <span className="text-gray-300">
                                {new Date(log.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-sm font-medium text-gray-700 max-w-[140px] truncate" title={log.shop_name}>
                              {log.shop_name}
                            </td>
                            <td className="px-4 py-2.5">
                              {catCfg && (
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${catCfg.pill}`}>
                                  {catCfg.label}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-xs text-gray-500">
                              {SMS_TYPE_LABELS[log.sms_type] || log.sms_type}
                            </td>
                            <td className="px-4 py-2.5 text-xs text-gray-500 tabular-nums">
                              {log.phone_to || <span className="text-gray-300">—</span>}
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                log.status === 'failed'
                                  ? 'bg-rose-100 text-rose-700'
                                  : log.status === 'skipped'
                                  ? 'bg-gray-100 text-gray-500'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {log.status === 'failed' ? 'Échec' : log.status === 'skipped' ? 'Ignoré' : 'Envoyé'}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-xs text-gray-600 max-w-[200px]">
                              <div className="flex items-center gap-1">
                                <span className="truncate">{log.message_body}</span>
                                {isExpanded ? (
                                  <ChevronUp className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                ) : (
                                  <ChevronDown className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                )}
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-gray-50 border-b border-gray-100">
                              <td colSpan={7} className="px-4 py-3">
                                <div className="bg-white rounded-xl border border-gray-100 p-3">
                                  <p className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed">{log.message_body}</p>
                                  {log.error_message && (
                                    <p className="mt-2 text-xs text-rose-600 font-medium">
                                      Erreur : {log.error_message}
                                    </p>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {historyTotal > 50 && (
                <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                  <button
                    disabled={historyPage === 0}
                    onClick={() => setHistoryPage((p) => p - 1)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                  >
                    ← Précédent
                  </button>
                  <span className="text-xs text-gray-400">
                    {historyPage * 50 + 1}–{Math.min((historyPage + 1) * 50, historyTotal)} / {historyTotal}
                  </span>
                  <button
                    disabled={(historyPage + 1) * 50 >= historyTotal}
                    onClick={() => setHistoryPage((p) => p + 1)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                  >
                    Suivant →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'failures' && (
        loadingFailures ? (
          <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : failures.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-700">Aucun échec SMS sur 30j</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-800">Échecs SMS (30 derniers jours)</h2>
              <button
                onClick={fetchFailures}
                className="text-xs font-medium text-gray-500 hover:text-gray-700"
              >
                Rafraîchir
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50">
                    <th className="px-4 py-2">Merchant</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Téléphone</th>
                    <th className="px-4 py-2">Erreur</th>
                    <th className="px-4 py-2 whitespace-nowrap">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {failures.map((f) => (
                    <tr key={f.id} className="border-b border-gray-50 last:border-0 hover:bg-rose-50/30">
                      <td className="px-4 py-2.5 text-sm font-medium text-gray-700 max-w-[160px] truncate" title={f.shop_name}>{f.shop_name}</td>
                      <td className="px-4 py-2.5 text-xs">
                        <span className="inline-flex px-2 py-0.5 rounded-md font-semibold bg-gray-100 text-gray-600">{f.sms_type}</span>
                      </td>
                      <td className="px-4 py-2.5 text-sm text-gray-600 tabular-nums">{f.phone_to}</td>
                      <td className="px-4 py-2.5 text-xs text-rose-700 max-w-[300px]" title={f.error_message}>
                        <span className="line-clamp-2">{f.error_message}</span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-400 whitespace-nowrap">{formatDate(f.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
}
