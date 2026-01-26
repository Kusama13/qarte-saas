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
  ScanLine,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isPushSupported, subscribeToPush, getPermissionStatus, isIOSDevice, isStandalonePWA, isIOSPushSupported, getIOSVersion } from '@/lib/push';
import { Button, Modal } from '@/components/ui';
import dynamic from 'next/dynamic';

// Dynamic import for QR Scanner (client-side only)
const QRScanner = dynamic(() => import('@/components/QRScanner'), { ssr: false });
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
  const [isIOSChrome, setIsIOSChrome] = useState(false);
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

  // QR Scanner state
  const [showScanner, setShowScanner] = useState(false);
  const [canShowScanner, setCanShowScanner] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

        // Fetch current offer and PWA offer
        try {
          const offerResponse = await fetch(`/api/offers?merchantId=${merchantId}`);
          const offerData = await offerResponse.json();
          if (offerResponse.ok) {
            if (offerData.offer && offerData.offer.active) {
              setOffer(offerData.offer);
            }
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
    setIsIOSChrome(iOS && /CriOS/i.test(navigator.userAgent));
    setIsStandalone(standalone);
    setIOSVersion(iosVersion);

    // Check if scanner should be shown (PWA mode on mobile only)
    const isAndroid = /android/i.test(navigator.userAgent);
    const mobileDevice = iOS || isAndroid;
    setIsMobile(mobileDevice);
    setCanShowScanner(standalone && mobileDevice);

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

  // Auto-subscribe to push notifications when PWA is first opened
  useEffect(() => {
    // Only auto-subscribe if:
    // - Card data is loaded
    // - Running in standalone PWA mode
    // - Not already subscribed
    // - Permission not denied
    // - Push is supported (iOS 16.4+ or standard push)
    if (
      card &&
      isStandalone &&
      !pushSubscribed &&
      pushPermission !== 'denied' &&
      pushSupported &&
      !pushSubscribing
    ) {
      // Check if we've already tried auto-subscribe in this session
      const autoSubscribeAttempted = sessionStorage.getItem('qarte_auto_subscribe_attempted');
      if (autoSubscribeAttempted) return;

      // Mark as attempted for this session
      sessionStorage.setItem('qarte_auto_subscribe_attempted', 'true');

      // Small delay to let the app settle before requesting permission
      const timer = setTimeout(() => {
        handlePushSubscribe();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [card, isStandalone, pushSubscribed, pushPermission, pushSupported, pushSubscribing]);

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

        {/* Review Section - Only show if review_link exists and is not empty */}
        {merchant.review_link && merchant.review_link.trim() !== '' && !reviewDismissed && !reviewPermanentlyHidden && (
          <div className="relative group mb-3">
            <a
              href={merchant.review_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-gradient-to-br from-amber-50 via-white to-amber-50/30 border border-amber-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-center w-9 h-9 bg-amber-100 rounded-lg group-hover:scale-105 transition-transform">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">Laisser un avis à {merchant.shop_name}</p>
              </div>
              <div className="p-1.5 rounded-lg bg-amber-500 text-white">
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </a>
            {/* Close buttons - Outside the link, positioned on the right */}
            <div className="absolute -top-1.5 -right-1.5 flex gap-1 z-20">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  localStorage.setItem(`qarte_review_hidden_${merchantId}`, 'true');
                  setReviewPermanentlyHidden(true);
                }}
                className="p-1 rounded-full bg-gray-100 hover:bg-red-100 transition-colors text-gray-400 hover:text-red-500"
                aria-label="Ne plus afficher"
                title="Ne plus afficher"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
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

          {/* Compact Progress Bar */}
          <div className="mb-5">
            {/* Progress bar */}
            <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(card.current_stamps / merchant.stamps_required) * 100}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${merchant.primary_color}, ${merchant.secondary_color || merchant.primary_color})`,
                }}
              />
            </div>
            {/* Reward text */}
            <div className="flex items-center justify-between gap-2">
              <p className={`text-xs font-medium ${isRewardReady ? 'text-gray-900' : 'text-gray-600'}`}>
                {isRewardReady
                  ? `🎉 ${merchant.reward_description}`
                  : formatRewardText(merchant.reward_description || 'votre récompense', merchant.stamps_required - card.current_stamps, merchant.loyalty_mode, merchant.product_name)
                }
              </p>
              {isRewardReady && (
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                >
                  <Gift className="w-4 h-4" style={{ color: merchant.primary_color }} />
                </motion.div>
              )}
            </div>

          </div>

          {/* Current Offer - Premium Gradient Banner */}
          {offer && offer.active && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 overflow-hidden rounded-2xl shadow-lg shadow-black/5 border border-white/20"
            >
              <button
                onClick={() => setOfferExpanded(!offerExpanded)}
                className="w-full text-left transition-transform active:scale-[0.99]"
              >
                <div
                  className="relative p-4 text-white overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${merchant.primary_color} 0%, ${merchant.primary_color}dd 100%)`
                  }}
                >
                  {/* Decorative Glass Circle */}
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />

                  <div className="relative flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/20 flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-white" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-white">Offre Exclusive</span>
                        </div>
                      </div>
                      <h3 className="text-base font-extrabold leading-tight mb-1 drop-shadow-sm">
                        {offer.title}
                      </h3>
                      {offer.expiresAt && (
                        <div className="flex items-center gap-1.5 text-white/90 text-xs font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            Valable jusqu&apos;au {(() => {
                              const expires = new Date(offer.expiresAt);
                              const today = new Date();
                              const tomorrow = new Date(today);
                              tomorrow.setDate(tomorrow.getDate() + 1);
                              if (expires.toDateString() === today.toDateString()) {
                                return "ce soir";
                              } else if (expires.toDateString() === tomorrow.toDateString()) {
                                return "demain soir";
                              } else {
                                return expires.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
                              }
                            })()}
                          </span>
                        </div>
                      )}
                    </div>

                    <motion.div
                      animate={{ rotate: offerExpanded ? 180 : 0 }}
                      className="ml-3 w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30"
                    >
                      <ChevronDown className="w-4 h-4 text-white" />
                    </motion.div>
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {offerExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-white overflow-hidden"
                  >
                    <div className="p-4 border-t border-gray-100">
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {offer.description}
                      </p>
                      {offer.imageUrl && (
                        <div className="mt-3 rounded-xl overflow-hidden border border-gray-100">
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
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}


          {/* PWA Notification Banner - Show in PWA when NOT subscribed */}
          {isStandalone && isMobile && !pushSubscribed && pushPermission !== 'denied' && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePushSubscribe}
              disabled={pushSubscribing}
              className="w-full mb-5"
            >
              <div
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all hover:shadow-sm"
                style={{
                  borderColor: `${merchant.primary_color}30`,
                  backgroundColor: `${merchant.primary_color}05`
                }}
              >
                <motion.div
                  animate={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="shrink-0"
                >
                  <Bell className="w-4 h-4" style={{ color: merchant.primary_color }} />
                </motion.div>
                <span className="flex-1 text-xs font-medium text-gray-700 text-left">
                  Activer les notifications pour ne rater aucune offre
                </span>
                {pushSubscribing ? (
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" style={{ color: merchant.primary_color }} />
                ) : (
                  <ChevronRight className="w-4 h-4 shrink-0" style={{ color: merchant.primary_color }} />
                )}
              </div>
            </motion.button>
          )}


          {/* Subscribed confirmation - Small bell icon */}
          {pushSubscribed && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex justify-center mb-4"
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

          {/* Scan QR Code Button - Only visible in PWA mode on mobile */}
          {canShowScanner && (
            <>
              <div className="flex justify-center mt-4">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setShowScanner(true)}
                  className="flex items-center justify-center gap-2 w-1/2 py-3.5 rounded-2xl shadow-md transition-all"
                  style={{
                    backgroundColor: merchant.primary_color,
                  }}
                >
                  <ScanLine className="w-5 h-5 text-white" />
                  <span className="font-bold text-sm text-white">
                    Scanner
                  </span>
                </motion.button>
              </div>

              {/* QR Scanner Modal */}
              <QRScanner
                isOpen={showScanner}
                onClose={() => setShowScanner(false)}
                onScan={(code) => {
                  setShowScanner(false);
                  // Navigate to scan page with the code
                  router.push(`/scan/${code}`);
                }}
                primaryColor={merchant.primary_color}
              />
            </>
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
            <>
              {/* Animated Arrow for Safari iOS - Points DOWN to bottom-right "..." */}
              {isIOS && !isIOSChrome && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, y: [0, 8, 0] }}
                  transition={{ y: { duration: 0.8, repeat: Infinity }, opacity: { duration: 0.3 } }}
                  className="fixed bottom-3 right-3 z-[60] flex flex-col items-center"
                >
                  <div className="bg-white rounded-full p-2 shadow-xl border-2 border-blue-500">
                    <ChevronDown className="w-6 h-6 text-blue-500" />
                  </div>
                </motion.div>
              )}

              {/* Animated Arrow for Chrome iOS - Points UP to top-right share */}
              {isIOS && isIOSChrome && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, y: [0, -8, 0] }}
                  transition={{ y: { duration: 0.8, repeat: Infinity }, opacity: { duration: 0.3 } }}
                  className="fixed top-3 right-3 z-[60] flex flex-col items-center"
                >
                  <div className="bg-white rounded-full p-2 shadow-xl border-2 border-blue-500">
                    <ChevronUp className="w-6 h-6 text-blue-500" />
                  </div>
                </motion.div>
              )}

              {/* Android Arrow - Points UP to ⋮ menu */}
              {!isIOS && isMobile && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, y: [0, -8, 0] }}
                  transition={{ y: { duration: 0.8, repeat: Infinity }, opacity: { duration: 0.3 } }}
                  className="fixed top-3 right-3 z-[60] flex flex-col items-center"
                >
                  <div className="bg-white rounded-full p-2 shadow-xl border-2 border-blue-500">
                    <ChevronUp className="w-6 h-6 text-blue-500" />
                  </div>
                </motion.div>
              )}

              <div
                className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 bg-black/50 backdrop-blur-sm"
                onClick={() => setShowIOSInstructions(false)}
              >
                <div
                  className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Compact Header */}
                  <div
                    className="relative px-4 py-4 text-center"
                    style={{ background: `linear-gradient(135deg, ${merchant.primary_color}10, white)` }}
                  >
                    <button
                      onClick={() => setShowIOSInstructions(false)}
                      className="absolute top-3 right-3 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                    <div className="flex items-center justify-center gap-2">
                      <PlusSquare className="w-5 h-5" style={{ color: merchant.primary_color }} />
                      <h3 className="text-base font-bold text-gray-900">Ajouter à l&apos;écran d&apos;accueil</h3>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Pour recevoir les offres exclusives</p>
                  </div>

                  {/* Compact Steps */}
                  <div className="px-4 py-3 space-y-2">
                    {isIOS && !isIOSChrome ? (
                      <>
                        {/* Safari iOS: ⋯ → Partager → Écran d'accueil */}
                        <div className="flex items-center gap-3 p-2.5 bg-blue-50 rounded-xl border border-blue-200">
                          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
                            <span className="text-white font-bold">⋯</span>
                          </div>
                          <p className="text-sm text-gray-800"><span className="font-semibold">1.</span> Appuyez sur <strong>⋯</strong> en bas</p>
                        </div>

                        <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
                            <Share className="w-4 h-4 text-white" />
                          </div>
                          <p className="text-sm text-gray-800"><span className="font-semibold">2.</span> Puis <strong>Partager</strong></p>
                        </div>

                        <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
                            <PlusSquare className="w-4 h-4 text-white" />
                          </div>
                          <p className="text-sm text-gray-800"><span className="font-semibold">3.</span> <strong>Sur l&apos;écran d&apos;accueil</strong></p>
                        </div>
                      </>
                    ) : isIOS && isIOSChrome ? (
                      <>
                        {/* Chrome iOS: Partager → ⋯ → Écran d'accueil */}
                        <div className="flex items-center gap-3 p-2.5 bg-blue-50 rounded-xl border border-blue-200">
                          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
                            <Share className="w-4 h-4 text-white" />
                          </div>
                          <p className="text-sm text-gray-800"><span className="font-semibold">1.</span> Appuyez sur <strong>Partager</strong> ↑</p>
                        </div>

                        <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
                            <span className="text-white font-bold text-sm">⋯</span>
                          </div>
                          <p className="text-sm text-gray-800"><span className="font-semibold">2.</span> Puis <strong>Plus...</strong></p>
                        </div>

                        <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
                            <PlusSquare className="w-4 h-4 text-white" />
                          </div>
                          <p className="text-sm text-gray-800"><span className="font-semibold">3.</span> <strong>Sur l&apos;écran d&apos;accueil</strong></p>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Android */}
                        <div className="flex items-center gap-3 p-2.5 bg-blue-50 rounded-xl border border-blue-200">
                          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
                            <span className="text-white font-bold">⋮</span>
                          </div>
                          <p className="text-sm text-gray-800"><span className="font-semibold">1.</span> Appuyez sur <strong>⋮</strong> en haut</p>
                        </div>

                        <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
                            <PlusSquare className="w-4 h-4 text-white" />
                          </div>
                          <p className="text-sm text-gray-800"><span className="font-semibold">2.</span> <strong>Installer l&apos;application</strong></p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Compact Footer */}
                  <div className="px-4 pb-4 pt-2">
                    <button
                      onClick={() => setShowIOSInstructions(false)}
                      className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90"
                      style={{ backgroundColor: merchant.primary_color }}
                    >
                      J&apos;ai compris
                    </button>
                  </div>
                </div>
              </div>
            </>
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
              ) : null
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

      {/* Sticky Add to Home Screen Banner - Fixed at bottom, hidden when modal is open */}
      <AnimatePresence>
        {!isStandalone && isMobile && !showIOSInstructions && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowIOSInstructions(true)}
            className="fixed bottom-4 left-4 right-4 z-40"
          >
            <motion.div
              animate={{
                boxShadow: [
                  `0 0 0 0 ${merchant.primary_color}30`,
                  `0 0 0 6px ${merchant.primary_color}00`,
                  `0 0 0 0 ${merchant.primary_color}30`
                ]
              }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-md border"
              style={{
                backgroundColor: `${merchant.primary_color}15`,
                borderColor: `${merchant.primary_color}30`,
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="shrink-0"
              >
                {isIOS && !isIOSChrome ? (
                  <ChevronDown className="w-5 h-5" style={{ color: merchant.primary_color }} />
                ) : (
                  <ChevronUp className="w-5 h-5" style={{ color: merchant.primary_color }} />
                )}
              </motion.div>
              <span className="flex-1 text-sm font-semibold text-left" style={{ color: merchant.primary_color }}>
                Ajouter à l&apos;écran d&apos;accueil
              </span>
              <PlusSquare className="w-5 h-5 shrink-0" style={{ color: merchant.primary_color }} />
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
