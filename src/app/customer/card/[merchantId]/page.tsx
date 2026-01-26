'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Check,
  Gift,
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
  SlidersHorizontal,
  Hourglass,
  Shield,
  XCircle,
  Bell,
  Share,
  PlusSquare,
  Sparkles,
} from 'lucide-react';
import { isPushSupported, subscribeToPush, getPermissionStatus, isIOSDevice, isStandalonePWA, isIOSPushSupported, getIOSVersion } from '@/lib/push';
import { Button, Modal } from '@/components/ui';
import { formatDateTime, formatPhoneNumber } from '@/lib/utils';
import type { Merchant, LoyaltyCard, Customer, Visit, VisitStatus } from '@/types';

interface PointAdjustment {
  id: string;
  created_at: string;
  adjustment: number;
  reason: string | null;
}

interface VisitWithStatus extends Visit {
  status: VisitStatus;
  flagged_reason: string | null;
}

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
  const [visits, setVisits] = useState<VisitWithStatus[]>([]);
  const [adjustments, setAdjustments] = useState<PointAdjustment[]>([]);
  const [visitsExpanded, setVisitsExpanded] = useState(false);
  const [reviewDismissed, setReviewDismissed] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Push notifications state
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [pushSubscribing, setPushSubscribing] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [iOSVersion, setIOSVersion] = useState(0);
  const [showIOSVersionWarning, setShowIOSVersionWarning] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);
  const [showSafariArrow, setShowSafariArrow] = useState(false);

  // Offer state
  interface MerchantOffer {
    active: boolean;
    title: string;
    description: string;
    imageUrl: string | null;
    expiresAt: string | null;
  }
  const [offer, setOffer] = useState<MerchantOffer | null>(null);
  const [offerExpanded, setOfferExpanded] = useState(false);

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
        const visitsData = (data.visits || []) as VisitWithStatus[];
        setVisits(visitsData);
        setAdjustments(data.adjustments || []);
        // Count pending visits
        const pending = visitsData.filter((v: VisitWithStatus) => v.status === 'pending').length;
        setPendingCount(pending);

        // Fetch current offer
        try {
          const offerResponse = await fetch(`/api/offers?merchantId=${merchantId}`);
          const offerData = await offerResponse.json();
          if (offerResponse.ok && offerData.offer && offerData.offer.active) {
            setOffer(offerData.offer);
          }
        } catch (offerError) {
          console.error('Error fetching offer:', offerError);
        }
      } catch (error) {
        console.error('Error fetching card:', error);
        router.push('/customer/cards');
        return;
      }

      setLoading(false);
    };

    fetchData();

    // Check push support
    const standardPushSupported = isPushSupported();
    const iOS = isIOSDevice();
    const standalone = isStandalonePWA();
    const iosVersion = getIOSVersion();
    const iosPushSupported = isIOSPushSupported();

    setIsIOS(iOS);
    setIsStandalone(standalone);
    setIOSVersion(iosVersion);

    // Show Safari share arrow for iOS users not in PWA mode
    // Only show if they haven't dismissed it before
    const arrowDismissed = localStorage.getItem('qarte_safari_arrow_dismissed');
    if (iOS && !standalone && !arrowDismissed) {
      // Small delay to let the page load first
      setTimeout(() => setShowSafariArrow(true), 1500);
    }

    // On iOS in standalone mode, check if iOS version supports push
    if (iOS && standalone) {
      setPushSupported(iosPushSupported || standardPushSupported);
    } else {
      setPushSupported(standardPushSupported);
    }

    setPushPermission(getPermissionStatus());

    // Check if already subscribed (global key - works for all merchants)
    const checkPushSubscription = localStorage.getItem('qarte_push_subscribed');
    if (checkPushSubscription === 'true') {
      setPushSubscribed(true);
    }
  }, [merchantId, router]);

  // Format reward text based on type
  const formatRewardText = (reward: string, remaining: number, loyaltyMode: string, productName: string | null) => {
    const lowerReward = reward.toLowerCase();
    const unit = loyaltyMode === 'visit'
      ? (remaining === 1 ? 'passage' : 'passages')
      : (productName || (remaining === 1 ? 'article' : 'articles'));

    // Percentage discount: "-20%", "20% de réduction", etc.
    const percentMatch = reward.match(/(\d+)\s*%/);
    if (percentMatch) {
      return `Plus que ${remaining} ${unit} pour ${percentMatch[1]}% de réduction !`;
    }

    // Euro discount: "-5€", "5€ de réduction", etc.
    const euroMatch = reward.match(/(\d+)\s*€/);
    if (euroMatch) {
      return `Plus que ${remaining} ${unit} pour ${euroMatch[1]}€ de réduction !`;
    }

    // Free item: "gratuit", "offert"
    if (lowerReward.includes('gratuit') || lowerReward.includes('offert')) {
      return `Plus que ${remaining} ${unit} pour ${reward.toLowerCase()} !`;
    }

    // Coffee/drink specific
    if (lowerReward.includes('café') || lowerReward.includes('boisson') || lowerReward.includes('thé')) {
      return `Plus que ${remaining} ${unit} pour votre ${reward.toLowerCase()} !`;
    }

    // Default: show full reward
    return `Plus que ${remaining} ${unit} pour : ${reward}`;
  };

  const handlePushSubscribe = async () => {
    if (!card) return;

    // Clear previous error
    setPushError(null);

    // For iOS not in standalone mode, show instructions
    if (isIOS && !isStandalone) {
      setShowIOSInstructions(true);
      return;
    }

    // For iOS in standalone mode with old version, show warning
    if (isIOS && isStandalone && iOSVersion > 0 && iOSVersion < 16) {
      setShowIOSVersionWarning(true);
      return;
    }

    setPushSubscribing(true);
    try {
      // Only pass customerId - subscription is linked to customer, not merchant
      const result = await subscribeToPush(card.customer.id);
      if (result.success) {
        setPushSubscribed(true);
        setPushPermission('granted');
        localStorage.setItem('qarte_push_subscribed', 'true');
        // Show success toast
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 4000);
      } else {
        console.error('Push subscribe failed:', result.error);
        setPushError(result.error || 'Erreur inconnue');
        if (result.error === 'Permission refusée') {
          setPushPermission('denied');
        }
        // Show iOS version warning if push failed on iOS standalone
        if (isIOS && isStandalone && result.error === 'Push non supporté sur ce navigateur') {
          setShowIOSVersionWarning(true);
        }
      }
    } catch (error) {
      console.error('Push subscribe error:', error);
      setPushError(error instanceof Error ? error.message : 'Erreur inconnue');
      // Show iOS version warning on error
      if (isIOS && isStandalone) {
        setShowIOSVersionWarning(true);
      }
    } finally {
      setPushSubscribing(false);
    }
  };

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
        console.error('Redeem failed:', data);
        // Show debug info if available
        const debugInfo = data.debug ? `\nTéléphone envoyé: ${data.debug.searchedPhone}` : '';
        alert((data.error || 'Une erreur est survenue') + debugInfo);
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
                      {card.current_stamps} / {merchant.stamps_required} {merchant.loyalty_mode === 'visit' ? 'passages' : (merchant.product_name || 'articles')}
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
        {/* Pending Points Alert - Qarte Shield */}
        {pendingCount > 0 && (
          <div className="relative p-4 bg-gradient-to-br from-amber-50 via-white to-amber-50/30 border border-amber-200 rounded-3xl shadow-lg shadow-amber-900/5 mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0">
                <Hourglass className="w-6 h-6 text-amber-600 animate-pulse" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">
                  {pendingCount} {merchant.loyalty_mode === 'visit'
                    ? (pendingCount > 1 ? 'passages' : 'passage')
                    : (merchant.product_name || (pendingCount > 1 ? 'articles' : 'article'))
                  } en attente
                </p>
                <p className="text-sm text-gray-600">
                  En attente de validation par le commerçant
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-amber-100">
              <Shield className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                Protégé par Qarte Shield
              </span>
            </div>
          </div>
        )}

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
                    ? `🎉 Félicitations ! ${merchant.reward_description}`
                    : formatRewardText(merchant.reward_description || 'votre récompense', merchant.stamps_required - card.current_stamps, merchant.loyalty_mode, merchant.product_name)
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

          {/* Current Offer - Non-invasive, clickable */}
          {offer && offer.active && (
            <div className="mb-6">
              <button
                onClick={() => setOfferExpanded(!offerExpanded)}
                className="w-full group"
              >
                <div
                  className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 ${
                    offerExpanded
                      ? 'border-solid shadow-lg'
                      : 'hover:border-solid hover:shadow-md'
                  }`}
                  style={{
                    borderColor: offerExpanded ? merchant.primary_color : `${merchant.primary_color}40`,
                    backgroundColor: offerExpanded ? `${merchant.primary_color}08` : `${merchant.primary_color}03`
                  }}
                >
                  {/* Closed State Header - Always visible */}
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                        style={{ backgroundColor: `${merchant.primary_color}15` }}
                      >
                        <Gift className="w-5 h-5" style={{ color: merchant.primary_color }} />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-gray-900 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" style={{ color: merchant.primary_color }} />
                          Offre client fidèle
                        </p>
                        {!offerExpanded && (
                          <p className="text-sm text-gray-500">Appuyez pour voir les détails</p>
                        )}
                      </div>
                    </div>
                    <div
                      className={`p-2 rounded-lg transition-all ${offerExpanded ? 'rotate-180' : ''}`}
                      style={{ backgroundColor: `${merchant.primary_color}10` }}
                    >
                      <ChevronDown className="w-5 h-5" style={{ color: merchant.primary_color }} />
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {offerExpanded && (
                    <div className="px-4 pb-4 text-left">
                      <div className="pt-3 border-t border-gray-100">
                        <h3 className="font-bold text-gray-900 text-lg mb-2">{offer.title}</h3>
                        <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{offer.description}</p>

                        {offer.imageUrl && (
                          <div className="mt-4 rounded-xl overflow-hidden">
                            <img
                              src={offer.imageUrl}
                              alt={offer.title}
                              className="w-full h-40 object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}

                        {offer.expiresAt && (
                          <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                            <Clock className="w-4 h-4" />
                            <span>
                              Valable jusqu'à {(() => {
                                const expires = new Date(offer.expiresAt);
                                const today = new Date();
                                const tomorrow = new Date(today);
                                tomorrow.setDate(tomorrow.getDate() + 1);

                                if (expires.toDateString() === today.toDateString()) {
                                  return "ce soir";
                                } else if (expires.toDateString() === tomorrow.toDateString()) {
                                  return "demain soir";
                                } else {
                                  return expires.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
                                }
                              })()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </button>
            </div>
          )}

          {/* Subscribe to Updates Button */}
          {!pushSubscribed && pushPermission !== 'denied' && (
            <button
              onClick={handlePushSubscribe}
              disabled={pushSubscribing}
              className="group w-full relative overflow-hidden rounded-2xl border-2 border-dashed p-5 flex items-center gap-4 transition-all duration-300 hover:border-solid hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50"
              style={{
                borderColor: `${merchant.primary_color}40`,
                backgroundColor: `${merchant.primary_color}05`
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${merchant.primary_color}15` }}
              >
                {pushSubscribing ? (
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: merchant.primary_color }} />
                ) : (
                  <Bell className="w-6 h-6" style={{ color: merchant.primary_color }} />
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold text-gray-900">
                  {isIOS && !isStandalone
                    ? "🎁 Offres exclusives & surprises"
                    : "🎁 Ne ratez plus aucune offre !"
                  }
                </p>
                <p className="text-sm text-gray-500">
                  {isIOS && !isStandalone
                    ? "Promos flash, cadeaux surprise, alertes fidélité..."
                    : "Promos exclusives, récompenses proches, ventes flash"
                  }
                </p>
              </div>
              <ChevronRight
                className="w-5 h-5 transition-transform group-hover:translate-x-1"
                style={{ color: merchant.primary_color }}
              />
            </button>
          )}

          {/* Subscribed confirmation - Small bell icon */}
          {pushSubscribed && (
            <div className="flex justify-center">
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{ backgroundColor: `${merchant.primary_color}10` }}
              >
                <Bell className="w-3.5 h-3.5" style={{ color: merchant.primary_color }} />
                <span className="text-xs font-medium" style={{ color: merchant.primary_color }}>Notifications actives</span>
              </div>
            </div>
          )}

          {/* Push Error Display (for debugging) */}
          {pushError && (
            <div className="w-full rounded-2xl p-4 bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-red-800 text-sm">Erreur d&apos;activation</p>
                <p className="text-xs text-red-600 mt-1">{pushError}</p>
                {isIOS && (
                  <p className="text-xs text-red-500 mt-2">
                    iOS {iOSVersion || '?'} • {isStandalone ? 'Mode PWA' : 'Navigateur'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Success Toast */}
          {showSuccessToast && (
            <div className="fixed bottom-6 left-4 right-4 z-50 animate-slide-up">
              <div
                className="max-w-md mx-auto rounded-2xl p-4 shadow-2xl flex items-center gap-3"
                style={{ backgroundColor: merchant.primary_color }}
              >
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-white">C&apos;est fait ! 🎉</p>
                  <p className="text-sm text-white/80">Vous recevrez nos offres exclusives</p>
                </div>
              </div>
            </div>
          )}

          {/* iOS Instructions Modal */}
          {showIOSInstructions && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div
                className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-slide-up"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div
                  className="relative p-6 pb-4 text-center"
                  style={{ background: `linear-gradient(135deg, ${merchant.primary_color}15, ${merchant.primary_color}05)` }}
                >
                  <button
                    onClick={() => setShowIOSInstructions(false)}
                    className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: `${merchant.primary_color}20` }}
                  >
                    <Bell className="w-8 h-8" style={{ color: merchant.primary_color }} />
                  </div>
                  <h3 className="text-xl font-black text-gray-900">Activer les notifications</h3>
                  <p className="text-sm text-gray-500 mt-1">Sur iPhone, suivez ces 3 étapes</p>
                </div>

                {/* Steps */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                    <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shrink-0">
                      <Share className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">1. Partager</p>
                      <p className="text-sm text-gray-500">Appuyez sur le bouton partager en bas</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                    <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shrink-0">
                      <PlusSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">2. Ajouter à l&apos;écran</p>
                      <p className="text-sm text-gray-500">&quot;Sur l&apos;écran d&apos;accueil&quot;</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">3. Ouvrir l&apos;app</p>
                      <p className="text-sm text-gray-500">Depuis votre écran d&apos;accueil</p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 pt-0">
                  <button
                    onClick={() => setShowIOSInstructions(false)}
                    className="w-full py-4 rounded-2xl font-bold text-white transition-all hover:opacity-90"
                    style={{ backgroundColor: merchant.primary_color }}
                  >
                    J&apos;ai compris
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* iOS Version Warning Modal */}
          {showIOSVersionWarning && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div
                className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-slide-up"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 text-center">
                  <button
                    onClick={() => setShowIOSVersionWarning(false)}
                    className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>

                  <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-amber-600" />
                  </div>

                  <h3 className="text-xl font-black text-gray-900 mb-2">Mise à jour requise</h3>
                  <p className="text-gray-600 mb-4">
                    Les notifications push nécessitent iOS 16.4 ou plus récent.
                  </p>
                  <p className="text-sm text-gray-500 mb-6">
                    Votre version actuelle : iOS {iOSVersion || '?'}
                    <br />
                    Allez dans <span className="font-semibold">Réglages → Général → Mise à jour</span> pour mettre à jour votre iPhone.
                  </p>

                  <button
                    onClick={() => setShowIOSVersionWarning(false)}
                    className="w-full py-4 rounded-2xl font-bold text-white transition-all hover:opacity-90"
                    style={{ backgroundColor: merchant.primary_color }}
                  >
                    Compris
                  </button>
                </div>
              </div>
            </div>
          )}

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
            {(visits.length > 0 || adjustments.length > 0) && (
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
                    Voir ({visits.length + adjustments.length})
                  </>
                )}
              </button>
            )}
          </div>

          {(visits.length > 0 || adjustments.length > 0) ? (
            visitsExpanded ? (
              <ul className="divide-y divide-gray-50">
                {/* Combine visits and adjustments, sort by date */}
                {[
                  ...visits.map((v) => ({
                    type: 'visit' as const,
                    date: v.visited_at,
                    points: v.points_earned || 1,
                    id: v.id,
                    status: v.status || 'confirmed',
                    flagged_reason: v.flagged_reason
                  })),
                  ...adjustments.map((a) => ({
                    type: 'adjustment' as const,
                    date: a.created_at,
                    points: a.adjustment,
                    reason: a.reason,
                    id: a.id,
                    status: 'confirmed' as const,
                    flagged_reason: null
                  })),
                ]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((item) => {
                    const LoyaltyIcon = getLoyaltyIcon(merchant.loyalty_mode, merchant.product_name);
                    const isAdjustment = item.type === 'adjustment';
                    const isPending = item.status === 'pending';
                    const isRejected = item.status === 'rejected';

                    // Determine icon and colors based on status
                    const getStatusIcon = () => {
                      if (isAdjustment) return <SlidersHorizontal className="w-6 h-6 text-amber-600" />;
                      if (isPending) return <Hourglass className="w-6 h-6 text-amber-600 animate-pulse" />;
                      if (isRejected) return <XCircle className="w-6 h-6 text-red-500" />;
                      return <LoyaltyIcon className="w-6 h-6" style={{ color: merchant.primary_color }} />;
                    };

                    const getIconBgColor = () => {
                      if (isAdjustment) return '#fef3c7';
                      if (isPending) return '#fef3c7';
                      if (isRejected) return '#fee2e2';
                      return `${merchant.primary_color}10`;
                    };

                    return (
                      <li
                        key={item.id}
                        className={`flex items-center gap-4 px-6 py-5 hover:bg-gray-50/40 transition-colors ${isRejected ? 'opacity-60' : ''}`}
                      >
                        <div
                          className="flex items-center justify-center w-12 h-12 rounded-2xl shadow-sm"
                          style={{ backgroundColor: getIconBgColor() }}
                        >
                          {getStatusIcon()}
                        </div>
                        <div className="flex-1">
                          <p className={`font-semibold ${isRejected ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                            {isAdjustment
                              ? 'Ajustement manuel'
                              : isPending
                              ? 'En attente de validation'
                              : isRejected
                              ? 'Passage refusé'
                              : merchant.loyalty_mode === 'visit'
                              ? 'Passage validé'
                              : `${item.points} ${merchant.product_name || 'article'}${item.points > 1 ? 's' : ''}`}
                          </p>
                          <p className="text-sm text-gray-500 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDateTime(item.date)}
                          </p>
                          {isAdjustment && item.reason && (
                            <p className="text-xs text-gray-400 italic mt-0.5">{item.reason}</p>
                          )}
                          {isPending && (
                            <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              Vérification Qarte Shield
                            </p>
                          )}
                        </div>
                        <div
                          className={`px-3 py-1.5 rounded-xl text-sm font-bold ${
                            isPending
                              ? 'bg-amber-100 text-amber-700'
                              : isRejected
                              ? 'bg-red-100 text-red-500 line-through'
                              : item.points > 0
                              ? isAdjustment
                                ? 'bg-green-100 text-green-700'
                                : ''
                              : 'bg-red-100 text-red-700'
                          }`}
                          style={
                            item.points > 0 && !isAdjustment && !isPending && !isRejected
                              ? { backgroundColor: `${merchant.primary_color}10`, color: merchant.primary_color }
                              : {}
                          }
                        >
                          {isPending ? '⏳' : isRejected ? '❌' : item.points > 0 ? '+' : ''}{!isPending && !isRejected ? item.points : item.points}
                        </div>
                      </li>
                    );
                  })}
              </ul>
            ) : (
              <div className="p-6 text-center text-gray-500">
                <p className="text-sm">
                  {visits.length + adjustments.length} enregistrement{visits.length + adjustments.length > 1 ? 's' : ''} au total
                </p>
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

      {/* Safari Share Arrow for iOS users not in PWA */}
      {showSafariArrow && (
        <div className="fixed inset-0 z-40 pointer-events-none">
          {/* Semi-transparent overlay */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm pointer-events-auto animate-fade-in"
            onClick={() => {
              setShowSafariArrow(false);
              localStorage.setItem('qarte_safari_arrow_dismissed', 'true');
            }}
          />

          {/* Arrow and message container */}
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto animate-slide-up">
            {/* Message bubble */}
            <div
              className="bg-white rounded-2xl shadow-2xl p-4 mb-4 max-w-[280px] text-center"
              onClick={() => {
                setShowSafariArrow(false);
                localStorage.setItem('qarte_safari_arrow_dismissed', 'true');
              }}
            >
              <p className="font-bold text-gray-900 mb-1">📲 Ajoutez Qarte à votre écran</p>
              <p className="text-sm text-gray-600 mb-2">
                Pour recevoir vos offres exclusives et accéder à vos cartes en 1 clic
              </p>
              <p className="text-xs text-gray-400">Appuyez sur le bouton ci-dessous</p>
            </div>

            {/* Bouncing arrow pointing to share button */}
            <div className="animate-bounce-slow">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
                style={{ backgroundColor: merchant.primary_color }}
              >
                <Share className="w-7 h-7 text-white" />
              </div>
              {/* Arrow pointing down */}
              <div className="flex justify-center -mt-1">
                <div
                  className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[16px] border-l-transparent border-r-transparent"
                  style={{ borderTopColor: merchant.primary_color }}
                />
              </div>
            </div>

            {/* Dismiss button */}
            <button
              onClick={() => {
                setShowSafariArrow(false);
                localStorage.setItem('qarte_safari_arrow_dismissed', 'true');
              }}
              className="mt-4 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-sm font-medium text-gray-600 shadow-lg"
            >
              Plus tard
            </button>
          </div>
        </div>
      )}

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
