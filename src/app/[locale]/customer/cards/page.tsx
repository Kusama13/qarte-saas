'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { motion } from 'framer-motion';
import { ChevronRight, CreditCard, LogOut, Trophy, Gift } from 'lucide-react';
import { isTier2Active } from '@/lib/loyalty-progress';

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
  const t = useTranslations('customerCards');
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [cards, setCards] = useState<LoyaltyCardWithMerchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCards();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCards = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/customers/cards', { method: 'POST' });
      if (response.status === 401) { router.replace('/customer'); return; }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t('serverError'));
      if (data.phone) setPhoneNumber(data.phone);
      if (data.first_name) setFirstName(data.first_name);
      if (!data.found || data.cards.length === 0) { setCards([]); setLoading(false); return; }

      const sorted: LoyaltyCardWithMerchant[] = data.cards.sort((a: LoyaltyCardWithMerchant, b: LoyaltyCardWithMerchant) => {
        const aReady = (a.current_stamps >= a.stamps_required && !a.tier1_redeemed) ||
          (isTier2Active(a) && a.current_stamps >= (a.tier2_stamps_required ?? 0));
        const bReady = (b.current_stamps >= b.stamps_required && !b.tier1_redeemed) ||
          (isTier2Active(b) && b.current_stamps >= (b.tier2_stamps_required ?? 0));
        if (aReady && !bReady) return -1;
        if (!aReady && bReady) return 1;
        if (!a.last_visit_date && !b.last_visit_date) return 0;
        if (!a.last_visit_date) return 1;
        if (!b.last_visit_date) return -1;
        return new Date(b.last_visit_date).getTime() - new Date(a.last_visit_date).getTime();
      });
      setCards(sorted);
    } catch (err) {
      console.error(err);
      setError(t('searchError'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/customers/logout', { method: 'POST' });
    router.push('/customer');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f6fb]">
        <div className="py-5 px-6 max-w-4xl mx-auto flex items-center justify-between">
          <span className="text-2xl font-black text-indigo-600">Qarte</span>
          <div className="w-24 h-3 bg-gray-200 rounded-full animate-pulse" />
        </div>
        <div className="px-6 pt-2 pb-8 max-w-4xl mx-auto">
          <div className="w-24 h-3 bg-gray-200 rounded-full animate-pulse mb-3" />
          <div className="w-52 h-10 bg-gray-200 rounded-xl animate-pulse mb-2" />
          <div className="w-32 h-3 bg-gray-200 rounded-full animate-pulse" />
        </div>
        <div className="px-4 max-w-4xl mx-auto grid gap-4 sm:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-3xl overflow-hidden shadow-sm">
              <div className="h-[88px] bg-gray-200 animate-pulse" />
              <div className="bg-white px-4 py-4">
                <div className="h-1.5 bg-gray-100 rounded-full animate-pulse mb-2" />
                <div className="w-40 h-3 bg-gray-100 rounded-full animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f6fb]">

      {/* Header */}
      <div className="py-5 px-6 max-w-4xl mx-auto flex items-center justify-between">
        <span className="text-2xl font-black text-indigo-600">
          Qarte
        </span>
        <button
          onClick={handleLogout}
          aria-label="Déconnexion"
          className="flex items-center gap-2 min-h-[44px] px-3 -mr-3 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <span className="text-xs font-medium">{phoneNumber}</span>
          <LogOut className="w-4 h-4" />
          <span className="text-xs font-semibold">Déconnexion</span>
        </button>
      </div>

      {/* Greeting */}
      <div className="px-6 pt-2 pb-8 max-w-4xl mx-auto">
        {firstName && (
          <p className="text-base text-gray-600 font-medium mb-1">{t('hello')}</p>
        )}
        <h1 className="text-4xl font-black text-gray-900 leading-none mb-2">
          {firstName ? `${firstName}.` : t('myCards')}
        </h1>
        <p className="text-sm text-gray-600 font-medium">
          {cards.length > 0
            ? t('loyaltyCards', { count: cards.length })
            : t('noActiveProgram')}
        </p>
      </div>

      {/* Cards grid */}
      <main className="px-4 pb-16 max-w-4xl mx-auto">
        {error && (
          <div className="mb-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-sm text-rose-600 font-medium">
            {error}
          </div>
        )}

        {cards.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {cards.map((card, index) => {
              const tier1Required = card.stamps_required;
              const tier2Enabled = isTier2Active(card);
              const tier2Required = card.tier2_stamps_required ?? 0;

              const isTier1Ready = card.current_stamps >= tier1Required;
              const isTier2Ready = !!tier2Enabled && card.current_stamps >= tier2Required;
              const effectiveTier1Redeemed = !!card.tier1_redeemed && card.current_stamps >= tier1Required;
              const hasUnclaimedReward = (isTier1Ready && !effectiveTier1Redeemed) || isTier2Ready;

              const cardGlow = hasUnclaimedReward
                ? `0 0 0 2px ${card.primary_color}80, 0 8px 30px ${card.primary_color}25`
                : '0 2px 12px rgba(0,0,0,0.06)';

              return (
                <motion.div
                  key={card.merchant_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.07, ease: 'easeOut' }}
                >
                  <Link href={`/customer/card/${card.merchant_id}`} className="block group">
                    <div
                      className="rounded-3xl overflow-hidden transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-2xl"
                      style={{ boxShadow: cardGlow }}
                    >
                      {/* Colored header */}
                      <div
                        className="p-4 flex items-center gap-3"
                        style={{
                          background: `linear-gradient(135deg, ${card.primary_color}, ${card.primary_color}cc)`,
                          minHeight: '88px',
                        }}
                      >
                        {/* Logo */}
                        {card.logo_url ? (
                          <img
                            src={card.logo_url}
                            alt={card.shop_name}
                            className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white/30 shadow-lg shrink-0"
                          />
                        ) : (
                          <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl ring-2 ring-white/20 shadow-inner shrink-0"
                            style={{ backgroundColor: `${card.primary_color}99`, backdropFilter: 'brightness(0.85)' }}
                          >
                            {card.shop_name.charAt(0)}
                          </div>
                        )}

                        {/* Name */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-black text-white leading-tight truncate">
                            {card.shop_name}
                          </p>
                          <p className="text-xs font-bold text-white/70 uppercase tracking-widest mt-0.5">
                            {t('loyalty')}
                          </p>
                        </div>

                        {/* Right side */}
                        {hasUnclaimedReward ? (
                          <motion.span
                            animate={{ scale: [1, 1.09, 1] }}
                            transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
                            className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white text-[11px] font-bold shadow-sm"
                            style={{ color: card.primary_color }}
                          >
                            <Gift className="w-3 h-3" />
                            {t('ready')}
                          </motion.span>
                        ) : (
                          <ChevronRight className="w-4 h-4 text-white/40 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
                        )}
                      </div>

                      {/* White progress section */}
                      <div className="bg-white px-4 py-3.5">
                        {tier2Enabled ? (
                          <div className="space-y-2.5">
                            {/* Tier 1 */}
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                                  {t('tier1')}
                                </span>
                                <span className="text-base font-black text-gray-900">
                                  {Math.min(card.current_stamps, tier1Required)}/{tier1Required}
                                </span>
                              </div>
                              <div
                                className="h-1.5 bg-black/5 rounded-full overflow-hidden transition-shadow"
                                style={{ boxShadow: isTier1Ready && !effectiveTier1Redeemed ? `0 0 0 1.5px ${card.primary_color}, 0 1px 8px ${card.primary_color}66` : undefined }}
                              >
                                <div
                                  className="h-full rounded-full transition-all duration-700"
                                  style={{
                                    width: `${Math.min((card.current_stamps / tier1Required) * 100, 100)}%`,
                                    background: effectiveTier1Redeemed
                                      ? '#D1D5DB'
                                      : `linear-gradient(90deg, ${card.primary_color}, ${card.primary_color}bb)`,
                                  }}
                                />
                              </div>
                              <p className="text-sm text-gray-700 font-medium mt-1 truncate">
                                {card.reward_description || t('defaultReward')}
                              </p>
                            </div>

                            {/* Tier 2 */}
                            <div className={effectiveTier1Redeemed ? '' : 'opacity-40'}>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-bold text-gray-600 uppercase tracking-widest flex items-center gap-1">
                                  <Trophy className="w-3.5 h-3.5" /> {t('tier2')}
                                </span>
                                <span className="text-base font-black text-gray-900">
                                  {Math.min(Math.max(0, card.current_stamps - tier1Required), tier2Required - tier1Required)}/{tier2Required - tier1Required}
                                </span>
                              </div>
                              <div
                                className="h-1.5 bg-black/5 rounded-full overflow-hidden transition-shadow"
                                style={{ boxShadow: isTier2Ready ? '0 0 0 1.5px #8B5CF6, 0 1px 8px rgba(139,92,246,0.4)' : undefined }}
                              >
                                <div
                                  className="h-full rounded-full transition-all duration-700"
                                  style={{
                                    width: `${Math.min((Math.max(0, card.current_stamps - tier1Required) / (tier2Required - tier1Required)) * 100, 100)}%`,
                                    background: 'linear-gradient(90deg, #8B5CF6, #7C3AED)',
                                  }}
                                />
                              </div>
                              <p className="text-sm text-gray-700 font-medium mt-1 truncate">
                                {card.tier2_reward_description || t('defaultPremiumReward')}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-base font-black text-gray-900">
                                {t('stampsOf', { current: card.current_stamps, total: tier1Required })}
                              </span>
                              {isTier1Ready && (
                                <span className="flex items-center gap-1 text-sm font-bold" style={{ color: card.primary_color }}>
                                  <Gift className="w-4 h-4" />
                                  {t('available')}
                                </span>
                              )}
                            </div>
                            <div
                              className="h-1.5 bg-black/5 rounded-full overflow-hidden transition-shadow"
                              style={{ boxShadow: isTier1Ready ? `0 0 0 1.5px ${card.primary_color}, 0 1px 8px ${card.primary_color}66` : undefined }}
                            >
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                  width: `${Math.min((card.current_stamps / tier1Required) * 100, 100)}%`,
                                  background: `linear-gradient(90deg, ${card.primary_color}, ${card.primary_color}bb)`,
                                }}
                              />
                            </div>
                            <p className="text-sm text-gray-700 font-medium mt-1.5 truncate">
                              {card.reward_description || t('defaultLoyaltyReward')}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-gray-200">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-5 rounded-2xl bg-gray-50">
              <CreditCard className="w-8 h-8 text-gray-200" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t('noCardsFound')}</h2>
            <p className="text-gray-600 max-w-xs mx-auto text-sm leading-relaxed">
              {t('scanToAdd')}
            </p>
          </div>
        )}
      </main>

      <footer className="py-8 text-center">
        <Link href="/" className="inline-flex items-center gap-1.5 group transition-all duration-300 hover:opacity-70">
          <span className="text-xs text-gray-600 group-hover:text-gray-700">{t('madeWithLove')}</span>
          <span className="text-xs font-bold text-indigo-600">
            Qarte
          </span>
        </Link>
      </footer>
    </div>
  );
}
