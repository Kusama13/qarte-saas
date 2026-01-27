'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  Gift,
  ChevronRight,
  Loader2,
  RefreshCw,
  Trophy,
} from 'lucide-react';
import { formatPhoneNumber } from '@/lib/utils';

interface LoyaltyCardWithMerchant {
  merchant_id: string;
  shop_name: string;
  scan_code: string;
  logo_url: string | null;
  primary_color: string;
  stamps_required: number;
  current_stamps: number;
  last_visit_date: string | null;
  tier2_enabled?: boolean;
  tier2_stamps_required?: number;
  tier1_redeemed?: boolean;
}

export default function CustomerCardsPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cards, setCards] = useState<LoyaltyCardWithMerchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedPhone = getCookie('customer_phone');
    if (savedPhone) {
      setPhoneNumber(savedPhone);
      fetchCards(savedPhone);
    } else {
      // No phone saved, redirect to login page
      router.replace('/customer');
    }
  }, [router]);

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
        setLoading(false);
        return;
      }

      const formattedCards: LoyaltyCardWithMerchant[] = data.cards
        .sort((a: LoyaltyCardWithMerchant, b: LoyaltyCardWithMerchant) => {
          // Check if reward is ready (considering tier 2 and if tier 1 already redeemed)
          const aHasUnclaimedReward = (a.current_stamps >= a.stamps_required && !a.tier1_redeemed) ||
            (a.tier2_enabled && a.current_stamps >= (a.tier2_stamps_required || a.stamps_required * 2));
          const bHasUnclaimedReward = (b.current_stamps >= b.stamps_required && !b.tier1_redeemed) ||
            (b.tier2_enabled && b.current_stamps >= (b.tier2_stamps_required || b.stamps_required * 2));

          if (aHasUnclaimedReward && !bHasUnclaimedReward) return -1;
          if (!aHasUnclaimedReward && bHasUnclaimedReward) return 1;
          if (!a.last_visit_date && !b.last_visit_date) return 0;
          if (!a.last_visit_date) return 1;
          if (!b.last_visit_date) return -1;
          return new Date(b.last_visit_date).getTime() - new Date(a.last_visit_date).getTime();
        });

      setCards(formattedCards);
      setCookie('customer_phone', formattedPhone, 30);
    } catch (err) {
      console.error('Error fetching cards:', err);
      setError('Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeNumber = () => {
    deleteCookie('customer_phone');
    router.push('/customer');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
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
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-200">
              <span className="text-white font-black italic text-lg">Q</span>
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">Qarte</span>
          </div>
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
        </div>
      </header>

      <main className="relative z-10 px-4 py-8 mx-auto max-w-4xl">
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
                  const tier1Required = card.stamps_required;
                  const tier2Enabled = card.tier2_enabled;
                  const tier2Required = card.tier2_stamps_required || tier1Required * 2;
                  const maxRequired = tier2Enabled ? tier2Required : tier1Required;

                  const isTier1Ready = card.current_stamps >= tier1Required;
                  const isTier2Ready = tier2Enabled && card.current_stamps >= tier2Required;
                  const tier1Redeemed = card.tier1_redeemed;

                  // Show badge only if there's an unclaimed reward
                  const hasUnclaimedReward = (isTier1Ready && !tier1Redeemed) || isTier2Ready;

                  const progress = (card.current_stamps / maxRequired) * 100;

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

                        {/* Reward Badge - only shows if unclaimed reward available */}
                        {hasUnclaimedReward && (
                          <div className={`mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-xs font-bold shadow-lg animate-pulse ${
                            isTier2Ready
                              ? 'bg-gradient-to-r from-violet-500 to-purple-600 shadow-violet-200'
                              : 'bg-emerald-500 shadow-emerald-200'
                          }`}>
                            {isTier2Ready ? <Trophy className="w-3.5 h-3.5" /> : <Gift className="w-3.5 h-3.5" />}
                            {isTier2Ready ? 'Palier 2 prêt !' : 'Cadeau disponible !'}
                          </div>
                        )}

                        {/* Tier 1 redeemed but working toward tier 2 */}
                        {tier2Enabled && tier1Redeemed && !isTier2Ready && (
                          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200">
                            <Trophy className="w-3.5 h-3.5" />
                            Vers palier 2 : {tier2Required - card.current_stamps} restants
                          </div>
                        )}

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-tight">Progression</span>
                            <span className="text-sm font-black" style={{ color: card.primary_color }}>
                              {card.current_stamps} / {maxRequired}
                            </span>
                          </div>

                          {/* Progress bar with tier markers */}
                          <div className="relative">
                            <div className="relative w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
                                style={{
                                  width: `${Math.min(progress, 100)}%`,
                                  background: `linear-gradient(90deg, ${card.primary_color}, ${card.primary_color}cc)`
                                }}
                              />
                            </div>
                            {/* Tier 1 marker when tier 2 is enabled */}
                            {tier2Enabled && (
                              <div
                                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow-sm"
                                style={{
                                  left: `${(tier1Required / tier2Required) * 100}%`,
                                  transform: 'translate(-50%, -50%)',
                                  backgroundColor: isTier1Ready ? '#F59E0B' : '#E5E7EB'
                                }}
                              />
                            )}
                          </div>

                          {/* Stamp dots - show up to max required */}
                          <div className="flex flex-wrap gap-1.5 pt-2">
                            {[...Array(Math.min(maxRequired, 15))].map((_, i) => {
                              const isFilled = i < card.current_stamps;
                              const isTier1Zone = i < tier1Required;
                              const isGreyedTier1 = tier2Enabled && isTier1Zone && tier1Redeemed;

                              return (
                                <div
                                  key={i}
                                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                    isFilled
                                      ? isGreyedTier1
                                        ? 'bg-gray-300'
                                        : i >= tier1Required
                                          ? 'bg-violet-500 shadow-[0_0_6px_rgba(139,92,246,0.3)]'
                                          : 'shadow-[0_0_6px_rgba(0,0,0,0.15)]'
                                      : 'bg-gray-200'
                                  }`}
                                  style={{
                                    backgroundColor: isFilled && !isGreyedTier1 && i < tier1Required
                                      ? card.primary_color
                                      : undefined
                                  }}
                                />
                              );
                            })}
                            {maxRequired > 15 && (
                              <div className="w-2 h-2 flex items-center justify-center">
                                <span className="text-[8px] font-bold text-gray-400">+{maxRequired - 15}</span>
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
      </main>

      <footer className="py-8 text-center">
        <div className="flex items-center justify-center gap-1.5 mb-2">
          <span className="text-[11px] font-medium text-gray-400">Créé avec</span>
          <span className="text-sm">❤️</span>
          <span className="text-[11px] font-medium text-gray-400">en France</span>
        </div>
        <span className="text-xs font-medium text-gray-300">Qarte • Fidélisez mieux</span>
      </footer>
    </div>
  );
}
