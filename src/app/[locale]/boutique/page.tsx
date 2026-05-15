'use client';

import Image from 'next/image';
import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  Smartphone,
  Zap,
  Infinity as InfinityIcon,
  ShieldCheck,
  Eye,
  Nfc,
  BadgeCheck,
  Check,
  X,
  ChevronDown,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import LandingNav from '@/components/landing/LandingNav';
import { FooterDark } from '@/components/landing';

const STRIPE_NFC_URL = 'https://buy.stripe.com/4gM7sN6DYccX75dduH7g401';
const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

function reveal(delay = 0) {
  return {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-80px' },
    transition: { duration: 0.65, delay, ease: EASE },
  };
}

export default function CarteNFCPage() {
  const t = useTranslations('boutique');
  const reduce = useReducedMotion();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const steps = [
    { icon: Eye, title: t('step1Title'), desc: t('step1Desc') },
    { icon: Nfc, title: t('step2Title'), desc: t('step2Desc') },
    { icon: BadgeCheck, title: t('step3Title'), desc: t('step3Desc') },
  ];

  const trust = [
    { icon: Smartphone, title: t('trust1Title'), desc: t('trust1Desc') },
    { icon: Zap, title: t('trust2Title'), desc: t('trust2Desc') },
    { icon: InfinityIcon, title: t('trust3Title'), desc: t('trust3Desc') },
    { icon: ShieldCheck, title: t('trust4Title'), desc: t('trust4Desc') },
  ];

  const faqs = [1, 2, 3, 4, 5].map((n) => ({
    q: t(`faq${n}Q`),
    a: t(`faq${n}A`),
  }));

  return (
    <>
      <LandingNav minimal />

      <main>
        {/* ── HERO — drenched violet ── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#4b0082] via-violet-700 to-violet-800">
          <div
            aria-hidden
            className="absolute -top-32 -right-24 w-[28rem] h-[28rem] rounded-full bg-fuchsia-500/25 blur-[120px]"
          />
          <div
            aria-hidden
            className="absolute -bottom-40 -left-32 w-[30rem] h-[30rem] rounded-full bg-indigo-400/20 blur-[130px]"
          />

          <div className="relative max-w-6xl mx-auto px-5 pt-[124px] pb-20 md:pb-28 grid lg:grid-cols-2 gap-14 lg:gap-10 items-center">
            {/* Texte */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE }}
              className="text-center lg:text-left"
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/12 border border-white/20 text-white/90 text-xs font-semibold backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5" />
                {t('heroBadge')}
              </span>

              <h1 className="mt-5 text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.05] tracking-tight">
                {t('heroTitle')}{' '}
                <span className="font-[family-name:var(--font-display)] italic font-extrabold text-fuchsia-200">
                  {t('heroTitleAccent')}
                </span>
              </h1>

              <p className="mt-5 text-base md:text-lg text-white/75 leading-relaxed max-w-md mx-auto lg:mx-0">
                {t('heroDescription')}
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 lg:justify-start justify-center">
                <a
                  href={STRIPE_NFC_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2.5 pl-6 pr-5 py-3.5 bg-white text-[#4b0082] font-bold rounded-2xl shadow-xl shadow-violet-950/30 hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 transition-all touch-manipulation"
                >
                  {t('heroCta')}
                  <span className="inline-flex items-center gap-1.5 pl-2.5 ml-0.5 border-l border-violet-200 text-violet-500">
                    {t('price')}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </a>
              </div>

              <p className="mt-4 text-xs text-white/55">{t('heroReassurance')}</p>
            </motion.div>

            {/* Carte NFC mise en scène */}
            <div className="relative flex justify-center lg:justify-end">
              <div
                aria-hidden
                className="absolute inset-0 m-auto w-72 h-72 rounded-full bg-fuchsia-400/30 blur-[90px]"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: -7 }}
                transition={{ duration: 0.8, ease: EASE, delay: 0.15 }}
                className="relative"
              >
                <motion.div
                  animate={reduce ? undefined : { y: [0, -14, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Image
                    src="/images/carte-nfc-qarte.png"
                    alt={t('metaTitle')}
                    width={420}
                    height={269}
                    className="rounded-3xl shadow-2xl shadow-violet-950/50 ring-1 ring-white/15"
                    priority
                  />
                </motion.div>

                {/* Pastille « tap » flottante */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.7, ease: EASE }}
                  className="absolute -bottom-5 -left-5 md:-left-8 flex items-center gap-2 px-3.5 py-2.5 bg-white rounded-2xl shadow-xl"
                >
                  <span className="relative flex w-9 h-9 items-center justify-center rounded-full bg-violet-100">
                    {!reduce && (
                      <span className="absolute inset-0 rounded-full bg-violet-400/40 animate-ping" />
                    )}
                    <Nfc className="relative w-4 h-4 text-[#4b0082]" />
                  </span>
                  <span className="text-xs font-bold text-gray-900 leading-tight">
                    Tap
                    <span className="block text-[10px] font-medium text-gray-400">
                      &lt; 1 seconde
                    </span>
                  </span>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── POURQUOI NFC > QR ── */}
        <section className="bg-white">
          <div className="max-w-5xl mx-auto px-5 py-20 md:py-28">
            <motion.div {...reveal()} className="text-center max-w-xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
                {t('whyTitle')}{' '}
                <span className="font-[family-name:var(--font-display)] italic font-extrabold text-indigo-600">
                  {t('whyTitleAccent')}
                </span>
              </h2>
              <p className="mt-4 text-base md:text-lg text-gray-500 leading-relaxed">
                {t('whySubtitle')}
              </p>
            </motion.div>

            <div className="mt-12 grid md:grid-cols-2 gap-5">
              {/* QR — terne */}
              <motion.div
                {...reveal(0.05)}
                className="rounded-3xl border border-gray-200 bg-gray-50 p-7"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {t('qrLabel')}
                </p>
                <ul className="mt-5 space-y-3.5">
                  {[t('qrPoint1'), t('qrPoint2'), t('qrPoint3')].map((p) => (
                    <li key={p} className="flex items-start gap-3 text-sm text-gray-500">
                      <span className="mt-0.5 flex w-5 h-5 shrink-0 items-center justify-center rounded-full bg-gray-200">
                        <X className="w-3 h-3 text-gray-500" />
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* NFC — mis en avant */}
              <motion.div
                {...reveal(0.12)}
                className="relative rounded-3xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-fuchsia-50/60 p-7 shadow-lg shadow-violet-100"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-500">
                  {t('nfcLabel')}
                </p>
                <ul className="mt-5 space-y-3.5">
                  {[t('nfcPoint1'), t('nfcPoint2'), t('nfcPoint3')].map((p) => (
                    <li
                      key={p}
                      className="flex items-start gap-3 text-sm font-medium text-gray-800"
                    >
                      <span className="mt-0.5 flex w-5 h-5 shrink-0 items-center justify-center rounded-full bg-[#4b0082]">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── COMMENT ÇA MARCHE ── */}
        <section className="bg-[#faf9fc]">
          <div className="max-w-5xl mx-auto px-5 py-20 md:py-28">
            <motion.div {...reveal()} className="text-center max-w-xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight">
                {t('howTitle')}
              </h2>
              <p className="mt-4 text-base md:text-lg text-gray-500">
                {t('howSubtitle')}
              </p>
            </motion.div>

            <div className="mt-14 grid md:grid-cols-3 gap-6 md:gap-5">
              {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.title}
                    {...reveal(i * 0.1)}
                    className="relative rounded-3xl bg-white border border-gray-100 shadow-sm p-7 text-center"
                  >
                    <span className="absolute top-5 right-5 text-5xl font-bold text-gray-100 leading-none select-none">
                      {i + 1}
                    </span>
                    <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-violet-200">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="mt-5 font-bold text-gray-900">{step.title}</h3>
                    <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">
                      {step.desc}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── RÉASSURANCE ── */}
        <section className="bg-white">
          <div className="max-w-5xl mx-auto px-5 py-20 md:py-28">
            <motion.h2
              {...reveal()}
              className="text-3xl md:text-5xl font-bold text-gray-900 text-center tracking-tight"
            >
              {t('trustTitle')}
            </motion.h2>

            <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {trust.map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.title}
                    {...reveal(i * 0.07)}
                    className="rounded-2xl border border-gray-100 bg-gray-50/70 p-5 md:p-6"
                  >
                    <div className="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#4b0082]" />
                    </div>
                    <h3 className="mt-4 font-bold text-gray-900 text-sm md:text-base">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs md:text-sm text-gray-500 leading-relaxed">
                      {item.desc}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="bg-[#faf9fc]">
          <div className="max-w-2xl mx-auto px-5 py-20 md:py-28">
            <motion.h2
              {...reveal()}
              className="text-3xl md:text-5xl font-bold text-gray-900 text-center tracking-tight"
            >
              {t('faqTitle')}
            </motion.h2>

            <div className="mt-10 space-y-3">
              {faqs.map((faq, i) => {
                const isOpen = openFaq === i;
                return (
                  <motion.div
                    key={faq.q}
                    {...reveal(i * 0.05)}
                    className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left touch-manipulation"
                    >
                      <span className="font-semibold text-gray-900 text-sm md:text-base">
                        {faq.q}
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 shrink-0 text-violet-500 transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.25, ease: EASE }}
                        className="px-5 pb-4 text-sm text-gray-500 leading-relaxed"
                      >
                        {faq.a}
                      </motion.p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── CTA FINAL ── */}
        <section className="bg-white">
          <div className="max-w-3xl mx-auto px-5 pb-24 pt-4">
            <motion.div
              {...reveal()}
              className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#4b0082] via-violet-700 to-violet-800 px-6 py-12 md:px-14 md:py-16 text-center"
            >
              <div
                aria-hidden
                className="absolute -top-20 -right-16 w-72 h-72 rounded-full bg-fuchsia-500/25 blur-[100px]"
              />
              <div className="relative">
                <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight">
                  {t('ctaTitle')}
                </h2>
                <p className="mt-3 text-sm md:text-base text-white/70">
                  {t('ctaSubtitle')}
                </p>

                <div className="mt-7 flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-extrabold text-white">
                    {t('price')}
                  </span>
                  <span className="text-sm text-white/55">
                    {t('shippingIncluded')}
                  </span>
                </div>

                <a
                  href={STRIPE_NFC_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group mt-7 inline-flex items-center gap-2 px-8 py-4 bg-white text-[#4b0082] font-bold rounded-2xl shadow-xl shadow-violet-950/30 hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 transition-all touch-manipulation"
                >
                  {t('orderButton')}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </a>

                <p className="mt-4 text-xs text-white/50">{t('deliveryNote')}</p>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer>
        <FooterDark />
      </footer>
    </>
  );
}
