'use client';

import { useState, useEffect, use, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Phone,
  User,
  ArrowRight,
  AlertCircle,
  Gift,
  Sparkles,
  Loader2,
  CreditCard,
  ChevronDown,
  Hourglass,
  Shield,
  Ban,
  Star,
  HelpCircle,
  Trophy,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Button, Input } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { formatPhoneNumber, validateFrenchPhone, getTodayInParis } from '@/lib/utils';
import type { Merchant, Customer, LoyaltyCard } from '@/types';
import { trackQrScanned, trackCardCreated, trackPointEarned, trackRewardRedeemed } from '@/lib/analytics';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { ScanSuccessStep } from '@/components/loyalty';

type Step = 'phone' | 'register' | 'checkin' | 'success' | 'already-checked' | 'error' | 'reward' | 'pending' | 'banned';

const setCookie = (name: string, value: string, days: number) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

export default function ScanPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [step, setStep] = useState<Step>('phone');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [phoneNumber, setPhoneNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loyaltyCard, setLoyaltyCard] = useState<LoyaltyCard | null>(null);

  // Checkin state
  const [lastCheckinPoints, setLastCheckinPoints] = useState(0);

  // Qarte Shield: Pending state
  const [pendingStamps, setPendingStamps] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  // How it works accordion
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);

  // Push notifications (via shared hook)
  const push = usePushNotifications({ customerId: customer?.id });

  // Track if auto-login has been attempted
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);

  // Tier rewards state
  const [rewardTier, setRewardTier] = useState<number | null>(null);
  const [tier1Redeemed, setTier1Redeemed] = useState(false);
  const [tier2Redeemed, setTier2Redeemed] = useState(false);

  useEffect(() => {
    const fetchMerchant = async () => {
      const { data } = await supabase
        .from('merchants')
        .select('*')
        .eq('scan_code', code)
        .single();

      if (data) {
        setMerchant(data);
        // Track QR scan
        trackQrScanned(data.id);
      }
      setLoading(false);
    };

    fetchMerchant();

    // Try to get saved phone from multiple sources (specific code, global, or cookie)
    const savedPhoneByCode = localStorage.getItem(`qarte_phone_${code}`);
    const savedPhoneGlobal = localStorage.getItem('qarte_customer_phone');
    const savedPhone = savedPhoneByCode || savedPhoneGlobal;

    if (savedPhone) {
      setPhoneNumber(savedPhone);
    }
  }, [code]);

  // Auto-login effect: if we have a saved phone and merchant is loaded, auto-submit
  useEffect(() => {
    const autoLogin = async () => {
      if (autoLoginAttempted || loading || !merchant || submitting) return;

      // Guard: skip auto-login if already auto-checked-in today for this scan code
      const lastAutoCheckin = localStorage.getItem(`qarte_checkin_${code}`);
      const today = new Date().toDateString();
      if (lastAutoCheckin === today) return;

      const savedPhoneByCode = localStorage.getItem(`qarte_phone_${code}`);
      const savedPhoneGlobal = localStorage.getItem('qarte_customer_phone');
      const savedPhone = savedPhoneByCode || savedPhoneGlobal;

      if (savedPhone && step === 'phone') {
        setAutoLoginAttempted(true);
        const formattedPhone = formatPhoneNumber(savedPhone);

        if (validateFrenchPhone(formattedPhone)) {
          setSubmitting(true);
          try {
            const response = await fetch(`/api/customers/register?phone=${encodeURIComponent(formattedPhone)}&merchant_id=${merchant.id}`);
            const data = await response.json();

            if (data.exists && data.customer) {
              if (data.existsForMerchant) {
                // Customer exists for this merchant → direct checkin
                setCustomer(data.customer);
                await processCheckin(data.customer);
                localStorage.setItem(`qarte_checkin_${code}`, today);
              } else if (data.existsGlobally) {
                // Customer exists globally → create for this merchant
                const createResponse = await fetch('/api/customers/register', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    phone_number: formattedPhone,
                    first_name: data.customer.first_name,
                    last_name: data.customer.last_name,
                    merchant_id: merchant.id,
                  }),
                });

                const createData = await createResponse.json();
                if (createResponse.ok && createData.customer) {
                  setCustomer(createData.customer);
                  await processCheckin(createData.customer);
                  localStorage.setItem(`qarte_checkin_${code}`, today);
                }
              }
            }
          } catch (err) {
            console.error('Auto-login failed:', err);
          } finally {
            setSubmitting(false);
          }
        }
      }
    };

    autoLogin();
  }, [loading, merchant, step, autoLoginAttempted, code, submitting]);

  const triggerConfetti = useCallback(() => {
    if (!merchant) return;
    const colors = [merchant.primary_color, merchant.secondary_color || '#fbbf24'];
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors,
    });
  }, [merchant]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!validateFrenchPhone(formattedPhone)) {
      setError('Veuillez entrer un numéro de téléphone valide');
      return;
    }

    setSubmitting(true);

    try {
      if (!merchant) {
        setStep('register');
        return;
      }

      const response = await fetch(`/api/customers/register?phone=${encodeURIComponent(formattedPhone)}&merchant_id=${merchant.id}`);
      const data = await response.json();

      if (data.exists && data.customer) {
        // Client existe déjà pour ce commerçant OU globalement
        if (data.existsForMerchant) {
          // Client existe pour ce commerçant → checkin direct
          setCustomer(data.customer);
          localStorage.setItem(`qarte_phone_${code}`, formattedPhone);
          localStorage.setItem('qarte_customer_phone', formattedPhone);
          setCookie('customer_phone', formattedPhone, 30);
          await processCheckin(data.customer);
        } else if (data.existsGlobally) {
          // Client existe chez un autre commerçant → créer pour ce commerçant avec les mêmes infos
          const createResponse = await fetch('/api/customers/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone_number: formattedPhone,
              first_name: data.customer.first_name,
              last_name: data.customer.last_name,
              merchant_id: merchant.id,
            }),
          });

          const createData = await createResponse.json();

          if (createResponse.ok && createData.customer) {
            setCustomer(createData.customer);
            localStorage.setItem(`qarte_phone_${code}`, formattedPhone);
            localStorage.setItem('qarte_customer_phone', formattedPhone);
            setCookie('customer_phone', formattedPhone, 30);
            await processCheckin(createData.customer);
          } else {
            console.error('Create failed:', createData);
            setError(createData.error || 'Erreur lors de l\'inscription');
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
      setError('Le prénom est requis');
      return;
    }

    setSubmitting(true);

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);

      const response = await fetch('/api/customers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: formattedPhone,
          first_name: firstName.trim(),
          last_name: lastName.trim() || null,
          merchant_id: merchant?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur serveur');
      }

      setCustomer(data.customer);
      localStorage.setItem(`qarte_phone_${code}`, formattedPhone);
      localStorage.setItem('qarte_customer_phone', formattedPhone);
      setCookie('customer_phone', formattedPhone, 30);
      await processCheckin(data.customer);
    } catch (err) {
      console.error(err);
      setError('Erreur lors de l\'inscription');
    } finally {
      setSubmitting(false);
    }
  };

  const processCheckin = async (cust: Customer) => {
    if (!merchant) return;

    setStep('checkin');

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);

      // Use the /api/checkin endpoint with Qarte Shield
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scan_code: code,
          phone_number: formattedPhone,
          first_name: cust.first_name,
          last_name: cust.last_name,
          points_to_add: 1,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.banned) {
          setStep('banned');
          return;
        }
        throw new Error(data.error || 'Erreur serveur');
      }

      // Update state with response data
      setLastCheckinPoints(data.points_earned || 1);

      // Create updated card object
      const updatedCard = {
        id: data.visit_id,
        customer_id: cust.id,
        merchant_id: merchant.id,
        current_stamps: data.current_stamps,
        stamps_target: merchant.stamps_required,
        last_visit_date: getTodayInParis(),
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
        triggerConfetti();
        setStep('reward');
      } else {
        // Redirect to card page instead of staying on scan URL
        router.replace(`/customer/card/${merchant.id}?scan_success=1&points=${data.points_earned || 1}`);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement du passage');
      setStep('error');
    }
  };

  const handleRedeemReward = async () => {
    if (!loyaltyCard || !customer || !merchant) return;

    setSubmitting(true);

    try {
      // Determine which tier is being redeemed
      const tierToRedeem = rewardTier || 1;
      const tier2Enabled = merchant.tier2_enabled && merchant.tier2_stamps_required;

      // Insert redemption with tier info
      const { error: redemptionError } = await supabase.from('redemptions').insert({
        loyalty_card_id: loyaltyCard.id,
        merchant_id: merchant.id,
        customer_id: customer.id,
        stamps_used: tierToRedeem === 1 ? merchant.stamps_required : merchant.tier2_stamps_required,
        tier: tierToRedeem,
      });

      if (redemptionError) {
        console.error('Redemption insert error:', redemptionError);
        setError('Erreur lors de l\'enregistrement de la récompense. Veuillez réessayer.');
        setStep('error');
        return;
      }

      // Only reset stamps to 0 when:
      // - Redeeming tier 2 (always reset after tier 2)
      // - Redeeming tier 1 AND tier 2 is NOT enabled (classic single-tier flow)
      const shouldResetStamps = tierToRedeem === 2 || !tier2Enabled;

      if (shouldResetStamps) {
        const { error: updateError } = await supabase
          .from('loyalty_cards')
          .update({ current_stamps: 0 })
          .eq('id', loyaltyCard.id);

        if (updateError) {
          console.error('Stamps update error:', updateError);
          // Continue anyway, redemption was recorded
        }
        setLoyaltyCard({ ...loyaltyCard, current_stamps: 0 });
      }

      // Update local tier redeemed state
      if (tierToRedeem === 1) {
        setTier1Redeemed(true);
      } else if (tierToRedeem === 2) {
        setTier2Redeemed(true);
        // After tier 2, reset tier 1 redeemed as well (new cycle)
        setTier1Redeemed(false);
      }

      setRewardTier(null);
      // Redirect to card page after redemption
      router.replace(`/customer/card/${merchant.id}?scan_success=1&redeemed=1`);
    } catch (err) {
      console.error('Redeem error:', err);
      setError('Erreur lors de l\'utilisation de la récompense');
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
        <h1 className="text-xl font-bold text-gray-900">Commerce introuvable</h1>
        <p className="mt-2 text-gray-600">Ce QR code n&apos;est plus valide</p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  const primaryColor = merchant.primary_color;
  const secondaryColor = merchant.secondary_color;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(135deg, white, ${primaryColor}12)` }}>
      <main className="flex-1 px-4 pt-4 pb-4 mx-auto max-w-md w-full">
        {step === 'phone' && (
          <div className="animate-fade-in">
            {/* Welcome Banner */}
            <div className="relative mb-4 overflow-hidden rounded-3xl shadow-xl border border-gray-100">
              {/* Logo/Image Section - Compact with gradient background */}
              <div
                className="relative h-40 flex items-center justify-center overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${primaryColor}30, ${secondaryColor || primaryColor}40)` }}
              >
                {/* Decorative gradient circles */}
                <div
                  className="absolute -top-12 -right-12 w-36 h-36 rounded-full opacity-30"
                  style={{ background: `radial-gradient(circle, ${primaryColor}, transparent)` }}
                />
                <div
                  className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full opacity-25"
                  style={{ background: `radial-gradient(circle, ${secondaryColor || primaryColor}, transparent)` }}
                />

                {/* Logo or Initial */}
                {merchant.logo_url ? (
                  <div className="relative">
                    <div
                      className="absolute -inset-3 rounded-2xl blur-xl opacity-40"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <img
                      src={merchant.logo_url}
                      alt={merchant.shop_name}
                      className="relative w-28 h-28 rounded-2xl object-cover shadow-2xl border-3 border-white/90"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <div
                      className="absolute -inset-3 rounded-full blur-xl opacity-40"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <div
                      className="relative w-28 h-28 rounded-full flex items-center justify-center shadow-2xl border-3 border-white/90"
                      style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || primaryColor})` }}
                    >
                      <span className="text-5xl font-black text-white drop-shadow-lg">{merchant.shop_name[0]}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Content Section */}
              <div className="relative bg-white pt-5 pb-4 px-6 text-center overflow-hidden">
                {/* Subtle Gift icon background */}
                <Gift
                  className="absolute -right-4 -bottom-4 w-24 h-24 opacity-[0.03]"
                  style={{ color: primaryColor }}
                />

                <div className="relative z-10">
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1.5">
                    Bienvenue chez <span style={{ color: primaryColor }}>{merchant.shop_name}</span>
                  </h2>

                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4" style={{ color: primaryColor }} />
                    <p className="text-lg font-extrabold text-gray-900 tracking-tight">
                      Nous récompensons votre fidélité
                    </p>
                    <Sparkles className="w-4 h-4" style={{ color: primaryColor }} />
                  </div>

                  {/* Reward Badges */}
                  <div className="flex flex-col gap-2">
                    {/* Tier 1 - Primary Reward */}
                    <div
                      className="inline-flex items-center gap-2.5 px-3 py-2 rounded-full border shadow-sm transition-transform active:scale-95"
                      style={{ backgroundColor: `${primaryColor}05`, borderColor: `${primaryColor}15` }}
                    >
                      <Gift className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                      <span className="text-[13px] font-bold text-gray-800">
                        {merchant.reward_description}
                      </span>
                      <div className="flex items-center gap-1.5 pl-2 border-l border-gray-200">
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded text-white shadow-sm" style={{ backgroundColor: primaryColor }}>
                          {merchant.stamps_required}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-tighter text-gray-400">
                          Visites
                        </span>
                      </div>
                    </div>

                    {/* Tier 2 - Premium Reward (if enabled) */}
                    {merchant.tier2_enabled && merchant.tier2_stamps_required && merchant.tier2_reward_description && (
                      <div
                        className="inline-flex items-center gap-2.5 px-3 py-2 rounded-full border shadow-sm transition-transform active:scale-95"
                        style={{ backgroundColor: '#fef3c705', borderColor: '#fbbf2415' }}
                      >
                        <Trophy className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-[13px] font-bold text-gray-800">
                          {merchant.tier2_reward_description}
                        </span>
                        <div className="flex items-center gap-1.5 pl-2 border-l border-gray-200">
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded text-white shadow-sm bg-gradient-to-r from-amber-500 to-orange-500">
                            {merchant.tier2_stamps_required}
                          </span>
                          <span className="text-[9px] font-bold uppercase tracking-tighter text-gray-400">
                            Visites
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

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
                    <span className="font-medium text-gray-600 text-sm">Comment ça marche ?</span>
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
                            title: "Cumulez vos points",
                            description: "Chaque passage validé vous rapproche de votre récompense."
                          },
                          {
                            icon: <Gift className="w-4 h-4" />,
                            title: "Recevez vos cadeaux",
                            description: merchant.tier2_enabled && merchant.tier2_stamps_required
                              ? `Palier 1 (${merchant.stamps_required} pts) : ${merchant.reward_description} • Palier 2 (${merchant.tier2_stamps_required} pts) : ${merchant.tier2_reward_description}`
                              : `Après ${merchant.stamps_required} passages, obtenez : ${merchant.reward_description}`
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

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5 overflow-hidden">
              <form onSubmit={handlePhoneSubmit} className="space-y-3">
                {error && (
                  <div className="p-3 text-sm font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl">
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 ml-1">Numéro de téléphone</label>
                  <div className="relative group">
                    <Input
                      type="tel"
                      placeholder="06 12 34 56 78"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                      className="h-12 text-base pl-11 bg-gray-50/50 border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 rounded-xl transition-all"
                    />
                    <Phone className="absolute w-4 h-4 text-gray-400 left-4 top-1/2 transform -translate-y-1/2 group-focus-within:text-gray-600 transition-colors" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 text-base font-bold rounded-xl text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || primaryColor})` }}
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Valider mon passage
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
            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-8 overflow-hidden">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ backgroundColor: `${primaryColor}15` }}>
                  <User className="w-8 h-8" style={{ color: primaryColor }} />
                </div>
                <h2 className="text-2xl font-black text-gray-900">Bienvenue !</h2>
                <p className="mt-2 text-gray-500">Créez votre carte en quelques secondes</p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-5">
                {error && (
                  <div className="p-4 text-sm font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-2xl">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Prénom</label>
                  <Input
                    type="text"
                    placeholder="Votre prénom"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    autoFocus
                    className="h-14 text-lg bg-white/50 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">
                    Nom <span className="text-gray-400 font-normal">(optionnel)</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Votre nom"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-12 bg-white/50 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-14 text-lg font-bold rounded-2xl text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || primaryColor})` }}
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Créer mon compte
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {step === 'checkin' && (
          <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
            <Loader2
              className="w-16 h-16 animate-spin"
              style={{ color: primaryColor }}
            />
            <p className="mt-4 text-gray-600">Enregistrement en cours...</p>
          </div>
        )}

        {step === 'success' && loyaltyCard && (
          <ScanSuccessStep
            merchant={merchant}
            loyaltyCard={loyaltyCard}
            customer={customer}
            lastCheckinPoints={lastCheckinPoints}
            tier1Redeemed={tier1Redeemed}
            tier2Redeemed={tier2Redeemed}
            pushSupported={push.pushSupported}
            pushSubscribed={push.pushSubscribed}
            pushPermission={push.pushPermission}
            pushSubscribing={push.pushSubscribing}
            isIOS={push.isIOS}
            isStandalone={push.isStandalone}
            handlePushSubscribe={push.handlePushSubscribe}
          />
        )}

        {step === 'reward' && loyaltyCard && (
          <div className="animate-fade-in">
            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-8 overflow-hidden text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-3xl bg-emerald-100">
                {rewardTier === 2 ? (
                  <Trophy className="w-10 h-10 text-emerald-600" />
                ) : (
                  <Gift className="w-10 h-10 text-emerald-600" />
                )}
              </div>

              <h2 className="text-2xl font-black text-gray-900 mb-2">🎉 Félicitations !</h2>
              <p className="text-gray-500 mb-6">
                Vous avez atteint {rewardTier === 2 ? merchant?.tier2_stamps_required : merchant?.stamps_required} passages !
              </p>

              {/* Reward Card */}
              <div
                className="rounded-3xl p-6 mb-8 border"
                style={{ backgroundColor: `${primaryColor}08`, borderColor: `${primaryColor}20` }}
              >
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  {rewardTier === 2 ? 'Palier 2 - Votre récompense' : (merchant?.tier2_enabled ? 'Palier 1 - Votre récompense' : 'Votre récompense')}
                </p>
                <p className="text-xl font-black" style={{ color: primaryColor }}>
                  {rewardTier === 2 ? merchant?.tier2_reward_description : merchant?.reward_description}
                </p>
              </div>

              <button
                onClick={handleRedeemReward}
                disabled={submitting}
                className="w-full h-16 rounded-2xl text-lg font-bold text-white shadow-lg shadow-emerald-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500"
              >
                {submitting ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Gift className="w-6 h-6" />
                    Utiliser ma récompense
                  </>
                )}
              </button>

              <p className="mt-4 text-sm text-gray-400">Montrez cet écran au commerçant</p>

              <button
                onClick={() => router.replace(`/customer/card/${merchant?.id}?scan_success=1`)}
                className="mt-4 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                Plus tard →
              </button>
            </div>
          </div>
        )}

        {step === 'already-checked' && (
          <div className="animate-fade-in">
            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-8 overflow-hidden text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-3xl bg-amber-100">
                <AlertCircle className="w-10 h-10 text-amber-600" />
              </div>

              <h2 className="text-2xl font-black text-gray-900 mb-2">Déjà validé !</h2>
              <p className="text-gray-500 mb-8">Vous avez déjà validé votre passage aujourd&apos;hui. Revenez demain !</p>

              {/* Points Display */}
              {(() => {
                const stamps = loyaltyCard?.current_stamps || 0;
                const tier2On = merchant?.tier2_enabled && merchant?.tier2_stamps_required;
                const tier1Done = tier1Redeemed || stamps >= (merchant?.stamps_required || 10);
                const target = tier2On && tier1Done
                  ? merchant.tier2_stamps_required!
                  : (merchant?.stamps_required || 10);
                return (
                  <>
                    <div className="mb-8">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-5xl font-black" style={{ color: primaryColor }}>{stamps}</span>
                        <span className="text-xl font-bold text-gray-300">/{target}</span>
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
                        Passages cumulés{tier2On && tier1Done ? ' · Palier 2' : tier2On ? ' · Palier 1' : ''}
                      </p>
                    </div>
                    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden mb-6">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (stamps / target) * 100)}%`,
                          background: tier2On && tier1Done
                            ? 'linear-gradient(90deg, #8b5cf6, #a78bfa)'
                            : `linear-gradient(90deg, ${primaryColor}, ${secondaryColor || primaryColor})`
                        }}
                      />
                    </div>
                  </>
                );
              })()}

              <Link
                href={`/customer/card/${merchant.id}`}
                className="w-full h-14 rounded-2xl font-bold border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                Voir ma carte complète
              </Link>
            </div>
          </div>
        )}

        {/* Qarte Shield: Pending Verification Screen */}
        {step === 'pending' && loyaltyCard && (
          <div className="animate-fade-in">
            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-8 overflow-hidden text-center">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-amber-50">
                <Hourglass className="w-10 h-10 text-amber-600 animate-pulse" />
              </div>

              <h2 className="text-2xl font-black text-gray-900 mb-2">
                Passage en cours de vérification
              </h2>
              <p className="text-gray-500 mb-6">
                Pour votre sécurité, ce passage doit être validé par votre commerçant.
              </p>

              {/* Info Card */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8 text-left">
                <p className="text-sm text-amber-900 leading-relaxed">
                  Notre système a détecté plusieurs passages aujourd&apos;hui. Cette mesure protège votre compte contre les utilisations frauduleuses. Votre passage sera validé dès confirmation par le commerçant.
                </p>
              </div>

              {/* Points Display */}
              {(() => {
                const tier2On = merchant?.tier2_enabled && merchant?.tier2_stamps_required;
                const tier1Done = tier1Redeemed || loyaltyCard.current_stamps >= (merchant?.stamps_required || 10);
                const target = tier2On && tier1Done
                  ? merchant.tier2_stamps_required!
                  : (merchant?.stamps_required || 10);
                return (
                  <div className="mb-8">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-5xl font-black" style={{ color: primaryColor }}>
                        {loyaltyCard.current_stamps}
                      </span>
                      <span className="text-xl font-bold text-gray-300">/{target}</span>
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
                      Passages confirmés{tier2On && tier1Done ? ' · Palier 2' : tier2On ? ' · Palier 1' : ''}
                    </p>
                    <div className="mt-3 inline-flex px-3 py-1.5 bg-amber-100 rounded-full">
                      <span className="text-sm font-bold text-amber-700">
                        + {pendingStamps} en attente
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Progress Bar */}
              {(() => {
                const tier2On = merchant?.tier2_enabled && merchant?.tier2_stamps_required;
                const tier1Done = tier1Redeemed || loyaltyCard.current_stamps >= (merchant?.stamps_required || 10);
                const target = tier2On && tier1Done
                  ? merchant.tier2_stamps_required!
                  : (merchant?.stamps_required || 10);
                return (
                  <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden mb-6">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (loyaltyCard.current_stamps / target) * 100)}%`,
                        background: tier2On && tier1Done
                          ? 'linear-gradient(90deg, #8b5cf6, #a78bfa)'
                          : `linear-gradient(90deg, ${primaryColor}, ${secondaryColor || primaryColor})`
                      }}
                    />
                  </div>
                );
              })()}

              <Link
                href={`/customer/card/${merchant.id}`}
                className="w-full h-14 rounded-2xl font-bold border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                Voir ma carte complète
              </Link>

              {/* Shield Badge */}
              <div className="flex items-center justify-center gap-2 mt-6">
                <Shield className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">
                  Protégé par Qarte Shield
                </span>
              </div>
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

              <h2 className="text-2xl font-black text-gray-900 mb-2">Accès non autorisé</h2>
              <p className="text-gray-500 mb-8">
                Ce numéro n&apos;est plus autorisé à utiliser le programme de fidélité de ce commerce.
              </p>
              <p className="text-sm text-gray-400 mb-8">
                Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur, contactez directement le commerçant.
              </p>

              <Button onClick={() => setStep('phone')} variant="outline">
                Retour
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
              Oups, une erreur est survenue
            </h1>
            <p className="text-gray-600 mb-8">{error || 'Veuillez réessayer'}</p>

            <Button onClick={() => setStep('phone')} variant="outline">
              Réessayer
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
            Propulsé par QARTE
          </span>
        </Link>
      </footer>
    </div>
  );
}
