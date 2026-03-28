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
        <div className={`space-y-6 lg:space-y-8 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <div className="relative">
            <div className="absolute -inset-x-20 -inset-y-10 bg-indigo-100/50 blur-[100px] rounded-full pointer-events-none" />
            <h1 className="relative text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              {t('titlePart1')}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-pink-500 to-violet-500">
                {t('titlePart2')}
              </span>
            </h1>
          </div>

          <p className="text-lg lg:text-xl text-gray-600 max-w-lg leading-relaxed">
            {t('subtitle')}
          </p>
          <p className="text-sm text-gray-500 max-w-lg">
            <span className="bg-violet-200/70 px-1.5 py-0.5 rounded">{t('subtitleTarget')}</span>
          </p>

          <div className="flex flex-row items-start gap-3">
            <div>
              <Link
                href="/auth/merchant/signup"
                onClick={() => { trackCtaClick('hero_primary', 'hero_section'); fbEvents.initiateCheckout(); ttEvents.clickButton(); }}
                className="group relative flex items-center justify-center px-6 py-3.5 sm:px-8 sm:py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm sm:text-base rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="relative z-10">{t('ctaPrimary')}</span>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <p className="text-[11px] text-gray-400 font-medium mt-1.5 text-center">{t('ctaSubtext')}</p>
            </div>
            <Link
              href="/customer/card/demo-onglerie?preview=true&demo=true"
              target="_blank"
              onClick={() => { trackCtaClick('hero_demo', 'hero_section'); }}
              className="flex items-center justify-center px-6 py-3.5 sm:px-8 sm:py-4 text-gray-600 font-semibold text-sm sm:text-base rounded-xl border-2 border-gray-200 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-md active:scale-[0.98] transition-all duration-300"
            >
              {t('ctaDemo')}
            </Link>
          </div>

          {/* Google Reviews badge */}
          <div className="flex justify-center lg:justify-start">
            <a
              href="https://share.google/wD2tUZFy21CJ1IoBa"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200/80 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-xs font-bold text-gray-700">{t('googleRating')}</span>
            </a>
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

            {/* Heart decorations */}
            {[
              { left: '-12px', top: '40%', size: 'w-5 h-5' },
              { left: '105%', top: '30%', size: 'w-4 h-4' },
              { left: '95%', top: '65%', size: 'w-3 h-3' },
            ].map((p, i) => (
              <div
                key={i}
                className={`absolute ${p.size} text-rose-300/50 z-0`}
                style={{ left: p.left, top: p.top }}
              >
                <Heart className="w-full h-full fill-current" />
              </div>
            ))}
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
