'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode,
  Star,
  BarChart3,
  Check,
  Sparkles,
  Bell,
  Gift,
  Crown,
} from 'lucide-react';

export function FeaturesSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const mobileTabsRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);


  const features = [
    {
      id: 'instantanee',
      icon: QrCode,
      title: "Des clientes fidèles dès le premier passage",
      subtitle: "En 30 secondes, sans rien installer",
      description: "Votre cliente scanne le QR code en caisse, sa carte se crée instantanément. Elle revient pour cumuler ses points. Vous n'avez rien à gérer.",
      keywords: ["scanne", "instantanément", "rien à gérer"],
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
      title: "Plus d'avis 5 étoiles, plus de nouvelles clientes",
      subtitle: "Vos clientes parlent de vous sur Google",
      description: "Après chaque visite, Qarte propose à vos clientes de laisser un avis en échange de points bonus. Votre note Google monte, votre institut remonte dans les recherches.",
      keywords: ["avis", "note Google", "points bonus"],
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
      title: "Sachez exactement qui revient et qui vous oublie",
      subtitle: "Votre activité, en un coup d'œil",
      description: "Voyez en temps réel combien de clientes reviennent, lesquelles vous oublient, et quel jour est le plus rentable. Sans tableur, sans prise de tête.",
      keywords: ["temps réel", "qui revient", "plus rentable"],
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
      title: "Vos meilleures clientes méritent un traitement spécial",
      subtitle: "Elles dépensent plus, récompensez-les plus",
      description: "Créez des paliers de fidélité automatiques. Vos clientes les plus fidèles débloquent des remises permanentes et des avantages exclusifs. Elles se sentent privilégiées, elles reviennent encore plus.",
      keywords: ["paliers", "remises permanentes", "privilégiées"],
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
      title: "Remplissez vos créneaux vides en un message",
      subtitle: "98% de taux d'ouverture",
      description: "Mardi calme ? Envoyez une promo flash à vos clientes en 2 clics. Directement sur leur téléphone, sans pub, sans algorithme. Elles voient, elles viennent.",
      keywords: ["promo flash", "2 clics", "elles viennent"],
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
                      <p className="text-xs font-bold text-slate-900">Nail Salon by Elodie</p>
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
                      <p className="text-[11px] text-slate-600 mt-0.5">💅 Votre soin offert expire dans 3j</p>
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
            Sans app à télécharger
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
