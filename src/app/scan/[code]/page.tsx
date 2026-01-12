'use client';

import { useState, useEffect, use } from 'react';
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
} from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { formatPhoneNumber, validateFrenchPhone, getTodayInParis } from '@/lib/utils';
import type { Merchant, Customer, LoyaltyCard } from '@/types';

type Step = 'phone' | 'register' | 'checkin' | 'success' | 'already-checked' | 'error' | 'reward';

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
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('*')
        .eq('phone_number', formattedPhone)
        .single();

      if (existingCustomer) {
        setCustomer(existingCustomer);
        localStorage.setItem(`qarte_phone_${code}`, formattedPhone);
        await processCheckin(existingCustomer);
      } else {
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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur serveur');
      }

      setCustomer(data.customer);
      localStorage.setItem(`qarte_phone_${code}`, formattedPhone);
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
          })
          .select()
          .single();

        if (cardError) throw cardError;
        card = newCard;
      }

      const today = getTodayInParis();
      if (card.last_visit_date === today) {
        setLoyaltyCard(card);
        setStep('already-checked');
        return;
      }

      const newStamps = card.current_stamps + 1;

      const { error: updateError } = await supabase
        .from('loyalty_cards')
        .update({
          current_stamps: newStamps,
          last_visit_date: today,
        })
        .eq('id', card.id);

      if (updateError) throw updateError;

      await supabase.from('visits').insert({
        loyalty_card_id: card.id,
        merchant_id: merchant.id,
        customer_id: cust.id,
      });

      const updatedCard = { ...card, current_stamps: newStamps };
      setLoyaltyCard(updatedCard);

      if (newStamps >= merchant.stamps_required) {
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
    <div className="min-h-screen" style={{ backgroundColor: `${primaryColor}08` }}>
      <header
        className="sticky top-0 z-10 flex items-center justify-center h-16 px-4"
        style={{ backgroundColor: primaryColor }}
      >
        {merchant.logo_url ? (
          <img
            src={merchant.logo_url}
            alt={merchant.shop_name}
            className="object-cover w-10 h-10 rounded-lg"
          />
        ) : (
          <span className="text-lg font-bold text-white">{merchant.shop_name}</span>
        )}
      </header>

      {merchant.promo_message && (
        <div
          className="px-4 py-2 text-center text-sm text-white"
          style={{ backgroundColor: secondaryColor }}
        >
          {merchant.promo_message}
        </div>
      )}

      <main className="px-4 py-8 mx-auto max-w-md">
        {step === 'phone' && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">
                {merchant.program_name || 'Programme Fidélité'}
              </h1>
              <p className="mt-2 text-gray-600">{merchant.welcome_message}</p>
            </div>

            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-700 bg-red-50 rounded-xl">
                  {error}
                </div>
              )}

              <div className="relative">
                <Input
                  type="tel"
                  label="Votre numéro de téléphone"
                  placeholder="06 12 34 56 78"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  className="text-lg"
                />
                <Phone className="absolute w-5 h-5 text-gray-400 right-4 top-11" />
              </div>

              <Button
                type="submit"
                loading={submitting}
                className="w-full"
                style={{ backgroundColor: primaryColor }}
              >
                Valider mon passage
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </form>

            <div
              className="mt-8 p-4 rounded-xl text-center"
              style={{ backgroundColor: `${secondaryColor}20` }}
            >
              <Gift className="w-8 h-8 mx-auto mb-2" style={{ color: primaryColor }} />
              <p className="font-medium" style={{ color: primaryColor }}>
                {merchant.reward_description}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                après {merchant.stamps_required} passages
              </p>
            </div>
          </div>
        )}

        {step === 'register' && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Bienvenue !</h1>
              <p className="mt-2 text-gray-600">
                Créez votre compte fidélité en quelques secondes
              </p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-700 bg-red-50 rounded-xl">
                  {error}
                </div>
              )}

              <div className="relative">
                <Input
                  type="text"
                  label="Prénom"
                  placeholder="Votre prénom"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
                <User className="absolute w-5 h-5 text-gray-400 right-4 top-11" />
              </div>

              <Input
                type="text"
                label="Nom (optionnel)"
                placeholder="Votre nom"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />

              <Button
                type="submit"
                loading={submitting}
                className="w-full"
                style={{ backgroundColor: primaryColor }}
              >
                Créer mon compte
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </form>
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
          <div className="animate-fade-in text-center">
            <div
              className="inline-flex items-center justify-center w-24 h-24 mb-6 rounded-full animate-pulse-slow"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              <Check className="w-12 h-12" style={{ color: primaryColor }} />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Passage validé !
            </h1>
            <p className="text-gray-600 mb-8">
              Merci {customer?.first_name} !
            </p>

            <div className="flex justify-center gap-2 mb-6">
              {[...Array(merchant?.stamps_required || 10)].map((_, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all"
                  style={{
                    borderColor: primaryColor,
                    backgroundColor:
                      i < loyaltyCard.current_stamps ? primaryColor : 'transparent',
                  }}
                >
                  {i < loyaltyCard.current_stamps && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </div>
              ))}
            </div>

            <p className="text-lg font-semibold" style={{ color: primaryColor }}>
              {loyaltyCard.current_stamps} / {merchant?.stamps_required} passages
            </p>

            {loyaltyCard.current_stamps > 0 &&
              loyaltyCard.current_stamps < (merchant?.stamps_required || 10) && (
                <p className="mt-2 text-gray-600">
                  Plus que{' '}
                  {(merchant?.stamps_required || 10) - loyaltyCard.current_stamps}{' '}
                  passage{(merchant?.stamps_required || 10) - loyaltyCard.current_stamps > 1 ? 's' : ''}{' '}
                  pour votre récompense !
                </p>
              )}

            <Link href="/customer/dashboard" className="inline-block mt-8">
              <Button variant="outline">
                <CreditCard className="w-5 h-5 mr-2" />
                Voir mes cartes
              </Button>
            </Link>
          </div>
        )}

        {step === 'reward' && loyaltyCard && (
          <div className="animate-fade-in text-center">
            <div
              className="inline-flex items-center justify-center w-24 h-24 mb-6 rounded-full animate-pulse-slow"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              <Gift className="w-12 h-12" style={{ color: primaryColor }} />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Félicitations !
            </h1>
            <p className="text-gray-600 mb-4">
              Vous avez atteint {merchant?.stamps_required} passages !
            </p>

            <div
              className="p-6 rounded-2xl mb-8"
              style={{ backgroundColor: `${primaryColor}10` }}
            >
              <p className="text-lg font-bold" style={{ color: primaryColor }}>
                {merchant?.reward_description}
              </p>
            </div>

            <Button
              onClick={handleRedeemReward}
              loading={submitting}
              size="lg"
              className="w-full"
              style={{ backgroundColor: primaryColor }}
            >
              <Gift className="w-5 h-5 mr-2" />
              Utiliser ma récompense
            </Button>

            <p className="mt-4 text-sm text-gray-500">
              Montrez cet écran au commerçant
            </p>
          </div>
        )}

        {step === 'already-checked' && (
          <div className="animate-fade-in text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 mb-6 rounded-full bg-yellow-100">
              <AlertCircle className="w-12 h-12 text-yellow-600" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Déjà validé aujourd&apos;hui
            </h1>
            <p className="text-gray-600 mb-8">
              Vous avez déjà validé votre passage aujourd&apos;hui. Revenez demain !
            </p>

            <div className="flex justify-center gap-2 mb-6">
              {[...Array(merchant?.stamps_required || 10)].map((_, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 flex items-center justify-center"
                  style={{
                    borderColor: primaryColor,
                    backgroundColor:
                      i < (loyaltyCard?.current_stamps || 0) ? primaryColor : 'transparent',
                  }}
                >
                  {i < (loyaltyCard?.current_stamps || 0) && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </div>
              ))}
            </div>

            <p className="text-lg font-semibold" style={{ color: primaryColor }}>
              {loyaltyCard?.current_stamps} / {merchant?.stamps_required} passages
            </p>

            <Link href="/customer/dashboard" className="inline-block mt-8">
              <Button variant="outline">
                <CreditCard className="w-5 h-5 mr-2" />
                Voir mes cartes
              </Button>
            </Link>
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

      <footer className="py-4 text-center text-xs text-gray-400">
        Powered by{' '}
        <Link href="/" className="text-primary hover:underline">
          Qarte
        </Link>
      </footer>
    </div>
  );
}
