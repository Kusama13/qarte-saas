'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  ChevronDown,
  MessageCircle,
  X,
  Clock,
} from 'lucide-react';
import { useInView } from '@/hooks/useInView';
import { trackCtaClick, trackWhatsAppClicked } from '@/lib/analytics';
import { fbEvents } from '@/components/analytics/FacebookPixel';

const MOCKUP_IMAGES = [
  { src: "/images/mockup-beaute.jpg", alt: "Qarte - Institut de beauté" },
];

function MockupCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % MOCKUP_IMAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full rounded-[2.5rem] overflow-hidden bg-gradient-to-b from-rose-100 to-rose-200 relative">
      {MOCKUP_IMAGES.map((mockup, index) => (
        <div
          key={mockup.src}
          className={`absolute inset-0 transition-opacity duration-700 ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Image
            src={mockup.src}
            alt={mockup.alt}
            width={860}
            height={2080}
            className="w-full h-full object-cover object-top"
            priority={index === 0}

          />
        </div>
      ))}
      {/* Dots indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {MOCKUP_IMAGES.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'bg-indigo-600 w-4'
                : 'bg-gray-400/50 hover:bg-gray-400'
            }`}
            aria-label={`Voir mockup ${index + 1}`}
          />
        ))}
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

      <div ref={ref} className="relative z-10 max-w-7xl mx-auto px-6 py-20 pt-36 grid lg:grid-cols-2 gap-12 items-center">
        {/* Text Content */}
        <div className={`space-y-8 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 backdrop-blur-md rounded-full border border-indigo-200 shadow-sm">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span className="text-sm text-indigo-700 font-semibold tracking-wide uppercase">Prêt en 3 minutes</span>
          </div>

          <div className="relative">
            <div className="absolute -inset-x-20 -inset-y-10 bg-indigo-100/50 blur-[100px] rounded-full pointer-events-none" />
            <h1 className="relative text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
              Vos clientes passent une fois et ne reviennent jamais.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-pink-500 to-violet-500">
                Changez ça aujourd&apos;hui.
              </span>
            </h1>
          </div>

          <p className="text-xl text-gray-600 max-w-xl leading-relaxed">
            <span className="text-gray-900 font-medium">+40% de clientes régulières</span> en moyenne. Vos clientes scannent un QR code, cumulent des points, reviennent. Sans app, sans carte papier.
          </p>

          <div className="flex flex-col sm:flex-row gap-5">
            <a
              href="/auth/merchant/signup"
              onClick={() => { trackCtaClick('hero_primary', 'hero_section'); fbEvents.initiateCheckout(); }}
              className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl transition-all duration-300 text-center shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="relative z-10">Lancer mon programme gratuit</span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
            <a
              href="https://wa.me/33745953842?text=Bonjour%2C%20je%20souhaite%20une%20d%C3%A9mo%20de%20Qarte"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackWhatsAppClicked('hero_demo')}
              className="px-8 py-4 border border-gray-300 text-gray-900 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 text-center shadow-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] icon-bounce"
            >
              <MessageCircle className="w-5 h-5" />
              Demander une démo
            </a>
          </div>

          {/* Social Proof Stats */}
          <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-gray-200/60">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1,2,3,4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                    {['S', 'C', 'M', 'L'][i-1]}
                  </div>
                ))}
              </div>
              <span className="text-sm text-gray-600"><span className="font-semibold text-gray-900">150+</span> instituts en France</span>
            </div>
            <div className="hidden sm:block w-px h-6 bg-gray-200" />
            <div className="flex items-center gap-1.5">
              <div className="flex">
                {[1,2,3,4,5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-sm text-gray-600"><span className="font-semibold text-gray-900">4.9/5</span> avis</span>
            </div>
            <div className="hidden sm:block w-px h-6 bg-gray-200" />
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">12,000+</span> clientes fidélisées
            </div>
          </div>
        </div>

        {/* iPhone Mockup Carousel */}
        <div className={`flex justify-center ${isInView ? 'animate-fade-in-up delay-300' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
          <div className="animate-float relative">
            {/* Phone Frame - Sans encoche */}
            <div className="relative w-[280px] h-[570px] bg-gray-900 rounded-[3rem] p-2 shadow-2xl shadow-gray-900/30">
              {/* Screen with Carousel */}
              <MockupCarousel />
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
