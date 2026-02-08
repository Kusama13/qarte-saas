'use client';

import { useState, useEffect, use, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  Gift,
  Loader2,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Footprints,
  Hourglass,
  Shield,
  Bell,
  Sparkles,
  Zap,
  Trophy,
  Crown,
  Eye,
  QrCode,
  ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isIOSDevice, isStandalonePWA } from '@/lib/push';
import { Button, Modal } from '@/components/ui';
import { trackPwaInstalled } from '@/lib/analytics';
import { formatPhoneNumber, ensureTextContrast } from '@/lib/utils';
import type { Merchant, LoyaltyCard, Customer, Visit, VisitStatus, MemberCard } from '@/types';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { HistorySection, ExclusiveOffer, MemberCardModal, InstallPrompts, ReviewPrompt } from '@/components/loyalty';

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
  const searchParams = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';
  const isOnboarding = searchParams.get('onboarding') === 'true';
  const isDemo = searchParams.get('demo') === 'true';
  const scanSuccess = searchParams.get('scan_success') === '1';
  const scanRedeemed = searchParams.get('redeemed') === '1';
  const [showScanSuccess, setShowScanSuccess] = useState(false);
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
  const [pendingCount, setPendingCount] = useState(0);
  const [showInstallBar, setShowInstallBar] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

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

  const [isMobile, setIsMobile] = useState(false);

  // Push notifications (shared hook)
  const push = usePushNotifications({
    customerId: card?.customer?.id,
    skip: isPreview,
  });

  // Scan success banner: show then clean URL params
  useEffect(() => {
    if (scanSuccess) {
      setShowScanSuccess(true);
      // Clean URL params without triggering navigation
      const url = new URL(window.location.href);
      url.searchParams.delete('scan_success');
      url.searchParams.delete('points');
      url.searchParams.delete('redeemed');
      window.history.replaceState({}, '', url.toString());
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => setShowScanSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [scanSuccess]);

  useEffect(() => {
    const fetchData = async () => {
      // Preview mode: fetch merchant data only and create mock card
      if (isPreview) {
        try {
          // Demo merchants: hardcoded data, no API call
          const demoMerchants: Record<string, { id: string; shop_name: string; shop_type: string; logo_url: string | null; primary_color: string; secondary_color: string; stamps_required: number; reward_description: string; tier2_enabled: boolean; tier2_stamps_required: number | null; tier2_reward_description: string | null; loyalty_mode: string; product_name: string | null; review_link: string | null }> = {
            'demo-coiffeur': {
              id: 'demo-coiffeur', shop_name: 'Le Salon de Clara', shop_type: 'coiffeur',
              logo_url: null, primary_color: '#D97706', secondary_color: '#F59E0B',
              stamps_required: 10, reward_description: 'Un brushing offert',
              tier2_enabled: false, tier2_stamps_required: null, tier2_reward_description: null,
              loyalty_mode: 'visit', product_name: null, review_link: 'https://g.page/example',
            },
            'demo-onglerie': {
              id: 'demo-onglerie', shop_name: 'Nails & Beauty', shop_type: 'onglerie',
              logo_url: null, primary_color: '#EC4899', secondary_color: '#F472B6',
              stamps_required: 8, reward_description: 'Une pose gel offerte',
              tier2_enabled: true, tier2_stamps_required: 15, tier2_reward_description: 'Un soin complet des mains offert',
              loyalty_mode: 'visit', product_name: null, review_link: null,
            },
            'demo-institut': {
              id: 'demo-institut', shop_name: 'Institut Éclat', shop_type: 'institut_beaute',
              logo_url: null, primary_color: '#8B5CF6', secondary_color: '#A78BFA',
              stamps_required: 8, reward_description: 'Un soin visage offert',
              tier2_enabled: false, tier2_stamps_required: null, tier2_reward_description: null,
              loyalty_mode: 'visit', product_name: null, review_link: 'https://g.page/example-institut',
            },
          };

          let m;
          if (merchantId.startsWith('demo-')) {
            m = demoMerchants[merchantId];
            if (!m) { router.push('/'); return; }
          } else {
            const response = await fetch(`/api/merchants/preview?id=${merchantId}`);
            const data = await response.json();
            if (!response.ok || !data.merchant) {
              router.push('/customer/cards');
              return;
            }
            m = data.merchant;
          }
          // Simulate ~80% progress on tier 1 (shows "almost there" state)
          const tier1 = m.stamps_required || 10;
          const demoStamps = Math.max(1, tier1 - 2);
          setCard({
            id: 'preview',
            customer_id: 'preview',
            merchant_id: merchantId,
            current_stamps: demoStamps,
            stamps_target: tier1,
            last_visit_date: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            merchant: {
              ...m,
              phone: '',
              user_id: '',
              slug: '',
              scan_code: '',
              shop_address: null,
              program_name: null,
              welcome_message: null,
              promo_message: null,
              max_quantity_per_scan: 1,
              trial_ends_at: '',
              stripe_customer_id: null,
              subscription_status: 'active',
              onboarding_completed: true,
              shield_enabled: false,
              created_at: '',
              updated_at: '',
            } as Merchant,
            customer: {
              id: 'preview',
              phone_number: '0600000000',
              first_name: 'Marie',
              last_name: null,
              created_at: new Date().toISOString(),
            },
          } as CardWithDetails);

          // Demo VIP member card
          const inSixMonths = new Date();
          inSixMonths.setMonth(inSixMonths.getMonth() + 6);
          setMemberCard({
            id: 'preview',
            program_id: 'preview',
            customer_id: 'preview',
            valid_from: new Date().toISOString(),
            valid_until: inSixMonths.toISOString(),
            created_at: new Date().toISOString(),
            program: {
              id: 'preview',
              merchant_id: merchantId,
              name: 'Programme VIP',
              benefit_label: '-10% sur toutes les prestations',
              duration_months: 6,
              is_active: true,
              created_at: new Date().toISOString(),
            },
          });

          // Demo marketing offer
          const inOneWeek = new Date();
          inOneWeek.setDate(inOneWeek.getDate() + 7);
          setOffer({
            active: true,
            title: 'Offre de bienvenue : -20% cette semaine',
            description: 'Profitez de -20% sur votre prochaine prestation. Offre réservée à nos clients fidèles !',
            imageUrl: null,
            expiresAt: inOneWeek.toISOString(),
          });

          // Demo visits
          const demoVisit = (id: string, daysAgo: number): VisitWithStatus => ({
            id,
            loyalty_card_id: 'preview',
            merchant_id: merchantId,
            customer_id: 'preview',
            points_earned: 1,
            visited_at: new Date(Date.now() - daysAgo * 86400000).toISOString(),
            ip_address: null,
            ip_hash: null,
            status: 'confirmed' as VisitStatus,
            flagged_reason: null,
          });
          setVisits([demoVisit('1', 2), demoVisit('2', 7), demoVisit('3', 14)]);
        } catch {
          router.push('/customer/cards');
          return;
        }
        setLoading(false);
        return;
      }

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

    // Skip PWA/tracking in preview mode
    if (isPreview) return;

    const iOS = isIOSDevice();
    const standalone = isStandalonePWA();

    // Track PWA installation (only once per device)
    if (standalone) {
      const pwaTracked = localStorage.getItem('qarte_pwa_tracked');
      if (!pwaTracked) {
        localStorage.setItem('qarte_pwa_tracked', 'true');
        trackPwaInstalled(merchantId);
      }
    }

    // Detect mobile device for install bar and push notifications
    const isAndroid = /android/i.test(navigator.userAgent);
    const mobileDevice = iOS || isAndroid;
    setIsMobile(mobileDevice);

    // Smart install bar timing (show after 3s if not dismissed in last 7 days)
    if (!standalone && mobileDevice) {
      const dismissed = localStorage.getItem('qarte_install_dismissed');
      let shouldShow = true;
      if (dismissed) {
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - parseInt(dismissed, 10) < sevenDays) {
          shouldShow = false;
        }
      }
      if (shouldShow) {
        setTimeout(() => setShowInstallBar(true), 3000);
      }
    }
  }, [merchantId, router, isPreview]);

  // Auto-subscribe to push notifications when PWA is first opened (once per 24h)
  useEffect(() => {
    if (
      card &&
      push.isStandalone &&
      !push.pushSubscribed &&
      push.pushPermission !== 'denied' &&
      push.pushSupported &&
      !push.pushSubscribing
    ) {
      const lastAttempt = localStorage.getItem('qarte_auto_subscribe_attempted');
      if (lastAttempt && Date.now() - parseInt(lastAttempt, 10) < 24 * 60 * 60 * 1000) return;

      localStorage.setItem('qarte_auto_subscribe_attempted', Date.now().toString());

      const timer = setTimeout(() => {
        push.handlePushSubscribe();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [card, push]);

  // Capture Android beforeinstallprompt event for native install
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    const installedHandler = () => {
      setShowInstallBar(false);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleDismissInstallBar = useCallback(() => {
    setShowInstallBar(false);
    localStorage.setItem('qarte_install_dismissed', Date.now().toString());
  }, []);

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

    setRedeeming(true);

    try {
      const response = await fetch('/api/redeem-public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loyalty_card_id: card.id,
          customer_id: card.customer_id,
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
        <Link
          href={isDemo ? '/' : isPreview ? '/dashboard/program' : '/customer/cards'}
          className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
        >
          Retour
        </Link>
      </div>
    );
  }

  const { merchant } = card;
  // Ensure merchant color has enough contrast on white for text usage
  const safeColor = ensureTextContrast(merchant.primary_color);
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

  // Whether the sticky redeem bar is visible (used for z-index priority over PWA install bar)
  const isRewardSticky = !redeemSuccess && ((isRewardReady && !effectiveTier1Redeemed) || (tier2Enabled && isTier2Ready));

  // Get the loyalty icon component for stamps display
  const LoyaltyIcon = getLoyaltyIcon();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(160deg, ${merchant.primary_color}15 0%, ${merchant.primary_color}40 40%, ${merchant.primary_color}60 70%, ${merchant.primary_color}35 100%)` }}>
      {/* Preview Mode Banner */}
      {isPreview && (
        <div className={`sticky top-0 z-50 ${isDemo ? 'bg-gradient-to-r from-indigo-600 to-violet-600' : 'bg-indigo-600'} text-white text-center py-2.5 px-4 text-sm font-semibold flex items-center justify-center gap-2 shadow-lg`}>
          <Eye className="w-4 h-4" />
          {isDemo
            ? 'Exemple de carte de fidélité — Essayez gratuitement !'
            : isOnboarding
              ? 'Voici ce que verront vos clients !'
              : 'Mode prévisualisation — Vos clients verront cette carte'}
        </div>
      )}
      {/* Demo type selector */}
      {isPreview && isDemo && (
        <div className="sticky top-[42px] z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 py-2 px-4">
          <div className="flex items-center justify-center gap-2">
            {[
              { id: 'demo-coiffeur', label: 'Coiffeur', emoji: '💇‍♀️' },
              { id: 'demo-onglerie', label: 'Onglerie', emoji: '💅' },
              { id: 'demo-institut', label: 'Institut', emoji: '✨' },
            ].map((demo) => (
              <Link
                key={demo.id}
                href={`/customer/card/${demo.id}?preview=true&demo=true`}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  merchantId === demo.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {demo.emoji} {demo.label}
              </Link>
            ))}
          </div>
        </div>
      )}
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

          <div className="relative w-full pt-14 pb-6 px-5 flex items-end justify-between min-h-[180px]">
            {/* Back button - Absolute Top Left */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-4 left-4 z-20"
            >
              <Link
                href={isDemo ? '/' : isPreview ? '/dashboard/program' : '/customer/cards'}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-white/80 backdrop-blur-xl border border-white/60 shadow-sm transition-all hover:shadow-md hover:bg-white active:scale-90"
              >
                <ArrowLeft className="w-5 h-5 text-slate-800" />
              </Link>
            </motion.div>

            {/* Left Section: Logo & Shop Name */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-3"
            >
              <div className="relative w-20 h-20 rounded-[1.5rem] p-1 bg-white/90 shadow-2xl shadow-slate-200/80 border border-white flex items-center justify-center overflow-hidden">
                {merchant.logo_url ? (
                  <img
                    src={merchant.logo_url}
                    alt={merchant.shop_name}
                    className="w-full h-full object-cover rounded-[1.25rem]"
                  />
                ) : (
                  <div
                    className="w-full h-full rounded-[1.25rem] flex items-center justify-center text-white text-2xl font-black"
                    style={{ background: `linear-gradient(135deg, ${merchant.primary_color}, ${merchant.secondary_color || merchant.primary_color})` }}
                  >
                    {merchant.shop_name[0]}
                  </div>
                )}
              </div>
              <h1 className="text-lg font-black tracking-tight text-slate-900 leading-tight max-w-[220px]">
                {merchant.shop_name}
              </h1>
            </motion.div>

            {/* Right Section: First Name & Status Badge */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col items-end gap-2 text-right mb-1"
            >
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter drop-shadow-sm max-w-[140px] truncate">
                {card?.customer?.first_name}
              </h2>

              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm backdrop-blur-xl transition-all ${memberCard ? 'bg-amber-100/60 border-amber-200/50 ring-1 ring-amber-200/20' : 'bg-white/60 border-slate-200/40'}`}>
                {memberCard && <Crown className="w-3.5 h-3.5 text-amber-600 fill-amber-500/30" />}
                <span className={`text-[11px] font-bold uppercase tracking-widest ${memberCard ? 'text-amber-800' : 'text-slate-600'}`}>
                  {memberCard ? "Membre VIP" : "Client fidèle"}
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      <main className={`flex-1 px-4 pt-4 w-full max-w-lg mx-auto z-10 ${showInstallBar ? 'pb-28' : 'pb-12'}`}>
        {/* Scan Success Banner */}
        <AnimatePresence>
          {showScanSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="mb-3 p-3 rounded-2xl border shadow-md"
              style={{
                background: `linear-gradient(135deg, ${merchant.primary_color}08, white)`,
                borderColor: `${merchant.primary_color}20`,
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${merchant.primary_color}15` }}
                >
                  <Check className="w-5 h-5" style={{ color: merchant.primary_color }} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-sm">
                    {scanRedeemed ? 'Récompense utilisée !' : 'Passage validé !'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {scanRedeemed ? 'Profitez bien de votre cadeau' : 'Votre carte a été mise à jour'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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

        {/* Offre Exclusive */}
        {offer && <ExclusiveOffer offer={offer} merchantColor={merchant.primary_color} isPreview={isPreview} />}

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
            {isPreview && (
              <div className="absolute top-2 right-2 z-20 bg-white/90 backdrop-blur-sm text-[10px] font-bold text-gray-500 px-2 py-0.5 rounded-full border border-gray-200 shadow-sm">
                Exemple — Personnalisable
              </div>
            )}
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
          className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/50 p-6 overflow-hidden relative"
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
                  <div className="grid grid-cols-5 gap-2.5 mb-4">
                    {Array.from({ length: tier1Required }).map((_, i) => {
                      const isEarned = i < currentStamps;
                      const isGreyed = effectiveTier1Redeemed;
                      return (
                        <motion.div
                          key={i}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className={`aspect-square rounded-full flex items-center justify-center transition-all duration-300 ${
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
                    <p
                      className={`text-center text-base font-medium italic line-clamp-2 ${isRewardReady && !effectiveTier1Redeemed ? 'text-amber-900' : 'text-gray-600'}`}
                      style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
                    >
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
                    <p className="text-4xl font-black tracking-tight" style={{ color: safeColor }}>
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
                <div className="grid grid-cols-5 gap-3">
                  {Array.from({ length: tier1Required }).map((_, i) => {
                    const isEarned = i < currentStamps;
                    return (
                      <motion.div
                        key={i}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className={`aspect-square rounded-full flex items-center justify-center transition-all duration-300 ${
                          isEarned
                            ? 'text-white shadow-lg'
                            : 'bg-gray-100 text-gray-300 border-2 border-dashed border-gray-200'
                        }`}
                        style={{
                          backgroundColor: isEarned ? merchant.primary_color : undefined,
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
                <div className="text-center py-5 px-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/60">
                  <p
                    className={`text-lg font-medium italic line-clamp-2 ${isRewardReady ? 'text-emerald-700' : 'text-gray-700'}`}
                    style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
                  >
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
                <div className="grid grid-cols-5 gap-2.5 mb-4">
                  {Array.from({ length: tier2Required - tier1Required }).map((_, i) => {
                    const isEarned = currentStamps >= (tier1Required + i + 1);
                    return (
                      <motion.div
                        key={i}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className={`aspect-square rounded-full flex items-center justify-center transition-all duration-300 ${
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
                  <p
                    className={`text-center text-base font-medium italic line-clamp-2 ${isTier2Ready ? 'text-violet-900' : 'text-gray-600'}`}
                    style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
                  >
                    {tier2Reward || 'Récompense Premium'}
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* PWA Notification Banner - Show in PWA when NOT subscribed */}
          {push.isStandalone && isMobile && !push.pushSubscribed && push.pushPermission !== 'denied' && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.98 }}
              onClick={push.handlePushSubscribe}
              disabled={push.pushSubscribing}
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
                {push.pushSubscribing ? (
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" style={{ color: merchant.primary_color }} />
                ) : (
                  <ChevronRight className="w-4 h-4 shrink-0" style={{ color: merchant.primary_color }} />
                )}
              </div>
            </motion.button>
          )}


          {/* Push Error Display — inline in card flow */}
          {push.pushError && (
            <div className="w-full rounded-2xl p-4 bg-red-50 border border-red-200 flex items-start gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-red-800 text-sm">Erreur d&apos;activation</p>
                <p className="text-xs text-red-600 mt-1">{push.pushError}</p>
                {push.isIOS && (
                  <p className="text-xs text-red-500 mt-2">
                    iOS {push.iOSVersion || '?'} &bull; {push.isStandalone ? 'Mode PWA' : 'Navigateur'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Subscribed confirmation - Small bell icon */}
          {push.pushSubscribed && (
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
                <span className="text-[10px] font-medium" style={{ color: safeColor }}>Notifications actives</span>
              </div>
            </motion.div>
          )}

        </motion.div>

        {/* Historique */}
        <HistorySection visits={visits} adjustments={adjustments} redemptions={redemptions} merchant={merchant} />

        {/* Avis Google */}
        {merchant.review_link && merchant.review_link.trim() !== '' && (
          <ReviewPrompt merchantId={merchantId} shopName={merchant.shop_name} reviewLink={merchant.review_link} />
        )}

        <footer className="py-6 text-center">
          <a href="/" className="inline-flex items-center gap-1.5 group transition-all duration-300 hover:opacity-70">
            <span className="text-xs text-gray-400 group-hover:text-gray-500">Créé avec ❤️ par</span>
            <div className="w-4 h-4 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-sm flex items-center justify-center">
              <span className="text-white text-[8px] font-black italic">Q</span>
            </div>
            <span className="text-xs font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              Qarte
            </span>
          </a>
        </footer>

        {/* Spacer for sticky redeem button */}
        {isRewardSticky && (
          <div className="h-20" />
        )}
      </main>

      {/* Sticky Redeem Buttons — z-50 to stay above PWA install bar */}
      {isRewardSticky && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-gray-100 px-4 py-3 space-y-2 safe-bottom"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          {isRewardReady && !effectiveTier1Redeemed && (
            <Button
              onClick={() => {
                setRedeemTier(1);
                setShowRedeemModal(true);
              }}
              className="w-full h-12 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all"
              style={{
                background: `linear-gradient(135deg, ${merchant.primary_color}, ${merchant.secondary_color || merchant.primary_color})`
              }}
            >
              <Gift className="w-4 h-4 mr-2" />
              Profiter de ma récompense
            </Button>
          )}
          {tier2Enabled && isTier2Ready && (
            <Button
              onClick={() => {
                setRedeemTier(2);
                setShowRedeemModal(true);
              }}
              className="w-full h-12 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all"
              style={{
                background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)'
              }}
            >
              <Trophy className="w-4 h-4 mr-2" />
              Profiter de ma récompense palier 2
            </Button>
          )}
        </motion.div>
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

      {/* Member Card Modal */}
      {memberCard && (
        <MemberCardModal
          isOpen={showMemberCardModal}
          onClose={() => setShowMemberCardModal(false)}
          memberCard={memberCard}
          merchant={merchant}
          customerFirstName={card?.customer?.first_name}
          customerLastName={card?.customer?.last_name}
        />
      )}

      {/* Push modals, toasts, and install prompts — at root level for correct fixed positioning */}
      <InstallPrompts
        merchant={merchant}
        isIOS={push.isIOS}
        isIOSChrome={push.isIOSChrome}
        isMobile={isMobile}
        isStandalone={push.isStandalone}
        showInstallBar={showInstallBar && !isRewardSticky}
        onDismissInstallBar={handleDismissInstallBar}
        deferredPrompt={deferredPrompt}
        onClearDeferredPrompt={() => setDeferredPrompt(null)}
        showIOSInstructions={push.showIOSInstructions}
        setShowIOSInstructions={push.setShowIOSInstructions}
        showIOSVersionWarning={push.showIOSVersionWarning}
        setShowIOSVersionWarning={push.setShowIOSVersionWarning}
        iOSVersion={push.iOSVersion}
        showSuccessToast={push.showSuccessToast}
      />

      {/* Onboarding CTA - Sticky bottom button to generate QR code */}
      {isPreview && isOnboarding && !isDemo && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/90 backdrop-blur-xl border-t border-gray-200 shadow-2xl shadow-gray-900/10">
          <div className="max-w-lg mx-auto">
            <Link href="/dashboard/qr-download">
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-base rounded-2xl shadow-lg shadow-indigo-200 hover:shadow-xl hover:from-indigo-700 hover:to-violet-700 transition-all active:scale-[0.98]"
              >
                <QrCode className="w-5 h-5" />
                Valider et générer mon QR code
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
          </div>
        </div>
      )}

      {/* Demo CTA - Sticky bottom button to sign up */}
      {isPreview && isDemo && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/90 backdrop-blur-xl border-t border-gray-200 shadow-2xl shadow-gray-900/10">
          <div className="max-w-lg mx-auto">
            <Link href="/auth/merchant/signup">
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-base rounded-2xl shadow-lg shadow-indigo-200 hover:shadow-xl hover:from-indigo-700 hover:to-violet-700 transition-all active:scale-[0.98]"
              >
                <Sparkles className="w-5 h-5" />
                Créer mon programme gratuit
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
