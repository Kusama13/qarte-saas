'use client';

import { useState, useEffect, use, useCallback } from 'react';
import Link from 'next/link';
import {
  Phone,
  User,
  ArrowRight,
  Check,
  AlertCircle,
  Gift,
  Sparkles,
  Loader2,
  CreditCard,
  ChevronRight,
  ChevronDown,
  Minus,
  Plus,
  Undo2,
  Hourglass,
  Shield,
  Ban,
  QrCode,
  Star,
  HelpCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Button, Input } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { formatPhoneNumber, validateFrenchPhone, getTodayInParis } from '@/lib/utils';
import type { Merchant, Customer, LoyaltyCard } from '@/types';

type Step = 'phone' | 'register' | 'checkin' | 'success' | 'already-checked' | 'error' | 'reward' | 'article-select' | 'pending' | 'banned';

const setCookie = (name: string, value: string, days: number) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

export default function ScanPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
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

  // Article mode state
  const [quantity, setQuantity] = useState(1);
  const [canUndo, setCanUndo] = useState(false);
  const [undoTimer, setUndoTimer] = useState(0);
  const [lastCheckinPoints, setLastCheckinPoints] = useState(0);
  const [lastVisitId, setLastVisitId] = useState<string | null>(null);

  // Qarte Shield: Pending state
  const [pendingStamps, setPendingStamps] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  // How it works accordion
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);

  useEffect(() => {
    const fetchMerchant = async () => {
      const { data } = await supabase
        .from('merchants')
        .select('*')
        .eq('scan_code', code)
        .single();

      if (data) {
        setMerchant(data);
      }
      setLoading(false);
    };

    fetchMerchant();

    const savedPhone = localStorage.getItem(`qarte_phone_${code}`);
    if (savedPhone) {
      setPhoneNumber(savedPhone);
    }
  }, [code]);

  // Undo timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (canUndo && undoTimer > 0) {
      interval = setInterval(() => {
        setUndoTimer((prev) => {
          if (prev <= 1) {
            setCanUndo(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [canUndo, undoTimer]);

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
          console.log('Customer exists globally:', data.customer);

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
          console.log('Create response:', createData);

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

  const processCheckin = async (cust: Customer, pointsToAdd?: number) => {
    if (!merchant) return;

    // For article mode, show quantity selector first
    if (merchant.loyalty_mode === 'article' && pointsToAdd === undefined) {
      // Get or create the card first
      let { data: card } = await supabase
        .from('loyalty_cards')
        .select('*')
        .eq('customer_id', cust.id)
        .eq('merchant_id', merchant.id)
        .single();

      if (!card) {
        const { data: newCard, error: cardError } = await supabase
          .from('loyalty_cards')
          .insert({
            customer_id: cust.id,
            merchant_id: merchant.id,
            current_stamps: 0,
            stamps_target: merchant.stamps_required,
          })
          .select()
          .single();

        if (cardError) throw cardError;
        card = newCard;
      }

      setLoyaltyCard(card);
      setStep('article-select');
      return;
    }

    setStep('checkin');

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      const points = pointsToAdd || 1;

      // Use the new /api/checkin endpoint with Qarte Shield
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scan_code: code,
          phone_number: formattedPhone,
          first_name: cust.first_name,
          last_name: cust.last_name,
          points_to_add: points,
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
      setLastVisitId(data.visit_id);
      setLastCheckinPoints(data.points_earned || points);

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

      // Handle different statuses from Qarte Shield
      if (data.status === 'pending') {
        setPendingStamps(data.pending_stamps || points);
        setPendingCount(data.pending_count || 1);
        setStep('pending');
        return;
      }

      // Confirmed - normal flow
      setCanUndo(true);
      setUndoTimer(30);

      if (data.reward_unlocked) {
        triggerConfetti();
        setStep('reward');
      } else {
        setStep('success');
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement du passage');
      setStep('error');
    }
  };

  const handleArticleCheckin = async () => {
    if (!customer) return;
    await processCheckin(customer, quantity);
    setQuantity(1); // Reset quantity
  };

  const handleUndo = async () => {
    if (!canUndo || !loyaltyCard || !lastVisitId) return;

    setSubmitting(true);
    try {
      // Delete the visit
      await supabase.from('visits').delete().eq('id', lastVisitId);

      // Update the card
      const newStamps = Math.max(0, loyaltyCard.current_stamps - lastCheckinPoints);
      await supabase
        .from('loyalty_cards')
        .update({ current_stamps: newStamps })
        .eq('id', loyaltyCard.id);

      setLoyaltyCard({ ...loyaltyCard, current_stamps: newStamps });
      setCanUndo(false);
      setUndoTimer(0);
      setLastVisitId(null);

      // Go back to article select if in article mode
      if (merchant?.loyalty_mode === 'article') {
        setStep('article-select');
      } else {
        setStep('phone');
      }
    } catch (err) {
      console.error('Undo error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRedeemReward = async () => {
    if (!loyaltyCard || !customer || !merchant) return;

    setSubmitting(true);

    try {
      await supabase.from('redemptions').insert({
        loyalty_card_id: loyaltyCard.id,
        merchant_id: merchant.id,
        customer_id: customer.id,
        stamps_used: loyaltyCard.current_stamps,
      });

      await supabase
        .from('loyalty_cards')
        .update({ current_stamps: 0 })
        .eq('id', loyaltyCard.id);

      setLoyaltyCard({ ...loyaltyCard, current_stamps: 0 });
      setStep('success');
    } catch (err) {
      console.error(err);
      setError('Erreur lors de l\'utilisation de la récompense');
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
        <Link href="/" className="mt-4">
          <Button variant="outline">Retour à l&apos;accueil</Button>
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

                  {/* Reward Badge - Compact & Refined */}
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
                        {merchant.loyalty_mode === 'visit' ? 'Visites' : (merchant.product_name || 'Articles')}
                      </span>
                    </div>
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
                            icon: <QrCode className="w-4 h-4" />,
                            title: "Scannez le QR code",
                            description: merchant.loyalty_mode === 'visit'
                              ? "Présentez ce code à chaque visite pour valider votre passage."
                              : `Scannez à chaque achat de ${merchant.product_name || 'produit'}.`
                          },
                          {
                            icon: <Star className="w-4 h-4" />,
                            title: "Cumulez vos points",
                            description: merchant.loyalty_mode === 'visit'
                              ? "Chaque passage validé vous rapproche de votre récompense."
                              : `Chaque ${merchant.product_name || 'article'} acheté = 1 point sur votre carte.`
                          },
                          {
                            icon: <Gift className="w-4 h-4" />,
                            title: "Recevez votre cadeau",
                            description: `Après ${merchant.stamps_required} ${merchant.loyalty_mode === 'visit' ? 'passages' : (merchant.product_name || 'articles')}, obtenez : ${merchant.reward_description}`
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

        {step === 'article-select' && loyaltyCard && (
          <div className="animate-fade-in">
            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-8 overflow-hidden">
              {/* Customer Info */}
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl"
                  style={{ backgroundColor: primaryColor }}
                >
                  {customer?.first_name[0]}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">
                    {customer?.first_name} {customer?.last_name || ''}
                  </p>
                  <p className="text-sm text-gray-500">{customer?.phone_number}</p>
                </div>
              </div>

              {/* Current Points */}
              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-black" style={{ color: primaryColor }}>
                    {loyaltyCard.current_stamps}
                  </span>
                  <span className="text-xl font-bold text-gray-300">/{merchant?.stamps_required}</span>
                </div>
                <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">
                  {merchant?.product_name || 'Articles'} cumulés
                </p>
              </div>

              {/* Progress Bar */}
              <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden mb-6">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (loyaltyCard.current_stamps / (merchant?.stamps_required || 10)) * 100)}%`,
                    background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor || primaryColor})`
                  }}
                />
              </div>

              {/* Quantity Selector */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-600 mb-3 text-center">
                  Nombre de {merchant?.product_name || 'articles'}
                </p>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-6 h-6 text-gray-600" />
                  </button>
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-lg"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {quantity}
                  </div>
                  <button
                    onClick={() => setQuantity(Math.min(merchant?.max_quantity_per_scan || 5, quantity + 1))}
                    disabled={quantity >= (merchant?.max_quantity_per_scan || 5)}
                    className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-6 h-6 text-gray-600" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 text-center mt-2">
                  Max: {merchant?.max_quantity_per_scan || 5} par scan
                </p>
              </div>

              {/* Confirmation Message */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-4">
                <p className="text-sm font-medium text-indigo-900 text-center">
                  Vous ajoutez <span className="font-bold">{quantity} {merchant?.product_name || 'article'}{quantity > 1 ? 's' : ''}</span> à votre carte
                </p>
                <p className="text-xs text-indigo-600/70 text-center mt-1">
                  Merci de valider uniquement vos achats du jour
                </p>
              </div>

              {/* Checkin Button */}
              <button
                onClick={handleArticleCheckin}
                disabled={submitting}
                className="w-full h-16 rounded-2xl text-xl font-bold text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || primaryColor})` }}
              >
                {submitting ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-6 h-6" />
                    Valider {quantity} {merchant?.product_name || 'article'}{quantity > 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>

            {/* Reward Preview */}
            <div className="mt-6 bg-white rounded-3xl shadow-lg border border-gray-100 p-5 flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <Gift className="w-7 h-7" style={{ color: primaryColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                  À {merchant?.stamps_required} {merchant?.product_name || 'articles'}
                </p>
                <p className="text-base font-bold text-gray-900 leading-tight truncate">{merchant?.reward_description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
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
          <div className="animate-fade-in">
            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-8 overflow-hidden text-center">
              <div
                className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-3xl"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <Check className="w-10 h-10" style={{ color: primaryColor }} />
              </div>

              <h2 className="text-2xl font-black text-gray-900 mb-1">
                {merchant?.loyalty_mode === 'article'
                  ? `+${lastCheckinPoints} ${merchant?.product_name || 'article'}${lastCheckinPoints > 1 ? 's' : ''} !`
                  : 'Passage validé !'
                }
              </h2>
              <p className="text-gray-500 mb-8">Merci {customer?.first_name} !</p>

              {/* Large Points Display */}
              <div className="mb-8">
                <div className="flex items-baseline justify-center gap-1">
                  <motion.span
                    key={loyaltyCard.current_stamps}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="text-6xl font-black"
                    style={{ color: primaryColor }}
                  >
                    {loyaltyCard.current_stamps}
                  </motion.span>
                  <span className="text-2xl font-bold text-gray-300">/{merchant?.stamps_required}</span>
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
                  {merchant?.loyalty_mode === 'visit' ? 'Passages cumulés' : `${merchant?.product_name || 'Articles'} cumulés`}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden mb-6">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (loyaltyCard.current_stamps / (merchant?.stamps_required || 10)) * 100)}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor || primaryColor})`
                  }}
                />
              </div>

              {/* Status Message */}
              {loyaltyCard.current_stamps < (merchant?.stamps_required || 10) && (
                <div
                  className="rounded-2xl p-4 mb-6"
                  style={{ backgroundColor: `${primaryColor}08`, borderColor: `${primaryColor}15` }}
                >
                  <p className="font-bold text-gray-700">
                    Plus que {(merchant?.stamps_required || 10) - loyaltyCard.current_stamps} {merchant?.loyalty_mode === 'visit' ? 'passage' : (merchant?.product_name || 'article')}{(merchant?.stamps_required || 10) - loyaltyCard.current_stamps > 1 ? 's' : ''} avant votre récompense !
                  </p>
                </div>
              )}

              {/* Undo Button - Only in article mode */}
              <AnimatePresence>
                {canUndo && merchant?.loyalty_mode === 'article' && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    onClick={handleUndo}
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-3 py-4 mb-4 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700 font-medium"
                  >
                    <Undo2 className="w-5 h-5" />
                    Annuler ({undoTimer}s)
                  </motion.button>
                )}
              </AnimatePresence>

              <Link href={`/customer/card/${merchant.id}`}>
                <button className="w-full h-14 rounded-2xl font-bold border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Voir ma carte complète
                </button>
              </Link>
            </div>
          </div>
        )}

        {step === 'reward' && loyaltyCard && (
          <div className="animate-fade-in">
            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-8 overflow-hidden text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-3xl bg-emerald-100">
                <Gift className="w-10 h-10 text-emerald-600" />
              </div>

              <h2 className="text-2xl font-black text-gray-900 mb-2">🎉 Félicitations !</h2>
              <p className="text-gray-500 mb-6">
                Vous avez atteint {merchant?.stamps_required} {merchant?.loyalty_mode === 'visit' ? 'passages' : (merchant?.product_name || 'articles')} !
              </p>

              {/* Reward Card */}
              <div
                className="rounded-3xl p-6 mb-8 border"
                style={{ backgroundColor: `${primaryColor}08`, borderColor: `${primaryColor}20` }}
              >
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Votre récompense</p>
                <p className="text-xl font-black" style={{ color: primaryColor }}>
                  {merchant?.reward_description}
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
              <div className="mb-8">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-black" style={{ color: primaryColor }}>{loyaltyCard?.current_stamps || 0}</span>
                  <span className="text-xl font-bold text-gray-300">/{merchant?.stamps_required}</span>
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
                  {merchant?.loyalty_mode === 'visit' ? 'Passages cumulés' : `${merchant?.product_name || 'Articles'} cumulés`}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden mb-6">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, ((loyaltyCard?.current_stamps || 0) / (merchant?.stamps_required || 10)) * 100)}%`,
                    background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor || primaryColor})`
                  }}
                />
              </div>

              <Link href={`/customer/card/${merchant.id}`}>
                <button className="w-full h-14 rounded-2xl font-bold border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Voir ma carte complète
                </button>
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
                  {merchant?.loyalty_mode === 'visit'
                    ? "Notre système a détecté plusieurs passages aujourd'hui. Cette mesure protège votre compte contre les utilisations frauduleuses. Votre passage sera validé dès confirmation par le commerçant."
                    : `Notre système a détecté une activité inhabituelle. Cette mesure protège votre compte contre les utilisations frauduleuses. Vos ${merchant?.product_name || 'articles'} seront ajoutés dès validation.`
                  }
                </p>
              </div>

              {/* Points Display */}
              <div className="mb-8">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-black" style={{ color: primaryColor }}>
                    {loyaltyCard.current_stamps}
                  </span>
                  <span className="text-xl font-bold text-gray-300">/{merchant?.stamps_required}</span>
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
                  {merchant?.loyalty_mode === 'visit' ? 'Passages confirmés' : `${merchant?.product_name || 'Articles'} confirmés`}
                </p>
                <div className="mt-3 inline-flex px-3 py-1.5 bg-amber-100 rounded-full">
                  <span className="text-sm font-bold text-amber-700">
                    + {pendingStamps} en attente
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden mb-6">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, (loyaltyCard.current_stamps / (merchant?.stamps_required || 10)) * 100)}%`,
                    background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor || primaryColor})`
                  }}
                />
              </div>

              <Link href={`/customer/card/${merchant.id}`}>
                <button className="w-full h-14 rounded-2xl font-bold border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Voir ma carte complète
                </button>
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
        <Link href="/" className="inline-flex items-center gap-1 group transition-all duration-300 hover:opacity-70">
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
