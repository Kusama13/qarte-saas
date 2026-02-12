'use client';

import { useState, useEffect } from 'react';
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
  const { merchant, loading: merchantLoading, refetch } = useMerchant();
  const supabase = getSupabase();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);

  // Config state
  const [enabled, setEnabled] = useState(false);
  const [rewardReferrer, setRewardReferrer] = useState('');
  const [rewardReferred, setRewardReferred] = useState('');

  const [showHelp, setShowHelp] = useState(false);
  const [saved, setSaved] = useState(false);

  // Stats
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

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
        .order('created_at', { ascending: false });

      if (!error && data) {
        const rows = data as unknown as ReferralRow[];
        setReferrals(rows);
        setTotalReferrals(rows.length);
        setPendingCount(rows.filter(r => r.status === 'pending').length);
        setCompletedCount(rows.filter(r => r.status === 'completed').length);
      }
      setLoading(false);
    };

    fetchReferrals();
  }, [merchant, merchantLoading, supabase]);

  const handleSave = async () => {
    if (!merchant) return;

    if (enabled && (!rewardReferrer.trim() || !rewardReferred.trim())) return;

    setSaving(true);
    try {
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
        const data = await res.json();
        console.error('Save error:', data.error);
        return;
      }

      await refetch();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
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
      <div className="mb-8 p-6 rounded-2xl bg-[#4b0082]/[0.04] border border-[#4b0082]/[0.08]">
        <div className="flex items-center gap-3 mb-1">
          <UserPlus className="w-7 h-7 text-indigo-600" />
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
            Parrainage
          </h1>
        </div>
        <p className="mt-1 text-gray-500 font-medium">
          Configurez votre programme de parrainage et suivez les résultats
        </p>
      </div>

      {/* Configuration */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Configuration</h2>
          <button
            onClick={() => setShowHelp(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Comment ça marche ?
          </button>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="font-semibold text-gray-900">Activer le parrainage</p>
            <p className="text-sm text-gray-500">
              Vos clients pourront partager un lien pour inviter leurs proches
            </p>
          </div>
          <button
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
                <span className="font-semibold">Astuce :</span> Offrez des récompenses généreuses pour inciter vos clients à parrainer leurs proches. Plus l&apos;offre est attractive, plus ils partageront !
              </p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                Récompense pour le filleul <span className="text-red-400">*</span>
              </label>
              <Input
                placeholder="Ex: -10% sur votre première visite"
                value={rewardReferred}
                onChange={(e) => setRewardReferred(e.target.value)}
                className="h-11"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {['-10% sur la 1ère visite', '-20% sur la 1ère visite', '-30% sur la 1ère visite'].map((s) => (
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
              <p className="text-xs text-gray-400 mt-1.5">Ce que reçoit la personne qui s&apos;inscrit via le lien</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                Récompense pour le parrain <span className="text-red-400">*</span>
              </label>
              <Input
                placeholder="Ex: Un brushing offert"
                value={rewardReferrer}
                onChange={(e) => setRewardReferrer(e.target.value)}
                className="h-11"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {['-10% sur la prochaine visite', '-20% sur la prochaine visite', '-30% sur la prochaine visite'].map((s) => (
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
              <p className="text-xs text-gray-400 mt-1.5">Ce que reçoit votre client quand son filleul utilise sa récompense</p>
            </div>
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
            {saved ? 'Enregistré !' : 'Enregistrer'}
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
                <span className="text-sm font-medium text-gray-500">Total parrainages</span>
              </div>
              <p className="text-3xl font-black text-gray-900">{totalReferrals}</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <span className="text-sm font-medium text-gray-500">En attente</span>
              </div>
              <p className="text-3xl font-black text-gray-900">{pendingCount}</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-gray-500">Complétés</span>
              </div>
              <p className="text-3xl font-black text-gray-900">{completedCount}</p>
            </div>
          </div>

          {/* Referrals Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Historique des parrainages</h2>
            </div>

            {referrals.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Aucun parrainage pour le moment</p>
                <p className="text-sm text-gray-400 mt-1">
                  Vos clients pourront partager leur lien depuis leur carte de fidélité
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="px-6 py-3">Parrain</th>
                      <th className="px-6 py-3">Filleul</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Statut filleul</th>
                      <th className="px-6 py-3">Statut parrain</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {referrals.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-3.5 text-sm font-medium text-gray-900">
                          {customerName(r.referrer_customer)}
                        </td>
                        <td className="px-6 py-3.5 text-sm font-medium text-gray-900">
                          {customerName(r.referred_customer)}
                        </td>
                        <td className="px-6 py-3.5 text-sm text-gray-500">
                          {formatDate(r.created_at)}
                        </td>
                        <td className="px-6 py-3.5">
                          {r.referred_voucher?.is_used ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                              <Check className="w-3 h-3" /> Utilisé
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold">
                              <Clock className="w-3 h-3" /> En attente
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3.5">
                          {r.status === 'completed' ? (
                            r.referrer_voucher?.is_used ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                                <Check className="w-3 h-3" /> Utilisé
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                                <Gift className="w-3 h-3" /> Créé
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
              <h3 className="text-lg font-bold text-gray-900">Comment fonctionne le parrainage ?</h3>
            </div>

            <div className="space-y-4 text-sm text-gray-600">
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 font-bold text-xs flex items-center justify-center">1</span>
                <p>Votre client partage son <span className="font-semibold text-gray-900">lien de parrainage</span> depuis sa carte de fidélité.</p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 font-bold text-xs flex items-center justify-center">2</span>
                <p>Le filleul s&apos;inscrit via le lien et reçoit <span className="font-semibold text-gray-900">sa récompense</span> (ex: -10% sur sa première visite).</p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 font-bold text-xs flex items-center justify-center">3</span>
                <p>Quand le filleul <span className="font-semibold text-gray-900">utilise sa récompense</span>, le parrain reçoit automatiquement la sienne.</p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 font-bold text-xs flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </span>
                <p>Tout est <span className="font-semibold text-gray-900">automatique</span> — aucune action de votre part n&apos;est nécessaire !</p>
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="w-full mt-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Compris !
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
