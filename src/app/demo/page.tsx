'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Star, Gift, ChevronRight, Sparkles, Check, Scissors, Coffee, ShoppingBag, Home, ArrowRight } from 'lucide-react';

// Business configurations
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
    colors: {
      primary: 'from-slate-800 to-slate-950',
      accent: 'bg-slate-900',
      accentHover: 'hover:bg-slate-800',
      badge: 'bg-slate-700',
      light: 'from-slate-100 to-slate-200',
      text: 'text-slate-900',
      button: 'from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800',
      shadow: 'shadow-slate-500/25',
      rewardBg: 'from-slate-50 to-gray-100',
      rewardBorder: 'border-slate-200',
      progress: 'bg-slate-800',
      tabActive: 'bg-slate-900 text-white',
      tabInactive: 'text-slate-600 hover:bg-slate-100',
    }
  },
  {
    id: 'onglerie',
    label: 'Onglerie',
    icon: Sparkles,
    name: "L'Instant Poudré",
    tagline: 'Carte privilège',
    reward: 'Remplissage offert',
    maxPoints: 8,
    initialPoints: 4,
    colors: {
      primary: 'from-pink-400 to-rose-400',
      accent: 'bg-rose-400',
      accentHover: 'hover:bg-rose-500',
      badge: 'bg-rose-300',
      light: 'from-pink-50 to-rose-100',
      text: 'text-rose-600',
      button: 'from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600',
      shadow: 'shadow-rose-500/25',
      rewardBg: 'from-pink-50 to-rose-50',
      rewardBorder: 'border-rose-200',
      progress: 'bg-gradient-to-r from-pink-400 to-rose-400',
      tabActive: 'bg-rose-500 text-white',
      tabInactive: 'text-rose-600 hover:bg-rose-50',
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
    colors: {
      primary: 'from-orange-500 to-amber-500',
      accent: 'bg-orange-500',
      accentHover: 'hover:bg-orange-600',
      badge: 'bg-amber-400',
      light: 'from-orange-50 to-amber-100',
      text: 'text-orange-600',
      button: 'from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600',
      shadow: 'shadow-orange-500/25',
      rewardBg: 'from-orange-50 to-amber-50',
      rewardBorder: 'border-orange-200',
      progress: 'bg-gradient-to-r from-orange-500 to-amber-500',
      tabActive: 'bg-orange-500 text-white',
      tabInactive: 'text-orange-600 hover:bg-orange-50',
    }
  },
  {
    id: 'commerce',
    label: 'Commerce',
    icon: ShoppingBag,
    name: 'Green House',
    tagline: 'Carte avantages',
    reward: '-20% sur tout',
    maxPoints: 200,
    initialPoints: 150,
    colors: {
      primary: 'from-emerald-500 to-teal-500',
      accent: 'bg-emerald-500',
      accentHover: 'hover:bg-emerald-600',
      badge: 'bg-teal-400',
      light: 'from-emerald-50 to-teal-100',
      text: 'text-emerald-600',
      button: 'from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600',
      shadow: 'shadow-emerald-500/25',
      rewardBg: 'from-emerald-50 to-teal-50',
      rewardBorder: 'border-emerald-200',
      progress: 'bg-gradient-to-r from-emerald-500 to-teal-500',
      tabActive: 'bg-emerald-500 text-white',
      tabInactive: 'text-emerald-600 hover:bg-emerald-50',
    }
  }
];

export default function DemoPage() {
  const [activeBusinessIndex, setActiveBusinessIndex] = useState(0);
  const [pointsMap, setPointsMap] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    businesses.forEach(b => { initial[b.id] = b.initialPoints; });
    return initial;
  });
  const [showReward, setShowReward] = useState(false);

  const business = businesses[activeBusinessIndex];
  const points = pointsMap[business.id];
  const Icon = business.icon;

  const addPoint = () => {
    const pointIncrement = business.id === 'commerce' ? 10 : 1;
    if (points < business.maxPoints) {
      const newPoints = Math.min(points + pointIncrement, business.maxPoints);
      setPointsMap(prev => ({ ...prev, [business.id]: newPoints }));

      if (newPoints === business.maxPoints) {
        setTimeout(() => setShowReward(true), 500);
      }
    }
  };

  const claimReward = () => {
    setShowReward(false);
    setPointsMap(prev => ({ ...prev, [business.id]: 0 }));
  };

  const pointsRemaining = business.maxPoints - points;
  const progressPercent = (points / business.maxPoints) * 100;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${business.colors.light} flex flex-col transition-colors duration-500`}>
      {/* Business Type Selector */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm py-2 px-3">
        <div className="max-w-md mx-auto flex items-center justify-center gap-1.5">
          {businesses.map((b, index) => {
            const TabIcon = b.icon;
            const isActive = index === activeBusinessIndex;
            return (
              <button
                key={b.id}
                onClick={() => setActiveBusinessIndex(index)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium text-xs transition-all duration-200 active:scale-95 ${
                  isActive
                    ? `${b.colors.tabActive} shadow-md`
                    : `${b.colors.tabInactive} bg-gray-50 hover:bg-gray-100`
                }`}
              >
                <TabIcon className="w-3.5 h-3.5" />
                <span>{b.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 py-4">
        <div className="w-full max-w-md">
          {/* Demo Badge */}
          <div className="text-center mb-2">
            <span className={`inline-block px-3 py-1 ${business.colors.accent} text-white text-[10px] font-bold rounded-full uppercase tracking-wider`}>
              Démo {business.label}
            </span>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 transition-all duration-500">
            {/* Header */}
            <div className={`bg-gradient-to-r ${business.colors.primary} p-6 text-white relative overflow-hidden`}>
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ii8+PC9nPjwvc3ZnPg==')] opacity-30" />

              <div className="relative flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                  <Icon className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{business.name}</h1>
                  <p className="text-white/80 text-sm">{business.tagline}</p>
                </div>
              </div>
            </div>

            {/* Points Display */}
            <div className="p-6">
              <div className="text-center mb-6">
                <p className="text-gray-500 text-sm uppercase tracking-wider font-medium mb-2">Vos points</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className={`text-6xl font-bold text-gray-900 transition-all duration-300`}>
                    {points}
                  </span>
                  <span className="text-2xl text-gray-400">/{business.maxPoints}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden mb-6">
                <div
                  className={`absolute inset-y-0 left-0 ${business.colors.progress} rounded-full transition-all duration-500 ease-out`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Status Message */}
              <div className={`text-center p-4 rounded-2xl mb-6 transition-all duration-300 ${
                points === business.maxPoints
                  ? 'bg-emerald-50 border border-emerald-200'
                  : `bg-gradient-to-r ${business.colors.rewardBg} border ${business.colors.rewardBorder}`
              }`}>
                {points === business.maxPoints ? (
                  <div className="flex items-center justify-center gap-2 text-emerald-600">
                    <Sparkles className="w-5 h-5" />
                    <span className="font-semibold">Félicitations ! Récompense débloquée !</span>
                  </div>
                ) : (
                  <p className={business.colors.text}>
                    Plus que <span className="font-bold">{pointsRemaining}</span> point{pointsRemaining > 1 ? 's' : ''} pour votre récompense !
                  </p>
                )}
              </div>

              {/* Reward Preview */}
              <div className={`bg-gradient-to-br ${business.colors.rewardBg} border ${business.colors.rewardBorder} rounded-2xl p-5 mb-6`}>
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 ${business.colors.accent} rounded-xl flex items-center justify-center shadow-lg`}>
                    <Gift className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs ${business.colors.text} font-semibold uppercase tracking-wider`}>Récompense</p>
                    <p className="text-lg font-bold text-gray-900">{business.reward}</p>
                    <p className="text-sm text-gray-500">À {business.maxPoints} points</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>

              {/* Demo Action Button */}
              <button
                onClick={addPoint}
                disabled={points >= business.maxPoints}
                className={`w-full py-4 rounded-xl font-semibold text-white transition-all duration-300 ${
                  points >= business.maxPoints
                    ? 'bg-gray-300 cursor-not-allowed'
                    : `bg-gradient-to-r ${business.colors.button} shadow-lg ${business.colors.shadow} active:scale-[0.98]`
                }`}
              >
                {points >= business.maxPoints ? (
                  <span className="flex items-center justify-center gap-2">
                    <Check className="w-5 h-5" />
                    Carte complète !
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Star className="w-5 h-5" />
                    Simuler un achat (+{business.id === 'commerce' ? '10 points' : '1 point'})
                  </span>
                )}
              </button>

              {/* Claim Reward Button */}
              {points >= business.maxPoints && (
                <button
                  onClick={claimReward}
                  className="w-full mt-3 py-4 rounded-xl font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.98]"
                >
                  <span className="flex items-center justify-center gap-2">
                    <Gift className="w-5 h-5" />
                    Utiliser ma récompense
                  </span>
                </button>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 border-t border-gray-100 p-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-violet-500 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">Q</span>
                  </div>
                  <span>Propulsé par Qarte</span>
                </div>
                <a
                  href="/"
                  className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                >
                  En savoir plus
                </a>
              </div>
            </div>
          </div>

          {/* Info Text */}
          <p className="text-center text-gray-500 text-xs mt-4 mb-20">
            Démonstration interactive — Changez de commerce ci-dessus
          </p>
        </div>
      </div>

      {/* Bottom CTA Section */}
      <div className="sticky bottom-0 left-0 right-0 z-40 w-full border-t border-gray-100 bg-white/90 py-3 backdrop-blur-xl">
        <div className="mx-auto max-w-md px-4">
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/"
              className="flex items-center justify-center w-11 h-11 rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition-all hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 active:scale-95"
              title="Retour à l'accueil"
            >
              <Home className="w-5 h-5" />
            </Link>
            <Link
              href="/onboarding"
              className="group flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:shadow-indigo-500/30 active:scale-[0.98]"
            >
              Essayer Qarte gratuitement
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Reward Modal */}
      {showReward && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-[bounceIn_0.5s_ease-out]">
            <div className={`w-20 h-20 mx-auto ${business.colors.accent} rounded-full flex items-center justify-center mb-6 shadow-lg`}>
              <Gift className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Bravo !</h2>
            <p className="text-gray-600 mb-6">
              Vous avez débloqué votre récompense : <br />
              <span className={`font-bold ${business.colors.text}`}>{business.reward}</span>
            </p>
            <button
              onClick={() => setShowReward(false)}
              className={`w-full py-3 bg-gradient-to-r ${business.colors.button} text-white font-semibold rounded-xl transition-all`}
            >
              Continuer
            </button>
          </div>
        </div>
      )}

      {/* Custom Animations */}
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
