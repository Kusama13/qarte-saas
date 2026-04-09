'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

import {
  Search,
  Store,
  ChevronRight,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Shield,
  MessageCircle,
  AlertTriangle,
  Smartphone,
  CalendarX,
  Download,
  ArrowUpDown,
  Hourglass,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { cn, formatPhoneForWhatsApp } from '@/lib/utils';
import type { Merchant, MerchantCountry, ShopType } from '@/types';
import { SHOP_TYPES } from '@/types';

// --- Constants ---

const ADMIN_CONTACT_NAME = 'Elodie';

// --- Types ---

interface MerchantsDataResponse {
  merchants: Merchant[];
  superAdminIds: string[];
  customerCounts: Record<string, number>;
  lastVisitDates: Record<string, string>;
  todayScans: Record<string, number>;
  weeklyScans: Record<string, number>;

  pendingPoints: Record<string, number>;
  userEmails: Record<string, string>;
  servicesCounts: Record<string, number>;
  photosCounts: Record<string, number>;
  pendingDepositsCounts?: Record<string, number>;
}

interface LifecycleStage {
  label: string;
  color: string;
  bgColor: string;
  urgency: number;
}

type FilterStatus = 'all' | 'trial' | 'trial_expired' | 'active' | 'canceling' | 'canceled';

// --- Lifecycle Stage ---

function getLifecycleStage(
  merchant: Merchant,
  lastVisit: string | null,
  todayScans: number,
  hasProgram: boolean,
): LifecycleStage {
  const now = new Date();
  const trialEnd = merchant.trial_ends_at ? new Date(merchant.trial_ends_at) : null;
  const status = merchant.subscription_status;

  // Essai expire
  if (status === 'trial' && trialEnd && trialEnd < now) {
    return { label: 'Essai expiré', color: 'text-orange-700', bgColor: 'bg-orange-100', urgency: 0 };
  }

  // Impaye
  if (status === 'past_due') {
    return { label: 'Impayé', color: 'text-red-700', bgColor: 'bg-red-100', urgency: 1 };
  }

  // Essai J-X (3 jours ou moins)
  if (status === 'trial' && trialEnd) {
    const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 3 && daysLeft > 0) {
      return { label: `Essai J-${daysLeft}`, color: 'text-orange-700', bgColor: 'bg-orange-100', urgency: 1 };
    }
  }

  // Config programme manquante
  if ((status === 'trial' || status === 'active') && !hasProgram) {
    return { label: 'Config programme', color: 'text-amber-700', bgColor: 'bg-amber-100', urgency: 2 };
  }

  // 1er scan attendu (aucune visite)
  if ((status === 'trial' || status === 'active') && !lastVisit) {
    return { label: '1er scan attendu', color: 'text-amber-700', bgColor: 'bg-amber-100', urgency: 3 };
  }

  // Inactif >7j
  if ((status === 'trial' || status === 'active') && lastVisit) {
    const daysSince = Math.floor((now.getTime() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince > 7) {
      return { label: `Inactif ${daysSince}j`, color: 'text-red-700', bgColor: 'bg-red-100', urgency: 3 };
    }
  }

  // Annulation programmee
  if (status === 'canceling') {
    return { label: 'Annulation', color: 'text-purple-700', bgColor: 'bg-purple-100', urgency: 4 };
  }

  // Churned
  if (status === 'canceled') {
    return { label: 'Churned', color: 'text-gray-600', bgColor: 'bg-gray-100', urgency: 5 };
  }

  // En essai normal
  if (status === 'trial') {
    const daysLeft = trialEnd ? Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : '?';
    return { label: `Essai J-${daysLeft}`, color: 'text-blue-700', bgColor: 'bg-blue-100', urgency: 7 };
  }

  // Actif avec scans aujourd'hui
  if (status === 'active' && todayScans > 0) {
    return { label: 'Actif', color: 'text-green-700', bgColor: 'bg-green-100', urgency: 10 };
  }

  // Actif
  if (status === 'active') {
    return { label: 'Actif', color: 'text-green-700', bgColor: 'bg-green-100', urgency: 9 };
  }

  return { label: status, color: 'text-gray-600', bgColor: 'bg-gray-100', urgency: 6 };
}

// --- Activity Label ---

function getActivityLabel(lastVisit: string | null): { text: string; color: string } {
  if (!lastVisit) return { text: 'Jamais', color: 'text-red-600' };
  const daysSince = Math.floor((Date.now() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24));
  if (daysSince === 0) return { text: "Auj.", color: 'text-green-600' };
  if (daysSince <= 3) return { text: `${daysSince}j`, color: 'text-green-600' };
  if (daysSince <= 7) return { text: `${daysSince}j`, color: 'text-amber-600' };
  return { text: `${daysSince}j`, color: 'text-red-600' };
}

// --- Health Score ---

function computeHealthScore(
  merchant: Merchant,
  customerCount: number,
  weeklyScans: number,
  lastVisit: string | null,
): number {
  let score = 0;
  if (merchant.reward_description !== null) score += 15;
  if (merchant.logo_url) score += 10;
  if (merchant.instagram_url || merchant.facebook_url || merchant.tiktok_url || merchant.snapchat_url) score += 5;
  if (merchant.review_link) score += 5;
  if (merchant.booking_url) score += 5;
  if (customerCount >= 21) score += 20;
  else if (customerCount >= 6) score += 15;
  else if (customerCount >= 1) score += 10;
  if (weeklyScans > 0) score += 15;
  if (lastVisit) {
    const daysSince = Math.floor((Date.now() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince < 7) score += 10;
    else if (daysSince < 14) score += 5;
  }
  if (merchant.referral_program_enabled) score += 5;
  if (merchant.shield_enabled) score += 5;
  if (merchant.tier2_enabled) score += 5;
  if (merchant.welcome_offer_enabled) score += 5;
  if (merchant.birthday_gift_enabled) score += 3;
  if (merchant.double_days_enabled) score += 2;
  if (merchant.planning_enabled) score += 5;
  if (merchant.auto_booking_enabled) score += 5;
  return Math.min(score, 100);
}

function HealthDot({ score }: { score: number }) {
  const color =
    score >= 81 ? 'bg-green-500' :
    score >= 61 ? 'bg-lime-500' :
    score >= 31 ? 'bg-orange-400' :
    'bg-red-500';
  return (
    <span
      className={cn('inline-block w-2.5 h-2.5 rounded-full flex-shrink-0', color)}
      title={`Sante: ${score}/100`}
    />
  );
}

// --- WhatsApp ---
// formatPhoneForWhatsApp imported from @/lib/utils

// --- Shared Sub-Components ---

/** Badges shown next to merchant name */
function MerchantBadges({ isAdmin, noContact, pending, pendingDeposits, pwaInstalled, welcomeOffer, cagnotte, pageRemplie, planningEnabled, resaEnLigne, bookingMode, contestEnabled }: { isAdmin: boolean; noContact: boolean | null; pending: number; pendingDeposits: number; pwaInstalled: boolean; welcomeOffer: boolean; cagnotte: boolean; pageRemplie: boolean; planningEnabled: boolean; resaEnLigne: boolean; bookingMode: 'slots' | 'free' | null; contestEnabled: boolean }) {
  return (
    <>
      {isAdmin && (
        <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-purple-100 text-purple-700 rounded-full flex-shrink-0">
          Admin
        </span>
      )}
      {noContact && (
        <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-red-100 text-red-700 rounded-full flex-shrink-0">
          NC
        </span>
      )}
      {pending > 0 && (
        <span
          className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700 rounded-full flex-shrink-0 flex items-center gap-0.5"
          title={`${pending} point${pending > 1 ? 's' : ''} en attente`}
        >
          <Shield className="w-3 h-3" />
          {pending}
        </span>
      )}
      {pendingDeposits > 0 && (
        <span
          className="px-1.5 py-0.5 text-[10px] font-semibold bg-orange-100 text-orange-700 rounded-full flex-shrink-0 flex items-center gap-0.5"
          title={`${pendingDeposits} resa${pendingDeposits > 1 ? 's' : ''} en attente d'acompte`}
        >
          <Hourglass className="w-3 h-3" />
          {pendingDeposits}
        </span>
      )}
      {planningEnabled && (
        <span className={cn("px-1.5 py-0.5 text-[10px] font-semibold rounded-full flex-shrink-0", resaEnLigne ? "bg-emerald-100 text-emerald-700" : "bg-sky-100 text-sky-700")} title={resaEnLigne ? "Planning + resa en ligne" : "Planning actif (resa en ligne desactivee)"}>
          {resaEnLigne ? 'Resa' : 'Planning'}
        </span>
      )}
      {planningEnabled && bookingMode === 'free' && (
        <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-teal-100 text-teal-700 rounded-full flex-shrink-0" title="Mode libre">
          Libre
        </span>
      )}
      {pwaInstalled && (
        <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-green-100 text-green-700 rounded-full flex-shrink-0 flex items-center gap-0.5">
          <Smartphone className="w-3 h-3" />
          PWA
        </span>
      )}
      {welcomeOffer && (
        <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-100 text-indigo-700 rounded-full flex-shrink-0" title="Offre de bienvenue active">
          Bienvenue
        </span>
      )}
      {cagnotte && (
        <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-violet-100 text-violet-700 rounded-full flex-shrink-0" title="Mode cagnotte">
          Cagnotte
        </span>
      )}
      {pageRemplie && (
        <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-700 rounded-full flex-shrink-0 flex items-center gap-0.5" title="Vitrine en ligne remplie (services + photos + adresse)">
          <CheckCircle className="w-3 h-3" />
          Page
        </span>
      )}
      {contestEnabled && (
        <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700 rounded-full flex-shrink-0" title="Jeu concours mensuel actif">
          Concours
        </span>
      )}
    </>
  );
}

/** WhatsApp button with message dropdown */
function WhatsAppDropdown({
  merchant,
  lifecycle,
  customers,
  dropdownId,
  waDropdown,
  setWaDropdown,
  getMessages,
  getTutoMessages,
  onSend,
}: {
  merchant: Merchant;
  lifecycle: LifecycleStage;
  customers: number;
  dropdownId: string;
  waDropdown: string | null;
  setWaDropdown: (id: string | null) => void;
  getMessages: (merchant: Merchant, lifecycle: LifecycleStage, customers: number) => { label: string; text: string }[];
  getTutoMessages: (name: string) => { label: string; text: string }[];
  onSend: (phone: string, message: string) => void;
}) {
  const [tab, setTab] = useState<'marketing' | 'tuto'>('marketing');
  const msgs = tab === 'marketing'
    ? getMessages(merchant, lifecycle, customers)
    : getTutoMessages(merchant.shop_name);

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setWaDropdown(waDropdown === dropdownId ? null : dropdownId); }}
        className="p-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
        title="WhatsApp"
      >
        <MessageCircle className="w-4 h-4" />
      </button>
      {waDropdown === dropdownId && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setWaDropdown(null)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-80 bg-white rounded-xl border border-gray-200 shadow-xl p-2 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex gap-1 mb-2">
              <button
                onClick={(e) => { e.stopPropagation(); setTab('marketing'); }}
                className={cn("px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors", tab === 'marketing' ? "bg-green-600 text-white" : "bg-green-50 text-green-700 hover:bg-green-100")}
              >
                Marketing
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setTab('tuto'); }}
                className={cn("px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors", tab === 'tuto' ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100")}
              >
                Tuto
              </button>
            </div>
            <div className="space-y-1 max-h-72 overflow-y-auto">
              {msgs.map((msg, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); onSend(merchant.phone, msg.text); }}
                  className={cn("w-full text-left px-3 py-2 rounded-lg transition-colors group/wa", tab === 'marketing' ? "hover:bg-green-50" : "hover:bg-blue-50")}
                >
                  <span className={cn("text-xs font-semibold", tab === 'marketing' ? "text-green-700" : "text-blue-700")}>{msg.label}</span>
                  <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5 group-hover/wa:text-gray-700">{msg.text}</p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// --- Component ---

export default function AdminMerchantsPage() {
  const supabase = getSupabase();
  const [data, setData] = useState<MerchantsDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [countryFilter, setCountryFilter] = useState<'all' | MerchantCountry>('all');
  const [shopTypeFilter, setShopTypeFilter] = useState<'all' | ShopType>('all');
  const [showAdmins, setShowAdmins] = useState(false);
  const [pwaFilter, setPwaFilter] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'urgency' | 'clients' | 'health' | 'activity' | 'today'>('urgency');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/merchants-data');
      if (!res.ok) throw new Error('Fetch failed');
      const json: MerchantsDataResponse = await res.json();
      setData(json);
    } catch (error) {
      console.error('Error fetching merchants data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce ref for realtime (H6 — was re-fetching on every single change)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchData();

    // Realtime refresh on loyalty_cards changes — debounced 30s
    const channel = supabase
      .channel('loyalty_cards_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loyalty_cards' }, () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchData(), 30_000);
      })
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchData]);

  const superAdminIds = useMemo(() => new Set(data?.superAdminIds || []), [data]);

  // Helper
  const isTrialExpired = (m: Merchant) =>
    m.subscription_status === 'trial' && m.trial_ends_at && new Date(m.trial_ends_at) < new Date();

  // Stats
  const stats = useMemo(() => {
    if (!data) return { total: 0, trial: 0, trialExpired: 0, active: 0, canceling: 0, canceled: 0, adminCount: 0, deleted: 0 };
    const nonAdmin = data.merchants.filter((m) => !superAdminIds.has(m.user_id) && !m.deleted_at);
    return {
      total: nonAdmin.length,
      trial: nonAdmin.filter((m) => m.subscription_status === 'trial' && !isTrialExpired(m)).length,
      trialExpired: nonAdmin.filter((m) => isTrialExpired(m)).length,
      active: nonAdmin.filter((m) => m.subscription_status === 'active' || m.subscription_status === 'canceling' || m.subscription_status === 'past_due').length,
      canceling: nonAdmin.filter((m) => m.subscription_status === 'canceling').length,
      canceled: nonAdmin.filter((m) => m.subscription_status === 'canceled').length,
      adminCount: data.merchants.filter((m) => superAdminIds.has(m.user_id)).length,
      deleted: data.merchants.filter((m) => !!m.deleted_at).length,
    };
  }, [data, superAdminIds]);

  // Filtered & sorted merchants
  const sortedMerchants = useMemo(() => {
    if (!data) return [];
    let filtered = data.merchants;

    // Show deleted OR active
    if (showDeleted) {
      filtered = filtered.filter((m) => !!m.deleted_at);
    } else {
      filtered = filtered.filter((m) => !m.deleted_at);
    }

    // Hide admins
    if (!showAdmins) {
      filtered = filtered.filter((m) => !superAdminIds.has(m.user_id));
    }

    // Status filter
    if (statusFilter === 'trial') {
      filtered = filtered.filter((m) => m.subscription_status === 'trial' && !isTrialExpired(m));
    } else if (statusFilter === 'trial_expired') {
      filtered = filtered.filter((m) => isTrialExpired(m));
    } else if (statusFilter === 'active') {
      filtered = filtered.filter((m) => m.subscription_status === 'active' || m.subscription_status === 'canceling' || m.subscription_status === 'past_due');
    } else if (statusFilter !== 'all') {
      filtered = filtered.filter((m) => m.subscription_status === statusFilter);
    }

    // Country filter
    if (countryFilter !== 'all') {
      filtered = filtered.filter((m) => (m.country || 'FR') === countryFilter);
    }

    // Shop type filter
    if (shopTypeFilter !== 'all') {
      filtered = filtered.filter((m) => m.shop_type === shopTypeFilter);
    }

    // PWA filter
    if (pwaFilter) {
      filtered = filtered.filter((m) => !!m.pwa_installed_at);
    }

    // Search (accent-insensitive, email, local phone)
    if (searchQuery) {
      const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const q = normalize(searchQuery);
      // Convert local phone (06xxx) to E.164 (336xxx) for matching
      const phoneQ = q.replace(/\s/g, '');
      const phoneE164 = phoneQ.startsWith('0') ? '33' + phoneQ.substring(1) : phoneQ;
      filtered = filtered.filter(
        (m) =>
          normalize(m.shop_name).includes(q) ||
          m.phone.includes(phoneE164) ||
          (m.shop_address && normalize(m.shop_address).includes(q)) ||
          (data.userEmails[m.user_id] && normalize(data.userEmails[m.user_id]).includes(q)),
      );
    }

    // Sort by urgency ASC, then created_at DESC
    return filtered
      .map((m) => ({
        merchant: m,
        lifecycle: getLifecycleStage(
          m,
          data.lastVisitDates[m.id] || null,
          data.todayScans[m.id] || 0,
          m.reward_description !== null,
        ),
        isAdmin: superAdminIds.has(m.user_id),
        healthScore: computeHealthScore(
          m,
          data.customerCounts[m.id] || 0,
          data.weeklyScans[m.id] || 0,
          data.lastVisitDates[m.id] || null,
        ),
      }))
      .sort((a, b) => {
        if (sortBy === 'health') {
          if (a.healthScore !== b.healthScore) return b.healthScore - a.healthScore;
          return new Date(b.merchant.created_at).getTime() - new Date(a.merchant.created_at).getTime();
        }
        if (sortBy === 'clients') {
          const ca = data.customerCounts[a.merchant.id] || 0;
          const cb = data.customerCounts[b.merchant.id] || 0;
          if (ca !== cb) return cb - ca;
          return new Date(b.merchant.created_at).getTime() - new Date(a.merchant.created_at).getTime();
        }
        if (sortBy === 'activity') {
          const la = data.lastVisitDates[a.merchant.id] || '';
          const lb = data.lastVisitDates[b.merchant.id] || '';
          if (la && !lb) return -1;
          if (!la && lb) return 1;
          if (la !== lb) return lb.localeCompare(la);
          return new Date(b.merchant.created_at).getTime() - new Date(a.merchant.created_at).getTime();
        }
        if (sortBy === 'today') {
          const ta = data.todayScans[a.merchant.id] || 0;
          const tb = data.todayScans[b.merchant.id] || 0;
          if (ta !== tb) return tb - ta;
          return new Date(b.merchant.created_at).getTime() - new Date(a.merchant.created_at).getTime();
        }
        if (a.lifecycle.urgency !== b.lifecycle.urgency) return a.lifecycle.urgency - b.lifecycle.urgency;
        return new Date(b.merchant.created_at).getTime() - new Date(a.merchant.created_at).getTime();
      });
  }, [data, searchQuery, statusFilter, countryFilter, shopTypeFilter, pwaFilter, showAdmins, showDeleted, superAdminIds, sortBy]);

  const [waDropdown, setWaDropdown] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(50);

  // Reset pagination when filters change
  useEffect(() => { setDisplayCount(50); }, [searchQuery, statusFilter, countryFilter, shopTypeFilter, pwaFilter, showAdmins, showDeleted]);

  const displayedMerchants = useMemo(() => sortedMerchants.slice(0, displayCount), [sortedMerchants, displayCount]);

  const handleRestore = async (merchantId: string) => {
    setRestoringId(merchantId);
    try {
      const res = await fetch(`/api/admin/merchants/${merchantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore' }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Restore error:', err);
    } finally {
      setRestoringId(null);
    }
  };

  const RestoreButton = ({ merchantId }: { merchantId: string }) => (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRestore(merchantId); }}
      disabled={restoringId === merchantId}
      className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors text-xs font-medium flex items-center gap-1"
    >
      {restoringId === merchantId ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
      Restaurer
    </button>
  );

  function getWhatsAppMessages(merchant: Merchant, _lifecycle: LifecycleStage, _customers: number): { label: string; text: string }[] {
    const name = merchant.shop_name;
    return [
      { label: 'Premier contact', text: `Hello ${name} ! C'est ${ADMIN_CONTACT_NAME} de Qarte, comment tu gères tes réservations et ta fidélisation clients actuellement ?` },
      { label: 'Problématique', text: `Hello ${name} ! C'est ${ADMIN_CONTACT_NAME} de Qarte, qu'est-ce qui te prend le plus la tête au quotidien ? Les no-shows, les clientes qui reviennent pas, ou remplir les jours creux ?` },
      { label: 'Fidélisation', text: `Hello ${name} ! C'est ${ADMIN_CONTACT_NAME} de Qarte, t'as déjà un système pour faire revenir tes clientes ou c'est surtout du bouche-à-oreille pour l'instant ?` },
      { label: 'Visibilité', text: `Hello ${name} ! C'est ${ADMIN_CONTACT_NAME} de Qarte, comment tes nouvelles clientes te trouvent aujourd'hui ? Instagram, Google, recommandations ?` },
    ];
  }

  function getWhatsAppTutoMessages(name: string): { label: string; text: string }[] {
    return [
      { label: 'Comment ça marche', text: `Hello ${name} ! QR code en caisse → le client scanne → sa carte est créée. À chaque passage il rescanne, le tampon s'ajoute tout seul. Pas d'appli à télécharger 📱` },
      { label: 'L\'espace pro', text: `Hello ${name} ! Ton espace pro (getqarte.com → Espace Pro) : clients, tampons, stats, notifs. Tout depuis ton téléphone 📊` },
    ];
  }

  const openWhatsApp = (phone: string, message: string) => {
    const formattedPhone = formatPhoneForWhatsApp(phone);
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
    setWaDropdown(null);
  };

  const exportCSV = () => {
    if (!data || sortedMerchants.length === 0) return;
    const header = ['Nom', 'Email', 'Téléphone', 'Type', 'Étape', 'Statut', 'Clients', 'Santé', 'Source', 'Créé le'];
    const rows = sortedMerchants.map(({ merchant, lifecycle, healthScore }) => [
      merchant.shop_name,
      data.userEmails[merchant.user_id] || '',
      merchant.phone,
      merchant.shop_type,
      lifecycle.label,
      merchant.subscription_status,
      String(data.customerCounts[merchant.id] || 0),
      String(healthScore),
      merchant.signup_source || '',
      new Date(merchant.created_at).toLocaleDateString('fr-FR'),
    ]);
    const csv = [header, ...rows].map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `merchants-${statusFilter !== 'all' ? statusFilter : 'tous'}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#5167fc]" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-8 pt-10 lg:pt-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Commerçants</h1>
        <p className="mt-1 text-sm sm:text-base text-gray-600">Vue lifecycle — trié par urgence</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2 lg:grid-cols-6 lg:gap-3">
        {[
          { label: 'Total', value: stats.total, icon: Store, iconBg: 'bg-[#5167fc]/10', iconColor: 'text-[#5167fc]', extra: stats.adminCount > 0 ? `+${stats.adminCount} admin` : undefined },
          { label: 'En essai', value: stats.trial, icon: Clock, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
          { label: 'Expires', value: stats.trialExpired, icon: CalendarX, iconBg: 'bg-orange-50', iconColor: 'text-orange-600' },
          { label: 'Actifs', value: stats.active, icon: CheckCircle, iconBg: 'bg-green-50', iconColor: 'text-green-600' },
          { label: 'Annulation', value: stats.canceling, icon: AlertTriangle, iconBg: 'bg-purple-50', iconColor: 'text-purple-600' },
          { label: 'Churned', value: stats.canceled, icon: XCircle, iconBg: 'bg-red-50', iconColor: 'text-red-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white px-3 py-2 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2">
              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", stat.iconBg)}>
                <stat.icon className={cn("w-3.5 h-3.5", stat.iconColor)} />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 leading-tight">{stat.value}</p>
                <p className="text-[10px] text-gray-500">{stat.label}{stat.extra ? ` (${stat.extra})` : ''}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Row 1: Search + Status */}
        <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-row sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher nom, email, téléphone, adresse..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5167fc] focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 sm:flex-wrap -mx-4 px-4 sm:mx-0 sm:px-0">
            {([
              { label: 'Tous', value: 'all' as FilterStatus, count: stats.total },
              { label: 'Essai', value: 'trial' as FilterStatus, count: stats.trial },
              { label: 'Expirés', value: 'trial_expired' as FilterStatus, count: stats.trialExpired },
              { label: 'Abonnes', value: 'active' as FilterStatus, count: stats.active },
              { label: 'Annules', value: 'canceled' as FilterStatus, count: stats.canceled },
            ]).map((btn) => (
              <button
                key={btn.value}
                onClick={() => setStatusFilter(btn.value)}
                className={cn(
                  "px-3 py-2 text-xs sm:text-sm font-medium rounded-xl transition-colors whitespace-nowrap flex-shrink-0",
                  statusFilter === btn.value
                    ? "bg-[#5167fc] text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50",
                )}
              >
                {btn.label} ({btn.count})
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Shop type + Country + Admin */}
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 sm:flex-wrap -mx-4 px-4 sm:mx-0 sm:px-0">
          {([
            { label: 'Type', value: 'all' as const },
            ...Object.entries(SHOP_TYPES).map(([value, label]) => ({
              label: label.replace('Salon de ', '').replace(' / Nail bar', '').replace(' / Bien-être / Massage', ''),
              value: value as ShopType,
            })),
          ]).map((btn) => (
            <button
              key={btn.value}
              onClick={() => setShopTypeFilter(btn.value)}
              className={cn(
                "px-3 py-2 text-xs sm:text-sm font-medium rounded-xl transition-colors whitespace-nowrap flex-shrink-0",
                shopTypeFilter === btn.value
                  ? "bg-amber-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50",
              )}
            >
              {btn.label}
            </button>
          ))}
          <div className="w-px h-6 bg-gray-200 flex-shrink-0 hidden sm:block self-center" />
          {(['all', 'FR', 'BE', 'CH'] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCountryFilter(c)}
              className={cn(
                "px-3 py-2 text-xs sm:text-sm font-medium rounded-xl transition-colors whitespace-nowrap flex-shrink-0",
                countryFilter === c
                  ? "bg-violet-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50",
              )}
            >
              {c === 'all' ? 'Pays' : c}
            </button>
          ))}
          <button
            onClick={() => setPwaFilter(!pwaFilter)}
            className={cn(
              "px-3 py-2 text-xs sm:text-sm font-medium rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5 flex-shrink-0",
              pwaFilter
                ? "bg-green-600 text-white"
                : "bg-white text-green-600 border border-green-200 hover:bg-green-50",
            )}
          >
            <Smartphone className="w-3.5 h-3.5" />
            PWA installée
          </button>
          {stats.adminCount > 0 && (
            <button
              onClick={() => setShowAdmins(!showAdmins)}
              className={cn(
                "px-3 py-2 text-xs sm:text-sm font-medium rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5 flex-shrink-0",
                showAdmins
                  ? "bg-purple-600 text-white"
                  : "bg-white text-purple-600 border border-purple-200 hover:bg-purple-50",
              )}
            >
              <Shield className="w-3.5 h-3.5" />
              Admin
            </button>
          )}
          {stats.deleted > 0 && (
            <button
              onClick={() => setShowDeleted(!showDeleted)}
              className={cn(
                "px-3 py-2 text-xs sm:text-sm font-medium rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5 flex-shrink-0",
                showDeleted
                  ? "bg-red-600 text-white"
                  : "bg-white text-red-600 border border-red-200 hover:bg-red-50",
              )}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Supprimés ({stats.deleted})
            </button>
          )}
        </div>
      </div>

      {/* Results count + Export */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{sortedMerchants.length} commerçant{sortedMerchants.length > 1 ? 's' : ''}</p>
        {sortedMerchants.length > 0 && (
          <button
            onClick={exportCSV}
            className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        )}
      </div>

      {/* Table Desktop / Cards Mobile */}
      {sortedMerchants.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <Store className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="font-medium text-gray-900">Aucun commerçant trouvé</p>
          <p className="text-sm text-gray-500 mt-1">Essayez de modifier vos filtres</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Commercant</th>
                  <th className="text-left px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Etape</th>
                  <th className="text-center px-3 py-2 text-[11px] font-semibold uppercase tracking-wide">
                    <button
                      onClick={() => setSortBy(sortBy === 'activity' ? 'urgency' : 'activity')}
                      className={cn("inline-flex items-center gap-0.5 hover:text-gray-900 transition-colors", sortBy === 'activity' ? "text-[#5167fc]" : "text-gray-500")}
                    >
                      Activite
                      <ArrowUpDown className="w-2.5 h-2.5" />
                    </button>
                  </th>
                  <th className="text-center px-3 py-2 text-[11px] font-semibold uppercase tracking-wide">
                    <button
                      onClick={() => setSortBy(sortBy === 'today' ? 'urgency' : 'today')}
                      className={cn("inline-flex items-center gap-0.5 hover:text-gray-900 transition-colors", sortBy === 'today' ? "text-[#5167fc]" : "text-gray-500")}
                    >
                      Auj.
                      <ArrowUpDown className="w-2.5 h-2.5" />
                    </button>
                  </th>
                  <th className="text-center px-3 py-2 text-[11px] font-semibold uppercase tracking-wide">
                    <button
                      onClick={() => setSortBy(sortBy === 'clients' ? 'urgency' : 'clients')}
                      className={cn("inline-flex items-center gap-0.5 hover:text-gray-900 transition-colors", sortBy === 'clients' ? "text-[#5167fc]" : "text-gray-500")}
                    >
                      Clients
                      <ArrowUpDown className="w-2.5 h-2.5" />
                    </button>
                  </th>
                  <th className="text-center px-3 py-2 text-[11px] font-semibold uppercase tracking-wide">
                    <button
                      onClick={() => setSortBy(sortBy === 'health' ? 'urgency' : 'health')}
                      className={cn("inline-flex items-center gap-0.5 hover:text-gray-900 transition-colors", sortBy === 'health' ? "text-[#5167fc]" : "text-gray-500")}
                    >
                      Sante
                      <ArrowUpDown className="w-2.5 h-2.5" />
                    </button>
                  </th>
                  <th className="text-right px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wide"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayedMerchants.map(({ merchant, lifecycle, isAdmin, healthScore }) => {
                  const lastVisit = data?.lastVisitDates[merchant.id] || null;
                  const activity = getActivityLabel(lastVisit);
                  const today = data?.todayScans[merchant.id] || 0;
                  const customers = data?.customerCounts[merchant.id] || 0;
                  const pending = data?.pendingPoints[merchant.id] || 0;
                  const pendingDeposits = data?.pendingDepositsCounts?.[merchant.id] || 0;
                  return (
                    <tr key={merchant.id} onClick={() => !showDeleted && window.open(`/admin/merchants/${merchant.id}`, '_blank')} className={cn("hover:bg-gray-50/50 transition-colors group", !showDeleted && "cursor-pointer")}>
                      {/* Commercant */}
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#5167fc] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                            {merchant.shop_name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-medium text-gray-900 truncate max-w-[180px] text-sm">{merchant.shop_name}</p>
                              <MerchantBadges isAdmin={isAdmin} noContact={merchant.no_contact} pending={pending} pendingDeposits={pendingDeposits} pwaInstalled={!!merchant.pwa_installed_at} welcomeOffer={!!merchant.welcome_offer_enabled} cagnotte={merchant.loyalty_mode === 'cagnotte'} pageRemplie={!!(data?.servicesCounts[merchant.id] && data?.photosCounts[merchant.id] && merchant.shop_address)} planningEnabled={!!merchant.planning_enabled} resaEnLigne={!!merchant.auto_booking_enabled} bookingMode={merchant.booking_mode || null} contestEnabled={!!merchant.contest_enabled} />
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-gray-400">
                              {data?.userEmails[merchant.user_id] && (
                                <span className="truncate max-w-[160px]">{data.userEmails[merchant.user_id]}</span>
                              )}
                              <span className="truncate">{SHOP_TYPES[merchant.shop_type]?.replace('Salon de ', '').replace(' / Nail bar', '').replace(' / Bien-être / Massage', '') || merchant.shop_type}</span>
                              {merchant.signup_source && (
                                <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 font-medium">{merchant.signup_source}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Etape */}
                      <td className="px-3 py-2">
                        <span className={cn("px-2 py-0.5 text-[11px] font-semibold rounded-full", lifecycle.bgColor, lifecycle.color)}>
                          {lifecycle.label}
                        </span>
                      </td>

                      {/* Activite */}
                      <td className="px-3 py-2 text-center">
                        <span className={cn("text-xs font-medium", activity.color)}>{activity.text}</span>
                      </td>

                      {/* Scans aujourd'hui */}
                      <td className="px-3 py-2 text-center">
                        <span className={cn(
                          "text-xs font-bold",
                          today > 0 ? "text-green-600" : "text-gray-300",
                        )}>
                          {today}
                        </span>
                      </td>

                      {/* Clients */}
                      <td className="px-3 py-2 text-center">
                        <span className="text-xs font-medium text-gray-700">{customers}</span>
                      </td>

                      {/* Sante */}
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <HealthDot score={healthScore} />
                          <span className="text-[11px] font-medium text-gray-500">{healthScore}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-1 relative">
                          {merchant.phone && !isAdmin && !merchant.no_contact && (
                            <WhatsAppDropdown
                              merchant={merchant}
                              lifecycle={lifecycle}
                              customers={customers}
                              dropdownId={merchant.id}
                              waDropdown={waDropdown}
                              setWaDropdown={setWaDropdown}
                              getMessages={getWhatsAppMessages}
                              getTutoMessages={getWhatsAppTutoMessages}
                              onSend={openWhatsApp}
                            />
                          )}
                          {showDeleted ? (
                            <RestoreButton merchantId={merchant.id} />
                          ) : (
                            <span
                              className="p-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                              title="Détail"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-1.5">
            {displayedMerchants.map(({ merchant, lifecycle, isAdmin, healthScore }) => {
              const lastVisit = data?.lastVisitDates[merchant.id] || null;
              const activity = getActivityLabel(lastVisit);
              const today = data?.todayScans[merchant.id] || 0;
              const customers = data?.customerCounts[merchant.id] || 0;
              const pending = data?.pendingPoints[merchant.id] || 0;
              const pendingDeposits = data?.pendingDepositsCounts?.[merchant.id] || 0;
              return (
                <div key={merchant.id} onClick={() => !showDeleted && window.open(`/admin/merchants/${merchant.id}`, '_blank')} className={cn("bg-white rounded-xl border border-gray-100 shadow-sm px-3 py-2", !showDeleted && "cursor-pointer")}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#5167fc] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                        {merchant.shop_name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-gray-900 truncate text-sm">{merchant.shop_name}</p>
                          <MerchantBadges isAdmin={isAdmin} noContact={merchant.no_contact} pending={pending} pendingDeposits={pendingDeposits} pwaInstalled={!!merchant.pwa_installed_at} welcomeOffer={!!merchant.welcome_offer_enabled} cagnotte={merchant.loyalty_mode === 'cagnotte'} pageRemplie={!!(data?.servicesCounts[merchant.id] && data?.photosCounts[merchant.id] && merchant.shop_address)} planningEnabled={!!merchant.planning_enabled} resaEnLigne={!!merchant.auto_booking_enabled} bookingMode={merchant.booking_mode || null} contestEnabled={!!merchant.contest_enabled} />
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={cn("px-1.5 py-0.5 text-[10px] font-semibold rounded-full", lifecycle.bgColor, lifecycle.color)}>
                            {lifecycle.label}
                          </span>
                          <span className={cn("text-[11px] font-medium", activity.color)}>{activity.text}</span>
                          <span className={cn("text-[11px] font-bold", today > 0 ? "text-green-600" : "text-gray-300")}>
                            {today} auj
                          </span>
                          <span className="text-[11px] text-gray-400">
                            <Users className="w-3 h-3 inline mr-0.5" />{customers}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {merchant.phone && !isAdmin && !merchant.no_contact && (
                        <WhatsAppDropdown
                          merchant={merchant}
                          lifecycle={lifecycle}
                          customers={customers}
                          dropdownId={`m-${merchant.id}`}
                          waDropdown={waDropdown}
                          setWaDropdown={setWaDropdown}
                          getMessages={getWhatsAppMessages}
                          getTutoMessages={getWhatsAppTutoMessages}
                          onSend={openWhatsApp}
                        />
                      )}
                      {showDeleted ? (
                        <RestoreButton merchantId={merchant.id} />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load more button (H18) */}
          {sortedMerchants.length > displayCount && (
            <div className="flex justify-center mt-4">
              <button
                onClick={() => setDisplayCount(prev => prev + 50)}
                className="px-6 py-2.5 text-sm font-semibold text-[#5167fc] bg-[#5167fc]/5 hover:bg-[#5167fc]/10 rounded-xl border border-[#5167fc]/10 transition-colors"
              >
                Charger plus ({sortedMerchants.length - displayCount} restant{sortedMerchants.length - displayCount > 1 ? 's' : ''})
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
