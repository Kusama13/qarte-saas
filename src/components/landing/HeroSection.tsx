'use client';

import {
  Star,
  ChevronDown,
  Eye,
  Sparkles,
  Heart,
  Bell,
  Users,
  MapPin,
  Calendar,
  UserPlus,
} from 'lucide-react';
import { useInView } from '@/hooks/useInView';
import { trackCtaClick } from '@/lib/analytics';
import { fbEvents } from '@/components/analytics/FacebookPixel';
import { ttEvents } from '@/components/analytics/TikTokPixel';
import LandingNav from './LandingNav';

export function HeroSection() {
  const { ref, isInView } = useInView();

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
            <h1 className="relative text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Attire de nouveaux clients.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-pink-500 to-violet-500">
                Fidélise-les pour de bon.
              </span>
            </h1>
          </div>

          <p className="text-base lg:text-lg text-gray-600 max-w-lg leading-relaxed">
            Une page pro qui attire de nouvelles clientes sur Google. Un programme fidélité qui les fait revenir. <span className="text-gray-900 font-medium">Tout dans un seul outil, en 5 minutes.</span>
          </p>

          <div className="flex flex-col sm:flex-row sm:items-start gap-3 lg:gap-4">
            <div>
              <a
                href="/auth/merchant/signup"
                onClick={() => { trackCtaClick('hero_primary', 'hero_section'); fbEvents.initiateCheckout(); ttEvents.clickButton(); }}
                className="group relative flex items-center justify-center px-7 py-4 lg:px-9 lg:py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="relative z-10">Booste ton salon en 5 min</span>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              <p className="text-xs text-gray-400 font-medium mt-2 text-center">Sans carte bancaire, c&apos;est promis :)</p>
            </div>
            <a
              href="/p/demo-onglerie"
              onClick={() => trackCtaClick('hero_demo', 'hero_section')}
              className="flex items-center justify-center gap-2 px-7 py-4 lg:px-9 lg:py-4 bg-white border-2 border-indigo-200 text-indigo-600 font-bold rounded-xl transition-all duration-300 text-center hover:border-indigo-400 hover:bg-indigo-50 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Eye className="w-5 h-5" />
              Voir une démo
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
                <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden bg-white shadow-2xl shadow-gray-900/20 flex flex-col">
                  {/* Header salon */}
                  <div className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-rose-500 via-pink-500 to-violet-500" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent)]" />
                    <div className="relative px-5 pt-10 pb-4 text-white text-center">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl mx-auto mb-2 flex items-center justify-center text-lg font-bold border border-white/30 shadow-lg shadow-black/10">
                        E
                      </div>
                      <p className="font-bold text-[14px] tracking-tight">Elodie Nails Studio</p>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <MapPin className="w-2.5 h-2.5 text-white/70" />
                        <span className="text-[9px] text-white/70">Paris 11e</span>
                      </div>
                    </div>
                  </div>

                  {/* Booking CTA */}
                  <div className="px-4 pt-3 pb-2">
                    <div className="bg-gradient-to-r from-indigo-500 to-violet-500 rounded-xl px-3 py-2.5 flex items-center justify-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-white" />
                      <span className="text-[11px] font-bold text-white">Prendre rendez-vous</span>
                    </div>
                  </div>

                  {/* Photo grid - 3 thumbnails */}
                  <div className="px-4 py-1.5">
                    <div className="grid grid-cols-3 gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="aspect-square rounded-lg bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center overflow-hidden">
                          <Sparkles className="w-3 h-3 text-gray-300" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Services preview */}
                  <div className="px-4 py-2">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Prestations</p>
                    <div className="space-y-1.5">
                      {[
                        { name: 'Pose complète gel', price: '45' },
                        { name: 'Manucure semi-permanent', price: '30' },
                      ].map((s, i) => (
                        <div key={i} className="flex items-center justify-between py-1.5 px-2 bg-gray-50/80 rounded-lg">
                          <span className="text-[10px] font-semibold text-gray-700">{s.name}</span>
                          <span className="text-[10px] font-bold text-gray-900">{s.price} EUR</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Loyalty card compact */}
                  <div className="px-4 py-2">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Fidelite</p>
                    <div className="grid grid-cols-8 gap-1">
                      {[...Array(8)].map((_, i) => (
                        <div key={i} className={`aspect-square rounded-md flex items-center justify-center ${
                          i < 5
                            ? 'bg-gradient-to-br from-rose-400 to-pink-500 shadow-sm shadow-rose-300/50'
                            : 'bg-gray-50 border border-dashed border-gray-200'
                        }`}>
                          {i < 5 ? (
                            <Heart className="w-2.5 h-2.5 text-white fill-white" />
                          ) : (
                            <span className="text-[7px] font-bold text-gray-300">{i + 1}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Welcome offer */}
                  <div className="px-4 py-2 flex-1">
                    <div className="bg-gradient-to-r from-violet-50 to-pink-50 border border-violet-200/60 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Sparkles className="w-3 h-3 text-violet-500" />
                        <span className="text-[8px] font-bold text-violet-500 uppercase tracking-wider">Offre de bienvenue</span>
                      </div>
                      <p className="text-[11px] font-bold text-gray-800">-20% sur votre premiere visite</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>

            {/* === Floating elements around phone === */}

            {/* Toast "Nouvelle cliente" */}
            <div className="hidden sm:flex absolute top-28 right-0 translate-x-1/2 bg-white px-3.5 py-2.5 rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 items-center gap-2 z-30">
              <div className="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center">
                <UserPlus className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-800">Nouvelle cliente !</p>
                <p className="text-[8px] text-gray-400">Sophie M. via Google</p>
              </div>
            </div>

            {/* Floating star rating badge */}
            <div className="hidden sm:block absolute top-12 left-0 -translate-x-1/2 bg-white px-4 py-3 rounded-2xl shadow-xl shadow-amber-200/50 border border-amber-200 z-30">
              <div className="flex gap-0.5 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-[10px] font-bold text-gray-700 text-center">4.9/5 Google</p>
              <p className="text-[8px] text-gray-400 text-center">+120 avis</p>
            </div>

            {/* Floating referral badge */}
            <div className="hidden sm:block absolute bottom-44 left-0 -translate-x-1/2 bg-white px-3.5 py-2.5 rounded-2xl shadow-xl shadow-violet-200/40 border border-violet-100 z-30">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-pink-500 rounded-full flex items-center justify-center shadow-md shadow-violet-300/40">
                  <Users className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-800">Marie a parrainé Sophie</p>
                  <p className="text-[8px] text-violet-500 font-semibold">+1 récompense chacune</p>
                </div>
              </div>
            </div>

            {/* Push notification Qarte */}
            <div className="hidden sm:block absolute bottom-28 right-0 translate-x-1/2 bg-white px-4 py-3 rounded-2xl shadow-xl shadow-indigo-200/40 border border-indigo-100 z-30 max-w-[200px]">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-300/40">
                  <Bell className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider">Qarte</p>
                  <p className="text-[10px] font-semibold text-gray-800 leading-tight">-20% sur ton prochain soin cette semaine !</p>
                  <p className="text-[8px] text-gray-400 mt-0.5">Il y a 2 min</p>
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
                className={`absolute ${p.size} text-rose-300/50 z-0 hidden sm:block`}
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
