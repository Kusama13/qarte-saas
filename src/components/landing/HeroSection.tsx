'use client';

import {
  Star,
  ChevronDown,
  Sparkles,
  Heart,
  Check,
  Users,
  Bell,
  Gift,
  CalendarCheck,
} from 'lucide-react';
import { useInView } from '@/hooks/useInView';
import { trackCtaClick } from '@/lib/analytics';
import { fbEvents } from '@/components/analytics/FacebookPixel';
import { ttEvents } from '@/components/analytics/TikTokPixel';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import LandingNav from './LandingNav';

function LoyaltyCardMockup({ t }: { t: (key: string) => string }) {
  return (
    <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden bg-white shadow-2xl shadow-gray-900/20 flex flex-col">
      {/* Header salon */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500 via-pink-500 to-violet-500" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent)]" />
        <div className="relative px-5 pt-10 pb-5 text-white text-center">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl mx-auto mb-2.5 flex items-center justify-center text-xl font-bold border border-white/30 shadow-lg shadow-black/10">
            E
          </div>
          <p className="font-bold text-[15px] tracking-tight">Elodie Nails Studio</p>
        </div>
      </div>

      {/* Points section */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('mockupMyLoyalty')}</span>
          <span className="text-[11px] font-extrabold text-rose-500">7/10</span>
        </div>

        {/* Stamp grid - 2 rows of 5 */}
        <div className="grid grid-cols-5 gap-2">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="relative">
              <div className={`aspect-square rounded-xl flex items-center justify-center ${
                i < 7
                  ? 'bg-gradient-to-br from-rose-400 to-pink-500 shadow-md shadow-rose-300/50'
                  : 'bg-gray-50 border-2 border-dashed border-gray-200'
              }`}>
                {i < 7 ? (
                  <Heart className="w-3.5 h-3.5 text-white fill-white" />
                ) : (
                  <span className="text-[9px] font-bold text-gray-300">{i + 1}</span>
                )}
              </div>
              {i === 6 && (
                <div className="absolute -top-1 -right-1">
                  <Sparkles className="w-3 h-3 text-rose-400" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full w-[70%] bg-gradient-to-r from-rose-400 to-pink-500 rounded-full" />
        </div>
      </div>

      {/* Reward card */}
      <div className="px-4 py-2 relative" style={{ perspective: 600 }}>
        <div
          className="relative bg-gradient-to-r from-rose-50 to-pink-50 border-2 border-rose-300/60 rounded-2xl p-3.5 shadow-xl shadow-rose-300/30 scale-[1.08]"
          style={{ transformStyle: 'preserve-3d', transform: 'translateZ(20px)' }}
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-rose-200/40 to-pink-200/40 rounded-2xl blur-md -z-10" />
          <div className="absolute top-0 right-0 w-20 h-20 bg-rose-200/30 rounded-full -mr-8 -mt-8 blur-xl" />
          <div className="relative flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-rose-400 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-rose-400/40">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-extrabold text-gray-900">{t('mockupReward')}</p>
              <p className="text-[10px] text-rose-600 font-bold">{t('mockupVisitsLeft')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent visits */}
      <div className="px-4 py-2 flex-1">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">{t('mockupHistory')}</p>
        <div className="space-y-1.5">
          {[
            { date: t('mockupToday'), label: t('mockupVisit1') },
            { date: t('mockupDate2'), label: t('mockupVisit2') },
            { date: t('mockupDate3'), label: t('mockupVisit3') },
          ].map((visit, i) => (
            <div key={i} className="flex items-center gap-2.5 p-2 bg-gray-50/80 rounded-xl">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-gray-700 truncate">{visit.label}</p>
                <p className="text-[8px] text-gray-400">{visit.date}</p>
              </div>
              <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-50 rounded-full">
                <span className="text-[8px] font-extrabold text-emerald-600">+1</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function HeroSection() {
  const { ref, isInView } = useInView();
  const t = useTranslations('hero');

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-white to-gray-50">
      <LandingNav />

      {/* Animated Background & Particles - Light */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="animate-blob absolute top-20 left-20 w-96 h-96 bg-rose-200/50 rounded-full blur-3xl" />
        <div className="animate-blob absolute bottom-20 right-20 w-96 h-96 bg-pink-200/50 rounded-full blur-3xl delay-200" style={{ animationDelay: '2s' }} />
        <div className="animate-blob absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-100/30 rounded-full blur-3xl" style={{ animationDelay: '4s' }} />

        {/* Particles */}
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
        <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-pink-500 rounded-full animate-pulse delay-700 shadow-[0_0_8px_rgba(236,72,153,0.8)]" />
        <div className="absolute bottom-1/4 left-1/2 w-1 h-1 bg-rose-400 rounded-full animate-pulse delay-1000 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
      </div>

      <div ref={ref} className="relative z-10 max-w-7xl mx-auto px-6 pt-28 lg:pt-36 pb-6 lg:pb-20 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        {/* Text Content */}
        <div className={`space-y-6 lg:space-y-8 text-center lg:text-left ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <div className="relative">
            <div className="absolute -inset-x-20 -inset-y-10 bg-indigo-100/50 blur-[100px] rounded-full pointer-events-none" />
            <h1 className="relative text-[2rem] md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              {t('titlePart1')}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-pink-500 to-violet-500">
                {t('titlePart2')}
              </span>
            </h1>
          </div>

          <p className="text-[1.05rem] md:text-lg lg:text-xl text-gray-600 max-w-lg mx-auto lg:mx-0 leading-relaxed">
            {t('subtitle')}
          </p>
          <div className="flex flex-col items-center lg:items-start gap-3 w-full sm:w-auto">
            <Link
              href="/auth/merchant/signup"
              onClick={() => { trackCtaClick('hero_primary', 'hero_section'); fbEvents.initiateCheckout(); ttEvents.clickButton(); }}
              className="group relative flex items-center justify-center px-10 py-5 bg-gradient-to-r from-indigo-600/90 to-violet-600/90 backdrop-blur-md text-white font-bold text-base sm:text-lg rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] border border-white/20"
            >
              <span className="relative z-10">{t('ctaPrimary')}</span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <p className="text-[11px] text-gray-400 font-medium text-center">{t('ctaSubtext')}</p>
          </div>

          {/* Impact stats badges */}
          <div className="flex flex-wrap justify-center lg:justify-start gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/70 backdrop-blur-sm border border-gray-200/60 shadow-sm text-xs tracking-wide">
              <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">+30%</span>
              <span className="text-gray-500 font-medium">{t('statReturn')}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/70 backdrop-blur-sm border border-gray-200/60 shadow-sm text-xs tracking-wide">
              <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500">x3</span>
              <span className="text-gray-500 font-medium">{t('statReviews')}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/70 backdrop-blur-sm border border-gray-200/60 shadow-sm text-xs tracking-wide">
              <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">+40%</span>
              <span className="text-gray-500 font-medium">{t('statVisibility')}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/70 backdrop-blur-sm border border-gray-200/60 shadow-sm text-xs tracking-wide">
              <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-500">24/7</span>
              <span className="text-gray-500 font-medium">{t('statContact')}</span>
            </span>
          </div>

        </div>

        {/* iPhone Mockup - Static */}
        <div className={`flex justify-center lg:items-start ${isInView ? 'animate-fade-in-up delay-300' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
          <div className="relative mt-8 lg:mt-0 scale-[0.85] sm:scale-100 origin-top">
            {/* Glow behind phone */}
            <div className="absolute inset-0 -m-8 bg-gradient-to-br from-rose-300/40 via-pink-300/30 to-violet-300/40 rounded-full blur-[60px]" />

            {/* Phone tilted at an angle */}
            <div style={{ perspective: 800 }}>
            <div style={{ transform: 'rotateY(-12deg) rotateX(2deg)', transformStyle: 'preserve-3d' }}>
              <div className="relative w-[280px] h-[570px]">
                {/* Screen */}
                <LoyaltyCardMockup t={t} />
              </div>
            </div>
            </div>

            {/* === Floating elements around phone === */}

            {/* Toast "Point ajouté" */}
            <div className="hidden sm:flex absolute top-28 right-0 translate-x-1/2 bg-white px-3.5 py-2.5 rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 items-center gap-2 z-30">
              <div className="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-800">{t('badgePointAdded')}</p>
                <p className="text-[8px] text-gray-400">{t('badgePointAddedSub')}</p>
              </div>
            </div>

            {/* Floating star rating badge */}
            <div className="hidden sm:flex absolute top-12 left-0 -translate-x-1/2 bg-white px-4 py-3 rounded-2xl shadow-xl shadow-amber-200/50 border border-amber-200 z-30 flex-col items-center">
              <div className="flex gap-0.5 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-[10px] font-bold text-gray-700 text-center">{t('badgeGoogleScore')}</p>
              <p className="text-[8px] text-gray-400 text-center">{t('badgeGoogleReviews')}</p>
            </div>

            {/* Floating referral badge */}
            <div className="hidden sm:flex absolute bottom-32 left-0 -translate-x-1/2 bg-white px-3.5 py-2.5 rounded-2xl shadow-xl shadow-violet-200/40 border border-violet-100 z-30 items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-pink-500 rounded-full flex items-center justify-center shadow-md shadow-violet-300/40">
                <Users className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-800">{t('badgeReferral')}</p>
                <p className="text-[8px] text-violet-500 font-semibold">{t('badgeReferralSub')}</p>
              </div>
            </div>

            {/* Push notification Qarte */}
            <div className="hidden sm:flex absolute bottom-28 right-0 translate-x-1/2 bg-white px-4 py-3 rounded-2xl shadow-xl shadow-indigo-200/40 border border-indigo-100 z-30 max-w-[200px]">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-300/40">
                  <Bell className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider">Qarte</p>
                  <p className="text-[10px] font-semibold text-gray-800 leading-tight">{t('badgePushText')}</p>
                  <p className="text-[8px] text-gray-400 mt-0.5">{t('badgePushTime')}</p>
                </div>
              </div>
            </div>

            {/* Booking badge */}
            <div className="hidden sm:flex absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 bg-white px-3.5 py-2.5 rounded-2xl shadow-xl shadow-cyan-200/40 border border-cyan-100 items-center gap-2 z-30">
              <div className="w-7 h-7 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center shadow-md shadow-cyan-300/40">
                <CalendarCheck className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-800">{t('badgeBooking')}</p>
                <p className="text-[8px] text-cyan-500 font-semibold">{t('badgeBookingSub')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-8 h-8 text-gray-400" />
      </div>
    </section>
  );
}
