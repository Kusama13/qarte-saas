'use client';

import {
  ChevronDown,
  CalendarCheck,
  UserPlus,
  Heart,
  Gift,
  MessageSquare,
  Star,
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
        <div className="relative px-5 pt-8 pb-3 text-white text-center">
          <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl mx-auto mb-1.5 flex items-center justify-center text-base font-bold border border-white/30 shadow-lg shadow-black/10">
            E
          </div>
          <p className="font-bold text-[13px] tracking-tight">Elodie Nails Studio</p>
        </div>
      </div>

      {/* Greeting */}
      <div className="px-3.5 pt-2.5 pb-0.5">
        <p className="text-[12px] font-bold text-gray-800">{t('mockupGreeting')}</p>
      </div>

      {/* Upcoming booking */}
      <div className="px-3.5 pt-1.5 pb-1">
        <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-200/60 rounded-xl p-2.5 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <CalendarCheck className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">{t('mockupNextBooking')}</p>
              <p className="text-[11px] font-extrabold text-gray-900">{t('mockupBookingDate')}</p>
              <p className="text-[9px] text-indigo-600 font-semibold">{t('mockupBookingService')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Referral */}
      <div className="px-3.5 pt-1 pb-1">
        <div className="bg-gradient-to-r from-violet-50 to-pink-50 border border-violet-200/60 rounded-xl p-2.5 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <UserPlus className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-extrabold text-gray-900">{t('mockupReferralTitle')}</p>
              <p className="text-[8px] text-violet-600 font-semibold">{t('mockupReferralSub')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Points section */}
      <div className="px-3.5 pt-2 pb-1.5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{t('mockupMyLoyalty')}</span>
          <span className="text-[10px] font-extrabold text-rose-500">7/10</span>
        </div>

        {/* Stamp grid - 2 rows of 5 */}
        <div className="grid grid-cols-5 gap-1.5">
          {[...Array(10)].map((_, i) => (
            <div key={i}>
              <div className={`aspect-square rounded-lg flex items-center justify-center ${
                i < 7
                  ? 'bg-gradient-to-br from-rose-400 to-pink-500 shadow-sm shadow-rose-300/50'
                  : 'bg-gray-50 border-2 border-dashed border-gray-200'
              }`}>
                {i < 7 ? (
                  <Heart className="w-2.5 h-2.5 text-white fill-white" strokeWidth={2.5} />
                ) : (
                  <span className="text-[8px] font-bold text-gray-300">{i + 1}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full w-[70%] bg-gradient-to-r from-rose-400 to-pink-500 rounded-full" />
        </div>
      </div>

      {/* Reward card */}
      <div className="px-3.5 py-1.5">
        <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200/60 rounded-xl p-2.5 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-rose-400 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Gift className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-extrabold text-gray-900">{t('mockupReward')}</p>
              <p className="text-[8px] text-rose-600 font-bold">{t('mockupVisitsLeft')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent visit — single line */}
      <div className="px-3.5 pt-1.5 pb-3">
        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{t('mockupHistory')}</p>
        <div className="flex items-center gap-2 p-2 bg-gray-50/80 rounded-xl">
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-semibold text-gray-700 truncate">{t('mockupVisit1')}</p>
            <p className="text-[7px] text-gray-400">{t('mockupToday')}</p>
          </div>
          <div className="flex items-center px-1.5 py-0.5 bg-emerald-50 rounded-full">
            <span className="text-[8px] font-extrabold text-emerald-600">+1</span>
          </div>
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
        <div className="motion-safe:animate-blob absolute top-20 left-20 w-96 h-96 bg-rose-200/50 rounded-full blur-3xl" />
        <div className="motion-safe:animate-blob absolute bottom-20 right-20 w-96 h-96 bg-pink-200/50 rounded-full blur-3xl delay-200" style={{ animationDelay: '2s' }} />
        <div className="motion-safe:animate-blob absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-100/30 rounded-full blur-3xl" style={{ animationDelay: '4s' }} />

        {/* Particles */}
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-rose-500 rounded-full motion-safe:animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
        <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-pink-500 rounded-full motion-safe:animate-pulse delay-700 shadow-[0_0_8px_rgba(236,72,153,0.8)]" />
        <div className="absolute bottom-1/4 left-1/2 w-1 h-1 bg-rose-400 rounded-full motion-safe:animate-pulse delay-1000 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
      </div>

      <div ref={ref} className="relative z-10 max-w-7xl mx-auto px-6 pt-28 lg:pt-36 pb-14 lg:pb-20 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        {/* Text Content */}
        <div className={`space-y-6 lg:space-y-8 text-center lg:text-left ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <div className="relative">
            <div className="absolute -inset-x-20 -inset-y-10 bg-indigo-100/50 blur-[100px] rounded-full pointer-events-none" />
            <h1 className="relative text-[2.5rem] md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              {t('titlePart1')}{' '}
              <span className="text-rose-500">
                {t('titlePart2')}
              </span>
            </h1>
          </div>

          <p className="text-lg md:text-lg lg:text-xl text-gray-700 max-w-lg mx-auto lg:mx-0 leading-relaxed">
            {t('subtitle')}
          </p>

          {/* Trust row — rating + reviews count */}
          <div className="flex items-center justify-center lg:justify-start gap-2.5 text-sm">
            <div className="flex items-center gap-0.5" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" strokeWidth={0} />
              ))}
            </div>
            <span className="font-semibold text-gray-900">{t('badgeGoogleScore')}</span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-600">{t('badgeGoogleReviews')}</span>
          </div>

          <div className="flex flex-col items-center lg:items-start gap-3 w-full sm:w-auto">
            <Link
              href="/auth/merchant/signup"
              onClick={() => { trackCtaClick('hero_primary', 'hero_section'); fbEvents.initiateCheckout(); ttEvents.clickButton(); }}
              className="group relative flex items-center justify-center px-10 py-5 bg-gradient-to-r from-indigo-600/90 to-violet-600/90 backdrop-blur-md text-white font-bold text-base sm:text-lg rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] border border-white/20"
            >
              <span className="relative z-10">{t('ctaPrimary')}</span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <p className="text-xs text-gray-600 font-medium text-center">{t('ctaSubtext')}</p>
          </div>

          {/* Included features badges */}
          <div className="grid grid-cols-2 lg:flex lg:flex-wrap justify-center lg:justify-start gap-2.5">
            {(['feature1', 'feature2', 'feature3', 'feature4'] as const).map((key) => (
              <span key={key} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/70 backdrop-blur-sm border border-gray-200/60 shadow-sm text-[13px] md:text-sm">
                <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span className="text-gray-600 font-medium">{t(key)}</span>
              </span>
            ))}
          </div>

        </div>

        {/* iPhone Mockup - Static */}
        <div className={`flex justify-center lg:items-start ${isInView ? 'animate-fade-in-up delay-300' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
          <div className="relative mt-8 lg:mt-0 scale-[0.85] sm:scale-100 origin-top">
            {/* Glow behind phone */}
            <div className="absolute inset-0 -m-8 bg-gradient-to-br from-rose-300/40 via-pink-300/30 to-violet-300/40 rounded-full blur-[60px]" />

            {/* Phone facing front */}
              <div className="relative w-[280px] h-[570px]">
                <LoyaltyCardMockup t={t} />

                {/* Floating SMS reminder notification — centered above phone on mobile, sticks out left on desktop */}
                <div
                  className="absolute z-20 w-[210px] sm:w-[230px] bg-white rounded-2xl shadow-xl shadow-gray-900/15 border border-gray-100 p-3 motion-safe:animate-float-subtle
                             -top-12 left-1/2 -translate-x-1/2
                             sm:-top-6 sm:left-auto sm:-right-2 md:-right-4 lg:-left-44 lg:right-auto lg:translate-x-0"
                  style={{ animationDelay: '0.6s' }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-gray-900 leading-tight">{t('mockupSmsHeader')}</p>
                      <p className="text-[8px] text-gray-400 leading-tight">{t('mockupSmsTime')}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-700 leading-snug">
                    {t('mockupSmsBody')}
                  </p>
                </div>
              </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 motion-safe:animate-bounce">
        <ChevronDown className="w-8 h-8 text-gray-400" />
      </div>
    </section>
  );
}
