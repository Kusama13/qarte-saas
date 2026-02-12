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
  Loader2,
  ChevronDown,
  Ban,
  Star,
  HelpCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Button, Input } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { formatPhoneNumber, validateFrenchPhone, getTodayInParis, PHONE_CONFIG } from '@/lib/utils';
import type { Merchant, Customer, LoyaltyCard } from '@/types';
import { trackQrScanned, trackCardCreated, trackPointEarned, trackRewardRedeemed } from '@/lib/analytics';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { ScanSuccessStep } from '@/components/loyalty';
import { WelcomeBanner, ScanRewardScreen, ScanAlreadyCheckedScreen, ScanPendingScreen } from '@/components/scan';

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

  // Previous stamps for success animation (old → new)
  const [previousStamps, setPreviousStamps] = useState(0);

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
        const formattedPhone = formatPhoneNumber(savedPhone, merchant.country || 'FR');

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
    const colors = [merchant.primary_color, merchant.secondary_color || '#fbbf24', '#ffffff'];

    // Haptic feedback
    if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);

    // Wave 1 — center burst
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 }, colors });

    // Wave 2 — side bursts (500ms)
    setTimeout(() => {
      confetti({ particleCount: 50, spread: 90, origin: { y: 0.55, x: 0.2 }, colors });
      confetti({ particleCount: 50, spread: 90, origin: { y: 0.55, x: 0.8 }, colors });
    }, 500);

    // Wave 3 — golden rain (1s)
    setTimeout(() => {
      confetti({ particleCount: 30, spread: 120, origin: { y: 0.3 }, colors: ['#fbbf24', '#f59e0b', '#ffffff'], gravity: 0.8 });
    }, 1000);
  }, [merchant]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const formattedPhone = formatPhoneNumber(phoneNumber, merchant?.country || 'FR');
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
      const formattedPhone = formatPhoneNumber(phoneNumber, merchant?.country || 'FR');
      localStorage.setItem(`qarte_phone_${code}`, formattedPhone);
      localStorage.setItem('qarte_customer_phone', formattedPhone);
      setCookie('customer_phone', formattedPhone, 30);
      // Skip register API — checkin creates customer + card + visit in one call
      await processCheckin({ first_name: firstName.trim(), last_name: lastName.trim() || null });
    } catch (err) {
      console.error(err);
      setError('Erreur lors de l\'inscription');
    } finally {
      setSubmitting(false);
    }
  };

  const processCheckin = async (customerInfo: { first_name: string; last_name?: string | null }) => {
    if (!merchant) return;

    setStep('checkin');

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber, merchant?.country || 'FR');

      // Use the /api/checkin endpoint with Qarte Shield
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scan_code: code,
          phone_number: formattedPhone,
          first_name: customerInfo.first_name,
          last_name: customerInfo.last_name,
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

      // Create updated card object
      const updatedCard = {
        id: data.visit_id,
        customer_id: data.customer_id,
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
        // Show animated success screen (auto-redirects to card after 3s)
        setStep('success');
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
            <WelcomeBanner merchant={merchant} primaryColor={primaryColor} secondaryColor={secondaryColor} />

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
                  <label className="text-xs font-bold text-gray-600 ml-1">Votre numéro de téléphone</label>
                  <div className="relative group">
                    <Input
                      type="tel"
                      placeholder={PHONE_CONFIG[merchant.country || 'FR'].placeholder}
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
            previousStamps={previousStamps}
            tier1Redeemed={tier1Redeemed}
            tier2Redeemed={tier2Redeemed}
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
