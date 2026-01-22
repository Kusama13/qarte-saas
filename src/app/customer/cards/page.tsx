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
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Dynamic Brand Background Blobs */}
      <div className="absolute top-[-10%] -left-[10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] -right-[10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-gray-100/50">
        <div className="flex items-center justify-between px-6 py-4 mx-auto max-w-4xl">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-200 group-hover:scale-105 transition-transform">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">Qarte</span>
          </Link>
          {step === 'cards' && (
            <div className="text-right">
              <button
                onClick={handleChangeNumber}
                className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Changer de numéro
              </button>
              <p className="text-xs font-medium text-gray-400 mt-0.5">{phoneNumber}</p>
            </div>
          )}
        </div>
      </header>

      <main className="relative z-10 px-4 py-16 mx-auto max-w-4xl">
        {step === 'phone' && (
          <div className="max-w-md mx-auto animate-fade-in">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-[2rem] bg-white shadow-2xl shadow-indigo-100 text-indigo-600 ring-1 ring-gray-100">
                <Wallet className="w-10 h-10" />
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                Mes cartes de fidélité
              </h1>
              <p className="mt-3 text-lg text-gray-500 font-medium">
                Entrez votre numéro pour accéder à votre espace
              </p>
            </div>

            <div className="p-8 bg-white/80 backdrop-blur-2xl border border-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2.5rem]">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-4 text-sm font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-2xl">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Numéro de mobile</label>
                  <div className="relative group">
                    <Input
                      type="tel"
                      placeholder="06 12 34 56 78"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                      className="h-14 text-lg pl-12 bg-white/50 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-2xl transition-all shadow-sm"
                    />
                    <Phone className="absolute w-5 h-5 text-gray-400 left-4 top-1/2 transform -translate-y-1/2 group-focus-within:text-indigo-600 transition-colors" />
                  </div>
                </div>

                <Button
                  type="submit"
                  loading={loading}
                  className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Retrouver mes cartes
                </Button>
              </form>
            </div>

            <div className="mt-12 p-6 rounded-3xl bg-emerald-50/50 border border-emerald-100/50 text-center">
              <p className="text-sm text-gray-600 leading-relaxed">
                Nouveau ici ? <span className="font-bold text-emerald-600">Scannez un QR code</span> chez un commerçant partenaire pour générer votre carte de fidélité instantanément.
              </p>
            </div>
          </div>
        )}

        {step === 'cards' && (
          <div className="animate-fade-in space-y-8">
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-gray-900">
                  Mes cartes
                </h1>
                <p className="mt-1 text-sm font-medium text-gray-500">
                  {cards.length > 0
                    ? `${cards.length} programme${cards.length > 1 ? 's' : ''} actif${cards.length > 1 ? 's' : ''}`
                    : 'Aucun programme actif'}
                </p>
              </div>
            </div>

            {cards.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {cards.map((card, index) => {
                  const isRewardReady = card.current_stamps >= card.stamps_required;
                  const progress = (card.current_stamps / card.stamps_required) * 100;

                  return (
                    <Link
                      key={index}
                      href={`/customer/card/${card.merchant_id}`}
                      className="block group"
                    >
                      <div className="relative bg-white rounded-3xl p-6 shadow-sm border border-gray-100 transition-all duration-300 group-hover:shadow-xl group-hover:scale-[1.02] group-hover:border-indigo-100">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center gap-4">
                            {card.logo_url ? (
                              <img
                                src={card.logo_url}
                                alt={card.shop_name}
                                className="w-14 h-14 rounded-2xl object-cover shadow-sm ring-1 ring-gray-100"
                              />
                            ) : (
                              <div
                                className="flex items-center justify-center w-14 h-14 rounded-2xl text-white font-bold text-xl shadow-inner"
                                style={{ backgroundColor: card.primary_color }}
                              >
                                {card.shop_name.charAt(0)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <h3 className="font-bold text-gray-900 truncate leading-tight">
                                {card.shop_name}
                              </h3>
                              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Fidélité
                              </span>
                            </div>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                          </div>
                        </div>

                        {isRewardReady && (
                          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse">
                            <Gift className="w-3.5 h-3.5" />
                            Cadeau disponible !
                          </div>
                        )}

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-tight">Progression</span>
                            <span className="text-sm font-black text-indigo-600">
                              {card.current_stamps} / {card.stamps_required}
                            </span>
                          </div>

                          <div className="relative w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-indigo-600 to-violet-600 shadow-[0_0_10px_rgba(79,70,229,0.2)]"
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>

                          <div className="flex flex-wrap gap-2 pt-2">
                            {[...Array(Math.min(card.stamps_required, 12))].map((_, i) => (
                              <div
                                key={i}
                                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                                  i < card.current_stamps
                                    ? 'bg-indigo-600 scale-110 shadow-[0_0_8px_rgba(79,70,229,0.3)]'
                                    : 'bg-gray-200'
                                }`}
                              />
                            ))}
                            {card.stamps_required > 12 && (
                              <div className="w-2.5 h-2.5 flex items-center justify-center">
                                <div className="w-1 h-1 rounded-full bg-gray-300" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-gray-100">
                <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-3xl bg-gray-50 text-gray-300">
                  <CreditCard className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Aucune carte trouvée
                </h2>
                <p className="text-gray-500 max-w-xs mx-auto text-sm leading-relaxed">
                  Scannez un QR code chez un commerçant pour ajouter votre première carte de fidélité.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="py-12 text-center text-sm font-medium text-gray-400">
        <Link href="/" className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent font-bold hover:opacity-80 transition-opacity">
          Qarte
        </Link>
        <span className="mx-3 opacity-30">•</span>
        Fidélisez mieux, dépensez moins
      </footer>
    </div>
  );
}
