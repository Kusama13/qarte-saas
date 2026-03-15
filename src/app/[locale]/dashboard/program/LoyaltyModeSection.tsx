'use client';

import { useState } from 'react';
import {
  Check,
  AlertTriangle,
  Gift,
  Zap,
  Euro,
  Stamp,
  HelpCircle,
  X,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';
import { Input } from '@/components/ui';
import { MerchantSettingsForm, type LoyaltySettings } from '@/components/loyalty';
import type { ShopType } from '@/types';
import { TIER2_REWARD_SUGGESTIONS, type ProgramFormData } from './types';

interface LoyaltyModeSectionProps {
  formData: ProgramFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProgramFormData>>;
  isFirstSetup: boolean;
  originalLoyaltyMode: 'visit' | 'cagnotte';
  originalStampsRequired: number;
  showStampsWarning: boolean;
  setShowStampsWarning: (v: boolean) => void;
  rewardError: boolean;
  setRewardError: (v: boolean) => void;
  tier2Error: string;
  setTier2Error: (v: string) => void;
  shopType?: ShopType;
  handleLoyaltySettingsChange: (settings: LoyaltySettings) => void;
}

export function LoyaltyModeSection({
  formData,
  setFormData,
  isFirstSetup,
  originalLoyaltyMode,
  originalStampsRequired,
  showStampsWarning,
  setShowStampsWarning,
  rewardError,
  setRewardError,
  tier2Error,
  setTier2Error,
  shopType,
  handleLoyaltySettingsChange,
}: LoyaltyModeSectionProps) {
  const [pendingModeSwitch, setPendingModeSwitch] = useState<'visit' | 'cagnotte' | null>(null);
  const [modeHelp, setModeHelp] = useState<'visit' | 'cagnotte' | null>(null);
  return (
    <>
      {/* ===== PROGRAMME ===== */}

      {/* Mode selector */}
      <div className="flex items-center gap-3 mt-4 mb-1">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-200 to-transparent" />
        <h2 className="text-sm md:text-base font-bold text-gray-500 uppercase tracking-wider">Mode de fidélité</h2>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-200 to-transparent" />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { mode: 'visit' as const, label: 'Passages', desc: 'Après un nombre de visites défini, ton client reçoit un cadeau de ton choix', icon: <Stamp className="w-5 h-5" /> },
          { mode: 'cagnotte' as const, label: 'Cagnotte', desc: 'Les dépenses de ton client s\'accumulent sur une cagnotte fidélité', icon: <Euro className="w-5 h-5" /> },
        ].map(({ mode, label, desc, icon }) => (
          <button
            key={mode}
            type="button"
            onClick={() => {
              if (mode !== formData.loyaltyMode && !isFirstSetup && originalLoyaltyMode !== mode) {
                setPendingModeSwitch(mode);
                return;
              }
              setFormData(prev => ({ ...prev, loyaltyMode: mode }));
            }}
            className={`relative p-4 pb-10 rounded-2xl border-2 text-left transition-all duration-200 h-full ${
              formData.loyaltyMode === mode
                ? 'border-violet-500 bg-violet-50/60 shadow-md'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            {formData.loyaltyMode === mode && (
              <div className="absolute top-2 right-2">
                <div className="p-0.5 bg-violet-600 rounded-full">
                  <Check className="w-3 h-3 text-white" />
                </div>
              </div>
            )}
            <div className={`p-2 rounded-xl w-fit mb-2 ${formData.loyaltyMode === mode ? 'bg-violet-100 text-violet-600' : 'bg-gray-100 text-gray-400'}`}>
              {icon}
            </div>
            <h3 className={`font-bold text-sm ${formData.loyaltyMode === mode ? 'text-gray-900' : 'text-gray-600'}`}>{label}</h3>
            <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                setModeHelp(mode);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  e.preventDefault();
                  setModeHelp(mode);
                }
              }}
              className="absolute bottom-2 right-2 p-1.5 rounded-full text-gray-300 hover:text-violet-500 hover:bg-violet-50 transition-colors cursor-pointer"
              aria-label={`En savoir plus sur le mode ${label}`}
            >
              <HelpCircle className="w-4 h-4" />
            </div>
          </button>
        ))}
      </div>

      {!isFirstSetup && formData.loyaltyMode !== originalLoyaltyMode && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Changement de mode.</strong> Les passages de tes clients sont conservés. En mode cagnotte, leur cumul EUR démarrera à 0.
          </p>
        </div>
      )}

      <div className="flex items-center gap-3 mb-1">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-200 to-transparent" />
        <h2 className="text-sm md:text-base font-bold text-gray-500 uppercase tracking-wider">Récompenses</h2>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-200 to-transparent" />
      </div>

      <div className="p-3 md:p-6 bg-gradient-to-br from-white via-white to-indigo-50/30 rounded-2xl shadow-lg shadow-indigo-200/50 border border-indigo-100/50 backdrop-blur-xl transition-all duration-300">
        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
          <div className="p-1.5 md:p-2.5 rounded-lg md:rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 shadow-lg shadow-indigo-200">
            <Gift className="w-3.5 h-3.5 md:w-5 md:h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm md:text-lg font-bold text-gray-900">1er Palier</h3>
            <p className="text-[11px] md:text-xs text-gray-500">Soyez généreux, nous conseillons 5 passages</p>
          </div>
        </div>
        {formData.loyaltyMode === 'cagnotte' ? (
          <>
            <MerchantSettingsForm
              stampsRequired={formData.stampsRequired}
              rewardDescription={`${formData.cagnottePercent}% sur votre cagnotte fidélité`}
              shopType={shopType}
              onChange={(v: LoyaltySettings) => {
              setFormData(prev => ({ ...prev, stampsRequired: v.stamps_required }));
              if (v.stamps_required > originalStampsRequired) setShowStampsWarning(true);
              else setShowStampsWarning(false);
            }}
              hiddenReward
            />
            <div className="space-y-2.5 mt-4">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-500" />
                Pourcentage cagnotte
              </label>
              <div className="relative w-fit">
                <Input
                  type="number"
                  min={1}
                  max={100}
                  step={1}
                  value={formData.cagnottePercent}
                  onChange={(e) => setFormData(prev => ({ ...prev, cagnottePercent: parseInt(e.target.value) || 0 }))}
                  className="text-center font-bold text-lg h-12 border-2 w-[100px] pr-8"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-400 pointer-events-none">%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Suggestions :</span>
                {[5, 10, 15, 20].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, cagnottePercent: n }))}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${
                      formData.cagnottePercent === n
                        ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                        : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-indigo-50'
                    }`}
                  >
                    {n}%
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                Après {formData.stampsRequired} passages, la cliente reçoit {formData.cagnottePercent}% sur sa cagnotte fidélité
              </p>
            </div>
          </>
        ) : (
          <>
            <MerchantSettingsForm
              stampsRequired={formData.stampsRequired}
              rewardDescription={formData.rewardDescription}
              shopType={shopType}
              onChange={handleLoyaltySettingsChange}
            />
            {rewardError && (
              <p className="mt-2 text-sm text-red-600 font-medium">Veuillez entrer la r&eacute;compense avant d&apos;enregistrer</p>
            )}
          </>
        )}

        {/* Warning when increasing stamps required */}
        {showStampsWarning && (
          <div className="mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800 text-sm">Attention</p>
              <p className="text-amber-700 text-sm mt-1">
                Augmenter le nombre requis ne s&apos;appliquera qu&apos;aux <strong>nouveaux clients</strong>.
                Les clients existants garderont leur objectif actuel.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 2nd Tier Reward Section */}
      <div className="p-3 md:p-6 bg-gradient-to-br from-white via-white to-violet-50/30 rounded-2xl shadow-lg shadow-violet-200/30 border border-violet-100/50 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-3 md:mb-6">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2.5 rounded-lg md:rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 shadow-lg shadow-violet-200">
              <Trophy className="w-3.5 h-3.5 md:w-5 md:h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm md:text-lg font-bold text-gray-900">2ème Palier <span className="text-gray-400 font-medium text-xs md:text-sm">(facultatif)</span></h3>
              <p className="text-[11px] md:text-xs text-gray-500">
                {formData.loyaltyMode === 'cagnotte' ? 'Un taux de cagnotte plus élevé après plus de passages' : 'Les passages continuent de compter après le 1er palier'}
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={formData.tier2Enabled}
            aria-label="Activer ou désactiver le 2ème palier de récompense"
            onClick={() => setFormData(prev => ({ ...prev, tier2Enabled: !prev.tier2Enabled }))}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 ${
              formData.tier2Enabled ? 'bg-violet-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                formData.tier2Enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {formData.tier2Enabled && (
          <div className="space-y-5 pt-4 border-t border-violet-100">
            <div className="p-4 rounded-xl bg-violet-50/50 border border-violet-100">
              <p className="text-sm text-violet-700 flex items-start gap-2">
                <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {formData.loyaltyMode === 'cagnotte' ? (
                  <span>
                    <strong>Comment ça marche :</strong> À {formData.stampsRequired} passages, la cliente reçoit {formData.cagnottePercent}% sur sa cagnotte fidélité.
                    Son cumul repart à zéro, ses passages continuent. À {formData.tier2StampsRequired || '?'} passages, elle reçoit {formData.cagnotteTier2Percent}% (taux plus élevé).
                  </span>
                ) : (
                  <span>
                    <strong>Exemple :</strong> Le client débloque la 1ère récompense à {formData.stampsRequired} passages, puis continue
                    jusqu&apos;à {formData.tier2StampsRequired || '?'} passages pour la 2ème (cumul continu, sans remise à zéro).
                  </span>
                )}
              </p>
            </div>

            <div className="space-y-2.5">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Target className="w-4 h-4 text-violet-500" />
                Nombre de passages requis
              </label>
              <Input
                type="number"
                min={1}
                max={30}
                placeholder={`Ex: ${formData.stampsRequired * 2}`}
                value={formData.tier2StampsRequired || ''}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    tier2StampsRequired: parseInt(e.target.value) || 0
                  }));
                  setTier2Error('');
                }}
                className={`text-center font-bold text-lg h-12 border-2 max-w-[120px] ${tier2Error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Suggestions :</span>
                {[15, 20, 30].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => { setFormData(prev => ({ ...prev, tier2StampsRequired: n })); setTier2Error(''); }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${
                      formData.tier2StampsRequired === n
                        ? 'bg-violet-100 border-violet-300 text-violet-700'
                        : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-600'
                    }`}
                  >
                    {n} passages
                  </button>
                ))}
              </div>
              {tier2Error ? (
                <p className="text-xs text-red-500 font-medium">{tier2Error}</p>
              ) : (
                <p className="text-xs text-gray-500">
                  Doit être supérieur au 1er palier ({formData.stampsRequired})
                </p>
              )}
            </div>

            {formData.loyaltyMode === 'cagnotte' ? (
              <div className="space-y-2.5">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-violet-500" />
                  Pourcentage cagnotte palier 2
                </label>
                <div className="relative w-fit">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    step={1}
                    value={formData.cagnotteTier2Percent}
                    onChange={(e) => setFormData(prev => ({ ...prev, cagnotteTier2Percent: parseInt(e.target.value) || 0 }))}
                    className="text-center font-bold text-lg h-12 border-2 w-[100px] pr-8"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-400 pointer-events-none">%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Suggestions :</span>
                  {[10, 15, 20, 25].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, cagnotteTier2Percent: n }))}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${
                        formData.cagnotteTier2Percent === n
                          ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                          : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-indigo-50'
                      }`}
                    >
                      {n}%
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  Après {formData.tier2StampsRequired || '?'} passages, la cagnotte passe à {formData.cagnotteTier2Percent}% (le cumul repart de zéro après le palier 1)
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Gift className="w-4 h-4 text-violet-500" />
                  Récompense offerte
                </label>
                <Input
                  type="text"
                  placeholder="Ex: Un menu offert, -30% sur ta commande..."
                  value={formData.tier2RewardDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, tier2RewardDescription: e.target.value }))}
                  className="h-11"
                />
                <div className="flex flex-wrap gap-1.5">
                  {(TIER2_REWARD_SUGGESTIONS[shopType || 'autre'] || TIER2_REWARD_SUGGESTIONS.autre).map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, tier2RewardDescription: suggestion }))}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${
                        formData.tier2RewardDescription === suggestion
                          ? 'bg-violet-100 border-violet-300 text-violet-700'
                          : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-600'
                      }`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mode switch confirmation modal */}
      {pendingModeSwitch && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 text-center animate-in zoom-in-95 duration-300">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200/50">
              <AlertTriangle className="w-7 h-7 text-white" />
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Changer de mode ?
            </h3>

            <p className="text-gray-500 text-sm mb-2 leading-relaxed">
              Passer en mode <strong>{pendingModeSwitch === 'cagnotte' ? 'Cagnotte' : 'Passages'}</strong> affectera l&apos;affichage pour tes clients existants.
            </p>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-5">
              <p className="text-xs text-amber-800 leading-relaxed">
                Les passages de tes clients sont <strong>conservés</strong>.
                {pendingModeSwitch === 'cagnotte'
                  ? ' Leur cumul en euros démarrera à 0 €.'
                  : ' Leur cumul en euros sera perdu.'}
              </p>
            </div>

            <button
              onClick={() => {
                setFormData(prev => ({ ...prev, loyaltyMode: pendingModeSwitch }));
                setPendingModeSwitch(null);
              }}
              className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200/50 hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Confirmer le changement
            </button>

            <button
              onClick={() => setPendingModeSwitch(null)}
              className="mt-3 w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Mode help modal */}
      {modeHelp && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setModeHelp(null)}>
          <div
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 sm:p-6 animate-in slide-in-from-bottom sm:zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-200/50">
                  {modeHelp === 'visit' ? <Stamp className="w-5 h-5 text-white" /> : <Euro className="w-5 h-5 text-white" />}
                </div>
                <h3 className="text-base font-bold text-gray-900">
                  {modeHelp === 'visit' ? 'Mode Passages' : 'Mode Cagnotte'}
                </h3>
              </div>
              <button
                onClick={() => setModeHelp(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm font-semibold text-violet-700 mb-3">Comment ça marche ?</p>

            <ul className="space-y-3 mb-5">
              {(modeHelp === 'visit' ? [
                { text: 'Chaque visite = 1 tampon sur la carte de ton client' },
                { text: 'Après X passages (ex : 10), il débloque un cadeau que tu définis' },
                { text: 'Exemples de cadeaux : un brushing offert, -30% sur une prestation, un soin gratuit' },
                { text: 'Simple et efficace — idéal si tes prestations ont des prix variés' },
              ] : [
                { text: 'Chaque visite, le montant dépensé par le client est enregistré' },
                { text: 'Après X passages, il reçoit un % de ses dépenses cumulées en réduction' },
                { text: 'Exemple : après 8 passages et 320 € dépensés, avec 10% de cagnotte → 32 € de réduction' },
                { text: 'Plus le client dépense, plus sa récompense est élevée — idéal pour encourager les gros paniers' },
              ]).map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-violet-600">{i + 1}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{item.text}</p>
                </li>
              ))}
            </ul>

            <button
              onClick={() => setModeHelp(null)}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200/50 hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Compris
            </button>
          </div>
        </div>
      )}
    </>
  );
}
