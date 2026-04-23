'use client';

import { ChevronDown, Star, Check, X, Heart } from 'lucide-react';
import Image from 'next/image';
import { useInView } from '@/hooks/useInView';
import { trackCtaClick } from '@/lib/analytics';
import { fbEvents } from '@/components/analytics/FacebookPixel';
import { ttEvents } from '@/components/analytics/TikTokPixel';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import LandingNav from './LandingNav';

const RDV_LIST = [
  { service: 'Onglerie gel', time: '13h00', client: 'Camille R.', color: 'bg-rose-400' },
  { service: 'Coupe + Brushing', time: '14h30', client: 'Sophie M.', color: 'bg-sky-400' },
];

function HeroPersonMockup() {
  return (
    <div className="relative" style={{ width: 580, height: 620 }}>

      {/* ── SMS — top center, z-30 ── */}
      <div className="absolute left-1/2 top-4 z-30 -translate-x-1/2">
        <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-2xl">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500">
            <Check className="h-4 w-4 text-white" strokeWidth={3} />
          </div>
          <div className="pr-2">
            <p className="text-sm font-extrabold text-gray-900">SMS de rappel envoyé</p>
            <p className="text-xs text-gray-400">Le rdv de Lisa est confirmé</p>
          </div>
          <X className="h-4 w-4 flex-shrink-0 text-gray-300" />
        </div>
      </div>

      {/* ── Rdv — left, z-10, -rotate-6 ── */}
      <div className="absolute -left-6 top-40 z-10 w-64 -rotate-6 rounded-xl border border-gray-100 bg-white p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-bold text-gray-900 text-sm">Rdv du jour</p>
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">2 rdv</span>
        </div>
        <div className="space-y-3">
          {RDV_LIST.map((rdv, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className={`w-1 rounded-full flex-shrink-0 ${rdv.color}`} style={{ minHeight: 32 }} />
              <div>
                <p className="font-bold text-sm text-gray-900 leading-tight">{rdv.service}</p>
                <p className="text-xs text-gray-400 mt-0.5">{rdv.time} · {rdv.client}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Fidélité — right, z-10, rotate-6 ── */}
      <div className="absolute -right-6 top-28 z-10 w-64 rotate-6 rounded-xl border border-gray-100 bg-white p-4 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <p className="font-bold text-gray-900 text-sm">Fidélité</p>
          <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-500">7 / 10</span>
        </div>
        <div className="grid grid-cols-5 gap-2 px-1">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className={`flex h-7 w-7 items-center justify-center rounded-full ${
                i < 7 ? 'bg-gradient-to-br from-pink-400 to-rose-500' : 'bg-gray-200'
              }`}
            >
              {i < 7 && <Heart className="h-4 w-4 text-white fill-white" strokeWidth={0} />}
            </div>
          ))}
        </div>
        <div className="my-3 h-2 w-full rounded-full bg-gray-100">
          <div className="h-2 rounded-full bg-gradient-to-r from-pink-400 to-rose-500" style={{ width: '70%' }} />
        </div>
        <p className="text-center text-xs text-gray-500">Encore 3 pour une récompense</p>
      </div>

      {/* ── Person — center, z-20 ── */}
      <div className="absolute bottom-0 z-20" style={{ left: '50%', transform: 'translateX(-50%)', height: '108%' }}>
        <Image
          src="/images/hero-person-4-crop.png"
          alt="Pro beauté Qarte"
          width={648}
          height={1160}
          className="h-full w-auto object-contain object-bottom"
          priority
        />
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

      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="motion-safe:animate-blob absolute top-20 left-20 w-96 h-96 bg-rose-200/50 rounded-full blur-3xl" />
        <div className="motion-safe:animate-blob absolute bottom-20 right-20 w-96 h-96 bg-pink-200/50 rounded-full blur-3xl" style={{ animationDelay: '2s' }} />
        <div className="motion-safe:animate-blob absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-100/30 rounded-full blur-3xl" style={{ animationDelay: '4s' }} />
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-rose-500 rounded-full motion-safe:animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
        <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-pink-500 rounded-full motion-safe:animate-pulse delay-700 shadow-[0_0_8px_rgba(236,72,153,0.8)]" />
        <div className="absolute bottom-1/4 left-1/2 w-1 h-1 bg-rose-400 rounded-full motion-safe:animate-pulse delay-1000 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
      </div>

      <div ref={ref} className="relative z-10 max-w-7xl mx-auto px-6 pt-28 lg:pt-36 pb-14 lg:pb-20 grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">

        {/* Text Content */}
        <div className={`min-w-0 space-y-6 lg:space-y-10 text-center lg:text-left ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <div className="relative">
            <div className="absolute -inset-x-20 -inset-y-10 bg-indigo-100/50 blur-[100px] rounded-full pointer-events-none" />
            <h1 className="relative text-[1.95rem] sm:text-[2.4rem] md:text-5xl lg:text-[3.6rem] [hyphens:none] font-bold text-gray-900 leading-tight lg:leading-[1.15]">
              {t('titlePart1').split('. ').map((line, i, arr) => (
                <span key={i} className="block">{line}{i < arr.length - 1 ? '.' : ''}</span>
              ))}
              <span className="block text-rose-500">{t('titlePart2').replace('-', '‑')}</span>
            </h1>
          </div>

          <p className="text-lg md:text-lg lg:text-xl text-gray-700 max-w-lg mx-auto lg:mx-0 leading-relaxed">
            {t('subtitle')}
          </p>

          {/* Google badge */}
          <div className="flex justify-center lg:justify-start">
            <a
              href="https://share.google/wD2tUZFy21CJ1IoBa"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/70 backdrop-blur-sm border border-gray-200/60 shadow-sm hover:bg-white transition-all"
            >
              <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, flexShrink: 0 }}>
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

        {/* Person + floating cards */}
        <div className={`min-w-0 flex justify-center lg:justify-end ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
          <div className="scale-[0.62] sm:scale-[0.8] md:scale-90 lg:scale-100 origin-top mt-4 lg:mt-0 -mb-[236px] sm:-mb-[124px] md:-mb-[62px] lg:mb-0">
            <HeroPersonMockup />
          </div>
        </div>

      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 motion-safe:animate-bounce">
        <ChevronDown className="w-8 h-8 text-gray-400" />
      </div>
    </section>
  );
}
