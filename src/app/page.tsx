'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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
            <a href="#features" className="hover:text-indigo-600 transition-colors">Solutions</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">Tarifs</a>
            <a href="/contact" className="hover:text-indigo-600 transition-colors">Contact</a>
            <a href="/auth/merchant" className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-lg transition-all shadow-sm">Espace Commerçant</a>
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
              href="/auth/merchant"
              className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl transition-all duration-300 text-center shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="relative z-10">Démarrer Gratuitement</span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
            <a
              href="#pricing"
              className="px-8 py-4 border border-gray-300 text-gray-900 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 text-center shadow-sm"
            >
              Voir les Tarifs
            </a>
          </div>
        </div>

        {/* iPhone Mockup */}
        <div className={`flex justify-center ${isInView ? 'animate-fade-in-up delay-300' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
          <div className="animate-float relative">
            {/* Phone Frame - Sans encoche */}
            <div className="relative w-[280px] h-[570px] bg-gray-900 rounded-[3rem] p-2 shadow-2xl shadow-gray-900/30">
              {/* Screen */}
              <div className="w-full h-full rounded-[2.5rem] overflow-hidden">
                <img
                  src="/images/mockup-card.jpg"
                  alt="Carte de fidélité Qarte"
                  className="w-full h-full object-cover object-top"
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
function StorytellingSection() {
  const { ref, isInView } = useInView();

  return (
    <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
      <div ref={ref} className="max-w-4xl mx-auto px-6">
        <div className={`space-y-12 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          {/* Founder Story */}
          <div className="flex flex-col md:flex-row items-start gap-8">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-full border-2 border-indigo-200 shadow-lg overflow-hidden">
                <Image
                  src="/images/fondateur/judicael.webp"
                  alt="Judicaël, Fondateur de Qarte"
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
            </div>

            <div className="space-y-6">
              <p className="text-2xl md:text-3xl text-gray-700 leading-relaxed font-light">
                <span className="text-indigo-600">"</span>
                Après des années à voir des commerçants galérer avec des solutions complexes et coûteuses,
                j'ai créé Qarte. Une solution qui fait une chose, et qui la fait bien.
                <span className="text-indigo-600">"</span>
              </p>

              {/* Signature */}
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-gradient-to-r from-indigo-300 to-transparent" />
                <span className="text-indigo-600 italic font-medium">— Judicaël, Fondateur</span>
              </div>
            </div>
          </div>

          {/* Eco Argument */}
          <div className={`mt-16 p-8 bg-emerald-50 border border-emerald-200 rounded-3xl shadow-sm ${isInView ? 'animate-fade-in-up delay-300' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Leaf className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Stop aux milliers de cartes papier jetées.</h3>
                <p className="text-gray-600 text-lg">
                  Chaque année, des millions de cartes de fidélité finissent à la poubelle.
                  Qarte est la solution <span className="text-emerald-600 font-semibold">Zéro Déchet</span> pour fidéliser vos clients.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

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
  const features = [
    {
      title: 'Installation Instantanée',
      subtitle: 'Pas d\'app à installer',
      description: 'Vos clients scannent le QR code et leur carte est créée instantanément. Grâce à leur numéro de téléphone, ils retrouvent leur carte à tout moment, même en changeant de navigateur.',
      icon: QrCode,
      reverse: false,
      color: 'indigo',
      // Midjourney prompt: "3D illustration of QR code being scanned by smartphone, instant creation sparkles, modern clean style"
      mockupType: 'qr'
    },
    {
      title: 'Avis Google Incentivés',
      subtitle: 'Transformez vos clients en ambassadeurs',
      description: 'Offrez 1 point bonus contre un avis Google. Boostez votre réputation en ligne tout en récompensant la fidélité.',
      icon: Star,
      reverse: true,
      color: 'violet',
      // Midjourney prompt: "Mobile screen showing a beautiful reward popup asking for Google Review in exchange for loyalty points"
      mockupType: 'review'
    },
    {
      title: 'Dashboard & Données',
      subtitle: 'Connaissez vos clients',
      description: 'Fréquence de visite, panier moyen, heures de pointe... Toutes les données pour prendre les bonnes décisions.',
      icon: BarChart3,
      reverse: false,
      color: 'rose',
      mockupType: 'dashboard'
    },
    {
      title: 'Programmes Membres VIP',
      subtitle: 'Créez l\'exclusivité',
      description: 'Créez des programmes VIP avec avantages exclusifs. Vos meilleurs clients deviennent des membres privilégiés avec des réductions permanentes.',
      icon: Crown,
      reverse: true,
      color: 'amber',
      mockupType: 'vip'
    }
  ];

  return (
    <section id="features" className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Tout ce qu'il faut,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">
              rien de plus
            </span>
          </h2>
          <p className="text-xl text-gray-600">Des fonctionnalités pensées pour l'essentiel.</p>
        </div>

        <div className="space-y-32">
          {features.map((feature, index) => (
            <FeatureRow key={index} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureRow({ feature }: { feature: any }) {
  const { ref, isInView } = useInView();
  const Icon = feature.icon;

  const colorClasses: Record<string, { bg: string; text: string; gradient: string }> = {
    indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-500', gradient: 'from-indigo-500 to-indigo-600' },
    violet: { bg: 'bg-violet-500/10', text: 'text-violet-500', gradient: 'from-violet-500 to-violet-600' },
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-500', gradient: 'from-rose-500 to-rose-600' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-500', gradient: 'from-amber-500 to-amber-600' }
  };

  const colors = colorClasses[feature.color];

  return (
    <div
      ref={ref}
      className={`grid lg:grid-cols-2 gap-12 items-center ${feature.reverse ? 'lg:flex-row-reverse' : ''}`}
    >
      <div className={`${feature.reverse ? 'lg:order-2' : ''} ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
        <div className={`inline-flex items-center gap-2 px-4 py-2 ${colors.bg} rounded-full mb-6`}>
          <Icon className={`w-5 h-5 ${colors.text}`} />
          <span className={`font-medium ${colors.text}`}>{feature.subtitle}</span>
        </div>

        <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{feature.title}</h3>
        <p className="text-lg text-gray-600 leading-relaxed">{feature.description}</p>
      </div>

      <div className={`${feature.reverse ? 'lg:order-1' : ''} ${isInView ? 'animate-fade-in-up delay-200' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
        {/* Feature Mockups */}
        {feature.mockupType === 'qr' && (
          <div className="relative">
            <div className="block w-full max-w-md mx-auto p-8 bg-white rounded-3xl shadow-2xl">
              <div className="w-48 h-48 mx-auto bg-gradient-to-br from-indigo-100 to-violet-100 rounded-2xl flex items-center justify-center mb-6">
                <QrCode className="w-32 h-32 text-indigo-500" />
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-emerald-500">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">Carte créée instantanément</span>
                </div>
              </div>
            </div>
            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 animate-float">
              <div className="bg-emerald-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                0.5s
              </div>
            </div>
          </div>
        )}

        {feature.mockupType === 'review' && (
          <div className="relative max-w-sm mx-auto">
            {/* Midjourney prompt: "Mobile screen showing a beautiful reward popup asking for Google Review in exchange for loyalty points" */}
            <div className="w-64 mx-auto bg-gray-900 rounded-[2rem] p-2 shadow-2xl">
              <div className="bg-white rounded-[1.75rem] overflow-hidden">
                <div className="p-6">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-r from-violet-500 to-rose-500 rounded-2xl flex items-center justify-center mb-4">
                    <Star className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 text-center mb-2">Aimez-vous nos services ?</h4>
                  <p className="text-gray-600 text-center text-sm mb-6">Laissez un avis et gagnez +1 Point bonus !</p>

                  <div className="flex justify-center gap-1 mb-6">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>

                  <button className="w-full py-3 bg-gradient-to-r from-violet-500 to-rose-500 text-white font-semibold rounded-xl">
                    Laisser un avis Google
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {feature.mockupType === 'dashboard' && (
          <div className="relative">
            <div className="w-full max-w-lg mx-auto p-6 bg-white rounded-3xl shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h4 className="font-bold text-gray-900">Vue d'ensemble</h4>
                <span className="text-sm text-gray-500">Ce mois</span>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-indigo-50 rounded-xl">
                  <p className="text-2xl font-bold text-indigo-600">247</p>
                  <p className="text-xs text-gray-600">Clients actifs</p>
                </div>
                <div className="p-4 bg-violet-50 rounded-xl">
                  <p className="text-2xl font-bold text-violet-600">18€</p>
                  <p className="text-xs text-gray-600">Panier moyen</p>
                </div>
                <div className="p-4 bg-rose-50 rounded-xl">
                  <p className="text-2xl font-bold text-rose-600">4.2x</p>
                  <p className="text-xs text-gray-600">Visites/mois</p>
                </div>
              </div>

              {/* Mini Chart */}
              <div className="h-32 flex items-end gap-2">
                {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
                  <div key={i} className="flex-1 bg-gradient-to-t from-indigo-500 to-violet-500 rounded-t-lg" style={{ height: `${height}%` }} />
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>Lun</span><span>Mar</span><span>Mer</span><span>Jeu</span><span>Ven</span><span>Sam</span><span>Dim</span>
              </div>
            </div>
          </div>
        )}

        {feature.mockupType === 'vip' && (
          <div className="relative w-full max-w-sm mx-auto group">
            {/* Ambient background glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-[2.5rem] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="relative overflow-hidden rounded-2xl border border-amber-200/30 bg-gradient-to-br from-zinc-900 via-amber-950/40 to-zinc-950 p-6 shadow-2xl backdrop-blur-sm">

                {/* Animated Shine Effect */}
                <motion.div
                  animate={{
                    x: ['-100%', '200%'],
                    opacity: [0, 0.3, 0]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear",
                    repeatDelay: 2
                  }}
                  className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-amber-100/20 to-transparent skew-x-12"
                />

                {/* Card Content */}
                <div className="relative z-10 flex flex-col h-48 justify-between">

                  {/* Header: Brand & Status */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-600 shadow-lg shadow-amber-900/20">
                        <Crown className="w-5 h-5 text-amber-950" strokeWidth={2.5} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500/80 leading-none mb-1">Status</p>
                        <h4 className="text-sm font-bold text-white tracking-tight">VIP GOLD</h4>
                      </div>
                    </div>
                    <div className="flex -space-x-1">
                      <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                    </div>
                  </div>

                  {/* Center: Main Benefit */}
                  <div className="py-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 backdrop-blur-md">
                      <Check className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-sm font-semibold text-amber-100">-10% sur tout</span>
                    </div>
                  </div>

                  {/* Footer: Member Info */}
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-500 mb-0.5">Membre Privilège</p>
                      <p className="text-lg font-semibold text-zinc-100">Marie D.</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-500 mb-0.5">Valide jusqu&apos;au</p>
                      <p className="text-xs font-mono text-zinc-300">12 / 26</p>
                    </div>
                  </div>
                </div>

                {/* Holographic "Chip" pattern */}
                <div className="absolute top-1/2 right-6 -translate-y-1/2 opacity-10">
                  <div className="grid grid-cols-3 gap-1">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    ))}
                  </div>
                </div>

                {/* Decorative radial gradients */}
                <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl"></div>
                <div className="absolute -top-20 -left-20 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl"></div>
              </div>

              {/* Reflection detail */}
              <div className="absolute inset-0 rounded-2xl border border-white/5 pointer-events-none"></div>
            </motion.div>

            {/* Legend / Caption for the mockup */}
            <div className="mt-6 flex items-center justify-center gap-4 text-sm font-medium text-zinc-400">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                Offres exclusives
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                Accès prioritaire
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Push Notification Teaser Section
function PushNotificationTeaser() {
  const { ref, isInView } = useInView();

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      <div ref={ref} className="max-w-6xl mx-auto px-6">
        <div className={`grid lg:grid-cols-2 gap-12 items-center ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          {/* Content */}
          <div className="order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold text-emerald-700 text-sm">Inclus</span>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Notifications{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">Push</span>
            </h2>

            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Restez connecté avec vos clients en temps réel. Envoyez le bon message au bon moment, directement sur leur smartphone.
            </p>

            <ul className="space-y-4 mb-8">
              {[
                { icon: MessageSquare, text: "Rappelez vos clients inactifs", example: '"Cela fait 2 semaines... On vous attend !"' },
                { icon: Tag, text: "Annoncez vos promotions", example: '"-20% ce weekend uniquement"' },
                { icon: Gift, text: "Alertes récompenses", example: '"Votre cadeau expire dans 3 jours"' },
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{item.text}</p>
                    <p className="text-sm text-gray-500 italic">{item.example}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="inline-flex items-center gap-2 text-sm text-gray-500">
              <Bell className="w-4 h-4" />
              <span>Inclus dans votre abonnement, sans surcoût</span>
            </div>
          </div>

          {/* Phone Mockup */}
          <div className="order-1 lg:order-2 flex justify-center">
            <div className="relative">
              {/* Phone Frame */}
              <div className="w-[280px] h-[560px] bg-slate-900 rounded-[3rem] p-3 shadow-2xl border-[6px] border-slate-800 relative z-10">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-slate-800 rounded-b-2xl z-20" />
                <div className="w-full h-full bg-gradient-to-b from-slate-100 to-slate-200 rounded-[2.2rem] overflow-hidden relative pt-12 px-3">

                  {/* Stacked Notifications */}
                  <div className="space-y-3">
                    <div className="bg-white shadow-xl rounded-2xl p-4 flex gap-3 border border-gray-100">
                      <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-bold">Q</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-gray-900">QARTE</span>
                          <span className="text-[10px] text-gray-400">Maintenant</span>
                        </div>
                        <p className="text-sm text-gray-700 font-medium">Offre Flash ! 🔥</p>
                        <p className="text-xs text-gray-500">-20% sur tout jusqu&apos;à ce soir</p>
                      </div>
                    </div>

                    <div className="bg-white/90 shadow-lg rounded-2xl p-4 flex gap-3 border border-gray-100 scale-[0.97] opacity-90 -mt-2">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-bold">Q</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-gray-900">QARTE</span>
                          <span className="text-[10px] text-gray-400">Il y a 2h</span>
                        </div>
                        <p className="text-sm text-gray-700 font-medium">Récompense dispo ! 🎁</p>
                        <p className="text-xs text-gray-500">Récupérez votre café offert</p>
                      </div>
                    </div>

                    <div className="bg-white/80 shadow-md rounded-2xl p-4 flex gap-3 border border-gray-100 scale-[0.94] opacity-70 -mt-2">
                      <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-bold">Q</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-gray-900">QARTE</span>
                          <span className="text-[10px] text-gray-400">Hier</span>
                        </div>
                        <p className="text-sm text-gray-700 font-medium">On vous attend ! ☕</p>
                      </div>
                    </div>
                  </div>

                  {/* Home indicator */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-24 h-1 bg-gray-400 rounded-full" />
                </div>
              </div>

              {/* Decorative glow */}
              <div className="absolute -inset-8 bg-amber-500/10 blur-3xl rounded-full -z-10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ROI Calculator Section
function ROICalculatorSection() {
  const { ref, isInView } = useInView();
  const [clients, setClients] = useState(200);
  const [basket, setBasket] = useState(25);

  const monthlyRevenue = clients * basket * 4;
  const gain = Math.round(monthlyRevenue * 0.15);
  const netGain = gain - 19;

  return (
    <section className="py-16 bg-gradient-to-b from-indigo-50/50 to-white relative overflow-hidden">
      <div ref={ref} className="max-w-3xl mx-auto px-6 relative z-10">
        <div className={`text-center mb-8 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Calculez votre <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">ROI</span>
          </h2>
          <p className="text-gray-600">Estimez vos gains mensuels avec Qarte</p>
        </div>

        <div className={`bg-white border border-gray-100 rounded-2xl p-6 shadow-lg ${isInView ? 'animate-fade-in-up delay-200' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
          {/* Sliders Row */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-gray-700 text-sm font-medium">Clients actifs</label>
                <span className="text-indigo-600 font-bold text-sm">{clients}</span>
              </div>
              <input
                type="range"
                min="50"
                max="1000"
                step="10"
                value={clients}
                onChange={(e) => setClients(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-indigo-500 [&::-webkit-slider-thumb]:to-violet-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md"
              />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-gray-700 text-sm font-medium">Panier moyen</label>
                <span className="text-indigo-600 font-bold text-sm">{basket}€</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={basket}
                onChange={(e) => setBasket(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-indigo-500 [&::-webkit-slider-thumb]:to-violet-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md"
              />
            </div>
          </div>

          {/* Compact Results */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl border border-indigo-100">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-0.5">Gain estimé</p>
                <p className="text-2xl font-bold text-emerald-600">+{gain}€</p>
              </div>
              <span className="text-xl text-gray-300">−</span>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-0.5">Coût Qarte</p>
                <p className="text-2xl font-bold text-gray-700">19€</p>
              </div>
              <span className="text-xl text-gray-300">=</span>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-xs text-gray-500 mb-0.5">Gain net / mois</p>
              <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">
                +{netGain}€
              </p>
              <p className="text-xs text-emerald-600 font-medium">ROI {Math.round((netGain / 19) * 100)}%</p>
            </div>
          </div>

          <a
            href="/auth/merchant/signup"
            className="block w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all duration-300 text-center shadow-lg shadow-indigo-500/25"
          >
            Générer ce gain maintenant
          </a>
        </div>
      </div>
    </section>
  );
}

// Stats Band Section
function StatsBandSection() {
  const { ref, isInView } = useInView();

  const trafficCounter = useCounter(30, 2000, 0);
  const wowCounter = useCounter(5, 2000, 0);
  const paperCounter = useCounter(0, 1000, 0);

  useEffect(() => {
    if (isInView) {
      trafficCounter.startCounting();
      wowCounter.startCounting();
      paperCounter.startCounting();
    }
  }, [isInView]);

  const stats = [
    {
      value: `+${trafficCounter.count}%`,
      label: 'de trafic récurrent',
      emoji: '📈'
    },
    {
      value: `x${wowCounter.count}`,
      label: 'bouche-à-oreille',
      emoji: '🗣️'
    },
    {
      value: paperCounter.count,
      label: 'Papier (100% Éco)',
      emoji: '🌱'
    }
  ];

  return (
    <section ref={ref} className="py-10 bg-gradient-to-r from-indigo-100/70 via-violet-100/70 to-rose-100/70">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-3 gap-4 md:gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`text-center ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="text-2xl md:text-3xl mb-1">{stat.emoji}</div>
              <div className="text-2xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-rose-600 mb-0.5">{stat.value}</div>
              <div className="text-gray-600 text-xs md:text-sm font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
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
      </div>
    </section>
  );
}

// Testimonials Section - Stacked Card Carousel
function TestimonialsSection() {
  const { ref, isInView } = useInView();
  const [currentIndex, setCurrentIndex] = useState(0);

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

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="py-24 bg-gray-50 overflow-hidden">
      <div ref={ref} className="max-w-6xl mx-auto px-6">
        <div className={`text-center mb-16 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Ils ont fait le switch
          </h2>
          <p className="text-xl text-gray-600">Des commerçants comme vous, qui ont choisi la simplicité.</p>
        </div>

        {/* Stacked Cards Container */}
        <div className={`relative max-w-lg mx-auto ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
          {/* Cards Stack */}
          <div className="relative h-[420px] flex items-center justify-center">
            {testimonials.map((testimonial, index) => {
              const offset = index - currentIndex;
              const absOffset = Math.abs(offset);
              const isActive = index === currentIndex;

              // Calculate position for stacked effect
              let translateY = 0;
              let translateX = 0;
              let scale = 1;
              let zIndex = testimonials.length - absOffset;
              let opacity = 1;

              if (offset === 0) {
                // Active card
                translateY = 0;
                scale = 1;
                zIndex = 10;
              } else if (offset === 1 || offset === -testimonials.length + 1) {
                // Next card (behind, slightly down and right)
                translateY = 20;
                translateX = 15;
                scale = 0.95;
                zIndex = 5;
                opacity = 0.7;
              } else if (offset === -1 || offset === testimonials.length - 1) {
                // Previous card (behind, slightly down and left)
                translateY = 20;
                translateX = -15;
                scale = 0.95;
                zIndex = 5;
                opacity = 0.7;
              } else {
                // Hidden cards
                translateY = 40;
                scale = 0.9;
                zIndex = 1;
                opacity = 0;
              }

              return (
                <div
                  key={index}
                  className="absolute w-full transition-all duration-500 ease-out"
                  style={{
                    transform: `translateY(${translateY}px) translateX(${translateX}px) scale(${scale})`,
                    zIndex,
                    opacity,
                    pointerEvents: isActive ? 'auto' : 'none'
                  }}
                >
                  <div className="relative bg-white p-8 rounded-[2rem] shadow-xl group">
                    <Quote className="absolute top-8 right-8 w-10 h-10 text-indigo-500/10 rotate-180" />

                    <div className="flex items-center gap-4 mb-6 relative">
                      <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full blur opacity-20" />
                        <div className="relative w-16 h-16 rounded-full overflow-hidden shadow-sm border border-indigo-50">
                          <Image
                            src={testimonial.image}
                            alt={testimonial.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 leading-none">{testimonial.name}</h4>
                        <p className="text-gray-500 text-xs mt-1">{testimonial.role}</p>
                      </div>
                    </div>

                    <p className="text-gray-600 mb-8 leading-relaxed italic relative z-10 min-h-[60px]">&quot;{testimonial.content}&quot;</p>

                    <div className="bg-gradient-to-r from-indigo-50 to-violet-50 p-4 rounded-2xl flex items-center gap-3 border border-indigo-100/50">
                      <span className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                        {testimonial.stat}
                      </span>
                      <span className="text-indigo-900/60 text-xs font-bold uppercase tracking-wider">{testimonial.statLabel}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={prevSlide}
              className="w-12 h-12 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center hover:bg-indigo-50 hover:border-indigo-200 transition-all duration-300 hover:scale-110 active:scale-95"
              aria-label="Témoignage précédent"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>

            {/* Dot Indicators */}
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? 'bg-indigo-600 w-8'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Aller au témoignage ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={nextSlide}
              className="w-12 h-12 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center hover:bg-indigo-50 hover:border-indigo-200 transition-all duration-300 hover:scale-110 active:scale-95"
              aria-label="Témoignage suivant"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
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
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'Comment migrer depuis mes cartes papier ?',
      answer: 'C\'est simple : commencez à utiliser Qarte pour les nouvelles fidélisations. Pour vos clients existants, vous pouvez reporter manuellement leurs points lors de leur prochaine visite. En quelques semaines, tout le monde sera passé au digital.'
    },
    {
      question: 'Puis-je annuler à tout moment ?',
      answer: 'Absolument. Aucun engagement, vous pouvez annuler votre abonnement quand vous le souhaitez. Vos données restent accessibles pendant 30 jours après l\'annulation.'
    },
    {
      question: 'Mes données sont-elles sécurisées (RGPD) ?',
      answer: 'Oui, Qarte est 100% conforme RGPD. Vos données et celles de vos clients sont hébergées en Europe et chiffrées. Vous gardez le contrôle total sur vos données.'
    },
    {
      question: 'Faut-il une connexion internet ?',
      answer: 'Pour le scan initial, oui. Mais une fois la carte créée, elle reste accessible même hors ligne. Le prochain scan synchronisera automatiquement les points.'
    },
    {
      question: 'Comment configurer ma récompense ?',
      answer: 'Depuis votre dashboard, vous définissez le nombre de points nécessaires et la récompense offerte. Vous pouvez la modifier à tout moment.'
    }
  ];

  return (
    <section id="faq" className="py-24 bg-white">
      <div ref={ref} className="max-w-4xl mx-auto px-6">
        <div className={`text-center mb-16 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Questions fréquentes
          </h2>
          <p className="text-xl text-gray-600">Tout ce que vous devez savoir avant de commencer.</p>
        </div>

        {/* FAQ Accordion */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 mb-16 ${isInView ? 'animate-fade-in-up delay-200' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`group transition-all duration-300 ease-out rounded-[2rem] border ${
                  isOpen
                    ? 'border-indigo-200 bg-white shadow-xl shadow-indigo-500/5 ring-1 ring-indigo-50'
                    : 'border-gray-100 bg-white/50 backdrop-blur-sm hover:border-indigo-100 hover:bg-white hover:shadow-lg hover:shadow-gray-200/40'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full px-7 py-6 text-left focus:outline-none"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4">
                      <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                        isOpen ? 'bg-indigo-600 text-white rotate-12 scale-110' : 'bg-gray-100 text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-500'
                      }`}>
                        {index + 1}
                      </div>
                      <span className={`font-bold text-lg leading-tight transition-colors duration-300 ${isOpen ? 'text-indigo-950' : 'text-gray-900'}`}>
                        {faq.question}
                      </span>
                    </div>
                    <div className={`mt-1.5 transition-all duration-500 transform ${isOpen ? 'rotate-180 text-indigo-600' : 'text-gray-400'}`}>
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  </div>

                  <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-5' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      <p className="text-gray-600 leading-relaxed pl-12 pr-4 border-l-2 border-indigo-100">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* WhatsApp Contact Block */}
        <div className={`bg-emerald-50 border border-emerald-200 rounded-3xl p-8 text-center shadow-sm ${isInView ? 'animate-fade-in-up delay-400' : 'opacity-0'}`} style={{ animationDelay: '0.4s' }}>
          <div className="w-16 h-16 mx-auto bg-[#25D366] rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Une question ?</h3>
          <p className="text-gray-600 mb-6">
            Parlez directement au fondateur sur WhatsApp
          </p>
          <a
            href="https://wa.me/33607447420"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 bg-[#25D366] text-white font-semibold rounded-xl hover:bg-[#20BD5A] transition-all duration-300 shadow-lg shadow-emerald-500/25"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Discuter sur WhatsApp
          </a>
        </div>
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
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all duration-300 shadow-lg shadow-indigo-500/25"
          >
            Démarrer maintenant
          </a>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-8 mb-12">
          <div className="flex items-center gap-2 text-gray-600">
            <CreditCard className="w-5 h-5" />
            <span className="text-sm">Paiement Stripe sécurisé</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Shield className="w-5 h-5" />
            <span className="text-sm">100% conforme RGPD</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Leaf className="w-5 h-5" />
            <span className="text-sm">Hébergement vert</span>
          </div>
        </div>

        {/* France Badge */}
        <div className="text-center mb-8">
          <span className="text-gray-500 text-sm">🇫🇷 Conçu avec ❤️ en France</span>
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
            © 2026 Qarte - Fidélisez mieux, dépensez moins
          </p>

          <div className="flex gap-6">
            <a href="/contact" className="text-gray-500 hover:text-indigo-600 text-sm transition-colors">Contact</a>
            <a href="/mentions-legales" className="text-gray-500 hover:text-indigo-600 text-sm transition-colors">Mentions légales</a>
            <a href="/cgv" className="text-gray-500 hover:text-indigo-600 text-sm transition-colors">CGV</a>
            <a href="/politique-confidentialite" className="text-gray-500 hover:text-indigo-600 text-sm transition-colors">Confidentialité</a>
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

// Adaptability Showcase Section - Mode Passage vs Mode Article
function AdaptabilityShowcase() {
  const { ref, isInView } = useInView();
  const [activeMode, setActiveMode] = useState<'passage' | 'article'>('passage');

  const allBusinessTypes = [
    { icon: Scissors, label: 'Coiffeurs' },
    { icon: Coffee, label: 'Cafés' },
    { icon: UtensilsCrossed, label: 'Restaurants' },
    { icon: Sparkles, label: 'Instituts' },
    { icon: Flower2, label: 'Fleuristes' },
    { icon: ShoppingBag, label: 'Boutiques' },
    { icon: Croissant, label: 'Boulangeries' },
    { icon: Star, label: 'Et plus...' },
  ];

  return (
    <section ref={ref} className="py-24 bg-gradient-to-b from-white to-gray-50 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className={`text-center mb-16 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full mb-6">
            <Zap className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-semibold text-indigo-700">Flexible par nature</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Qarte s'adapte à{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              votre commerce
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Deux modes de fidélité pour répondre à tous les besoins.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Mode Toggle */}
          <div className={`flex justify-center mb-8 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
            <div className="bg-white p-2 rounded-2xl shadow-lg border border-gray-100 inline-flex">
              <button
                onClick={() => setActiveMode('passage')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activeMode === 'passage'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Mode Passage
              </button>
              <button
                onClick={() => setActiveMode('article')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activeMode === 'article'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Mode Article
              </button>
            </div>
          </div>

          {/* Mode Description */}
          <div className={`${isInView ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeMode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {activeMode === 'passage' ? (
                  <>
                    <div className="p-6 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl border border-indigo-100">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">1 visite = 1 point</h3>
                      </div>
                      <p className="text-gray-600">
                        Idéal pour les coiffeurs, instituts de beauté, restaurants... Chaque passage compte !
                      </p>
                    </div>
                    <ul className="space-y-3">
                      {['Parfait pour les services', 'Simple et intuitif', 'Exemple: 10 coupes = 1 offerte'].map((item, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-emerald-600" />
                          </div>
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <>
                    <div className="p-6 bg-gradient-to-br from-violet-50 to-rose-50 rounded-2xl border border-violet-100">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center">
                          <ShoppingBag className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">1 article = 1 point</h3>
                      </div>
                      <p className="text-gray-600">
                        Parfait pour les boulangeries, cafés, boutiques... Comptez chaque achat !
                      </p>
                    </div>
                    <ul className="space-y-3">
                      {['Idéal pour les commerces', 'Encourage les achats multiples', 'Exemple: 10 cafés = 1 offert'].map((item, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-emerald-600" />
                          </div>
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Business Types Grid */}
        <div className={`mt-24 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.6s' }}>
          <h3 className="text-center text-lg font-semibold text-gray-900 mb-8">
            Adapté à tous les commerces de proximité
          </h3>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
            {allBusinessTypes.map((business, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.7 + i * 0.05 }}
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="w-10 h-10 bg-gray-50 group-hover:bg-indigo-50 rounded-xl flex items-center justify-center transition-colors">
                  <business.icon className="w-5 h-5 text-gray-600 group-hover:text-indigo-600 transition-colors" />
                </div>
                <span className="text-xs font-medium text-gray-600 text-center">{business.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function LandingPageV4() {
  return (
    <>
      <LandingAnalytics />
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />

      <main className="overflow-hidden">
        <HeroSection />
        <TrustBanner />
        <VideoShowcaseSection />
        <ComparisonSection />
        <AdaptabilityShowcase />
        <StorytellingSection />
        <FeaturesSection />
        <PushNotificationTeaser />
        <ROICalculatorSection />
        <StatsBandSection />
        <PricingSection />
        <TestimonialsSection />
        <FAQSection />
        <FooterSection />
      </main>

      <ScrollToTopButton />
    </>
  );
}
