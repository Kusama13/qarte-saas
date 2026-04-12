'use client';

import { useState, useEffect, use, useCallback, useMemo } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import {
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
  UserPlus,
  Users,
  Share2,
  Trophy,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isIOSDevice, isStandalonePWA } from '@/lib/push';
import { trackPwaInstalled } from '@/lib/analytics';
import { ensureTextContrast } from '@/lib/utils';
import { sparkleGrand } from '@/lib/sparkles';
import { DEMO_MERCHANTS_FLAT as DEMO_MERCHANTS } from '@/lib/demo-merchants';
import type { Merchant, LoyaltyCard, Customer, Visit, VisitStatus, MemberCard, Voucher } from '@/types';
import { useTranslations } from 'next-intl';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import {
  HistorySection,
  ExclusiveOffer,
  MemberCardModal,
  InstallPrompts,
  ReviewModal,
  ReviewCard,
  ReferralModal,
  StampsSection,
  CagnotteSection,
  RewardCard,
  RedeemModal,
  SocialLinks,
  CardSkeleton,
  CardHeader,
  BirthdaySection,
  VoucherRewards,
  VoucherModals,
} from '@/components/loyalty';
import UpcomingAppointmentsSection from '@/components/loyalty/UpcomingAppointmentsSection';

interface PointAdjustment {
  id: string;
  adjusted_at: string;
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

// Phone is now in HttpOnly cookie — no client-side reading needed

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getLoyaltyLabel = (count: number, t: any) => {
  return count === 1 ? t('passageSingular') : t('passagePlural');
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getGreetingMessage = (t: any) => {
  const messages = t('greetings').split(',');
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  return messages[dayOfYear % messages.length];
};

interface MerchantOffer {
  active: boolean;
  title: string;
  description: string;
  imageUrl: string | null;
  expiresAt: string | null;
}

export default function CustomerCardPage({
  params,
}: {
  params: Promise<{ merchantId: string }>;
}) {
  const t = useTranslations('customerCard');
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
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);
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

  // Appointments
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pastAppointments, setPastAppointments] = useState<any[]>([]);

  // Vouchers state (referral rewards)
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [usingVoucherId, setUsingVoucherId] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  // Voucher detail modal state
  const [showVoucherDetail, setShowVoucherDetail] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<{ id: string; rewardDescription: string; source: string | null; expiresAt: string | null } | null>(null);

  // Voucher celebration state (post-use)
  const [showVoucherCelebration, setShowVoucherCelebration] = useState(false);
  const [voucherCelebrationData, setVoucherCelebrationData] = useState<{
    rewardDescription: string;
    customerName: string | null;
    bonusStampAdded: boolean;
    isBirthday: boolean;
  } | null>(null);

  // Birthday: track if already set (for BirthdaySection)
  const [hasBirthday, setHasBirthday] = useState(false);

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
          const isCagnotteDemo = m.loyalty_mode === 'cagnotte';
          setCard({
            id: 'preview',
            customer_id: 'preview',
            merchant_id: merchantId,
            current_stamps: demoStamps,
            current_amount: isCagnotteDemo ? 247.50 : 0,
            stamps_target: tier1,
            last_visit_date: new Date().toISOString(),
            referral_code: m.referral_program_enabled ? 'DEMO01' : null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            merchant: {
              ...m,
              phone: '',
              user_id: '',
              slug: '',
              scan_code: m.scan_code || '',
              shop_address: null,
              program_name: null,
              welcome_message: null,
              promo_message: null,
              trial_ends_at: '',
              stripe_customer_id: null,
              subscription_status: 'active',
              onboarding_completed: true,
              shield_enabled: false,
              referral_program_enabled: m.referral_program_enabled || false,
              referral_reward_referrer: m.referral_reward_referrer || null,
              referral_reward_referred: m.referral_reward_referred || null,
              referral_code: '',
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
            title: 'Offre nouveaux clients : -20% cette semaine',
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
            amount_spent: null,
            visited_at: new Date(Date.now() - daysAgo * 86400000).toISOString(),
            ip_address: null,
            ip_hash: null,
            status: 'confirmed' as VisitStatus,
            flagged_reason: null,
          });
          setVisits([demoVisit('1', 2), demoVisit('2', 7), demoVisit('3', 14)]);

          // Demo upcoming appointments
          if (m.planning_enabled) {
            const tomorrow = new Date(Date.now() + 86400000);
            if (tomorrow.getDay() === 0) tomorrow.setDate(tomorrow.getDate() + 1);
            const nextWeek = new Date(Date.now() + 6 * 86400000);
            if (nextWeek.getDay() === 0) nextWeek.setDate(nextWeek.getDate() + 1);
            const fmt = (d: Date) => d.toISOString().split('T')[0];
            setUpcomingAppointments([
              { id: 'apt-1', slot_date: fmt(tomorrow), start_time: '14:00', total_duration_minutes: 60, deposit_confirmed: null, booked_online: true, planning_slot_services: [{ service_id: 's1', service: { name: 'Prestation demo', duration: 60 } }] },
              { id: 'apt-2', slot_date: fmt(nextWeek), start_time: '10:30', total_duration_minutes: 90, deposit_confirmed: null, booked_online: true, planning_slot_services: [{ service_id: 's2', service: { name: 'Prestation demo 2', duration: 90 } }] },
            ]);
          }
        } catch {
          router.push('/customer/cards');
          return;
        }
        setLoading(false);
        return;
      }

      try {
        // Phone is read from HttpOnly cookie server-side (C2+C3 fix)
        const response = await fetch('/api/customers/card', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ merchant_id: merchantId }),
        });
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

        // Set vouchers from consolidated response
        if (data.vouchers) {
          setVouchers(data.vouchers);
        }

        // Appointments
        setUpcomingAppointments(data.upcomingAppointments || []);
        setPastAppointments(data.pastAppointments || []);

        // Check if birthday already set
        if (data.card.customer?.birth_month && data.card.customer?.birth_day) {
          setHasBirthday(true);
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

        // Show review modal at 1st and 3rd stamp (if review_link configured and not already dismissed)
        if (
          (data.card?.current_stamps === 1 || data.card?.current_stamps === 3) &&
          data.card?.merchant?.review_link &&
          !isPreview
        ) {
          const dismissKey = `qarte_review_card_dismissed_${merchantId}`;
          const stored = localStorage.getItem(dismissKey);
          const alreadyDismissed = stored && (Date.now() - parseInt(stored)) / (1000 * 60 * 60 * 24) < 90;
          if (!alreadyDismissed) {
            setTimeout(() => setShowReviewModal(true), 1500);
          }
        }

        // Show referral modal at 2nd, 5th, 10th stamp (if referral enabled and not already shown)
        if (
          (data.card?.current_stamps === 2 || data.card?.current_stamps === 5 || data.card?.current_stamps === 10) &&
          data.card?.merchant?.referral_program_enabled &&
          data.card?.referral_code &&
          !isPreview
        ) {
          const refKey = `qarte_referral_shown_${merchantId}`;
          const storedRef = localStorage.getItem(refKey);
          const alreadyShownRef = storedRef && (Date.now() - parseInt(storedRef)) / (1000 * 60 * 60 * 24) < 90;
          if (!alreadyShownRef) {
            setTimeout(() => setShowReferralModal(true), 1500);
          }
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
        trackPwaInstalled({ merchant_id: merchantId });
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

  const handleShareReferral = useCallback(async () => {
    if (!card?.merchant) return;
    const referralCode = (card as LoyaltyCard & { referral_code?: string }).referral_code;
    if (!referralCode) return;

    const m = card.merchant;
    const url = `${window.location.origin}/scan/${m.scan_code}?ref=${referralCode}`;
    const reward = m.referral_reward_referred;
    const text = reward
      ? t('shareText', { name: m.shop_name, reward })
      : t('shareTextGeneric', { name: m.shop_name });

    if (navigator.share) {
      try {
        await navigator.share({ title: m.shop_name, text, url });
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  }, [card]);

  const handleUseVoucher = useCallback(async (voucherId: string) => {
    if (!card) return;
    setUsingVoucherId(voucherId);
    try {
      const res = await fetch('/api/vouchers/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voucher_id: voucherId,
          customer_id: card.customer_id,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // 1. Mark voucher as used
        setVouchers(prev => prev.map(v =>
          v.id === voucherId ? { ...v, is_used: true, used_at: new Date().toISOString() } : v
        ));

        // 2. Update stamps if bonus was added
        if (data.bonus_stamp_added && data.new_stamps != null) {
          setCard(prev => prev ? { ...prev, current_stamps: data.new_stamps } : prev);

          // Add bonus visit to local visits for immediate history display
          if (data.bonus_visit_id) {
            setVisits(prev => [{
              id: data.bonus_visit_id,
              loyalty_card_id: card.id,
              merchant_id: card.merchant_id,
              customer_id: card.customer_id,
              points_earned: 1,
              amount_spent: null,
              visited_at: new Date().toISOString(),
              ip_address: null,
              ip_hash: null,
              status: 'confirmed' as VisitStatus,
              flagged_reason: 'bonus_parrainage',
            }, ...prev]);
          }
        }

        // 3. Close detail modal + Celebration
        setShowVoucherDetail(false);
        setSelectedVoucher(null);
        const m = card.merchant;
        sparkleGrand([m.primary_color, m.secondary_color || '#FFD700', '#FFB6C1', '#FFFFFF']);
        const usedVoucher = vouchers.find(v => v.id === voucherId);
        setVoucherCelebrationData({
          rewardDescription: data.reward_description || '',
          customerName: data.customer_name || null,
          bonusStampAdded: !!data.bonus_stamp_added,
          isBirthday: usedVoucher?.source === 'birthday',
        });
        setShowVoucherCelebration(true);
      }
    } catch (err) {
      console.error('Use voucher error:', err);
    } finally {
      setUsingVoucherId(null);
    }
  }, [card]);

  // Memoized computed state — must be before early returns (Rules of Hooks)
  const {
    isRewardReady,
    isTier2Ready,
    effectiveTier1Redeemed,
    isMemberCardActive,
    rewardShowingTier2,
    rewardCardReady,
    rewardCardDescription,
    rewardCardRemaining,
    rewardCardTierLabel,
    rewardCashbackAmount,
    rewardCashbackPercent,
  } = useMemo(() => {
    if (!card) {
      return {
        isRewardReady: false,
        isTier2Ready: false,
        effectiveTier1Redeemed: false,
        isMemberCardActive: false,
        rewardShowingTier2: false,
        rewardCardReady: false,
        rewardCardDescription: '',
        rewardCardRemaining: 0,
        rewardCardTierLabel: '',
        rewardCashbackAmount: 0,
        rewardCashbackPercent: 0,
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
    const _isMemberCardActive = !!memberCard && new Date(memberCard.valid_until) > new Date();
    const _showingTier2 = !!_tier2Enabled && _effectiveTier1Redeemed;

    const _isCagnotte = card.merchant.loyalty_mode === 'cagnotte';
    const _currentAmount = Number(card.current_amount || 0);
    const _cagnottePercent = Number((_showingTier2 ? card.merchant.cagnotte_tier2_percent : card.merchant.cagnotte_percent) || 0);
    const _cashbackAmount = _isCagnotte ? Math.round(_currentAmount * _cagnottePercent) / 100 : 0;

    return {
      isRewardReady: _isRewardReady,
      isTier2Ready: _isTier2Ready,
      effectiveTier1Redeemed: _effectiveTier1Redeemed,
      isMemberCardActive: _isMemberCardActive,
      rewardShowingTier2: _showingTier2,
      rewardCardReady: _showingTier2 ? !!_isTier2Ready : _isRewardReady,
      rewardCardDescription: _showingTier2
        ? (_tier2Reward || t('defaultTier2Reward'))
        : (card.merchant.reward_description || t('defaultReward')),
      rewardCardRemaining: _showingTier2
        ? _tier2Required - _currentStamps
        : _tier1Required - _currentStamps,
      rewardCardTierLabel: _tier2Enabled
        ? (_showingTier2 ? t('tier2Label') : t('tier1Label'))
        : '',
      rewardCashbackAmount: _cashbackAmount,
      rewardCashbackPercent: _cagnottePercent,
    };
  }, [card, tier1RedeemedInCycle, memberCard]);

  const completedCycles = useMemo(() => {
    if (redemptions.length === 0) return 0;
    const t2 = card?.merchant?.tier2_enabled && card?.merchant?.tier2_stamps_required;
    if (t2) return redemptions.filter(r => r.tier === 2).length;
    return redemptions.length;
  }, [redemptions, card?.merchant?.tier2_enabled, card?.merchant?.tier2_stamps_required]);

  const triggerSparkles = useCallback(() => {
    const m = card?.merchant;
    const colors = m
      ? [m.primary_color, m.secondary_color || '#FFD700', '#FFB6C1', '#FFFFFF']
      : undefined;
    sparkleGrand(colors);
  }, [card?.merchant]);

  const handleRedeem = async (tier: 1 | 2 = 1) => {
    if (!card) return;

    setRedeeming(true);
    setRedeemError(null);

    try {
      const isCagnotteMode = card.merchant.loyalty_mode === 'cagnotte';
      const endpoint = isCagnotteMode ? '/api/cagnotte/redeem-public' : '/api/redeem-public';

      const response = await fetch(endpoint, {
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
        // Single functional update to avoid state race
        setCard(prev => {
          if (!prev) return prev;
          const updates: Partial<typeof prev> = {};
          if (data.stamps_reset) updates.current_stamps = 0;
          if (data.stamps_reset || isCagnotteMode) updates.current_amount = 0;
          return { ...prev, ...updates };
        });
        // Mark tier 1 as redeemed in cycle
        if (tier === 1) {
          setTier1RedeemedInCycle(true);
        }
        // Reset tier 1 redeemed status if tier 2 was redeemed (new cycle)
        if (tier === 2) {
          setTier1RedeemedInCycle(false);
        }
        setRedeemSuccess(true);
        triggerSparkles();
      } else {
        console.error('Redeem failed:', data);
        setRedeemError(data.error || t('redeemDefaultError'));
      }
    } catch (err) {
      console.error('Redeem error:', err);
      setRedeemError(t('redeemConnectionError'));
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) {
    return <CardSkeleton />;
  }

  if (!card) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
        <AlertCircle className="w-16 h-16 mb-4 text-red-500" />
        <p className="text-gray-600">{t('cardNotFound')}</p>
        <Link
          href={isDemo ? '/' : isPreview ? '/dashboard/program' : '/customer/cards'}
          className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
        >
          {t('back')}
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
      {isPreview && !isDemo && (
        <div className="sticky top-0 z-50 shadow-lg">
          <div className="bg-indigo-600 text-white text-center py-2.5 px-4 text-sm font-semibold flex items-center justify-center gap-2">
            <Eye className="w-4 h-4" />
            {isOnboarding
              ? t('previewOnboarding')
              : t('previewDefault')}
          </div>
          <Link
            href="/dashboard/qr-download"
            className="flex items-center justify-center gap-2 bg-indigo-500 text-white text-xs font-medium py-2 px-4 hover:bg-indigo-400 transition-colors"
          >
            <QrCode className="w-3.5 h-3.5" />
            {t('downloadQr')}
          </Link>
        </div>
      )}
      {/* Demo type selector */}
      {isPreview && isDemo && (
        <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 py-2 px-4">
          <div className="flex items-center justify-center gap-2">
            {[
              { id: 'demo-onglerie', label: t('stampMode'), emoji: '💅' },
              { id: 'demo-coiffure', label: t('cagnotteMode'), emoji: '💰' },
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
      {/* Header */}
      <CardHeader
        merchant={merchant}
        memberCard={memberCard}
        isMemberCardActive={isMemberCardActive}
        isPreview={isPreview}
        isDemo={isDemo}
        merchantId={merchantId}
        onShowMemberCard={() => setShowMemberCardModal(true)}
      />

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
              <p className="text-sm text-gray-500 font-medium">{t('hello')}</p>
              <p className="text-2xl font-black tracking-tight text-gray-900">{card?.customer?.first_name}</p>
              <p className="text-[11px] text-gray-400 mt-0.5 italic">{getGreetingMessage(t)}</p>
            </div>
            {!memberCard && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('loyalClient')}</span>
              </div>
            )}
          </div>
          {/* Hero counter + progress */}
          <div className="flex items-end justify-between mb-2">
            <p className="text-4xl font-black tracking-tight" style={{ color: safeColor }}>
              {currentStamps}<span className="text-gray-300 text-2xl mx-0.5">/</span><span className="text-gray-400 text-2xl">{tier2Enabled && effectiveTier1Redeemed ? tier2Required : tier1Required}</span>
            </p>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              {getLoyaltyLabel(currentStamps, t)}
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
                    {scanRedeemed ? t('rewardUsed') : t('visitValidated')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {scanRedeemed ? t('enjoyGift') : t('cardUpdated')}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Redeem Error Banner */}
        <AnimatePresence>
          {redeemError && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="mb-3 p-3 rounded-2xl border border-red-200 bg-red-50 shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-red-800 text-sm">{redeemError}</p>
                </div>
                <button
                  onClick={() => setRedeemError(null)}
                  className="text-red-400 hover:text-red-600 text-lg font-bold px-1"
                  aria-label={t('close')}
                >
                  &times;
                </button>
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
                    {t('pendingVisits', { count: pendingCount })}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t('validationInProgress', { name: merchant.shop_name })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-amber-100">
                <Shield className="w-3 h-3 text-gray-400" />
                <span className="text-[9px] font-medium text-gray-400 uppercase tracking-wider">
                  {t('protectedByShield')}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upcoming Appointments — placé juste avant parrainage */}
        {merchant.planning_enabled && upcomingAppointments.length > 0 && (
          <UpcomingAppointmentsSection
            appointments={upcomingAppointments}
            merchantColor={merchant.primary_color}
            merchantId={merchant.id}
            shopName={merchant.shop_name}
            merchantCountry={merchant.country}
            bookingMode={(merchant.booking_mode || 'slots') as 'slots' | 'free'}
            allowCancel={!!merchant.allow_customer_cancel}
            allowReschedule={!!merchant.allow_customer_reschedule}
            cancelDeadlineDays={merchant.cancel_deadline_days ?? 1}
            rescheduleDeadlineDays={merchant.reschedule_deadline_days ?? 1}
            onCancelled={(slotId) => setUpcomingAppointments(prev => prev.filter(a => a.id !== slotId))}
            onRescheduled={() => window.location.reload()}
          />
        )}

        {/* Bouton Parrainer un ami */}
        {merchant.referral_program_enabled && (card as LoyaltyCard & { referral_code?: string }).referral_code && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <div
              className="rounded-2xl overflow-hidden shadow-lg shadow-gray-200/50 border border-gray-100/80"
              style={{ background: `linear-gradient(135deg, white 65%, ${merchant.primary_color}08 100%)` }}
            >
              <div className="p-4 flex items-center gap-3.5">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${merchant.primary_color}, ${merchant.secondary_color || merchant.primary_color})`,
                    boxShadow: `0 4px 12px ${merchant.primary_color}25`,
                  }}
                >
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm">{t('referFriend')}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                    {merchant.referral_reward_referred && merchant.referral_reward_referrer
                      ? t('referralRewardBoth', { referred: merchant.referral_reward_referred, referrer: merchant.referral_reward_referrer })
                      : t('referralRewardGeneric')}
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={handleShareReferral}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white font-bold text-xs shrink-0 transition-all"
                  style={{
                    background: `linear-gradient(135deg, ${merchant.primary_color}, ${merchant.secondary_color || merchant.primary_color})`,
                    boxShadow: `0 2px 8px ${merchant.primary_color}30`,
                  }}
                >
                  {shareCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      {t('copied')}
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      {t('share')}
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Offre Duo */}
        {merchant.duo_offer_enabled && merchant.duo_offer_description && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <div className="rounded-2xl bg-white shadow-lg shadow-gray-200/50 border border-gray-100/80 p-4">
              <div className="flex items-center gap-3.5">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${merchant.primary_color}, ${merchant.secondary_color || merchant.primary_color})`,
                    boxShadow: `0 4px 12px ${merchant.primary_color}25`,
                  }}
                >
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm">{t('duoOfferTitle')}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{merchant.duo_offer_description}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Offre Exclusive */}
        {offer && <ExclusiveOffer offer={offer} merchantColor={merchant.primary_color} isPreview={isPreview} />}

        {/* Stamps / Cagnotte Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100/80 p-5 mb-4"
        >
          {merchant.loyalty_mode === 'cagnotte' ? (
            <CagnotteSection
              currentStamps={currentStamps}
              tier1Required={tier1Required}
              tier2Enabled={!!tier2Enabled}
              tier2Required={tier2Required}
              isRewardReady={isRewardReady}
              isTier2Ready={isTier2Ready}
              effectiveTier1Redeemed={effectiveTier1Redeemed}
              merchantColor={merchant.primary_color}
              rewardDescription={merchant.reward_description || ''}
              tier2RewardDescription={merchant.tier2_reward_description || ''}
              completedCycles={completedCycles}
            />
          ) : (
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
              doubleDaysEnabled={merchant.double_days_enabled}
              doubleDaysOfWeek={merchant.double_days_of_week}
              completedCycles={completedCycles}
            />
          )}
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
          isCagnotte={merchant.loyalty_mode === 'cagnotte'}
          cashbackAmount={rewardCashbackAmount}
          cashbackPercent={rewardCashbackPercent}
          country={merchant.country}
          onRedeem={() => {
            setRedeemTier(rewardShowingTier2 ? 2 : 1);
            setShowRedeemModal(true);
          }}
        />

        {/* Voucher rewards (referral) */}
        <VoucherRewards
          vouchers={vouchers}
          merchant={merchant}
          onSelectVoucher={(v) => { setSelectedVoucher(v); setShowVoucherDetail(true); }}
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
                <p className="text-amber-400 text-[10px] font-bold uppercase tracking-[0.15em]">{t('privilegeMember')}</p>
                <p className="text-white/60 text-xs font-medium truncate mt-0.5">{memberCard.program?.benefit_label}</p>
              </div>
              <ChevronRight className="relative z-10 w-4 h-4 text-amber-500/40 shrink-0" />
            </div>
            {isPreview && (
              <div className="absolute top-2.5 right-2.5 z-20 bg-black/60 backdrop-blur-sm text-[9px] font-bold text-white/80 px-2 py-0.5 rounded-full">
                {t('example')}
              </div>
            )}
          </motion.button>
        )}

        {/* Contest Badge */}
        {merchant.contest_enabled && merchant.contest_prize && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mb-4"
          >
            <div
              className="flex items-center gap-3.5 p-4 rounded-2xl overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${merchant.primary_color}12, ${merchant.primary_color}08)`,
                border: `1px solid ${merchant.primary_color}20`,
              }}
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-600">{t('contestLabel')}</p>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{t('contestCardDesc')}</p>
                <p className="text-xs font-semibold text-gray-700 mt-0.5">{merchant.contest_prize}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Birthday Input */}
        {!isPreview && (
          <BirthdaySection merchant={merchant} customerId={card.customer_id} hasBirthday={hasBirthday} />
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
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white shadow-lg shadow-gray-200/50 border border-gray-100/80">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${merchant.primary_color}12` }}>
                <Bell className="w-4 h-4" style={{ color: merchant.primary_color }} />
              </div>
              <span className="flex-1 text-xs font-medium text-gray-700 text-left">{t('enableNotifications')}</span>
              {push.pushSubscribing ? (
                <Loader2 className="w-4 h-4 animate-spin shrink-0" style={{ color: merchant.primary_color }} />
              ) : (
                <ChevronRight className="w-4 h-4 shrink-0" style={{ color: merchant.primary_color }} />
              )}
            </div>
          </motion.button>
        )}

        {/* Push Error / iOS Settings Guidance */}
        {push.pushError && (
          push.pushPermission === 'denied' ? (
            <div className="w-full rounded-2xl p-4 bg-amber-50 border border-amber-200 flex items-start gap-3 mb-4">
              <Bell className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-amber-800 text-sm">{t('notificationsDisabled')}</p>
                <p className="text-xs text-amber-700 mt-1">{t('permissionDeniedHint')}</p>
              </div>
            </div>
          ) : (
            <div className="w-full rounded-2xl p-4 bg-amber-50 border border-amber-200 flex items-start gap-3 mb-4">
              <Bell className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-amber-800 text-sm">{t('activationError')}</p>
                <p className="text-xs text-amber-700 mt-1">{t('activationErrorHint')}</p>
              </div>
            </div>
          )
        )}

        {/* Historique */}
        <HistorySection
          visits={visits}
          adjustments={adjustments}
          redemptions={redemptions}
          usedVouchers={vouchers
            .filter(v => v.is_used && v.used_at)
            .map(v => ({ id: v.id, used_at: v.used_at!, reward_description: v.reward_description, source: v.source }))
          }
          appointments={pastAppointments}
          merchant={merchant}
        />

        {/* Réseaux sociaux */}
        <SocialLinks merchant={merchant} />

        {/* Encart avis Google — affiché si review_link configuré */}
        {merchant.review_link && !isPreview && (
          <ReviewCard
            reviewLink={merchant.review_link}
            shopName={merchant.shop_name}
            merchantId={merchantId}
          />
        )}

        <footer className="py-6 text-center">
          <a href="https://www.getqarte.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 group transition-all duration-300 hover:opacity-70">
            <span className="text-xs text-gray-400 group-hover:text-gray-500">{t('poweredBy')}</span>
            <span className="text-xs font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              Qarte
            </span>
          </a>
        </footer>



      </main>

      {/* Redeem Modal */}
      <RedeemModal
        isOpen={showRedeemModal}
        onClose={() => setShowRedeemModal(false)}
        tier={redeemTier}
        tier2Enabled={tier2Enabled}
        rewardDescription={merchant.reward_description || ''}
        tier2Reward={tier2Reward}
        shopName={merchant.shop_name}
        success={redeemSuccess}
        redeeming={redeeming}
        merchantColor={merchant.primary_color}
        secondaryColor={merchant.secondary_color}
        onRedeem={handleRedeem}
        onDone={() => { setShowRedeemModal(false); setRedeemSuccess(false); if (merchant.review_link) setShowReviewModal(true); }}
        isCagnotte={merchant.loyalty_mode === 'cagnotte'}
        cashbackAmount={merchant.loyalty_mode === 'cagnotte'
          ? Math.round(Number(card.current_amount || 0) * Number((redeemTier === 2 ? merchant.cagnotte_tier2_percent : merchant.cagnotte_percent) || 0)) / 100
          : undefined}
        country={merchant.country}
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
        showInstallBar={showInstallBar}
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
                {t('generateQrCode')}
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
          </div>
        </div>
      )}


      {/* Voucher Modals */}
      <VoucherModals
        merchant={merchant}
        customerFirstName={card?.customer?.first_name}
        showDetail={showVoucherDetail}
        selectedVoucher={selectedVoucher}
        usingVoucherId={usingVoucherId}
        onUseVoucher={handleUseVoucher}
        onCloseDetail={() => { setShowVoucherDetail(false); setSelectedVoucher(null); }}
        showCelebration={showVoucherCelebration}
        celebrationData={voucherCelebrationData}
        onCloseCelebration={() => { setShowVoucherCelebration(false); if (merchant.review_link) setShowReviewModal(true); }}
      />

      {/* Review Modal — affiché après utilisation d'une récompense ou d'un bon */}
      {merchant.review_link && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          reviewLink={merchant.review_link}
          shopName={merchant.shop_name}
          merchantId={merchantId}
        />
      )}

      {/* Referral Modal — affiché au 2ème, 5ème, 10ème scan */}
      {card?.referral_code && merchant.referral_program_enabled && (
        <ReferralModal
          isOpen={showReferralModal && !showReviewModal}
          onClose={() => setShowReferralModal(false)}
          referralCode={card.referral_code}
          scanCode={merchant.scan_code}
          shopName={merchant.shop_name}
          merchantId={merchantId}
          rewardReferrer={merchant.referral_reward_referrer}
          rewardReferred={merchant.referral_reward_referred}
        />
      )}
    </div>
  );
}
