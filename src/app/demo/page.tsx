'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Phone,
  ArrowRight,
  Star,
  Gift,
  ChevronRight,
  Sparkles,
  Check,
  Scissors,
  Coffee,
  ShoppingBag,
  Home,
  Loader2,
  HelpCircle,
  ChevronDown,
  QrCode,
  Minus,
  Plus,
  CreditCard,
  Undo2,
  Bell,
  Clock,
  Users,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Input } from '@/components/ui';
import { formatPhoneNumber, validateFrenchPhone } from '@/lib/utils';

// Business configurations for demo
const businesses = [
  {
    id: 'coiffure',
    label: 'Coiffure',
    icon: Scissors,
    name: 'Barber King',
    tagline: 'Votre carte fidélité',
    reward: 'Coupe offerte',
    maxPoints: 10,
    initialPoints: 7,
    loyaltyMode: 'visit' as const,
    productName: null,
    loyalCustomers: 127,
    colors: {
      primary: '#1e293b',
      secondary: '#334155',
    }
  },
  {
    id: 'esthetique',
    label: 'Esthétique',
    icon: Sparkles,
    name: "L'Instant Poudré",
    tagline: 'Votre carte beauté',
    reward: 'Soin visage offert',
    maxPoints: 8,
    initialPoints: 5,
    loyaltyMode: 'visit' as const,
    productName: null,
    loyalCustomers: 89,
    colors: {
      primary: '#db2777',
      secondary: '#f472b6',
    }
  },
  {
    id: 'restaurant',
    label: 'Restaurant',
    icon: Coffee,
    name: 'Le Petit Fournil',
    tagline: 'Programme fidélité',
    reward: 'Menu Midi Offert',
    maxPoints: 12,
    initialPoints: 9,
    loyaltyMode: 'visit' as const,
    productName: null,
    loyalCustomers: 234,
    colors: {
      primary: '#ea580c',
      secondary: '#f59e0b',
    }
  },
  {
    id: 'commerce',
    label: 'Commerce',
    icon: ShoppingBag,
    name: 'Green House',
    tagline: 'Carte avantages',
    reward: '-20% sur tout',
    maxPoints: 10,
    initialPoints: 6,
    loyaltyMode: 'article' as const,
    productName: 'achats',
    loyalCustomers: 156,
    colors: {
      primary: '#059669',
      secondary: '#14b8a6',
    }
  }
];

type Step = 'phone' | 'demo';

export default function DemoPage() {
  // Phone capture step
  const [step, setStep] = useState<Step>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Demo state
  const [activeBusinessIndex, setActiveBusinessIndex] = useState(0);
  const [pointsMap, setPointsMap] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    businesses.forEach(b => { initial[b.id] = b.initialPoints; });
    return initial;
  });
  const [showReward, setShowReward] = useState(false);
  const [demoStep, setDemoStep] = useState<'card' | 'success' | 'reward'>('card');
  const [quantity, setQuantity] = useState(1);
  const [lastPoints, setLastPoints] = useState(0);
  const [canUndo, setCanUndo] = useState(false);
  const [undoTimer, setUndoTimer] = useState(0);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);

  const business = businesses[activeBusinessIndex];
  const points = pointsMap[business.id];
  const Icon = business.icon;
  const primaryColor = business.colors.primary;
  const secondaryColor = business.colors.secondary;
  const progressPercent = (points / business.maxPoints) * 100;

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!validateFrenchPhone(formattedPhone)) {
      setError('Veuillez entrer un numéro de téléphone valide');
      return;
    }

    setSubmitting(true);

    try {
      // Save the lead (fire and forget - don't block demo)
      fetch('/api/demo-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: formattedPhone }),
      });

      // Move to demo
      setStep('demo');
    } catch {
      // Proceed anyway
      setStep('demo');
    } finally {
      setSubmitting(false);
    }
  };

  const triggerConfetti = useCallback(() => {
    const colors = [primaryColor, secondaryColor];
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors,
    });
  }, [primaryColor, secondaryColor]);

  const handleCheckin = () => {
    const pointsToAdd = business.loyaltyMode === 'article' ? quantity : 1;
    const newPoints = Math.min(points + pointsToAdd, business.maxPoints);

    setPointsMap(prev => ({ ...prev, [business.id]: newPoints }));
    setLastPoints(pointsToAdd);
    setCanUndo(true);
    setUndoTimer(30);

    // Start undo timer
    const interval = setInterval(() => {
      setUndoTimer(prev => {
        if (prev <= 1) {
          setCanUndo(false);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    if (newPoints >= business.maxPoints) {
      triggerConfetti();
      setDemoStep('reward');
    } else {
      setDemoStep('success');
    }

    setQuantity(1);
  };

  const handleUndo = () => {
    const newPoints = Math.max(0, points - lastPoints);
    setPointsMap(prev => ({ ...prev, [business.id]: newPoints }));
    setCanUndo(false);
    setUndoTimer(0);
    setDemoStep('card');
  };

  const handleClaimReward = () => {
    setPointsMap(prev => ({ ...prev, [business.id]: 0 }));
    setShowReward(true);
    setDemoStep('card');
  };

  const handleBusinessChange = (index: number) => {
    setActiveBusinessIndex(index);
    setDemoStep('card');
    setCanUndo(false);
    setQuantity(1);
  };

  // Phone capture step - looks like real scan page
  if (step === 'phone') {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-white to-violet-50">
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            {/* Demo Badge */}
            <div className="text-center mb-4">
              <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold rounded-full uppercase tracking-wider">
                Démo Interactive
              </span>
            </div>

            {/* Welcome Banner */}
            <div className="relative mb-6 overflow-hidden rounded-3xl shadow-xl border border-gray-100">
              <div
                className="relative h-40 flex items-center justify-center overflow-hidden"
                style={{ background: `linear-gradient(135deg, #6366f130, #8b5cf640)` }}
              >
                <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full opacity-30 bg-indigo-500" />
                <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full opacity-25 bg-violet-500" />

                <div className="relative">
                  <div className="absolute -inset-3 rounded-2xl blur-xl opacity-40 bg-indigo-600" />
                  <div
                    className="relative w-28 h-28 rounded-2xl flex items-center justify-center shadow-2xl border-3 border-white/90 bg-gradient-to-br from-indigo-600 to-violet-600"
                  >
                    <span className="text-5xl font-black text-white italic">Q</span>
                  </div>
                </div>
              </div>

              <div className="relative bg-white pt-5 pb-4 px-6 text-center overflow-hidden">
                <Gift className="absolute -right-4 -bottom-4 w-24 h-24 opacity-[0.03] text-indigo-600" />

                <div className="relative z-10">
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1.5">
                    Testez <span className="text-indigo-600">Qarte</span>
                  </h2>

                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <p className="text-lg font-extrabold text-gray-900 tracking-tight">
                      L&apos;expérience de vos clients
                    </p>
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                  </div>

                  <p className="text-sm text-gray-500">
                    Découvrez comment vos clients interagissent avec leur carte de fidélité
                  </p>
                </div>
              </div>
            </div>

            {/* Phone Form */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5 overflow-hidden">
              <form onSubmit={handlePhoneSubmit} className="space-y-3">
                {error && (
                  <div className="p-3 text-sm font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl">
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 ml-1">Votre numéro de téléphone</label>
                  <div className="relative group">
                    <Input
                      type="tel"
                      placeholder="06 12 34 56 78"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                      autoFocus
                      className="h-12 text-base pl-11 bg-gray-50/50 border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 rounded-xl transition-all"
                    />
                    <Phone className="absolute w-4 h-4 text-gray-400 left-4 top-1/2 transform -translate-y-1/2 group-focus-within:text-indigo-600 transition-colors" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 text-base font-bold rounded-xl text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Tester la démo
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </div>

            <p className="text-center text-gray-400 text-xs mt-4">
              Simulez l&apos;expérience client sans engagement
            </p>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-3 text-center">
          <Link href="/" className="inline-flex items-center gap-1 group transition-all duration-300 hover:opacity-70">
            <div className="w-4 h-4 bg-gradient-to-br from-indigo-600 to-violet-600 rounded flex items-center justify-center">
              <span className="text-white text-[6px] font-black italic">Q</span>
            </div>
            <span className="text-xs font-bold tracking-tight text-gray-400">
              Propulsé par QARTE
            </span>
          </Link>
        </footer>
      </div>
    );
  }

  // Demo interactive step
  return (
    <div className="min-h-screen flex flex-col transition-colors duration-500" style={{ background: `linear-gradient(135deg, white, ${primaryColor}12)` }}>
      {/* Business Type Selector */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm py-2 px-3">
        <div className="max-w-md mx-auto flex items-center justify-center gap-1.5">
          {businesses.map((b, index) => {
            const TabIcon = b.icon;
            const isActive = index === activeBusinessIndex;
            return (
              <button
                key={b.id}
                onClick={() => handleBusinessChange(index)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium text-xs transition-all duration-200 active:scale-95 ${
                  isActive
                    ? 'text-white shadow-md'
                    : 'text-gray-600 bg-gray-50 hover:bg-gray-100'
                }`}
                style={isActive ? { backgroundColor: b.colors.primary } : {}}
              >
                <TabIcon className="w-3.5 h-3.5" />
                <span>{b.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 px-4 pt-4 pb-4 mx-auto max-w-md w-full">
        {/* Demo Badge */}
        <div className="text-center mb-2">
          <span
            className="inline-block px-3 py-1 text-white text-[10px] font-bold rounded-full uppercase tracking-wider"
            style={{ backgroundColor: primaryColor }}
          >
            Démo {business.label}
          </span>
        </div>

        {/* Push Notification Preview */}
        <div className="mb-3 px-1">
          <div
            className="relative overflow-hidden rounded-2xl border shadow-lg p-3"
            style={{
              backgroundColor: 'white',
              borderColor: `${primaryColor}20`
            }}
          >
            {/* Notification header */}
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: primaryColor }}
              >
                <Bell className="w-3 h-3 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-800">{business.name}</span>
                  <span className="text-[10px] text-gray-400">maintenant</span>
                </div>
              </div>
            </div>
            {/* Notification content */}
            <p className="text-sm text-gray-700 leading-snug">
              🎉 Plus que <span className="font-bold" style={{ color: primaryColor }}>{business.maxPoints - points} point{business.maxPoints - points > 1 ? 's' : ''}</span> avant votre récompense !
            </p>
            {/* Subtle indicator that notifications are enabled */}
            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-100">
              <Check className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] text-emerald-600 font-medium">Notifications activées</span>
            </div>
          </div>
        </div>

        {demoStep === 'card' && (
          <div className="animate-fade-in">
            {/* Welcome Banner */}
            <div className="relative mb-4 overflow-hidden rounded-3xl shadow-xl border border-gray-100">
              <div
                className="relative h-40 flex items-center justify-center overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${primaryColor}30, ${secondaryColor}40)` }}
              >
                <div
                  className="absolute -top-12 -right-12 w-36 h-36 rounded-full opacity-30"
                  style={{ background: `radial-gradient(circle, ${primaryColor}, transparent)` }}
                />
                <div
                  className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full opacity-25"
                  style={{ background: `radial-gradient(circle, ${secondaryColor}, transparent)` }}
                />

                <div className="relative">
                  <div
                    className="absolute -inset-3 rounded-full blur-xl opacity-40"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <div
                    className="relative w-28 h-28 rounded-full flex items-center justify-center shadow-2xl border-3 border-white/90"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                  >
                    <Icon className="w-14 h-14 text-white" />
                  </div>
                </div>
              </div>

              <div className="relative bg-white pt-5 pb-4 px-6 text-center overflow-hidden">
                <Gift className="absolute -right-4 -bottom-4 w-24 h-24 opacity-[0.03]" style={{ color: primaryColor }} />

                <div className="relative z-10">
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1.5">
                    Bienvenue chez <span style={{ color: primaryColor }}>{business.name}</span>
                  </h2>

                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4" style={{ color: primaryColor }} />
                    <p className="text-lg font-extrabold text-gray-900 tracking-tight">
                      Nous récompensons votre fidélité
                    </p>
                    <Sparkles className="w-4 h-4" style={{ color: primaryColor }} />
                  </div>

                  <div
                    className="inline-flex items-center gap-2.5 px-3 py-2 rounded-full border shadow-sm"
                    style={{ backgroundColor: `${primaryColor}05`, borderColor: `${primaryColor}15` }}
                  >
                    <Gift className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                    <span className="text-[13px] font-bold text-gray-800">{business.reward}</span>
                    <div className="flex items-center gap-1.5 pl-2 border-l border-gray-200">
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded text-white shadow-sm" style={{ backgroundColor: primaryColor }}>
                        {business.maxPoints}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-tighter text-gray-400">
                        {business.loyaltyMode === 'visit' ? 'Visites' : business.productName}
                      </span>
                    </div>
                  </div>

                  {/* Social proof */}
                  <div className="flex items-center justify-center gap-1.5 mt-3 text-gray-400">
                    <Users className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">
                      {business.loyalCustomers} clients fidèles
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* How it works Accordion */}
            <div className="mb-4">
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setIsHowItWorksOpen(!isHowItWorksOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50/50 transition-colors focus:outline-none group"
                >
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    <span className="font-medium text-gray-600 text-sm">Comment ça marche ?</span>
                  </div>
                  <motion.div animate={{ rotate: isHowItWorksOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isHowItWorksOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <div className="px-5 pb-5 pt-1 space-y-4 relative">
                        <div className="absolute left-[35px] top-5 bottom-8 w-px bg-gray-100" />
                        {[
                          { icon: <QrCode className="w-4 h-4" />, title: "Scannez le QR code", description: "Présentez ce code à chaque visite." },
                          { icon: <Star className="w-4 h-4" />, title: "Cumulez vos points", description: "Chaque passage vous rapproche de la récompense." },
                          { icon: <Gift className="w-4 h-4" />, title: "Recevez votre cadeau", description: `Après ${business.maxPoints} points : ${business.reward}` }
                        ].map((s, idx) => (
                          <motion.div key={idx} initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: idx * 0.1 }} className="flex items-start gap-3 relative z-10">
                            <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: primaryColor }}>
                              {s.icon}
                            </div>
                            <div className="flex-1 pt-0.5">
                              <h4 className="font-bold text-gray-900 text-sm mb-0.5">{s.title}</h4>
                              <p className="text-gray-500 text-xs">{s.description}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* History Accordion */}
            <div className="mb-4">
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50/50 transition-colors focus:outline-none group"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    <span className="font-medium text-gray-600 text-sm">Historique récent</span>
                  </div>
                  <motion.div animate={{ rotate: isHistoryOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isHistoryOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <div className="px-5 pb-4 pt-1">
                        {[
                          { date: "Aujourd'hui 14h30", label: business.loyaltyMode === 'visit' ? '+1 point' : '+2 achats' },
                          { date: "Hier 11h00", label: business.loyaltyMode === 'visit' ? '+1 point' : '+1 achat' },
                          { date: "15 Jan 10h15", label: business.loyaltyMode === 'visit' ? '+1 point' : '+3 achats' },
                        ].map((visit, idx) => (
                          <div key={idx} className="relative flex items-start gap-3 group">
                            <div className="flex flex-col items-center flex-shrink-0">
                              <div
                                className="w-2 h-2 rounded-full mt-1.5 z-10"
                                style={{ backgroundColor: idx === 0 ? primaryColor : '#d1d5db' }}
                              />
                              {idx !== 2 && (
                                <div className="w-px h-8 bg-gray-200" />
                              )}
                            </div>
                            <div className="flex flex-1 items-center justify-between pb-3">
                              <div className="flex flex-col">
                                <span className="text-xs text-gray-500 font-medium">{visit.date}</span>
                                <span className="text-[11px] font-semibold mt-0.5" style={{ color: primaryColor }}>
                                  {visit.label}
                                </span>
                              </div>
                              <div className="bg-gray-50 p-1 rounded-full border border-gray-100">
                                <Check className="w-2.5 h-2.5 text-gray-400" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Current Points Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5 overflow-hidden">
              <div className="text-center mb-4">
                <p className="text-gray-500 text-sm uppercase tracking-wider font-medium mb-2">Vos points</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold text-gray-900">{points}</span>
                  <span className="text-xl text-gray-400">/{business.maxPoints}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%`, background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})` }}
                />
              </div>

              {/* Status */}
              <div
                className="text-center p-3 rounded-xl mb-4"
                style={{ backgroundColor: `${primaryColor}08` }}
              >
                <p style={{ color: primaryColor }} className="font-medium">
                  Plus que <span className="font-bold">{business.maxPoints - points}</span> point{business.maxPoints - points > 1 ? 's' : ''} !
                </p>
              </div>

              {/* Quantity Selector for Article Mode */}
              {business.loyaltyMode === 'article' && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-600 mb-3 text-center">Nombre de {business.productName}</p>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      <Minus className="w-5 h-5 text-gray-600" />
                    </button>
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-black text-white shadow-lg"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {quantity}
                    </div>
                    <button
                      onClick={() => setQuantity(Math.min(5, quantity + 1))}
                      disabled={quantity >= 5}
                      className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      <Plus className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              )}

              {/* Checkin Button */}
              <button
                onClick={handleCheckin}
                disabled={points >= business.maxPoints}
                className="w-full h-12 text-base font-bold rounded-xl text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
              >
                <Star className="w-5 h-5" />
                {business.loyaltyMode === 'article'
                  ? `Ajouter ${quantity} ${business.productName}`
                  : 'Valider mon passage'
                }
              </button>
            </div>

            {/* Reward Preview */}
            <div className="mt-4 bg-white rounded-2xl shadow-lg border border-gray-100 p-4 flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <Gift className="w-6 h-6" style={{ color: primaryColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                  À {business.maxPoints} points
                </p>
                <p className="text-base font-bold text-gray-900 truncate">{business.reward}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </div>

            {/* Google Review Card - Merchant specific */}
            <div className="mt-4 bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
              {/* Header with rating */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span className="text-sm font-semibold text-gray-800">Avis Google</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-gray-900">4.8</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={12}
                        className={star <= 4 ? 'fill-[#FBBC05] text-[#FBBC05]' : 'fill-[#FBBC05]/50 text-[#FBBC05]/50'}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">(47)</span>
                </div>
              </div>

              {/* Fictitious review */}
              <div className="bg-gray-50 rounded-xl p-3 mb-3">
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs flex-shrink-0">
                    M
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-800">Marie L.</span>
                      <span className="text-[10px] text-gray-400">il y a 2 jours</span>
                    </div>
                    <div className="flex mb-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} size={10} className="fill-[#FBBC05] text-[#FBBC05]" />
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      &quot;Super expérience, je recommande ! L&apos;équipe est au top.&quot;
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={() => window.open('https://google.com/maps', '_blank')}
                className="w-full h-10 rounded-xl text-[13px] font-semibold text-white transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md active:scale-[0.98]"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
              >
                Laisser mon avis sur {business.name}
              </button>
            </div>
          </div>
        )}

        {demoStep === 'success' && (
          <div className="animate-fade-in">
            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-8 overflow-hidden text-center">
              <div
                className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-3xl"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <Check className="w-10 h-10" style={{ color: primaryColor }} />
              </div>

              <h2 className="text-2xl font-black text-gray-900 mb-1">
                {business.loyaltyMode === 'article'
                  ? `+${lastPoints} ${business.productName} !`
                  : 'Passage validé !'
                }
              </h2>
              <p className="text-gray-500 mb-8">Merci pour votre visite !</p>

              <div className="mb-8">
                <div className="flex items-baseline justify-center gap-1">
                  <motion.span
                    key={points}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="text-6xl font-black"
                    style={{ color: primaryColor }}
                  >
                    {points}
                  </motion.span>
                  <span className="text-2xl font-bold text-gray-300">/{business.maxPoints}</span>
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
                  {business.loyaltyMode === 'visit' ? 'Passages cumulés' : `${business.productName} cumulés`}
                </p>
              </div>

              <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden mb-6">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})` }}
                />
              </div>

              <AnimatePresence>
                {canUndo && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    onClick={handleUndo}
                    className="w-full flex items-center justify-center gap-3 py-4 mb-4 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700 font-medium"
                  >
                    <Undo2 className="w-5 h-5" />
                    Annuler ({undoTimer}s)
                  </motion.button>
                )}
              </AnimatePresence>

              <button
                onClick={() => setDemoStep('card')}
                className="w-full h-14 rounded-2xl font-bold border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                Retour à ma carte
              </button>
            </div>
          </div>
        )}

        {demoStep === 'reward' && (
          <div className="animate-fade-in">
            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-8 overflow-hidden text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-3xl bg-emerald-100">
                <Gift className="w-10 h-10 text-emerald-600" />
              </div>

              <h2 className="text-2xl font-black text-gray-900 mb-2">🎉 Félicitations !</h2>
              <p className="text-gray-500 mb-6">
                Vous avez atteint {business.maxPoints} points !
              </p>

              <div
                className="rounded-3xl p-6 mb-8 border"
                style={{ backgroundColor: `${primaryColor}08`, borderColor: `${primaryColor}20` }}
              >
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Votre récompense</p>
                <p className="text-xl font-black" style={{ color: primaryColor }}>
                  {business.reward}
                </p>
              </div>

              <button
                onClick={handleClaimReward}
                className="w-full h-16 rounded-2xl text-lg font-bold text-white shadow-lg shadow-emerald-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500"
              >
                <Gift className="w-6 h-6" />
                Utiliser ma récompense
              </button>

              <p className="mt-4 text-sm text-gray-400">Montrez cet écran au commerçant</p>
            </div>
          </div>
        )}

        <p className="text-center text-gray-500 text-xs mt-4 mb-20">
          Démo interactive — Changez de secteur ci-dessus
        </p>
      </main>

      {/* Bottom CTA */}
      <div className="sticky bottom-0 left-0 right-0 z-40 w-full border-t border-gray-100 bg-white/90 py-3 backdrop-blur-xl">
        <div className="mx-auto max-w-md px-4">
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/"
              className="flex items-center justify-center w-11 h-11 rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition-all hover:bg-gray-50 active:scale-95"
            >
              <Home className="w-5 h-5" />
            </Link>
            <Link
              href="/onboarding"
              className="group flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl active:scale-[0.98]"
            >
              Lancer mon programme fidélité
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Reward Modal */}
      {showReward && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-[bounceIn_0.5s_ease-out]">
            <div
              className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 shadow-lg"
              style={{ backgroundColor: primaryColor }}
            >
              <Gift className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Bravo !</h2>
            <p className="text-gray-600 mb-6">
              Vous avez utilisé votre récompense :<br />
              <span className="font-bold" style={{ color: primaryColor }}>{business.reward}</span>
            </p>
            <button
              onClick={() => setShowReward(false)}
              className="w-full py-3 text-white font-semibold rounded-xl transition-all"
              style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
            >
              Continuer
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
