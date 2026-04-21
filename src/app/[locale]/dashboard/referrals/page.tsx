'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useDashboardSave } from '@/hooks/useDashboardSave';
import {
  Users,
  Gift,
  Loader2,
  Check,
  Clock,
  UserPlus,
  HelpCircle,
  X,
  Sparkles,
} from 'lucide-react';
import { Input } from '@/components/ui';
import { getSupabase } from '@/lib/supabase';
import { useMerchant } from '@/contexts/MerchantContext';
import { formatDate } from '@/lib/utils';
import type { ReferralStatus } from '@/types';

interface ReferralRow {
  id: string;
  status: ReferralStatus;
  created_at: string;
  referrer_customer: { first_name: string; last_name: string | null } | null;
  referred_customer: { first_name: string; last_name: string | null } | null;
  referred_voucher: { is_used: boolean; used_at: string | null } | null;
  referrer_voucher: { is_used: boolean; used_at: string | null } | null;
}

export default function ReferralsPage() {
  const t = useTranslations('referralsPage');
  const { merchant, loading: merchantLoading, refetch } = useMerchant();
  const supabase = getSupabase();

  const [loading, setLoading] = useState(true);
  const { saving, saved, save } = useDashboardSave();
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);

  // Config state
  const [enabled, setEnabled] = useState(false);
  const [rewardReferrer, setRewardReferrer] = useState('');
  const [rewardReferred, setRewardReferred] = useState('');

  const [showHelp, setShowHelp] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Derived stats from referrals array
  // Filter out welcome entries (referrer_customer === null) — those belong to Ma Page, not referrals
  const realReferrals = useMemo(() => referrals.filter(r => r.referrer_customer !== null), [referrals]);
  const totalReferrals = useMemo(() => realReferrals.length, [realReferrals]);
  const pendingCount = useMemo(() => realReferrals.filter(r => r.status === 'pending').length, [realReferrals]);
  const completedCount = useMemo(() => realReferrals.filter(r => r.status === 'completed').length, [realReferrals]);

  const referredSuggestions = t('referredQuickSuggestions').split(',');
  const referrerSuggestions = t('referrerQuickSuggestions').split(',');

  useEffect(() => {
    if (merchantLoading || !merchant) return;

    setEnabled(merchant.referral_program_enabled || false);
    setRewardReferrer(merchant.referral_reward_referrer || '');
    setRewardReferred(merchant.referral_reward_referred || '');

    const fetchReferrals = async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select(`
          id,
          status,
          created_at,
          referrer_customer:referrer_customer_id(first_name, last_name),
          referred_customer:referred_customer_id(first_name, last_name),
          referred_voucher:referred_voucher_id(is_used, used_at),
          referrer_voucher:referrer_voucher_id(is_used, used_at)
        `)
        .eq('merchant_id', merchant.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        setReferrals(data as unknown as ReferralRow[]);
      }
      setLoading(false);
    };

    fetchReferrals();
  }, [merchant, merchantLoading, supabase]);

  const handleSave = async () => {
    if (!merchant) return;

    if (enabled && (!rewardReferrer.trim() || !rewardReferred.trim())) return;

    setSaveError('');
    save(async () => {
      const res = await fetch('/api/merchants/referral-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant_id: merchant.id,
          referral_program_enabled: enabled,
          referral_reward_referrer: enabled ? rewardReferrer.trim() : null,
          referral_reward_referred: enabled ? rewardReferred.trim() : null,
        }),
      });

      if (!res.ok) {
        setSaveError(t('saveError'));
        throw new Error('save failed');
      }

      refetch().catch(() => {});
    });
  };

  if (merchantLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const customerName = (c: { first_name: string; last_name: string | null } | null) => {
    if (!c) return '—';
    return c.last_name ? `${c.first_name} ${c.last_name[0]}.` : c.first_name;
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <div className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-indigo-600" />
          <h1 className="text-lg md:text-2xl font-bold tracking-tight text-slate-900">
            {t('title')}
          </h1>
        </div>
        <p className="mt-0.5 text-xs md:text-sm text-slate-500">
          {t('subtitle')}
        </p>
      </div>

      {/* Configuration */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">{t('configuration')}</h2>
          <button
            onClick={() => setShowHelp(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            {t('howItWorks')}
          </button>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="font-semibold text-gray-900">{t('enableReferral')}</p>
            <p className="text-sm text-gray-500">
              {t('enableReferralDesc')}
            </p>
          </div>
          <button
            role="switch"
            aria-checked={enabled}
            aria-label={t('enableReferral')}
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors ${
              enabled ? 'bg-indigo-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none absolute top-[2px] left-[2px] h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
                enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Rewards config */}
        {enabled && (
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-100">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">
                <span className="font-semibold">{t('tip')}</span> {t('tipDesc')}
              </p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                {t('rewardReferred')} <span className="text-red-400">*</span>
              </label>
              <Input
                placeholder={t('rewardReferredPlaceholder')}
                value={rewardReferred}
                onChange={(e) => setRewardReferred(e.target.value)}
                className="h-11"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {referredSuggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRewardReferred(s)}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">{t('rewardReferredHint')}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                {t('rewardReferrer')} <span className="text-red-400">*</span>
              </label>
              <Input
                placeholder={t('rewardReferrerPlaceholder')}
                value={rewardReferrer}
                onChange={(e) => setRewardReferrer(e.target.value)}
                className="h-11"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {referrerSuggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRewardReferrer(s)}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">{t('rewardReferrerHint')}</p>
            </div>
          </div>
        )}

        {/* Save error */}
        {saveError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {saveError}
          </div>
        )}

        {/* Save button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || (enabled && (!rewardReferrer.trim() || !rewardReferred.trim()))}
            className={`px-6 py-2.5 font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
              saved ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {saved ? t('saved') : t('save')}
          </button>
        </div>
      </div>

      {/* Stats */}
      {enabled && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <span className="text-sm font-medium text-gray-500">{t('totalReferrals')}</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{totalReferrals}</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <span className="text-sm font-medium text-gray-500">{t('pending')}</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{pendingCount}</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-gray-500">{t('completed')}</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{completedCount}</p>
            </div>

          </div>

          {/* Referrals Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{t('historyTitle')}</h2>
            </div>

            {realReferrals.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">{t('noReferrals')}</p>
                <p className="text-sm text-gray-400 mt-1">
                  {t('noReferralsHint')}
                </p>
              </div>
            ) : (
              <>
                {/* Mobile: cards */}
                <div className="md:hidden divide-y divide-slate-100">
                  {realReferrals.map((r) => (
                    <div key={r.id} className="p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('thReferrer')}</p>
                          <p className="text-sm font-semibold text-slate-900 truncate">{customerName(r.referrer_customer)}</p>
                        </div>
                        <span className="text-xs text-slate-400 tabular-nums shrink-0">{formatDate(r.created_at)}</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('thReferred')}</p>
                        <p className="text-sm font-semibold text-slate-900 truncate">{customerName(r.referred_customer)}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {r.referred_voucher?.is_used ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
                            <Check className="w-3 h-3" /> {t('statusUsed')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-semibold">
                            <Clock className="w-3 h-3" /> {t('statusPending')}
                          </span>
                        )}
                        {r.status === 'completed' && (
                          r.referrer_voucher?.is_used ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
                              <Check className="w-3 h-3" /> {t('statusUsed')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold">
                              <Gift className="w-3 h-3" /> {t('statusCreated')}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop: table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <th className="px-6 py-3">{t('thReferrer')}</th>
                        <th className="px-6 py-3">{t('thReferred')}</th>
                        <th className="px-6 py-3">{t('thDate')}</th>
                        <th className="px-6 py-3">{t('thReferredStatus')}</th>
                        <th className="px-6 py-3">{t('thReferrerStatus')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {realReferrals.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-3.5 text-sm font-medium text-gray-900">
                            {customerName(r.referrer_customer)}
                          </td>
                          <td className="px-6 py-3.5 text-sm font-medium text-gray-900">
                            {customerName(r.referred_customer)}
                          </td>
                          <td className="px-6 py-3.5 text-sm text-gray-500 tabular-nums">
                            {formatDate(r.created_at)}
                          </td>
                          <td className="px-6 py-3.5">
                            {r.referred_voucher?.is_used ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                                <Check className="w-3 h-3" /> {t('statusUsed')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold">
                                <Clock className="w-3 h-3" /> {t('statusPending')}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-3.5">
                            {r.status === 'completed' ? (
                              r.referrer_voucher?.is_used ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                                  <Check className="w-3 h-3" /> {t('statusUsed')}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                                  <Gift className="w-3 h-3" /> {t('statusCreated')}
                                </span>
                              )
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowHelp(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowHelp(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">{t('helpTitle')}</h3>
            </div>

            <div className="space-y-4 text-sm text-gray-600">
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 font-bold text-xs flex items-center justify-center">1</span>
                <p dangerouslySetInnerHTML={{ __html: t('helpStep1') }} />
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 font-bold text-xs flex items-center justify-center">2</span>
                <p dangerouslySetInnerHTML={{ __html: t('helpStep2') }} />
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 font-bold text-xs flex items-center justify-center">3</span>
                <p dangerouslySetInnerHTML={{ __html: t('helpStep3') }} />
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 font-bold text-xs flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </span>
                <p dangerouslySetInnerHTML={{ __html: t('helpStep4') }} />
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="w-full mt-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              {t('helpGotIt')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
