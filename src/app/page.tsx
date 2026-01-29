'use client';

import { useState, useEffect, useRef, useCallback, Suspense, lazy, memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence, LazyMotion, domAnimation } from 'framer-motion';
import {
  QrCode,
  Star,
  BarChart3,
  Leaf,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  Users,
  TrendingUp,
  Shield,
  ShieldCheck,
  CreditCard,
  MessageCircle,
  Quote,
  AlertCircle,
  Scissors,
  Sparkles,
  Coffee,
  ShoppingBag,
  UtensilsCrossed,
  Flower2,
  Croissant,
  Play,
  X,
  Zap,
  Clock,
  Headphones,
  ArrowUp,
  Bell,
  Gift,
  Tag,
  MessageSquare,
  FileX,
  Banknote,
  EyeOff,
  ArrowRight,
  Crown,
} from 'lucide-react';
import { LandingAnalytics } from '@/components/analytics/LandingAnalytics';
import { trackCtaClick, trackWhatsAppClicked, trackVideoPlayed, trackFaqOpened } from '@/lib/analytics';
import { FacebookPixel, FacebookScrollTracker, fbEvents } from '@/components/FacebookPixel';

// ============================================
// CUSTOM HOOKS
// ============================================

function useInView(options = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        observer.disconnect();
      }
    }, { threshold: 0.1, ...options });

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return { ref, isInView };
}

function useCounter(end: number, duration: number = 2000, start: number = 0) {
  const [count, setCount] = useState(start);
  const [shouldStart, setShouldStart] = useState(false);

  const startCounting = useCallback(() => {
    setShouldStart(true);
  }, []);

  useEffect(() => {
    if (!shouldStart) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      setCount(Math.floor(progress * (end - start) + start));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [shouldStart, end, start, duration]);

  return { count, startCounting };
}

// ============================================
// ANIMATIONS CSS (inline styles)
// ============================================

const animationStyles = `
  @keyframes blob {
    0%, 100% { transform: translate(0, 0) scale(1); }
    25% { transform: translate(20px, -30px) scale(1.1); }
    50% { transform: translate(-20px, 20px) scale(0.9); }
    75% { transform: translate(30px, 10px) scale(1.05); }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }

  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.4); }
    50% { box-shadow: 0 0 40px rgba(99, 102, 241, 0.8); }
  }

  @keyframes text-reveal {
    from { clip-path: inset(0 100% 0 0); }
    to { clip-path: inset(0 0 0 0); }
  }

  .animate-blob {
    animation: blob 8s ease-in-out infinite;
  }

  .animate-float {
    animation: float 6s ease-in-out infinite;
  }

  .animate-fade-in-up {
    animation: fadeInUp 0.8s ease-out forwards;
  }

  .animate-shimmer {
    background: linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899, #8b5cf6, #6366f1);
    background-size: 200% auto;
    animation: shimmer 3s linear infinite;
  }

  .animate-pulse-glow {
    animation: pulse-glow 2s ease-in-out infinite;
  }

  .delay-100 { animation-delay: 0.1s; }
  .delay-200 { animation-delay: 0.2s; }
  .delay-300 { animation-delay: 0.3s; }
  .delay-400 { animation-delay: 0.4s; }
  .delay-500 { animation-delay: 0.5s; }

  .stagger-1 { animation-delay: 0.1s; }
  .stagger-2 { animation-delay: 0.2s; }
  .stagger-3 { animation-delay: 0.3s; }
`;

// ============================================
// COMPONENTS
// ============================================

// Hero Section
function HeroSection() {
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
            <a href="/auth/merchant" className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-lg transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg">Espace Commerçant</a>
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
                  Espace Commerçant
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Animated Background & Particles - Light */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="animate-blob absolute top-20 left-20 w-96 h-96 bg-indigo-200/50 rounded-full blur-3xl" />
        <div className="animate-blob absolute bottom-20 right-20 w-96 h-96 bg-violet-200/50 rounded-full blur-3xl delay-200" style={{ animationDelay: '2s' }} />
        <div className="animate-blob absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-200/30 rounded-full blur-3xl" style={{ animationDelay: '4s' }} />

        {/* Particles */}
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
        <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse delay-700 shadow-[0_0_8px_rgba(236,72,153,0.8)]" />
        <div className="absolute bottom-1/4 left-1/2 w-1 h-1 bg-emerald-500 rounded-full animate-pulse delay-1000 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
      </div>

      <div ref={ref} className="relative z-10 max-w-7xl mx-auto px-6 py-20 pt-36 grid lg:grid-cols-2 gap-12 items-center">
        {/* Text Content */}
        <div className={`space-y-8 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 backdrop-blur-md rounded-full border border-emerald-200 shadow-sm">
            <Leaf className="w-4 h-4 text-emerald-600" />
            <span className="text-sm text-emerald-700 font-semibold tracking-wide uppercase">100% Zéro Papier</span>
          </div>

          <div className="relative">
            <div className="absolute -inset-x-20 -inset-y-10 bg-indigo-100/50 blur-[100px] rounded-full pointer-events-none" />
            <h1 className="relative text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
              La fidélité client,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-rose-500">
                enfin simple.
              </span>
            </h1>
          </div>

          <p className="text-xl text-gray-600 max-w-xl leading-relaxed">
            Un QR code. Un navigateur. <span className="text-gray-900 font-medium">Zéro téléchargement.</span> Zéro friction pour vos clients et votre équipe.
          </p>

          <div className="flex flex-col sm:flex-row gap-5">
            <a
              href="/auth/merchant/signup"
              onClick={() => { trackCtaClick('hero_primary', 'hero_section'); fbEvents.initiateCheckout(); }}
              className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl transition-all duration-300 text-center shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="relative z-10">Créer ma carte gratuite</span>
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
              Voir une démo
            </a>
          </div>

          {/* Social Proof Stats */}
          <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-gray-200/60">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1,2,3,4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-400 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                    {['M', 'T', 'S', 'L'][i-1]}
                  </div>
                ))}
              </div>
              <span className="text-sm text-gray-600"><span className="font-semibold text-gray-900">150+</span> commerçants</span>
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
              <span className="font-semibold text-gray-900">12,000+</span> cartes créées
            </div>
          </div>
        </div>

        {/* iPhone Mockup */}
        <div className={`flex justify-center ${isInView ? 'animate-fade-in-up delay-300' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
          <div className="animate-float relative">
            {/* Phone Frame - Sans encoche */}
            <div className="relative w-[280px] h-[570px] bg-gray-900 rounded-[3rem] p-2 shadow-2xl shadow-gray-900/30">
              {/* Screen */}
              <div className="w-full h-full rounded-[2.5rem] overflow-hidden bg-gradient-to-b from-rose-100 to-rose-200">
                <Image
                  src="/images/mockup-app.png"
                  alt="Application Qarte - Carte de fidélité digitale"
                  width={860}
                  height={2080}
                  className="w-full h-full object-cover object-top"
                  priority
                  unoptimized
                />
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

// Video Showcase Section
function VideoShowcaseSection() {
  const videoId = "H3iwVmjN1Og";

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Découvrez{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              Qarte en action
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            2 minutes pour tout comprendre
          </p>
        </div>

        {/* Video Embed */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-500" />

          <div className="relative aspect-video rounded-3xl overflow-hidden bg-gray-900 shadow-2xl border border-gray-200/50">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
              title="Présentation Qarte"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>

        {/* Feature Badges */}
        <div className="mt-12 flex flex-wrap justify-center gap-4 md:gap-8">
          {[
            { icon: <Zap className="w-4 h-4" />, label: "Sans téléchargement" },
            { icon: <Clock className="w-4 h-4" />, label: "Configuration en 5 min" },
            { icon: <Headphones className="w-4 h-4" />, label: "Support inclus" }
          ].map((badge, index) => (
            <div key={index} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-700 text-sm font-medium shadow-sm">
              <span className="text-indigo-600">{badge.icon}</span>
              {badge.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Storytelling Section
// Comparison Section - Sans Carte vs Avec Qarte
function ComparisonSection() {
  const { ref, isInView } = useInView();

  const painPoints = [
    "Cartes papier perdues ou oubliées",
    "Clients qui ne reviennent pas",
    "Difficulté à obtenir des avis Google",
    "Impossible de relancer les inactifs",
    "Aucune donnée sur vos clients",
    "Gaspillage de papier et d'encre",
    "Configuration longue et coûteuse"
  ];

  const benefits = [
    "Carte digitale toujours accessible",
    "Boostez votre chiffre d'affaires",
    "Collectez des avis Google facilement",
    "Notifications push pour réengager",
    "Programmes VIP pour vos meilleurs clients",
    "Dashboard et statistiques en temps réel",
    "100% écologique, zéro papier"
  ];

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div ref={ref} className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className={`text-center mb-16 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Pourquoi choisir{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              Qarte
            </span>{' '}
            ?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Comparez et faites le bon choix pour votre commerce.
          </p>
        </div>

        {/* Comparison Cards */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-stretch">
          {/* LEFT CARD - Sans Carte */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="group p-8 rounded-3xl bg-gray-50 border border-gray-200 transition-all duration-300 hover:shadow-lg"
          >
            <div className="mb-8">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-red-600 bg-red-50 mb-4">
                Méthode Classique
              </span>
              <h3 className="text-2xl font-bold text-gray-900">Sans Carte de Fidélité</h3>
            </div>

            <ul className="space-y-4">
              {painPoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="mt-0.5 bg-red-100 rounded-full p-1 flex-shrink-0">
                    <X className="w-4 h-4 text-red-600" />
                  </div>
                  <span className="text-gray-600 font-medium leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* RIGHT CARD - Avec Qarte (EMPHASIZED) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="relative p-8 rounded-3xl bg-white border-2 border-indigo-200 shadow-xl shadow-indigo-500/10 md:scale-[1.02] z-10"
          >
            {/* Recommendation Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold px-5 py-1.5 rounded-full shadow-lg uppercase tracking-wider">
              Recommandé
            </div>

            <div className="mb-8 pt-2">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 mb-4">
                Solution Moderne
              </span>
              <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                Avec Qarte
              </h3>
            </div>

            <ul className="space-y-4">
              {benefits.map((benefit, idx) => (
                <li key={idx} className="flex items-start gap-3 group/item">
                  <div className="mt-0.5 bg-emerald-500 rounded-full p-1 flex-shrink-0 transition-transform group-hover/item:scale-110">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-700 font-semibold leading-relaxed">{benefit}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 pt-6 border-t border-indigo-100">
              <a
                href="/auth/merchant/signup"
                onClick={() => { trackCtaClick('pricing_cta', 'pricing_section'); fbEvents.initiateCheckout(); }}
                className="block w-full py-3.5 px-6 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98] text-center"
              >
                Démarrer mon essai gratuit
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Features Zig-Zag Section
function FeaturesSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const mobileTabsRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);


  const features = [
    {
      id: 'instantanee',
      icon: QrCode,
      title: "Installation Instantanée",
      subtitle: "Prêt en 30 secondes",
      description: "Transformez vos clients en membres digitaux instantanément. Scannez, validez, fidélisez. Aucune application à télécharger.",
      keywords: ["Scannez", "validez", "fidélisez"],
      color: "from-indigo-500 to-violet-600",
      bgColor: "bg-indigo-50",
      visual: (
        <div className="relative w-full h-full flex items-center justify-center bg-slate-50 rounded-2xl overflow-hidden border border-slate-200/60 shadow-inner">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-white p-6 rounded-3xl shadow-2xl border border-slate-100 flex flex-col items-center gap-4"
          >
            <div className="w-48 h-48 bg-slate-900 rounded-2xl flex items-center justify-center p-4">
              <QrCode className="w-full h-full text-white" strokeWidth={1.5} />
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="h-2 w-24 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  animate={{ x: [-100, 100] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="h-full w-1/2 bg-indigo-500/50"
                />
              </div>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">Scanning...</span>
            </div>
          </motion.div>
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="absolute top-10 right-10 bg-white p-3 rounded-xl shadow-lg border border-slate-100 flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-sm font-semibold text-slate-700">Carte créée !</span>
          </motion.div>
        </div>
      )
    },
    {
      id: 'avis',
      icon: Star,
      title: "Avis Google Incentivés",
      subtitle: "Boostez votre e-réputation",
      description: "Automatisez la récolte d'avis positifs. Proposez des points bonus en échange d'un avis Google authentique.",
      keywords: ["avis positifs", "points bonus", "avis Google"],
      color: "from-amber-400 to-orange-500",
      bgColor: "bg-amber-50",
      visual: (
        <div className="relative w-full h-full flex items-center justify-center bg-slate-50 rounded-2xl overflow-hidden border border-slate-200/60">
          <div className="flex flex-col gap-4 w-full max-w-sm px-6">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.2 }}
                className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, idx) => <Star key={idx} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                  </div>
                  <div className="h-2 w-full bg-slate-50 rounded" />
                </div>
              </motion.div>
            ))}
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="mt-4 bg-indigo-600 p-4 rounded-xl shadow-xl shadow-indigo-200 text-white text-center font-bold flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              +50 Points Bonus
            </motion.div>
          </div>
        </div>
      )
    },
    {
      id: 'analytics',
      icon: BarChart3,
      title: "Dashboard & Analytics",
      subtitle: "Pilotez par la donnée",
      description: "Analysez le comportement de vos clients en temps réel. Fréquence de visite, panier moyen et segments les plus rentables.",
      keywords: ["temps réel", "panier moyen", "segments"],
      color: "from-emerald-500 to-teal-600",
      bgColor: "bg-emerald-50",
      visual: (
        <div className="relative w-full h-full flex items-center justify-center bg-slate-900 rounded-2xl overflow-hidden p-8">
          <div className="w-full h-full flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl">
                <p className="text-slate-400 text-xs mb-1">Visites</p>
                <p className="text-2xl font-bold text-white">2,840</p>
                <div className="h-1 w-full bg-slate-700 mt-3 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: '70%' }} className="h-full bg-indigo-500" />
                </div>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl">
                <p className="text-slate-400 text-xs mb-1">Rétention</p>
                <p className="text-2xl font-bold text-white">64%</p>
                <div className="h-1 w-full bg-slate-700 mt-3 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: '64%' }} className="h-full bg-violet-500" />
                </div>
              </div>
            </div>
            <div className="flex-1 bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 flex items-end gap-2">
              {[40, 70, 45, 90, 65, 80, 50, 85].map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: i * 0.1, duration: 1 }}
                  className="flex-1 bg-gradient-to-t from-indigo-500 to-violet-400 rounded-t-sm"
                />
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'vip',
      icon: Crown,
      title: "Programmes VIP",
      subtitle: "Fidélisez vos meilleurs clients",
      description: "Créez des paliers de fidélité. Offrez des remises permanentes et des cadeaux exclusifs à vos membres privilégiés.",
      keywords: ["paliers", "remises permanentes", "cadeaux exclusifs"],
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50",
      visual: (
        <div className="relative w-full h-full flex items-center justify-center bg-slate-50 rounded-2xl overflow-hidden">
          <motion.div
            style={{ perspective: 1000 }}
            className="relative w-72 h-44"
          >
            <motion.div
              animate={{ rotateY: [0, 15, 0, -15, 0], rotateX: [0, 10, 0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
              className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-950 rounded-2xl shadow-2xl p-6 text-white border border-white/10 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
              <div className="flex justify-between items-start mb-8">
                <Crown className="w-8 h-8 text-amber-400" />
                <span className="text-xs font-bold tracking-widest text-amber-400/80">PLATINUM MEMBER</span>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">Membre depuis 2023</p>
                <p className="text-lg font-medium tracking-tight">Jean-Marc Dupont</p>
              </div>
              <div className="absolute bottom-6 right-6 flex items-center gap-2">
                <div className="w-8 h-5 bg-white/10 rounded-sm" />
                <div className="w-8 h-5 bg-white/20 rounded-sm" />
              </div>
            </motion.div>
          </motion.div>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
             <div className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-600 shadow-sm">-15% Permanent</div>
             <div className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-600 shadow-sm">Accès VIP</div>
          </div>
        </div>
      )
    },
    {
      id: 'push',
      icon: Bell,
      title: "Notifications Push",
      subtitle: "Restez dans leur poche",
      description: "Envoyez des messages ciblés directement sur le smartphone de vos clients. Promos flash, rappels et alertes récompenses.",
      keywords: ["messages ciblés", "Promos flash", "alertes récompenses"],
      color: "from-rose-500 to-red-500",
      bgColor: "bg-rose-50",
      visual: (
        <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl overflow-hidden">
          {/* Phone mockup */}
          <div className="relative w-64 bg-slate-950 rounded-[2.5rem] p-2 shadow-2xl border border-slate-700">
            <div className="bg-slate-900 rounded-[2rem] overflow-hidden">
              {/* Status bar */}
              <div className="flex justify-between items-center px-6 py-2 text-[10px] text-slate-400">
                <span>9:41</span>
                <div className="flex gap-1">
                  <div className="w-4 h-2 bg-slate-600 rounded-sm" />
                  <div className="w-4 h-2 bg-slate-600 rounded-sm" />
                </div>
              </div>

              {/* Notifications */}
              <div className="p-4 space-y-3">
                <motion.div
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl p-4 shadow-lg"
                >
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-500 flex items-center justify-center">
                      <Bell className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-900">Café du Commerce</p>
                      <p className="text-[11px] text-slate-600 mt-0.5">🎉 -20% ce weekend uniquement !</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white rounded-2xl p-4 shadow-lg"
                >
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                      <Gift className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-900">Votre récompense</p>
                      <p className="text-[11px] text-slate-600 mt-0.5">☕ Votre café offert expire dans 3j</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="bg-white rounded-2xl p-4 shadow-lg"
                >
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-900">On vous attend !</p>
                      <p className="text-[11px] text-slate-600 mt-0.5">Plus que 2 passages avant votre cadeau</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Floating badge */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute top-6 right-6 bg-rose-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg shadow-rose-500/30"
          >
            98% de taux d&apos;ouverture
          </motion.div>
        </div>
      )
    }
  ];

  const nextTab = useCallback(() => {
    setActiveIndex((prev) => {
      const nextIndex = (prev + 1) % features.length;
      return nextIndex;
    });
    setProgress(0);
  }, [features.length]);

  // Auto-scroll mobile tabs to keep active tab visible
  useEffect(() => {
    if (mobileTabsRef.current && tabRefs.current[activeIndex]) {
      const container = mobileTabsRef.current;
      const activeTab = tabRefs.current[activeIndex];
      if (activeTab) {
        const scrollLeft = activeTab.offsetLeft - container.offsetWidth / 2 + activeTab.offsetWidth / 2;
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }, [activeIndex]);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          nextTab();
          return 0;
        }
        return prev + 1;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isPaused, nextTab]);

  const handleTabClick = (index: number) => {
    setActiveIndex(index);
    setProgress(0);
  };

  // Highlight keywords in description
  const highlightKeywords = (text: string, keywords: string[]) => {
    if (!keywords || keywords.length === 0) return text;

    let result = text;
    keywords.forEach(keyword => {
      const regex = new RegExp(`(${keyword})`, 'gi');
      result = result.replace(regex, '|||$1|||');
    });

    return result.split('|||').map((part, i) => {
      const isKeyword = keywords.some(k => k.toLowerCase() === part.toLowerCase());
      if (isKeyword) {
        return <span key={i} className="text-indigo-600 font-semibold">{part}</span>;
      }
      return part;
    });
  };

  const ActiveIcon = features[activeIndex].icon;

  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight"
          >
            Tout ce qu&apos;il faut,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              rien de plus
            </span>
          </motion.h2>
          <p className="text-xl text-gray-600 mt-4">Des fonctionnalités pensées pour l&apos;essentiel.</p>
        </div>

        <div
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Mobile: Active Feature Title */}
          <div className="lg:hidden col-span-1 mb-4">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-3"
            >
              <div className={`p-2 rounded-xl bg-gradient-to-br ${features[activeIndex].color} text-white`}>
                <ActiveIcon className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">{features[activeIndex].title}</h3>
            </motion.div>
          </div>

          {/* Mobile Tabs - Scrollable pills */}
          <div
            ref={mobileTabsRef}
            className="lg:hidden col-span-1 flex overflow-x-auto pb-4 gap-2 no-scrollbar -mx-4 px-4 snap-x snap-mandatory"
          >
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <button
                  key={feature.id}
                  ref={(el) => { tabRefs.current[idx] = el; }}
                  onClick={() => handleTabClick(idx)}
                  className={`flex-none snap-center px-4 py-2.5 rounded-full whitespace-nowrap transition-all duration-300 flex items-center gap-2 ${
                    activeIndex === idx
                      ? `bg-gradient-to-r ${feature.color} text-white shadow-lg scale-105`
                      : 'bg-white border border-slate-200 text-slate-500'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${activeIndex === idx ? 'text-white' : 'text-slate-400'}`} />
                  <span className="font-medium text-sm">{feature.title.split(' ')[0]}</span>
                  {activeIndex === idx && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Desktop Sidebar Tabs */}
          <div className="hidden lg:flex lg:col-span-4 flex-col gap-3">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <button
                  key={feature.id}
                  onClick={() => handleTabClick(idx)}
                  className={`group relative text-left p-5 rounded-2xl transition-all duration-500 border-2 ${
                    activeIndex === idx
                      ? 'bg-white border-indigo-100 shadow-xl shadow-indigo-500/5 ring-1 ring-black/5'
                      : 'bg-transparent border-transparent hover:bg-white/50'
                  }`}
                >
                  {/* Progress Bar */}
                  {activeIndex === idx && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-100 rounded-l-2xl overflow-hidden">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${progress}%` }}
                        className="w-full bg-gradient-to-b from-indigo-500 to-violet-500"
                      />
                    </div>
                  )}

                  <div className="flex gap-4">
                    <div className={`mt-0.5 p-2.5 rounded-xl transition-colors duration-300 ${
                      activeIndex === idx ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={`font-bold transition-colors duration-300 ${
                        activeIndex === idx ? 'text-slate-900' : 'text-slate-500'
                      }`}>
                        {feature.title}
                      </h3>
                      <p className={`text-sm mt-1 transition-colors duration-300 ${
                        activeIndex === idx ? 'text-slate-600' : 'text-slate-400'
                      }`}>
                        {feature.subtitle}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Preview Area */}
          <div className="lg:col-span-8 relative">
            <div className="bg-white rounded-[2rem] p-6 lg:p-8 border border-slate-200/60 shadow-2xl shadow-slate-200/50 min-h-[450px] lg:min-h-[500px] flex flex-col">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="flex flex-col h-full"
                >
                  <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
                    <div className="space-y-5 order-2 lg:order-1">
                      <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${features[activeIndex].color} text-white shadow-lg`}>
                        <ActiveIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight mb-3">
                          {features[activeIndex].title}
                        </h3>
                        <p className="text-base lg:text-lg text-slate-600 leading-relaxed">
                          {highlightKeywords(features[activeIndex].description, features[activeIndex].keywords)}
                        </p>
                      </div>
                      <ul className="space-y-2.5">
                        {['Mise en place en 5 minutes', 'Support client 7j/7', 'Conforme RGPD'].map((item, i) => (
                          <li key={i} className="flex items-center gap-2.5 text-slate-500 font-medium text-sm">
                            <Check className="w-4 h-4 text-indigo-500" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="order-1 lg:order-2 aspect-square lg:aspect-auto lg:h-full min-h-[280px]">
                      {features[activeIndex].visual}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Background decorative elements */}
            <div className="absolute -z-10 -bottom-12 -right-12 w-64 h-64 bg-indigo-100/50 rounded-full blur-3xl" />
            <div className="absolute -z-10 -top-12 -left-12 w-64 h-64 bg-violet-100/50 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
}

// ROI Calculator Section
// Case Study Section - Detailed Success Story
function CaseStudySection() {
  const { ref, isInView } = useInView();

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div ref={ref} className="max-w-5xl mx-auto px-6">
        <div className={`text-center mb-12 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-full text-amber-700 text-sm font-semibold mb-4">
            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            Étude de cas
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Comment le Café des Artistes a{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              doublé ses clients réguliers
            </span>
          </h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden"
        >
          <div className="grid md:grid-cols-2">
            {/* Left: Story */}
            <div className="p-8 md:p-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  CA
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Café des Artistes</h3>
                  <p className="text-gray-500 text-sm">Lyon 6ème • Coffee shop</p>
                </div>
              </div>

              <blockquote className="text-lg text-gray-700 leading-relaxed mb-6 italic border-l-4 border-indigo-200 pl-4">
                "Avant Qarte, je tamponnais des cartes papier que les clients perdaient systématiquement. Aujourd&apos;hui, 80% de mes clients ont leur carte digitale et reviennent 2x plus souvent."
              </blockquote>

              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                  <Coffee className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Marc Dubois</p>
                  <p className="text-sm text-gray-500">Gérant depuis 2019</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">Ce qui a changé :</h4>
                {[
                  'Mise en place en 10 minutes',
                  'QR code sur chaque table + comptoir',
                  'Récompense : 10ème café offert',
                  'Notification push le vendredi matin'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-emerald-600" />
                    </div>
                    <span className="text-gray-600 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Results */}
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 md:p-10 text-white">
              <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-200 mb-8">
                Résultats après 6 mois
              </h4>

              <div className="space-y-8">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black">+127%</span>
                    <TrendingUp className="w-6 h-6 text-emerald-300" />
                  </div>
                  <p className="text-indigo-200 mt-1">de clients réguliers</p>
                </div>

                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black">847</span>
                  </div>
                  <p className="text-indigo-200 mt-1">cartes de fidélité actives</p>
                </div>

                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black">4.8</span>
                    <div className="flex">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-indigo-200 mt-1">note Google (vs 4.2 avant)</p>
                </div>

                <div className="pt-6 border-t border-white/20">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">+2 340€</span>
                    <span className="text-indigo-200">/mois</span>
                  </div>
                  <p className="text-indigo-200 text-sm mt-1">de chiffre d&apos;affaires additionnel estimé</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Pricing Section
function PricingSection() {
  const { ref, isInView } = useInView();

  const features = [
    'Clients illimités',
    'QR Code perso',
    'Notifications push',
    'Programmation envois',
    'Dashboard analytics',
    'Avis Google',
    'Support prioritaire',
    'Zéro commission'
  ];

  return (
    <section id="pricing" className="py-24 bg-white">
      <div ref={ref} className="max-w-4xl mx-auto px-6">
        <div className={`text-center mb-16 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Un prix, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">tout inclus</span>
          </h2>
          <p className="text-xl text-gray-600">Pas de surprise, pas de frais cachés.</p>
        </div>

        {/* Pricing Card */}
        <div className={`relative max-w-md mx-auto group transition-all duration-500 hover:-translate-y-2 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
          {/* Trial Badge - Outside overflow container */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
            <div className="px-8 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold rounded-full shadow-xl shadow-emerald-500/20 tracking-[0.1em] uppercase whitespace-nowrap">
              15 jours gratuits
            </div>
          </div>

          {/* Premium Animated Shimmer Border */}
          <div className="absolute -inset-[2px] bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 rounded-[2.5rem] animate-shimmer opacity-70 blur-[2px] group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative bg-white/80 backdrop-blur-2xl border border-white/40 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden">
            {/* Decorative Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full -translate-y-1/2 pointer-events-none" />

            <div className="relative text-center pt-4 mb-10">
              <div className="inline-flex items-baseline justify-center gap-1.5">
                <span className="text-7xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-gray-900 to-gray-600">
                  19€
                </span>
                <span className="text-xl font-semibold text-gray-400">/mois</span>
              </div>
              <p className="text-gray-500 text-sm mt-2">soit <span className="font-semibold text-indigo-600">~0,63€</span> par jour</p>
              <p className="text-indigo-600 font-semibold text-sm mt-3 tracking-wide uppercase">Tout inclus, sans engagement</p>
              <p className="text-emerald-600 font-medium text-sm mt-2">✨ Inscription sans carte bancaire</p>
            </div>

            <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-10" />

            <ul className="grid grid-cols-2 gap-3 mb-10 relative">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 group/item">
                  <div className="w-5 h-5 bg-emerald-500/10 rounded-full flex items-center justify-center flex-shrink-0 group-hover/item:scale-110 group-hover/item:bg-emerald-500/20 transition-all duration-300">
                    <Check className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span className="text-gray-600 text-sm font-medium group-hover/item:text-gray-900 transition-colors">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="relative group/btn">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl blur-md opacity-20 group-hover/btn:opacity-40 transition-opacity duration-500" />
              <a
                href="/auth/merchant/signup"
                onClick={() => { trackCtaClick('pricing_cta_2', 'pricing_section_2'); fbEvents.initiateCheckout(); }}
                className="relative block w-full py-5 bg-gradient-to-r from-indigo-600 via-violet-600 to-rose-600 text-white font-bold rounded-2xl hover:shadow-2xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 text-center uppercase tracking-wider text-sm shadow-xl shadow-indigo-500/20"
              >
                Démarrer maintenant
              </a>
            </div>

            <p className="text-center text-gray-400 text-[10px] font-bold mt-6 uppercase tracking-[0.2em]">
              Annulation possible à tout moment
            </p>
          </div>
        </div>

        {/* Guarantee Badges */}
        <div className={`flex flex-wrap justify-center gap-6 mt-12 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100">
            <Headphones className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">Support réactif 7j/7</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full border border-indigo-100">
            <CreditCard className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-700">Sans CB pour essayer</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-violet-50 rounded-full border border-violet-100">
            <Zap className="w-4 h-4 text-violet-600" />
            <span className="text-sm font-medium text-violet-700">Activation instantanée</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// Testimonials Section - Stacked Card Carousel
function TestimonialsSection() {
  const { ref, isInView } = useInView();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const testimonials = [
    {
      name: 'Marie L.',
      role: 'Gérante de salon de coiffure',
      content: 'Depuis Qarte, +40% de mes clientes reviennent plus régulièrement. Et surtout : fini les cartes perdues !',
      image: '/images/temoignages/marie.webp',
      stat: '+40%',
      statLabel: 'fidélisation'
    },
    {
      name: 'Thomas D.',
      role: 'Propriétaire de café',
      content: 'La mise en place a pris 5 minutes. Mes clients adorent scanner le QR, c\'est devenu un jeu pour eux.',
      image: '/images/temoignages/thomas.webp',
      stat: '5 min',
      statLabel: 'installation'
    },
    {
      name: 'Sophie M.',
      role: 'Fleuriste',
      content: 'J\'ai enfin des données sur mes clients. Et le côté écologique, ça correspond à mes valeurs.',
      image: '/images/temoignages/sophie.webp',
      stat: '0',
      statLabel: 'papier utilisé'
    }
  ];

  const nextSlide = useCallback(() => setCurrentIndex((prev) => (prev + 1) % testimonials.length), [testimonials.length]);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);

  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(nextSlide, 5000);
      return () => clearInterval(interval);
    }
  }, [isPaused, nextSlide]);

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-100 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-violet-100 rounded-full blur-3xl" />
      </div>

      <div ref={ref} className="max-w-7xl mx-auto px-6 relative">
        <div className={`text-center mb-12 transition-all duration-1000 transform ${isInView ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Ils nous font confiance
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">Découvrez ce que nos commerçants disent de Qarte</p>
        </div>

        <div
          className="relative max-w-4xl mx-auto"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Floating Previews (Desktop) */}
          <div className="hidden lg:block absolute -left-48 top-1/2 -translate-y-1/2 opacity-20 scale-90 blur-[1px]">
            <div className="bg-gray-50 p-6 rounded-3xl w-64 border border-gray-100 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-gray-200 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
          <div className="hidden lg:block absolute -right-48 top-1/2 -translate-y-1/2 opacity-20 scale-90 blur-[1px]">
            <div className="bg-gray-50 p-6 rounded-3xl w-64 border border-gray-100 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-gray-200 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          </div>

          {/* Main Carousel Card */}
          <div className="relative min-h-[580px] sm:min-h-[520px] md:min-h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                className="absolute inset-0"
              >
                <div className="h-full bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-6 sm:p-8 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-white relative overflow-hidden flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-stretch">

                  {/* Visual Background Quote */}
                  <Quote className="absolute -top-6 -left-6 w-32 h-32 text-indigo-500/5 rotate-12" />

                  {/* Left Side: Identity & Stat */}
                  <div className="flex flex-col items-center md:items-start md:w-1/3 justify-between gap-6">
                    <div className="relative">
                      <div className="absolute -inset-2 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-full opacity-20 blur-lg animate-pulse" />
                      <div className="relative w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-indigo-500 to-violet-500">
                        <div className="w-full h-full rounded-full overflow-hidden border-4 border-white">
                          <Image
                            src={testimonials[currentIndex].image}
                            alt={testimonials[currentIndex].name}
                            width={96}
                            height={96}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="text-center md:text-left">
                      <h4 className="text-2xl font-bold text-gray-900 leading-tight">{testimonials[currentIndex].name}</h4>
                      <p className="text-indigo-600 font-medium text-sm mt-1">{testimonials[currentIndex].role}</p>
                    </div>

                    <div className="mt-auto w-full">
                      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-4 md:p-6 rounded-2xl md:rounded-3xl text-white shadow-lg shadow-indigo-200/50">
                        <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-80 mb-1">{testimonials[currentIndex].statLabel}</p>
                        <p className="text-2xl md:text-3xl font-black">{testimonials[currentIndex].stat}</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Quote & Content */}
                  <div className="flex-1 flex flex-col justify-center text-center md:text-left">
                    {/* Trustpilot-style Rating */}
                    <div className="flex flex-col sm:flex-row items-center md:items-start gap-3 mb-6">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <div key={s} className="w-7 h-7 bg-[#00b67a] flex items-center justify-center">
                            <Star className="w-4 h-4 fill-white text-white" />
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">Excellent</span>
                        <span className="text-sm text-gray-500">4.9 sur 5</span>
                      </div>
                    </div>

                    <blockquote className="text-lg sm:text-xl md:text-2xl text-gray-800 font-medium leading-relaxed">
                      &quot;{testimonials[currentIndex].content}&quot;
                    </blockquote>

                    <div className="mt-6 flex items-center justify-center md:justify-start gap-2">
                      <svg className="w-4 h-4 text-[#00b67a]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                      <span className="text-gray-500 text-sm font-medium">Avis vérifié</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Premium Navigation Controls */}
          <div className="flex items-center justify-between mt-12 px-4">
            <button
              onClick={prevSlide}
              className="group w-12 h-12 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-200 transition-all active:scale-90"
              aria-label="Précédent"
            >
              <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
            </button>

            {/* Enhanced Dot Indicators with Progress */}
            <div className="flex gap-4">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className="relative h-1.5 overflow-hidden rounded-full bg-gray-200 transition-all duration-500"
                  style={{ width: index === currentIndex ? '48px' : '12px' }}
                >
                  {index === currentIndex && (
                    <motion.div
                      className="absolute inset-0 bg-indigo-600"
                      initial={{ x: '-100%' }}
                      animate={{ x: isPaused ? '0%' : '0%' }}
                      transition={{ duration: 5, ease: "linear" }}
                      key={`${currentIndex}-${isPaused}`}
                    />
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={nextSlide}
              className="group w-12 h-12 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-200 transition-all active:scale-90"
              aria-label="Suivant"
            >
              <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// FAQ Section
function FAQSection() {
  const { ref, isInView } = useInView();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const faqs = [
    {
      question: "Et si mes clients n'ont pas de smartphone ?",
      answer: "99% de vos clients ont un smartphone. Pour les rares exceptions, vous pouvez noter leurs points manuellement et les ajouter plus tard. Aucun client n'est laissé de côté."
    },
    {
      question: "Combien de temps pour être opérationnel ?",
      answer: "5 minutes chrono. Créez votre compte, ajoutez votre logo, définissez votre récompense, imprimez le QR code. C'est prêt. Aucune formation nécessaire."
    },
    {
      question: "Mes clients vont trouver ça compliqué ?",
      answer: "Au contraire ! Ils scannent le QR code avec leur appareil photo, c'est tout. Pas d'application à télécharger, pas de compte à créer. Plus simple qu'une carte papier."
    },
    {
      question: "Que se passe-t-il si j'arrête Qarte ?",
      answer: "Vous exportez vos données clients en CSV quand vous voulez. Pas de piège, pas d'engagement. Vos données vous appartiennent."
    }
  ];

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % faqs.length);
  }, [faqs.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + faqs.length) % faqs.length);
  }, [faqs.length]);

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(handleNext, 6000);
    return () => clearInterval(interval);
  }, [handleNext, isHovered]);

  return (
    <section id="faq" className="py-24 bg-gray-50/50 overflow-hidden">
      <div ref={ref} className="max-w-5xl mx-auto px-6">
        <div className={`text-center mb-20 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Questions fréquentes
          </h2>
          <p className="text-xl text-gray-600">Tout ce que vous devez savoir pour booster votre fidélité.</p>
        </div>

        <div
          className="relative max-w-2xl mx-auto h-[400px] md:h-[350px] mb-20"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{ perspective: "1000px" }}
        >
          <AnimatePresence mode="popLayout">
            {faqs.map((faq, index) => {
              const isFront = index === currentIndex;
              const isNext = index === (currentIndex + 1) % faqs.length;
              const isAfter = index === (currentIndex + 2) % faqs.length;

              if (!isFront && !isNext && !isAfter) return null;

              const position = isFront ? 0 : isNext ? 1 : 2;

              return (
                <motion.div
                  key={index}
                  initial={false}
                  animate={{
                    y: position * 20,
                    scale: 1 - position * 0.05,
                    opacity: isFront ? 1 : isNext ? 0.6 : 0.2,
                    zIndex: 10 - position,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  exit={{ x: -300, rotate: -10, opacity: 0, scale: 0.9 }}
                  className="absolute inset-0 w-full"
                >
                  <div className={`h-full w-full bg-white rounded-3xl border border-gray-100 shadow-xl shadow-indigo-500/5 p-8 md:p-10 flex flex-col justify-center relative overflow-hidden transition-colors ${isFront ? 'border-indigo-100' : ''}`}>
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] select-none">
                      <span className="text-9xl font-black italic text-indigo-600">
                        0{index + 1}
                      </span>
                    </div>

                    <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-6">
                        <span className="flex-shrink-0 w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-200">
                          {index + 1}
                        </span>
                        <h3 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                          {faq.question}
                        </h3>
                      </div>
                      <p className="text-lg md:text-xl text-gray-600 leading-relaxed font-medium">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="absolute -bottom-16 left-0 right-0 flex items-center justify-between px-4 z-20">
            <div className="flex gap-2">
              {faqs.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === currentIndex ? 'w-8 bg-indigo-600' : 'w-2 bg-gray-300 hover:bg-indigo-300'
                  }`}
                />
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handlePrev}
                className="w-12 h-12 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={handleNext}
                className="w-12 h-12 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* WhatsApp Contact Block */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 max-w-4xl mx-auto overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-50/80 via-white/40 to-emerald-50/50 backdrop-blur-md border border-emerald-100/50 shadow-2xl shadow-emerald-900/5"
        >
          <div className="grid md:grid-cols-2 items-center">
            {/* Visual Chat Side */}
            <div className="relative p-8 md:p-12 bg-gradient-to-br from-emerald-500/10 to-transparent border-r border-emerald-100/30 overflow-hidden min-h-[300px] flex flex-col justify-center gap-4">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={isInView ? { x: 0, opacity: 1 } : {}}
                transition={{ delay: 0.8 }}
                className="self-start max-w-[85%] bg-white rounded-2xl rounded-tl-none p-4 shadow-sm border border-emerald-50"
              >
                <p className="text-sm text-slate-700 leading-relaxed">
                  Bonjour ! J&apos;aimerais en savoir plus sur l&apos;accompagnement personnalisé...
                </p>
                <span className="text-[10px] text-slate-400 mt-1 block">14:02</span>
              </motion.div>

              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={isInView ? { x: 0, opacity: 1 } : {}}
                transition={{ delay: 1.2 }}
                className="self-end max-w-[85%] bg-emerald-500 text-white rounded-2xl rounded-tr-none p-4 shadow-lg shadow-emerald-500/20"
              >
                <p className="text-sm leading-relaxed">
                  Hello ! Je suis là pour vous répondre. Quel est votre projet ?
                </p>
                <div className="flex justify-end items-center gap-1 mt-1">
                  <span className="text-[10px] text-emerald-100">14:05</span>
                  <Check className="w-3 h-3 text-emerald-200" />
                </div>
              </motion.div>

              {/* Animated Icon Floating Backdrop */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 opacity-10">
                <MessageCircle className="w-64 h-64 text-emerald-600 rotate-12" />
              </div>
            </div>

            {/* Content Side */}
            <div className="p-8 md:p-12 text-left">
              <div className="flex items-center gap-3 mb-6">
                <div className="relative">
                  <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <MessageCircle className="w-7 h-7 text-white" />
                    </motion.div>
                  </div>
                  <motion.span
                    animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-white rounded-full shadow-sm"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                      En ligne
                    </span>
                    <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      &lt; 1h
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-500 mt-0.5">Direct avec le fondateur</p>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-slate-900 mb-4 leading-tight">
                Besoin d&apos;un échange <br/><span className="text-emerald-600">rapide et humain ?</span>
              </h3>
              <p className="text-slate-600 mb-8 leading-relaxed">
                Pas de bot, pas de ticket support. Posez vos questions directement sur WhatsApp et recevez une réponse personnalisée.
              </p>

              <div className="flex flex-col gap-4">
                <motion.a
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  href="https://wa.me/33607447420"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-center gap-3 w-full py-4 bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold rounded-2xl transition-all duration-300 shadow-xl shadow-emerald-500/20"
                >
                  <svg className="w-6 h-6 transition-transform group-hover:rotate-12" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Démarrer la discussion
                </motion.a>

                <div className="flex items-center justify-center gap-4 text-slate-400 text-xs font-medium">
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    Données sécurisées
                  </div>
                  <div className="w-1 h-1 bg-slate-300 rounded-full" />
                  <span>Sans engagement</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Footer Section
function FooterSection() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-16">
      <div className="max-w-6xl mx-auto px-6">
        {/* Final CTA */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Prêt à simplifier votre fidélisation ?
          </h2>
          <a
            href="/auth/merchant/signup"
            onClick={() => { trackCtaClick('footer_cta', 'footer_section'); fbEvents.initiateCheckout(); }}
            className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            Créer ma carte gratuite
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
          <p className="text-sm text-gray-500 mt-3">Essai 15 jours gratuit • Sans carte bancaire</p>
        </div>

        {/* Integration Logos */}
        <div className="flex flex-wrap items-center justify-center gap-8 mb-10 py-6 border-y border-gray-200">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Intégrations</span>
          <div className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
            </svg>
            <span className="text-sm font-medium">Stripe</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            <span className="text-sm font-medium">Apple Wallet</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-sm font-medium">Google Wallet</span>
          </div>
        </div>

        {/* Trust Badges - Enhanced */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-100">
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs font-semibold text-gray-700 text-center">RGPD Compliant</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-100">
            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center">
              <Leaf className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-xs font-semibold text-gray-700 text-center">Hébergement Vert</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-100">
            <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-lg">
              🇫🇷
            </div>
            <span className="text-xs font-semibold text-gray-700 text-center">Serveurs en France</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-100">
            <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-xs font-semibold text-gray-700 text-center">Paiement Sécurisé</span>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <span className="text-gray-900 font-semibold">Qarte</span>
          </div>

          <p className="text-gray-500 text-sm">
            © 2025 Qarte - Fidélisez mieux, dépensez moins
          </p>

          {/* Outils gratuits */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-4">
            <span className="text-gray-400 text-sm font-medium">Outils gratuits :</span>
            <a href="/outils-gratuits/qr-menu" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-colors">QR Code Menu</a>
            <a href="/outils-gratuits/lien-avis" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-colors">Lien Avis Google</a>
          </div>

          {/* Pages légales */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            <a href="/contact" className="text-gray-500 hover:text-gray-700 text-sm transition-colors">Contact</a>
            <a href="/mentions-legales" className="text-gray-500 hover:text-gray-700 text-sm transition-colors">Mentions légales</a>
            <a href="/cgv" className="text-gray-500 hover:text-gray-700 text-sm transition-colors">CGV</a>
            <a href="/politique-confidentialite" className="text-gray-500 hover:text-gray-700 text-sm transition-colors">Confidentialité</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Floating WhatsApp Button
function FloatingWhatsAppButton() {
  return (
    <a
      href="https://wa.me/33607447420"
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackWhatsAppClicked('floating_button')}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg shadow-[#25D366]/40 hover:scale-110 transition-transform duration-300 animate-pulse-glow"
      aria-label="Contacter sur WhatsApp"
    >
      <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    </a>
  );
}

// Scroll to Top Button
function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 400);
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-6 right-6 z-50 w-12 h-12 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-50 hover:border-indigo-200 hover:scale-110 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
      aria-label="Retour en haut"
    >
      <ArrowUp className="w-5 h-5 text-gray-600" />
    </button>
  );
}

// Trust Banner - Scrolling Businesses
// Calculate trust count with 10% monthly growth
function getTrustData() {
  const baseCount = 170; // 170 commerces au 01/01/2026
  const baseDate = new Date('2026-01-01'); // Date de référence
  const now = new Date();

  // Calculate months since base date
  const monthsDiff = (now.getFullYear() - baseDate.getFullYear()) * 12 + (now.getMonth() - baseDate.getMonth());

  // Apply 10% growth per month (compound) - only for future months
  const currentCount = Math.floor(baseCount * Math.pow(1.10, Math.max(0, monthsDiff)));

  // Last update is 1st of current month
  const lastUpdate = new Date(now.getFullYear(), now.getMonth(), 1);
  const formattedDate = lastUpdate.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return { count: currentCount, updatedAt: formattedDate };
}

function TrustBanner() {
  const { ref, isInView } = useInView({ threshold: 0.3 });
  const trustData = getTrustData();
  const { count, startCounting } = useCounter(trustData.count, 2500);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (isInView && !hasStarted) {
      startCounting();
      setHasStarted(true);
    }
  }, [isInView, hasStarted, startCounting]);

  const floatingIcons = [
    { Icon: Coffee, top: '15%', left: '8%', delay: 0 },
    { Icon: Scissors, top: '20%', right: '10%', delay: 0.8 },
    { Icon: ShoppingBag, bottom: '25%', left: '12%', delay: 1.2 },
    { Icon: UtensilsCrossed, bottom: '20%', right: '15%', delay: 0.4 },
  ];

  return (
    <section ref={ref} className="relative py-20 bg-white overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-[100px] -z-10" />

      {/* Floating Decorative Icons */}
      {floatingIcons.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={isInView ? {
            opacity: 1,
            scale: 1,
            y: [0, -15, 0],
          } : {}}
          transition={{
            opacity: { duration: 0.8, delay: item.delay },
            scale: { duration: 0.8, delay: item.delay },
            y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: item.delay }
          }}
          className="hidden lg:flex absolute items-center justify-center p-3.5 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 text-indigo-500"
          style={{ top: item.top, bottom: item.bottom, left: item.left, right: item.right }}
        >
          <item.Icon className="w-5 h-5" />
        </motion.div>
      ))}

      <div className="relative max-w-4xl mx-auto px-6 text-center">
        {/* Label */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 mb-6"
        >
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-bold tracking-widest text-indigo-600/70 uppercase">
            Notre Impact
          </span>
          <Sparkles className="w-4 h-4 text-indigo-500" />
        </motion.div>

        {/* Counter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-7xl md:text-8xl font-black text-indigo-600 tracking-tighter mb-3 tabular-nums">
            +{count}
          </h2>
          <div className="space-y-3">
            <h3 className="text-xl md:text-2xl font-semibold text-gray-900 tracking-tight">
              commerces nous font déjà confiance
            </h3>
            <p className="text-base text-gray-500 max-w-md mx-auto">
              Rejoignez une communauté grandissante de professionnels qui digitalisent leur fidélité client.
            </p>
          </div>

          {/* Update badge */}
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: 0.6, ease: "easeOut" }}
            className="inline-flex items-center gap-1.5 px-3 py-1 mt-5 rounded-full border border-gray-200/60 bg-gray-50/50 backdrop-blur-sm"
          >
            <div className="relative flex h-1.5 w-1.5">
              <motion.span
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inline-flex h-full w-full rounded-full bg-emerald-500/50"
              />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </div>
            <Clock className="w-3 h-3 text-gray-400" />
            <span className="text-[10px] uppercase tracking-wider font-medium text-gray-500">
              Mis à jour le <span className="text-gray-700">{trustData.updatedAt}</span>
            </span>
          </motion.div>
        </motion.div>

        {/* Bottom indicator line */}
        <motion.div
          initial={{ width: 0 }}
          animate={isInView ? { width: 60 } : {}}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="h-1 bg-indigo-600/20 rounded-full mx-auto mt-10"
        />
      </div>
    </section>
  );
}

// How It Works Section - 3 Simple Steps
function HowItWorksSection() {
  const { ref, isInView } = useInView();

  const steps = [
    {
      number: '01',
      title: 'Créez votre compte',
      description: 'En 2 minutes, configurez votre programme de fidélité personnalisé.',
      icon: Smartphone,
      color: 'from-indigo-500 to-violet-500'
    },
    {
      number: '02',
      title: 'Imprimez le QR Code',
      description: 'Placez-le en caisse. Vos clients scannent avec leur téléphone.',
      icon: QrCode,
      color: 'from-violet-500 to-purple-500'
    },
    {
      number: '03',
      title: 'Fidélisez automatiquement',
      description: 'Les points s\'ajoutent, les notifications partent, vous analysez.',
      icon: TrendingUp,
      color: 'from-purple-500 to-rose-500'
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div ref={ref} className="max-w-5xl mx-auto px-6">
        <div className={`text-center mb-14 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Lancez-vous en{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              3 étapes
            </span>
          </h2>
          <p className="text-lg text-gray-600">Aucune compétence technique requise.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative group"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-gray-200 to-transparent z-0" />
              )}

              <div className="relative bg-white rounded-2xl p-6 border border-gray-100 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 z-10 hover:-translate-y-1">
                {/* Step number badge */}
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br ${step.color} text-white font-bold text-lg mb-5 shadow-lg`}>
                  <step.icon className="w-6 h-6" />
                </div>

                <div className="text-xs font-bold text-indigo-600 tracking-widest mb-2">
                  ÉTAPE {step.number}
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {step.title}
                </h3>

                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className={`text-center mt-12 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.5s' }}>
          <a
            href="/auth/merchant/signup"
            onClick={() => { trackCtaClick('how_it_works', 'how_it_works_section'); fbEvents.initiateCheckout(); }}
            className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            Commencer maintenant
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>
    </section>
  );
}

// Mobile Sticky CTA
function MobileStickyCta() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past hero (approx 600px)
      setIsVisible(window.scrollY > 600);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/95 backdrop-blur-lg border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <a
        href="/auth/merchant/signup"
        onClick={() => { trackCtaClick('mobile_sticky', 'mobile_sticky_cta'); fbEvents.initiateCheckout(); }}
        className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-transform"
      >
        Créer ma carte gratuite
        <ArrowRight className="w-5 h-5" />
      </a>
      <p className="text-center text-xs text-gray-500 mt-2">
        Essai 15 jours gratuit • Sans CB
      </p>
    </div>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

// Memoized sections for better performance
const MemoizedHeroSection = memo(HeroSection);
const MemoizedHowItWorksSection = memo(HowItWorksSection);
const MemoizedComparisonSection = memo(ComparisonSection);
const MemoizedFeaturesSection = memo(FeaturesSection);
const MemoizedTestimonialsSection = memo(TestimonialsSection);
const MemoizedCaseStudySection = memo(CaseStudySection);
const MemoizedPricingSection = memo(PricingSection);
const MemoizedFAQSection = memo(FAQSection);
const MemoizedFooterSection = memo(FooterSection);

export default function LandingPageV4() {
  return (
    <LazyMotion features={domAnimation}>
      <LandingAnalytics />
      <FacebookPixel />
      <FacebookScrollTracker />
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />

      <main className="overflow-hidden pb-24 md:pb-0">
        <MemoizedHeroSection />
        <MemoizedHowItWorksSection />
        <MemoizedComparisonSection />
        <MemoizedFeaturesSection />
        <MemoizedTestimonialsSection />
        <MemoizedCaseStudySection />
        <MemoizedPricingSection />
        <MemoizedFAQSection />
        <MemoizedFooterSection />
      </main>

      <MobileStickyCta />
      <ScrollToTopButton />
    </LazyMotion>
  );
}
