'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  ChevronDown,
  X,
  Clock,
  Eye,
  Footprints,
  Gift,
  Trophy,
  ArrowLeft,
} from 'lucide-react';
import { useInView } from '@/hooks/useInView';
import { trackCtaClick } from '@/lib/analytics';
import { fbEvents } from '@/components/analytics/FacebookPixel';

function PhoneCardMockup() {
  const PRIMARY = '#EC4899';
  const SECONDARY = '#F472B6';
  const STAMPS_REQUIRED = 8;
  const CURRENT_STAMPS = 6;
  const TIER2_STAMPS = 15;
  const TIER2_ADDITIONAL = TIER2_STAMPS - STAMPS_REQUIRED;

  return (
    <div className="w-full h-full rounded-[2.5rem] overflow-hidden overflow-y-auto relative" style={{ background: `linear-gradient(160deg, ${PRIMARY}15 0%, ${PRIMARY}40 40%, ${PRIMARY}60 70%, ${PRIMARY}35 100%)` }}>
      {/* Header */}
      <div className="relative overflow-hidden bg-white/40 backdrop-blur-xl border-b border-white/40 shadow-sm">
        {/* Decorative blobs */}
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-2xl opacity-20" style={{ background: PRIMARY }} />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full blur-2xl opacity-20" style={{ background: SECONDARY }} />

        <div className="relative z-10 px-4 pt-4 pb-3">
          {/* Back button */}
          <div className="w-7 h-7 rounded-full bg-white/80 border border-white/60 shadow-sm flex items-center justify-center mb-3">
            <ArrowLeft className="w-3 h-3 text-slate-800" />
          </div>

          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="w-12 h-12 rounded-xl p-0.5 bg-white/90 shadow-lg border border-white shrink-0">
              <div className="w-full h-full rounded-[10px] flex items-center justify-center text-white text-lg font-black" style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})` }}>
                N
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-black tracking-tight text-slate-900">Nails &amp; Beauty</h1>
              <span className="text-[9px] text-slate-500 font-medium">Onglerie</span>
            </div>
          </div>

          {/* Customer */}
          <div className="mt-3 flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900">Marie</h2>
            <div className="px-2.5 py-1 rounded-full border bg-white/60 border-slate-200/40">
              <span className="text-[8px] font-bold uppercase tracking-wider text-slate-600">Client fidèle</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="px-3 py-3 space-y-2.5">
        {/* Tier 1 */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-3.5">
          <div className="flex justify-between items-center mb-2.5">
            <div className="flex items-center gap-1.5">
              <Gift className="w-3 h-3 text-gray-400" />
              <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">Palier 1</span>
            </div>
            <span className="text-[8px] font-bold text-pink-500">Plus que 2 !</span>
          </div>

          {/* Stamps Grid */}
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {Array.from({ length: STAMPS_REQUIRED }).map((_, i) => (
              <div
                key={i}
                className={`w-7 h-7 rounded-full flex items-center justify-center ${
                  i < CURRENT_STAMPS
                    ? 'text-white shadow-md'
                    : 'bg-gray-50 text-gray-300 border border-gray-100 border-dashed'
                }`}
                style={{
                  backgroundColor: i < CURRENT_STAMPS ? PRIMARY : undefined,
                }}
              >
                <Footprints className="w-3 h-3" />
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden mb-2">
            <div className="h-full rounded-full transition-all" style={{ backgroundColor: PRIMARY, width: `${(CURRENT_STAMPS / STAMPS_REQUIRED) * 100}%` }} />
          </div>

          <p className="text-center text-[10px] font-medium italic text-gray-500">
            🎁 Une pose gel offerte
          </p>
        </div>

        {/* Tier 2 */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-3.5">
          <div className="flex justify-between items-center mb-2.5">
            <div className="flex items-center gap-1.5">
              <Trophy className="w-3 h-3 text-gray-400" />
              <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Palier 2</span>
            </div>
            <span className="text-[8px] font-bold text-gray-400">{TIER2_ADDITIONAL} restants</span>
          </div>

          {/* Stamps Grid Tier 2 */}
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {Array.from({ length: TIER2_ADDITIONAL }).map((_, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full flex items-center justify-center bg-gray-50 text-gray-300 border border-gray-100 border-dashed"
              >
                <Footprints className="w-3 h-3" />
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-violet-600 rounded-full" style={{ width: '0%' }} />
          </div>

          <p className="text-center text-[10px] font-medium italic text-gray-400">
            ✨ Un soin complet des mains offert
          </p>
        </div>

        {/* VIP Card */}
        <div className="relative overflow-hidden rounded-2xl p-3.5 text-white" style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})` }}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <span className="text-[8px] font-bold uppercase tracking-widest opacity-70">Carte VIP</span>
              <p className="text-sm font-black">Marie</p>
            </div>
            <div className="text-right">
              <span className="text-[8px] font-bold uppercase tracking-widest opacity-70">Points</span>
              <p className="text-sm font-black">6 / 8</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
        <div className="animate-blob absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-200/30 rounded-full blur-3xl" style={{ animationDelay: '4s' }} />

        {/* Particles */}
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
        <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-pink-500 rounded-full animate-pulse delay-700 shadow-[0_0_8px_rgba(236,72,153,0.8)]" />
        <div className="absolute bottom-1/4 left-1/2 w-1 h-1 bg-purple-500 rounded-full animate-pulse delay-1000 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
      </div>

      <div ref={ref} className="relative z-10 max-w-7xl mx-auto px-6 pt-24 lg:pt-32 pb-6 lg:pb-20 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        {/* Text Content */}
        <div className={`space-y-4 lg:space-y-6 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 backdrop-blur-md rounded-full border border-indigo-200 shadow-sm">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-xs text-indigo-700 font-semibold tracking-wide uppercase">Prêt en 3 minutes</span>
          </div>

          <div className="relative">
            <div className="absolute -inset-x-20 -inset-y-10 bg-indigo-100/50 blur-[100px] rounded-full pointer-events-none" />
            <h1 className="relative text-[1.7rem] md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              Vos clientes passent une fois et ne reviennent jamais.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-pink-500 to-violet-500">
                Changez ça aujourd&apos;hui.
              </span>
            </h1>
          </div>

          <p className="text-sm lg:text-base text-gray-600 max-w-lg leading-relaxed">
            <span className="text-gray-900 font-medium">+40% de clientes régulières</span> en moyenne. QR code, points, récompenses. Sans app, sans carte papier.
          </p>

          <div className="flex flex-col sm:flex-row gap-2.5 lg:gap-3">
            <a
              href="/auth/merchant/signup"
              onClick={() => { trackCtaClick('hero_primary', 'hero_section'); fbEvents.initiateCheckout(); }}
              className="group relative px-6 py-3 lg:px-8 lg:py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl transition-all duration-300 text-center shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="relative z-10">Lancer mon programme gratuit</span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
            <a
              href="/customer/card/demo-onglerie?preview=true&demo=true"
              onClick={() => trackCtaClick('hero_demo', 'hero_section')}
              className="flex items-center justify-center gap-2 px-6 py-3 lg:px-8 lg:py-3.5 bg-gradient-to-r from-pink-500 to-indigo-500 text-white font-bold rounded-xl transition-all duration-300 text-center shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:from-pink-600 hover:to-indigo-600 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Eye className="w-5 h-5" />
              Voir une démo
            </a>
          </div>

          {/* Social Proof Stats */}
          <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-200/60 text-xs">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                {[1,2,3,4].map((i) => (
                  <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 border-2 border-white flex items-center justify-center text-white text-[8px] font-bold">
                    {['S', 'C', 'M', 'L'][i-1]}
                  </div>
                ))}
              </div>
              <span className="text-gray-600"><span className="font-semibold text-gray-900">150+</span> instituts</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-gray-200" />
            <div className="flex items-center gap-1">
              <div className="flex">
                {[1,2,3,4,5].map((i) => (
                  <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-gray-600"><span className="font-semibold text-gray-900">4.9/5</span></span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-gray-200" />
            <div className="text-gray-600">
              <span className="font-semibold text-gray-900">12,000+</span> clientes fidélisées
            </div>
          </div>
        </div>

        {/* iPhone Mockup Carousel */}
        <div className={`flex justify-center ${isInView ? 'animate-fade-in-up delay-300' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
          <div className="animate-float relative">
            {/* Phone Frame - Sans encoche */}
            <div className="relative w-[280px] h-[570px] bg-gray-900 rounded-[3rem] p-2 shadow-2xl shadow-gray-900/30">
              {/* Screen with Card Mockup */}
              <PhoneCardMockup />
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
