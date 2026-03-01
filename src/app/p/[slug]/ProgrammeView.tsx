'use client';

import { motion } from 'framer-motion';
import { Gift, Users, Zap, Trophy, CalendarDays } from 'lucide-react';
import SocialLinks from '@/components/loyalty/SocialLinks';
import { formatDoubleDays } from '@/lib/utils';
import type { Merchant } from '@/types';

type MerchantPublic = Pick<
  Merchant,
  | 'id'
  | 'shop_name'
  | 'logo_url'
  | 'primary_color'
  | 'secondary_color'
  | 'stamps_required'
  | 'reward_description'
  | 'tier2_enabled'
  | 'tier2_stamps_required'
  | 'tier2_reward_description'
  | 'birthday_gift_enabled'
  | 'birthday_gift_description'
  | 'referral_program_enabled'
  | 'referral_reward_referrer'
  | 'referral_reward_referred'
  | 'double_days_enabled'
  | 'double_days_of_week'
  | 'booking_url'
  | 'instagram_url'
  | 'facebook_url'
  | 'tiktok_url'
>;

export default function ProgrammeView({ merchant }: { merchant: MerchantPublic }) {
  const p = merchant.primary_color;
  const s = merchant.secondary_color || merchant.primary_color;

  const reward = merchant.reward_description || '';
  const heroTagline =
    reward.length > 0 && reward.length <= 38
      ? `Chaque visite vous rapproche de ${reward.charAt(0).toLowerCase() + reward.slice(1)}.`
      : 'Revenez, et laissez-nous vous récompenser.';

  const hasAdvantages =
    (merchant.birthday_gift_enabled && !!merchant.birthday_gift_description) ||
    (merchant.referral_program_enabled && !!(merchant.referral_reward_referrer || merchant.referral_reward_referred)) ||
    merchant.double_days_enabled;

  const hasBooking = !!(merchant.booking_url && merchant.booking_url.trim());

  return (
    <div className="min-h-screen bg-[#f7f6fb]">

      {/* ── HERO ── */}
      <section className="lg:mx-auto lg:max-w-lg">
        <div className="flex flex-col items-center pt-12 pb-6 px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.82, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="w-[100px] h-[100px] rounded-[1.75rem] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.1)] border border-gray-100 flex items-center justify-center overflow-hidden mb-4"
          >
            {merchant.logo_url ? (
              <img src={merchant.logo_url} alt={merchant.shop_name} className="w-full h-full object-cover rounded-[1.4rem]" />
            ) : (
              <div
                className="w-full h-full rounded-[1.4rem] flex items-center justify-center text-white text-4xl font-black"
                style={{ background: `linear-gradient(135deg, ${p}cc, ${s})` }}
              >
                {merchant.shop_name[0]}
              </div>
            )}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="text-[24px] font-black tracking-tight text-gray-900 leading-tight mb-2"
          >
            {merchant.shop_name}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.4 }}
            className="text-[14px] text-gray-500 leading-relaxed max-w-[270px] font-medium"
          >
            {heroTagline}
          </motion.p>
        </div>
      </section>

      {/* ── CONTENU ── */}
      <div className="mx-auto lg:max-w-lg px-4 pb-12 space-y-3">

        {/* CTA principal — visible avant tout défilement */}
        {hasBooking && (
          <motion.a
            href={merchant.booking_url!}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="flex items-center justify-center gap-2.5 w-full py-4 rounded-2xl text-white font-bold text-[15px] transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              background: `linear-gradient(135deg, ${p}, ${s})`,
              boxShadow: `0 4px 20px ${p}40`,
            }}
          >
            <CalendarDays className="w-5 h-5" />
            Réserver ma première visite
          </motion.a>
        )}

        {/* Accroche fidélité */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="bg-white rounded-2xl px-5 py-4 border border-gray-100 shadow-[0_2px_16px_rgba(0,0,0,0.05)]"
        >
          <p className="text-[14px] text-gray-600 leading-relaxed">
            Dès votre première visite, votre carte démarre.
            {' '}À chaque passage, vous accumulez des avantages — jusqu'à une récompense offerte, rien que pour vous.
            {merchant.tier2_enabled && ' Plus vous revenez, plus les récompenses sont généreuses.'}
          </p>
        </motion.div>

        {/* Section label */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.35 }}
          className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 px-1 pt-2"
        >
          Vos récompenses
        </motion.p>

        {/* Tier 1 */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.33, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${p}, ${s})`,
            boxShadow: `0 4px 28px ${p}45`,
          }}
        >
          <motion.div
            animate={{ x: ['-150%', '200%'] }}
            transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12 pointer-events-none"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_40%,rgba(255,255,255,0.16),transparent_60%)] pointer-events-none" />

          <span
            className="absolute right-3 -bottom-2 text-[96px] font-black leading-none pointer-events-none select-none"
            style={{ color: 'rgba(255,255,255,0.08)' }}
          >
            {merchant.stamps_required}
          </span>

          <div className="relative px-6 pt-6 pb-7">
            <p className="text-[10px] font-bold text-white/55 mb-2 uppercase tracking-widest">
              Après {merchant.stamps_required} visites
            </p>
            <p className="text-[22px] font-black text-white leading-snug max-w-[72%] tracking-tight">
              {merchant.reward_description || 'Récompense fidélité'}
            </p>
            <p className="text-[12px] text-white/60 mt-2 font-medium">
              Offert, rien que pour vous.
            </p>
          </div>
        </motion.div>

        {/* Tier 2 */}
        {merchant.tier2_enabled && merchant.tier2_reward_description && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-2xl overflow-hidden"
            style={{
              background: `linear-gradient(135deg, #100c22, ${p}85)`,
              boxShadow: `0 4px 28px rgba(0,0,0,0.18), inset 0 0 0 1px ${p}30`,
            }}
          >
            <motion.div
              animate={{ x: ['-150%', '200%'] }}
              transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 5, ease: 'easeInOut' }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12 pointer-events-none"
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: `radial-gradient(circle at 75% 55%, ${p}30, transparent 65%)` }}
            />

            <span
              className="absolute right-3 -bottom-2 text-[96px] font-black leading-none pointer-events-none select-none"
              style={{ color: 'rgba(255,255,255,0.06)' }}
            >
              {merchant.tier2_stamps_required}
            </span>

            <div className="relative px-6 pt-6 pb-7">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-3.5 h-3.5 text-white/40" />
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  Après {merchant.tier2_stamps_required} visites
                </p>
              </div>
              <p className="text-[22px] font-black text-white leading-snug max-w-[72%] tracking-tight">
                {merchant.tier2_reward_description}
              </p>
              <p className="text-[12px] text-white/50 mt-2 font-medium">
                Pour les plus fidèles d'entre vous.
              </p>
            </div>
          </motion.div>
        )}

        {/* ── AVANTAGES EXCLUSIFS ── */}
        {hasAdvantages && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.46, duration: 0.45, ease: 'easeOut' }}
            className="bg-white rounded-2xl overflow-hidden border border-gray-100/80 shadow-[0_2px_20px_rgba(0,0,0,0.06)]"
          >
            <div className="px-5 pt-4 pb-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.18em]">
                Vos avantages exclusifs
              </p>
            </div>

            <div className="divide-y divide-gray-100/80">
              {merchant.birthday_gift_enabled && merchant.birthday_gift_description && (
                <div className="px-5 py-4 flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${p}18` }}>
                    <Gift className="w-4 h-4" style={{ color: p }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-gray-800 leading-tight">Cadeau d'anniversaire</p>
                    <p className="text-[12px] text-gray-500 mt-0.5 leading-snug">
                      Le mois de votre anniversaire,{' '}
                      {merchant.birthday_gift_description.charAt(0).toLowerCase() +
                        merchant.birthday_gift_description.slice(1)} vous attend — c'est notre façon de vous dire merci.
                    </p>
                  </div>
                </div>
              )}

              {merchant.referral_program_enabled && (merchant.referral_reward_referrer || merchant.referral_reward_referred) && (
                <div className="px-5 py-4 flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${p}18` }}>
                    <Users className="w-4 h-4" style={{ color: p }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-gray-800 leading-tight">Partagez, soyez récompensé</p>
                    {merchant.referral_reward_referrer && (
                      <p className="text-[12px] text-gray-500 mt-0.5 leading-snug">
                        Chaque ami que vous ramenez vous offre {merchant.referral_reward_referrer}.
                      </p>
                    )}
                    {merchant.referral_reward_referred && (
                      <p className="text-[12px] text-gray-500 mt-0.5 leading-snug">
                        Votre ami bénéficie de {merchant.referral_reward_referred} dès sa première visite.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {merchant.double_days_enabled && (
                <div className="px-5 py-4 flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-gray-800 leading-tight">Jours bonus</p>
                    <p className="text-[12px] text-gray-500 mt-0.5 leading-snug">
                      Les {formatDoubleDays(merchant.double_days_of_week)}, chaque passage compte double — profitez-en.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── RÉSEAUX SOCIAUX ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.54, duration: 0.4, ease: 'easeOut' }}
          className="pt-1"
        >
          <SocialLinks merchant={merchant as Merchant} />
        </motion.div>

        {/* ── FOOTER ── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65, duration: 0.5 }}
          className="text-center text-[11px] text-gray-400 font-medium pt-3 pb-2"
        >
          Propulsé par{' '}
          <a
            href="https://getqarte.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#4b0082] hover:text-[#654EDA] transition-colors"
          >
            Qarte
          </a>
        </motion.p>

      </div>
    </div>
  );
}
