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
  Loader2,
  CreditCard,
  ChevronRight,
  Minus,
  Plus,
  Undo2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Button, Input } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { formatPhoneNumber, validateFrenchPhone, getTodayInParis } from '@/lib/utils';
import type { Merchant, Customer, LoyaltyCard } from '@/types';

type Step = 'phone' | 'register' | 'checkin' | 'success' | 'already-checked' | 'error' | 'reward' | 'article-select';

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

      const today = getTodayInParis();
      // For visit mode, check if already checked in today
      if (merchant.loyalty_mode === 'visit' && card.last_visit_date === today) {
        setLoyaltyCard(card);
        setStep('already-checked');
        return;
      }

      const points = pointsToAdd || 1;
      const newStamps = card.current_stamps + points;

      const { error: updateError } = await supabase
        .from('loyalty_cards')
        .update({
          current_stamps: newStamps,
          last_visit_date: today,
        })
        .eq('id', card.id);

      if (updateError) throw updateError;

      const { data: visitData } = await supabase.from('visits').insert({
        loyalty_card_id: card.id,
        merchant_id: merchant.id,
        customer_id: cust.id,
        points_earned: points,
      }).select().single();

      if (visitData) {
        setLastVisitId(visitData.id);
      }

      setLastCheckinPoints(points);
      const updatedCard = { ...card, current_stamps: newStamps };
      setLoyaltyCard(updatedCard);

      // Start undo timer
      setCanUndo(true);
      setUndoTimer(30);

      if (newStamps >= merchant.stamps_required) {
        triggerConfetti();
        setStep('reward');
      } else {
        setStep('success');
      }
    } catch (err) {
      console.error(err);
      setError('Erreur lors de l\'enregistrement du passage');
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
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(135deg, white, ${primaryColor}10)` }}>
      {/* Premium Header */}
      <header
        className="relative h-52 w-full overflow-hidden flex flex-col items-center justify-center text-white px-6"
        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || primaryColor})` }}
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

        <div className="relative flex flex-col items-center">
          <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center mb-3 p-1 shadow-2xl overflow-hidden">
            {merchant.logo_url ? (
              <img
                src={merchant.logo_url}
                alt={merchant.shop_name}
                className="w-full h-full rounded-2xl object-cover"
              />
            ) : (
              <span className="text-3xl font-black text-white">{merchant.shop_name[0]}</span>
            )}
          </div>
          <h1 className="text-xl font-black tracking-tight drop-shadow-sm">{merchant.shop_name}</h1>
        </div>
      </header>

      <main className="flex-1 -mt-8 px-4 pb-8 mx-auto max-w-md w-full z-10">
        {step === 'phone' && (
          <div className="animate-fade-in">
            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-8 overflow-hidden">
              <div className="text-center mb-8">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Programme Fidélité</p>
                <h2 className="text-2xl font-black text-gray-900">Validez votre passage</h2>
              </div>

              <form onSubmit={handlePhoneSubmit} className="space-y-6">
                {error && (
                  <div className="p-4 text-sm font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-2xl">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Numéro de téléphone</label>
                  <div className="relative group">
                    <Input
                      type="tel"
                      placeholder="06 12 34 56 78"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                      className="h-14 text-lg pl-12 bg-white/50 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl transition-all"
                    />
                    <Phone className="absolute w-5 h-5 text-gray-400 left-4 top-1/2 transform -translate-y-1/2 group-focus-within:text-indigo-600 transition-colors" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-14 text-lg font-bold rounded-2xl text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

            {/* Reward Preview Card */}
            <div className="mt-6 bg-white rounded-3xl shadow-lg border border-gray-100 p-5 flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <Gift className="w-7 h-7" style={{ color: primaryColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Récompense</p>
                <p className="text-base font-bold text-gray-900 leading-tight truncate">{merchant.reward_description}</p>
                <p className="text-xs text-gray-500 mt-0.5">Après {merchant.stamps_required} passages</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
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
                    Ajouter {quantity} {merchant?.product_name || 'article'}{quantity > 1 ? 's' : ''}
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
                    Plus que {(merchant?.stamps_required || 10) - loyaltyCard.current_stamps} {merchant?.loyalty_mode === 'visit' ? 'passage' : (merchant?.product_name || 'article')}{(merchant?.stamps_required || 10) - loyaltyCard.current_stamps > 1 ? 's' : ''} avant le bonheur !
                  </p>
                </div>
              )}

              {/* Undo Button */}
              <AnimatePresence>
                {canUndo && (
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
              <p className="text-gray-500 mb-6">Vous avez atteint {merchant?.stamps_required} passages !</p>

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
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Passages cumulés</p>
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

      {/* Qarte Footer */}
      <footer className="py-6 text-center">
        <div className="flex items-center justify-center gap-1.5 mb-2">
          <span className="text-[10px] font-medium text-gray-400">Créé avec</span>
          <span className="text-xs">❤️</span>
          <span className="text-[10px] font-medium text-gray-400">en France</span>
        </div>
        <Link href="/" className="inline-flex items-center gap-1.5 group transition-all duration-300 hover:opacity-70">
          <div className="w-5 h-5 bg-gradient-to-br from-indigo-600 to-violet-600 rounded flex items-center justify-center shadow-md shadow-indigo-200">
            <span className="text-white text-[8px] font-black italic">Q</span>
          </div>
          <span className="text-sm font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
            QARTE
          </span>
        </Link>
      </footer>
    </div>
  );
}
