'use client';

import { useState, useEffect, useRef, use, useCallback } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import {
  Phone,
  User,
  ArrowRight,
  AlertCircle,
  Gift,
  Loader2,
  ChevronDown,
  Ban,
  Star,
  HelpCircle,
  UserPlus,
  CheckCircle2,
  PartyPopper,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sparkleGrand } from '@/lib/sparkles';
import { Button, Input } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { formatPhoneNumber, validatePhone, getTodayForCountry, PHONE_CONFIG, getCurrencySymbol, formatCurrency } from '@/lib/utils';
import { PhoneInput } from '@/components/ui/PhoneInput';
import type { Merchant, Customer, LoyaltyCard, MerchantCountry } from '@/types';
import { trackQrScanned, trackCardCreated, trackPointEarned, trackRewardRedeemed } from '@/lib/analytics';
import { useTranslations } from 'next-intl';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { ScanSuccessStep } from '@/components/loyalty';
import { WelcomeBanner, ScanRewardScreen, ScanAlreadyCheckedScreen, ScanPendingScreen } from '@/components/scan';

type Step = 'phone' | 'register' | 'amount' | 'amount-confirm' | 'checkin' | 'success' | 'already-checked' | 'error' | 'reward' | 'pending' | 'banned' | 'referral-success';

interface ReferralInfo {
  valid: boolean;
  referrer_name: string;
  shop_name: string;
  merchant_id: string;
  reward_for_you: string;
  primary_color: string;
}

interface WelcomeInfo {
  valid: boolean;
  is_welcome: true;
  shop_name: string;
  merchant_id: string;
  welcome_offer_description: string;
  primary_color: string;
}

interface OfferInfo {
  valid: boolean;
  is_offer: true;
  offer_id: string;
  offer_title: string;
  offer_description: string;
  shop_name: string;
  merchant_id: string;
  primary_color: string;
}

// Phone cookie is now HttpOnly, set server-side by register/checkin APIs

export default function ScanPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const t = useTranslations('scanPage');
  const tc = useTranslations('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get('ref');
  const welcomeCode = searchParams.get('welcome');
  const offerId = searchParams.get('offer');
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [step, setStep] = useState<Step>('phone');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneCountry, setPhoneCountry] = useState<MerchantCountry>('FR');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Referral state
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
  const [referralLoading, setReferralLoading] = useState(!!searchParams.get('ref'));
  const [referralResult, setReferralResult] = useState<{ referrer_name: string; referred_reward: string; merchant_id: string } | null>(null);

  // Welcome offer state
  const [welcomeInfo, setWelcomeInfo] = useState<WelcomeInfo | null>(null);
  const [welcomeLoading, setWelcomeLoading] = useState(!!searchParams.get('welcome'));
  const [welcomeResult, setWelcomeResult] = useState<{ shop_name: string; welcome_reward: string; merchant_id: string } | null>(null);

  // Promo offer state
  const [offerInfo, setOfferInfo] = useState<OfferInfo | null>(null);
  const [offerLoading, setOfferLoading] = useState(!!searchParams.get('offer'));
  const [offerResult, setOfferResult] = useState<{ shop_name: string; offer_title: string; offer_description: string; merchant_id: string } | null>(null);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loyaltyCard, setLoyaltyCard] = useState<LoyaltyCard | null>(null);

  // Checkin state
  const [lastCheckinPoints, setLastCheckinPoints] = useState(0);

  // Qarte Shield: Pending state
  const [pendingStamps, setPendingStamps] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  // How it works accordion
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);

  // Cagnotte mode
  const [amountInput, setAmountInput] = useState('');
  const [cagnotteData, setCagnotteData] = useState<{
    currentAmount: number;
    amountAdded: number;
    rewardValue: number | null;
    rewardPercent: number | null;
  } | null>(null);

  // Amount confirm countdown
  const [confirmProgress, setConfirmProgress] = useState(0);
  const confirmTimerRef = useRef<NodeJS.Timeout | null>(null);
  const confirmStartRef = useRef<number>(0);

  // Push notifications (via shared hook)
  const push = usePushNotifications({ customerId: customer?.id });

  // Track if auto-login has been attempted
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);

  // Tier rewards state
  const [rewardTier, setRewardTier] = useState<number | null>(null);
  const [tier1Redeemed, setTier1Redeemed] = useState(false);
  const [tier2Redeemed, setTier2Redeemed] = useState(false);

  // Previous stamps for success animation (old → new)
  const [previousStamps, setPreviousStamps] = useState(0);

  // Cleanup confirm timer on unmount
  useEffect(() => {
    return () => {
      if (confirmTimerRef.current) clearInterval(confirmTimerRef.current);
    };
  }, []);

  // Fetch merchant + referral info in parallel
  useEffect(() => {
    const init = async () => {
      const merchantPromise = supabase
        .from('merchants')
        .select('*')
        .eq('scan_code', code)
        .single();

      const referralPromise = refCode
        ? fetch(`/api/referrals?code=${encodeURIComponent(refCode)}`).then(r => r.json()).catch(() => null)
        : Promise.resolve(null);

      const welcomePromise = welcomeCode
        ? fetch(`/api/welcome?code=${encodeURIComponent(welcomeCode)}`).then(r => r.json()).catch(() => null)
        : Promise.resolve(null);

      const offerPromise = offerId
        ? fetch(`/api/merchant-offers/claim?offerId=${encodeURIComponent(offerId)}`).then(r => r.json()).catch(() => null)
        : Promise.resolve(null);

      const [merchantResult, referralData, welcomeData, offerData] = await Promise.all([merchantPromise, referralPromise, welcomePromise, offerPromise]);

      if (merchantResult.data) {
        setMerchant(merchantResult.data);
        setPhoneCountry((merchantResult.data.country || 'FR') as MerchantCountry);
        trackQrScanned({ merchant_id: merchantResult.data.id });
      }

      if (referralData?.valid) {
        setReferralInfo(referralData);
      }
      if (welcomeData?.valid) {
        setWelcomeInfo(welcomeData);
      }
      if (offerData?.valid) {
        setOfferInfo(offerData);
      }
      setReferralLoading(false);
      setWelcomeLoading(false);
      setOfferLoading(false);
      setLoading(false);
    };

    init();
  }, [code, refCode, welcomeCode, offerId]);

  // Auto-login effect: check HttpOnly cookie via /api/customers/me
  useEffect(() => {
    const autoLogin = async () => {
      if (autoLoginAttempted || loading || !merchant || submitting || refCode || welcomeCode || offerId) return;

      // Guard: skip auto-login if already auto-checked-in today for this scan code
      const lastAutoCheckin = localStorage.getItem(`qarte_checkin_${code}`);
      const today = new Date().toDateString();
      if (lastAutoCheckin === today) return;

      if (step === 'phone') {
        setAutoLoginAttempted(true);
        setSubmitting(true);
        try {
          // Check if user has a valid auth cookie
          const response = await fetch(`/api/customers/me?merchant_id=${merchant.id}`);
          const data = await response.json();

          if (data.authenticated && data.phone) {
            setPhoneNumber(data.phone);

            if (data.existsForMerchant && data.customer) {
              setCustomer(data.customer);
              if (merchant.loyalty_mode === 'cagnotte') {
                setStep('amount');
              } else {
                await processCheckin(data.customer, data.phone);
                localStorage.setItem(`qarte_checkin_${code}`, today);
              }
            } else if (data.existsGlobally && data.customer) {
              const createResponse = await fetch('/api/customers/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  phone_number: data.phone,
                  first_name: data.customer.first_name,
                  merchant_id: merchant.id,
                }),
              });

              const createData = await createResponse.json();
              if (createResponse.ok && createData.customer) {
                setCustomer(createData.customer);
                if (merchant.loyalty_mode === 'cagnotte') {
                  setStep('amount');
                } else {
                  await processCheckin(createData.customer, data.phone);
                  localStorage.setItem(`qarte_checkin_${code}`, today);
                }
              }
            }
          }
        } catch (err) {
          console.error('Auto-login failed:', err);
        } finally {
          setSubmitting(false);
        }
      }
    };

    autoLogin();
  }, [loading, merchant, step, autoLoginAttempted, code, submitting]);

  const triggerSparkles = useCallback(() => {
    if (!merchant) return;
    const colors = [merchant.primary_color, merchant.secondary_color || '#FFD700', '#FFB6C1', '#FFFFFF'];

    // Haptic feedback
    if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);

    sparkleGrand(colors);
  }, [merchant]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const formattedPhone = formatPhoneNumber(phoneNumber, phoneCountry);
    if (!validatePhone(formattedPhone, phoneCountry)) {
      setError(t('invalidPhone'));
      return;
    }

    // Block submission while referral info is loading
    if (refCode && referralLoading) return;

    setSubmitting(true);

    try {
      if (!merchant) {
        setStep('register');
        return;
      }

      const response = await fetch('/api/customers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'lookup', phone_number: formattedPhone, phone_country: phoneCountry, merchant_id: merchant.id }),
      });
      const data = await response.json();

      if (data.exists && data.customer) {
        // Client existe déjà pour ce commerçant OU globalement
        if (data.existsForMerchant) {
          // Referral link but client already exists → block
          if (refCode) {
            setError(t('alreadyClient'));
            setSubmitting(false);
            return;
          }
          // Welcome flow: existing customer with 0 stamps can claim
          if (welcomeCode && welcomeInfo) {
            const formattedPhone = formatPhoneNumber(phoneNumber, phoneCountry);
            const res = await fetch('/api/welcome', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                welcome_code: welcomeCode,
                phone_number: formattedPhone, phone_country: phoneCountry,
                first_name: data.customer.first_name,
                last_name: data.customer.last_name || null,
              }),
            });
            const welcomeData = await res.json();
            if (res.ok && welcomeData.success) {
              setCustomer(data.customer);
              triggerSparkles();
              setStep('referral-success');
            } else {
              setError(welcomeData.error || t('welcomeClaimError'));
            }
            setSubmitting(false);
            return;
          }
          // Offer flow: claim directly for existing customer
          if (offerId && offerInfo) {
            const formattedPhone = formatPhoneNumber(phoneNumber, phoneCountry);
            const res = await fetch('/api/merchant-offers/claim', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                offer_id: offerId,
                phone_number: formattedPhone, phone_country: phoneCountry,
                first_name: data.customer.first_name,
                last_name: data.customer.last_name || null,
              }),
            });
            const claimData = await res.json();
            if (res.ok && claimData.success) {
              setOfferResult({
                shop_name: claimData.shop_name,
                offer_title: claimData.offer_title,
                offer_description: claimData.offer_description,
                merchant_id: claimData.merchant_id,
              });
              setCustomer(data.customer);
              triggerSparkles();
              setStep('referral-success');
            } else {
              setError(claimData.error || t('offerClaimError'));
            }
            setSubmitting(false);
            return;
          }
          setCustomer(data.customer);
          if (merchant.loyalty_mode === 'cagnotte') {
            setStep('amount');
          } else {
            await processCheckin(data.customer);
          }
        } else if (data.existsGlobally) {
          // Client exists globally but not for this merchant
          if (refCode && referralInfo) {
            // Referral flow: pre-fill name and go to register for referral inscription
            setFirstName(data.customer.first_name || '');
            setLastName('');
            setStep('register');
          } else if (welcomeCode && welcomeInfo) {
            // Welcome flow: pre-fill name and go to register
            setFirstName(data.customer.first_name || '');
            setLastName('');
            setStep('register');
          } else if (offerId && offerInfo) {
            // Offer flow: pre-fill name and go to register
            setFirstName(data.customer.first_name || '');
            setLastName('');
            setStep('register');
          } else {
            const createResponse = await fetch('/api/customers/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                phone_number: formattedPhone, phone_country: phoneCountry,
                first_name: data.customer.first_name,
                merchant_id: merchant.id,
              }),
            });

            const createData = await createResponse.json();

            if (createResponse.ok && createData.customer) {
              setCustomer(createData.customer);
              if (merchant.loyalty_mode === 'cagnotte') {
                setStep('amount');
              } else {
                await processCheckin(createData.customer);
              }
            } else {
              console.error('Create failed:', createData);
              setError(createData.error || t('signupError'));
            }
          }
        }
      } else {
        // Nouveau client → demander nom/prénom
        setStep('register');
      }
    } catch {
      setStep('register');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firstName.trim()) {
      setError(t('firstNameRequired'));
      return;
    }

    // Block submission while referral/welcome info is loading
    if (refCode && referralLoading) return;
    if (welcomeCode && welcomeLoading) return;

    setSubmitting(true);

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber, phoneCountry);
      // Cookie is set server-side by register/checkin APIs

      // Offer flow: call /api/merchant-offers/claim
      if (offerId && offerInfo) {
        const res = await fetch('/api/merchant-offers/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            offer_id: offerId,
            phone_number: formattedPhone, phone_country: phoneCountry,
            first_name: firstName.trim(),
            last_name: lastName.trim() || null,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setOfferResult({
            shop_name: data.shop_name,
            offer_title: data.offer_title,
            offer_description: data.offer_description,
            merchant_id: data.merchant_id,
          });
          setCustomer({ id: data.customer_id } as Customer);
          triggerSparkles();
          setStep('referral-success');
        } else {
          setError(data.error || t('signupError'));
        }
        return;
      }

      // Welcome flow: call /api/welcome instead of /api/checkin
      if (welcomeCode && welcomeInfo) {
        const res = await fetch('/api/welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            welcome_code: welcomeCode,
            phone_number: formattedPhone, phone_country: phoneCountry,
            first_name: firstName.trim(),
            last_name: lastName.trim() || null,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setWelcomeResult({
            shop_name: data.shop_name,
            welcome_reward: data.welcome_reward,
            merchant_id: data.merchant_id,
          });
          setCustomer({ id: data.customer_id } as Customer);
          triggerSparkles();
          setStep('referral-success');
        } else {
          setError(data.error || t('signupError'));
        }
        return;
      }

      // Referral flow: call /api/referrals instead of /api/checkin
      if (refCode && referralInfo) {
        const res = await fetch('/api/referrals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            referral_code: refCode,
            phone_number: formattedPhone, phone_country: phoneCountry,
            first_name: firstName.trim(),
            last_name: lastName.trim() || null,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setReferralResult({
            referrer_name: data.referrer_name,
            referred_reward: data.referred_reward,
            merchant_id: data.merchant_id,
          });
          setCustomer({ id: data.customer_id } as Customer);
          triggerSparkles();
          setStep('referral-success');
        } else {
          setError(data.error || t('referralSignupError'));
        }
        return;
      }

      // Skip register API — checkin creates customer + card + visit in one call
      if (merchant?.loyalty_mode === 'cagnotte') {
        setStep('amount');
      } else {
        await processCheckin({ first_name: firstName.trim(), last_name: lastName.trim() || null });
      }
    } catch (err) {
      console.error(err);
      setError(t('signupError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAmountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amount = parseFloat(amountInput.replace(',', '.'));
    if (!amount || amount < 0.01 || amount > 99999) {
      setError(t('invalidAmount'));
      return;
    }

    // Go to confirmation step with 5-second countdown
    setConfirmProgress(0);
    setStep('amount-confirm');
    confirmStartRef.current = Date.now();

    confirmTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - confirmStartRef.current;
      const progress = Math.min(elapsed / 5000, 1);
      setConfirmProgress(progress);

      if (progress >= 1) {
        if (confirmTimerRef.current) clearInterval(confirmTimerRef.current);
        confirmTimerRef.current = null;
        submitAmount();
      }
    }, 50);
  };

  const submitAmount = async () => {
    if (submitting) return;
    if (confirmTimerRef.current) {
      clearInterval(confirmTimerRef.current);
      confirmTimerRef.current = null;
    }

    const amount = parseFloat(amountInput.replace(',', '.'));
    setSubmitting(true);
    try {
      const customerInfo = customer
        ? { first_name: customer.first_name, last_name: customer.last_name }
        : { first_name: firstName.trim(), last_name: lastName.trim() || null };
      await processCheckin(customerInfo, undefined, amount);
    } catch (err) {
      console.error(err);
      setError(t('recordError'));
      setStep('amount');
    } finally {
      setSubmitting(false);
    }
  };

  const cancelAmountConfirm = () => {
    if (confirmTimerRef.current) {
      clearInterval(confirmTimerRef.current);
      confirmTimerRef.current = null;
    }
    setStep('amount');
  };

  const processCheckin = async (customerInfo: { first_name: string; last_name?: string | null }, overridePhone?: string, amount?: number) => {
    if (!merchant) return;

    setStep('checkin');

    try {
      const formattedPhone = formatPhoneNumber(overridePhone || phoneNumber, phoneCountry);
      const isCagnotteMode = merchant.loyalty_mode === 'cagnotte';
      const endpoint = isCagnotteMode ? '/api/cagnotte/checkin' : '/api/checkin';

      const body: Record<string, unknown> = {
        scan_code: code,
        phone_number: formattedPhone, phone_country: phoneCountry,
        first_name: customerInfo.first_name,
        last_name: customerInfo.last_name,
      };
      if (isCagnotteMode && amount) {
        body.amount = amount;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.banned) {
          setStep('banned');
          return;
        }
        throw new Error(data.error || t('serverError'));
      }

      // Update state with response data
      setLastCheckinPoints(data.points_earned || 1);

      // Compute previous stamps for success animation (before update)
      const prevStamps = Math.max(0, (data.current_stamps || 0) - (data.points_earned || 1));
      setPreviousStamps(prevStamps);

      // Set customer state from checkin response (needed for reward flow)
      setCustomer({
        id: data.customer_id,
        phone_number: formattedPhone,
        first_name: customerInfo.first_name,
        last_name: customerInfo.last_name || null,
        created_at: new Date().toISOString(),
      } as Customer);

      // Store cagnotte-specific data
      if (isCagnotteMode) {
        setCagnotteData({
          currentAmount: data.current_amount ?? 0,
          amountAdded: data.amount_added ?? 0,
          rewardValue: data.reward_value ?? null,
          rewardPercent: data.cagnotte_percent ?? null,
        });
      }

      // Create updated card object
      const updatedCard = {
        id: data.loyalty_card_id,
        customer_id: data.customer_id,
        merchant_id: merchant.id,
        current_stamps: data.current_stamps,
        current_amount: data.current_amount ?? 0,
        stamps_target: merchant.stamps_required,
        last_visit_date: getTodayForCountry(merchant.country),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setLoyaltyCard(updatedCard as LoyaltyCard);

      // Update tier redemption state from API response
      if (data.tier1_redeemed !== undefined) setTier1Redeemed(data.tier1_redeemed);
      if (data.tier2_redeemed !== undefined) setTier2Redeemed(data.tier2_redeemed);
      if (data.reward_tier !== undefined) setRewardTier(data.reward_tier);

      // Handle different statuses from Qarte Shield
      if (data.status === 'pending') {
        setPendingStamps(data.pending_stamps || 1);
        setPendingCount(data.pending_count || 1);
        setStep('pending');
        return;
      }

      // Confirmed - normal flow
      if (data.reward_unlocked) {
        triggerSparkles();
        setStep('reward');
      } else {
        // Show animated success screen (auto-redirects to card after 3s)
        setStep('success');
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : t('checkinRecordError'));
      setStep('error');
    }
  };

  const handleRedeemReward = async () => {
    if (!loyaltyCard || !customer || !merchant) return;

    setSubmitting(true);

    try {
      const tierToRedeem = rewardTier || 1;
      const isCagnotteMode = merchant.loyalty_mode === 'cagnotte';
      const endpoint = isCagnotteMode ? '/api/cagnotte/redeem-public' : '/api/redeem-public';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loyalty_card_id: loyaltyCard.id,
          customer_id: customer.id,
          tier: tierToRedeem,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('redeemError'));
        setStep('error');
        return;
      }

      // Single functional update to avoid state race
      setLoyaltyCard(prev => {
        if (!prev) return prev;
        const updates: Partial<typeof prev> = {};
        if (data.stamps_reset) updates.current_stamps = 0;
        if (data.stamps_reset || isCagnotteMode) updates.current_amount = 0;
        return { ...prev, ...updates };
      });

      if (tierToRedeem === 1) {
        setTier1Redeemed(true);
      } else if (tierToRedeem === 2) {
        setTier2Redeemed(true);
        setTier1Redeemed(false);
      }

      setRewardTier(null);
      router.replace(`/customer/card/${merchant.id}?scan_success=1&redeemed=1`);
    } catch (err) {
      console.error('Redeem error:', err);
      setError(t('redeemUseError'));
      setStep('error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
        <AlertCircle className="w-16 h-16 mb-4 text-red-500" />
        <h1 className="text-xl font-bold text-gray-900">{t('shopNotFound')}</h1>
        <p className="mt-2 text-gray-600">{t('invalidQr')}</p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
        >
          {t('backToHome')}
        </Link>
      </div>
    );
  }

  const primaryColor = merchant.primary_color;
  const secondaryColor = merchant.secondary_color;
  const isCagnotte = merchant.loyalty_mode === 'cagnotte';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(135deg, white, ${primaryColor}12)` }}>
      <main className="flex-1 px-4 pt-4 pb-4 mx-auto max-w-md w-full">
        {step === 'phone' && (
          <div className="animate-fade-in">
            <WelcomeBanner merchant={merchant} primaryColor={primaryColor} secondaryColor={secondaryColor} />

            {/* Promo Offer Banner */}
            {offerInfo && !welcomeInfo && !referralInfo && (
              <div className="mb-4">
                <div
                  className="rounded-2xl p-4 border shadow-md"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}08)`,
                    borderColor: `${primaryColor}30`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${primaryColor}20` }}
                    >
                      <Gift className="w-5 h-5" style={{ color: primaryColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm">
                        {offerInfo.offer_title}
                      </p>
                      <p className="text-gray-600 text-xs mt-0.5">
                        {t('signUpAndReceive')}
                      </p>
                      <p className="font-bold text-sm mt-1" style={{ color: primaryColor }}>
                        {offerInfo.offer_description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Welcome Offer Banner */}
            {welcomeInfo && !referralInfo && !offerInfo && (
              <div className="mb-4">
                <div
                  className="rounded-2xl p-4 border shadow-md"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}08)`,
                    borderColor: `${primaryColor}30`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${primaryColor}20` }}
                    >
                      <Sparkles className="w-5 h-5" style={{ color: primaryColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm">
                        {t('welcomeOfferAt', { name: merchant.shop_name })}
                      </p>
                      <p className="text-gray-600 text-xs mt-0.5">
                        {t('signUpAndReceive')}
                      </p>
                      <p className="font-bold text-sm mt-1" style={{ color: primaryColor }}>
                        {welcomeInfo.welcome_offer_description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Referral Banner */}
            {referralInfo && (
              <div className="mb-4">
                <div
                  className="rounded-2xl p-4 border shadow-md"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}08)`,
                    borderColor: `${primaryColor}30`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${primaryColor}20` }}
                    >
                      <UserPlus className="w-5 h-5" style={{ color: primaryColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm">
                        {t('recommends', { name: referralInfo.referrer_name })}
                      </p>
                      <p className="text-gray-600 text-xs mt-0.5">
                        {t('signUpAndReceive')}
                      </p>
                      <p className="font-bold text-sm mt-1" style={{ color: primaryColor }}>
                        {referralInfo.reward_for_you}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* How it works Accordion */}
            <div className="mb-4">
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setIsHowItWorksOpen(!isHowItWorksOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50/50 transition-colors focus:outline-none group"
                  aria-expanded={isHowItWorksOpen}
                >
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    <span className="font-medium text-gray-600 text-sm">{t('howItWorks')}</span>
                  </div>
                  <motion.div
                    animate={{ rotate: isHowItWorksOpen ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: "circOut" }}
                  >
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isHowItWorksOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                    >
                      <div className="px-5 pb-5 pt-1 space-y-4 relative">
                        {/* Vertical Connector Line */}
                        <div className="absolute left-[35px] top-5 bottom-8 w-px bg-gray-100" aria-hidden="true" />

                        {[
                          {
                            icon: <Star className="w-4 h-4" />,
                            title: isCagnotte ? t('cagnotteAccumulate') : t('stampsAccumulate'),
                            description: isCagnotte
                              ? t('cagnotteAccumulateDesc')
                              : t('stampsAccumulateDesc')
                          },
                          {
                            icon: <Gift className="w-4 h-4" />,
                            title: isCagnotte ? t('cagnotteReceive') : t('stampsReceive'),
                            description: isCagnotte
                              ? merchant.tier2_enabled && merchant.tier2_stamps_required
                                ? t('cagnotteTier2Desc', { tier1: merchant.stamps_required, percent1: Number(merchant.cagnotte_percent || 0), tier2: merchant.tier2_stamps_required, percent2: Number(merchant.cagnotte_tier2_percent || 0) })
                                : t('cagnotteSingleDesc', { count: merchant.stamps_required, percent: Number(merchant.cagnotte_percent || 0) })
                              : merchant.tier2_enabled && merchant.tier2_stamps_required
                                ? t('stampsTier2Desc', { tier1: merchant.stamps_required, reward1: merchant.reward_description || '', tier2: merchant.tier2_stamps_required, reward2: merchant.tier2_reward_description || '' })
                                : t('stampsSingleDesc', { count: merchant.stamps_required, reward: merchant.reward_description || '' })
                          }
                        ].map((step, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex items-start gap-3 relative z-10"
                          >
                            <div
                              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white shadow-sm"
                              style={{ backgroundColor: primaryColor }}
                            >
                              {step.icon}
                            </div>
                            <div className="flex-1 pt-0.5">
                              <h4 className="font-bold text-gray-900 text-sm mb-0.5">{step.title}</h4>
                              <p className="text-gray-500 text-xs leading-relaxed">{step.description}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5">
              <form onSubmit={handlePhoneSubmit} className="space-y-3">
                {error && (
                  <div className="p-3 text-sm font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl">
                    {error}
                  </div>
                )}

                <PhoneInput
                  label={t('yourPhone')}
                  value={phoneNumber}
                  onChange={setPhoneNumber}
                  country={phoneCountry}
                  onCountryChange={setPhoneCountry}
                  countries={['FR', 'BE', 'CH']}
                  required
                  className="h-12 text-base bg-gray-50/50 border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 rounded-r-xl transition-all"
                />

                <button
                  type="submit"
                  disabled={submitting || (!!refCode && referralLoading)}
                  className="w-full h-12 text-base font-bold rounded-xl text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || primaryColor})` }}
                >
                  {submitting || (!!refCode && referralLoading) ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {referralInfo ? t('signUp') : t('validateVisit')}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {step === 'register' && (
          <div className="animate-fade-in">
            <style>{`
              @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
              }
              .glamour-input:focus {
                box-shadow: 0 0 0 3px ${primaryColor}25, 0 0 12px ${primaryColor}15;
                border-color: ${primaryColor}50;
              }
            `}</style>
            <div className="relative bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
              {/* Immersive gradient header with decorative elements */}
              <div
                className="relative px-8 pt-10 pb-8 text-center overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${primaryColor}18, ${secondaryColor || primaryColor}12, ${primaryColor}08)` }}
              >
                {/* Decorative circles */}
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20" style={{ background: primaryColor }} />
                <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full opacity-15" style={{ background: secondaryColor || primaryColor }} />
                <div className="absolute top-1/2 right-4 w-8 h-8 rounded-full opacity-10" style={{ background: primaryColor }} />

                {merchant.logo_url ? (
                  <div className="relative inline-flex w-20 h-20 rounded-2xl overflow-hidden border-2 shadow-lg mb-4" style={{ borderColor: `${primaryColor}30` }}>
                    <img src={merchant.logo_url} alt={merchant.shop_name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 shadow-lg" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || primaryColor})` }}>
                    <span className="text-3xl font-black text-white">{merchant.shop_name[0]?.toUpperCase()}</span>
                  </div>
                )}
                <h2 className="text-2xl font-black text-gray-900 flex items-center justify-center gap-2" style={{ fontFamily: 'var(--font-poppins), sans-serif' }}>
                  <Sparkles className="w-5 h-5" style={{ color: primaryColor }} />
                  {t('privileges')}
                  <Sparkles className="w-5 h-5" style={{ color: primaryColor }} />
                </h2>
                <p className="mt-2 text-gray-500 text-sm">
                  {referralInfo
                    ? t('finishSignupReferral')
                    : t('loyaltyCardAwaits', { name: merchant.shop_name })}
                </p>
              </div>

              <div className="px-8 pb-8 pt-5">
                <form onSubmit={handleRegisterSubmit} className="space-y-5">
                  {error && (
                    <div className="p-4 text-sm font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-2xl">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">{t('firstName')}</label>
                    <Input
                      type="text"
                      placeholder={t('firstNamePlaceholder')}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      autoFocus
                      className="glamour-input h-14 text-lg border-gray-200 rounded-2xl transition-all outline-none"
                      style={{ backgroundColor: `${primaryColor}06` }}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">{t('lastName')}</label>
                    <Input
                      type="text"
                      placeholder={t('lastNamePlaceholder')}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="glamour-input h-12 border-gray-200 rounded-2xl transition-all outline-none"
                      style={{ backgroundColor: `${primaryColor}06` }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || (!!refCode && referralLoading)}
                    className="relative w-full h-14 text-lg font-bold rounded-2xl text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || primaryColor})` }}
                  >
                    {/* Shimmer on button */}
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)', animation: 'shimmer 2.5s infinite' }} />
                    </div>
                    <span className="relative flex items-center gap-2">
                      {submitting || (!!refCode && referralLoading) ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          {t('letsGo')}
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {step === 'amount' && (
          <div className="animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 overflow-hidden">
              <div className="text-center mb-5">
                <div
                  className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3"
                  style={{ backgroundColor: `${primaryColor}12` }}
                >
                  <span className="text-2xl">💰</span>
                </div>
                <h2 className="text-lg font-bold text-gray-900">{t('serviceAmount')}</h2>
                <p className="text-sm text-gray-500 mt-1">{t('enterAmount')}</p>
              </div>
              <form onSubmit={handleAmountSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl">
                    {error}
                  </div>
                )}
                <div className="relative">
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    required
                    autoFocus
                    className="h-16 text-3xl font-bold text-center pr-14 bg-gray-50/50 border-gray-200 rounded-2xl"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-300">{getCurrencySymbol(merchant?.country)}</span>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 text-base font-bold rounded-xl text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || primaryColor})` }}
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {t('validateVisit')}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {step === 'amount-confirm' && (() => {
          const parsedConfirmAmount = parseFloat(amountInput.replace(',', '.')) || 0;
          const remainingSeconds = Math.max(1, Math.ceil(5 - confirmProgress * 5));
          return (
            <div className="animate-fade-in">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 text-center">
                <div
                  className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3"
                  style={{ backgroundColor: `${primaryColor}12` }}
                >
                  <CheckCircle2 className="w-7 h-7" style={{ color: primaryColor }} />
                </div>
                {customer && (
                  <p className="text-sm font-semibold text-gray-700 mb-1">
                    {customer.first_name} {customer.last_name}
                  </p>
                )}
                <p className="text-xs text-gray-400 mb-1">{t('amountToRecord')}</p>
                <p className="text-4xl font-black text-gray-900 mb-4">
                  {formatCurrency(parsedConfirmAmount, merchant?.country)}
                </p>

                {/* Progress bar countdown */}
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full transition-none"
                    style={{
                      width: `${confirmProgress * 100}%`,
                      background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || primaryColor})`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-400 mb-5">
                  {t('autoValidation', { seconds: remainingSeconds })}
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={cancelAmountConfirm}
                    disabled={submitting}
                    className="flex-1 h-11 text-sm font-bold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {t('modify')}
                  </button>
                  <button
                    onClick={submitAmount}
                    disabled={submitting}
                    className="flex-1 h-11 text-sm font-bold rounded-xl text-white shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || primaryColor})` }}
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      t('confirm')
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {step === 'checkin' && (
          <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
            <Loader2
              className="w-16 h-16 animate-spin"
              style={{ color: primaryColor }}
            />
            <p className="mt-4 text-gray-600">{t('checkinInProgress')}</p>
          </div>
        )}

        {step === 'success' && loyaltyCard && (
          <ScanSuccessStep
            merchant={merchant}
            loyaltyCard={loyaltyCard}
            customer={customer}
            lastCheckinPoints={lastCheckinPoints}
            previousStamps={previousStamps}
            tier1Redeemed={tier1Redeemed}
            tier2Redeemed={tier2Redeemed}
            cagnotteData={isCagnotte ? cagnotteData : undefined}
          />
        )}

        {step === 'reward' && loyaltyCard && (
          <ScanRewardScreen
            merchant={merchant}
            loyaltyCard={loyaltyCard}
            rewardTier={rewardTier}
            submitting={submitting}
            primaryColor={primaryColor}
            onRedeem={handleRedeemReward}
            onSkip={() => router.replace(`/customer/card/${merchant?.id}?scan_success=1`)}
            cagnotteData={isCagnotte ? cagnotteData : undefined}
          />
        )}

        {step === 'already-checked' && (
          <ScanAlreadyCheckedScreen
            merchant={merchant}
            loyaltyCard={loyaltyCard}
            tier1Redeemed={tier1Redeemed}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
          />
        )}

        {step === 'pending' && loyaltyCard && (
          <ScanPendingScreen
            merchant={merchant}
            loyaltyCard={loyaltyCard}
            tier1Redeemed={tier1Redeemed}
            pendingStamps={pendingStamps}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
          />
        )}

        {/* Referral / Welcome / Offer Success */}
        {step === 'referral-success' && (referralResult || welcomeResult || offerResult) && (
          <div className="animate-fade-in">
            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-8 overflow-hidden text-center">
              <div
                className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-3xl"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                {(welcomeResult || offerResult) ? (
                  <Sparkles className="w-10 h-10" style={{ color: primaryColor }} />
                ) : (
                  <PartyPopper className="w-10 h-10" style={{ color: primaryColor }} />
                )}
              </div>

              <h2 className="text-2xl font-black text-gray-900 mb-2">
                {offerResult ? `${offerResult.offer_title}` : welcomeResult ? t('welcomeAt', { name: welcomeResult.shop_name }) : t('welcome')}
              </h2>
              {referralResult && (
                <p className="text-gray-500 mb-4">
                  {t('referredBy')} <span className="font-bold text-gray-900">{referralResult.referrer_name}</span>
                </p>
              )}

              <div
                className="rounded-2xl p-4 mb-6"
                style={{ backgroundColor: `${primaryColor}10` }}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Gift className="w-4 h-4" style={{ color: primaryColor }} />
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {offerResult ? offerResult.offer_title : welcomeResult ? t('yourWelcomeOffer') : t('yourReward')}
                  </span>
                </div>
                <p className="font-bold text-lg" style={{ color: primaryColor }}>
                  {offerResult ? offerResult.offer_description : welcomeResult ? welcomeResult.welcome_reward : referralResult?.referred_reward}
                </p>
              </div>

              <p className="text-xs text-gray-400 mb-6">
                {offerResult
                  ? t('offerPresentVoucher')
                  : welcomeResult
                    ? t('welcomePresentVoucher')
                    : t('referralPresentVoucher')}
              </p>

              <button
                onClick={() => router.push(`/customer/card/${offerResult?.merchant_id || welcomeResult?.merchant_id || referralResult?.merchant_id}`)}
                className="w-full h-14 text-lg font-bold rounded-2xl text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || primaryColor})` }}
              >
                <CheckCircle2 className="w-5 h-5" />
                {t('viewMyCard')}
              </button>
            </div>
          </div>
        )}

        {/* Banned Screen */}
        {step === 'banned' && (
          <div className="animate-fade-in">
            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-8 overflow-hidden text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-3xl bg-red-100">
                <Ban className="w-10 h-10 text-red-600" />
              </div>

              <h2 className="text-2xl font-black text-gray-900 mb-2">{t('accessDenied')}</h2>
              <p className="text-gray-500 mb-8">
                {t('bannedMessage', { name: merchant?.shop_name || 'ce commerce' })}
              </p>
              <p className="text-sm text-gray-400 mb-8">
                {t('bannedContact', { name: merchant?.shop_name || 'le commerçant' })}
              </p>

              <Button onClick={() => setStep('phone')} variant="outline">
                {tc('back')}
              </Button>
            </div>
          </div>
        )}

        {step === 'error' && (
          <div className="animate-fade-in text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 mb-6 rounded-full bg-red-100">
              <AlertCircle className="w-12 h-12 text-red-600" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {t('errorTitle')}
            </h1>
            <p className="text-gray-600 mb-8">{error || t('defaultError')}</p>

            <Button onClick={() => setStep('phone')} variant="outline">
              {t('retry')}
            </Button>
          </div>
        )}
      </main>

      {/* Qarte Footer - Compact */}
      <footer className="py-3 text-center">
        <Link href="/auth/merchant/signup?utm_source=scan_page&utm_medium=footer" className="inline-flex items-center gap-1 group transition-all duration-300 hover:opacity-70">
          <div className="w-4 h-4 bg-gradient-to-br from-indigo-600 to-violet-600 rounded flex items-center justify-center">
            <span className="text-white text-[6px] font-black italic">Q</span>
          </div>
          <span className="text-xs font-bold tracking-tight text-gray-400">
            {t('poweredBy')}
          </span>
        </Link>
      </footer>
    </div>
  );
}
