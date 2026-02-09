'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Phone,
  ArrowRight,
  Gift,
  ChevronRight,
  Search,
  Loader2,
} from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { formatPhoneNumber, validatePhone } from '@/lib/utils';
import type { LoyaltyCard, Merchant, Customer } from '@/types';

interface CardWithMerchant extends LoyaltyCard {
  merchant: Merchant;
}

export default function CustomerDashboardPage() {
  const [step, setStep] = useState<'phone' | 'cards'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [cards, setCards] = useState<CardWithMerchant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedPhone = localStorage.getItem('qarte_customer_phone');
    if (savedPhone) {
      setPhoneNumber(savedPhone);
      fetchCards(savedPhone);
    }
  }, []);

  const fetchCards = async (phone: string) => {
    setLoading(true);
    setError('');

    try {
      const formattedPhone = formatPhoneNumber(phone);

      const { data: customerData } = await supabase
        .from('customers')
        .select('*')
        .eq('phone_number', formattedPhone)
        .single();

      if (!customerData) {
        setError('Aucun compte trouvé avec ce numéro');
        setLoading(false);
        return;
      }

      setCustomer(customerData);
      localStorage.setItem('qarte_customer_phone', formattedPhone);

      const { data: cardsData } = await supabase
        .from('loyalty_cards')
        .select(`
          *,
          merchant:merchants (*)
        `)
        .eq('customer_id', customerData.id)
        .order('updated_at', { ascending: false });

      if (cardsData) {
        setCards(cardsData as CardWithMerchant[]);
      }

      setStep('cards');
    } catch {
      setError('Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePhone(phoneNumber)) {
      setError('Veuillez entrer un numéro de téléphone valide');
      return;
    }

    await fetchCards(phoneNumber);
  };

  const handleLogout = () => {
    localStorage.removeItem('qarte_customer_phone');
    setCustomer(null);
    setCards([]);
    setPhoneNumber('');
    setStep('phone');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-4 mx-auto max-w-lg">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Qarte</span>
          </Link>
          {customer && (
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Changer de numéro
            </button>
          )}
        </div>
      </header>

      <main className="px-4 py-8 mx-auto max-w-lg">
        {step === 'phone' && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">
                Mes cartes de fidélité
              </h1>
              <p className="mt-2 text-gray-600">
                Entrez votre numéro pour retrouver vos cartes
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-700 bg-red-50 rounded-xl">
                  {error}
                </div>
              )}

              <div className="relative">
                <Input
                  type="tel"
                  placeholder="06 12 34 56 78"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  className="text-lg pl-12"
                />
                <Phone className="absolute w-5 h-5 text-gray-400 left-4 top-1/2 transform -translate-y-1/2" />
              </div>

              <Button type="submit" loading={loading} className="w-full">
                <Search className="w-5 h-5 mr-2" />
                Rechercher mes cartes
              </Button>
            </form>

            <p className="mt-8 text-sm text-center text-gray-500">
              Vous n&apos;avez pas encore de carte ?{' '}
              <span className="text-primary">
                Scannez un QR code chez un commerçant partenaire.
              </span>
            </p>
          </div>
        )}

        {step === 'cards' && (
          <div className="animate-fade-in">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">
                Bonjour {customer?.first_name} !
              </h1>
              <p className="mt-1 text-gray-600">
                {cards.length} carte{cards.length > 1 ? 's' : ''} de fidélité
              </p>
            </div>

            {cards.length > 0 ? (
              <div className="space-y-4">
                {cards.map((card) => {
                  const isRewardReady =
                    card.current_stamps >= card.merchant.stamps_required;
                  const progress =
                    (card.current_stamps / card.merchant.stamps_required) * 100;

                  return (
                    <Link
                      key={card.id}
                      href={`/customer/card/${card.merchant.id}`}
                      className="block"
                    >
                      <div
                        className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md hover:border-gray-200"
                        style={{
                          borderLeftWidth: '4px',
                          borderLeftColor: card.merchant.primary_color,
                        }}
                      >
                        <div className="flex items-center gap-4">
                          {card.merchant.logo_url ? (
                            <img
                              src={card.merchant.logo_url}
                              alt={card.merchant.shop_name}
                              className="w-14 h-14 rounded-xl object-cover"
                            />
                          ) : (
                            <div
                              className="flex items-center justify-center w-14 h-14 rounded-xl text-white font-bold text-xl"
                              style={{
                                backgroundColor: card.merchant.primary_color,
                              }}
                            >
                              {card.merchant.shop_name.charAt(0)}
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {card.merchant.shop_name}
                              </h3>
                              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            </div>

                            <div className="mt-2">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-gray-600">
                                  {card.current_stamps} /{' '}
                                  {card.merchant.stamps_required}
                                </span>
                                {isRewardReady && (
                                  <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                                    <Gift className="w-3 h-3" />
                                    Récompense !
                                  </span>
                                )}
                              </div>
                              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${Math.min(progress, 100)}%`,
                                    backgroundColor: card.merchant.primary_color,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600">Aucune carte de fidélité</p>
                <p className="text-sm text-gray-500 mt-1">
                  Scannez un QR code pour commencer
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="py-4 text-center text-xs text-gray-400">
        <Link href="/" className="hover:text-primary">
          Qarte
        </Link>
        {' - '}
        Fidélisez mieux, dépensez moins
      </footer>
    </div>
  );
}
