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
  Share2,
  PlusSquare,
  Sparkles,
  Zap,
  Trophy,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [reviewPermanentlyHidden, setReviewPermanentlyHidden] = useState(false);
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

    // Check if review card is permanently hidden
    const reviewHidden = localStorage.getItem(`qarte_review_hidden_${merchantId}`);
    if (reviewHidden === 'true') {
      setReviewPermanentlyHidden(true);
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
      {/* Header with premium glassmorphism design - Compact */}
      <header className="relative w-full overflow-hidden">
        <div className="relative mx-auto lg:max-w-lg lg:mt-4 lg:rounded-2xl overflow-hidden bg-slate-50/50">
          {/* Animated decorative background elements */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.2 }}
            transition={{ duration: 0.8 }}
            className="absolute -top-12 -left-12 w-40 h-40 rounded-full blur-3xl"
            style={{ background: merchant.primary_color }}
          />
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.2 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="absolute -bottom-12 -right-12 w-40 h-40 rounded-full blur-3xl"
            style={{ background: merchant.secondary_color || merchant.primary_color }}
          />

          {/* Compact height container */}
          <div className="relative h-36 sm:h-40 w-full flex flex-col items-center justify-center">

            {/* Elegant Back button */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute top-3 left-3 z-20"
            >
              <Link
                href="/customer/cards"
                className="group flex items-center justify-center w-9 h-9 rounded-full bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm transition-all hover:shadow-md active:scale-95"
              >
                <ArrowLeft className="w-4 h-4 text-slate-600 group-hover:text-slate-900" />
              </Link>
            </motion.div>

            {/* Logo/Image Container with Glassmorphism */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
              className="relative z-10 flex flex-col items-center"
            >
              <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-full p-1 bg-white/40 backdrop-blur-xl border border-white shadow-xl flex items-center justify-center overflow-hidden mb-2">
                {merchant.logo_url ? (
                  <img
                    src={merchant.logo_url}
                    alt={merchant.shop_name}
                    className="w-full h-full object-cover rounded-full ring-1 ring-black/5"
                  />
                ) : (
                  <div
                    className="w-full h-full rounded-full flex items-center justify-center text-white text-2xl font-black shadow-inner"
                    style={{ background: `linear-gradient(135deg, ${merchant.primary_color}, ${merchant.secondary_color || merchant.primary_color})` }}
                  >
                    {merchant.shop_name[0]}
                  </div>
                )}
              </div>

              {/* Shop Name & Progress Badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="flex flex-col items-center text-center px-4 relative"
              >
                <div className="relative flex flex-col items-center gap-2">
                  {/* Shop Name */}
                  <div className="px-5 py-2 bg-white/60 backdrop-blur-xl border border-white/70 rounded-xl shadow-md">
                    <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">
                      {merchant.shop_name}
                    </h1>
                  </div>

                  {/* Progress Badge */}
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 backdrop-blur-md border border-white shadow-sm">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">
                      {card.current_stamps} / {merchant.stamps_required} {merchant.loyalty_mode === 'visit' ? 'passages' : (merchant.product_name || 'articles')}
                    </span>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Centered gradient glow behind logo */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full blur-2xl opacity-30 pointer-events-none"
              style={{ background: `radial-gradient(circle, ${merchant.primary_color}60, transparent 70%)` }}
            />
          </div>
        </div>
      </header>

      
      <main className="flex-1 mt-4 px-4 pb-12 w-full max-w-lg mx-auto z-10">
        {/* Pending Points Alert - Qarte Shield */}
        <AnimatePresence>
          {pendingCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="relative p-3 bg-gradient-to-br from-amber-50 via-white to-amber-50/30 border border-amber-200 rounded-2xl shadow-md mb-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                  <Hourglass className="w-5 h-5 text-amber-600 animate-pulse" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-sm">
                    {pendingCount} {merchant.loyalty_mode === 'visit'
                      ? (pendingCount > 1 ? 'passages' : 'passage')
                      : (merchant.product_name || (pendingCount > 1 ? 'articles' : 'article'))
                    } en attente
                  </p>
                  <p className="text-xs text-gray-500">
                    Validation par le commerçant en cours
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-amber-100">
                <Shield className="w-3 h-3 text-gray-400" />
                <span className="text-[9px] font-medium text-gray-400 uppercase tracking-wider">
                  Protégé par Qarte Shield
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Review Section - Above Card */}
        {merchant.review_link && !reviewDismissed && !reviewPermanentlyHidden && (
          <div className="relative group p-3 bg-gradient-to-br from-amber-50 via-white to-amber-50/30 border border-amber-100 rounded-2xl shadow-md mb-4 hover:shadow-lg transition-all duration-300">
            {/* Close button with dropdown */}
            <div className="absolute -top-2 -right-2 z-20">
              <div className="relative group/menu">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setReviewDismissed(true);
                  }}
                  className="p-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow-md hover:bg-amber-50 transition-colors border border-amber-100/50"
                  aria-label="Fermer"
                >
                  <X className="w-3.5 h-3.5 text-amber-500" />
                </button>
                {/* Dropdown menu on hover */}
                <div className="absolute right-0 top-full mt-1 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-200">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      localStorage.setItem(`qarte_review_hidden_${merchantId}`, 'true');
                      setReviewPermanentlyHidden(true);
                    }}
                    className="whitespace-nowrap px-3 py-2 text-xs font-medium bg-white rounded-lg shadow-lg border border-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    Ne plus afficher
                  </button>
                </div>
              </div>
            </div>
            <a
              href={merchant.review_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3"
            >
              <div className="flex items-center justify-center w-10 h-10 bg-amber-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">Laisser un avis à {merchant.shop_name}</p>
              </div>
              <div className="p-2 rounded-lg bg-amber-500 text-white shadow-sm group-hover:scale-105 transition-all">
                <ExternalLink className="w-4 h-4" />
              </div>
            </a>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-6 overflow-hidden relative"
        >
          {/* "Presque!" Badge - When 1-2 stamps remaining */}
          <AnimatePresence>
            {!isRewardReady && merchant.stamps_required - card.current_stamps <= 2 && card.current_stamps > 0 && (
              <motion.div
                initial={{ scale: 0, rotate: -12 }}
                animate={{ scale: 1, rotate: -12 }}
                exit={{ scale: 0 }}
                className="absolute -top-2 -right-2 z-20"
              >
                <div
                  className="px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5"
                  style={{ backgroundColor: merchant.primary_color }}
                >
                  <Zap className="w-3.5 h-3.5 text-white fill-white" />
                  <span className="text-xs font-black text-white">
                    {merchant.stamps_required - card.current_stamps === 1 ? 'Plus que 1 !' : 'Presque !'}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="text-center mb-6">
            <motion.div
              key={card.current_stamps}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="flex items-baseline justify-center gap-1"
            >
              <span className="text-5xl font-black" style={{ color: merchant.primary_color }}>{card.current_stamps}</span>
              <span className="text-xl font-bold text-gray-300">/{merchant.stamps_required}</span>
            </motion.div>
            <p className="text-gray-400 font-bold uppercase tracking-[0.15em] text-[10px] mt-1.5 flex items-center justify-center gap-1.5">
              {(() => {
                const LoyaltyIcon = getLoyaltyIcon(merchant.loyalty_mode, merchant.product_name);
                return <LoyaltyIcon className="w-3.5 h-3.5" />;
              })()}
              {getLoyaltyLabel(merchant.loyalty_mode, merchant.product_name, card.current_stamps)} cumulés
            </p>
            {/* Member since badge */}
            {card.created_at && (
              <p className="text-[10px] text-gray-400 mt-2 flex items-center justify-center gap-1">
                <Trophy className="w-3 h-3" />
                Membre depuis {new Date(card.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>

          {/* Stamp Circles Container */}
          <div className="flex flex-wrap justify-center gap-2.5 mb-6">
            {Array.from({ length: merchant.stamps_required }).map((_, i) => {
              const isFilled = i < card.current_stamps;
              const isNext = i === card.current_stamps;
              const LoyaltyIcon = getLoyaltyIcon(merchant.loyalty_mode, merchant.product_name);
              return (
                <motion.div
                  key={i}
                  initial={false}
                  animate={{
                    scale: isFilled ? 1 : 0.85,
                    opacity: isFilled ? 1 : isNext ? 0.7 : 0.4
                  }}
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className={`w-11 h-11 rounded-full flex items-center justify-center ${
                    isFilled ? 'shadow-md' : 'border-2 border-dashed'
                  } ${isNext ? 'animate-pulse' : ''}`}
                  style={{
                    backgroundColor: isFilled ? merchant.primary_color : 'transparent',
                    borderColor: isFilled ? 'transparent' : isNext ? merchant.primary_color : '#E5E7EB',
                    boxShadow: isFilled ? `0 4px 12px ${merchant.primary_color}40` : 'none'
                  }}
                >
                  <LoyaltyIcon
                    className="w-5 h-5"
                    style={{ color: isFilled ? '#fff' : isNext ? merchant.primary_color : '#D1D5DB' }}
                  />
                </motion.div>
              );
            })}
          </div>

          {/* Integrated Status & Progress Card */}
          <motion.div
            animate={isRewardReady ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 0.5, repeat: isRewardReady ? Infinity : 0, repeatDelay: 2 }}
            className={`relative rounded-xl p-4 border mb-6 overflow-hidden transition-all duration-700 ${isRewardReady ? 'shadow-lg' : ''}`}
            style={{
              backgroundColor: isRewardReady ? `${merchant.primary_color}15` : `${merchant.primary_color}05`,
              borderColor: isRewardReady ? merchant.primary_color : `${merchant.primary_color}20`,
            }}
          >
            {/* Background Progress Fill */}
            {!isRewardReady && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(card.current_stamps / merchant.stamps_required) * 100}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute inset-y-0 left-0 rounded-l-xl"
                style={{
                  background: `linear-gradient(90deg, ${merchant.primary_color}, ${merchant.secondary_color || merchant.primary_color})`,
                  opacity: 0.15
                }}
              />
            )}

            {/* Content Overlay */}
            <div className="relative z-10 flex items-center justify-between gap-3">
              <div className="flex-1">
                <p className={`font-bold text-sm transition-colors duration-500 ${isRewardReady ? 'text-gray-900' : 'text-gray-700'}`}>
                  {isRewardReady
                    ? `🎉 ${merchant.reward_description}`
                    : formatRewardText(merchant.reward_description || 'votre récompense', merchant.stamps_required - card.current_stamps, merchant.loyalty_mode, merchant.product_name)
                  }
                </p>
              </div>
              <motion.div
                animate={isRewardReady ? { rotate: [0, 10, -10, 0] } : {}}
                transition={{ duration: 0.5, repeat: isRewardReady ? Infinity : 0, repeatDelay: 2 }}
                className={`p-2 rounded-lg transition-all duration-500 ${isRewardReady ? 'shadow-md' : 'opacity-40'}`}
                style={{
                  backgroundColor: isRewardReady ? merchant.primary_color : 'transparent',
                  color: isRewardReady ? '#fff' : merchant.primary_color
                }}
              >
                <Gift className="w-5 h-5" />
              </motion.div>
            </div>
          </motion.div>

          {/* Current Offer - Non-invasive, clickable */}
          {offer && offer.active && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5"
            >
              <button
                onClick={() => setOfferExpanded(!offerExpanded)}
                className="w-full group"
              >
                <div
                  className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                    offerExpanded
                      ? 'border-solid shadow-lg'
                      : 'border-dashed hover:border-solid hover:shadow-md'
                  }`}
                  style={{
                    borderColor: offerExpanded ? merchant.primary_color : `${merchant.primary_color}40`,
                    backgroundColor: offerExpanded ? `${merchant.primary_color}08` : `${merchant.primary_color}03`
                  }}
                >
                  {/* Closed State Header - Always visible */}
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-2.5">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${merchant.primary_color}15` }}
                      >
                        <Gift className="w-4.5 h-4.5" style={{ color: merchant.primary_color }} />
                      </motion.div>
                      <div className="text-left">
                        <p className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3" style={{ color: merchant.primary_color }} />
                          Offre exclusive
                        </p>
                        {!offerExpanded && offer.expiresAt && (
                          <p className="text-xs text-gray-500">
                            {(() => {
                              const expires = new Date(offer.expiresAt);
                              const now = new Date();
                              const hoursLeft = Math.max(0, Math.floor((expires.getTime() - now.getTime()) / (1000 * 60 * 60)));
                              if (hoursLeft < 24) {
                                return `⏰ Expire dans ${hoursLeft}h`;
                              }
                              const daysLeft = Math.floor(hoursLeft / 24);
                              return `📅 Encore ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`;
                            })()}
                          </p>
                        )}
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: offerExpanded ? 180 : 0 }}
                      className="p-1.5 rounded-lg"
                      style={{ backgroundColor: `${merchant.primary_color}10` }}
                    >
                      <ChevronDown className="w-4 h-4" style={{ color: merchant.primary_color }} />
                    </motion.div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {offerExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 text-left">
                          <div className="pt-3 border-t border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-1.5">{offer.title}</h3>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{offer.description}</p>

                            {offer.imageUrl && (
                              <div className="mt-3 rounded-lg overflow-hidden">
                                <img
                                  src={offer.imageUrl}
                                  alt={offer.title}
                                  className="w-full h-32 object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            )}

                            <div className="mt-3 flex items-center justify-between">
                              {offer.expiresAt && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>
                                    Jusqu'à {(() => {
                                      const expires = new Date(offer.expiresAt);
                                      const today = new Date();
                                      const tomorrow = new Date(today);
                                      tomorrow.setDate(tomorrow.getDate() + 1);

                                      if (expires.toDateString() === today.toDateString()) {
                                        return "ce soir";
                                      } else if (expires.toDateString() === tomorrow.toDateString()) {
                                        return "demain soir";
                                      } else {
                                        return expires.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                                      }
                                    })()}
                                  </span>
                                </div>
                              )}
                              {/* Share button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (navigator.share) {
                                    navigator.share({
                                      title: `${offer.title} - ${merchant.shop_name}`,
                                      text: `${offer.description}\n\nDécouvre cette offre chez ${merchant.shop_name} !`,
                                      url: window.location.href,
                                    });
                                  }
                                }}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                style={{ backgroundColor: `${merchant.primary_color}10`, color: merchant.primary_color }}
                              >
                                <Share2 className="w-3.5 h-3.5" />
                                Partager
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </button>
            </motion.div>
          )}

          {/* Subscribe to Updates Button */}
          {!pushSubscribed && pushPermission !== 'denied' && (
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePushSubscribe}
              disabled={pushSubscribing}
              className="group w-full relative overflow-hidden rounded-xl border-2 border-dashed p-4 flex items-center gap-3 transition-all duration-300 hover:border-solid hover:shadow-lg disabled:opacity-50"
              style={{
                borderColor: `${merchant.primary_color}40`,
                backgroundColor: `${merchant.primary_color}05`
              }}
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${merchant.primary_color}15` }}
              >
                {pushSubscribing ? (
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: merchant.primary_color }} />
                ) : (
                  <Bell className="w-5 h-5" style={{ color: merchant.primary_color }} />
                )}
              </motion.div>
              <div className="flex-1 text-left">
                <p className="font-bold text-gray-900 text-sm">
                  {isIOS && !isStandalone
                    ? "🎁 Offres exclusives"
                    : "🎁 Ne ratez rien !"
                  }
                </p>
                <p className="text-xs text-gray-500">
                  Promos flash, récompenses, alertes
                </p>
              </div>
              <ChevronRight
                className="w-4 h-4 transition-transform group-hover:translate-x-1"
                style={{ color: merchant.primary_color }}
              />
            </motion.button>
          )}

          {/* Subscribed confirmation - Small bell icon */}
          {pushSubscribed && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex justify-center"
            >
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{ backgroundColor: `${merchant.primary_color}10` }}
              >
                <Bell className="w-3 h-3" style={{ color: merchant.primary_color }} />
                <span className="text-[10px] font-medium" style={{ color: merchant.primary_color }}>Notifications actives</span>
              </div>
            </motion.div>
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                onClick={() => setShowRedeemModal(true)}
                className="w-full mt-6 h-14 rounded-xl text-base font-bold shadow-lg hover:shadow-xl transition-all"
                style={{
                  background: `linear-gradient(135deg, ${merchant.primary_color}, ${merchant.secondary_color || merchant.primary_color})`
                }}
              >
                <Gift className="w-5 h-5 mr-2" />
                Profiter de ma récompense
              </Button>
            </motion.div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100/50 overflow-hidden mb-10"
        >
          <div className="p-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <div className="p-1.5 bg-gray-50 rounded-lg">
                {(() => {
                  const LoyaltyIcon = getLoyaltyIcon(merchant.loyalty_mode, merchant.product_name);
                  return <LoyaltyIcon className="w-4 h-4 text-gray-500" />;
                })()}
              </div>
              Historique
            </h2>
            {(visits.length > 0 || adjustments.length > 0) && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setVisitsExpanded(!visitsExpanded)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-all"
                style={{ color: merchant.primary_color, backgroundColor: `${merchant.primary_color}10` }}
              >
                {visitsExpanded ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    Réduire
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    Voir ({visits.length + adjustments.length})
                  </>
                )}
              </motion.button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {(visits.length > 0 || adjustments.length > 0) ? (
              visitsExpanded ? (
                <motion.ul
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="divide-y divide-gray-50"
                >
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
                    .slice(0, 10) // Limit to 10 items for performance
                    .map((item, index) => {
                      const LoyaltyIcon = getLoyaltyIcon(merchant.loyalty_mode, merchant.product_name);
                      const isAdjustment = item.type === 'adjustment';
                      const isPending = item.status === 'pending';
                      const isRejected = item.status === 'rejected';

                      const getStatusIcon = () => {
                        if (isAdjustment) return <SlidersHorizontal className="w-4 h-4 text-amber-600" />;
                        if (isPending) return <Hourglass className="w-4 h-4 text-amber-600 animate-pulse" />;
                        if (isRejected) return <XCircle className="w-4 h-4 text-red-500" />;
                        return <LoyaltyIcon className="w-4 h-4" style={{ color: merchant.primary_color }} />;
                      };

                      const getIconBgColor = () => {
                        if (isAdjustment) return '#fef3c7';
                        if (isPending) return '#fef3c7';
                        if (isRejected) return '#fee2e2';
                        return `${merchant.primary_color}10`;
                      };

                      return (
                        <motion.li
                          key={item.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50/40 transition-colors ${isRejected ? 'opacity-60' : ''}`}
                        >
                          <div
                            className="flex items-center justify-center w-9 h-9 rounded-xl"
                            style={{ backgroundColor: getIconBgColor() }}
                          >
                            {getStatusIcon()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold text-sm truncate ${isRejected ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                              {isAdjustment
                                ? 'Ajustement'
                                : isPending
                                ? 'En attente'
                                : isRejected
                                ? 'Refusé'
                                : merchant.loyalty_mode === 'visit'
                                ? 'Passage validé'
                                : `${item.points} ${merchant.product_name || 'article'}${item.points > 1 ? 's' : ''}`}
                            </p>
                            <p className="text-[10px] text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDateTime(item.date)}
                            </p>
                          </div>
                          <div
                            className={`px-2 py-1 rounded-lg text-xs font-bold ${
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
                        </motion.li>
                      );
                    })}
                </motion.ul>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-4 text-center text-gray-500"
                >
                  <p className="text-xs">
                    {visits.length + adjustments.length} enregistrement{visits.length + adjustments.length > 1 ? 's' : ''}
                  </p>
                </motion.div>
              )
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-8 text-center"
              >
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  {(() => {
                    const LoyaltyIcon = getLoyaltyIcon(merchant.loyalty_mode, merchant.product_name);
                    return <LoyaltyIcon className="w-6 h-6 text-gray-300" />;
                  })()}
                </div>
                <p className="text-gray-500 font-medium text-sm">Aucun historique</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <footer className="py-6 text-center">
          <div className="inline-flex items-center gap-1.5 group cursor-default transition-all duration-300 hover:opacity-70">
            <div className="w-5 h-5 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-md flex items-center justify-center">
              <span className="text-white text-[10px] font-black italic">Q</span>
            </div>
            <span className="text-sm font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
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
