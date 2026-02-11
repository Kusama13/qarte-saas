'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  ChevronDown,
  X,
  Zap,
  Eye,
  Gift,
  Check,
  Sparkles,
  Heart,
  Bell,
} from 'lucide-react';
import { useInView } from '@/hooks/useInView';
import { trackCtaClick } from '@/lib/analytics';
import { fbEvents } from '@/components/analytics/FacebookPixel';

export function HeroSection() {
  const { ref, isInView } = useInView();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-white to-gray-50">
      {/* Sticky Top Banner - Customer Card Recovery */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-center gap-2 text-sm">
          <span className="text-gray-500 hidden sm:inline">Vous avez déjà une carte de fidélité ?</span>
          <span className="text-gray-500 sm:hidden">Déjà client ?</span>
          <a
            href="/customer/cards"
            className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
          >
            Retrouver ma carte →
          </a>
        </div>
      </div>

      {/* Fixed Navbar - Light */}
      <nav className="fixed top-[36px] left-0 right-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 group cursor-pointer">
            <div className="p-2 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-lg">
              <span className="text-white font-bold text-lg">Q</span>
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">Qarte</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors link-underline">Solutions</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors link-underline">Tarifs</a>
            <a href="/contact" className="hover:text-indigo-600 transition-colors link-underline">Contact</a>
            <a href="/auth/merchant" className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-lg transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg">Espace Pro</a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
            aria-label="Menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
            >
              <div className="px-6 py-4 space-y-3">
                <a
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-gray-600 hover:text-indigo-600 font-medium transition-colors"
                >
                  Solutions
                </a>
                <a
                  href="#pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-gray-600 hover:text-indigo-600 font-medium transition-colors"
                >
                  Tarifs
                </a>
                <a
                  href="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-gray-600 hover:text-indigo-600 font-medium transition-colors"
                >
                  Contact
                </a>
                <a
                  href="/auth/merchant"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full py-3 mt-2 text-center bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold rounded-lg transition-all shadow-sm"
                >
                  Espace Pro
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

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
            <h1 className="relative text-5xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Le programme de fidélité qui fait{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-pink-500 to-violet-500">
                revenir vos client(e)s.
              </span>
            </h1>
          </div>

          <p className="text-base lg:text-lg text-gray-600 max-w-lg leading-relaxed">
            Conçu pour les <span className="text-gray-900 font-medium">instituts de beauté, ongleries et salons</span>. QR code, points, récompenses. <span className="text-gray-900 font-medium">+40% de récurrence</span> en moyenne.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 lg:gap-4">
            <div className="relative">
              <a
                href="/auth/merchant/signup"
                onClick={() => { trackCtaClick('hero_primary', 'hero_section'); fbEvents.initiateCheckout(); }}
                className="group relative px-7 py-3.5 lg:px-9 lg:py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl transition-all duration-300 text-center shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] block"
              >
                <span className="relative z-10">Essayer gratuitement</span>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              <span className="absolute -top-3 -right-2 flex items-center gap-0.5 px-2 py-0.5 bg-white text-gray-900 text-[10px] font-bold rounded-full -rotate-12 shadow-md border border-gray-100 z-20">
                <Zap className="w-2.5 h-2.5 text-indigo-500 fill-indigo-500" />
                En 2 min
              </span>
            </div>
            <a
              href="/customer/card/demo-onglerie?preview=true&demo=true"
              onClick={() => trackCtaClick('hero_demo', 'hero_section')}
              className="flex items-center justify-center gap-2 px-7 py-3.5 lg:px-9 lg:py-4 bg-white border-2 border-indigo-200 text-indigo-600 font-bold rounded-xl transition-all duration-300 text-center hover:border-indigo-400 hover:bg-indigo-50 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Eye className="w-5 h-5" />
              Voir une démo
            </a>
          </div>

        </div>

        {/* iPhone Mockup - Static */}
        <div className={`flex justify-center lg:items-start ${isInView ? 'animate-fade-in-up delay-300' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
          <div className="relative mt-8 lg:mt-0 scale-[0.72] sm:scale-100 origin-top">
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
                    <div className="relative px-5 pt-10 pb-5 text-white text-center">
                      <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl mx-auto mb-2.5 flex items-center justify-center text-xl font-bold border border-white/30 shadow-lg shadow-black/10">
                        E
                      </div>
                      <p className="font-bold text-[15px] tracking-tight">
                        Elodie Nails Studio
                      </p>
                    </div>
                  </div>

                  {/* Points section */}
                  <div className="px-4 pt-4 pb-2">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ma fidélité</span>
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

                  {/* Reward card - 3D pop out */}
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
                          <p className="text-[12px] font-extrabold text-gray-900">Soin visage offert</p>
                          <p className="text-[10px] text-rose-600 font-bold">Plus que 3 visites !</p>
                        </div>
                        <span className="text-xl">🎁</span>
                      </div>
                    </div>
                  </div>

                  {/* Recent visits */}
                  <div className="px-4 py-2 flex-1">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Historique</p>
                    <div className="space-y-1.5">
                      {[
                        { date: "Auj.", label: 'Manucure semi-permanent', emoji: '💅' },
                        { date: '12 jan.', label: 'Pose gel + nail art', emoji: '✨' },
                        { date: '28 déc.', label: 'Soin du visage', emoji: '🧖‍♀️' },
                      ].map((visit, i) => (
                        <div key={i} className="flex items-center gap-2.5 p-2 bg-gray-50/80 rounded-xl">
                          <span className="text-sm">{visit.emoji}</span>
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
              </div>
            </div>
            </div>

            {/* === Floating elements around phone === */}

            {/* Toast "Point ajouté" */}
            <div className="flex absolute top-28 right-0 translate-x-1/2 bg-white px-3.5 py-2.5 rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 items-center gap-2 z-30">
              <div className="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-800">Point ajouté !</p>
                <p className="text-[8px] text-gray-400">Manucure semi-permanent</p>
              </div>
            </div>

            {/* Floating star rating badge */}
            <div className="absolute top-12 left-0 -translate-x-1/2 bg-white px-4 py-3 rounded-2xl shadow-xl shadow-amber-200/50 border border-amber-200 z-30">
              <div className="flex gap-0.5 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-[10px] font-bold text-gray-700 text-center">4.9/5 Google</p>
              <p className="text-[8px] text-gray-400 text-center">+120 avis</p>
            </div>

            {/* Floating stat bubble */}
            <div className="absolute bottom-32 left-0 -translate-x-1/2 bg-gradient-to-br from-violet-500 to-indigo-600 px-3 py-2 rounded-xl shadow-lg shadow-violet-300/40 z-30">
              <p className="text-[9px] text-violet-200">Récurrence</p>
              <p className="text-sm font-extrabold text-white">+42%</p>
            </div>

            {/* Push notification Qarte */}
            <div className="absolute bottom-28 right-0 translate-x-1/2 bg-white px-4 py-3 rounded-2xl shadow-xl shadow-indigo-200/40 border border-indigo-100 z-30 max-w-[200px]">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-300/40">
                  <Bell className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider">Qarte</p>
                  <p className="text-[10px] font-semibold text-gray-800 leading-tight">-20% sur votre prochain soin cette semaine !</p>
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
