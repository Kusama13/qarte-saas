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
  reward_description?: string;
  tier2_reward_description?: string;
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
    if (parts.length === 2) {
      const rawValue = parts.pop()?.split(';').shift() || null;
      return rawValue ? decodeURIComponent(rawValue) : null;
    }
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
      <div className="min-h-screen bg-slate-50">
        {/* Skeleton Header */}
        <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-gray-100/50">
          <div className="flex items-center justify-between px-6 py-4 mx-auto max-w-4xl">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600" />
              <div className="w-16 h-5 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
          </div>
        </header>
        <main className="px-4 py-8 mx-auto max-w-4xl">
          <div className="mb-8">
            <div className="w-32 h-8 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="w-24 h-4 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gray-200 animate-pulse" />
                  <div>
                    <div className="w-24 h-5 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="w-16 h-3 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="w-full h-3 bg-gray-100 rounded-full animate-pulse" />
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((j) => (
                      <div key={j} className="w-2 h-2 rounded-full bg-gray-200 animate-pulse" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
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
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <h1 className="text-2xl font-black tracking-tight text-gray-900">
                    Mes cartes de fidélité
                  </h1>
                </div>
                <p className="mt-2 text-sm font-medium text-gray-500 ml-[52px]">
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

                  // Effective tier 1 redeemed - only consider redeemed if points still support it
                  // If points were reduced below tier1_required, treat as if not redeemed
                  const effectiveTier1Redeemed = tier1Redeemed && card.current_stamps >= tier1Required;

                  // Show badge only if there's an unclaimed reward
                  const hasUnclaimedReward = (isTier1Ready && !effectiveTier1Redeemed) || isTier2Ready;

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

                        <div className="space-y-4">
                          {tier2Enabled ? (
                            /* DUAL TIER DESIGN */
                            <div className="space-y-4">
                              {/* Tier 1 Section */}
                              <div className={`space-y-2 p-3 rounded-xl border transition-all ${isTier1Ready && !effectiveTier1Redeemed ? 'bg-emerald-50/50 border-emerald-100 ring-1 ring-emerald-500/20' : effectiveTier1Redeemed ? 'bg-gray-50/30 border-gray-100 opacity-60' : 'bg-gray-50/30 border-gray-100'}`}>
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Palier 1</span>
                                  {isTier1Ready && !effectiveTier1Redeemed && (
                                    <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 px-2 py-0.5 bg-white rounded-full shadow-sm animate-pulse">
                                      <Gift className="w-2.5 h-2.5" /> Prêt !
                                    </span>
                                  )}
                                  {effectiveTier1Redeemed && <span className="text-[10px] font-bold text-gray-400 italic">Validé</span>}
                                  {!isTier1Ready && (
                                    <span className="text-[10px] font-bold text-gray-400">
                                      {card.current_stamps}/{tier1Required}
                                    </span>
                                  )}
                                </div>
                                <div className="relative w-full h-2 bg-gray-200/60 rounded-full overflow-hidden">
                                  <div
                                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
                                    style={{
                                      width: `${Math.min((card.current_stamps / tier1Required) * 100, 100)}%`,
                                      backgroundColor: effectiveTier1Redeemed ? '#D1D5DB' : isTier1Ready ? '#10B981' : card.primary_color
                                    }}
                                  />
                                </div>
                                <p className="text-center text-[11px] font-medium text-gray-500 truncate">{card.reward_description || 'Cadeau fidélité'}</p>
                              </div>

                              {/* Tier 2 Section */}
                              <div className={`space-y-2 p-3 rounded-xl border transition-all ${isTier2Ready ? 'bg-violet-50/50 border-violet-100 ring-1 ring-violet-500/20' : !effectiveTier1Redeemed ? 'bg-gray-50/10 border-gray-50 opacity-40' : 'bg-gray-50/30 border-gray-100'}`}>
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                    <Trophy className="w-2.5 h-2.5" /> Palier 2
                                  </span>
                                  {isTier2Ready && (
                                    <span className="flex items-center gap-1 text-[10px] font-extrabold text-violet-600 px-2 py-0.5 bg-white rounded-full shadow-sm animate-pulse">
                                      <Trophy className="w-2.5 h-2.5" /> Prêt !
                                    </span>
                                  )}
                                  {!isTier2Ready && effectiveTier1Redeemed && (
                                    <span className="text-[10px] font-bold text-gray-400">
                                      {Math.max(0, card.current_stamps - tier1Required)}/{tier2Required - tier1Required}
                                    </span>
                                  )}
                                </div>
                                <div className="relative w-full h-2 bg-gray-200/60 rounded-full overflow-hidden">
                                  <div
                                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
                                    style={{
                                      width: `${Math.min((Math.max(0, card.current_stamps - tier1Required) / (tier2Required - tier1Required)) * 100, 100)}%`,
                                      backgroundColor: isTier2Ready ? '#8B5CF6' : '#A78BFA'
                                    }}
                                  />
                                </div>
                                <p className="text-center text-[11px] font-medium text-gray-500 truncate">{card.tier2_reward_description || 'Récompense premium'}</p>
                              </div>
                            </div>
                          ) : (
                            /* SINGLE TIER DESIGN - Larger, no "Palier 1" label */
                            <div className="space-y-4">
                              <div className="flex items-end justify-between">
                                <span className="text-2xl font-black tracking-tight" style={{ color: card.primary_color }}>
                                  {card.current_stamps}<span className="text-gray-300 text-base mx-0.5">/</span><span className="text-gray-400 text-lg">{tier1Required}</span>
                                </span>
                                {tier1Required - card.current_stamps <= 2 && tier1Required - card.current_stamps > 0 && (
                                  <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-lg shadow-amber-200 animate-bounce">
                                    PRESQUE !
                                  </span>
                                )}
                                {isTier1Ready && (
                                  <span className="bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg shadow-emerald-200 animate-pulse flex items-center gap-1">
                                    <Gift className="w-3 h-3" /> PRÊT !
                                  </span>
                                )}
                              </div>

                              {/* Larger progress bar */}
                              <div className="relative w-full h-3.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
                                  style={{
                                    width: `${progress}%`,
                                    background: `linear-gradient(90deg, ${card.primary_color}, ${card.primary_color}cc)`
                                  }}
                                />
                              </div>

                              {/* Larger stamp dots centered */}
                              <div className="flex flex-wrap justify-center gap-2">
                                {[...Array(Math.min(tier1Required, 12))].map((_, i) => (
                                  <div
                                    key={i}
                                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                                      i < card.current_stamps
                                        ? 'shadow-[0_0_8px_rgba(0,0,0,0.12)]'
                                        : 'bg-gray-200'
                                    }`}
                                    style={{
                                      backgroundColor: i < card.current_stamps ? card.primary_color : undefined
                                    }}
                                  />
                                ))}
                                {tier1Required > 12 && (
                                  <span className="text-[9px] font-bold text-gray-400">+{tier1Required - 12}</span>
                                )}
                              </div>

                              {/* Centered reward description */}
                              <p className="text-center text-xs font-semibold text-gray-600 bg-gray-50 py-2.5 px-3 rounded-xl border border-gray-100">
                                {card.reward_description || 'Votre récompense fidélité'}
                              </p>
                            </div>
                          )}
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
        <a href="/" className="inline-flex items-center gap-1.5 group transition-all duration-300 hover:opacity-70">
          <span className="text-xs text-gray-400 group-hover:text-gray-500">Créé avec ❤️ par</span>
          <div className="w-4 h-4 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-sm flex items-center justify-center">
            <span className="text-white text-[8px] font-black italic">Q</span>
          </div>
          <span className="text-xs font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
            Qarte
          </span>
        </a>
      </footer>
    </div>
  );
}
