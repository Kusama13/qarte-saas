'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Trophy, Save, Loader2, Check, Download, X, Share2, ChevronDown, Users, Sparkles, Calendar, TrendingUp, Info, Pencil, Trash2 } from 'lucide-react';
import { useMerchant } from '@/contexts/MerchantContext';
import { useDashboardSave } from '@/hooks/useDashboardSave';
import { useTranslations } from 'next-intl';
import { formatContestMonth } from '@/lib/utils';
import type { MerchantContest } from '@/types';
import ContestWinnerStory from '@/components/marketing/ContestWinnerStory';
import ContestAnnouncementStory from '@/components/marketing/ContestAnnouncementStory';
import PlanUpgradeCTA from '@/components/dashboard/PlanUpgradeCTA';
import { getPlanFeatures } from '@/lib/plan-tiers';

const PRIZE_SUGGESTIONS: Record<string, string[]> = {
  coiffeur: ['Une coupe + brushing offerts', 'Un soin capillaire complet offert', '-50% sur la prochaine prestation', 'Un bon de 30€'],
  barbier: ['Un forfait coupe + barbe offert', 'Un soin barbe premium offert', '-50% sur la prochaine prestation', 'Un bon de 30€'],
  institut_beaute: ['Un soin visage complet offert', 'Un forfait corps + visage offert', '-50% sur la prochaine prestation', 'Un bon de 30€'],
  onglerie: ['Une pose complète offerte', 'Un forfait manucure + pédicure offert', '-50% sur la prochaine prestation', 'Un bon de 30€'],
  spa: ['Un massage 1h offert', 'Un forfait détente complet offert', '-50% sur la prochaine prestation', 'Un bon de 50€'],
  estheticienne: ['Un soin complet offert', 'Un forfait visage premium offert', '-50% sur la prochaine prestation', 'Un bon de 30€'],
  tatouage: ['Une retouche complète offerte', 'Un piercing offert', '-20% sur le prochain tatouage', 'Un bon de 50€'],
  autre: ['Une prestation offerte', '-50% sur la prochaine visite', 'Un bon de 30€', 'Un cadeau VIP'],
};

const RECENT_WINNER_DAYS = 30;
const PLAN_DEFAULT_MONTHS = 6;
const PLAN_EXTRA_MONTHS = 6;

interface AnalyticsData {
  currentMonthBookings: number;
  avgBaseline: number;
  boost: number;
  hasBaseline: boolean;
}

interface PlannedPrize {
  contest_month: string;
  prize_description: string;
}

function daysUntilNextFirst(): number {
  const now = new Date();
  const nextFirst = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return Math.max(0, Math.ceil((nextFirst.getTime() - now.getTime()) / 86_400_000));
}

function nextMonthLabel(locale: 'fr' | 'en'): string {
  const next = new Date();
  next.setMonth(next.getMonth() + 1, 1);
  return next.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { month: 'long' });
}

function buildUpcomingMonths(count: number): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = 1; i <= count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return out;
}

export default function ContestPage() {
  const { merchant } = useMerchant();
  const { saving, saved, save } = useDashboardSave();
  const t = useTranslations('contest');

  const [contestEnabled, setContestEnabled] = useState(false);
  const [defaultPrize, setDefaultPrize] = useState('');
  const [participants, setParticipants] = useState(0);
  const [participantNames, setParticipantNames] = useState<string[]>([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [currentMonth, setCurrentMonth] = useState('');
  const [contests, setContests] = useState<MerchantContest[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [plannedPrizes, setPlannedPrizes] = useState<PlannedPrize[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showExtraMonths, setShowExtraMonths] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const [storyContest, setStoryContest] = useState<MerchantContest | null>(null);
  const [showAnnounceStory, setShowAnnounceStory] = useState(false);
  const storyRef = useRef<HTMLDivElement>(null);
  const announceRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!merchant) return;
    setContestEnabled(merchant.contest_enabled || false);
    setDefaultPrize(merchant.contest_prize || '');
  }, [merchant]);

  const fetchData = useCallback(async () => {
    if (!merchant?.id) return;
    setLoadingData(true);
    try {
      const [partRes, histRes, anaRes, prizesRes] = await Promise.all([
        fetch(`/api/contest/participants?merchantId=${merchant.id}`),
        fetch(`/api/contest?merchantId=${merchant.id}`),
        fetch(`/api/contest/analytics?merchantId=${merchant.id}`),
        fetch(`/api/contest/prizes?merchantId=${merchant.id}`),
      ]);
      if (partRes.ok) {
        const data = await partRes.json();
        setParticipants(data.participants || 0);
        setParticipantNames(data.names || []);
        setCurrentMonth(data.month || '');
      }
      if (histRes.ok) setContests((await histRes.json()).contests || []);
      if (anaRes.ok) setAnalytics(await anaRes.json());
      if (prizesRes.ok) setPlannedPrizes((await prizesRes.json()).prizes || []);
    } catch { /* silent */ }
    setLoadingData(false);
  }, [merchant?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const persistToggleAndDefault = useCallback(async (overrideEnabled?: boolean, overrideDefault?: string) => {
    if (!merchant) return;
    const finalEnabled = overrideEnabled ?? contestEnabled;
    const finalDefault = overrideDefault ?? defaultPrize;
    save(async () => {
      const res = await fetch('/api/contest', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: merchant.id,
          contestEnabled: finalEnabled,
          contestPrize: finalEnabled ? finalDefault.trim() || null : null,
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      if (overrideEnabled !== undefined) setContestEnabled(overrideEnabled);
    });
  }, [merchant, contestEnabled, defaultPrize, save]);

  const upsertMonthlyPrize = useCallback(async (month: string, prize: string) => {
    if (!merchant) return false;
    try {
      const res = await fetch('/api/contest/prizes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId: merchant.id, month, prize }),
      });
      if (!res.ok) return false;
      setPlannedPrizes((prev) => {
        const existing = prev.find((p) => p.contest_month === month);
        if (existing) return prev.map((p) => p.contest_month === month ? { ...p, prize_description: prize } : p);
        return [...prev, { contest_month: month, prize_description: prize }].sort((a, b) => a.contest_month.localeCompare(b.contest_month));
      });
      return true;
    } catch { return false; }
  }, [merchant]);

  const deleteMonthlyPrize = useCallback(async (month: string) => {
    if (!merchant) return false;
    try {
      const res = await fetch('/api/contest/prizes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId: merchant.id, month }),
      });
      if (!res.ok) return false;
      setPlannedPrizes((prev) => prev.filter((p) => p.contest_month !== month));
      return true;
    } catch { return false; }
  }, [merchant]);

  const downloadStory = async (ref: React.RefObject<HTMLDivElement | null>, filename: string) => {
    if (!ref.current) return;
    setDownloading(true);
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(ref.current, { pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch { /* silent */ }
    setDownloading(false);
  };

  // Lot effectif du mois courant : prix planifié → fallback default
  const currentEffectivePrize = useMemo(() => {
    const planned = plannedPrizes.find((p) => p.contest_month === currentMonth);
    return planned?.prize_description || defaultPrize;
  }, [plannedPrizes, currentMonth, defaultPrize]);

  const currentPlannedPrize = useMemo(
    () => plannedPrizes.find((p) => p.contest_month === currentMonth)?.prize_description || '',
    [plannedPrizes, currentMonth],
  );

  const { recentWinner, archivedContests } = useMemo(() => {
    const latest = contests.find((c) => c.winner_name && c.drawn_at);
    if (!latest || !latest.drawn_at) return { recentWinner: null, archivedContests: contests };
    const ageDays = (Date.now() - new Date(latest.drawn_at).getTime()) / 86_400_000;
    if (ageDays > RECENT_WINNER_DAYS) return { recentWinner: null, archivedContests: contests };
    return { recentWinner: latest, archivedContests: contests.filter((c) => c.id !== latest.id) };
  }, [contests]);

  const daysLeft = useMemo(() => daysUntilNextFirst(), []);
  const monthLabel = useMemo(() => nextMonthLabel(merchant?.locale === 'en' ? 'en' : 'fr'), [merchant?.locale]);

  const upcomingMonths = useMemo(
    () => buildUpcomingMonths(showExtraMonths ? PLAN_DEFAULT_MONTHS + PLAN_EXTRA_MONTHS : PLAN_DEFAULT_MONTHS),
    [showExtraMonths],
  );

  if (!merchant) return null;
  if (!getPlanFeatures(merchant).contest) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <PlanUpgradeCTA title={t('upgradeTitle')} description={t('upgradeDesc')} />
      </div>
    );
  }

  const suggestions = PRIZE_SUGGESTIONS[merchant.shop_type] || PRIZE_SUGGESTIONS.autre;
  const hasEffectivePrize = currentEffectivePrize.trim().length > 0;

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-6 space-y-5">
      {/* HEADER */}
      <header className="flex items-center gap-3">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-rose-500 flex items-center justify-center shadow-md shadow-rose-200/50">
          <Trophy className="w-5 h-5 text-white" strokeWidth={2.4} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-900">{t('pageTitle')}</h1>
          <p className="text-sm text-gray-500">{t('pageDesc')}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowHowItWorks(true)}
          className="shrink-0 inline-flex items-center gap-1 text-[12px] text-gray-500 hover:text-violet-600 transition-colors"
        >
          <Info className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('howItWorksTrigger')}</span>
        </button>
      </header>

      {/* HERO ON */}
      {contestEnabled && (
        <section className="relative rounded-3xl overflow-hidden shadow-xl shadow-rose-200/40">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-700 via-fuchsia-600 to-rose-500" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.18),transparent_55%)]" />
          <div className="relative p-5 md:p-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-white/80" />
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/85">
                {t('heroOnPrizeLabel')} · {currentMonth && formatContestMonth(currentMonth)}
              </p>
            </div>
            <p className="text-[22px] md:text-[26px] font-bold leading-tight tracking-tight mb-5">
              {hasEffectivePrize ? currentEffectivePrize : <span className="italic text-white/70 font-normal">{t('heroOnNoPrize')}</span>}
            </p>

            <div className="grid grid-cols-3 gap-2 md:gap-3 mb-5">
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 border border-white/15">
                <div className="flex items-center gap-1 text-white/70 mb-1">
                  <Calendar className="w-3 h-3" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">J-{daysLeft}</span>
                </div>
                <p className="text-[11px] text-white/85 leading-snug">
                  {daysLeft === 0 ? t('drawTodayLabel') : t('daysUntilDraw', { days: daysLeft })}
                </p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 border border-white/15">
                <div className="flex items-center gap-1 text-white/70 mb-1">
                  <Users className="w-3 h-3" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">{participants}</span>
                </div>
                <p className="text-[11px] text-white/85 leading-snug">
                  {participants > 0 ? t('thisMonthParticipants', { count: participants }) : t('thisMonthEmpty')}
                </p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 border border-white/15">
                <div className="flex items-center gap-1 text-white/70 mb-1">
                  <TrendingUp className="w-3 h-3" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">
                    {analytics ? (analytics.boost > 0 ? `+${analytics.boost}` : analytics.currentMonthBookings) : '—'}
                  </span>
                </div>
                <p className="text-[11px] text-white/85 leading-snug">
                  {!analytics ? t('loading')
                    : !analytics.hasBaseline ? t('boostNoBaseline', { count: analytics.currentMonthBookings })
                    : analytics.boost > 0 ? t('boostUp', { count: analytics.boost })
                    : analytics.boost < 0 ? t('boostDown', { count: analytics.boost })
                    : t('boostNeutral', { count: analytics.currentMonthBookings })}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] text-white/70">{t('drawDateHint', { month: monthLabel })}</p>
              {hasEffectivePrize && (
                <button
                  type="button"
                  onClick={() => setShowAnnounceStory(true)}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/95 hover:bg-white text-rose-600 text-xs font-bold transition-colors active:scale-[0.98]"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  {t('generateAnnounce')}
                </button>
              )}
            </div>

            {participants === 0 && (
              <p className="mt-3 text-[11px] text-white/75">→ {t('thisMonthEmptyHint')}</p>
            )}
            {participants > 0 && (
              <button
                type="button"
                onClick={() => setShowParticipants((p) => !p)}
                className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-white/85 hover:text-white"
              >
                {showParticipants ? t('hideParticipants') : t('viewParticipants', { count: participants })}
                <ChevronDown className={`w-3 h-3 transition-transform ${showParticipants ? 'rotate-180' : ''}`} />
              </button>
            )}
            {showParticipants && participantNames.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {participantNames.map((name, i) => (
                  <span key={i} className="px-2 py-0.5 text-[11px] font-medium text-white bg-white/15 rounded-full border border-white/15">
                    {name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* HERO OFF */}
      {!contestEnabled && (
        <section className="relative rounded-3xl overflow-hidden shadow-xl shadow-rose-200/40">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-700 via-fuchsia-600 to-rose-500" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.18),transparent_55%)]" />
          <div className="relative p-5 md:p-7 text-white">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/15 border border-white/20 backdrop-blur-sm mb-4">
              <Sparkles className="w-3 h-3" />
              <span className="text-[10px] font-bold uppercase tracking-[0.16em]">{t('title')}</span>
            </div>
            <h2 className="text-[22px] md:text-[26px] font-bold leading-tight tracking-tight mb-2">
              {t('heroOffTitle')}
            </h2>
            <p className="text-[14px] md:text-[15px] text-white/85 leading-relaxed mb-5 max-w-md">
              {t('heroOffDesc')}
            </p>
            <button
              type="button"
              onClick={() => persistToggleAndDefault(true)}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-rose-600 text-sm font-bold shadow-lg shadow-rose-700/20 hover:shadow-xl hover:shadow-rose-700/30 active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
              {t('heroOffCta')}
            </button>
          </div>
        </section>
      )}

      {/* LAST WINNER SHOWCASE */}
      {recentWinner && contestEnabled && (
        <section className="relative rounded-3xl overflow-hidden border border-rose-200/70 bg-gradient-to-br from-rose-50 to-white">
          <div className="p-5 md:p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-500 to-fuchsia-500 flex items-center justify-center">
                <Trophy className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-rose-700">
                {t('lastWinnerEyebrow')} · {formatContestMonth(recentWinner.contest_month)}
              </p>
            </div>
            <p className="text-[20px] md:text-[22px] font-bold text-gray-900 leading-tight tracking-tight">
              {recentWinner.winner_name}
            </p>
            <p className="text-[14px] text-gray-600 mt-1.5 leading-snug">
              <span className="text-gray-500">{t('lastWinnerWonLabel')}</span>{' '}
              <span className="font-semibold text-gray-900">{recentWinner.prize_description}</span>
            </p>
            <button
              type="button"
              onClick={() => setStoryContest(recentWinner)}
              className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-colors active:scale-[0.98]"
            >
              <Share2 className="w-3.5 h-3.5" />
              {t('shareLastWinner')}
            </button>
          </div>
        </section>
      )}

      {/* CONFIG — toggle compact */}
      <section className="rounded-2xl border border-gray-200/60 bg-white shadow-sm">
        <div className="p-4 md:p-5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-900">{t('configTitle')}</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">{t('configToggleHint')}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={contestEnabled}
            onClick={() => {
              const next = !contestEnabled;
              setContestEnabled(next);
              persistToggleAndDefault(next);
            }}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 ${
              contestEnabled ? 'bg-rose-500' : 'bg-gray-200'
            }`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${contestEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </section>

      {/* CONFIG — Lot du mois courant */}
      {contestEnabled && (
        <CurrentMonthPrizeCard
          monthLabel={currentMonth ? formatContestMonth(currentMonth) : ''}
          plannedValue={currentPlannedPrize}
          defaultValue={defaultPrize}
          suggestions={suggestions}
          saving={saving}
          saved={saved}
          onSavePlanned={async (value) => {
            const trimmed = value.trim();
            if (!trimmed) return;
            await upsertMonthlyPrize(currentMonth, trimmed);
            // sync default si pas de default existant (premier setup)
            if (!defaultPrize) {
              setDefaultPrize(trimmed);
              persistToggleAndDefault(undefined, trimmed);
            }
          }}
          t={t}
        />
      )}

      {/* CONFIG — Planifier les mois suivants */}
      {contestEnabled && (
        <section className="rounded-2xl border border-gray-200/60 bg-white shadow-sm">
          <div className="p-5 md:p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-1">{t('monthlyPrizesPlanLabel')}</h3>
            <p className="text-[11px] text-gray-400 mb-4">{t('monthlyPrizesPlanHint')}</p>
            <div className="divide-y divide-gray-100">
              {upcomingMonths.map((month) => {
                const planned = plannedPrizes.find((p) => p.contest_month === month);
                return (
                  <MonthlyPrizeRow
                    key={month}
                    month={month}
                    monthLabel={formatContestMonth(month)}
                    initialValue={planned?.prize_description || ''}
                    suggestions={suggestions}
                    onSave={(value) => upsertMonthlyPrize(month, value)}
                    onDelete={() => deleteMonthlyPrize(month)}
                    t={t}
                  />
                );
              })}
            </div>
            {!showExtraMonths && (
              <button
                type="button"
                onClick={() => setShowExtraMonths(true)}
                className="mt-3 w-full text-center py-2 text-[12px] font-semibold text-violet-600 hover:text-violet-700 transition-colors"
              >
                {t('monthlyPrizeShowMore')}
              </button>
            )}
            {showExtraMonths && (
              <button
                type="button"
                onClick={() => setShowExtraMonths(false)}
                className="mt-3 w-full text-center py-2 text-[12px] font-semibold text-gray-500 hover:text-gray-700 transition-colors"
              >
                {t('monthlyPrizeShowLess')}
              </button>
            )}
          </div>
        </section>
      )}

      {/* HISTORIQUE compact */}
      {(archivedContests.length > 0 || (contestEnabled && !recentWinner && !loadingData)) && (
        <section className="rounded-2xl border border-gray-200/60 bg-white shadow-sm overflow-hidden">
          <div className="p-5 md:p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-3">{t('pastWinners')}</h3>
            {archivedContests.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">{t('noWinners')}</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {archivedContests.map((contest) => (
                  <div key={contest.id} className="py-3 first:pt-0 last:pb-0 flex items-center gap-3">
                    <div className="shrink-0 w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
                      <Trophy className="w-4 h-4 text-violet-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-semibold text-gray-900">
                          {formatContestMonth(contest.contest_month)}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          · {t('participantsCount', { count: contest.participants_count })}
                        </span>
                      </div>
                      {contest.winner_name ? (
                        <p className="text-[12px] text-gray-600 mt-0.5 truncate">
                          <span className="font-medium text-gray-800">{contest.winner_name}</span>
                          <span className="text-gray-400"> — {contest.prize_description}</span>
                        </p>
                      ) : (
                        <p className="text-[11px] text-gray-400 mt-0.5">{t('noWinner')} — {contest.prize_description}</p>
                      )}
                    </div>
                    {contest.winner_name && (
                      <button
                        type="button"
                        onClick={() => setStoryContest(contest)}
                        className="shrink-0 p-1.5 rounded-lg text-violet-600 hover:bg-violet-50 transition-colors"
                        title={t('generateStory')}
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* HOW IT WORKS MODAL — sober */}
      {showHowItWorks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowHowItWorks(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowHowItWorks(false)} className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
            <h3 className="text-base font-bold text-gray-900 mb-4">{t('howItWorksTitle')}</h3>
            <ol className="space-y-4">
              {(['step1', 'step2', 'step3'] as const).map((key, i) => (
                <li key={key} className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-[11px] font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-gray-900 leading-snug">{t(`${key}Title`)}</p>
                    <p className="text-[12px] text-gray-500 mt-0.5 leading-snug">{t(`${key}Desc`)}</p>
                  </div>
                </li>
              ))}
            </ol>
            <button
              type="button"
              onClick={() => setShowHowItWorks(false)}
              className="mt-5 w-full py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              {t('howItWorksClose')}
            </button>
          </div>
        </div>
      )}

      {/* WINNER STORY MODAL */}
      {storyContest && merchant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setStoryContest(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-4 relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setStoryContest(null)} className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-gray-100 transition-colors z-10">
              <X className="w-4 h-4 text-gray-500" />
            </button>
            <h3 className="text-sm font-bold text-gray-900 mb-3">{t('generateStory')}</h3>
            <div className="flex justify-center mb-3">
              <ContestWinnerStory
                ref={storyRef}
                shopName={merchant.shop_name}
                primaryColor={merchant.primary_color}
                secondaryColor={merchant.secondary_color}
                winnerName={storyContest.winner_name || ''}
                prizeDescription={storyContest.prize_description}
                contestMonth={storyContest.contest_month}
                scale={0.75}
              />
            </div>
            <button
              onClick={() => downloadStory(storyRef, `gagnant-${storyContest.contest_month}.png`)}
              disabled={downloading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 active:scale-[0.98] touch-manipulation transition-all disabled:opacity-50"
            >
              {downloading ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('downloading')}</> : <><Download className="w-4 h-4" /> {t('downloadStory')}</>}
            </button>
          </div>
        </div>
      )}

      {/* ANNOUNCEMENT STORY MODAL */}
      {showAnnounceStory && merchant && currentMonth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowAnnounceStory(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-4 relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowAnnounceStory(false)} className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-gray-100 transition-colors z-10">
              <X className="w-4 h-4 text-gray-500" />
            </button>
            <h3 className="text-sm font-bold text-gray-900 mb-3">{t('generateAnnounce')}</h3>
            <div className="flex justify-center mb-3">
              <ContestAnnouncementStory
                ref={announceRef}
                shopName={merchant.shop_name}
                primaryColor={merchant.primary_color}
                secondaryColor={merchant.secondary_color}
                prizeDescription={currentEffectivePrize}
                contestMonth={currentMonth}
                scale={0.75}
              />
            </div>
            <button
              onClick={() => downloadStory(announceRef, `concours-${currentMonth}.png`)}
              disabled={downloading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 active:scale-[0.98] touch-manipulation transition-all disabled:opacity-50"
            >
              {downloading ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('downloading')}</> : <><Download className="w-4 h-4" /> {t('downloadStory')}</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SUBCOMPONENTS
// ─────────────────────────────────────────────────────────────────────────

interface CurrentMonthPrizeCardProps {
  monthLabel: string;
  plannedValue: string;
  defaultValue: string;
  suggestions: string[];
  saving: boolean;
  saved: boolean;
  onSavePlanned: (value: string) => Promise<void>;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

function CurrentMonthPrizeCard({ monthLabel, plannedValue, defaultValue, suggestions, saving, saved, onSavePlanned, t }: CurrentMonthPrizeCardProps) {
  // Si pas de prix planifié pour le mois courant, on initialise avec le default
  // (= montre clairement ce qui sera utilisé par le tirage).
  const [value, setValue] = useState(plannedValue || defaultValue);
  useEffect(() => { setValue(plannedValue || defaultValue); }, [plannedValue, defaultValue]);
  const dirty = value.trim() !== (plannedValue || defaultValue).trim();
  const empty = !value.trim();

  return (
    <section className="rounded-2xl border border-rose-200/60 bg-gradient-to-br from-rose-50/40 to-white shadow-sm">
      <div className="p-5 md:p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-1">{t('monthlyPrizeCurrentLabel', { month: monthLabel || '—' })}</h3>
        <p className="text-[11px] text-gray-500 mb-4">{t('monthlyPrizeCurrentHint')}</p>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t('prizePlaceholder')}
          maxLength={300}
          rows={2}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 resize-none"
        />
        {empty && (
          <p className="text-[11px] text-rose-600 mt-1.5">{t('prizeRequiredHint')}</p>
        )}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setValue(s)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-all ${
                value === s
                  ? 'bg-rose-50 border-rose-300 text-rose-700'
                  : 'bg-white border-gray-200 text-gray-500 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        {dirty && !empty && (
          <button
            type="button"
            onClick={() => onSavePlanned(value)}
            disabled={saving}
            className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('saving')}</>
              : saved ? <><Check className="w-4 h-4" /> {t('saved')}</>
              : <><Save className="w-4 h-4" /> {t('save')}</>}
          </button>
        )}
      </div>
    </section>
  );
}

interface MonthlyPrizeRowProps {
  month: string;
  monthLabel: string;
  initialValue: string;
  suggestions: string[];
  onSave: (value: string) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

function MonthlyPrizeRow({ monthLabel, initialValue, suggestions, onSave, onDelete, t }: MonthlyPrizeRowProps) {
  const [value, setValue] = useState(initialValue);
  const [editing, setEditing] = useState(false);
  const [savingRow, setSavingRow] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  useEffect(() => { setValue(initialValue); }, [initialValue]);

  const handleSave = async () => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === initialValue.trim()) { setEditing(false); return; }
    setSavingRow(true);
    const ok = await onSave(trimmed);
    setSavingRow(false);
    if (ok) {
      setSavedFlash(true);
      setEditing(false);
      setTimeout(() => setSavedFlash(false), 1500);
    }
  };

  const handleDelete = async () => {
    setValue('');
    await onDelete();
  };

  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-20 md:w-28 pt-2">
          <p className="text-[12px] font-semibold text-gray-700 capitalize">{monthLabel}</p>
        </div>
        <div className="flex-1 min-w-0">
          {!editing && initialValue ? (
            <div className="flex items-center gap-2 py-2">
              <p className="flex-1 text-[13px] text-gray-800 truncate">{initialValue}</p>
              {savedFlash && (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                  <Check className="w-3 h-3" /> {t('monthlyPrizeRowSaved')}
                </span>
              )}
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                title={t('save')}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title={t('monthlyPrizeRowDelete')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : !editing ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="w-full text-left py-2 text-[12px] text-gray-400 hover:text-rose-600 italic transition-colors"
            >
              {t('monthlyPrizeRowEmpty')} — {t('monthlyPrizeRowPlaceholder')}
            </button>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={t('monthlyPrizeRowPlaceholder')}
                maxLength={300}
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSave(); } if (e.key === 'Escape') { setValue(initialValue); setEditing(false); } }}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
              />
              <div className="flex flex-wrap gap-1.5">
                {suggestions.slice(0, 3).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setValue(s)}
                    className="px-2 py-0.5 text-[10px] font-medium rounded-md border bg-white border-gray-200 text-gray-500 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={savingRow || !value.trim()}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-bold text-white bg-rose-500 hover:bg-rose-600 transition-colors disabled:opacity-50"
                >
                  {savingRow ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t('monthlyPrizeRowSave')}
                </button>
                <button
                  type="button"
                  onClick={() => { setValue(initialValue); setEditing(false); }}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
