'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Phone,
  Search,
  Gift,
  ChevronRight,
  Loader2,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { formatPhoneNumber, validateFrenchPhone } from '@/lib/utils';

interface LoyaltyCardWithMerchant {
  merchant_id: string;
  shop_name: string;
  scan_code: string;
  logo_url: string | null;
  primary_color: string;
  stamps_required: number;
  current_stamps: number;
  last_visit_date: string | null;
}

export default function CustomerCardsPage() {
  const [step, setStep] = useState<'loading' | 'phone' | 'cards'>('loading');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cards, setCards] = useState<LoyaltyCardWithMerchant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedPhone = getCookie('customer_phone');
    if (savedPhone) {
      setPhoneNumber(savedPhone);
      fetchCards(savedPhone);
    } else {
      setStep('phone');
    }
  }, []);

  const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  };

  const setCookie = (name: string, value: string, days: number) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  };

  const deleteCookie = (name: string) => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  };

  const fetchCards = async (phone: string) => {
    setLoading(true);
    setError('');

    try {
      const formattedPhone = formatPhoneNumber(phone);

      const response = await fetch(`/api/customers/cards?phone=${encodeURIComponent(formattedPhone)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur serveur');
      }

      if (!data.found || data.cards.length === 0) {
        console.log('No cards found, debug:', data.debug);
        setCards([]);
        setError(data.debug ? `Aucun compte trouvé (téléphone: ${data.debug.phone})` : '');
        setStep('cards');
        setLoading(false);
        return;
      }

      const formattedCards: LoyaltyCardWithMerchant[] = data.cards
        .sort((a: LoyaltyCardWithMerchant, b: LoyaltyCardWithMerchant) => {
          const aRewardReady = a.current_stamps >= a.stamps_required;
          const bRewardReady = b.current_stamps >= b.stamps_required;
          if (aRewardReady && !bRewardReady) return -1;
          if (!aRewardReady && bRewardReady) return 1;
          if (!a.last_visit_date && !b.last_visit_date) return 0;
          if (!a.last_visit_date) return 1;
          if (!b.last_visit_date) return -1;
          return new Date(b.last_visit_date).getTime() - new Date(a.last_visit_date).getTime();
        });

      setCards(formattedCards);
      setCookie('customer_phone', formattedPhone, 30);
      setStep('cards');
    } catch (err) {
      console.error('Error fetching cards:', err);
      setError('Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateFrenchPhone(phoneNumber)) {
      setError('Veuillez entrer un numéro de téléphone valide');
      return;
    }

    await fetchCards(phoneNumber);
  };

  const handleChangeNumber = () => {
    deleteCookie('customer_phone');
    setPhoneNumber('');
    setCards([]);
    setStep('phone');
  };

  if (step === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-4 mx-auto max-w-4xl">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Qarte</span>
          </Link>
          {step === 'cards' && (
            <button
              onClick={handleChangeNumber}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Changer de numéro
            </button>
          )}
        </div>
      </header>

      <main className="px-4 py-8 mx-auto max-w-4xl">
        {step === 'phone' && (
          <div className="max-w-md mx-auto animate-fade-in">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-primary-50">
                <Wallet className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Mes cartes de fidélité
              </h1>
              <p className="mt-2 text-gray-600">
                Entrez votre numéro de téléphone pour retrouver vos cartes
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
                Mes cartes de fidélité
              </h1>
              <p className="mt-1 text-gray-600">
                {cards.length > 0
                  ? `${cards.length} carte${cards.length > 1 ? 's' : ''} trouvée${cards.length > 1 ? 's' : ''}`
                  : 'Aucune carte trouvée'}
              </p>
            </div>

            {cards.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cards.map((card, index) => {
                  const isRewardReady = card.current_stamps >= card.stamps_required;
                  const progress = (card.current_stamps / card.stamps_required) * 100;

                  return (
                    <Link
                      key={index}
                      href={`/customer/card/${card.merchant_id}`}
                      className="block group"
                    >
                      <div
                        className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border-t-4"
                        style={{ borderTopColor: card.primary_color }}
                      >
                        <div className="p-5">
                          <div className="flex items-center gap-4 mb-4">
                            {card.logo_url ? (
                              <img
                                src={card.logo_url}
                                alt={card.shop_name}
                                className="w-14 h-14 rounded-lg object-cover"
                              />
                            ) : (
                              <div
                                className="flex items-center justify-center w-14 h-14 rounded-lg text-white font-bold text-xl"
                                style={{ backgroundColor: card.primary_color }}
                              >
                                {card.shop_name.charAt(0)}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-gray-900 truncate group-hover:text-primary transition-colors">
                                {card.shop_name}
                              </h3>
                              {isRewardReady && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-green-700 bg-green-100 rounded-full mt-1">
                                  <Gift className="w-3 h-3" />
                                  Récompense disponible !
                                </span>
                              )}
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Progression</span>
                              <span className="font-semibold" style={{ color: card.primary_color }}>
                                {card.current_stamps} / {card.stamps_required}
                              </span>
                            </div>
                            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.min(progress, 100)}%`,
                                  backgroundColor: card.primary_color,
                                }}
                              />
                            </div>

                            <div className="flex justify-center gap-1 pt-2">
                              {[...Array(Math.min(card.stamps_required, 10))].map((_, i) => (
                                <div
                                  key={i}
                                  className="w-4 h-4 rounded-full border-2 transition-all"
                                  style={{
                                    borderColor: card.primary_color,
                                    backgroundColor:
                                      i < card.current_stamps ? card.primary_color : 'transparent',
                                  }}
                                />
                              ))}
                              {card.stamps_required > 10 && (
                                <span className="text-xs text-gray-400 ml-1">...</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
                <div className="inline-flex items-center justify-center w-20 h-20 mb-4 rounded-full bg-gray-100">
                  <CreditCard className="w-10 h-10 text-gray-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Aucune carte de fidélité
                </h2>
                <p className="text-gray-600 max-w-sm mx-auto">
                  Aucune carte trouvée pour ce numéro. Scannez un QR code chez un
                  commerçant partenaire pour commencer !
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="py-6 text-center text-sm text-gray-400">
        <Link href="/" className="hover:text-primary transition-colors">
          Qarte
        </Link>
        {' - '}
        Fidélisez mieux, dépensez moins
      </footer>
    </div>
  );
}
