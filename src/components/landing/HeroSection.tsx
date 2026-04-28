'use client';

import { Check, X, Heart } from 'lucide-react';
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

interface HeroLogo {
  logo_url: string;
  shop_name: string;
}

export function HeroSection({ topLogos = [] }: { topLogos?: HeroLogo[] } = {}) {
  const { ref, isInView } = useInView();
  const t = useTranslations('hero');

  // Fallback to testimonial avatars if no merchant logos available
  const pillItems: Array<{ src: string; alt: string }> =
    topLogos.length >= 3
      ? topLogos.map(m => ({ src: m.logo_url, alt: m.shop_name }))
      : [1, 2, 3, 4, 5].map(i => ({ src: `/images/testimonials/t${i}.jpg`, alt: '' }));

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-white to-gray-50">
      <LandingNav />

      {/* Background blob */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-100/30 rounded-full blur-3xl" />
      </div>

      <div ref={ref} className="relative z-10 max-w-[1500px] mx-auto px-6 lg:px-10 pt-32 md:pt-28 lg:pt-24 pb-14 lg:pb-20 grid xl:grid-cols-[1fr_1.2fr] gap-8 xl:gap-12 items-start xl:items-center">

        {/* Text content */}
        <div className={`min-w-0 space-y-4 lg:space-y-6 text-center xl:text-left ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>

          {/* Social proof pill */}
          <div className="flex justify-center xl:justify-start">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 border border-rose-100 pl-1.5 pr-3 py-1 shadow-sm">
              <div className="flex -space-x-1.5">
                {pillItems.map((item, i) => (
                  <div
                    key={i}
                    className="relative h-6 w-6 overflow-hidden rounded-full ring-2 ring-white bg-white"
                  >
                    <Image
                      src={item.src}
                      alt={item.alt}
                      fill
                      sizes="24px"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs font-semibold text-gray-700">{t('socialProofText')}</p>
            </div>
          </div>

          <h1 className="relative text-[2.5rem] sm:text-[2.8rem] md:text-5xl lg:text-[3.6rem] [hyphens:none] font-bold text-gray-900 leading-tight lg:leading-[1.3]">
            {t('titlePart1').split(/\n+|(?<=[.?!])\s+/).map((line, i) => (
              <span key={i} className="block">{line}</span>
            ))}
            {t('titlePart2').split(/\n+|(?<=[.?!])\s+/).map((line, i) => (
              <span key={i} className="block text-rose-500">{line.replace('-', '‑')}</span>
            ))}
          </h1>

          <p className="text-lg md:text-lg lg:text-xl text-gray-700 max-w-lg mx-auto xl:mx-0 leading-relaxed">
            {t('subtitle')}
          </p>

          <div className="flex flex-col items-center xl:items-start gap-3 w-full sm:w-auto pt-2">
            <Link
              href="/auth/merchant/signup"
              onClick={() => { trackCtaClick('hero_primary', 'hero_section'); fbEvents.initiateCheckout(); ttEvents.clickButton(); }}
              className="flex w-full sm:w-auto sm:min-w-[400px] items-center justify-center px-10 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-base sm:text-lg rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <span>{t('ctaPrimary')}</span>
            </Link>
            <p className="text-xs text-gray-600 font-medium text-center">{t('ctaSubtext')}</p>
          </div>
        </div>

        {/* Person + floating cards */}
        <div className={`min-w-0 flex justify-center xl:justify-end ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
          <div className="scale-[0.62] sm:scale-[0.8] md:scale-90 lg:scale-100 origin-top mt-4 xl:mt-0 xl:translate-x-8 -mb-[236px] sm:-mb-[124px] md:-mb-[62px] lg:mb-0">
            <HeroPersonMockup />
          </div>
        </div>

      </div>
    </section>
  );
}
