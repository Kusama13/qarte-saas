'use client';

import Link from 'next/link';
import {
  Check,
  Gift,
  CreditCard,
  Loader2,
  Bell,
  Share,
  PlusSquare,
  Trophy,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { Merchant, LoyaltyCard, Customer } from '@/types';

interface ScanSuccessStepProps {
  merchant: Merchant;
  loyaltyCard: LoyaltyCard;
  customer: Customer | null;
  lastCheckinPoints: number;
  tier1Redeemed: boolean;
  tier2Redeemed: boolean;
  // Push props
  pushSupported: boolean;
  pushSubscribed: boolean;
  pushPermission: NotificationPermission | 'unsupported';
  pushSubscribing: boolean;
  isIOS: boolean;
  isStandalone: boolean;
  handlePushSubscribe: () => void;
}

export default function ScanSuccessStep({
  merchant,
  loyaltyCard,
  customer,
  lastCheckinPoints,
  tier1Redeemed,
  tier2Redeemed,
  pushSupported,
  pushSubscribed,
  pushPermission,
  pushSubscribing,
  isIOS,
  isStandalone,
  handlePushSubscribe,
}: ScanSuccessStepProps) {
  const primaryColor = merchant.primary_color;
  const secondaryColor = merchant.secondary_color;

  return (
    <div className="animate-fade-in">
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-8 overflow-hidden text-center">
        <div
          className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-3xl"
          style={{ backgroundColor: `${primaryColor}15` }}
        >
          <Check className="w-10 h-10" style={{ color: primaryColor }} />
        </div>

        <h2 className="text-2xl font-black text-gray-900 mb-1">
          Passage validé !
        </h2>
        <p className="text-gray-500 mb-8">Merci {customer?.first_name} !</p>

        {/* Dual Tier Progress */}
        {merchant.tier2_enabled && merchant.tier2_stamps_required ? (
          <div className="mb-6" style={{ perspective: '800px' }}>
            <div className="flex items-baseline justify-center gap-1 mb-6">
              <motion.span
                key={loyaltyCard.current_stamps}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-5xl font-black"
                style={{ color: primaryColor }}
              >
                {loyaltyCard.current_stamps}
              </motion.span>
              <span className="text-xl font-bold text-gray-300">pts</span>
            </div>

            {/* 3D Stacked Tier Cards */}
            <div className="relative h-28 mb-4">
              {/* Tier 2 Card */}
              <div
                className={`absolute left-1/2 -translate-x-1/2 w-[90%] bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 p-3 transition-all duration-500 ${
                  tier1Redeemed || loyaltyCard.current_stamps >= (merchant.stamps_required || 10)
                    ? 'opacity-90 -top-2'
                    : 'opacity-50 top-0'
                }`}
                style={{
                  transform: tier1Redeemed || loyaltyCard.current_stamps >= (merchant.stamps_required || 10)
                    ? 'translateX(-50%) scale(0.98)'
                    : 'translateX(-50%) scale(0.92) translateY(-8px)',
                  zIndex: tier1Redeemed || loyaltyCard.current_stamps >= (merchant.stamps_required || 10) ? 20 : 5
                }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    loyaltyCard.current_stamps >= (merchant.tier2_stamps_required || 20)
                      ? 'bg-violet-100'
                      : tier1Redeemed
                        ? 'bg-violet-50'
                        : 'bg-gray-200'
                  }`}>
                    <Trophy className={`w-5 h-5 ${
                      loyaltyCard.current_stamps >= (merchant.tier2_stamps_required || 20)
                        ? 'text-violet-500'
                        : tier1Redeemed
                          ? 'text-violet-400'
                          : 'text-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[9px] font-bold uppercase tracking-wider ${
                      tier1Redeemed ? 'text-violet-500' : 'text-gray-400'
                    }`}>
                      Palier 2 · {merchant.tier2_stamps_required} pts
                    </p>
                    <p className={`text-xs font-bold truncate ${
                      tier1Redeemed ? 'text-gray-700' : 'text-gray-500'
                    }`}>{merchant.tier2_reward_description}</p>
                  </div>
                  {(tier1Redeemed || loyaltyCard.current_stamps >= (merchant.stamps_required || 10)) ? (
                    loyaltyCard.current_stamps >= (merchant.tier2_stamps_required || 20) ? (
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> Prêt
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-violet-500 bg-violet-50 px-2 py-1 rounded-full">
                        {(merchant.tier2_stamps_required || 20) - loyaltyCard.current_stamps} restants
                      </span>
                    )
                  ) : null}
                </div>
              </div>

              {/* Tier 1 Card */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={`absolute left-1/2 -translate-x-1/2 w-[95%] rounded-2xl border p-3 transition-all duration-500 ${
                  tier1Redeemed || loyaltyCard.current_stamps >= (merchant.stamps_required || 10)
                    ? 'bg-gray-50 border-gray-200 opacity-60 top-12'
                    : 'bg-white border-gray-100 top-6'
                }`}
                style={{
                  transform: tier1Redeemed || loyaltyCard.current_stamps >= (merchant.stamps_required || 10)
                    ? 'translateX(-50%) scale(0.92)'
                    : 'translateX(-50%)',
                  boxShadow: tier1Redeemed || loyaltyCard.current_stamps >= (merchant.stamps_required || 10)
                    ? 'none'
                    : `0 12px 30px -8px ${primaryColor}25, 0 4px 12px -4px rgba(0,0,0,0.08)`,
                  zIndex: tier1Redeemed || loyaltyCard.current_stamps >= (merchant.stamps_required || 10) ? 5 : 20
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      backgroundColor: tier1Redeemed || loyaltyCard.current_stamps >= (merchant.stamps_required || 10)
                        ? '#e5e7eb'
                        : `${primaryColor}15`
                    }}
                  >
                    <Gift className="w-5 h-5" style={{
                      color: tier1Redeemed || loyaltyCard.current_stamps >= (merchant.stamps_required || 10)
                        ? '#9ca3af'
                        : primaryColor
                    }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-wider" style={{
                      color: tier1Redeemed || loyaltyCard.current_stamps >= (merchant.stamps_required || 10)
                        ? '#9ca3af'
                        : primaryColor
                    }}>
                      Palier 1 · {merchant.stamps_required} pts
                    </p>
                    <p className={`text-xs font-bold truncate ${
                      tier1Redeemed || loyaltyCard.current_stamps >= (merchant.stamps_required || 10)
                        ? 'text-gray-400'
                        : 'text-gray-700'
                    }`}>{merchant.reward_description}</p>
                  </div>
                  {tier1Redeemed ? (
                    <span className="text-[9px] font-bold text-gray-500 bg-gray-200 px-2 py-1 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" /> Utilisé
                    </span>
                  ) : loyaltyCard.current_stamps >= (merchant.stamps_required || 10) ? (
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" /> Prêt
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold bg-gray-100 px-2 py-1 rounded-full" style={{ color: primaryColor }}>
                      {(merchant.stamps_required || 10) - loyaltyCard.current_stamps} restants
                    </span>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (loyaltyCard.current_stamps / (merchant.tier2_stamps_required || 20)) * 100)}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{
                  background: tier1Redeemed || loyaltyCard.current_stamps >= (merchant.stamps_required || 10)
                    ? 'linear-gradient(90deg, #8b5cf6, #a78bfa)'
                    : `linear-gradient(90deg, ${primaryColor}, ${secondaryColor || primaryColor})`
                }}
              />
              <div
                className={`absolute top-1/2 -translate-y-1/2 w-0.5 h-4 ${tier1Redeemed ? 'bg-gray-400' : 'bg-gray-300'}`}
                style={{ left: `${((merchant.stamps_required || 10) / (merchant.tier2_stamps_required || 20)) * 100}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            {/* Single Tier */}
            <div className="mb-8">
              <div className="flex items-baseline justify-center gap-1">
                <motion.span
                  key={loyaltyCard.current_stamps}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="text-6xl font-black"
                  style={{ color: primaryColor }}
                >
                  {loyaltyCard.current_stamps}
                </motion.span>
                <span className="text-2xl font-bold text-gray-300">/{merchant.stamps_required}</span>
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
                Passages cumulés
              </p>
            </div>

            <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden mb-6">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (loyaltyCard.current_stamps / (merchant.stamps_required || 10)) * 100)}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor || primaryColor})`
                }}
              />
            </div>

            {loyaltyCard.current_stamps < (merchant.stamps_required || 10) && (
              <div
                className="rounded-2xl p-4 mb-6"
                style={{ backgroundColor: `${primaryColor}08`, borderColor: `${primaryColor}15` }}
              >
                <p className="font-bold text-gray-700">
                  Plus que {(merchant.stamps_required || 10) - loyaltyCard.current_stamps} passage{(merchant.stamps_required || 10) - loyaltyCard.current_stamps > 1 ? 's' : ''} avant votre récompense !
                </p>
              </div>
            )}
          </>
        )}

        <Link href={`/customer/card/${merchant.id}`}>
          <button className="w-full h-14 rounded-2xl font-bold border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2">
            <CreditCard className="w-5 h-5" />
            Voir ma carte complète
          </button>
        </Link>
      </div>

      {/* Push Notification Prompts */}
      {pushSupported && !pushSubscribed && pushPermission !== 'denied' && !isIOS && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-4 bg-white rounded-2xl shadow-lg border border-gray-100 p-5 overflow-hidden"
        >
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <Bell className="w-6 h-6" style={{ color: primaryColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 mb-1">🎁 Offres exclusives</h3>
              <p className="text-sm text-gray-500 mb-3">
                Promos flash, récompenses proches, surprises... ne ratez rien !
              </p>
              <button
                onClick={handlePushSubscribe}
                disabled={pushSubscribing}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: primaryColor }}
              >
                {pushSubscribing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    Oui, je veux en profiter !
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* iOS non-standalone instructions */}
      {isIOS && !pushSubscribed && !isStandalone && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg border border-blue-100 p-5 overflow-hidden"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 mb-1">🎁 Promos exclusives sur iPhone</h3>
              <p className="text-sm text-gray-600 mb-4">
                Ajoutez cette page pour recevoir nos offres en avant-première :
              </p>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 bg-white/70 rounded-xl p-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <Share className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-gray-700">
                    <span className="font-semibold">1.</span> Appuyez sur le bouton <span className="font-semibold">Partager</span>
                  </p>
                </div>
                <div className="flex items-center gap-3 bg-white/70 rounded-xl p-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <PlusSquare className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-gray-700">
                    <span className="font-semibold">2.</span> Sélectionnez <span className="font-semibold">&quot;Sur l&apos;écran d&apos;accueil&quot;</span>
                  </p>
                </div>
                <div className="flex items-center gap-3 bg-white/70 rounded-xl p-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-gray-700">
                    <span className="font-semibold">3.</span> Ouvrez l&apos;app depuis votre écran d&apos;accueil
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* iOS standalone push */}
      {isIOS && isStandalone && !pushSubscribed && pushPermission !== 'denied' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-4 bg-white rounded-2xl shadow-lg border border-gray-100 p-5 overflow-hidden"
        >
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <Bell className="w-6 h-6" style={{ color: primaryColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 mb-1">🎁 Offres exclusives</h3>
              <p className="text-sm text-gray-500 mb-3">
                Promos flash, récompenses proches, surprises... ne ratez rien !
              </p>
              <button
                onClick={handlePushSubscribe}
                disabled={pushSubscribing}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: primaryColor }}
              >
                {pushSubscribing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    Oui, je veux en profiter !
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Subscribed confirmation */}
      {pushSubscribed && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 bg-emerald-50 rounded-2xl p-4 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <Check className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="font-semibold text-emerald-800 text-sm">Notifications activées</p>
            <p className="text-xs text-emerald-600">Vous serez alerté de vos récompenses</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
