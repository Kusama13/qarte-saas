'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Check,
  Gift,
  Calendar,
  Clock,
  Loader2,
  AlertCircle,
  Star,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  Footprints,
  Coffee,
  Pizza,
  ShoppingBag,
} from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import { formatDateTime, formatPhoneNumber } from '@/lib/utils';
import type { Merchant, LoyaltyCard, Customer, Visit } from '@/types';

interface CardWithDetails extends LoyaltyCard {
  merchant: Merchant;
  customer: Customer;
}

const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const rawValue = parts.pop()?.split(';').shift() || null;
    // Decode URL-encoded value
    return rawValue ? decodeURIComponent(rawValue) : null;
  }
  return null;
};

// Get icon based on loyalty mode and product name
const getLoyaltyIcon = (loyaltyMode: string, productName: string | null) => {
  if (loyaltyMode === 'visit') {
    return Footprints; // Walking person for visits
  }

  // For article mode, try to match product name
  const name = (productName || '').toLowerCase();
  if (name.includes('café') || name.includes('cafe') || name.includes('coffee')) {
    return Coffee;
  }
  if (name.includes('pizza') || name.includes('burger') || name.includes('sandwich')) {
    return Pizza;
  }
  return ShoppingBag; // Default for articles
};

const getLoyaltyLabel = (loyaltyMode: string, productName: string | null, count: number) => {
  if (loyaltyMode === 'visit') {
    return count === 1 ? 'Passage' : 'Passages';
  }
  return productName || (count === 1 ? 'Article' : 'Articles');
};

export default function CustomerCardPage({
  params,
}: {
  params: Promise<{ merchantId: string }>;
}) {
  const { merchantId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState(false);
  const [card, setCard] = useState<CardWithDetails | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [visitsExpanded, setVisitsExpanded] = useState(false);
  const [reviewDismissed, setReviewDismissed] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const savedPhone = getCookie('customer_phone');
      if (!savedPhone) {
        router.push('/customer/cards');
        return;
      }

      const formattedPhone = formatPhoneNumber(savedPhone);

      try {
        const response = await fetch(
          `/api/customers/card?phone=${encodeURIComponent(formattedPhone)}&merchant_id=${merchantId}`
        );
        const data = await response.json();

        if (!response.ok || !data.found) {
          router.push('/customer/cards');
          return;
        }

        setCard(data.card as CardWithDetails);
        setVisits(data.visits || []);
      } catch (error) {
        console.error('Error fetching card:', error);
        router.push('/customer/cards');
        return;
      }

      setLoading(false);
    };

    fetchData();
  }, [merchantId, router]);

  const triggerConfetti = () => {
    // Fire confetti from both sides
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    // Initial burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff'],
    });

    frame();
  };

  const handleRedeem = async () => {
    if (!card) return;

    const savedPhone = getCookie('customer_phone');
    if (!savedPhone) {
      console.error('No phone found in cookies');
      alert('Session expirée. Veuillez vous reconnecter.');
      return;
    }

    // Format phone number before sending
    const formattedPhone = formatPhoneNumber(savedPhone);
    console.log('Redeeming with phone:', formattedPhone);

    setRedeeming(true);

    try {
      const response = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loyalty_card_id: card.id,
          customer_phone: formattedPhone,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setCard({ ...card, current_stamps: 0 });
        setRedeemSuccess(true);
        triggerConfetti();
      } else {
        console.error('Redeem failed:', data.error);
        alert(data.error || 'Une erreur est survenue');
      }
    } catch (err) {
      console.error('Redeem error:', err);
      alert('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
        <AlertCircle className="w-16 h-16 mb-4 text-red-500" />
        <p className="text-gray-600">Carte introuvable</p>
        <Link href="/customer/cards" className="mt-4">
          <Button variant="outline">Retour</Button>
        </Link>
      </div>
    );
  }

  const { merchant } = card;
  const isRewardReady = card.current_stamps >= merchant.stamps_required;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(135deg, white, ${merchant.primary_color}10)` }}>
      {/* Header with premium glassmorphism design */}
      <header className="relative w-full overflow-hidden">
        <div className="relative mx-auto lg:max-w-lg lg:mt-6 lg:rounded-3xl overflow-hidden bg-slate-50/50">
          {/* Animated decorative background elements */}
          <div
            className="absolute -top-12 -left-12 w-48 h-48 rounded-full blur-3xl opacity-20 animate-pulse"
            style={{ background: merchant.primary_color }}
          />
          <div
            className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-20 animate-pulse"
            style={{ background: merchant.secondary_color || merchant.primary_color, animationDelay: '1s' }}
          />
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '20px 20px' }} />

          {/* Reduced height container */}
          <div className="relative h-44 sm:h-48 lg:h-52 w-full flex flex-col items-center justify-center">

            {/* Elegant Back button */}
            <div className="absolute top-4 left-4 z-20">
              <Link
                href="/customer/cards"
                className="group flex items-center justify-center w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm transition-all hover:shadow-md hover:scale-105 active:scale-95"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600 group-hover:text-slate-900" />
              </Link>
            </div>

            {/* Logo/Image Container with Glassmorphism */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1.5 bg-white/40 backdrop-blur-xl border border-white shadow-2xl flex items-center justify-center overflow-hidden mb-3 transition-transform hover:scale-105">
                {merchant.logo_url ? (
                  <img
                    src={merchant.logo_url}
                    alt={merchant.shop_name}
                    className="w-full h-full object-cover rounded-full ring-1 ring-black/5"
                  />
                ) : (
                  <div
                    className="w-full h-full rounded-full flex items-center justify-center text-white text-3xl font-black shadow-inner"
                    style={{ background: `linear-gradient(135deg, ${merchant.primary_color}, ${merchant.secondary_color || merchant.primary_color})` }}
                  >
                    {merchant.shop_name[0]}
                  </div>
                )}
                {/* Glossy overlay effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
              </div>

              {/* Shop Name & Progress Badge */}
              <div className="flex flex-col items-center text-center px-4 relative">
                {/* Subtle Ambient Glow Background */}
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-24 blur-[50px] opacity-[0.18] rounded-full pointer-events-none transition-all duration-700"
                  style={{ backgroundColor: merchant.primary_color }}
                />

                <div className="relative flex flex-col items-center gap-3">
                  {/* Shop Name Premium Container */}
                  <div className="px-8 py-3 bg-white/50 backdrop-blur-2xl border border-white/70 rounded-2xl shadow-lg ring-1 ring-black/[0.02]">
                    <h1 className="text-xl lg:text-2xl font-black tracking-tight text-slate-900 leading-none">
                      {merchant.shop_name}
                    </h1>
                  </div>

                  {/* Enhanced Progress Badge */}
                  <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-white shadow-sm ring-1 ring-black/[0.03]">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">
                      {card.current_stamps} / {merchant.stamps_required} points
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Centered gradient glow behind logo */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full blur-2xl opacity-40 pointer-events-none"
              style={{ background: `radial-gradient(circle, ${merchant.primary_color}60, transparent 70%)` }}
            />
          </div>
        </div>
      </header>

      
      <main className="flex-1 mt-4 px-4 pb-12 w-full max-w-lg mx-auto z-10">
        {/* Review Section - Above Card */}
        {merchant.review_link && !reviewDismissed && (
          <div className="relative group p-4 bg-gradient-to-br from-amber-50 via-white to-amber-50/30 border border-amber-100 rounded-3xl shadow-lg shadow-amber-900/5 mb-4 hover:shadow-xl hover:shadow-amber-900/10 transition-all duration-300">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setReviewDismissed(true);
              }}
              className="absolute -top-2 -right-2 p-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow-md hover:bg-amber-50 transition-colors z-20 border border-amber-100/50"
              aria-label="Fermer"
            >
              <X className="w-3.5 h-3.5 text-amber-500" />
            </button>
            <a
              href={merchant.review_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-amber-100 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-inner">
                <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">Votre avis compte !</p>
                <p className="text-sm text-gray-600">Laissez-nous un avis</p>
              </div>
              <div className="p-2 rounded-xl bg-white shadow-sm border border-amber-50 group-hover:bg-amber-500 group-hover:text-white transition-all">
                <ExternalLink className="w-4 h-4" />
              </div>
            </a>
          </div>
        )}

        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-8 overflow-hidden">
          <div className="text-center mb-8">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl font-black" style={{ color: merchant.primary_color }}>{card.current_stamps}</span>
              <span className="text-xl font-bold text-gray-300">/{merchant.stamps_required}</span>
            </div>
            <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-2 flex items-center justify-center gap-2">
              {(() => {
                const LoyaltyIcon = getLoyaltyIcon(merchant.loyalty_mode, merchant.product_name);
                return <LoyaltyIcon className="w-4 h-4" />;
              })()}
              {getLoyaltyLabel(merchant.loyalty_mode, merchant.product_name, card.current_stamps)} cumulés
            </p>
          </div>

          {/* Stamp Circles Container */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {Array.from({ length: merchant.stamps_required }).map((_, i) => {
              const isFilled = i < card.current_stamps;
              const LoyaltyIcon = getLoyaltyIcon(merchant.loyalty_mode, merchant.product_name);
              return (
                <div
                  key={i}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ease-out ${
                    isFilled ? 'scale-100 shadow-md' : 'scale-90 border-2 border-dashed'
                  }`}
                  style={{
                    backgroundColor: isFilled ? merchant.primary_color : 'transparent',
                    borderColor: isFilled ? 'transparent' : '#E5E7EB',
                    boxShadow: isFilled ? `0 4px 12px ${merchant.primary_color}40` : 'none'
                  }}
                >
                  <LoyaltyIcon
                    className="w-6 h-6 transition-transform duration-300"
                    style={{ color: isFilled ? '#fff' : '#D1D5DB' }}
                  />
                </div>
              );
            })}
          </div>

          {/* Integrated Status & Progress Card */}
          <div
            className={`relative rounded-2xl p-5 border mb-8 overflow-hidden transition-all duration-700 ${isRewardReady ? 'shadow-lg scale-[1.02]' : ''}`}
            style={{
              backgroundColor: isRewardReady ? `${merchant.primary_color}15` : `${merchant.primary_color}05`,
              borderColor: isRewardReady ? merchant.primary_color : `${merchant.primary_color}20`,
            }}
          >
            {/* Background Progress Fill */}
            {!isRewardReady && (
              <div
                className="absolute inset-y-0 left-0 transition-all duration-1000 ease-out rounded-l-2xl"
                style={{
                  width: `${(card.current_stamps / merchant.stamps_required) * 100}%`,
                  background: `linear-gradient(90deg, ${merchant.primary_color}, ${merchant.secondary_color || merchant.primary_color})`,
                  opacity: 0.2
                }}
              />
            )}

            {/* Content Overlay */}
            <div className="relative z-10 flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className={`font-bold transition-colors duration-500 ${isRewardReady ? 'text-gray-900' : 'text-gray-700'}`}>
                  {isRewardReady
                    ? "🎉 Félicitations ! Votre cadeau est prêt."
                    : `Plus que ${merchant.stamps_required - card.current_stamps} ${getLoyaltyLabel(merchant.loyalty_mode, merchant.product_name, merchant.stamps_required - card.current_stamps).toLowerCase()} pour la récompense !`
                  }
                </p>
              </div>
              <div
                className={`p-2.5 rounded-xl transition-all duration-500 ${isRewardReady ? 'scale-110 rotate-12 shadow-md' : 'opacity-40'}`}
                style={{
                  backgroundColor: isRewardReady ? merchant.primary_color : 'transparent',
                  color: isRewardReady ? '#fff' : merchant.primary_color
                }}
              >
                <Gift className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div
            className="group relative overflow-hidden rounded-[2rem] border border-white bg-white p-6 flex items-center gap-6 transition-all duration-500 hover:-translate-y-1"
            style={{
              boxShadow: `0 20px 40px -15px rgba(0,0,0,0.08), 0 0 20px 2px ${merchant.primary_color}10`
            }}
          >
            {/* Subtle Pulse Glow */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-700 pointer-events-none"
              style={{ backgroundColor: merchant.primary_color }}
            />

            {/* Animated Shine Effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/60 to-transparent -skew-x-12 pointer-events-none" />

            {/* Icon Area */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg relative overflow-hidden transform group-hover:scale-105 transition-transform duration-500"
              style={{
                background: `linear-gradient(135deg, ${merchant.primary_color}, ${merchant.secondary_color || merchant.primary_color}dd)`
              }}
            >
              <div className="absolute inset-0 bg-white/10" />
              <Gift className="w-8 h-8 text-white relative z-10 drop-shadow-md" />
            </div>

            <div className="flex-1 min-w-0 relative z-10">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">Votre récompense</p>
              <p className="text-lg sm:text-xl font-black text-gray-900 leading-tight tracking-tight line-clamp-2">
                {merchant.reward_description}
              </p>
            </div>

            <div
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 group-hover:bg-opacity-20"
              style={{ backgroundColor: `${merchant.primary_color}10` }}
            >
              <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" style={{ color: merchant.primary_color }} />
            </div>
          </div>

          {isRewardReady && !redeemSuccess && (
            <Button
              onClick={() => setShowRedeemModal(true)}
              className="w-full mt-8 h-16 rounded-2xl text-lg font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
              style={{
                background: `linear-gradient(135deg, ${merchant.primary_color}, ${merchant.secondary_color || merchant.primary_color})`
              }}
            >
              <Gift className="w-6 h-6 mr-3" />
              Profiter de ma récompense
            </Button>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100/50 overflow-hidden mb-12">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 text-lg flex items-center gap-3">
              <div className="p-2 bg-gray-50 rounded-xl">
                {(() => {
                  const LoyaltyIcon = getLoyaltyIcon(merchant.loyalty_mode, merchant.product_name);
                  return <LoyaltyIcon className="w-5 h-5 text-gray-500" />;
                })()}
              </div>
              Historique
            </h2>
            {visits.length > 0 && (
              <button
                onClick={() => setVisitsExpanded(!visitsExpanded)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-xl transition-all"
                style={{ color: merchant.primary_color, backgroundColor: `${merchant.primary_color}10` }}
              >
                {visitsExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Réduire
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Voir ({visits.length})
                  </>
                )}
              </button>
            )}
          </div>

          {visits.length > 0 ? (
            visitsExpanded ? (
              <ul className="divide-y divide-gray-50">
                {visits.map((visit) => {
                  const LoyaltyIcon = getLoyaltyIcon(merchant.loyalty_mode, merchant.product_name);
                  const pointsEarned = visit.points_earned || 1;
                  return (
                    <li key={visit.id} className="flex items-center gap-4 px-6 py-5 hover:bg-gray-50/40 transition-colors">
                      <div
                        className="flex items-center justify-center w-12 h-12 rounded-2xl shadow-sm"
                        style={{ backgroundColor: `${merchant.primary_color}10` }}
                      >
                        <LoyaltyIcon className="w-6 h-6" style={{ color: merchant.primary_color }} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {merchant.loyalty_mode === 'visit' ? 'Passage validé' : `${pointsEarned} ${merchant.product_name || 'article'}${pointsEarned > 1 ? 's' : ''}`}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDateTime(visit.visited_at)}
                        </p>
                      </div>
                      <div
                        className="px-3 py-1.5 rounded-xl text-sm font-bold"
                        style={{ backgroundColor: `${merchant.primary_color}10`, color: merchant.primary_color }}
                      >
                        +{pointsEarned} pt{pointsEarned > 1 ? 's' : ''}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="p-6 text-center text-gray-500">
                <p className="text-sm">{visits.length} {merchant.loyalty_mode === 'visit' ? 'passage' : 'enregistrement'}{visits.length > 1 ? 's' : ''} au total</p>
              </div>
            )
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                {(() => {
                  const LoyaltyIcon = getLoyaltyIcon(merchant.loyalty_mode, merchant.product_name);
                  return <LoyaltyIcon className="w-8 h-8 text-gray-300" />;
                })()}
              </div>
              <p className="text-gray-500 font-medium">Aucun historique</p>
            </div>
          )}
        </div>

        <footer className="py-8 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <span className="text-[11px] font-medium text-gray-400">Créé avec</span>
            <span className="text-sm">❤️</span>
            <span className="text-[11px] font-medium text-gray-400">en France</span>
          </div>
          <div className="inline-flex items-center gap-2 group cursor-default transition-all duration-300 hover:opacity-70">
            <div className="w-7 h-7 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200">
              <span className="text-white text-xs font-black italic">Q</span>
            </div>
            <span className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              QARTE
            </span>
          </div>
        </footer>
      </main>

      <Modal
        isOpen={showRedeemModal}
        onClose={() => !redeemSuccess && setShowRedeemModal(false)}
        title={redeemSuccess ? "Félicitations !" : "Utiliser ma récompense"}
      >
        {redeemSuccess ? (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 bg-green-100">
              <Check className="w-10 h-10 text-green-600" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Récompense utilisée !
            </h3>

            <p className="text-gray-600 mb-6">
              Votre compteur a été remis à zéro. Merci de votre fidélité !
            </p>

            <Button
              onClick={() => {
                setShowRedeemModal(false);
                setRedeemSuccess(false);
              }}
              className="w-full"
              size="lg"
              style={{ backgroundColor: merchant.primary_color }}
            >
              Retour à ma carte
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <div
              className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
              style={{ backgroundColor: `${merchant.primary_color}20` }}
            >
              <Gift className="w-10 h-10" style={{ color: merchant.primary_color }} />
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {merchant.reward_description}
            </h3>

            <p className="text-gray-600 mb-6">
              Montrez cet écran au commerçant pour valider votre récompense.
            </p>

            <Button
              onClick={handleRedeem}
              loading={redeeming}
              className="w-full"
              size="lg"
              style={{ backgroundColor: merchant.primary_color }}
            >
              Confirmer l&apos;utilisation
            </Button>

            <button
              onClick={() => setShowRedeemModal(false)}
              className="mt-4 text-gray-500 hover:text-gray-700"
            >
              Annuler
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
