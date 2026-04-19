'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MessageCircleQuestion,
  Store,
  Search,
  Loader2,
  AlertCircle,
  TrendingDown,
  Check,
  Calendar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { formatPhoneForWhatsApp, formatDateTime } from '@/lib/utils';
import {
  BLOCKER_LABELS_FR,
  CONVINCE_LABELS_FR,
  FEATURE_LABELS_FR,
  WANTED_UNAVAILABLE_LABELS_FR,
  BLOCKER_BADGE_CLASSES,
  type ChurnBlocker,
} from '@/lib/churn-survey-config';

interface ChurnSurveyItem {
  id: string;
  merchant_id: string;
  shop_name: string;
  shop_type: string | null;
  user_email: string | null;
  phone: string | null;
  country: string | null;
  merchant_created_at: string | null;
  trial_ends_at: string | null;
  subscription_status: string | null;
  blocker: string;
  missing_feature: string | null;
  features_tested: string[];
  would_convince: string;
  free_comment: string | null;
  bonus_days_granted: number;
  plan_tier_at_churn: string | null;
  features_wanted_unavailable: string[];
  created_at: string;
}

interface Stats {
  blockers: Record<string, number>;
  convinces: Record<string, number>;
  features: Record<string, number>;
  tiers: Record<string, number>;
  wantedUnavailable: Record<string, number>;
  converted: number;
}

const LEGACY_TIER = 'legacy';

const TIER_LABELS: Record<string, string> = {
  fidelity: 'Fidélité 19€',
  all_in: 'Tout-en-un 24€',
  [LEGACY_TIER]: 'Historique',
};

const TIER_BADGE_CLASSES: Record<string, string> = {
  fidelity: 'bg-pink-50 text-pink-700 border-pink-200',
  all_in: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  [LEGACY_TIER]: 'bg-gray-50 text-gray-700 border-gray-200',
};

const blockerLabel = (k: string) => BLOCKER_LABELS_FR[k as ChurnBlocker] || k;
const convinceLabel = (k: string) =>
  CONVINCE_LABELS_FR[k as keyof typeof CONVINCE_LABELS_FR] || k;
const featureLabel = (k: string) =>
  FEATURE_LABELS_FR[k as keyof typeof FEATURE_LABELS_FR] || k;
const wantedLabel = (k: string) =>
  WANTED_UNAVAILABLE_LABELS_FR[k as keyof typeof WANTED_UNAVAILABLE_LABELS_FR] || k;
const blockerBadgeClass = (k: string) =>
  BLOCKER_BADGE_CLASSES[k as ChurnBlocker] || BLOCKER_BADGE_CLASSES.other;
const tierKey = (t: string | null) => t || LEGACY_TIER;

export default function ChurnSurveysAdminPage() {
  const supabase = getSupabase();
  const [surveys, setSurveys] = useState<ChurnSurveyItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterBlocker, setFilterBlocker] = useState<string>('all');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchSurveys = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/admin/churn-surveys', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setSurveys(data.surveys || []);
        setStats(data.stats || null);
      }
    } catch (err) {
      console.error('Error fetching churn surveys:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchSurveys();
  }, [fetchSurveys]);

  const filteredSurveys = useMemo(() => {
    let list = surveys;

    if (filterBlocker !== 'all') {
      list = list.filter((s) => s.blocker === filterBlocker);
    }

    if (filterTier !== 'all') {
      list = list.filter((s) => tierKey(s.plan_tier_at_churn) === filterTier);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.shop_name.toLowerCase().includes(q) ||
          s.user_email?.toLowerCase().includes(q) ||
          s.phone?.includes(q)
      );
    }

    return list;
  }, [surveys, search, filterBlocker, filterTier]);

  const total = surveys.length;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-100">
            <MessageCircleQuestion className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Questionnaires de rétention</h1>
            <p className="text-sm text-gray-500">
              Merchants expirés qui ont complété le churn survey et reçu +2 jours
            </p>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-violet-600" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Total réponses
              </span>
            </div>
            <p className="text-2xl font-black text-gray-900">{total}</p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Convertis
              </span>
            </div>
            <p className="text-2xl font-black text-gray-900">
              {stats.converted}
              <span className="text-sm font-medium text-gray-400 ml-1">
                ({total > 0 ? Math.round((stats.converted / total) * 100) : 0}%)
              </span>
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Raison principale d&apos;abandon
              </span>
            </div>
            <p className="text-sm text-gray-900 font-medium">
              {Object.entries(stats.blockers)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([k, v]) => `${blockerLabel(k)} (${v})`)
                .join(' • ') || '—'}
            </p>
          </div>
        </div>
      )}

      {/* Distribution charts (compact) */}
      {stats && total > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <DistributionCard
              title="Blocages"
              data={stats.blockers}
              labels={BLOCKER_LABELS_FR}
              color="violet"
            />
            <DistributionCard
              title="Ce qui convaincrait"
              data={stats.convinces}
              labels={CONVINCE_LABELS_FR}
              color="indigo"
            />
            <DistributionCard
              title="Features essayées"
              data={stats.features}
              labels={FEATURE_LABELS_FR}
              color="emerald"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <DistributionCard
              title="Tier à l'abandon"
              data={stats.tiers}
              labels={TIER_LABELS}
              color="indigo"
            />
            <DistributionCard
              title="Features Tout-en-un voulues (Fidélité)"
              data={stats.wantedUnavailable}
              labels={WANTED_UNAVAILABLE_LABELS_FR}
              color="violet"
            />
          </div>
        </>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher (nom, email, téléphone)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition-all text-sm"
          />
        </div>
        <select
          value={filterBlocker}
          onChange={(e) => setFilterBlocker(e.target.value)}
          className="h-11 px-4 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none text-sm bg-white"
        >
          <option value="all">Tous les blocages</option>
          {Object.entries(BLOCKER_LABELS_FR).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={filterTier}
          onChange={(e) => setFilterTier(e.target.value)}
          className="h-11 px-4 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none text-sm bg-white"
        >
          <option value="all">Tous les tiers</option>
          {Object.entries(TIER_LABELS).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Results list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
        </div>
      ) : filteredSurveys.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <AlertCircle className="w-10 h-10 mb-3" />
          <p className="text-sm">Aucun questionnaire trouvé</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredSurveys.map((s) => {
            const isExpanded = expandedId === s.id;
            const isConverted =
              s.subscription_status === 'active' || s.subscription_status === 'canceling';
            const hasExtraDetails = !!(s.missing_feature || s.free_comment || s.features_tested.length);

            return (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-colors hover:border-violet-200"
              >
                {/* Compact row — always visible */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : s.id)}
                  className="w-full p-4 text-left hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-violet-50 shrink-0">
                      <Store className="w-4 h-4 text-violet-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900 truncate">{s.shop_name}</p>
                        {isConverted && (
                          <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wide">
                            Converti
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-xs text-gray-500">
                        {s.user_email && <span className="truncate">{s.user_email}</span>}
                        <span className="text-gray-300">•</span>
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                            blockerBadgeClass(s.blocker)
                          }`}
                        >
                          {blockerLabel(s.blocker)}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                            TIER_BADGE_CLASSES[tierKey(s.plan_tier_at_churn)]
                          }`}
                        >
                          {TIER_LABELS[tierKey(s.plan_tier_at_churn)]}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="hidden md:block text-xs text-gray-400">
                        {formatDateTime(s.created_at)}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Detail view — expanded */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 border-t border-gray-100 bg-gray-50/30">
                    {/* Meta info row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-3 pb-4 text-xs text-gray-500">
                      <span className="md:hidden">{formatDateTime(s.created_at)}</span>
                      {s.phone && (
                        <a
                          href={`https://wa.me/${formatPhoneForWhatsApp(s.phone)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-600 hover:underline font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          WhatsApp
                        </a>
                      )}
                      {s.shop_type && (
                        <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 capitalize">
                          {s.shop_type.replace('_', ' ')}
                        </span>
                      )}
                      {s.country && <span>{s.country}</span>}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold">
                        +{s.bonus_days_granted}j bonus
                      </span>
                    </div>

                    {/* Q1 — Blocker */}
                    <div className="mb-3">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                        Q1 — Qu&apos;est-ce qui te bloque pour t&apos;abonner ?
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold ${
                          blockerBadgeClass(s.blocker)
                        }`}
                      >
                        <AlertCircle className="w-3 h-3" />
                        {blockerLabel(s.blocker)}
                      </span>
                    </div>

                    {/* Q2 — Missing feature */}
                    <div className="mb-3">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                        Q2 — Quelle fonctionnalité te manquerait ?
                      </p>
                      {s.missing_feature ? (
                        <div className="p-3 rounded-xl bg-violet-50 border border-violet-100">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{s.missing_feature}</p>
                        </div>
                      ) : (
                        <p className="text-xs italic text-gray-400">Non renseigné</p>
                      )}
                    </div>

                    {/* Q3 — Features tested */}
                    <div className="mb-3">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                        Q3 — Fonctionnalités essayées
                      </p>
                      {s.features_tested.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {s.features_tested.map((f) => (
                            <span
                              key={f}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium"
                            >
                              <Check className="w-3 h-3" />
                              {featureLabel(f)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs italic text-gray-400">Aucune</p>
                      )}
                    </div>

                    {/* Q3bis — Features Tout-en-un voulues (Fidélité merchants) */}
                    {s.features_wanted_unavailable.length > 0 && (
                      <div className="mb-3">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                          Q3bis — Features Tout-en-un qui auraient décidé
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {s.features_wanted_unavailable.map((f) => (
                            <span
                              key={f}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium"
                            >
                              {wantedLabel(f)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Q4 — Would convince */}
                    <div className="mb-3">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                        Q4 — Qu&apos;est-ce qui te convaincrait de t&apos;abonner ?
                      </p>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-semibold">
                        {convinceLabel(s.would_convince)}
                      </span>
                    </div>

                    {/* Free comment */}
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                        Commentaire libre
                      </p>
                      {s.free_comment ? (
                        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{s.free_comment}</p>
                        </div>
                      ) : (
                        <p className="text-xs italic text-gray-400">Aucun</p>
                      )}
                    </div>

                    {!hasExtraDetails && (
                      <p className="mt-3 text-xs italic text-gray-400">
                        Aucun détail optionnel renseigné.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Compact horizontal bar chart for stats distribution
function DistributionCard({
  title,
  data,
  labels,
  color,
}: {
  title: string;
  data: Record<string, number>;
  labels: Record<string, string>;
  color: 'violet' | 'indigo' | 'emerald';
}) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map(([, v]) => v), 1);

  const colorClasses = {
    violet: 'bg-violet-500',
    indigo: 'bg-indigo-500',
    emerald: 'bg-emerald-500',
  };

  return (
    <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">{title}</p>
      {entries.length === 0 ? (
        <p className="text-xs text-gray-400">Aucune donnée</p>
      ) : (
        <div className="space-y-2">
          {entries.map(([key, value]) => (
            <div key={key}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-700 font-medium truncate">
                  {labels[key] || key}
                </span>
                <span className="text-gray-500 font-bold tabular-nums shrink-0 ml-2">{value}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${colorClasses[color]}`}
                  style={{ width: `${(value / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
