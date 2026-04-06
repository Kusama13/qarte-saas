'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import {
  ChevronRight,
  MousePointer2,
  ArrowRight,
} from 'lucide-react';
import { trackCtaClick } from '@/lib/analytics';
import { fbEvents } from '@/components/analytics/FacebookPixel';
import { ttEvents } from '@/components/analytics/TikTokPixel';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

/* ── FeatureBlock (light variant) ── */

function FeatureBlock({
  title,
  titleBold,
  description,
  visual,
  reverse = false,
  delay = 0,
}: {
  title: string;
  titleBold: string;
  description: string;
  visual: React.ReactNode;
  reverse?: boolean;
  delay?: number;
}) {
  return (
    <div className={`flex flex-col ${reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-6 md:gap-10 lg:gap-24`}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, delay, ease: EASE }}
        className="flex-1 text-center lg:text-left"
      >
        <h3 className="text-2xl md:text-5xl font-bold text-gray-900 leading-tight mb-3 md:mb-5">
          {title}{' '}
          <span className="font-[family-name:var(--font-playfair)] italic text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500 font-extrabold">
            {titleBold}
          </span>
        </h3>
        <p className="text-base md:text-xl text-gray-500 leading-relaxed max-w-md mx-auto lg:mx-0">
          {description}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, delay: delay + 0.12, ease: EASE }}
        className="flex-1 flex justify-center"
      >
        {visual}
      </motion.div>
    </div>
  );
}

function Separator() {
  return (
    <div className="flex items-center justify-center gap-3 py-2">
      <div className="w-12 h-px bg-gray-200" />
      <div className="w-1.5 h-1.5 rounded-full bg-indigo-300" />
      <div className="w-12 h-px bg-gray-200" />
    </div>
  );
}

/* ── Visuals (light) ── */

function ScanMethodsVisual({ t }: { t: (key: string) => string }) {
  return (
    <div className="relative w-full max-w-[340px] mx-auto">
      <div className="flex gap-4">
        <div className="flex-1 bg-white rounded-2xl shadow-lg shadow-gray-200/40 border border-gray-100 p-4 flex flex-col items-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-xl border-2 border-indigo-200 p-2 shadow-sm mb-3">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <rect x="5" y="5" width="25" height="25" rx="3" fill="#818cf8" />
              <rect x="70" y="5" width="25" height="25" rx="3" fill="#818cf8" />
              <rect x="5" y="70" width="25" height="25" rx="3" fill="#818cf8" />
              <rect x="10" y="10" width="15" height="15" rx="2" fill="#e0e7ff" />
              <rect x="75" y="10" width="15" height="15" rx="2" fill="#e0e7ff" />
              <rect x="10" y="75" width="15" height="15" rx="2" fill="#e0e7ff" />
              <rect x="14" y="14" width="7" height="7" rx="1" fill="#818cf8" />
              <rect x="79" y="14" width="7" height="7" rx="1" fill="#818cf8" />
              <rect x="14" y="79" width="7" height="7" rx="1" fill="#818cf8" />
              <rect x="38" y="38" width="8" height="8" rx="1.5" fill="#a78bfa" />
              <rect x="70" y="70" width="8" height="8" rx="1.5" fill="#a78bfa" />
            </svg>
          </div>
          <p className="text-xs font-bold text-gray-800">QR Code</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{t('scanQrIncluded')}</p>
        </div>

        <div className="flex-1 bg-gradient-to-br from-violet-50 to-pink-50 rounded-2xl shadow-lg shadow-violet-100/30 border border-violet-100 p-4 flex flex-col items-center">
          <div className="relative mb-3">
            <Image
              src="/images/carte-nfc-qarte.png"
              alt="Carte NFC Qarte"
              width={80}
              height={52}
              className="rounded-lg shadow-md shadow-violet-200/40"
            />
          </div>
          <p className="text-xs font-bold text-gray-800">Carte NFC</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{t('scanNfcOptional')}</p>
        </div>
      </div>

      <div className="absolute -top-3 -right-3 flex items-center gap-1.5 bg-emerald-500 rounded-full px-3 py-1.5 shadow-lg shadow-emerald-500/30 animate-float-subtle">
        <span className="text-sm">{'\u2705'}</span>
        <span className="text-xs font-bold text-white">{t('scanBadge')}</span>
      </div>
    </div>
  );
}

function ProgramBrandVisual({ t }: { t: (key: string) => string }) {
  const colors = [
    { bg: 'bg-gradient-to-br from-indigo-400 to-violet-500' },
    { bg: 'bg-gradient-to-br from-pink-300 to-rose-400' },
    { bg: 'bg-gradient-to-br from-rose-600 to-pink-700' },
    { bg: 'bg-gradient-to-br from-amber-200 to-yellow-300' },
    { bg: 'bg-gradient-to-br from-gray-300 to-gray-400', active: true },
  ];

  return (
    <div className="relative w-full max-w-[340px] mx-auto">
      <div className="absolute inset-0 -m-4 bg-indigo-100/40 rounded-3xl blur-[60px] pointer-events-none" />

      <div className="relative bg-white backdrop-blur-sm rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100 p-5">
        <div className="flex items-center justify-center gap-2.5 mb-4">
          {colors.map((color, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.06, ease: EASE }}
              className="relative"
            >
              <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full ${color.bg} ${color.active ? 'ring-2 ring-indigo-400/60 ring-offset-2 ring-offset-white' : ''} shadow-sm`} />
              {color.active && (
                <MousePointer2 className="absolute -bottom-1.5 -right-1.5 w-4 h-4 text-gray-500 drop-shadow-sm" />
              )}
            </motion.div>
          ))}
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl p-4 shadow-sm border border-indigo-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-gray-400 text-[10px] font-medium">{t('programLabel')}</p>
              <p className="text-gray-800 font-bold text-sm">{t('programSalon')}</p>
            </div>
            <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center text-sm">
              {'\uD83D\uDC9C'}
            </div>
          </div>
          <div className="grid grid-cols-5 gap-1.5 mb-3">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className={`h-6 rounded-md flex items-center justify-center ${
                  i < 6 ? 'bg-indigo-100' : 'border border-dashed border-indigo-200'
                }`}
              >
                {i < 6 && <span className="text-[10px]">{'\uD83D\uDC9C'}</span>}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-100">
            <span className="text-sm">{'\uD83C\uDF81'}</span>
            <span className="text-gray-700 text-[11px] font-semibold">{t('programReward')}</span>
            <ChevronRight className="w-3 h-3 text-gray-300 ml-auto" />
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-3">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
          <span className="text-[11px] font-semibold text-gray-400">{t('programPreview')}</span>
        </div>
      </div>

      <div className="absolute -top-3 -right-2 flex items-center gap-1.5 bg-violet-500 rounded-full px-3 py-1.5 shadow-lg shadow-violet-500/30 animate-float-subtle">
        <span className="text-sm">{'\uD83D\uDC9C'}</span>
        <span className="text-xs font-bold text-white">{t('programBadge')}</span>
      </div>
    </div>
  );
}

function InactivityVisual({ t }: { t: (key: string) => string }) {
  const reminders = [
    {
      title: t('inactivityNotif1Title'),
      subtitle: t('inactivityNotif1Sub'),
      time: t('inactivityNotif1Time'),
      color: 'bg-indigo-500',
      emoji: '\u2728',
    },
    {
      title: t('inactivityNotif2Title'),
      subtitle: t('inactivityNotif2Sub'),
      time: t('inactivityNotif2Time'),
      color: 'bg-violet-500',
      emoji: '\uD83C\uDF81',
    },
  ];

  return (
    <div className="relative w-full max-w-[320px] mx-auto">
      <div className="space-y-3">
        {reminders.map((notif, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 + i * 0.1, ease: EASE }}
            className="flex items-start gap-3 bg-white backdrop-blur-sm rounded-2xl p-4 shadow-lg shadow-gray-200/40 border border-gray-100 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className={`w-10 h-10 ${notif.color} rounded-xl flex items-center justify-center flex-shrink-0 text-lg`}>
              {notif.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-gray-800 truncate">{notif.title}</p>
                <span className="text-[10px] text-gray-300 flex-shrink-0">{notif.time}</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{notif.subtitle}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="absolute -bottom-3 right-0 flex items-center gap-1.5 bg-emerald-500 rounded-full px-3 py-1.5 shadow-lg shadow-emerald-500/30 animate-float-subtle">
        <span className="text-sm">{'\uD83D\uDD14'}</span>
        <span className="text-xs font-bold text-white">{t('inactivityBadge')}</span>
      </div>
    </div>
  );
}

function AutoOffersVisual({ t }: { t: (key: string) => string }) {
  const offers = [
    { name: t('autoOffer1'), label: t('autoOffer1Label'), color: 'bg-rose-500', emoji: '\uD83C\uDF82', badge: t('autoOffer1Badge') },
    { name: t('autoOffer2'), label: t('autoOffer2Label'), color: 'bg-pink-500', emoji: '\u2764\uFE0F', badge: t('autoOffer2Badge') },
    { name: t('autoOffer3'), label: t('autoOffer3Label'), color: 'bg-violet-500', emoji: '\uD83D\uDC95', badge: t('autoOffer3Badge') },
  ];

  return (
    <div className="relative w-full max-w-[320px] mx-auto">
      <div className="space-y-3">
        {offers.map((offer, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 + i * 0.1, ease: EASE }}
            className="flex items-center gap-3 bg-white backdrop-blur-sm rounded-2xl p-4 shadow-lg shadow-gray-200/40 border border-gray-100 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className={`w-10 h-10 ${offer.color} rounded-xl flex items-center justify-center flex-shrink-0 text-lg`}>
              {offer.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800 truncate">{offer.name}</p>
              <p className="text-xs text-gray-400">{offer.label}</p>
            </div>
            <div className="flex items-center gap-1 bg-emerald-50 rounded-full px-2.5 py-1 flex-shrink-0">
              <span className="text-[10px]">{'\u2705'}</span>
              <span className="text-[10px] font-bold text-emerald-600">{offer.badge}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="absolute -top-3 -right-2 flex items-center gap-1.5 bg-emerald-500 rounded-full px-3 py-1.5 shadow-lg shadow-emerald-500/30 animate-float-subtle">
        <span className="text-sm">{'\uD83D\uDC95'}</span>
        <span className="text-xs font-bold text-white">{t('autoBadge')}</span>
      </div>
    </div>
  );
}

function ReviewsVisual({ t }: { t: (key: string) => string }) {
  const reviews = [
    { name: 'Camille L.', text: 'Super salon, je recommande !' },
    { name: 'Ines M.', text: 'Resultat parfait, au top.' },
  ];

  return (
    <div className="relative w-full max-w-[320px] mx-auto">
      <div className="bg-white backdrop-blur-sm rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center text-base">
            {'\u2B50'}
          </div>
          <div>
            <p className="text-xs font-bold text-gray-800">{t('reviewsGoogleScore')}</p>
            <p className="text-[10px] text-gray-400">{t('reviewsCount')}</p>
          </div>
        </div>

        <div className="space-y-2.5">
          {reviews.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.15 + i * 0.1, ease: EASE }}
              className="bg-gray-50 rounded-xl p-3"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold text-gray-600">{r.name}</span>
                <div className="flex gap-0.5 ml-auto">
                  {[...Array(5)].map((_, j) => (
                    <span key={j} className="text-[10px]">{'\u2B50'}</span>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-gray-500">{r.text}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.4, ease: EASE }}
          className="mt-3 flex items-center gap-2 bg-emerald-50 rounded-xl px-3 py-2"
        >
          <span className="text-sm">{'\u2705'}</span>
          <span className="text-[11px] font-bold text-emerald-600">{t('reviewsAutoSent')}</span>
        </motion.div>
      </div>

      <div className="absolute -top-3 -right-2 flex items-center gap-1.5 bg-amber-500 rounded-full px-3 py-1.5 shadow-lg shadow-amber-500/30 animate-float-subtle">
        <span className="text-sm">{'\u2B50'}</span>
        <span className="text-xs font-bold text-white">{t('reviewsBadge')}</span>
      </div>
    </div>
  );
}

function JournalVisual({ t }: { t: (key: string) => string }) {
  const types = [
    { label: t('journalAllergy'), bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-400' },
    { label: t('journalFormula'), bg: 'bg-violet-50', text: 'text-violet-600', dot: 'bg-violet-400' },
    { label: t('journalPreference'), bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-400' },
  ];

  return (
    <div className="relative w-full max-w-[320px] mx-auto">
      <div className="bg-white backdrop-blur-sm rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100 p-5">
        {/* Client header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-rose-300/40">
            CL
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800">Camille L.</p>
            <p className="text-[10px] text-gray-400">12 visites</p>
          </div>
        </div>

        {/* Type pills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {types.map((type, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.06, ease: EASE }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${type.bg} ${type.text} text-[10px] font-bold`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${type.dot}`} />
              {type.label}
            </motion.span>
          ))}
        </div>

        {/* Pinned note */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2, ease: EASE }}
          className="bg-red-50/60 rounded-xl p-3 mb-2.5 border border-red-100/60"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px]">{'\uD83D\uDCCC'}</span>
            <span className="text-[10px] font-bold text-red-500">{t('journalPinned')}</span>
          </div>
          <p className="text-[11px] text-gray-600">{t('journalNote1')}</p>
        </motion.div>

        {/* Regular note */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3, ease: EASE }}
          className="bg-violet-50/50 rounded-xl p-3 border border-violet-100/50"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            <span className="text-[10px] font-bold text-violet-500">{t('journalFormula')}</span>
          </div>
          <p className="text-[11px] text-gray-600">{t('journalNote2')}</p>
        </motion.div>
      </div>

      <div className="absolute -top-3 -right-2 flex items-center gap-1.5 bg-indigo-500 rounded-full px-3 py-1.5 shadow-lg shadow-indigo-500/30 animate-float-subtle">
        <span className="text-sm">{'\uD83D\uDCCB'}</span>
        <span className="text-xs font-bold text-white">{t('journalBadge')}</span>
      </div>
    </div>
  );
}

/* ── Section ── */

export function FideliteSection() {
  const t = useTranslations('fidelite');

  return (
    <section className="relative py-20 md:py-28 bg-white overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-100/40 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-100/30 rounded-full blur-[120px] pointer-events-none" />
      {/* Subtle grain */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }} />

      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-center mb-14 md:mb-16"
        >
          {t('badge') && <p className="text-sm font-bold text-indigo-500 uppercase tracking-wider mb-4">
            {t('badge')}
          </p>}
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {t('title')}{' '}
            <span className="relative font-[family-name:var(--font-playfair)] italic text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">
              {t('titleBold')}
              <span className="absolute -bottom-1 left-0 right-0 h-3 bg-indigo-100/60 -skew-x-3 rounded-sm -z-10" />
            </span>
          </h2>
          {t('subtitle') && <p className="text-lg text-gray-500">{t('subtitle')}</p>}
        </motion.div>

        <div className="flex flex-col gap-6 md:gap-10 lg:gap-12">
          <FeatureBlock
            title={t('programTitle')}
            titleBold={t('programTitleBold')}
            description={t('programDesc')}
            visual={<ProgramBrandVisual t={t} />}
            delay={0.05}
          />

          <Separator />

          <FeatureBlock
            title={t('inactivityTitle')}
            titleBold={t('inactivityTitleBold')}
            description={t('inactivityDesc')}
            visual={<InactivityVisual t={t} />}
            reverse
            delay={0.05}
          />

          <Separator />

          <FeatureBlock
            title={t('reviewsTitle')}
            titleBold={t('reviewsTitleBold')}
            description={t('reviewsDesc')}
            visual={<ReviewsVisual t={t} />}
            delay={0.05}
          />

          <Separator />

          <FeatureBlock
            title={t('journalTitle')}
            titleBold={t('journalTitleBold')}
            description={t('journalDesc')}
            visual={<JournalVisual t={t} />}
            delay={0.05}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: EASE }}
          className="mt-20 text-center"
        >
          <Link
            href="/auth/merchant/signup"
            onClick={() => { trackCtaClick('fidelite_cta', 'fidelite_section'); fbEvents.initiateCheckout(); ttEvents.clickButton(); }}
            className="group inline-flex items-center gap-2 px-8 py-4 bg-gray-900 text-white font-bold rounded-xl shadow-lg shadow-gray-900/20 hover:shadow-gray-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
          >
            {t('cta')}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <p className="text-sm text-gray-400 mt-3">{t('ctaSub')}</p>
        </motion.div>
      </div>
    </section>
  );
}
