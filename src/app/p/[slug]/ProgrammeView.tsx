'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Users, Zap, Trophy, CalendarDays, Sparkles, MapPin, Navigation, X, ChevronLeft, ChevronRight, ChevronDown, Clock } from 'lucide-react';
import SocialLinks from '@/components/loyalty/SocialLinks';
import SimulatedCard from './SimulatedCard';
import { useInView } from '@/hooks/useInView';
import { formatDoubleDays } from '@/lib/utils';
import type { Merchant } from '@/types';

type Photo = { id: string; url: string; position: number };
type ServiceCategory = { id: string; name: string; position: number };
type Service = { id: string; name: string; price: number; position: number; category_id: string | null; duration: number | null; description: string | null; price_from: boolean };
type PromoOffer = { id: string; title: string; description: string; expires_at: string | null };

type MerchantPublic = Pick<
  Merchant,
  | 'id'
  | 'slug'
  | 'shop_name'
  | 'shop_type'
  | 'shop_address'
  | 'bio'
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
  | 'welcome_offer_enabled'
  | 'welcome_offer_description'
  | 'welcome_referral_code'
  | 'scan_code'
  | 'double_days_enabled'
  | 'double_days_of_week'
  | 'booking_url'
  | 'instagram_url'
  | 'facebook_url'
  | 'tiktok_url'
  | 'snapchat_url'
  | 'loyalty_mode'
  | 'cagnotte_percent'
  | 'cagnotte_tier2_percent'
  | 'opening_hours'
>;

export default function ProgrammeView({ merchant, photos = [], services = [], serviceCategories = [], isDemo = false }: { merchant: MerchantPublic; photos?: Photo[]; services?: Service[]; serviceCategories?: ServiceCategory[]; isDemo?: boolean }) {
  const p = merchant.primary_color;
  const s = merchant.secondary_color || merchant.primary_color;
  const isCagnotte = merchant.loyalty_mode === 'cagnotte';
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [promoOffer, setPromoOffer] = useState<PromoOffer | null>(null);

  // Opening hours
  const DAY_LABELS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const hours = merchant.opening_hours;
  const hasHours = hours && Object.values(hours).some(Boolean);
  // JS getDay(): 0=dimanche → we need 1=lundi format
  const todayIndex = new Date().getDay(); // 0=dim, 1=lun...
  const todayKey = todayIndex === 0 ? '7' : String(todayIndex); // 1-7, 1=lundi

  // Fetch active promo offer
  useEffect(() => {
    if (isDemo) return;
    fetch(`/api/merchant-offers?merchantId=${merchant.id}&public=true`)
      .then(r => r.json())
      .then(data => {
        if (data.offers?.length > 0) setPromoOffer(data.offers[0]);
      })
      .catch(() => {});
  }, [merchant.id, isDemo]);
  const glassCard = 'rounded-2xl overflow-hidden bg-white/70 backdrop-blur-sm border border-white/60 shadow-lg shadow-gray-200/40';

  // Keyboard navigation for lightbox
  const handleLightboxKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setLightboxIndex(null);
    if (e.key === 'ArrowLeft') setLightboxIndex(prev => prev === null ? null : (prev - 1 + photos.length) % photos.length);
    if (e.key === 'ArrowRight') setLightboxIndex(prev => prev === null ? null : (prev + 1) % photos.length);
  }, [photos.length]);

  useEffect(() => {
    if (lightboxIndex !== null) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleLightboxKey);
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleLightboxKey);
      };
    }
  }, [lightboxIndex, handleLightboxKey]);

  const reward = merchant.reward_description || '';

  const hasAdvantages =
    (merchant.birthday_gift_enabled && !!merchant.birthday_gift_description) ||
    (merchant.referral_program_enabled && !!(merchant.referral_reward_referrer || merchant.referral_reward_referred)) ||
    merchant.double_days_enabled;

  const hasBooking = !!(merchant.booking_url && merchant.booking_url.trim());
  const noOp = (e: React.MouseEvent) => { e.preventDefault(); };

  // Services: pre-compute outside JSX
  const hasCategories = serviceCategories.length > 0;
  const uncategorized = services.filter(svc => !svc.category_id || !serviceCategories.find(c => c.id === svc.category_id));

  const fmtDuration = (min: number) => {
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
  };

  // Scroll-triggered refs
  const { ref: topCtaRef, isInView: topCtaVisible } = useInView({ once: false });
  const { ref: tier2Ref, isInView: tier2InView } = useInView();
  const { ref: advantagesRef, isInView: advantagesInView } = useInView();
  const { ref: socialRef, isInView: socialInView } = useInView();

  return (
    <div className="min-h-screen bg-[#f7f6fb] relative">

      {/* ── AMBIENT BACKGROUND BLOBS ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="animate-blob absolute -top-20 -left-20 w-72 h-72 rounded-full blur-3xl opacity-[0.12]"
          style={{ backgroundColor: p }}
        />
        <div
          className="animate-blob absolute -bottom-20 -right-20 w-72 h-72 rounded-full blur-3xl opacity-[0.08]"
          style={{ backgroundColor: s, animationDelay: '3s' }}
        />
      </div>

      {/* ── HERO ── */}
      <section className="lg:mx-auto lg:max-w-lg relative">
        <div className="flex flex-col items-center pt-12 pb-6 px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.82, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="w-[100px] h-[100px] rounded-[1.75rem] bg-white flex items-center justify-center overflow-hidden mb-4"
            style={{ boxShadow: `0 0 0 3px ${p}25, 0 4px 24px ${p}20` }}
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
            className="text-[28px] font-black tracking-tight leading-tight mb-2"
            style={{ background: `linear-gradient(135deg, ${p}, ${s})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            {merchant.shop_name}
          </motion.h1>

          {merchant.shop_address && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.35 }}
              className="flex items-center gap-1 text-[12px] text-gray-400 font-medium mb-2"
            >
              <MapPin className="w-3 h-3 shrink-0" />
              <span>{merchant.shop_address}</span>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(merchant.shop_address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold transition-colors"
                style={{ backgroundColor: `${p}15`, color: p }}
              >
                <Navigation className="w-2.5 h-2.5" />
                Y aller
              </a>
            </motion.div>
          )}


        </div>
      </section>

      {/* ── CONTENU ── */}
      <div className="mx-auto lg:max-w-lg px-4 pb-20 space-y-3 relative">

        {/* ── MINI BIO ── */}
        {merchant.bio && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className={`${glassCard} px-5 py-4 text-center relative overflow-hidden`}
            style={{ borderColor: `${p}15` }}
          >
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ background: `linear-gradient(135deg, ${p}, ${s})` }} />
            <p className="relative text-[13px] text-gray-600 leading-relaxed font-medium italic">
              &ldquo;{merchant.bio}&rdquo;
            </p>
          </motion.div>
        )}

        {/* CTA principal */}
        {hasBooking && (
          <motion.a
            ref={topCtaRef as unknown as React.Ref<HTMLAnchorElement>}
            href={isDemo ? '#' : merchant.booking_url!}
            target={isDemo ? undefined : '_blank'}
            rel={isDemo ? undefined : 'noopener noreferrer'}
            onClick={isDemo ? noOp : undefined}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="flex items-center justify-center gap-2.5 w-full py-4 rounded-2xl text-white font-bold text-[15px] transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              background: `linear-gradient(135deg, ${p}, ${s})`,
              boxShadow: `0 4px 20px ${p}40`,
            }}
          >
            <CalendarDays className="w-5 h-5" />
            Prendre rendez-vous
          </motion.a>
        )}

        {/* ── HORAIRES ── */}
        {hasHours && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.4 }}
            className={`${glassCard} p-4`}
          >
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.18em] mb-2.5">
              <Clock className="w-3 h-3 inline-block mr-1 -mt-0.5" />
              Horaires
            </p>
            <div className="grid grid-cols-7 gap-1">
              {DAY_LABELS_SHORT.map((label, i) => {
                const dayKey = String(i + 1);
                const slot = hours![dayKey];
                const isToday = dayKey === todayKey;
                return (
                  <div
                    key={dayKey}
                    className={`text-center rounded-lg py-1.5 transition-colors ${
                      slot ? 'bg-gray-50' : 'bg-gray-50/50 opacity-50'
                    }`}
                    style={isToday ? { boxShadow: `0 0 0 1px ${p}`, backgroundColor: `${p}08` } : undefined}
                  >
                    <p className={`text-[10px] font-bold mb-0.5 ${isToday ? '' : 'text-gray-500'}`} style={isToday ? { color: p } : undefined}>
                      {label}
                    </p>
                    {slot ? (
                      <>
                        <p className="text-[9px] text-gray-600 font-medium">{slot.open}</p>
                        <p className="text-[9px] text-gray-600 font-medium">{slot.close}</p>
                      </>
                    ) : (
                      <p className="text-[9px] text-gray-400 font-medium">Fermé</p>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── OFFRE DE BIENVENUE (nouveaux clients) ── */}
        {merchant.welcome_offer_enabled && merchant.welcome_offer_description && merchant.welcome_referral_code && merchant.scan_code && (
          <motion.a
            href={isDemo ? '#' : `/scan/${merchant.scan_code}?welcome=${merchant.welcome_referral_code}`}
            onClick={isDemo ? noOp : undefined}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.28, ease: 'easeOut' }}
            className="block rounded-2xl overflow-hidden border-2 shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
            style={{ borderColor: `${p}40`, boxShadow: `0 4px 24px ${p}20` }}
          >
            <div
              className="px-5 py-5 flex items-center gap-4"
              style={{ background: `linear-gradient(135deg, ${p}12, ${p}06)` }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: `${p}20` }}
              >
                <Sparkles className="w-6 h-6" style={{ color: p }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] mb-0.5" style={{ color: p }}>
                  Offre de bienvenue
                </p>
                <p className="text-[15px] font-bold text-gray-800 leading-tight">
                  {merchant.welcome_offer_description}
                </p>
                <p className="text-[12px] text-gray-500 mt-1">
                  Inscrivez-vous pour en profiter
                </p>
              </div>
              <div
                className="shrink-0 px-4 py-2 rounded-xl text-[13px] font-bold text-white"
                style={{ background: p }}
              >
                En profiter
              </div>
            </div>
            <div className="px-5 pb-4" style={{ background: `linear-gradient(135deg, ${p}06, transparent)` }}>
              <p className="text-[12px] text-gray-500 leading-relaxed">
                Créez votre compte pour recevoir votre bon. Présentez-le lors de votre prochain rendez-vous pour en bénéficier.
              </p>
            </div>
          </motion.a>
        )}

        {/* ── OFFRE PROMO (tout le monde) — style amber distinct ── */}
        {promoOffer && merchant.scan_code && (
          <motion.a
            href={`/scan/${merchant.scan_code}?offer=${promoOffer.id}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.32, ease: 'easeOut' }}
            className="block rounded-2xl overflow-hidden border-2 shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
            style={{ borderColor: '#f59e0b40', boxShadow: '0 4px 24px #f59e0b20' }}
          >
            <div
              className="px-5 py-5 flex items-center gap-4"
              style={{ background: 'linear-gradient(135deg, #f59e0b12, #f59e0b06)' }}
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-amber-100">
                <Gift className="w-6 h-6 text-amber-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] mb-0.5 text-amber-600">
                  {promoOffer.title}
                </p>
                <p className="text-[15px] font-bold text-gray-800 leading-tight">
                  {promoOffer.description}
                </p>
                <p className="text-[12px] text-gray-500 mt-1">
                  Offre ouverte a tous
                </p>
              </div>
              <div className="shrink-0 px-4 py-2 rounded-xl text-[13px] font-bold text-white bg-amber-500">
                En profiter
              </div>
            </div>
            <div className="px-5 pb-4" style={{ background: 'linear-gradient(135deg, #f59e0b06, transparent)' }}>
              <p className="text-[12px] text-gray-500 leading-relaxed">
                Inscrivez-vous pour recevoir votre bon. Présentez-le lors de votre prochain rendez-vous.
                {promoOffer.expires_at && (
                  <span className="font-semibold text-amber-700"> Valable jusqu&apos;au {new Date(promoOffer.expires_at).toLocaleDateString('fr-FR')}.</span>
                )}
              </p>
            </div>
          </motion.a>
        )}

        {/* Label carte simulée */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.35 }}
          className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 px-1 pt-2"
        >
          Carte de fidelite
        </motion.p>

        {/* SimulatedCard — LE centerpiece */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <SimulatedCard
            stampsRequired={merchant.stamps_required}
            rewardDescription={
              isCagnotte
                ? `${merchant.cagnotte_percent}% sur votre cagnotte fidélité`
                : (merchant.reward_description || 'Récompense fidélité')
            }
            primaryColor={p}
            secondaryColor={s}
          />
        </motion.div>

        {/* Note carte fidélité */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.4 }}
          className="text-center text-[11px] text-gray-400 font-medium -mt-1"
        >
          En devenant client, vous recevez votre carte de fidelite et cumulez des recompenses a chaque passage.
        </motion.p>

        {/* Tier 2 */}
        {merchant.tier2_enabled && (merchant.tier2_reward_description || (isCagnotte && merchant.cagnotte_tier2_percent)) && (
          <motion.div
            ref={tier2Ref}
            initial={{ opacity: 0, y: 18 }}
            animate={tier2InView ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
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
                {isCagnotte
                  ? `${merchant.cagnotte_tier2_percent}% sur votre cagnotte fidélité`
                  : merchant.tier2_reward_description}
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
            ref={advantagesRef}
            initial={{ opacity: 0, y: 16 }}
            animate={advantagesInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className={glassCard}
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

        {/* ── GALERIE PHOTOS ── */}
        {photos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.4 }}
            className={`${glassCard} p-4`}
          >
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.18em] mb-3">
              Nos réalisations
            </p>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo, idx) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setLightboxIndex(idx)}
                  className="aspect-square rounded-xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ '--tw-ring-color': p } as React.CSSProperties}
                >
                  <img
                    src={photo.url}
                    alt={`${merchant.shop_name} - réalisation ${photo.position}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── PRESTATIONS ── */}
        {services.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.15, ease: 'easeOut' }}
            className="rounded-2xl overflow-hidden border shadow-lg shadow-gray-200/40"
            style={{ borderColor: `${p}20`, background: `linear-gradient(135deg, ${p}06, ${s}04)` }}
          >
            <button
              type="button"
              onClick={() => setServicesOpen(!servicesOpen)}
              className="w-full px-5 pt-5 pb-4 flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${p}, ${s})`, boxShadow: `0 4px 12px ${p}30` }}
                >
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[15px] font-bold text-gray-900">
                    Mes prestations
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {services.length} prestation{services.length > 1 ? 's' : ''} — voir les tarifs
                  </p>
                </div>
              </div>
              <motion.div
                animate={{ rotate: servicesOpen ? 180 : 0 }}
                transition={{ duration: 0.25 }}
              >
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </motion.div>
            </button>

            <AnimatePresence initial={false}>
              {servicesOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-4">
                    {hasCategories ? (
                      <>
                        {serviceCategories.map((cat) => {
                          const catServices = services.filter(svc => svc.category_id === cat.id);
                          if (catServices.length === 0) return null;
                          return (
                            <div key={cat.id} className="mb-3 last:mb-0">
                              <p className="text-[11px] font-bold uppercase tracking-wider mb-1 pt-2" style={{ color: p }}>
                                {cat.name}
                              </p>
                              {catServices.map((svc, idx) => (
                                <div
                                  key={svc.id}
                                  className={`py-3 ${idx < catServices.length - 1 ? 'border-b border-gray-100/80' : ''}`}
                                >
                                  <div className="flex items-center justify-between">
                                    <p className="text-[13px] font-medium text-gray-700">{svc.name}</p>
                                    <div className="flex items-center gap-2 shrink-0 ml-4">
                                      {svc.duration && (
                                        <span className="text-[11px] text-gray-400 flex items-center gap-0.5">
                                          <Clock className="w-3 h-3" />
                                          {fmtDuration(svc.duration)}
                                        </span>
                                      )}
                                      <p className="text-[13px] font-bold text-gray-900">
                                        {svc.price_from && <span className="text-[11px] font-normal text-gray-400">dès </span>}
                                        {Number(svc.price).toFixed(2).replace('.', ',')} &euro;
                                      </p>
                                    </div>
                                  </div>
                                  {svc.description && (
                                    <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{svc.description}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          );
                        })}
                        {uncategorized.length > 0 && (
                          <div className="mt-1">
                            {uncategorized.map((svc, idx) => (
                              <div
                                key={svc.id}
                                className={`py-3 ${idx < uncategorized.length - 1 ? 'border-b border-gray-100/80' : ''}`}
                              >
                                <div className="flex items-center justify-between">
                                  <p className="text-[13px] font-medium text-gray-700">{svc.name}</p>
                                  <div className="flex items-center gap-2 shrink-0 ml-4">
                                    {svc.duration && (
                                      <span className="text-[11px] text-gray-400 flex items-center gap-0.5">
                                        <Clock className="w-3 h-3" />
                                        {fmtDuration(svc.duration)}
                                      </span>
                                    )}
                                    <p className="text-[13px] font-bold text-gray-900">
                                      {svc.price_from && <span className="text-[11px] font-normal text-gray-400">dès </span>}
                                      {Number(svc.price).toFixed(2).replace('.', ',')} &euro;
                                    </p>
                                  </div>
                                </div>
                                {svc.description && (
                                  <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{svc.description}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      services.map((svc, idx) => (
                        <div
                          key={svc.id}
                          className={`py-3 ${idx < services.length - 1 ? 'border-b border-gray-100/80' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-[13px] font-medium text-gray-700">{svc.name}</p>
                            <div className="flex items-center gap-2 shrink-0 ml-4">
                              {svc.duration && (
                                <span className="text-[11px] text-gray-400 flex items-center gap-0.5">
                                  <Clock className="w-3 h-3" />
                                  {fmtDuration(svc.duration)}
                                </span>
                              )}
                              <p className="text-[13px] font-bold text-gray-900">
                                {svc.price_from && <span className="text-[11px] font-normal text-gray-400">dès </span>}
                                {Number(svc.price).toFixed(2).replace('.', ',')} &euro;
                              </p>
                            </div>
                          </div>
                          {svc.description && (
                            <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{svc.description}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── RÉSEAUX SOCIAUX ── */}
        <motion.div
          ref={socialRef}
          initial={{ opacity: 0, y: 14 }}
          animate={socialInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="pt-1"
        >
          <SocialLinks merchant={merchant as Merchant} />
        </motion.div>

        {/* ── CTA MERCHANT ── */}
        <motion.a
          href="https://getqarte.com/auth/merchant/signup"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="block text-center py-4 px-5 rounded-2xl bg-white border border-gray-100/80 shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-md transition-all"
        >
          <p className="text-[13px] font-bold text-gray-800">Crée ta page beauté gratuitement</p>
          <p className="text-[11px] text-gray-400 mt-0.5">En 5 min sur getqarte.com</p>
        </motion.a>

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

      {/* ── STICKY CTA BAR ── */}
      <AnimatePresence>
        {hasBooking && !topCtaVisible && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{merchant.shop_name}</p>
              </div>
              <a
                href={isDemo ? '#' : merchant.booking_url!}
                target={isDemo ? undefined : '_blank'}
                rel={isDemo ? undefined : 'noopener noreferrer'}
                onClick={isDemo ? noOp : undefined}
                className="shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${p}, ${s})`,
                  boxShadow: `0 4px 14px ${p}30`,
                }}
              >
                Prendre rendez-vous
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── LIGHTBOX ── */}
      <AnimatePresence>
        {lightboxIndex !== null && photos[lightboxIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setLightboxIndex(null)}
          >
            <button
              type="button"
              aria-label="Fermer"
              className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors z-10"
              onClick={() => setLightboxIndex(null)}
            >
              <X className="w-6 h-6" />
            </button>

            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Photo précédente"
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-white/60 hover:text-white transition-colors z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex(prev => prev === null ? null : (prev - 1 + photos.length) % photos.length);
                  }}
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  type="button"
                  aria-label="Photo suivante"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/60 hover:text-white transition-colors z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex(prev => prev === null ? null : (prev + 1) % photos.length);
                  }}
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}

            <motion.img
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.2 }}
              src={photos[lightboxIndex].url}
              alt={`${merchant.shop_name} - réalisation ${photos[lightboxIndex].position}`}
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── JSON-LD STRUCTURED DATA ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: merchant.shop_name,
            ...(merchant.shop_address && {
              address: {
                '@type': 'PostalAddress',
                streetAddress: merchant.shop_address,
              },
            }),
            ...(photos.length > 0 && {
              image: photos.map(ph => ph.url),
            }),
            ...(merchant.logo_url && { logo: merchant.logo_url }),
            url: `https://getqarte.com/p/${merchant.slug}`,
            makesOffer: {
              '@type': 'Offer',
              description: 'Programme de fidélité digitale',
            },
          }),
        }}
      />
    </div>
  );
}
