'use client';

import { useState, useEffect, use, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  Loader2,
  AlertCircle,
  ChevronRight,
  Hourglass,
  Shield,
  Bell,
  Sparkles,
  Crown,
  Eye,
  QrCode,
  ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isIOSDevice, isStandalonePWA } from '@/lib/push';
import { trackPwaInstalled } from '@/lib/analytics';
import { formatPhoneNumber, ensureTextContrast } from '@/lib/utils';
import type { Merchant, LoyaltyCard, Customer, Visit, VisitStatus, MemberCard } from '@/types';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import {
  HistorySection,
  ExclusiveOffer,
  MemberCardModal,
  InstallPrompts,
  ReviewPrompt,
  StampsSection,
  RewardCard,
  RedeemModal,
  StickyRedeemBar,
  SocialLinks,
} from '@/components/loyalty';

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

const getLoyaltyLabel = (count: number) => {
  return count === 1 ? 'Passage' : 'Passages';
};

interface MerchantOffer {
  active: boolean;
  title: string;
  description: string;
  imageUrl: string | null;
  expiresAt: string | null;
}

const DEMO_MERCHANTS: Record<string, { id: string; shop_name: string; shop_type: string; logo_url: string | null; primary_color: string; secondary_color: string; stamps_required: number; reward_description: string; tier2_enabled: boolean; tier2_stamps_required: number | null; tier2_reward_description: string | null; loyalty_mode: string; product_name: string | null; review_link: string | null; instagram_url: string | null; facebook_url: string | null; tiktok_url: string | null; scan_code: string }> = {
  'demo-coiffeur': {
    id: 'demo-coiffeur', shop_name: 'Le Salon de Clara', shop_type: 'coiffeur',
    logo_url: null, primary_color: '#D97706', secondary_color: '#F59E0B',
    stamps_required: 10, reward_description: 'Un brushing offert',
    tier2_enabled: false, tier2_stamps_required: null, tier2_reward_description: null,
    loyalty_mode: 'visit', product_name: null, review_link: 'https://g.page/example',
    instagram_url: 'https://instagram.com/lesalonclara', facebook_url: 'https://facebook.com/lesalonclara', tiktok_url: 'https://tiktok.com/@lesalonclara', scan_code: 'demo-coiffeur',
  },
  'demo-onglerie': {
    id: 'demo-onglerie', shop_name: 'Nails & Beauty', shop_type: 'onglerie',
    logo_url: null, primary_color: '#EC4899', secondary_color: '#F472B6',
    stamps_required: 8, reward_description: 'Une pose gel offerte',
    tier2_enabled: true, tier2_stamps_required: 15, tier2_reward_description: 'Un soin complet des mains offert',
    loyalty_mode: 'visit', product_name: null, review_link: null,
    instagram_url: 'https://instagram.com/nailsandbeauty', facebook_url: 'https://facebook.com/nailsandbeauty', tiktok_url: 'https://tiktok.com/@nailsandbeauty', scan_code: 'demo-onglerie',
  },
  'demo-institut': {
    id: 'demo-institut', shop_name: 'Institut Éclat', shop_type: 'institut_beaute',
    logo_url: null, primary_color: '#8B5CF6', secondary_color: '#A78BFA',
    stamps_required: 8, reward_description: 'Un soin visage offert',
    tier2_enabled: false, tier2_stamps_required: null, tier2_reward_description: null,
    loyalty_mode: 'visit', product_name: null, review_link: 'https://g.page/example-institut',
    instagram_url: 'https://instagram.com/instituteclat', facebook_url: 'https://facebook.com/instituteclat', tiktok_url: 'https://tiktok.com/@instituteclat', scan_code: 'demo-institut',
  },
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
  const [offer, setOffer] = useState<MerchantOffer | null>(null);

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
          let m;
          if (merchantId.startsWith('demo-')) {
            m = DEMO_MERCHANTS[merchantId];
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

  // Memoized computed state — must be before early returns (Rules of Hooks)
  const {
    isRewardReady,
    isTier2Ready,
    effectiveTier1Redeemed,
    isRewardSticky,
    isMemberCardActive,
    rewardShowingTier2,
    rewardCardReady,
    rewardCardDescription,
    rewardCardRemaining,
    rewardCardTierLabel,
  } = useMemo(() => {
    if (!card) {
      return {
        isRewardReady: false,
        isTier2Ready: false,
        effectiveTier1Redeemed: false,
        isRewardSticky: false,
        isMemberCardActive: false,
        rewardShowingTier2: false,
        rewardCardReady: false,
        rewardCardDescription: '',
        rewardCardRemaining: 0,
        rewardCardTierLabel: '',
      };
    }
    const _currentStamps = card.current_stamps;
    const _tier1Required = card.merchant.stamps_required;
    const _tier2Enabled = card.merchant.tier2_enabled && card.merchant.tier2_stamps_required;
    const _tier2Required = card.merchant.tier2_stamps_required || 0;
    const _tier2Reward = card.merchant.tier2_reward_description || '';

    const _isRewardReady = _currentStamps >= _tier1Required;
    const _isTier2Ready = !!_tier2Enabled && _currentStamps >= _tier2Required;
    const _effectiveTier1Redeemed = tier1RedeemedInCycle && _currentStamps >= _tier1Required;
    const _isRewardSticky = !redeemSuccess && ((_isRewardReady && !_effectiveTier1Redeemed) || (!!_tier2Enabled && _isTier2Ready));
    const _isMemberCardActive = !!memberCard && new Date(memberCard.valid_until) > new Date();
    const _showingTier2 = !!_tier2Enabled && _effectiveTier1Redeemed;

    return {
      isRewardReady: _isRewardReady,
      isTier2Ready: _isTier2Ready,
      effectiveTier1Redeemed: _effectiveTier1Redeemed,
      isRewardSticky: _isRewardSticky,
      isMemberCardActive: _isMemberCardActive,
      rewardShowingTier2: _showingTier2,
      rewardCardReady: _showingTier2 ? !!_isTier2Ready : _isRewardReady,
      rewardCardDescription: _showingTier2
        ? (_tier2Reward || 'Récompense Premium')
        : (card.merchant.reward_description || 'Votre récompense fidélité'),
      rewardCardRemaining: _showingTier2
        ? _tier2Required - _currentStamps
        : _tier1Required - _currentStamps,
      rewardCardTierLabel: _tier2Enabled
        ? (_showingTier2 ? 'Palier 2' : 'Palier 1')
        : '',
    };
  }, [card, tier1RedeemedInCycle, redeemSuccess, memberCard]);

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
      <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-50">
        {/* Skeleton Header */}
        <header className="relative w-full">
          <div className="relative mx-auto lg:max-w-lg lg:mt-4 lg:rounded-3xl overflow-hidden">
            <div className="bg-gray-200 animate-pulse flex flex-col items-center pt-16 pb-14 px-5">
              <div className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/20" />
              <div className="w-[88px] h-[88px] rounded-[1.75rem] bg-white/30 mb-4" />
              <div className="w-36 h-6 bg-white/20 rounded-lg mb-2" />
            </div>
          </div>
        </header>
        <main className="px-4 max-w-lg mx-auto pb-10">
          {/* Skeleton Greeting Card */}
          <div className="relative z-10 -mt-8 mb-4 bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100/80 p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="w-16 h-4 bg-gray-100 rounded animate-pulse mb-2" />
                <div className="w-28 h-7 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="w-20 h-7 bg-gray-50 rounded-full animate-pulse" />
            </div>
            <div className="flex items-end justify-between mb-2">
              <div className="w-20 h-10 bg-gray-200 rounded animate-pulse" />
              <div className="w-16 h-4 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full animate-pulse" />
          </div>
          {/* Skeleton Stamps */}
          <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/40 border border-gray-100/80 p-5 mb-4">
            <div className="flex justify-between items-center mb-4">
              <div className="w-20 h-4 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="grid grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="aspect-square rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          </div>
          {/* Skeleton Reward */}
          <div className="mb-4 p-4 rounded-2xl border border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gray-200 animate-pulse shrink-0" />
              <div className="flex-1">
                <div className="w-40 h-5 bg-gray-200 rounded animate-pulse mb-1.5" />
                <div className="w-24 h-3 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          </div>
          {/* Skeleton History */}
          <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100/50 overflow-hidden mb-4">
            <div className="p-4 border-b border-gray-50">
              <div className="w-24 h-5 bg-gray-200 rounded animate-pulse" />
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                <div className="w-9 h-9 rounded-xl bg-gray-100 animate-pulse" />
                <div className="flex-1">
                  <div className="w-24 h-4 bg-gray-100 rounded animate-pulse mb-1" />
                  <div className="w-16 h-3 bg-gray-50 rounded animate-pulse" />
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
  const safeColor = ensureTextContrast(merchant.primary_color);
  const currentStamps = card.current_stamps;
  const tier1Required = merchant.stamps_required;
  const tier2Enabled = merchant.tier2_enabled && merchant.tier2_stamps_required;
  const tier2Required = merchant.tier2_stamps_required || 0;
  const tier2Reward = merchant.tier2_reward_description || '';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(160deg, ${merchant.primary_color}15 0%, ${merchant.primary_color}40 40%, ${merchant.primary_color}60 70%, ${merchant.primary_color}35 100%)` }}>
      {/* Preview Mode Banner */}
      {isPreview && (
        <div className="sticky top-0 z-50 shadow-lg">
          <div className={`${isDemo ? 'bg-gradient-to-r from-indigo-600 to-violet-600' : 'bg-indigo-600'} text-white text-center py-2.5 px-4 text-sm font-semibold flex items-center justify-center gap-2`}>
            <Eye className="w-4 h-4" />
            {isDemo
              ? 'Exemple de carte de fidélité — Essayez gratuitement !'
              : isOnboarding
                ? 'Voici ce que verront vos clients !'
                : 'Mode prévisualisation — Vos clients verront cette carte'}
          </div>
          {!isDemo && (
            <Link
              href="/dashboard/qr-download"
              className="flex items-center justify-center gap-2 bg-indigo-500 text-white text-xs font-medium py-2 px-4 hover:bg-indigo-400 transition-colors"
            >
              <QrCode className="w-3.5 h-3.5" />
              L&apos;aperçu vous convient ? Téléchargez votre QR code
            </Link>
          )}
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
      {/* Header — Immersive centered design */}
      <header className="relative w-full overflow-hidden">
        <div className="relative mx-auto lg:max-w-lg lg:mt-4 lg:rounded-3xl overflow-hidden">
          {/* Full gradient background */}
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(160deg, ${merchant.primary_color}, ${merchant.secondary_color || merchant.primary_color})` }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent)]" />

          {/* Back button */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 left-4 z-20"
          >
            <Link
              href={isDemo ? '/' : isPreview ? '/dashboard/program' : '/customer/cards'}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 transition-all hover:bg-white/30 active:scale-90"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
          </motion.div>

          {/* Centered content */}
          <div className="relative flex flex-col items-center pt-16 pb-14 px-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-[88px] h-[88px] rounded-[1.75rem] p-1 bg-white/90 shadow-2xl border border-white/60 flex items-center justify-center overflow-hidden mb-4"
            >
              {merchant.logo_url ? (
                <img
                  src={merchant.logo_url}
                  alt={merchant.shop_name}
                  className="w-full h-full object-cover rounded-[1.5rem]"
                />
              ) : (
                <div
                  className="w-full h-full rounded-[1.5rem] flex items-center justify-center text-white text-3xl font-black"
                  style={{ background: `linear-gradient(135deg, ${merchant.primary_color}cc, ${merchant.secondary_color || merchant.primary_color})` }}
                >
                  {merchant.shop_name[0]}
                </div>
              )}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl font-black tracking-tight text-white text-center leading-tight mb-2"
            >
              {merchant.shop_name}
            </motion.h1>

            {memberCard && isMemberCardActive && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setShowMemberCardModal(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all"
              >
                <Crown className="w-3 h-3 text-amber-300" />
                <span className="text-[11px] font-bold text-white/90 uppercase tracking-wider">Membre VIP</span>
              </motion.button>
            )}
          </div>
        </div>
      </header>

      <main className={`flex-1 px-4 w-full max-w-lg mx-auto z-10 ${showInstallBar ? 'pb-28' : 'pb-12'}`}>
        {/* Floating greeting card — overlaps header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="relative z-10 -mt-8 mb-4 bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100/80 p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-gray-500 font-medium">Bonjour</p>
              <p className="text-2xl font-black tracking-tight text-gray-900">{card?.customer?.first_name}</p>
            </div>
            {!memberCard && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Client fidèle</span>
              </div>
            )}
          </div>
          {/* Hero counter + progress */}
          <div className="flex items-end justify-between mb-2">
            <p className="text-4xl font-black tracking-tight" style={{ color: safeColor }}>
              {currentStamps}<span className="text-gray-300 text-2xl mx-0.5">/</span><span className="text-gray-400 text-2xl">{tier2Enabled && effectiveTier1Redeemed ? tier2Required : tier1Required}</span>
            </p>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              {getLoyaltyLabel(currentStamps)}
            </p>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((currentStamps / (tier2Enabled && effectiveTier1Redeemed ? tier2Required : tier1Required)) * 100, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{
                background: isRewardReady
                  ? 'linear-gradient(90deg, #10B981, #059669)'
                  : `linear-gradient(90deg, ${merchant.primary_color}, ${merchant.secondary_color || merchant.primary_color})`
              }}
            />
          </div>
        </motion.div>

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

        {/* Stamps Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="bg-white rounded-2xl shadow-lg shadow-gray-200/40 border border-gray-100/80 p-5 mb-4"
        >
          <StampsSection
            currentStamps={currentStamps}
            tier1Required={tier1Required}
            tier2Enabled={tier2Enabled}
            tier2Required={tier2Required}
            isRewardReady={isRewardReady}
            isTier2Ready={isTier2Ready}
            effectiveTier1Redeemed={effectiveTier1Redeemed}
            merchantColor={merchant.primary_color}
            secondaryColor={merchant.secondary_color}
            rewardDescription={merchant.reward_description || ''}
            tier2Reward={tier2Reward}
          />
        </motion.div>

        {/* Reward card */}
        <RewardCard
          ready={rewardCardReady}
          showingTier2={rewardShowingTier2}
          tierLabel={rewardCardTierLabel}
          description={rewardCardDescription}
          remaining={rewardCardRemaining}
          merchantColor={merchant.primary_color}
          secondaryColor={merchant.secondary_color}
        />

        {/* Member Card Badge — dark premium card */}
        {memberCard && isMemberCardActive && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowMemberCardModal(true)}
            className="relative w-full mb-4 group"
          >
            <div
              className="relative flex items-center gap-3.5 p-4 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 rounded-2xl overflow-hidden shadow-lg shadow-zinc-900/20"
              style={{ border: '1px solid rgba(251,191,36,0.12)' }}
            >
              {/* Shimmer sweep */}
              <motion.div
                animate={{ x: ['-200%', '200%'] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 pointer-events-none"
              />
              {/* Gold ambient glow */}
              <div className="absolute inset-0 pointer-events-none" style={{
                background: 'radial-gradient(ellipse at 15% 50%, rgba(251,191,36,0.06) 0%, transparent 60%)'
              }} />

              <div className="relative z-10 w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25 shrink-0">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div className="relative z-10 flex-1 min-w-0 text-left">
                <p className="text-amber-400 text-[10px] font-bold uppercase tracking-[0.15em]">Membre Privilège</p>
                <p className="text-white/60 text-xs font-medium truncate mt-0.5">{memberCard.program?.benefit_label}</p>
              </div>
              <ChevronRight className="relative z-10 w-4 h-4 text-amber-500/40 shrink-0" />
            </div>
            {isPreview && (
              <div className="absolute top-2.5 right-2.5 z-20 bg-black/60 backdrop-blur-sm text-[9px] font-bold text-white/80 px-2 py-0.5 rounded-full">
                Exemple
              </div>
            )}
          </motion.button>
        )}

        {/* Push Notification Banner */}
        {push.isStandalone && isMobile && !push.pushSubscribed && push.pushPermission !== 'denied' && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.98 }}
            onClick={push.handlePushSubscribe}
            disabled={push.pushSubscribing}
            className="w-full mb-4"
          >
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl border bg-white shadow-sm" style={{ borderColor: `${merchant.primary_color}20` }}>
              <Bell className="w-4 h-4 shrink-0" style={{ color: merchant.primary_color }} />
              <span className="flex-1 text-xs font-medium text-gray-700 text-left">Activer les notifications</span>
              {push.pushSubscribing ? (
                <Loader2 className="w-4 h-4 animate-spin shrink-0" style={{ color: merchant.primary_color }} />
              ) : (
                <ChevronRight className="w-4 h-4 shrink-0" style={{ color: merchant.primary_color }} />
              )}
            </div>
          </motion.button>
        )}

        {/* Push Error */}
        {push.pushError && (
          <div className="w-full rounded-2xl p-4 bg-red-50 border border-red-200 flex items-start gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-red-800 text-sm">Erreur d&apos;activation</p>
              <p className="text-xs text-red-600 mt-1">{push.pushError}</p>
              {push.isIOS && (
                <p className="text-xs text-red-500 mt-2">iOS {push.iOSVersion || '?'} &bull; {push.isStandalone ? 'Mode PWA' : 'Navigateur'}</p>
              )}
            </div>
          </div>
        )}

        {/* Subscribed confirmation */}
        {push.pushSubscribed && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex justify-center mb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ backgroundColor: `${merchant.primary_color}10` }}>
              <Bell className="w-3 h-3" style={{ color: merchant.primary_color }} />
              <span className="text-[10px] font-medium" style={{ color: safeColor }}>Notifications actives</span>
            </div>
          </motion.div>
        )}

        {/* Historique */}
        <HistorySection visits={visits} adjustments={adjustments} redemptions={redemptions} merchant={merchant} />

        {/* Réseaux sociaux + Recommander */}
        <SocialLinks merchant={merchant} />

        {/* Avis Google */}
        {merchant.review_link && merchant.review_link.trim() !== '' && (
          <ReviewPrompt merchantId={merchantId} shopName={merchant.shop_name} reviewLink={merchant.review_link} />
        )}

        <footer className="py-6 text-center">
          <a href="https://www.qarte.fr" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 group transition-all duration-300 hover:opacity-70">
            <span className="text-xs text-gray-400 group-hover:text-gray-500">Propulsé par</span>
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

      {/* Sticky Redeem Buttons */}
      <StickyRedeemBar
        visible={isRewardSticky}
        isRewardReady={isRewardReady}
        effectiveTier1Redeemed={effectiveTier1Redeemed}
        isTier2Ready={isTier2Ready}
        tier2Enabled={tier2Enabled}
        merchantColor={merchant.primary_color}
        secondaryColor={merchant.secondary_color}
        onRedeemTier1={() => { setRedeemTier(1); setShowRedeemModal(true); }}
        onRedeemTier2={() => { setRedeemTier(2); setShowRedeemModal(true); }}
      />

      {/* Redeem Modal */}
      <RedeemModal
        isOpen={showRedeemModal}
        onClose={() => setShowRedeemModal(false)}
        tier={redeemTier}
        tier2Enabled={tier2Enabled}
        rewardDescription={merchant.reward_description || ''}
        tier2Reward={tier2Reward}
        success={redeemSuccess}
        redeeming={redeeming}
        merchantColor={merchant.primary_color}
        onRedeem={handleRedeem}
        onDone={() => { setShowRedeemModal(false); setRedeemSuccess(false); }}
      />

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
                Essayer gratuitement 15 jours
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
