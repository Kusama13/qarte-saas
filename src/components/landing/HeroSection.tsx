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
        <div className="relative px-5 pt-8 pb-4 text-white text-center">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl mx-auto mb-2 flex items-center justify-center text-lg font-bold border border-white/30 shadow-lg shadow-black/10">
            E
          </div>
          <p className="font-bold text-[14px] tracking-tight">Elodie Nails Studio</p>
          <p className="text-[10px] font-medium text-white/80 mt-0.5">{t('mockupGreeting')}</p>
        </div>
      </div>

      {/* Upcoming booking */}
      <div className="px-4 pt-3 pb-1.5">
        <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-200/60 rounded-xl p-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <CalendarCheck className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">{t('mockupNextBooking')}</p>
              <p className="text-[12px] font-extrabold text-gray-900 leading-tight">{t('mockupBookingDate')}</p>
              <p className="text-[10px] text-indigo-600 font-semibold">{t('mockupBookingService')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Referral */}
      <div className="px-4 pt-1.5 pb-1.5">
        <div className="bg-gradient-to-r from-violet-50 to-pink-50 border border-violet-200/60 rounded-xl p-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <UserPlus className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-extrabold text-gray-900 leading-tight">{t('mockupReferralTitle')}</p>
              <p className="text-[9px] text-violet-600 font-semibold">{t('mockupReferralSub')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Points section (hero feature) */}
      <div className="px-4 pt-2 pb-2 flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('mockupMyLoyalty')}</span>
          <span className="text-sm font-extrabold text-rose-500">7/10</span>
        </div>

        <div className="grid grid-cols-5 gap-1.5 mb-2">
          {[...Array(10)].map((_, i) => (
            <div key={i}>
              <div className={`aspect-square rounded-lg flex items-center justify-center ${
                i < 7
                  ? 'bg-gradient-to-br from-rose-400 to-pink-500 shadow-sm shadow-rose-300/50'
                  : 'bg-gray-50 border-2 border-dashed border-gray-200'
              }`}>
                {i < 7 ? (
                  <Heart className="w-3 h-3 text-white fill-white" strokeWidth={2.5} />
                ) : (
                  <span className="text-[9px] font-bold text-gray-300">{i + 1}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full w-[70%] bg-gradient-to-r from-rose-400 to-pink-500 rounded-full" />
        </div>
      </div>

      {/* Reward card */}
      <div className="px-4 pb-4">
        <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200/60 rounded-xl p-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-rose-400 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Gift className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-extrabold text-gray-900 leading-tight">{t('mockupReward')}</p>
              <p className="text-[10px] text-rose-600 font-bold">{t('mockupVisitsLeft')}</p>
            </div>
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

          {/* Google reviews badge */}
          <div className="flex justify-center lg:justify-start">
            <a
              href="https://share.google/wD2tUZFy21CJ1IoBa"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/70 backdrop-blur-sm border border-gray-200/60 shadow-sm hover:bg-white transition-all"
            >
              <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24" style={{ width: '18px', height: '18px' }}>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-sm font-semibold text-gray-700">{t('badgeGoogleScore')}</span>
            </a>
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
