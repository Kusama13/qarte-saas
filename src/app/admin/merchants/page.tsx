'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
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

function formatPhoneForWhatsApp(phone: string) {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) return '33' + cleaned.substring(1);
  return cleaned;
}

// --- Shared Sub-Components ---

/** Badges shown next to merchant name (Admin, No-Contact, Pending points) */
function MerchantBadges({ isAdmin, noContact, pending, pwaInstalled }: { isAdmin: boolean; noContact: boolean | null; pending: number; pwaInstalled: boolean }) {
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
      {pwaInstalled && (
        <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-green-100 text-green-700 rounded-full flex-shrink-0 flex items-center gap-0.5">
          <Smartphone className="w-3 h-3" />
          PWA
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
  const router = useRouter();
  const supabase = getSupabase();
  const [data, setData] = useState<MerchantsDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [countryFilter, setCountryFilter] = useState<'all' | MerchantCountry>('all');
  const [shopTypeFilter, setShopTypeFilter] = useState<'all' | ShopType>('all');
  const [showAdmins, setShowAdmins] = useState(false);
  const [pwaFilter, setPwaFilter] = useState(false);
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
    if (!data) return { total: 0, trial: 0, trialExpired: 0, active: 0, canceling: 0, canceled: 0, adminCount: 0 };
    const nonAdmin = data.merchants.filter((m) => !superAdminIds.has(m.user_id));
    return {
      total: nonAdmin.length,
      trial: nonAdmin.filter((m) => m.subscription_status === 'trial' && !isTrialExpired(m)).length,
      trialExpired: nonAdmin.filter((m) => isTrialExpired(m)).length,
      active: nonAdmin.filter((m) => m.subscription_status === 'active').length,
      canceling: nonAdmin.filter((m) => m.subscription_status === 'canceling').length,
      canceled: nonAdmin.filter((m) => m.subscription_status === 'canceled').length,
      adminCount: data.merchants.filter((m) => superAdminIds.has(m.user_id)).length,
    };
  }, [data, superAdminIds]);

  // Filtered & sorted merchants
  const sortedMerchants = useMemo(() => {
    if (!data) return [];
    let filtered = data.merchants;

    // Hide admins
    if (!showAdmins) {
      filtered = filtered.filter((m) => !superAdminIds.has(m.user_id));
    }

    // Status filter
    if (statusFilter === 'trial') {
      filtered = filtered.filter((m) => m.subscription_status === 'trial' && !isTrialExpired(m));
    } else if (statusFilter === 'trial_expired') {
      filtered = filtered.filter((m) => isTrialExpired(m));
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
  }, [data, searchQuery, statusFilter, countryFilter, shopTypeFilter, pwaFilter, showAdmins, superAdminIds, sortBy]);

  const [waDropdown, setWaDropdown] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(50);

  // Reset pagination when filters change
  useEffect(() => { setDisplayCount(50); }, [searchQuery, statusFilter, countryFilter, shopTypeFilter, pwaFilter, showAdmins]);

  const displayedMerchants = useMemo(() => sortedMerchants.slice(0, displayCount), [sortedMerchants, displayCount]);

  function getWhatsAppMessages(merchant: Merchant, lifecycle: LifecycleStage, customers: number): { label: string; text: string }[] {
    const name = merchant.shop_name;
    const msgs: { label: string; text: string }[] = [];
    const l = lifecycle.label.toLowerCase();

    if (l.includes('config programme')) {
      msgs.push({ label: 'Aide config', text: `Hello ${name} ! C'est ${ADMIN_CONTACT_NAME} de Qarte. J'ai vu que votre programme n'etait pas encore finalise — on s'en occupe ensemble ? Ca prend 30 secondes, promis 😊` });
      msgs.push({ label: 'Relance douce', text: `Hello ${name} ! ${ADMIN_CONTACT_NAME} de Qarte. Votre compte est pret, il manque juste la recompense pour vos clients. Dites-moi ce que vous offrez d'habitude et je configure tout pour vous !` });
    } else if (l.includes('1er scan')) {
      msgs.push({ label: '1er scan', text: `Hello ${name} ! C'est ${ADMIN_CONTACT_NAME} de Qarte. Votre carte est prete ! Testez-la : scannez votre QR code, c'est 10 secondes et vous verrez exactement ce que vos clients voient 😊` });
      msgs.push({ label: 'Premier pas', text: `Hello ${name} ! ${ADMIN_CONTACT_NAME} de Qarte. Votre carte est superbe ! L'astuce : montrez le QR code a vos 3 prochains clients au moment de payer. C'est tout, on s'occupe du reste 😍` });
    } else if (l.includes('essai j-')) {
      msgs.push({ label: 'Fin essai', text: `Hello ${name} ! C'est ${ADMIN_CONTACT_NAME}. Votre essai Qarte se termine bientot${customers > 0 ? ` et vos ${customers} clients comptent sur leur carte` : ''}. Avec le code QARTE50 c'est 9€ au lieu de 19€ le premier mois. On continue ensemble ? 😊` });
      msgs.push({ label: 'Accompagnement', text: `Hello ${name} ! ${ADMIN_CONTACT_NAME} de Qarte. Comment ca se passe ? Des questions avant la fin de l'essai ? Je suis la, on peut meme s'appeler 2 min si vous voulez 📞` });
    } else if (l.includes('expiré')) {
      msgs.push({ label: 'Relance expiree', text: `Hello ${name} ! C'est ${ADMIN_CONTACT_NAME} de Qarte. Votre essai est termine mais rien n'est perdu ! ${customers > 0 ? `Vos ${customers} clients gardent leur carte. ` : ''}Le code QARTE50 vous offre le premier mois a 9€. On relance ? 😊` });
      msgs.push({ label: 'Question ouverte', text: `Hello ${name} ! ${ADMIN_CONTACT_NAME} de Qarte. Est-ce qu'il y a eu un truc qui a coince pendant l'essai ? Vos retours m'aident beaucoup — et je peux surement debloquer ca 🙏` });
    } else if (l.includes('inactif')) {
      msgs.push({ label: 'Prise de nouvelles', text: `Hello ${name} ! C'est ${ADMIN_CONTACT_NAME} de Qarte. Je prends des nouvelles — comment ca se passe au salon ? Un coup de main avec Qarte ? Je suis dispo 😊` });
      msgs.push({ label: 'Challenge', text: `Hello ${name} ! ${ADMIN_CONTACT_NAME} de Qarte. Petit defi : montrez votre QR code a 5 clients aujourd'hui. Vous allez voir, la reaction c'est toujours la meme : "ah trop bien !" 😄` });
    } else if (l.includes('annulation')) {
      msgs.push({ label: 'Retention', text: `Hello ${name} ! C'est ${ADMIN_CONTACT_NAME} de Qarte. J'ai vu pour l'annulation — aucun souci ! Qu'est-ce qui vous a manque ? Vos retours m'aident vraiment a ameliorer Qarte 🙏` });
    } else if (l === 'actif') {
      msgs.push({ label: 'Suivi', text: `Hello ${name} ! C'est ${ADMIN_CONTACT_NAME} de Qarte. Comment ca se passe avec la carte ? Vos clients sont contents ? Si vous avez des idees, je suis toute ouie 😊` });
      if (customers >= 5) {
        msgs.push({ label: 'Bravo', text: `Hello ${name} ! C'est ${ADMIN_CONTACT_NAME} de Qarte. Bravo, deja ${customers} clients sur votre carte ! Vous savez que vous pouvez leur envoyer des notifications pour les faire revenir ? Je vous montre si vous voulez 🚀` });
      }
      msgs.push({ label: 'Affichage QR', text: `Hello ${name} ! ${ADMIN_CONTACT_NAME} de Qarte. L'astuce qui change tout : collez le QR code pres de la caisse. Les clients le scannent tout seuls — vous n'avez plus rien a faire 📱` });
    }

    // Messages contextuels
    const hasSocial = merchant.instagram_url || merchant.facebook_url || merchant.tiktok_url;
    if (!hasSocial) {
      msgs.push({ label: 'Reseaux manquants', text: `Hello ${name} ! ${ADMIN_CONTACT_NAME} de Qarte. Ajoutez votre lien Instagram (ou Facebook/TikTok) dans dashboard → Mon Programme → Liens & Reseaux. Vos clients le verront sur leur carte — c'est de la visibilite gratuite ! 📲` });
    }
    if (!merchant.review_link) {
      msgs.push({ label: 'Avis Google', text: `Hello ${name} ! ${ADMIN_CONTACT_NAME} de Qarte. Ajoutez votre lien Google dans dashboard → Mon Programme → Avis Google. Vos clients verront un bouton "Laisser un avis" juste apres leur passage — c'est le meilleur moment ! ⭐` });
    }
    if (!merchant.logo_url) {
      msgs.push({ label: 'Logo manquant', text: `Hello ${name} ! ${ADMIN_CONTACT_NAME} de Qarte. Ajoutez votre logo dans dashboard → Mon Programme. Ca rend la carte encore plus pro et vos clients la reconnaissent tout de suite 🎨` });
    }
    if (!merchant.booking_url) {
      msgs.push({ label: 'Reservation', text: `Hello ${name} ! ${ADMIN_CONTACT_NAME} de Qarte. Vous pouvez ajouter votre lien de reservation dans dashboard → Mon Programme → Liens & Reseaux. Vos clients auront un bouton "Reserver" directement sur leur carte 📅` });
    }
    if (merchant.referral_program_enabled === false) {
      msgs.push({ label: 'Parrainage', text: `Hello ${name} ! ${ADMIN_CONTACT_NAME} de Qarte. Vous connaissez le parrainage ? Chaque client peut inviter un ami — les deux recoivent un cadeau. Ca s'active en 1 clic dans dashboard → Parrainage. C'est de l'acquisition gratuite ! 🤝` });
    }
    const pending = data?.pendingPoints[merchant.id] || 0;
    if (pending > 0) {
      msgs.push({ label: `${pending} en attente`, text: `Hello ${name} ! ${ADMIN_CONTACT_NAME} de Qarte. Vous avez ${pending} passage${pending > 1 ? 's' : ''} en attente dans dashboard → Clients. C'est le Qarte Shield : quand un client scanne 2 fois le meme jour, on met le 2eme en attente. Un clic pour valider ou refuser ! ✅` });
    }

    msgs.push({ label: 'Message libre', text: `Hello ${name} ! C'est ${ADMIN_CONTACT_NAME} de Qarte. ` });
    return msgs;
  }

  function getWhatsAppTutoMessages(name: string): { label: string; text: string }[] {
    return [
      { label: 'Comment ca marche', text: `Hello ${name} ! La carte de fidelite c'est simple : vous affichez le QR code en caisse, le client le scanne, il entre son prenom et numero — et hop sa carte est creee ! A chaque passage il rescanne et le tampon s'ajoute tout seul. Pas d'appli a telecharger 📱` },
      { label: 'La recompense', text: `Hello ${name} ! Quand un client atteint le bon nombre de tampons, sa recompense apparait sur sa carte. Il vous la montre, vous la validez ensemble, et son compteur repart a zero. On gere tout ! 🎁` },
      { label: 'Le dashboard', text: `Hello ${name} ! Votre dashboard (getqarte.com → Espace Pro) c'est votre tableau de bord : clients, tampons, stats, notifications. Tout se gere depuis la, meme sur mobile 📊` },
      { label: 'Les notifications', text: `Hello ${name} ! Vous pouvez envoyer des notifs push a vos clients depuis dashboard → Notifications. Il y a aussi des messages automatiques (anniversaire, offres…). Vos clients les recoivent direct sur leur telephone 🔔` },
      { label: 'Les offres', text: `Hello ${name} ! Pour remplir un creneau calme : dashboard → Notifications → Envoyer. Vous choisissez un message, une duree, et hop vos clients recoivent la notif. Top pour booster un jour creux 🎉` },
      { label: 'Le parrainage', text: `Hello ${name} ! Chaque client a un lien de parrainage sur sa carte. Quand un ami s'inscrit via ce lien, les deux recoivent un cadeau. Ca se configure dans dashboard → Parrainage 🤝` },
      { label: 'Le kit promo', text: `Hello ${name} ! On vous a envoye par email un kit avec votre QR code HD + des visuels prets pour Instagram. Vous le retrouvez aussi dans dashboard → QR code & Supports 🖼️` },
      { label: 'Personnaliser', text: `Hello ${name} ! Logo, couleur, recompense, nombre de tampons — tout se personnalise dans dashboard → Mon Programme. Vos clients voient les changements en temps reel 🎨` },
      { label: 'Reseaux sociaux', text: `Hello ${name} ! Ajoutez vos liens Instagram, Facebook ou TikTok dans dashboard → Mon Programme → Liens & Reseaux. Vos clients les verront sur leur carte — de la visibilite gratuite 📲` },
      { label: 'Le Shield', text: `Hello ${name} ! Quand un client scanne 2 fois le meme jour, le 2eme passage est mis en attente — c'est le Qarte Shield. Vous le retrouvez dans dashboard → Clients, un clic pour valider ou refuser ✅` },
      { label: 'Avis Google', text: `Hello ${name} ! Ajoutez votre lien Google dans dashboard → Mon Programme → Avis Google. Vos clients verront un bouton "Laisser un avis" sur leur carte, juste apres leur passage. Le timing parfait ! ⭐` },
      { label: "L'abonnement", text: `Hello ${name} ! Qarte c'est 19€/mois sans engagement, clients illimites. Vous gerez tout depuis dashboard → Abonnement 💳` },
    ];
  }

  const openWhatsApp = (phone: string, message: string) => {
    const formattedPhone = formatPhoneForWhatsApp(phone);
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
    setWaDropdown(null);
  };

  const exportCSV = () => {
    if (!data || sortedMerchants.length === 0) return;
    const header = ['Nom', 'Email', 'Téléphone', 'Type', 'Étape', 'Statut', 'Clients', 'Santé', 'Créé le'];
    const rows = sortedMerchants.map(({ merchant, lifecycle, healthScore }) => [
      merchant.shop_name,
      data.userEmails[merchant.user_id] || '',
      merchant.phone,
      merchant.shop_type,
      lifecycle.label,
      merchant.subscription_status,
      String(data.customerCounts[merchant.id] || 0),
      String(healthScore),
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
      <div className="grid grid-cols-3 gap-3 lg:grid-cols-6 lg:gap-4">
        {[
          { label: 'Total', value: stats.total, icon: Store, iconBg: 'bg-[#5167fc]/10', iconColor: 'text-[#5167fc]', extra: stats.adminCount > 0 ? `+${stats.adminCount} admin` : undefined },
          { label: 'En essai', value: stats.trial, icon: Clock, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
          { label: 'Expirés', value: stats.trialExpired, icon: CalendarX, iconBg: 'bg-orange-50', iconColor: 'text-orange-600' },
          { label: 'Actifs', value: stats.active, icon: CheckCircle, iconBg: 'bg-green-50', iconColor: 'text-green-600' },
          { label: 'Annulation', value: stats.canceling, icon: AlertTriangle, iconBg: 'bg-purple-50', iconColor: 'text-purple-600' },
          { label: 'Churned', value: stats.canceled, icon: XCircle, iconBg: 'bg-red-50', iconColor: 'text-red-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-3 sm:p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={cn("w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center", stat.iconBg)}>
                <stat.icon className={cn("w-4 h-4 sm:w-5 sm:h-5", stat.iconColor)} />
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-[10px] sm:text-xs text-gray-500">{stat.label}</p>
                {stat.extra && <p className="text-[10px] text-purple-600">{stat.extra}</p>}
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
              { label: 'Actifs', value: 'active' as FilterStatus, count: stats.active },
              { label: 'Annulation', value: 'canceling' as FilterStatus, count: stats.canceling },
              { label: 'Churned', value: 'canceled' as FilterStatus, count: stats.canceled },
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
          {(['all', 'FR', 'BE', 'CH', 'LU'] as const).map((c) => (
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
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Commerçant</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Étape</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                    <button
                      onClick={() => setSortBy(sortBy === 'activity' ? 'urgency' : 'activity')}
                      className={cn("inline-flex items-center gap-1 hover:text-gray-900 transition-colors", sortBy === 'activity' ? "text-[#5167fc]" : "text-gray-500")}
                    >
                      Activité
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                    <button
                      onClick={() => setSortBy(sortBy === 'today' ? 'urgency' : 'today')}
                      className={cn("inline-flex items-center gap-1 hover:text-gray-900 transition-colors", sortBy === 'today' ? "text-[#5167fc]" : "text-gray-500")}
                    >
                      Auj.
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                    <button
                      onClick={() => setSortBy(sortBy === 'clients' ? 'urgency' : 'clients')}
                      className={cn("inline-flex items-center gap-1 hover:text-gray-900 transition-colors", sortBy === 'clients' ? "text-[#5167fc]" : "text-gray-500")}
                    >
                      Clients
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>

                  <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                    <button
                      onClick={() => setSortBy(sortBy === 'health' ? 'urgency' : 'health')}
                      className={cn("inline-flex items-center gap-1 hover:text-gray-900 transition-colors", sortBy === 'health' ? "text-[#5167fc]" : "text-gray-500")}
                    >
                      Sante
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayedMerchants.map(({ merchant, lifecycle, isAdmin, healthScore }) => {
                  const lastVisit = data?.lastVisitDates[merchant.id] || null;
                  const activity = getActivityLabel(lastVisit);
                  const today = data?.todayScans[merchant.id] || 0;
                  const customers = data?.customerCounts[merchant.id] || 0;
                  const pending = data?.pendingPoints[merchant.id] || 0;
                  return (
                    <tr key={merchant.id} onClick={() => router.push(`/admin/merchants/${merchant.id}`)} className="hover:bg-gray-50/50 transition-colors group cursor-pointer">
                      {/* Commercant */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-[#5167fc] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {merchant.shop_name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900 truncate max-w-[200px]">{merchant.shop_name}</p>
                              <MerchantBadges isAdmin={isAdmin} noContact={merchant.no_contact} pending={pending} pwaInstalled={!!merchant.pwa_installed_at} />
                            </div>
                            {merchant.shop_address && (
                              <p className="text-xs text-gray-400 truncate max-w-[250px]">{merchant.shop_address}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Etape */}
                      <td className="px-4 py-3">
                        <span className={cn("px-2.5 py-1 text-xs font-semibold rounded-full", lifecycle.bgColor, lifecycle.color)}>
                          {lifecycle.label}
                        </span>
                      </td>

                      {/* Activite */}
                      <td className="px-4 py-3 text-center">
                        <span className={cn("text-sm font-medium", activity.color)}>{activity.text}</span>
                      </td>

                      {/* Scans aujourd'hui */}
                      <td className="px-4 py-3 text-center">
                        <span className={cn(
                          "text-sm font-bold",
                          today > 0 ? "text-green-600" : "text-gray-300",
                        )}>
                          {today}
                        </span>
                      </td>

                      {/* Clients */}
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-medium text-gray-700">{customers}</span>
                      </td>

                      {/* Sante */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <HealthDot score={healthScore} />
                          <span className="text-xs font-medium text-gray-500">{healthScore}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5 relative">
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
                          <span
                            className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                            title="Détail"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-2">
            {displayedMerchants.map(({ merchant, lifecycle, isAdmin, healthScore }) => {
              const lastVisit = data?.lastVisitDates[merchant.id] || null;
              const activity = getActivityLabel(lastVisit);
              const today = data?.todayScans[merchant.id] || 0;
              const customers = data?.customerCounts[merchant.id] || 0;
              const pending = data?.pendingPoints[merchant.id] || 0;
              return (
                <div key={merchant.id} onClick={() => router.push(`/admin/merchants/${merchant.id}`)} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 cursor-pointer">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-[#5167fc] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {merchant.shop_name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 truncate">{merchant.shop_name}</p>
                          <MerchantBadges isAdmin={isAdmin} noContact={merchant.no_contact} pending={pending} pwaInstalled={!!merchant.pwa_installed_at} />
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={cn("px-2 py-0.5 text-[10px] font-semibold rounded-full", lifecycle.bgColor, lifecycle.color)}>
                            {lifecycle.label}
                          </span>
                          <span className={cn("text-xs font-medium", activity.color)}>{activity.text}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
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
                      <span
                        className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>

                  {/* Bottom row: metrics */}
                  <div className="flex items-center gap-4 mt-2 pl-12 text-xs text-gray-500">
                    <span className={cn("font-medium", today > 0 ? "text-green-600" : "text-gray-400")}>
                      Auj: {today}
                    </span>
                    <span>
                      <Users className="w-3 h-3 inline mr-0.5" />{customers}
                    </span>
                    <span className="flex items-center gap-1">
                      <HealthDot score={healthScore} />
                      <span className="text-xs text-gray-400">{healthScore}</span>
                    </span>
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
