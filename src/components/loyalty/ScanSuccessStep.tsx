'use client';

import Link from 'next/link';
import {
  Check,
  Gift,
  CreditCard,
  Loader2,
  Bell,
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

            {/* Tier Cards */}
            <div className="space-y-3 mb-4">
              {/* Active Tier Card (on top) */}
              {tier1Redeemed || loyaltyCard.current_stamps >= (merchant.stamps_required || 10) ? (
                <>
                  {/* Tier 2 = Active */}
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50/50 to-white p-4"
                    style={{
                      boxShadow: `0 8px 24px -6px rgba(139,92,246,0.15), 0 4px 12px -4px rgba(0,0,0,0.06)`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        loyaltyCard.current_stamps >= (merchant.tier2_stamps_required || 20)
                          ? 'bg-violet-100'
                          : 'bg-violet-50'
                      }`}>
                        <Trophy className={`w-5 h-5 ${
                          loyaltyCard.current_stamps >= (merchant.tier2_stamps_required || 20)
                            ? 'text-violet-600'
                            : 'text-violet-400'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-violet-500">
                          Palier 2 · {merchant.tier2_stamps_required} pts
                        </p>
                        <p className="text-sm font-bold text-gray-800 leading-tight">
                          {merchant.tier2_reward_description}
                        </p>
                      </div>
                      {loyaltyCard.current_stamps >= (merchant.tier2_stamps_required || 20) ? (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1 flex-shrink-0">
                          <Check className="w-3 h-3" /> Prêt
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-violet-500 bg-violet-50 px-2.5 py-1 rounded-full flex-shrink-0">
                          {(merchant.tier2_stamps_required || 20) - loyaltyCard.current_stamps} restants
                        </span>
                      )}
                    </div>
                  </motion.div>
                  {/* Tier 1 = Completed/Used */}
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 opacity-60">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <Gift className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Palier 1 · {merchant.stamps_required} pts
                        </p>
                        <p className="text-xs font-bold text-gray-400 leading-tight">
                          {merchant.reward_description}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-gray-500 bg-gray-200 px-2 py-1 rounded-full flex items-center gap-1 flex-shrink-0">
                        <Check className="w-3 h-3" /> {tier1Redeemed ? 'Utilisé' : 'Atteint'}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Tier 1 = Active */}
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="rounded-2xl border bg-white p-4"
                    style={{
                      borderColor: `${primaryColor}25`,
                      boxShadow: `0 8px 24px -6px ${primaryColor}20, 0 4px 12px -4px rgba(0,0,0,0.06)`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${primaryColor}15` }}
                      >
                        <Gift className="w-5 h-5" style={{ color: primaryColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: primaryColor }}>
                          Palier 1 · {merchant.stamps_required} pts
                        </p>
                        <p className="text-sm font-bold text-gray-800 leading-tight">
                          {merchant.reward_description}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold bg-gray-100 px-2.5 py-1 rounded-full flex-shrink-0" style={{ color: primaryColor }}>
                        {(merchant.stamps_required || 10) - loyaltyCard.current_stamps} restants
                      </span>
                    </div>
                  </motion.div>
                  {/* Tier 2 = Locked */}
                  <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-3 opacity-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <Trophy className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Palier 2 · {merchant.tier2_stamps_required} pts
                        </p>
                        <p className="text-xs font-bold text-gray-400 leading-tight">
                          {merchant.tier2_reward_description}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
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
