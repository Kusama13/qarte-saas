'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  Users,
  Search,
  Phone,
  Calendar,
  Gift,
  Loader2,
  SlidersHorizontal,
  Bell,
  BellOff,
  Plus,
  UserPlus,
  Trophy,
  Crown,
  Cake,
  Clock,
  Target,
  Sparkles,
  Ticket,
  UserCheck,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Input, Modal } from '@/components/ui';
import { CustomerManagementModal } from '@/components/dashboard/CustomerManagementModal';
import StatsCard from '@/components/dashboard/StatsCard';
import { useMerchant } from '@/contexts/MerchantContext';
import { getSupabase } from '@/lib/supabase';
import { formatDate, formatPhoneNumber, formatPhoneLabel, formatCurrency, PHONE_CONFIG } from '@/lib/utils';
import { PhoneInput } from '@/components/ui/PhoneInput';
import type { MerchantCountry } from '@/types';
import type { LoyaltyCard, Customer } from '@/types';

interface CustomerWithCard extends LoyaltyCard {
  customer: Customer;
}

function getCardBadge(
  t: ReturnType<typeof useTranslations>,
  isTier1Ready: boolean,
  isTier2Ready: boolean,
  tier2Enabled: boolean,
  tier1Redeemed: boolean,
  isCagnotte?: boolean,
  cashbackValue?: number,
): { text: string; color: string } | null {
  if (tier2Enabled) {
    if (isTier2Ready) return { text: t('badgeTier2Ready'), color: 'text-violet-700 bg-violet-100' };
    if (isTier1Ready) {
      if (tier1Redeemed) return { text: t('badgeTier1Used'), color: 'text-gray-500 bg-gray-100' };
      return { text: t('badgeTier1Ready'), color: 'text-emerald-700 bg-emerald-100' };
    }
  } else if (isTier1Ready) {
    if (isCagnotte && cashbackValue !== undefined) {
      return { text: t('badgeCagnotteReady', { value: cashbackValue.toFixed(2).replace('.', ',') }), color: 'text-green-700 bg-green-100' };
    }
    return { text: t('badgeRewardReady'), color: 'text-green-700 bg-green-100' };
  }
  return null;
}

export default function CustomersPage() {
  const t = useTranslations('customers');
  const { merchant, loading: merchantLoading } = useMerchant();
  const supabase = getSupabase();
  const [customers, setCustomers] = useState<CustomerWithCard[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerWithCard[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithCard | null>(null);
  const searchParams = useSearchParams();
  const deepLinkCustomerId = searchParams.get('customer');
  const [subscriberIds, setSubscriberIds] = useState<string[]>([]);
  const [filterPushOnly, setFilterPushOnly] = useState(false);
  const [filterWelcome, setFilterWelcome] = useState(false);
  const [filterPromo, setFilterPromo] = useState(false);
  const [welcomeVoucherCustomerIds, setWelcomeVoucherCustomerIds] = useState<Set<string>>(new Set());
  const [offerVoucherCustomerIds, setOfferVoucherCustomerIds] = useState<Set<string>>(new Set());
  const [tier1RedeemedCards, setTier1RedeemedCards] = useState<Set<string>>(new Set());
  const [displayCount, setDisplayCount] = useState(50);
  const [activeFilter, setActiveFilter] = useState<'all' | 'new7' | 'active30' | 'inactive60' | 'close' | 'reward' | 'birthday_month'>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Create customer modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPhoneCountry, setNewPhoneCountry] = useState<MerchantCountry>((merchant?.country || 'FR') as MerchantCountry);
  const [newBirthDay, setNewBirthDay] = useState('');
  const [newBirthMonth, setNewBirthMonth] = useState('');
  const [newStartAmount, setNewStartAmount] = useState('');
  const [newStartStamps, setNewStartStamps] = useState('');
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Loyalty stats — total visits + redemptions across the merchant
  const [statVisits, setStatVisits] = useState<number | null>(null);
  const [statRewards, setStatRewards] = useState<number | null>(null);

  const monthNames = t('monthNames').split(',');

  const fetchData = useCallback(async () => {
    if (!merchant) return;

    // Parallel fetch: cards + push subscribers + vouchers + loyalty counts
    const [cardsResult, pushResult, vouchersResult, visitsCount, rewardsCount] = await Promise.all([
      supabase
        .from('loyalty_cards')
        .select(`
          *,
          customer:customers (*)
        `)
        .eq('merchant_id', merchant.id)
        .order('updated_at', { ascending: false }),

      fetch(`/api/push/subscribers?merchantId=${merchant.id}`)
        .then(r => r.json())
        .catch(() => ({ subscriberIds: [] })),

      supabase
        .from('vouchers')
        .select('customer_id, source')
        .eq('merchant_id', merchant.id)
        .eq('is_used', false)
        .in('source', ['welcome', 'offer']),

      supabase.from('visits').select('id', { count: 'exact', head: true }).eq('merchant_id', merchant.id),
      supabase.from('redemptions').select('id', { count: 'exact', head: true }).eq('merchant_id', merchant.id),
    ]);

    setStatVisits(visitsCount.count ?? 0);
    setStatRewards(rewardsCount.count ?? 0);

    // Build voucher sets
    const welcomeSet = new Set<string>();
    const offerSet = new Set<string>();
    for (const v of vouchersResult.data || []) {
      const vr = v as { customer_id: string; source: string };
      if (vr.source === 'welcome') welcomeSet.add(vr.customer_id);
      if (vr.source === 'offer') offerSet.add(vr.customer_id);
    }
    setWelcomeVoucherCustomerIds(welcomeSet);
    setOfferVoucherCustomerIds(offerSet);

    const cardsData = cardsResult.data;

    // Set push subscribers
    if (pushResult.subscriberIds) {
      setSubscriberIds(pushResult.subscriberIds);
    }

    if (cardsData) {
      setCustomers(cardsData as CustomerWithCard[]);
      setFilteredCustomers(cardsData as CustomerWithCard[]);

      // Fetch tier 1 redemptions for tier2 merchants (only if needed)
      if (merchant.tier2_enabled) {
        const cardIds = cardsData.map((c: CustomerWithCard) => c.id);
        if (cardIds.length > 0) {
          const { data: redemptionsData } = await supabase
            .from('redemptions')
            .select('loyalty_card_id, tier, redeemed_at')
            .in('loyalty_card_id', cardIds)
            .order('redeemed_at', { ascending: false });

          if (redemptionsData) {
            const tier1Redeemed = new Set<string>();
            const cardRedemptions = new Map<string, Array<{ tier: number; redeemed_at: string }>>();

            redemptionsData.forEach((r: { loyalty_card_id: string; tier: number; redeemed_at: string }) => {
              if (!cardRedemptions.has(r.loyalty_card_id)) {
                cardRedemptions.set(r.loyalty_card_id, []);
              }
              cardRedemptions.get(r.loyalty_card_id)!.push({ tier: r.tier, redeemed_at: r.redeemed_at });
            });

            cardRedemptions.forEach((redemptions, cardId) => {
              const tier2Redemptions = redemptions.filter(r => r.tier === 2);
              const lastTier2Date = tier2Redemptions.length > 0
                ? new Date(tier2Redemptions[0].redeemed_at).getTime()
                : 0;

              const tier1AfterTier2 = redemptions.some(
                r => r.tier === 1 && new Date(r.redeemed_at).getTime() > lastTier2Date
              );

              if (tier1AfterTier2) {
                tier1Redeemed.add(cardId);
              }
            });

            setTier1RedeemedCards(tier1Redeemed);
          }
        }
      }
    }

    setLoading(false);
  }, [merchant, supabase]);

  // Deep link: auto-open customer modal from ?customer= param (once only)
  const hasDeepLinked = useRef(false);
  useEffect(() => {
    if (hasDeepLinked.current || !deepLinkCustomerId || customers.length === 0) return;
    const match = customers.find(c => c.customer_id === deepLinkCustomerId);
    if (match) {
      setSelectedCustomer(match);
      hasDeepLinked.current = true;
    }
  }, [deepLinkCustomerId, customers]);

  const handleOpenAdjustModal = (customer: CustomerWithCard) => {
    setSelectedCustomer(customer);
    setAdjustModalOpen(true);
  };

  const handleAdjustSuccess = () => {
    fetchData();
  };

  const handleCreateCustomer = async () => {
    if (!newFirstName.trim() || !newPhone.trim() || !merchant) return;

    setCreatingCustomer(true);
    setCreateError(null);

    try {
      const response = await fetch('/api/customers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: newFirstName.trim(),
          last_name: newLastName.trim() || null,
          phone_number: formatPhoneNumber(newPhone.trim(), newPhoneCountry),
          phone_country: newPhoneCountry,
          birth_month: newBirthMonth ? parseInt(newBirthMonth) : null,
          birth_day: newBirthDay ? parseInt(newBirthDay) : null,
          ...(merchant.loyalty_mode === 'cagnotte' && newStartAmount ? { initial_amount: parseFloat(newStartAmount) } : {}),
          ...(newStartStamps ? { initial_stamps: parseInt(newStartStamps) } : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setCreateError(data.error || t('createError'));
        setCreatingCustomer(false);
        return;
      }

      // Close modal and refresh data
      setCreateModalOpen(false);
      setNewFirstName('');
      setNewLastName('');
      setNewPhone('');
      setNewBirthDay('');
      setNewBirthMonth('');
      setNewStartAmount('');
      setNewStartStamps('');
      setCreateError(null);
      await fetchData();
    } catch (error) {
      console.error('Error:', error);
      setCreateError(t('createErrorGeneric'));
    }
    setCreatingCustomer(false);
  };

  useEffect(() => {
    if (!merchantLoading && merchant) {
      fetchData();
    }
  }, [merchant, merchantLoading, fetchData]);

  const new7Count = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    return customers.filter(c => c.created_at && new Date(c.created_at) >= cutoff).length;
  }, [customers]);

  const active30Count = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return customers.filter(c => c.last_visit_date && new Date(c.last_visit_date) >= cutoff).length;
  }, [customers]);

  const inactive60Count = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 60);
    return customers.filter(c => !c.last_visit_date || new Date(c.last_visit_date) < cutoff).length;
  }, [customers]);

  const birthdayMonthCount = useMemo(() => {
    const month = new Date().getMonth() + 1;
    return customers.filter(c => c.customer?.birth_month === month).length;
  }, [customers]);

  const closeCount = useMemo(() => {
    const required = merchant?.stamps_required || 10;
    return customers.filter(c => {
      const remaining = required - c.current_stamps;
      return remaining >= 1 && remaining <= 2;
    }).length;
  }, [customers, merchant]);

  const rewardCount = useMemo(() => {
    const required = merchant?.stamps_required || 10;
    return customers.filter(c => c.current_stamps >= required).length;
  }, [customers, merchant]);

  const welcomeCount = useMemo(() => {
    return customers.filter(c => welcomeVoucherCustomerIds.has(c.customer_id)).length;
  }, [customers, welcomeVoucherCustomerIds]);

  const promoCount = useMemo(() => {
    return customers.filter(c => offerVoucherCustomerIds.has(c.customer_id)).length;
  }, [customers, offerVoucherCustomerIds]);

  const activeFilterCount =
    (filterPushOnly ? 1 : 0) +
    (filterWelcome ? 1 : 0) +
    (filterPromo ? 1 : 0) +
    (activeFilter !== 'all' ? 1 : 0);

  const resetFilters = () => {
    setFilterPushOnly(false);
    setFilterWelcome(false);
    setFilterPromo(false);
    setActiveFilter('all');
  };

  useEffect(() => {
    let filtered = customers;

    // Apply toggle filters
    if (filterPushOnly) {
      filtered = filtered.filter((card) => subscriberIds.includes(card.customer_id));
    }
    if (filterWelcome) {
      filtered = filtered.filter((card) => welcomeVoucherCustomerIds.has(card.customer_id));
    }
    if (filterPromo) {
      filtered = filtered.filter((card) => offerVoucherCustomerIds.has(card.customer_id));
    }

    // Apply status filter
    if (activeFilter === 'new7') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      filtered = filtered.filter((card) => card.created_at && new Date(card.created_at) >= cutoff);
    } else if (activeFilter === 'active30') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      filtered = filtered.filter((card) => card.last_visit_date && new Date(card.last_visit_date) >= cutoff);
    } else if (activeFilter === 'inactive60') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 60);
      filtered = filtered.filter((card) => {
        if (!card.last_visit_date) return true;
        return new Date(card.last_visit_date) < cutoff;
      });
    } else if (activeFilter === 'close') {
      const required = merchant?.stamps_required || 10;
      filtered = filtered.filter((card) => {
        const remaining = required - card.current_stamps;
        return remaining >= 1 && remaining <= 2;
      });
    } else if (activeFilter === 'reward') {
      filtered = filtered.filter((card) => {
        return card.current_stamps >= (merchant?.stamps_required || 10);
      });
    } else if (activeFilter === 'birthday_month') {
      const month = new Date().getMonth() + 1;
      filtered = filtered.filter((card) => card.customer?.birth_month === month);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const queryDigits = query.replace(/\D/g, '');
      filtered = filtered.filter((card) => {
        const name = `${card.customer?.first_name || ''} ${card.customer?.last_name || ''}`.toLowerCase();
        if (name.includes(query)) return true;
        // Phone: compare digits against E.164 stored format
        const phone = card.customer?.phone_number || '';
        if (queryDigits.length >= 2 && phone.includes(queryDigits)) return true;
        return false;
      });
    }

    setFilteredCustomers(filtered);
    setDisplayCount(50); // Reset pagination on filter change
  }, [searchQuery, customers, filterPushOnly, filterWelcome, filterPromo, subscriberIds, welcomeVoucherCustomerIds, offerVoucherCustomerIds, activeFilter, merchant]);

  if (loading || merchantLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const remaining = filteredCustomers.length - displayCount;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header : titre + compteur + boutons d'actions en dessous */}
      <div className="flex flex-col gap-4 p-4 md:p-6 rounded-2xl bg-[#4b0082]/[0.04] border border-[#4b0082]/[0.08]">
        <div>
          <h1 className="text-xl md:text-3xl font-extrabold tracking-tight text-gray-900">
            {t('title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4b0082] to-violet-600">{t('titleHighlight')}</span>
          </h1>
          <p className="mt-1 text-sm md:text-base font-medium text-gray-500">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#4b0082]/10 text-[#4b0082] mr-2 border border-[#4b0082]/20">
              {customers.length} {t('total')}
            </span>
            {customers.length > 1 ? t('subtotalPlural') : t('subtotalSingular')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/dashboard/members">
            <Button
              variant="outline"
              className="h-9 px-3 text-sm border-amber-200 hover:border-amber-300 hover:bg-amber-50/50 text-amber-700 rounded-lg transition-all duration-200 shadow-sm"
            >
              <Crown className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
              {t('vipPrograms')}
            </Button>
          </Link>
          <Link href="/dashboard/contest">
            <Button
              variant="outline"
              className="h-9 px-3 text-sm border-amber-200 hover:border-amber-300 hover:bg-amber-50/50 text-amber-700 rounded-lg transition-all duration-200 shadow-sm"
            >
              <Trophy className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
              {t('contest')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Loyalty stats (fidélité-only) */}
      <div className="grid grid-cols-2 gap-3">
        <StatsCard
          title={t('statVisits')}
          value={statVisits ?? '—'}
          icon={UserCheck}
          color="#10B981"
        />
        <StatsCard
          title={t('statRewards')}
          value={statRewards ?? '—'}
          icon={Gift}
          color="#e11d48"
        />
      </div>

      <div className="p-4 md:p-8 bg-white/80 backdrop-blur-xl rounded-2xl md:rounded-3xl border border-white/20 shadow-xl shadow-indigo-100/50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-600 to-violet-600 opacity-80" />

        <div className="flex flex-col sm:flex-row gap-3 mb-6 md:mb-8">
          <div className="relative flex-1 max-w-md group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400 transition-colors group-focus-within:text-indigo-600" />
            </div>
            <Input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-10 h-11 bg-white border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors placeholder:text-gray-400 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilterModal(true)}
              className={`inline-flex items-center gap-2 px-4 h-11 rounded-xl border text-sm font-bold transition-all ${
                activeFilterCount > 0
                  ? 'bg-[#4b0082] text-white border-[#4b0082] shadow-md shadow-[#4b0082]/20'
                  : 'bg-[#4b0082]/5 text-[#4b0082] border-[#4b0082]/20 hover:bg-[#4b0082]/10 hover:border-[#4b0082]/30'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>{t('filters')}</span>
              {activeFilterCount > 0 && (
                <span className="px-1.5 py-0.5 text-[11px] font-bold rounded-full bg-white/20 text-white tabular-nums">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 h-11 rounded-xl text-sm font-bold transition-all bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-md shadow-indigo-200"
            >
              <UserPlus className="w-4 h-4" />
              <span>{t('newButton')}</span>
            </button>
            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="text-xs font-semibold text-gray-500 hover:text-gray-700 px-2"
              >
                {t('filtersReset')}
              </button>
            )}
          </div>
        </div>


        {filteredCustomers.length > 0 ? (
          <>
            {/* Mobile card list */}
            <div className="md:hidden space-y-2">
              {filteredCustomers.slice(0, displayCount).map((card) => {
                const isCagnotte = merchant?.loyalty_mode === 'cagnotte';
                const isTier1Ready = card.current_stamps >= (merchant?.stamps_required || 10);
                const isTier2Ready = merchant?.tier2_enabled && merchant?.tier2_stamps_required && card.current_stamps >= merchant.tier2_stamps_required;
                const progress = Math.min((card.current_stamps / (merchant?.stamps_required || 10)) * 100, 100);
                const isPushSubscriber = subscriberIds.includes(card.customer_id);
                const cashbackValue = isCagnotte && merchant?.cagnotte_percent ? (Number(card.current_amount || 0) * merchant.cagnotte_percent / 100) : 0;
                const badge = getCardBadge(t, isTier1Ready, !!isTier2Ready, !!merchant?.tier2_enabled, tier1RedeemedCards.has(card.id), isCagnotte, cashbackValue);
                return (
                  <button
                    key={card.id}
                    onClick={() => handleOpenAdjustModal(card)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 active:scale-[0.98] transition-all text-left"
                  >
                    {/* Status dot */}
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      isTier2Ready ? 'bg-violet-500' :
                      isTier1Ready ? 'bg-emerald-500' :
                      'bg-gray-200'
                    }`} />

                    {/* Name + badge */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {card.customer?.first_name} {card.customer?.last_name}
                        </p>
                        {isPushSubscriber && (
                          <Bell className="w-3 h-3 text-amber-500 shrink-0" />
                        )}
                      </div>
                      {badge && (
                        <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded ${badge.color}`}>
                          {badge.text}
                        </span>
                      )}
                      {isCagnotte && !badge && (
                        <span className="text-[10px] font-medium text-gray-500">
                          {formatCurrency(Number(card.current_amount || 0), merchant?.country)} {t('accumulated')}
                        </span>
                      )}
                    </div>

                    {/* Compact progress */}
                    <div className="shrink-0 flex items-center gap-2">
                      {merchant?.tier2_enabled && merchant?.tier2_stamps_required ? (
                        <div className="flex flex-col gap-1 items-end">
                          <div className="flex items-center gap-1.5">
                            <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${isTier1Ready ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                style={{ width: `${Math.min((card.current_stamps / (merchant.stamps_required || 10)) * 100, 100)}%` }}
                              />
                            </div>
                            <span className={`text-[10px] font-bold tabular-nums ${isTier1Ready ? 'text-emerald-600' : 'text-gray-500'}`}>
                              {Math.min(card.current_stamps, merchant.stamps_required || 10)}/{merchant.stamps_required}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${isTier2Ready ? 'bg-violet-500' : 'bg-gray-300'}`}
                                style={{ width: `${Math.min(Math.max(0, (card.current_stamps - (merchant.stamps_required || 10)) / ((merchant.tier2_stamps_required || 20) - (merchant.stamps_required || 10))) * 100, 100)}%` }}
                              />
                            </div>
                            <span className={`text-[10px] font-bold tabular-nums ${isTier2Ready ? 'text-violet-600' : 'text-gray-400'}`}>
                              {Math.max(0, Math.min(card.current_stamps - (merchant.stamps_required || 10), (merchant.tier2_stamps_required || 20) - (merchant.stamps_required || 10)))}/{(merchant.tier2_stamps_required || 20) - (merchant.stamps_required || 10)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-gray-700 tabular-nums">
                            {card.current_stamps}/{merchant?.stamps_required}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
              {filteredCustomers.length > displayCount && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => setDisplayCount(prev => prev + 50)}
                    className="px-5 py-2 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-100 transition-colors"
                  >
                    {t('loadMore')} ({remaining > 1 ? t('remainingPlural', { count: remaining }) : t('remaining', { count: remaining })})
                  </button>
                </div>
              )}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-y border-gray-100 first:rounded-tl-xl first:border-l last:rounded-tr-xl last:border-r">
                      {t('thClient')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-y border-gray-100">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5" />
                        {t('thPhone')}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-y border-gray-100">
                      <div className="flex items-center gap-2">
                        <Gift className="w-3.5 h-3.5" />
                        {t('thProgress')}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-y border-gray-100">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        {t('thLastVisit')}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-y border-gray-100">
                      {t('thSignup')}
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider border-y border-gray-100 first:border-l last:rounded-tr-xl last:border-r">
                      {t('thActions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCustomers.slice(0, displayCount).map((card) => {
                    const isCagnotte = merchant?.loyalty_mode === 'cagnotte';
                    const isTier1Ready = card.current_stamps >= (merchant?.stamps_required || 10);
                    const isTier2Ready = merchant?.tier2_enabled && merchant?.tier2_stamps_required && card.current_stamps >= merchant.tier2_stamps_required;
                    const progress = Math.min((card.current_stamps / (merchant?.stamps_required || 10)) * 100, 100);
                    const isPushSubscriber = subscriberIds.includes(card.customer_id);
                    const cashbackValue = isCagnotte && merchant?.cagnotte_percent ? (Number(card.current_amount || 0) * merchant.cagnotte_percent / 100) : 0;

                    const badge = getCardBadge(t, isTier1Ready, !!isTier2Ready, !!merchant?.tier2_enabled, tier1RedeemedCards.has(card.id), isCagnotte, cashbackValue);
                    return (
                      <tr key={card.id} className="group hover:bg-indigo-50/30 transition-all duration-200 cursor-pointer" onClick={() => handleOpenAdjustModal(card)}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                              isTier2Ready ? 'bg-violet-500' :
                              isTier1Ready ? 'bg-emerald-500' :
                              'bg-gray-200'
                            }`} />
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-gray-900">
                                  {card.customer?.first_name} {card.customer?.last_name}
                                </p>
                                {isPushSubscriber && (
                                  <Bell className="w-3.5 h-3.5 text-amber-500" />
                                )}
                              </div>
                              {badge && (
                                <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md ${badge.color}`}>
                                  {badge.text}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatPhoneLabel(card.customer?.phone_number || '')}
                        </td>
                        <td className="px-6 py-4">
                          {merchant?.tier2_enabled && merchant?.tier2_stamps_required ? (
                            /* Dual Tier Progress */
                            <div className="space-y-2">
                              {/* Tier 1 */}
                              <div className="flex items-center gap-2">
                                <Gift className={`w-3.5 h-3.5 shrink-0 ${card.current_stamps >= (merchant.stamps_required || 10) ? 'text-emerald-500' : 'text-indigo-400'}`} />
                                <div className="flex-1 w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                                      card.current_stamps >= (merchant.stamps_required || 10)
                                        ? 'bg-emerald-500'
                                        : 'bg-gradient-to-r from-indigo-500 to-violet-500'
                                    }`}
                                    style={{ width: `${Math.min((card.current_stamps / (merchant.stamps_required || 10)) * 100, 100)}%` }}
                                  />
                                </div>
                                <span className={`text-[10px] font-bold tabular-nums ${card.current_stamps >= (merchant.stamps_required || 10) ? 'text-emerald-600' : 'text-gray-500'}`}>
                                  {Math.min(card.current_stamps, merchant.stamps_required || 10)}/{merchant.stamps_required}
                                </span>
                              </div>
                              {/* Tier 2 */}
                              <div className="flex items-center gap-2">
                                <Trophy className={`w-3.5 h-3.5 shrink-0 ${card.current_stamps >= (merchant.tier2_stamps_required || 20) ? 'text-violet-500' : 'text-gray-300'}`} />
                                <div className="flex-1 w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                                      card.current_stamps >= (merchant.tier2_stamps_required || 20)
                                        ? 'bg-violet-500'
                                        : 'bg-gradient-to-r from-gray-300 to-gray-400'
                                    }`}
                                    style={{ width: `${Math.min(Math.max(0, (card.current_stamps - (merchant.stamps_required || 10)) / ((merchant.tier2_stamps_required || 20) - (merchant.stamps_required || 10))) * 100, 100)}%` }}
                                  />
                                </div>
                                <span className={`text-[10px] font-bold tabular-nums ${card.current_stamps >= (merchant.tier2_stamps_required || 20) ? 'text-violet-600' : 'text-gray-400'}`}>
                                  {Math.max(0, Math.min(card.current_stamps - (merchant.stamps_required || 10), (merchant.tier2_stamps_required || 20) - (merchant.stamps_required || 10)))}/{(merchant.tier2_stamps_required || 20) - (merchant.stamps_required || 10)}
                                </span>
                              </div>
                            </div>
                          ) : (
                            /* Single Tier Progress */
                            <div>
                              <div className="flex items-center gap-3">
                                <div className="flex-1 w-28 h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500 ease-out"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <span className="text-xs font-bold text-gray-700 tabular-nums">
                                  {card.current_stamps}/{merchant?.stamps_required}
                                </span>
                              </div>
                              {isCagnotte && (
                                <p className="text-[10px] font-medium text-gray-500 mt-1">
                                  {formatCurrency(Number(card.current_amount || 0), merchant?.country)} {t('accumulated')}
                                </p>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {card.last_visit_date ? formatDate(card.last_visit_date) : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(card.created_at)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenAdjustModal(card); }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-indigo-600 bg-white border border-indigo-100 rounded-xl hover:bg-indigo-600 hover:text-white hover:border-indigo-600 shadow-sm transition-all active:scale-95"
                          >
                            <SlidersHorizontal className="w-4 h-4" />
                            {t('manage')}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredCustomers.length > displayCount && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => setDisplayCount(prev => prev + 50)}
                    className="px-6 py-2.5 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-100 transition-colors"
                  >
                    {t('loadMore')} ({remaining > 1 ? t('remainingPlural', { count: remaining }) : t('remaining', { count: remaining })})
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Users className="w-16 h-16 mb-4 text-gray-300" />
            {searchQuery || activeFilter !== 'all' || filterPushOnly ? (
              <>
                <p className="text-lg font-medium">{t('noResults')}</p>
                <p className="text-sm">{t('noResultsHint')}</p>
              </>
            ) : (
              <>
                <p className="text-lg font-medium">{t('noClients')}</p>
                <p className="text-sm">
                  {t('noClientsHint')}
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Filter modal ── */}
      <AnimatePresence>
        {showFilterModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setShowFilterModal(false); }}
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="relative bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-gray-900">{t('filtersTitle')}</h3>
                  {activeFilterCount > 0 && (
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md tabular-nums">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                <button onClick={() => setShowFilterModal(false)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="p-4 space-y-5">
                {/* Statut */}
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">{t('filterGroupStatus')}</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setActiveFilter(activeFilter === 'new7' ? 'all' : 'new7')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all ${activeFilter === 'new7' ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-200' : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'}`}
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${activeFilter === 'new7' ? 'text-white' : 'text-emerald-500'}`} />
                      <span>{t('filterNew7')}</span>
                      <span className={`px-1.5 py-0.5 text-xs font-bold rounded-full ${activeFilter === 'new7' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'}`}>{new7Count}</span>
                    </button>
                    <button
                      onClick={() => setActiveFilter(activeFilter === 'active30' ? 'all' : 'active30')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all ${activeFilter === 'active30' ? 'bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-200' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'}`}
                    >
                      <Users className={`w-3.5 h-3.5 ${activeFilter === 'active30' ? 'text-white' : 'text-indigo-500'}`} />
                      <span>{t('filterActive30')}</span>
                      <span className={`px-1.5 py-0.5 text-xs font-bold rounded-full ${activeFilter === 'active30' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'}`}>{active30Count}</span>
                    </button>
                    <button
                      onClick={() => setActiveFilter(activeFilter === 'inactive60' ? 'all' : 'inactive60')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all ${activeFilter === 'inactive60' ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-200' : 'bg-white text-gray-600 border-gray-200 hover:border-rose-300 hover:bg-rose-50'}`}
                    >
                      <Clock className={`w-3.5 h-3.5 ${activeFilter === 'inactive60' ? 'text-white' : 'text-rose-500'}`} />
                      <span>{t('filterInactive60')}</span>
                      <span className={`px-1.5 py-0.5 text-xs font-bold rounded-full ${activeFilter === 'inactive60' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700'}`}>{inactive60Count}</span>
                    </button>
                    <button
                      onClick={() => setActiveFilter(activeFilter === 'close' ? 'all' : 'close')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all ${activeFilter === 'close' ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-200' : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300 hover:bg-amber-50'}`}
                    >
                      <Target className={`w-3.5 h-3.5 ${activeFilter === 'close' ? 'text-white' : 'text-amber-500'}`} />
                      <span>{t('filterClose')}</span>
                      <span className={`px-1.5 py-0.5 text-xs font-bold rounded-full ${activeFilter === 'close' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'}`}>{closeCount}</span>
                    </button>
                    <button
                      onClick={() => setActiveFilter(activeFilter === 'reward' ? 'all' : 'reward')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all ${activeFilter === 'reward' ? 'bg-green-500 text-white border-green-500 shadow-md shadow-green-200' : 'bg-white text-gray-600 border-gray-200 hover:border-green-300 hover:bg-green-50'}`}
                    >
                      <Gift className={`w-3.5 h-3.5 ${activeFilter === 'reward' ? 'text-white' : 'text-green-500'}`} />
                      <span>{t('filterReward')}</span>
                      <span className={`px-1.5 py-0.5 text-xs font-bold rounded-full ${activeFilter === 'reward' ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'}`}>{rewardCount}</span>
                    </button>
                    {birthdayMonthCount > 0 && (
                      <button
                        onClick={() => setActiveFilter(activeFilter === 'birthday_month' ? 'all' : 'birthday_month')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all ${activeFilter === 'birthday_month' ? 'bg-fuchsia-500 text-white border-fuchsia-500 shadow-md shadow-fuchsia-200' : 'bg-white text-gray-600 border-gray-200 hover:border-fuchsia-300 hover:bg-fuchsia-50'}`}
                      >
                        <Cake className={`w-3.5 h-3.5 ${activeFilter === 'birthday_month' ? 'text-white' : 'text-fuchsia-500'}`} />
                        <span>{t('filterBirthdayMonth')}</span>
                        <span className={`px-1.5 py-0.5 text-xs font-bold rounded-full ${activeFilter === 'birthday_month' ? 'bg-white/20 text-white' : 'bg-fuchsia-100 text-fuchsia-700'}`}>{birthdayMonthCount}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Communication */}
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">{t('filterGroupCommunication')}</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setFilterPushOnly(!filterPushOnly)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all ${filterPushOnly ? 'bg-violet-500 text-white border-violet-500 shadow-md shadow-violet-200' : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300 hover:bg-violet-50'}`}
                    >
                      <Bell className={`w-3.5 h-3.5 ${filterPushOnly ? 'text-white' : 'text-violet-500'}`} />
                      <span>{t('filterNotifiable')}</span>
                      <span className={`px-1.5 py-0.5 text-xs font-bold rounded-full ${filterPushOnly ? 'bg-white/20 text-white' : 'bg-violet-100 text-violet-700'}`}>{subscriberIds.length}</span>
                    </button>
                  </div>
                </div>

                {/* Avantages actifs */}
                {((merchant?.welcome_offer_enabled && welcomeCount > 0) || promoCount > 0) && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">{t('filterGroupVouchers')}</p>
                    <div className="flex flex-wrap gap-2">
                      {merchant?.welcome_offer_enabled && welcomeCount > 0 && (
                        <button
                          onClick={() => setFilterWelcome(!filterWelcome)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all ${filterWelcome ? 'bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-200' : 'bg-white text-gray-600 border-gray-200 hover:border-sky-300 hover:bg-sky-50'}`}
                        >
                          <Sparkles className={`w-3.5 h-3.5 ${filterWelcome ? 'text-white' : 'text-sky-500'}`} />
                          <span>{t('filterWelcome')}</span>
                          <span className={`px-1.5 py-0.5 text-xs font-bold rounded-full ${filterWelcome ? 'bg-white/20 text-white' : 'bg-sky-100 text-sky-700'}`}>{welcomeCount}</span>
                        </button>
                      )}
                      {promoCount > 0 && (
                        <button
                          onClick={() => setFilterPromo(!filterPromo)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all ${filterPromo ? 'bg-pink-500 text-white border-pink-500 shadow-md shadow-pink-200' : 'bg-white text-gray-600 border-gray-200 hover:border-pink-300 hover:bg-pink-50'}`}
                        >
                          <Ticket className={`w-3.5 h-3.5 ${filterPromo ? 'text-white' : 'text-pink-500'}`} />
                          <span>{t('filterPromo')}</span>
                          <span className={`px-1.5 py-0.5 text-xs font-bold rounded-full ${filterPromo ? 'bg-white/20 text-white' : 'bg-pink-100 text-pink-700'}`}>{promoCount}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-100 flex gap-2">
                <button
                  onClick={resetFilters}
                  disabled={activeFilterCount === 0}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition-colors disabled:opacity-40"
                >
                  {t('filtersReset')}
                </button>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="flex-[2] py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors"
                >
                  {t('filtersApply', { count: filteredCustomers.length })}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedCustomer && merchant && (
        <CustomerManagementModal
          isOpen={adjustModalOpen}
          onClose={() => {
            setAdjustModalOpen(false);
            setSelectedCustomer(null);
          }}
          firstName={selectedCustomer.customer?.first_name || ''}
          lastName={selectedCustomer.customer?.last_name || ''}
          customerId={selectedCustomer.customer_id}
          merchantId={merchant.id}
          loyaltyCardId={selectedCustomer.id}
          currentStamps={selectedCustomer.current_stamps}
          stampsRequired={merchant.stamps_required}
          phoneNumber={selectedCustomer.customer?.phone_number || ''}
          onSuccess={handleAdjustSuccess}
          tier2Enabled={merchant.tier2_enabled}
          tier2StampsRequired={merchant.tier2_stamps_required || undefined}
          tier2RewardDescription={merchant.tier2_reward_description || undefined}
          rewardDescription={merchant.reward_description || undefined}
          birthMonth={selectedCustomer.customer?.birth_month}
          birthDay={selectedCustomer.customer?.birth_day}
          tier1Redeemed={tier1RedeemedCards.has(selectedCustomer.id)}
          isCagnotte={merchant.loyalty_mode === 'cagnotte'}
          currentAmount={Number(selectedCustomer.current_amount || 0)}
          cagnottePercent={Number(merchant.cagnotte_percent || 0)}
          cagnotteTier2Percent={merchant.cagnotte_tier2_percent ? Number(merchant.cagnotte_tier2_percent) : null}
          country={merchant.country}
        />
      )}

      {/* Create Customer Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setNewFirstName('');
          setNewLastName('');
          setNewPhone('');
          setNewStartAmount('');
          setNewStartStamps('');
          setCreateError(null);
        }}
        title={t('newClientTitle')}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500 mb-4">
            {t('newClientDesc')}
          </p>

          {createError && (
            <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
              {createError}
            </div>
          )}

          <Input
            label={t('firstName')}
            placeholder={t('firstNamePlaceholder')}
            value={newFirstName}
            onChange={(e) => setNewFirstName(e.target.value)}
          />
          <Input
            label={t('lastName')}
            placeholder={t('lastNamePlaceholder')}
            value={newLastName}
            onChange={(e) => setNewLastName(e.target.value)}
          />
          <PhoneInput
            label={t('phone')}
            value={newPhone}
            onChange={setNewPhone}
            country={newPhoneCountry}
            onCountryChange={setNewPhoneCountry}
            countries={['FR', 'BE', 'CH']}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('birthdayLabel')}</label>
            <div className="flex gap-2">
              <select
                value={newBirthDay}
                onChange={(e) => setNewBirthDay(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">{t('dayOption')}</option>
                {Array.from({ length: 31 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
              <select
                value={newBirthMonth}
                onChange={(e) => setNewBirthMonth(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">{t('monthOption')}</option>
                {monthNames.map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
          </div>
          <Input
            label={t('startStamps')}
            type="number"
            min="0"
            step="1"
            placeholder="0"
            value={newStartStamps}
            onChange={(e) => setNewStartStamps(e.target.value)}
          />
          {merchant?.loyalty_mode === 'cagnotte' && (
            <Input
              label={t('startAmount')}
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={newStartAmount}
              onChange={(e) => setNewStartAmount(e.target.value)}
            />
          )}
          <Button
            onClick={handleCreateCustomer}
            disabled={!newFirstName.trim() || !newPhone.trim() || creatingCustomer}
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white"
          >
            {creatingCustomer ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <UserPlus className="w-4 h-4 mr-2" />
            )}
            {t('createButton')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
