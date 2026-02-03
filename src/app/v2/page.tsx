'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  QrCode,
  Star,
  BarChart3,
  Leaf,
  Check,
  ChevronDown,
  ChevronUp,
  Smartphone,
  Users,
  TrendingUp,
  Shield,
  CreditCard,
  MessageCircle
} from 'lucide-react';

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

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#111827]">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="animate-blob absolute top-20 left-20 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl" />
        <div className="animate-blob absolute bottom-20 right-20 w-96 h-96 bg-violet-500/30 rounded-full blur-3xl delay-200" style={{ animationDelay: '2s' }} />
        <div className="animate-blob absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-500/20 rounded-full blur-3xl" style={{ animationDelay: '4s' }} />
      </div>

      <div ref={ref} className="relative z-10 max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
        {/* Text Content */}
        <div className={`space-y-8 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
            <Leaf className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-emerald-400 font-medium">100% Zéro Papier</span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
            La fidélité client,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-rose-400">
              enfin simple.
            </span>
          </h1>

          <p className="text-xl text-gray-300 max-w-xl">
            Un QR code. Un navigateur. Zéro téléchargement. Zéro friction.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="#pricing"
              className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-violet-600 transition-all duration-300 text-center shadow-lg shadow-indigo-500/25"
            >
              Démarrer Gratuitement
            </a>
            <a
              href="#demo"
              className="px-8 py-4 border border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all duration-300 text-center backdrop-blur-sm"
            >
              Voir la Démo
            </a>
          </div>
        </div>

        {/* iPhone Mockup */}
        <div className={`flex justify-center ${isInView ? 'animate-fade-in-up delay-300' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
          <div className="animate-float relative">
            {/* Midjourney prompt: "Floating 3D iPhone showing clean mobile web app loyalty card interface, progress bar almost full, modern UI, dark mode" */}
            <div className="relative w-72 h-[580px] bg-gray-900 rounded-[3rem] p-3 shadow-2xl shadow-indigo-500/20">
              <div className="absolute top-8 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full" />
              <div className="w-full h-full bg-gradient-to-b from-gray-800 to-gray-900 rounded-[2.5rem] overflow-hidden p-6 flex flex-col">
                {/* App Header */}
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl flex items-center justify-center mb-3">
                    <span className="text-2xl font-bold text-white">Q</span>
                  </div>
                  <h3 className="text-white font-semibold">Café du Coin</h3>
                  <p className="text-gray-400 text-sm">Votre carte fidélité</p>
                </div>

                {/* Points Display */}
                <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-4">
                  <div className="text-center mb-4">
                    <span className="text-5xl font-bold text-white">7</span>
                    <span className="text-2xl text-gray-400">/10</span>
                  </div>
                  <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div className="w-[70%] h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" />
                  </div>
                  <p className="text-center text-gray-400 text-sm mt-2">Plus que 3 pour votre récompense !</p>
                </div>

                {/* Reward Preview */}
                <div className="bg-gradient-to-r from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 rounded-xl p-4 mt-auto">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center">
                      <Star className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">Café offert</p>
                      <p className="text-gray-400 text-xs">À 10 points</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-8 h-8 text-white/50" />
      </div>
    </section>
  );
}

// Storytelling Section
function StorytellingSection() {
  const { ref, isInView } = useInView();

  return (
    <section className="py-24 bg-gradient-to-b from-[#111827] to-gray-900">
      <div ref={ref} className="max-w-4xl mx-auto px-6">
        <div className={`space-y-12 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          {/* Founder Story */}
          <div className="flex flex-col md:flex-row items-start gap-8">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {/* Placeholder: Founder avatar */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 flex items-center justify-center">
                <span className="text-3xl">👨‍💻</span>
              </div>
            </div>

            <div className="space-y-6">
              <p className="text-2xl md:text-3xl text-white leading-relaxed font-light">
                <span className="text-indigo-400">"</span>
                Après des années à voir des commerçants galérer avec des solutions complexes et coûteuses,
                j'ai créé Qarte. Une solution qui fait une chose, et qui la fait bien.
                <span className="text-indigo-400">"</span>
              </p>

              {/* Signature */}
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-gradient-to-r from-indigo-500/50 to-transparent" />
                <span className="text-indigo-400 italic font-light">— Judicaël, Fondateur</span>
              </div>
            </div>
          </div>

          {/* Eco Argument */}
          <div className={`mt-16 p-8 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl ${isInView ? 'animate-fade-in-up delay-300' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Leaf className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-3">Stop aux milliers de cartes papier jetées.</h3>
                <p className="text-gray-300 text-lg">
                  Chaque année, des millions de cartes de fidélité finissent à la poubelle.
                  Qarte est la solution <span className="text-emerald-400 font-semibold">Zéro Déchet</span> pour fidéliser vos clients.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Pain Points Section
function PainPointsSection() {
  const { ref, isInView } = useInView();

  const painPoints = [
    {
      number: '1',
      title: 'Le papier, c\'est fini',
      description: '30% des cartes papier sont perdues ou jetées. Résultat : vos clients oublient votre programme.',
      icon: '📄',
      stat: '30%',
      statLabel: 'de cartes perdues'
    },
    {
      number: '2',
      title: 'Les apps custom coûtent cher',
      description: 'Une app de fidélité sur-mesure ? Comptez 10 000€ minimum. Et vos clients doivent la télécharger...',
      icon: '💸',
      stat: '10k€',
      statLabel: 'coût moyen'
    },
    {
      number: '3',
      title: 'Sans data, vous êtes aveugle',
      description: 'Qui sont vos meilleurs clients ? Combien de fois reviennent-ils ? Sans données, impossible de relancer.',
      icon: '🔇',
      stat: '0',
      statLabel: 'visibilité'
    }
  ];

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Background Numbers */}
      <div className="absolute inset-0 flex justify-around items-center opacity-5 pointer-events-none">
        <span className="text-[300px] font-bold text-gray-900">1</span>
        <span className="text-[300px] font-bold text-gray-900">2</span>
        <span className="text-[300px] font-bold text-gray-900">3</span>
      </div>

      <div ref={ref} className="max-w-6xl mx-auto px-6 relative z-10">
        <div className={`text-center mb-16 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Les <span className="text-rose-500">3 erreurs</span> qui tuent la fidélisation
          </h2>
          <p className="text-xl text-gray-600">Et comment Qarte les résout définitivement.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {painPoints.map((point, index) => (
            <div
              key={index}
              className={`relative p-8 bg-white rounded-3xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: `${(index + 1) * 0.15}s` }}
            >
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-rose-500 text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-lg">
                {point.number}
              </div>

              <div className="text-4xl mb-4">{point.icon}</div>

              <h3 className="text-xl font-bold text-gray-900 mb-3">{point.title}</h3>
              <p className="text-gray-600 mb-6">{point.description}</p>

              <div className="pt-4 border-t border-gray-100">
                <span className="text-3xl font-bold text-rose-500">{point.stat}</span>
                <span className="text-gray-500 ml-2 text-sm">{point.statLabel}</span>
              </div>
            </div>
          ))}
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
      description: 'Vos clients scannent le QR code et leur carte est créée instantanément dans leur navigateur. Aucun téléchargement, aucune inscription complexe.',
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
    }
  ];

  return (
    <section className="py-24 bg-gray-50">
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
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-500', gradient: 'from-rose-500 to-rose-600' }
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
            <div className="w-full max-w-md mx-auto p-8 bg-white rounded-3xl shadow-2xl">
              <div className="w-48 h-48 mx-auto bg-gradient-to-br from-indigo-100 to-violet-100 rounded-2xl flex items-center justify-center mb-6">
                <QrCode className="w-32 h-32 text-indigo-500" />
              </div>
              <div className="text-center">
                <p className="text-gray-500 text-sm">Scannez pour tester</p>
                <div className="mt-4 flex items-center justify-center gap-2 text-emerald-500">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">Carte créée instantanément</span>
                </div>
              </div>
            </div>
            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 animate-float">
              <div className="bg-emerald-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                0.5s ⚡
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
      </div>
    </div>
  );
}

// ROI Calculator Section
function ROICalculatorSection() {
  const { ref, isInView } = useInView();
  const [clients, setClients] = useState(200);
  const [basket, setBasket] = useState(25);

  // Simple ROI calculation: 15% increase in revenue from loyalty
  const monthlyRevenue = clients * basket * 4; // 4 visits per month average
  const gain = Math.round(monthlyRevenue * 0.15);
  const netGain = gain - 19; // minus Qarte cost

  return (
    <section className="py-24 bg-[#111827] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="animate-blob absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="animate-blob absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" style={{ animationDelay: '3s' }} />
      </div>

      <div ref={ref} className="max-w-4xl mx-auto px-6 relative z-10">
        <div className={`text-center mb-12 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Calculez votre <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">ROI</span>
          </h2>
          <p className="text-xl text-gray-400">Combien Qarte peut vous rapporter chaque mois ?</p>
        </div>

        <div className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 md:p-12 ${isInView ? 'animate-fade-in-up delay-200' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Slider 1: Clients */}
            <div>
              <div className="flex justify-between mb-3">
                <label className="text-white font-medium">Nombre de clients</label>
                <span className="text-indigo-400 font-bold">{clients}</span>
              </div>
              <input
                type="range"
                min="50"
                max="1000"
                step="10"
                value={clients}
                onChange={(e) => setClients(Number(e.target.value))}
                className="w-full h-3 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-indigo-500 [&::-webkit-slider-thumb]:to-violet-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>50</span>
                <span>1000</span>
              </div>
            </div>

            {/* Slider 2: Basket */}
            <div>
              <div className="flex justify-between mb-3">
                <label className="text-white font-medium">Panier moyen</label>
                <span className="text-indigo-400 font-bold">{basket}€</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={basket}
                onChange={(e) => setBasket(Number(e.target.value))}
                className="w-full h-3 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-indigo-500 [&::-webkit-slider-thumb]:to-violet-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>10€</span>
                <span>100€</span>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="bg-white/5 rounded-2xl p-6 mb-8">
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-gray-400 text-sm mb-1">Gain estimé</p>
                <p className="text-4xl font-bold text-emerald-400">+{gain}€</p>
                <p className="text-gray-500 text-xs">/ mois</p>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-3xl text-gray-500">-</span>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Coût Qarte</p>
                <p className="text-4xl font-bold text-white">19€</p>
                <p className="text-gray-500 text-xs">/ mois</p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <p className="text-gray-400 text-sm mb-1">Gain net mensuel</p>
              <p className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                +{netGain}€
              </p>
              <p className="text-emerald-400 text-sm mt-2">
                Soit un ROI de {Math.round((netGain / 19) * 100)}%
              </p>
            </div>
          </div>

          <a
            href="#pricing"
            className="block w-full py-4 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-violet-600 transition-all duration-300 text-center shadow-lg shadow-indigo-500/25"
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
    <section ref={ref} className="py-16 bg-gradient-to-r from-indigo-600 via-violet-600 to-rose-600">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`text-center ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className="text-5xl mb-2">{stat.emoji}</div>
              <div className="text-5xl md:text-6xl font-bold text-white mb-2">{stat.value}</div>
              <div className="text-white/80 text-lg">{stat.label}</div>
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
    'QR Code personnalisé',
    'Dashboard analytics',
    'Avis Google incentivés',
    'Support prioritaire',
    'Mises à jour gratuites',
    'Export des données',
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
        <div className={`relative max-w-md mx-auto ${isInView ? 'animate-fade-in-up delay-200' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
          {/* Animated Border */}
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 rounded-3xl animate-shimmer opacity-75 blur-sm" />

          <div className="relative bg-white rounded-3xl p-8 shadow-xl">
            {/* Best Value Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <div className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-semibold rounded-full shadow-lg">
                Meilleur choix
              </div>
            </div>

            <div className="text-center pt-4 mb-8">
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-6xl font-bold text-gray-900">19€</span>
                <span className="text-gray-500">/mois</span>
              </div>
              <p className="text-gray-600 mt-2">Tout inclus, sans engagement</p>
            </div>

            <ul className="space-y-4 mb-8">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <a
              href="/signup"
              className="block w-full py-4 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-violet-600 transition-all duration-300 text-center shadow-lg shadow-indigo-500/25"
            >
              Démarrer maintenant
            </a>

            <p className="text-center text-gray-500 text-sm mt-4">
              Annulation possible à tout moment
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// Testimonials Section
function TestimonialsSection() {
  const { ref, isInView } = useInView();

  const testimonials = [
    {
      name: 'Marie L.',
      role: 'Gérante de salon de coiffure',
      content: 'Depuis Qarte, +40% de mes clientes reviennent plus régulièrement. Et surtout : fini les cartes perdues !',
      avatar: '👩‍🦰',
      stat: '+40%',
      statLabel: 'fidélisation'
    },
    {
      name: 'Thomas D.',
      role: 'Propriétaire de café',
      content: 'La mise en place a pris 5 minutes. Mes clients adorent scanner le QR, c\'est devenu un jeu pour eux.',
      avatar: '👨‍🍳',
      stat: '5 min',
      statLabel: 'installation'
    },
    {
      name: 'Sophie M.',
      role: 'Fleuriste',
      content: 'J\'ai enfin des données sur mes clients. Et le côté écologique, ça correspond à mes valeurs.',
      avatar: '👩‍🌾',
      stat: '0',
      statLabel: 'papier utilisé'
    }
  ];

  return (
    <section className="py-24 bg-gray-50">
      <div ref={ref} className="max-w-6xl mx-auto px-6">
        <div className={`text-center mb-16 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Ils ont fait le switch
          </h2>
          <p className="text-xl text-gray-600">Des commerçants comme vous, qui ont choisi la simplicité.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className={`bg-white p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: `${(index + 1) * 0.15}s` }}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-r from-indigo-100 to-violet-100 rounded-full flex items-center justify-center text-2xl">
                  {testimonial.avatar}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                  <p className="text-gray-500 text-sm">{testimonial.role}</p>
                </div>
              </div>

              <p className="text-gray-600 mb-6 leading-relaxed">"{testimonial.content}"</p>

              <div className="pt-4 border-t border-gray-100 flex items-center gap-2">
                <span className="text-2xl font-bold text-indigo-600">{testimonial.stat}</span>
                <span className="text-gray-500 text-sm">{testimonial.statLabel}</span>
              </div>
            </div>
          ))}
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
    <section className="py-24 bg-white">
      <div ref={ref} className="max-w-4xl mx-auto px-6">
        <div className={`text-center mb-16 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Questions fréquentes
          </h2>
          <p className="text-xl text-gray-600">Tout ce que vous devez savoir avant de commencer.</p>
        </div>

        {/* FAQ Accordion */}
        <div className={`space-y-4 mb-16 ${isInView ? 'animate-fade-in-up delay-200' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
          {faqs.map((faq, index) => (
            <div key={index} className="border border-gray-200 rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors duration-200 text-left"
              >
                <span className="font-semibold text-gray-900">{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
              </button>
              {openIndex === index && (
                <div className="px-6 pb-5">
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* WhatsApp Contact Block */}
        <div className={`bg-gradient-to-r from-[#25D366]/10 to-emerald-500/10 border border-[#25D366]/30 rounded-3xl p-8 text-center ${isInView ? 'animate-fade-in-up delay-400' : 'opacity-0'}`} style={{ animationDelay: '0.4s' }}>
          <div className="w-16 h-16 mx-auto bg-[#25D366] rounded-2xl flex items-center justify-center mb-4">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Une question ?</h3>
          <p className="text-gray-600 mb-6">
            Parlez directement au fondateur :{' '}
            <span className="font-semibold">+33 6 07 44 74 20</span>
          </p>
          <a
            href="https://wa.me/33607447420"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 bg-[#25D366] text-white font-semibold rounded-xl hover:bg-[#20BD5A] transition-all duration-300 shadow-lg shadow-[#25D366]/25"
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
    <footer className="bg-[#111827] py-16">
      <div className="max-w-6xl mx-auto px-6">
        {/* Final CTA */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Prêt à simplifier votre fidélisation ?
          </h2>
          <a
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-violet-600 transition-all duration-300 shadow-lg shadow-indigo-500/25"
          >
            Démarrer maintenant
          </a>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-8 mb-12">
          <div className="flex items-center gap-2 text-gray-400">
            <CreditCard className="w-5 h-5" />
            <span className="text-sm">Paiement Stripe sécurisé</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Shield className="w-5 h-5" />
            <span className="text-sm">100% conforme RGPD</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Leaf className="w-5 h-5" />
            <span className="text-sm">Hébergement vert</span>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <span className="text-white font-semibold">Qarte</span>
          </div>

          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Qarte. Tous droits réservés.
          </p>

          <div className="flex gap-6">
            <a href="/legal" className="text-gray-400 hover:text-white text-sm transition-colors">Mentions légales</a>
            <a href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">Confidentialité</a>
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
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg shadow-[#25D366]/40 hover:scale-110 transition-transform duration-300 animate-pulse-glow"
      aria-label="Contacter sur WhatsApp"
    >
      <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    </a>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function LandingPageV2() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />

      <main className="overflow-hidden">
        <HeroSection />
        <StorytellingSection />
        <PainPointsSection />
        <FeaturesSection />
        <ROICalculatorSection />
        <StatsBandSection />
        <PricingSection />
        <TestimonialsSection />
        <FAQSection />
        <FooterSection />
      </main>

      <FloatingWhatsAppButton />
    </>
  );
}
