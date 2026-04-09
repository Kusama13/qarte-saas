'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Trophy, Save, Loader2, Check, Download, X, Share2, ChevronDown, Users } from 'lucide-react';
import { useMerchant } from '@/contexts/MerchantContext';
import { useDashboardSave } from '@/hooks/useDashboardSave';
import { useTranslations } from 'next-intl';
import { formatContestMonth } from '@/lib/utils';
import type { MerchantContest } from '@/types';
import ContestWinnerStory from '@/components/marketing/ContestWinnerStory';
import ContestAnnouncementStory from '@/components/marketing/ContestAnnouncementStory';

const PRIZE_SUGGESTIONS: Record<string, string[]> = {
  coiffeur: [
    'Une coupe + brushing offerts',
    'Un soin capillaire complet offert',
    '-50% sur la prochaine prestation',
    'Un bon de 30€',
  ],
  barbier: [
    'Un forfait coupe + barbe offert',
    'Un soin barbe premium offert',
    '-50% sur la prochaine prestation',
    'Un bon de 30€',
  ],
  institut_beaute: [
    'Un soin visage complet offert',
    'Un forfait corps + visage offert',
    '-50% sur la prochaine prestation',
    'Un bon de 30€',
  ],
  onglerie: [
    'Une pose complète offerte',
    'Un forfait manucure + pédicure offert',
    '-50% sur la prochaine prestation',
    'Un bon de 30€',
  ],
  spa: [
    'Un massage 1h offert',
    'Un forfait détente complet offert',
    '-50% sur la prochaine prestation',
    'Un bon de 50€',
  ],
  estheticienne: [
    'Un soin complet offert',
    'Un forfait visage premium offert',
    '-50% sur la prochaine prestation',
    'Un bon de 30€',
  ],
  tatouage: [
    'Une retouche complète offerte',
    'Un piercing offert',
    '-20% sur le prochain tatouage',
    'Un bon de 50€',
  ],
  autre: [
    'Une prestation offerte',
    '-50% sur la prochaine visite',
    'Un bon de 30€',
    'Un cadeau VIP',
  ],
};

export default function ContestPage() {
  const { merchant } = useMerchant();
  const { saving, saved, save } = useDashboardSave();
  const t = useTranslations('contest');

  const [contestEnabled, setContestEnabled] = useState(false);
  const [contestPrize, setContestPrize] = useState('');
  const [participants, setParticipants] = useState(0);
  const [participantNames, setParticipantNames] = useState<string[]>([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [currentMonth, setCurrentMonth] = useState('');
  const [contests, setContests] = useState<MerchantContest[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Story modals
  const [storyContest, setStoryContest] = useState<MerchantContest | null>(null);
  const [showAnnounceStory, setShowAnnounceStory] = useState(false);
  const storyRef = useRef<HTMLDivElement>(null);
  const announceRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!merchant) return;
    setContestEnabled(merchant.contest_enabled || false);
    setContestPrize(merchant.contest_prize || '');
  }, [merchant]);

  const fetchData = useCallback(async () => {
    if (!merchant?.id) return;
    setLoadingData(true);
    try {
      const [partRes, histRes] = await Promise.all([
        fetch(`/api/contest/participants?merchantId=${merchant.id}`),
        fetch(`/api/contest?merchantId=${merchant.id}`),
      ]);
      if (partRes.ok) {
        const data = await partRes.json();
        setParticipants(data.participants || 0);
        setParticipantNames(data.names || []);
        setCurrentMonth(data.month || '');
      }
      if (histRes.ok) {
        const data = await histRes.json();
        setContests(data.contests || []);
      }
    } catch { /* silent */ }
    setLoadingData(false);
  }, [merchant?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    if (!merchant) return;
    save(async () => {
      const res = await fetch('/api/contest', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: merchant.id,
          contestEnabled,
          contestPrize: contestEnabled ? contestPrize.trim() || null : null,
        }),
      });
      if (!res.ok) throw new Error('Save failed');
    });
  };

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

  if (!merchant) return null;

  const suggestions = PRIZE_SUGGESTIONS[merchant.shop_type] || PRIZE_SUGGESTIONS.autre;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* ═══ PAGE HEADER ═══ */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">{t('pageTitle')}</h1>
          <p className="text-sm text-gray-500">{t('pageDesc')}</p>
        </div>
      </div>

      {/* ═══ CONFIGURATION ═══ */}
      <div className="bg-white/60 backdrop-blur-xl border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden mb-4">
        <div className="p-4 md:p-5">
          {/* Toggle row */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">{t('title')}</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">{t('hint')}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={contestEnabled}
              onClick={() => setContestEnabled(prev => !prev)}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 ${
                contestEnabled ? 'bg-amber-500' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${contestEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Disabled state — pitch message */}
          {!contestEnabled && (
            <div className="mt-4 bg-amber-50/60 rounded-xl p-4 md:p-5 border border-amber-100/60 space-y-2.5">
              {['pitch1', 'pitch2', 'pitch3', 'pitch4'].map((key) => (
                <p key={key} className="text-[13px] md:text-[15px] text-gray-700 leading-snug">
                  {t(key)}
                </p>
              ))}
            </div>
          )}

          {/* Prize config */}
          {contestEnabled && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">{t('prizeLabel')}</label>
                <textarea
                  value={contestPrize}
                  onChange={(e) => setContestPrize(e.target.value)}
                  placeholder={t('prizePlaceholder')}
                  maxLength={300}
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setContestPrize(s)}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-all duration-200 ${
                        contestPrize === s
                          ? 'bg-amber-100 border-amber-300 text-amber-700'
                          : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-600'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> {t('saving')}</>
                  ) : saved ? (
                    <><Check className="w-4 h-4" /> {t('saved')}</>
                  ) : (
                    <><Save className="w-4 h-4" /> {t('save')}</>
                  )}
                </button>
                {contestPrize.trim() && (
                  <button
                    onClick={() => setShowAnnounceStory(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-all"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('generateAnnounce')}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ CE MOIS — ligne compacte ═══ */}
      {contestEnabled && (
        <div className="bg-white/60 backdrop-blur-xl border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden mb-4">
          <button
            type="button"
            onClick={() => participants > 0 && setShowParticipants(p => !p)}
            className={`w-full flex items-center justify-between p-4 md:p-5 text-left ${participants > 0 ? 'cursor-pointer hover:bg-gray-50/50' : 'cursor-default'} transition-colors`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-amber-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {currentMonth && formatContestMonth(currentMonth)} — <span className="text-amber-600">{t('inProgress')}</span>
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {loadingData ? t('loading') : (
                    participants > 0 ? t('participants', { count: participants }) : t('noParticipants')
                  )}
                </p>
              </div>
            </div>
            {participants > 0 && (
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <span className="text-lg font-bold text-gray-900">{participants}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showParticipants ? 'rotate-180' : ''}`} />
              </div>
            )}
          </button>

          {showParticipants && participantNames.length > 0 && (
            <div className="border-t border-gray-100 px-4 md:px-5 py-3">
              <div className="flex flex-wrap gap-1.5">
                {participantNames.map((name, i) => (
                  <span key={i} className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
                    {name}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 mt-2.5">{t('drawPending')}</p>
            </div>
          )}
        </div>
      )}

      {/* ═══ DERNIERS TIRAGES ═══ */}
      <div className="bg-white/60 backdrop-blur-xl border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 md:p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-3">{t('pastWinners')}</h3>
          {contests.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">{t('noWinners')}</p>
          ) : (
            <div className="space-y-2">
              {contests.map(contest => (
                <div
                  key={contest.id}
                  className="p-3 rounded-xl bg-gray-50 border border-gray-100"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatContestMonth(contest.contest_month)}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {t('participantsCount', { count: contest.participants_count })}
                        </span>
                      </div>
                      {contest.winner_name ? (
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">{contest.winner_name}</span>
                          <span className="text-gray-400"> — {contest.prize_description}</span>
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 mt-1">{t('noWinner')}</p>
                      )}
                    </div>
                  </div>
                  {contest.winner_name && (
                    <button
                      type="button"
                      onClick={() => setStoryContest(contest)}
                      className="mt-2 w-full sm:w-auto px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                    >
                      {t('generateStory')}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══ WINNER STORY MODAL ═══ */}
      {storyContest && merchant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-4 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setStoryContest(null)}
              className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-gray-100 transition-colors z-10"
            >
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
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50"
            >
              {downloading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {t('downloading')}</>
              ) : (
                <><Download className="w-4 h-4" /> {t('downloadStory')}</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ═══ ANNOUNCEMENT STORY MODAL ═══ */}
      {showAnnounceStory && merchant && currentMonth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-4 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAnnounceStory(false)}
              className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-gray-100 transition-colors z-10"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
            <h3 className="text-sm font-bold text-gray-900 mb-3">{t('generateAnnounce')}</h3>
            <div className="flex justify-center mb-3">
              <ContestAnnouncementStory
                ref={announceRef}
                shopName={merchant.shop_name}
                primaryColor={merchant.primary_color}
                secondaryColor={merchant.secondary_color}
                prizeDescription={contestPrize}
                contestMonth={currentMonth}
                scale={0.75}
              />
            </div>
            <button
              onClick={() => downloadStory(announceRef, `concours-${currentMonth}.png`)}
              disabled={downloading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50"
            >
              {downloading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {t('downloading')}</>
              ) : (
                <><Download className="w-4 h-4" /> {t('downloadStory')}</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
