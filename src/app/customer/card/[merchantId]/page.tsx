'use client';

import { useState, useEffect, use, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Crown,
  Download,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isPushSupported, subscribeToPush, getPermissionStatus, isIOSDevice, isStandalonePWA, isIOSPushSupported, getIOSVersion } from '@/lib/push';
import { Button, Modal } from '@/components/ui';
import { trackPwaInstalled, trackPushEnabled, trackCardCreated } from '@/lib/analytics';
import dynamic from 'next/dynamic';

// Dynamic import for QR Scanner (client-side only)
const QRScanner = dynamic(() => import('@/components/QRScanner'), { ssr: false });
import { formatDateTime, formatPhoneNumber } from '@/lib/utils';
import type { Merchant, LoyaltyCard, Customer, Visit, VisitStatus, MemberCard } from '@/types';

interface PointAdjustment {
  id: string;
  created_at: string;
  adjustment: number;
  reason: string | null;
}

interface RedemptionHistory {
  id: string;
  redeemed_at: string;
  stamps_used: number;
  tier: number;
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

// Get icon for visits
const getLoyaltyIcon = () => {
  return Footprints;
};

const getLoyaltyLabel = (count: number) => {
  return count === 1 ? 'Passage' : 'Passages';
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
  const [redeemTier, setRedeemTier] = useState<1 | 2>(1);
  const [tier1RedeemedInCycle, setTier1RedeemedInCycle] = useState(false);
  const [card, setCard] = useState<CardWithDetails | null>(null);
  const [visits, setVisits] = useState<VisitWithStatus[]>([]);
  const [adjustments, setAdjustments] = useState<PointAdjustment[]>([]);
  const [redemptions, setRedemptions] = useState<RedemptionHistory[]>([]);
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

  // Member card state
  const [memberCard, setMemberCard] = useState<MemberCard | null>(null);
  const [showMemberCardModal, setShowMemberCardModal] = useState(false);

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
        // Single consolidated API call that returns all data
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

        // Store redemptions for history display
        if (data.redemptions) {
          setRedemptions(data.redemptions as RedemptionHistory[]);
        }

        // Count pending visits
        const pending = visitsData.filter((v: VisitWithStatus) => v.status === 'pending').length;
        setPendingCount(pending);

        // Set offer from consolidated response
        if (data.offer) {
          setOffer(data.offer);
        }

        // Set member card from consolidated response
        if (data.memberCard) {
          setMemberCard(data.memberCard);
        }

        // Check if tier 1 has been redeemed in current cycle (for tier 2 enabled merchants)
        if (data.card.merchant.tier2_enabled && data.redemptions) {
          const redemptionsData = data.redemptions as Array<{ tier: number; redeemed_at: string }>;
          // Find last tier 2 redemption
          const tier2Redemptions = redemptionsData.filter((r) => r.tier === 2);
          const lastTier2Date = tier2Redemptions.length > 0
            ? new Date(tier2Redemptions[0].redeemed_at).getTime()
            : 0;

          // Check if tier 1 was redeemed after last tier 2
          const tier1RedemptionsAfterTier2 = redemptionsData.filter(
            (r) => r.tier === 1 && new Date(r.redeemed_at).getTime() > lastTier2Date
          );

          setTier1RedeemedInCycle(tier1RedemptionsAfterTier2.length > 0);
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

    // Track PWA installation (only once per device)
    if (standalone) {
      const pwaTracked = localStorage.getItem('qarte_pwa_tracked');
      if (!pwaTracked) {
        localStorage.setItem('qarte_pwa_tracked', 'true');
        trackPwaInstalled(merchantId);
      }
    }

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
  const formatRewardText = (reward: string, remaining: number) => {
    const lowerReward = reward.toLowerCase();
    const unit = remaining === 1 ? 'passage' : 'passages';

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
        // Track push enabled
        trackPushEnabled(card.customer.id);
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

  const triggerConfetti = useCallback(async () => {
    // Dynamic import - only load confetti when needed
    const confetti = (await import('canvas-confetti')).default;

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
  }, []);

  const handleRedeem = async (tier: 1 | 2 = 1) => {
    if (!card) return;

    const savedPhone = getCookie('customer_phone');
    if (!savedPhone) {
      console.error('No phone found in cookies');
      alert('Session expirée. Veuillez vous reconnecter.');
      return;
    }

    // Format phone number before sending
    const formattedPhone = formatPhoneNumber(savedPhone);
    console.log('Redeeming with phone:', formattedPhone, 'tier:', tier);

    setRedeeming(true);

    try {
      const response = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loyalty_card_id: card.id,
          customer_phone: formattedPhone,
          tier: tier,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Only reset stamps if tier 2 or if tier 2 is not enabled
        if (data.stamps_reset) {
          setCard({ ...card, current_stamps: 0 });
        }
        // Mark tier 1 as redeemed in cycle
        if (tier === 1) {
          setTier1RedeemedInCycle(true);
        }
        // Reset tier 1 redeemed status if tier 2 was redeemed (new cycle)
        if (tier === 2) {
          setTier1RedeemedInCycle(false);
        }
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
      <div className="min-h-screen bg-gradient-to-b from-gray-100 to-white">
        {/* Skeleton Header */}
        <header className="relative w-full h-48 bg-gray-200 animate-pulse">
          <div className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/20" />
        </header>
        <main className="px-4 -mt-20 relative z-10 max-w-lg mx-auto pb-10">
          {/* Skeleton Card */}
          <div className="bg-white rounded-[2rem] shadow-xl p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gray-200 animate-pulse" />
              <div className="flex-1">
                <div className="w-32 h-6 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="w-20 h-4 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
            {/* Skeleton Progress */}
            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <div className="w-20 h-4 bg-gray-100 rounded animate-pulse" />
                <div className="w-12 h-4 bg-gray-100 rounded animate-pulse" />
              </div>
              <div className="flex flex-wrap gap-2.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-9 h-9 rounded-full bg-gray-100 animate-pulse" />
                ))}
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full animate-pulse" />
            </div>
            {/* Skeleton Button */}
            <div className="w-full h-14 bg-gray-200 rounded-xl animate-pulse" />
          </div>
          {/* Skeleton History */}
          <div className="mt-6 bg-white rounded-2xl p-4">
            <div className="w-24 h-5 bg-gray-200 rounded animate-pulse mb-4" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
                <div className="w-8 h-8 rounded-lg bg-gray-100 animate-pulse" />
                <div className="flex-1">
                  <div className="w-20 h-4 bg-gray-100 rounded animate-pulse mb-1" />
                  <div className="w-32 h-3 bg-gray-50 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </main>
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

  // Tier 2 reward variables
  const tier2Enabled = merchant.tier2_enabled && merchant.tier2_stamps_required;
  const tier2Required = merchant.tier2_stamps_required || 0;
  const tier2Reward = merchant.tier2_reward_description || '';
  const isTier2Ready = tier2Enabled && card.current_stamps >= tier2Required;
  const tier1Required = merchant.stamps_required;
  const currentStamps = card.current_stamps;

  // Effective tier 1 redeemed status - only consider redeemed if points still support it
  // If points were reduced below tier1_required, treat as if not redeemed
  const effectiveTier1Redeemed = tier1RedeemedInCycle && currentStamps >= tier1Required;

  // Get the loyalty icon component for stamps display
  const LoyaltyIcon = getLoyaltyIcon();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(135deg, white 0%, ${merchant.primary_color}20 50%, ${merchant.primary_color}30 100%)` }}>
      {/* Header with premium glassmorphism horizontal design */}
      <header className="relative w-full overflow-hidden">
        <div className="relative mx-auto lg:max-w-lg lg:mt-4 lg:rounded-3xl overflow-hidden bg-white/40 backdrop-blur-xl border-b lg:border border-white/40 shadow-xl shadow-slate-200/50">
          {/* Animated decorative background elements */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.18 }}
            transition={{ duration: 1.2 }}
            className="absolute -top-12 -right-12 w-64 h-64 rounded-full blur-3xl"
            style={{ background: merchant.primary_color }}
          />
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.12 }}
            transition={{ duration: 1.2, delay: 0.3 }}
            className="absolute -bottom-12 -left-12 w-64 h-64 rounded-full blur-3xl"
            style={{ background: merchant.secondary_color || merchant.primary_color }}
          />

          <div className="relative w-full pt-16 pb-8 px-6 flex items-end justify-between min-h-[220px]">
            {/* Back button - Absolute Top Left */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-6 left-6 z-20"
            >
              <Link
                href="/customer/cards"
                className="flex items-center justify-center w-11 h-11 rounded-full bg-white/80 backdrop-blur-xl border border-white/60 shadow-sm transition-all hover:shadow-md hover:bg-white active:scale-90"
              >
                <ArrowLeft className="w-5 h-5 text-slate-800" />
              </Link>
            </motion.div>

            {/* Left Section: Bigger Logo & Stacked Restaurant Name */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-4"
            >
              <div className="relative w-24 h-24 rounded-[2rem] p-1 bg-white/90 shadow-2xl shadow-slate-200/80 border border-white flex items-center justify-center overflow-hidden transform hover:scale-105 transition-transform duration-300">
                {merchant.logo_url ? (
                  <img
                    src={merchant.logo_url}
                    alt={merchant.shop_name}
                    className="w-full h-full object-cover rounded-[1.75rem]"
                  />
                ) : (
                  <div
                    className="w-full h-full rounded-[1.75rem] flex items-center justify-center text-white text-3xl font-black"
                    style={{ background: `linear-gradient(135deg, ${merchant.primary_color}, ${merchant.secondary_color || merchant.primary_color})` }}
                  >
                    {merchant.shop_name[0]}
                  </div>
                )}
              </div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 leading-tight max-w-[180px]">
                {merchant.shop_name}
              </h1>
            </motion.div>

            {/* Right Section: Big First Name & Stacked Status Badge */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col items-end gap-2 text-right mb-1"
            >
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter drop-shadow-sm">
                {card?.customer?.first_name}
              </h2>

              <div className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border shadow-sm backdrop-blur-xl transition-all ${memberCard ? 'bg-amber-100/60 border-amber-200/50 ring-1 ring-amber-200/20' : 'bg-white/60 border-slate-200/40'}`}>
                {memberCard && <Crown className="w-3.5 h-3.5 text-amber-600 fill-amber-500/30" />}
                <span className={`text-[11px] font-bold uppercase tracking-widest ${memberCard ? 'text-amber-800' : 'text-slate-600'}`}>
                  {memberCard ? "Membre VIP" : "Client fidèle"}
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Programme de fidélité label */}
      <div className="w-full max-w-lg mx-auto px-4 mt-4 mb-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 text-center">
          Programme de fidélité
        </p>
      </div>

      <main className="flex-1 px-4 pb-12 w-full max-w-lg mx-auto z-10">
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
                      : (merchant.product_name
                          ? (pendingCount > 1 ? `${merchant.product_name}s` : merchant.product_name)
                          : (pendingCount > 1 ? 'articles' : 'article'))
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

        {/* Offre Exclusive - Moved to top of main content */}
        {offer && offer.active && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 overflow-hidden rounded-2xl shadow-lg shadow-black/5 border border-white/20"
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

        {/* Member Card Badge - Show if customer has an active member card */}
        {memberCard && new Date(memberCard.valid_until) > new Date() && (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowMemberCardModal(true)}
            className="relative w-full group mb-4 p-[1.5px] overflow-hidden rounded-2xl bg-gradient-to-br from-amber-200 via-amber-500 to-amber-200 shadow-xl shadow-amber-900/10"
          >
            <div className="relative flex items-center gap-4 p-3.5 bg-white/80 backdrop-blur-xl rounded-[14.5px] overflow-hidden">
              {/* Internal Glass Highlight */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 via-transparent to-white/30 pointer-events-none" />

              {/* Dynamic Golden Shine */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-200/40 to-transparent -translate-x-full group-hover:animate-shimmer transition-all duration-1000 ease-in-out pointer-events-none" />

              {/* Animated Icon Container */}
              <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40 transition-shadow">
                <motion.div
                  animate={{
                    rotate: [0, -8, 8, -8, 0],
                    y: [0, -2, 0]
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Crown className="w-6 h-6 text-white drop-shadow-md" />
                </motion.div>
                {/* Particle Dots */}
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-200 rounded-full animate-pulse opacity-60" />
                <div className="absolute -bottom-0.5 -left-0.5 w-1.5 h-1.5 bg-amber-300 rounded-full animate-ping opacity-40" />
              </div>

              <div className="relative z-10 flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2">
                  <p className="font-extrabold text-amber-950 text-[13px] tracking-wide uppercase">Membre Privilège</p>
                  <div className="h-1 w-1 rounded-full bg-amber-500 animate-pulse" />
                </div>
                <p className="text-xs font-semibold text-amber-700/90 truncate mt-0.5">
                  {memberCard.program?.benefit_label}
                </p>
              </div>

              <div className="relative z-10">
                <div className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg bg-amber-950 text-white font-bold text-[10px] tracking-widest shadow-lg shadow-amber-900/20 uppercase">
                  VIP
                </div>
              </div>

              {/* Decorative corner accents */}
              <div className="absolute top-0 right-0 p-1">
                <div className="w-8 h-8 border-t-2 border-r-2 border-amber-400/20 rounded-tr-xl" />
              </div>
            </div>
          </motion.button>
        )}


        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-6 overflow-hidden relative"
        >
          {/* Progression Section with Stamp Icons */}
          <div className="mb-8 px-2 space-y-6">
            {tier2Enabled ? (
              /* ═══════════════════════════════════════════════════════════════
                 DUAL TIER DESIGN - Palier 1 et Palier 2
                 ═══════════════════════════════════════════════════════════════ */
              <>
                {/* PALIER 1 SECTION */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-5 rounded-2xl border transition-all duration-500 ${
                    isRewardReady && !effectiveTier1Redeemed
                      ? 'bg-white border-amber-200 shadow-[0_8px_30px_rgb(245,158,11,0.1)]'
                      : effectiveTier1Redeemed
                        ? 'bg-gray-50/50 border-gray-100 opacity-60'
                        : 'bg-white border-gray-100'
                  }`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <Gift className={`w-4 h-4 ${isRewardReady && !effectiveTier1Redeemed ? 'text-amber-500' : 'text-gray-400'}`} />
                      <span className={`text-[11px] font-black uppercase tracking-widest ${isRewardReady && !effectiveTier1Redeemed ? 'text-amber-600' : 'text-gray-400'}`}>
                        Palier 1
                      </span>
                    </div>
                    {effectiveTier1Redeemed ? (
                      <span className="px-2.5 py-1 rounded-full bg-gray-200 text-[10px] font-bold text-gray-500 uppercase">
                        Réclamé
                      </span>
                    ) : isRewardReady ? (
                      <motion.span
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="px-2.5 py-1 rounded-full bg-amber-500 text-[10px] font-black text-white uppercase shadow-lg shadow-amber-200"
                      >
                        Prêt !
                      </motion.span>
                    ) : tier1Required - currentStamps <= 2 ? (
                      <motion.span
                        animate={{ x: [0, -2, 2, 0] }}
                        transition={{ repeat: Infinity, duration: 0.5, repeatDelay: 1 }}
                        className="px-2.5 py-1 rounded-full bg-amber-100 text-[10px] font-black text-amber-700 border border-amber-200"
                      >
                        Plus que {tier1Required - currentStamps} !
                      </motion.span>
                    ) : (
                      <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                        {tier1Required - currentStamps} restants
                      </span>
                    )}
                  </div>

                  {/* Stamps Grid Tier 1 */}
                  <div className="flex flex-wrap gap-2.5 mb-4">
                    {Array.from({ length: tier1Required }).map((_, i) => {
                      const isEarned = i < currentStamps;
                      const isGreyed = effectiveTier1Redeemed;
                      return (
                        <motion.div
                          key={i}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                            isEarned && !isGreyed
                              ? 'text-white shadow-md'
                              : isEarned && isGreyed
                                ? 'bg-gray-300 text-gray-400'
                                : 'bg-gray-50 text-gray-300 border border-gray-100'
                          }`}
                          style={{
                            backgroundColor: isEarned && !isGreyed ? merchant.primary_color : undefined,
                          }}
                        >
                          <LoyaltyIcon className="w-4 h-4" />
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Bottom Progress & Desc - CENTERED */}
                  <div className="space-y-3">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((currentStamps / tier1Required) * 100, 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: effectiveTier1Redeemed ? '#9ca3af' : (isRewardReady ? '#f59e0b' : merchant.primary_color) }}
                      />
                    </div>
                    <p className={`text-center text-sm font-bold ${isRewardReady && !effectiveTier1Redeemed ? 'text-amber-900' : 'text-gray-600'}`}>
                      {merchant.reward_description || 'Cadeau de fidélité'}
                    </p>
                  </div>
                </motion.div>
              </>
            ) : (
              /* ═══════════════════════════════════════════════════════════════
                 SINGLE TIER DESIGN - Plus gros, sans label "Palier 1"
                 ═══════════════════════════════════════════════════════════════ */
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Header with count and status */}
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Progression</p>
                    <p className="text-4xl font-black tracking-tight" style={{ color: merchant.primary_color }}>
                      {currentStamps}<span className="text-gray-300 text-2xl mx-1">/</span><span className="text-gray-400 text-2xl">{tier1Required}</span>
                    </p>
                  </div>
                  {isRewardReady ? (
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-200"
                    >
                      <Gift className="w-5 h-5" />
                      <span className="text-sm font-black uppercase">Prêt !</span>
                    </motion.div>
                  ) : tier1Required - currentStamps <= 2 ? (
                    <motion.div
                      animate={{ x: [0, -3, 3, 0], scale: [1, 1.02, 1] }}
                      transition={{ repeat: Infinity, duration: 0.6, repeatDelay: 1.5 }}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500 text-white shadow-lg shadow-amber-200"
                    >
                      <Zap className="w-4 h-4" />
                      <span className="text-sm font-black">Plus que {tier1Required - currentStamps} !</span>
                    </motion.div>
                  ) : null}
                </div>

                {/* Large Stamps Grid - Centered */}
                <div className="flex flex-wrap justify-center gap-3">
                  {Array.from({ length: tier1Required }).map((_, i) => {
                    const isEarned = i < currentStamps;
                    return (
                      <motion.div
                        key={i}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                          isEarned
                            ? 'text-white shadow-lg'
                            : 'bg-gray-100 text-gray-300 border-2 border-dashed border-gray-200'
                        }`}
                        style={{
                          backgroundColor: isEarned ? merchant.primary_color : undefined,
                          transform: isEarned ? 'scale(1.05)' : 'scale(1)',
                        }}
                      >
                        <LoyaltyIcon className="w-6 h-6" />
                      </motion.div>
                    );
                  })}
                </div>

                {/* Large Progress Bar */}
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((currentStamps / tier1Required) * 100, 100)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{
                      background: isRewardReady
                        ? 'linear-gradient(90deg, #10B981, #059669)'
                        : `linear-gradient(90deg, ${merchant.primary_color}, ${merchant.primary_color}cc)`
                    }}
                  />
                </div>

                {/* Centered Reward Description */}
                <div className="text-center py-4 px-6 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className={`text-base font-bold ${isRewardReady ? 'text-emerald-700' : 'text-gray-700'}`}>
                    {merchant.reward_description || 'Votre récompense fidélité'}
                  </p>
                </div>
              </motion.div>
            )}

            {/* PALIER 2 SECTION */}
            {tier2Enabled && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: currentStamps >= tier1Required ? 1 : 0.5, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`p-5 rounded-2xl border transition-all duration-500 ${
                  isTier2Ready
                    ? 'bg-white border-violet-200 shadow-[0_8px_30px_rgb(124,58,237,0.1)]'
                    : currentStamps >= tier1Required
                      ? 'bg-white border-violet-100'
                      : 'bg-gray-50/30 border-gray-100'
                }`}
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <Trophy className={`w-4 h-4 ${isTier2Ready ? 'text-violet-500' : 'text-gray-400'}`} />
                    <span className={`text-[11px] font-black uppercase tracking-widest ${isTier2Ready ? 'text-violet-600' : 'text-gray-400'}`}>
                      Palier 2
                    </span>
                  </div>
                  {isTier2Ready ? (
                    <motion.span
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="px-2.5 py-1 rounded-full bg-violet-600 text-[10px] font-black text-white uppercase shadow-lg shadow-violet-200"
                    >
                      Débloqué !
                    </motion.span>
                  ) : tier2Required - currentStamps <= 2 ? (
                    <motion.span
                      animate={{ x: [0, -2, 2, 0] }}
                      transition={{ repeat: Infinity, duration: 0.5, repeatDelay: 1 }}
                      className="px-2.5 py-1 rounded-full bg-violet-100 text-[10px] font-black text-violet-700 border border-violet-200"
                    >
                      Plus que {tier2Required - currentStamps} !
                    </motion.span>
                  ) : (
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                      {tier2Required - currentStamps} restants
                    </span>
                  )}
                </div>

                {/* Stamps Grid Tier 2 - Only shows additional stamps needed after tier 1 */}
                <div className="flex flex-wrap gap-2.5 mb-4">
                  {Array.from({ length: tier2Required - tier1Required }).map((_, i) => {
                    const isEarned = currentStamps >= (tier1Required + i + 1);
                    return (
                      <motion.div
                        key={i}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                          isEarned
                            ? 'bg-violet-600 text-white shadow-md'
                            : 'bg-gray-50 text-gray-300 border border-gray-100'
                        }`}
                      >
                        <LoyaltyIcon className="w-4 h-4" />
                      </motion.div>
                    );
                  })}
                </div>

                {/* Bottom Progress & Desc - CENTERED */}
                <div className="space-y-3">
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((Math.max(0, currentStamps - tier1Required) / (tier2Required - tier1Required)) * 100, 100)}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-violet-600 rounded-full"
                    />
                  </div>
                  <p className={`text-center text-sm font-bold ${isTier2Ready ? 'text-violet-900' : 'text-gray-600'}`}>
                    {tier2Reward || 'Récompense Premium'}
                  </p>
                </div>
              </motion.div>
            )}
          </div>

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

          {/* Redeem Buttons - Single tier or Dual tier */}
          {!redeemSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-6 space-y-3"
            >
              {/* Tier 1 Button - Show if reward ready and not already redeemed in cycle */}
              {isRewardReady && !effectiveTier1Redeemed && (
                <Button
                  onClick={() => {
                    setRedeemTier(1);
                    setShowRedeemModal(true);
                  }}
                  className="w-full h-14 rounded-xl text-base font-bold shadow-lg hover:shadow-xl transition-all"
                  style={{
                    background: `linear-gradient(135deg, ${merchant.primary_color}, ${merchant.secondary_color || merchant.primary_color})`
                  }}
                >
                  <Gift className="w-5 h-5 mr-2" />
                  {tier2Enabled ? 'Réclamer palier 1' : 'Profiter de ma récompense'}
                </Button>
              )}

              {/* Tier 2 Button - Show if tier 2 enabled and reward ready */}
              {tier2Enabled && isTier2Ready && (
                <Button
                  onClick={() => {
                    setRedeemTier(2);
                    setShowRedeemModal(true);
                  }}
                  className="w-full h-14 rounded-xl text-base font-bold shadow-lg hover:shadow-xl transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)'
                  }}
                >
                  <Trophy className="w-5 h-5 mr-2" />
                  Réclamer palier 2
                </Button>
              )}

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
                  const LoyaltyIcon = getLoyaltyIcon();
                  return <LoyaltyIcon className="w-4 h-4 text-gray-500" />;
                })()}
              </div>
              Historique
            </h2>
            {(visits.length > 0 || adjustments.length > 0 || redemptions.length > 0) && (
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
                    Voir ({visits.length + adjustments.length + redemptions.length})
                  </>
                )}
              </motion.button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {(visits.length > 0 || adjustments.length > 0 || redemptions.length > 0) ? (
              visitsExpanded ? (
                <motion.ul
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="divide-y divide-gray-50"
                >
                  {/* Combine visits, adjustments, and redemptions, sort by date */}
                  {[
                    ...visits.map((v) => ({
                      type: 'visit' as const,
                      date: v.visited_at,
                      points: v.points_earned || 1,
                      id: v.id,
                      status: v.status || 'confirmed',
                      flagged_reason: v.flagged_reason,
                      tier: undefined as number | undefined
                    })),
                    ...adjustments.map((a) => ({
                      type: 'adjustment' as const,
                      date: a.created_at,
                      points: a.adjustment,
                      reason: a.reason,
                      id: a.id,
                      status: 'confirmed' as const,
                      flagged_reason: null,
                      tier: undefined as number | undefined
                    })),
                    ...redemptions.map((r) => ({
                      type: 'redemption' as const,
                      date: r.redeemed_at,
                      points: r.stamps_used,
                      id: r.id,
                      status: 'confirmed' as const,
                      flagged_reason: null,
                      tier: r.tier
                    })),
                  ]
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 10) // Limit to 10 items for performance
                    .map((item, index) => {
                      const LoyaltyIcon = getLoyaltyIcon();
                      const isAdjustment = item.type === 'adjustment';
                      const isRedemption = item.type === 'redemption';
                      const isPending = item.status === 'pending';
                      const isRejected = item.status === 'rejected';

                      const getStatusIcon = () => {
                        if (isRedemption) {
                          return item.tier === 2
                            ? <Trophy className="w-4 h-4 text-violet-500" />
                            : <Gift className="w-4 h-4 text-emerald-500" />;
                        }
                        if (isAdjustment) return <SlidersHorizontal className="w-4 h-4 text-amber-600" />;
                        if (isPending) return <Hourglass className="w-4 h-4 text-amber-600 animate-pulse" />;
                        if (isRejected) return <XCircle className="w-4 h-4 text-red-500" />;
                        return <LoyaltyIcon className="w-4 h-4" style={{ color: merchant.primary_color }} />;
                      };

                      const getIconBgColor = () => {
                        if (isRedemption) return item.tier === 2 ? '#ede9fe' : '#d1fae5';
                        if (isAdjustment) return '#fef3c7';
                        if (isPending) return '#fef3c7';
                        if (isRejected) return '#fee2e2';
                        return `${merchant.primary_color}10`;
                      };

                      const getLabel = () => {
                        if (isRedemption) {
                          const tierLabel = merchant.tier2_enabled ? ` palier ${item.tier}` : '';
                          return `🎁 Cadeau${tierLabel} utilisé`;
                        }
                        if (isAdjustment) return 'Ajustement';
                        if (isPending) return 'En attente';
                        if (isRejected) return 'Refusé';
                        if (merchant.loyalty_mode === 'visit') return 'Passage validé';
                        return `${item.points} ${merchant.product_name || 'article'}${item.points > 1 ? 's' : ''}`;
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
                            <p className={`font-semibold text-sm truncate ${isRejected ? 'text-gray-500 line-through' : isRedemption ? 'text-emerald-700' : 'text-gray-900'}`}>
                              {getLabel()}
                            </p>
                            <p className="text-[10px] text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDateTime(item.date)}
                            </p>
                          </div>
                          {!isRedemption && (
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
                          )}
                          {isRedemption && (
                            <div className={`px-2 py-1 rounded-lg text-xs font-bold ${item.tier === 2 ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700'}`}>
                              ✓
                            </div>
                          )}
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
                    const LoyaltyIcon = getLoyaltyIcon();
                    return <LoyaltyIcon className="w-6 h-6 text-gray-300" />;
                  })()}
                </div>
                <p className="text-gray-500 font-medium text-sm">Aucun historique</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Review Section - Minimalist Card */}
        {merchant.review_link && merchant.review_link.trim() !== '' && !reviewDismissed && !reviewPermanentlyHidden && (
          <div className="mt-8 px-4">
            <div className="relative group bg-white/90 backdrop-blur-sm rounded-2xl py-5 px-6 shadow-sm border border-gray-100/80">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  localStorage.setItem(`qarte_review_hidden_${merchantId}`, 'true');
                  setReviewPermanentlyHidden(true);
                }}
                className="absolute top-2 right-2 p-1.5 text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full hover:bg-gray-100"
                aria-label="Masquer"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <div className="flex flex-col items-center text-center">
                <p className="text-[10px] uppercase tracking-[0.15em] text-gray-400 font-semibold mb-2">
                  {merchant.shop_name} vous remercie
                </p>

                <div className="flex items-center justify-center gap-3 mb-3 w-full max-w-[200px]">
                  <div className="h-px flex-1 bg-gray-200" />
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <div className="h-px flex-1 bg-gray-200" />
                </div>

                <a
                  href={merchant.review_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors duration-200 group/link"
                >
                  Laisser un avis
                  <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/link:translate-x-0.5" />
                </a>
              </div>
            </div>
          </div>
        )}

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
        title={redeemSuccess ? "Félicitations !" : `Récompense ${tier2Enabled ? `Palier ${redeemTier}` : ''}`}
      >
        <div className="relative overflow-hidden rounded-2xl p-1">
          {/* Ambient Background Particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-white/40"
                animate={{
                  y: [0, -100],
                  x: [0, Math.sin(i) * 50],
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                }}
                transition={{
                  duration: 3 + i,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: "easeOut"
                }}
                style={{
                  left: `${15 + i * 15}%`,
                  bottom: "-10%",
                }}
              />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative z-10 p-6 rounded-xl border border-white/40 backdrop-blur-xl shadow-2xl overflow-hidden
              ${redeemTier === 2
                ? 'bg-gradient-to-br from-violet-500/10 via-white/80 to-amber-500/10'
                : 'bg-white/80'
              }`}
          >
            {/* Animated Shine Effect */}
            <motion.div
              initial={{ x: "-150%" }}
              animate={{ x: "200%" }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", repeatDelay: 2 }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 pointer-events-none"
            />

            <div className="text-center">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: [0.8, 1.1, 1], rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.5, type: "spring" }}
                className="relative inline-block mb-6"
              >
                {/* Glow Ring */}
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className={`absolute inset-0 rounded-full blur-xl ${redeemTier === 2 ? 'bg-violet-400' : ''}`}
                  style={{ backgroundColor: redeemTier !== 2 ? `${merchant.primary_color}40` : undefined }}
                />

                <div className={`relative flex items-center justify-center w-20 h-20 rounded-2xl shadow-lg
                  ${redeemTier === 2 ? 'bg-gradient-to-br from-violet-600 to-indigo-600' : 'border border-white/20'}`}
                  style={{ backgroundColor: redeemTier !== 2 ? merchant.primary_color : undefined }}
                >
                  {redeemSuccess ? (
                    <Check className="w-10 h-10 text-white" />
                  ) : (
                    redeemTier === 2 ? <Trophy className="w-10 h-10 text-white" /> : <Gift className="w-10 h-10 text-white" />
                  )}
                </div>
              </motion.div>

              <div className="space-y-2 mb-8">
                <h3 className={`text-2xl font-black tracking-tight ${redeemTier === 2 ? 'text-violet-900' : 'text-gray-900'}`}>
                  {redeemSuccess
                    ? (redeemTier === 2 ? 'Privilège Débloqué !' : 'Cadeau Validé !')
                    : (redeemTier === 2 ? tier2Reward : merchant.reward_description)
                  }
                </h3>
                <p className="text-gray-600 font-medium px-4 leading-relaxed">
                  {redeemSuccess
                    ? (redeemTier === 2 || !tier2Enabled
                        ? 'Votre fidélité a été récompensée. À très bientôt !'
                        : 'Vos points sont préservés. Le palier 2 vous attend !')
                    : 'Présentez ce coupon digital au commerçant pour profiter de votre offre.'
                  }
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => redeemSuccess ? (setShowRedeemModal(false), setRedeemSuccess(false)) : handleRedeem(redeemTier)}
                  loading={redeeming}
                  className={`w-full h-14 text-lg font-bold rounded-xl transition-all duration-300 transform active:scale-95 shadow-xl hover:shadow-2xl hover:-translate-y-0.5
                    ${redeemTier === 2 ? 'bg-gradient-to-r from-violet-600 to-indigo-600 border-none' : ''}`}
                  style={{ backgroundColor: redeemTier !== 2 ? merchant.primary_color : undefined }}
                >
                  {redeemSuccess ? 'Fermer' : 'Valider maintenant'}
                </Button>

                {!redeemSuccess && (
                  <button
                    onClick={() => setShowRedeemModal(false)}
                    className="w-full py-2 text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Plus tard
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </Modal>

      {/* Member Card Modal - Credit Card Style */}
      <Modal
        isOpen={showMemberCardModal}
        onClose={() => setShowMemberCardModal(false)}
        title=""
      >
        {memberCard && (
          <div className="py-2">
            {/* Credit Card Container */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, rotateY: -10 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="relative w-full mx-auto overflow-hidden rounded-2xl shadow-2xl"
              style={{ aspectRatio: '1.58/1' }}
            >
              {/* Card Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-amber-950" />

              {/* Holographic Pattern Overlay */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: `repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 2px,
                    rgba(251,191,36,0.3) 2px,
                    rgba(251,191,36,0.3) 4px
                  )`
                }} />
              </div>

              {/* Animated Shine Sweep */}
              <motion.div
                animate={{
                  x: ['-100%', '200%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: 2,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
              />

              {/* Card Content */}
              <div className="relative h-full p-5 flex flex-col justify-between">
                {/* Top Section: Crown + Program Name */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {/* Golden Crown Icon */}
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                      <Crown className="w-5 h-5 text-white drop-shadow-sm" />
                    </div>
                    <div>
                      <p className="text-amber-400 text-[10px] font-bold uppercase tracking-widest">
                        {memberCard.program?.name || 'Programme VIP'}
                      </p>
                      <p className="text-white/60 text-[9px] font-medium mt-0.5">
                        {merchant.shop_name}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    new Date(memberCard.valid_until) > new Date()
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {new Date(memberCard.valid_until) > new Date() ? 'Actif' : 'Expiré'}
                  </div>
                </div>

                {/* Middle Section: Benefit + Logo Watermark */}
                <div className="flex items-center justify-between">
                  {/* Benefit Pill */}
                  <div className="flex-1">
                    <p className="text-amber-400/70 text-[8px] font-semibold uppercase tracking-wider mb-1">Avantage</p>
                    <div className="inline-block px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 rounded-lg">
                      <p className="text-amber-100 text-xs font-bold truncate max-w-[140px]">
                        {memberCard.program?.benefit_label}
                      </p>
                    </div>
                  </div>

                  {/* Qarte Logo Watermark (Middle-Right) */}
                  <div className="w-11 h-11 rounded-xl border border-amber-500/20 flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-white/5 to-transparent shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]">
                    <span className="text-2xl font-bold text-amber-500/20 select-none">Q</span>
                    <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 via-transparent to-amber-200/5 pointer-events-none" />
                  </div>
                </div>

                {/* Bottom Section: Customer Name + Expiry */}
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-white/40 text-[8px] font-medium uppercase tracking-wider mb-1">Titulaire</p>
                    <p className="text-white text-sm font-bold tracking-wide uppercase">
                      {card?.customer?.first_name} {card?.customer?.last_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/40 text-[8px] font-medium uppercase tracking-wider mb-1">Valable jusqu&apos;au</p>
                    <p className="text-white text-sm font-bold tracking-wider font-mono">
                      {new Date(memberCard.valid_until).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Subtle Card Edge Glow */}
              <div className="absolute inset-0 rounded-2xl border border-amber-500/20 pointer-events-none" />
            </motion.div>

            {/* Card Reference */}
            <div className="mt-4 text-center">
              <p className="text-[10px] text-gray-400 font-medium tracking-wider">
                REF: {memberCard.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
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
                  `0 0 0 0 ${merchant.primary_color}40`,
                  `0 0 0 8px ${merchant.primary_color}00`,
                  `0 0 0 0 ${merchant.primary_color}40`
                ],
                opacity: [1, 0.85, 1]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border-2"
              style={{
                backgroundColor: '#ffffff',
                borderColor: merchant.primary_color,
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
