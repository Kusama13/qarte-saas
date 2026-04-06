'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import {
  ArrowLeft,
  Store,
  Phone,
  Calendar,
  Gift,
  Cake,
  Users,
  Clock,
  TrendingUp,
  MapPin,
  Bell,
  Send,
  Tag,
  QrCode,
  Copy,
  Check,
  Mail,
  MessageCircle,
  AlertTriangle,
  PhoneCall,
  ExternalLink,
  Star,
  Share2,
  ListChecks,
  Shield,
  ChevronDown,
  Ban,
  StickyNote,
  Smartphone,
  Loader2 as Loader2Icon,
  Zap,
  Wallet,
  Image,
  Scissors,
  UserPlus,
  Globe,
  CalendarDays,
  FileText,
  CreditCard,
  Hourglass,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { cn, generateQRCode, getScanUrl, formatDoubleDays, formatPhoneForWhatsApp, COUNTRY_FLAGS } from '@/lib/utils';
import { SHOP_TYPES } from '@/types';
import type { Merchant as BaseMerchant, ShopType, MerchantCountry } from '@/types';

// Extend canonical Merchant with admin-specific fields from offers
interface Merchant extends BaseMerchant {
  offer_active: boolean;
  offer_title: string | null;
  offer_description: string | null;
  offer_expires_at: string | null;
  offer_created_at: string | null;
}

interface Stats {
  totalCustomers: number;
  activeCustomers: number;
  totalVisits: number;
  totalRedemptions: number;
  pushSubscribers: number;
  pushSent: number;
  smsSent: number;
  pendingPoints: number;
  weeklyScans: number;
  lastVisitDate: string | null;
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  servicesCount: number;
  photosCount: number;
  welcomeVouchers: number;
  offerVouchers: number;
  planningSlotsCount: number;
  planningBookingsCount: number;
  pendingDepositsCount: number;
}

interface MemberProgram {
  id: string;
  name: string;
  benefit_label: string;
  duration_months: number;
  is_active: boolean;
  created_at: string;
  member_cards: { count: number }[];
}

// --- Helpers ---

function extractPseudo(url: string | null): string | null {
  if (!url || !url.trim()) return null;
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    if (u.hostname.includes('facebook') && u.searchParams.get('id')) {
      return u.searchParams.get('id');
    }
    const last = parts[parts.length - 1] || '';
    return last.replace(/^@/, '') || null;
  } catch {
    return url.replace(/^@/, '').trim() || null;
  }
}

function computeHealthScore(
  merchant: Merchant,
  totalCustomers: number,
  weeklyScans: number,
  lastVisitDate: string | null,
): number {
  let score = 0;
  if (merchant.reward_description) score += 15;
  if (merchant.logo_url) score += 10;
  if (merchant.instagram_url || merchant.facebook_url || merchant.tiktok_url || merchant.snapchat_url) score += 5;
  if (merchant.review_link) score += 5;
  if (merchant.booking_url) score += 5;
  if (totalCustomers >= 21) score += 20;
  else if (totalCustomers >= 6) score += 15;
  else if (totalCustomers >= 1) score += 10;
  if (weeklyScans > 0) score += 15;
  if (lastVisitDate) {
    const daysSince = Math.floor((Date.now() - new Date(lastVisitDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince < 7) score += 10;
    else if (daysSince < 14) score += 5;
  }
  if (merchant.referral_program_enabled) score += 5;
  if (merchant.shield_enabled) score += 5;
  if (merchant.tier2_enabled) score += 5;
  if (merchant.welcome_offer_enabled) score += 5;
  if (merchant.birthday_gift_enabled) score += 3;
  if (merchant.double_days_enabled) score += 2;
  return Math.min(score, 100);
}

function HealthDot({ score }: { score: number }) {
  const color =
    score >= 81 ? 'bg-green-500' :
    score >= 61 ? 'bg-lime-500' :
    score >= 31 ? 'bg-orange-400' :
    'bg-red-500';
  const label =
    score >= 81 ? 'Excellent' :
    score >= 61 ? 'Bon' :
    score >= 31 ? 'Moyen' :
    'Faible';
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('inline-block w-2.5 h-2.5 rounded-full', color)} />
      <span className="text-sm font-medium text-gray-600">{score}/100</span>
      <span className="text-xs text-gray-400">({label})</span>
    </span>
  );
}

function StatCard({ icon, value, label, highlight }: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  highlight?: 'amber' | 'green' | 'red';
}) {
  return (
    <div className={cn(
      "p-4 rounded-xl border",
      highlight === 'amber' ? "bg-amber-50 border-amber-200" :
      highlight === 'green' ? "bg-green-50 border-green-200" :
      highlight === 'red' ? "bg-red-50 border-red-200" :
      "bg-white border-gray-100 shadow-sm"
    )}>
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className={cn(
            "text-xl font-bold",
            highlight === 'amber' ? "text-amber-700" :
            highlight === 'green' ? "text-green-700" :
            highlight === 'red' ? "text-red-700" :
            "text-gray-900"
          )}>{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ icon, children, badge }: { icon: React.ReactNode; children: React.ReactNode; badge?: React.ReactNode }) {
  return (
    <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
      {icon}
      {children}
      {badge}
    </h3>
  );
}

function FeatureBadge({ active, icon, label }: { active: boolean; icon: React.ReactNode; label: string }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full",
      active ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-50 text-gray-400 border border-gray-200"
    )}>
      {icon}
      {label}
    </span>
  );
}

// --- WhatsApp message templates ---

function getWhatsAppMarketing(name: string, customers: number): { label: string; text: string }[] {
  return [
    { label: 'Bienvenue', text: `Bienvenue sur Qarte ${name} ! En resume :\n\n→ Tes clients ne perdent plus leur carte de fidelite\n→ T'as une vitrine en ligne prete pour tes reseaux\n→ Tes clients reviennent grace aux notifs et au parrainage\n→ Tu remplis ton planning les jours calmes\n\nTout est dans ton espace pro. Je suis Elodie, je t'accompagne 😊` },
    { label: 'Presentation', text: `Hello ${name} ! C'est Elodie de Qarte, je t'accompagne pendant ton essai. La moindre question, je suis dispo ici 😊` },
    { label: 'Relance config', text: `Hello ${name} ! Ton programme n'est pas encore en ligne — dis-moi ta recompense habituelle et je configure tout pour toi en 30 secondes 😊` },
    { label: 'Offre bienvenue', text: `Hello ${name} ! Un geste pour les nouveaux clients (ex: -20% 1ere visite). Ils le voient sur ta vitrine, ils viennent, ils scannent → dans ta base. Espace Pro → Ma Page 🎁` },
    { label: 'SEO Google', text: `Hello ${name} ! Ta vitrine est referencee sur Google. Ajoute tes prestations, photos et adresse pour ressortir quand quelqu'un cherche un salon pres de chez toi 🔍` },
    { label: 'Fin essai', text: `Hello ${name} ! Ton essai se termine bientot${customers > 0 ? ` et tes ${customers} clients comptent sur leur carte` : ''}. On continue ensemble ? 😊` },
    { label: 'Message libre', text: `C'est Elodie de Qarte. ` },
  ];
}

function getWhatsAppTuto(name: string): { label: string; text: string }[] {
  return [
    { label: 'Comment ca marche', text: `Hello ${name} ! QR code en caisse → le client scanne → sa carte est creee. A chaque passage il rescanne, le tampon s'ajoute tout seul. Pas d'appli 📱` },
    { label: 'La recompense', text: `Hello ${name} ! Bon nombre de tampons atteint → la recompense apparait. Il te la montre, tu valides, compteur a zero 🎁` },
    { label: 'L\'espace pro', text: `Hello ${name} ! Ton espace pro (getqarte.com → Espace Pro) : clients, tampons, stats, notifs. Tout depuis ton telephone 📊` },
    { label: 'Notifs push', text: `Hello ${name} ! Envoie des notifs push en 1 clic — top pour remplir un creneau calme ou rappeler une promo 🔔` },
    { label: 'Vitrine en ligne', text: `Hello ${name} ! Ta vitrine c'est ton lien en bio : photos, prestations, offre de bienvenue. Espace Pro → Ma Page 📲` },
    { label: 'Parrainage', text: `Hello ${name} ! Un ami s'inscrit via le lien de ton client → les deux recoivent un cadeau. Espace Pro → Parrainage 🤝` },
    { label: 'Kit promo', text: `Hello ${name} ! QR code HD + visuels prets pour Instagram dans Espace Pro → QR code & Supports 🖼️` },
    { label: 'Avis Google', text: `Hello ${name} ! On demande l'avis a tes clients au 1er passage et a chaque recompense. Ajoute ton lien Google dans Espace Pro → Programme ⭐` },
    { label: 'Le Shield', text: `Hello ${name} ! Un client scanne 2 fois le meme jour ? Le 2eme est mis en attente. Un clic pour valider ou refuser ✅` },
    { label: 'Prix', text: `Hello ${name} ! 24€/mois sans engagement, clients illimites 💳` },
  ];
}

// --- Email tracking labels ---

const EMAIL_LABELS: Record<number, string> = {
  [-100]: 'Premier scan',
  [-101]: 'Premiere recompense',
  [-102]: 'Upsell Tier 2',
  [-103]: 'QR code & kit promo',
  [-104]: 'Challenge complete',
  [-105]: 'QR telecharge',
  [-108]: 'Kit reseaux telecharge',
  [-106]: 'Script 1er client (config +2j)',
  [-107]: 'Relance 0 scan (config +4j)',
  [-110]: 'Relance inactif J+7',
  [-111]: 'Relance inactif J+14',
  [-112]: 'Relance inactif J+30',
  [-113]: 'Relance grace period',
  [-120]: 'Auto-suggestion recompense',
  [-200]: 'Email de bienvenue',
  [-201]: 'Trial expire J-1',
  [-203]: 'Trial expire J-3',
  [-211]: 'Trial expire +1j',
  [-212]: 'Trial expire +2j',
  [-301]: 'Rappel config programme J+1',
  [-302]: 'Rappel config programme J+2',
  [-303]: 'Rappel config programme J+3',
  [-305]: 'Check-in J+5',
};

// --- StatIcon helper ---

const STAT_ICON_COLORS = {
  brand: { bg: 'bg-[#5167fc]/10', text: 'text-[#5167fc]' },
  green: { bg: 'bg-green-50', text: 'text-green-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
  pink: { bg: 'bg-pink-50', text: 'text-pink-600' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600' },
} as const;

function StatIcon({ icon: Icon, color }: { icon: React.ComponentType<{ className?: string }>; color: keyof typeof STAT_ICON_COLORS }) {
  const c = STAT_ICON_COLORS[color];
  return (
    <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', c.bg)}>
      <Icon className={cn('w-4 h-4', c.text)} />
    </div>
  );
}


// --- Main Page ---

export default function MerchantDetailPage() {
  const params = useParams();
  const merchantId = params.id as string;

  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalCustomers: 0, activeCustomers: 0, totalVisits: 0, totalRedemptions: 0,
    pushSubscribers: 0, pushSent: 0, smsSent: 0, pendingPoints: 0, weeklyScans: 0,
    lastVisitDate: null, totalReferrals: 0, pendingReferrals: 0, completedReferrals: 0,
    servicesCount: 0, photosCount: 0, welcomeVouchers: 0, offerVouchers: 0, planningSlotsCount: 0, planningBookingsCount: 0, pendingDepositsCount: 0,
  });
  const [memberPrograms, setMemberPrograms] = useState<MemberProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [emailTrackings, setEmailTrackings] = useState<{ reminder_day: number; sent_at: string }[]>([]);
  const [qrOpen, setQrOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/admin/merchants/${merchantId}`);
        if (!res.ok) throw new Error('Failed to fetch merchant data');
        const data = await res.json();
        setMerchant(data.merchant);
        setStats(data.stats);
        setMemberPrograms(data.memberPrograms || []);
        setEmailTrackings(data.emailTrackings || []);
        if (data.userEmail) setUserEmail(data.userEmail);
      } catch (error) {
        console.error('Error fetching merchant data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [merchantId]);

  useEffect(() => {
    if (merchant?.scan_code) {
      const scanUrl = getScanUrl(merchant.scan_code);
      generateQRCode(scanUrl).then(setQrCodeUrl);
    }
  }, [merchant?.scan_code]);

  const handleCopyLink = async () => {
    if (!merchant) return;
    const scanUrl = getScanUrl(merchant.scan_code);
    await navigator.clipboard.writeText(scanUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyEmail = async () => {
    if (!userEmail) return;
    await navigator.clipboard.writeText(userEmail);
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  const getDaysRemaining = (trialEndsAt: string | null): number | null => {
    if (!trialEndsAt) return null;
    const end = new Date(trialEndsAt);
    const now = new Date();
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getStatusBadge = (m: Merchant) => {
    switch (m.subscription_status) {
      case 'trial': {
        const daysLeft = getDaysRemaining(m.trial_ends_at);
        return (
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-100 rounded-full">En essai</span>
            {daysLeft !== null && (
              <span className={cn("text-sm", daysLeft <= 3 ? "text-red-600 font-medium" : "text-gray-500")}>
                {daysLeft <= 0 ? "Expiré" : `${daysLeft}j restant${daysLeft > 1 ? 's' : ''}`}
              </span>
            )}
          </div>
        );
      }
      case 'active':
        return (
          <span className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 rounded-full">
            Actif {m.billing_interval === 'annual' ? 'annuel' : 'mensuel'}
          </span>
        );
      case 'canceled':
        return <span className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 rounded-full">Annulé</span>;
      default:
        return <span className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-full">{m.subscription_status}</span>;
    }
  };

  const [waOpen, setWaOpen] = useState(false);
  const [waTab, setWaTab] = useState<'marketing' | 'tuto'>('marketing');
  const [adminNotes, setAdminNotes] = useState(merchant?.admin_notes || '');
  const [savingField, setSavingField] = useState<string | null>(null);

  const patchMerchant = useCallback(async (fields: Record<string, unknown>) => {
    const key = Object.keys(fields)[0];
    setSavingField(key);
    try {
      const res = await fetch(`/api/admin/merchants/${merchantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      if (res.ok) {
        const data = await res.json();
        setMerchant(prev => prev ? { ...prev, ...data } : prev);
      }
    } catch (err) {
      console.error('Patch merchant error:', err);
    } finally {
      setSavingField(null);
    }
  }, [merchantId]);

  const openWhatsApp = (phone: string, message: string) => {
    const formattedPhone = formatPhoneForWhatsApp(phone);
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Update adminNotes when merchant loads
  useEffect(() => {
    if (merchant) setAdminNotes(merchant.admin_notes || '');
  }, [merchant?.admin_notes]);

  const healthScore = useMemo(
    () => merchant ? computeHealthScore(merchant, stats.totalCustomers, stats.weeklyScans, stats.lastVisitDate) : 0,
    [merchant, stats.totalCustomers, stats.weeklyScans, stats.lastVisitDate]
  );

  // Vitrine en ligne completion
  const { pageProItems, pageProDone, pageProPct } = useMemo(() => {
    if (!merchant) return { pageProItems: [], pageProDone: 0, pageProPct: 0 };
    const items = [
      { label: 'Bio', done: !!merchant.bio },
      { label: 'Adresse', done: !!merchant.shop_address },
      { label: 'Logo', done: !!merchant.logo_url },
      { label: 'Horaires', done: !!merchant.opening_hours && Object.values(merchant.opening_hours).some(v => v !== null) },
      { label: 'Prestations', done: stats.servicesCount > 0 },
      { label: 'Photos', done: stats.photosCount > 0 },
      { label: 'Reseau social', done: !!(merchant.instagram_url || merchant.facebook_url || merchant.tiktok_url || merchant.snapchat_url) },
      { label: 'Planning', done: merchant.planning_enabled },
      { label: 'Offre bienvenue', done: merchant.welcome_offer_enabled },
      { label: 'Lien avis', done: !!merchant.review_link },
    ];
    const done = items.filter(i => i.done).length;
    return { pageProItems: items, pageProDone: done, pageProPct: Math.round((done / items.length) * 100) };
  }, [merchant, stats.servicesCount, stats.photosCount]);

  // Onboarding checklist
  const { onboardingItems, onboardingDone } = useMemo(() => {
    if (!merchant) return { onboardingItems: [], onboardingDone: 0 };
    const items = [
      { label: 'Programme configure', done: !!merchant.reward_description },
      { label: 'Logo ajoute', done: !!merchant.logo_url },
      { label: 'Reseau social ajoute', done: !!(merchant.instagram_url || merchant.facebook_url || merchant.tiktok_url || merchant.snapchat_url) },
      { label: 'QR code telecharge', done: stats.totalVisits > 0 },
      { label: 'Premiers scans obtenus', done: stats.totalVisits >= 2 },
    ];
    return { onboardingItems: items, onboardingDone: items.filter(i => i.done).length };
  }, [merchant, stats.totalVisits]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5167fc]"></div>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Store className="w-12 h-12 mb-4 text-gray-300" />
        <p className="text-gray-600 mb-4">Commerçant non trouvé</p>
        <Link href="/admin/merchants"><Button>Retour à la liste</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header compact */}
      <div className="flex items-center gap-2 pt-10 lg:pt-0">
        <Link href="/admin/merchants">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Retour</Button>
        </Link>
      </div>

      {/* Identity card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Left: identity */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex items-center justify-center w-14 h-14 font-bold text-2xl text-white rounded-xl bg-[#5167fc] flex-shrink-0">
              {merchant.shop_name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900 truncate">{merchant.shop_name}</h1>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[#5167fc]/10 text-[#5167fc]">
                  {SHOP_TYPES[merchant.shop_type] || merchant.shop_type}
                </span>
                <span className="text-xs text-gray-500">
                  {{ FR: '🇫🇷', BE: '🇧🇪', CH: '🇨🇭', LU: '🇱🇺', US: '🇺🇸', GB: '🇬🇧', CA: '🇨🇦', AU: '🇦🇺', ES: '🇪🇸', IT: '🇮🇹' }[merchant.country] || ''} {merchant.country}
                </span>
                {merchant.signup_source && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-50 text-indigo-600">
                    {merchant.signup_source}
                  </span>
                )}
              </div>
              {merchant.shop_address && (
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5" />{merchant.shop_address}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{merchant.phone}</span>
                {userEmail && (
                  <button onClick={handleCopyEmail} className="flex items-center gap-1 hover:text-[#5167fc] transition-colors group" title="Copier">
                    <Mail className="w-3.5 h-3.5" /><span>{userEmail}</span>
                    {emailCopied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
                  </button>
                )}
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Inscrit le {formatDate(merchant.created_at)}</span>
                <span className="flex items-center gap-1 text-xs">
                  <Clock className="w-3 h-3" />
                  {merchant.last_seen_at
                    ? (() => {
                        const days = Math.floor((Date.now() - new Date(merchant.last_seen_at).getTime()) / (1000 * 60 * 60 * 24));
                        return days === 0 ? 'Vu aujourd\'hui' : `Vu il y a ${days}j`;
                      })()
                    : 'Jamais connecté'}
                </span>
              </div>
            </div>
          </div>

          {/* Right: status + health + alerts */}
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {getStatusBadge(merchant)}
            <HealthDot score={healthScore} />
            {stats.totalCustomers === 0 && (
              <span className="px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> 0 client
              </span>
            )}
            {stats.totalVisits === 0 && (
              <span className="px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> 0 scan
              </span>
            )}
            {!merchant.reward_description && (
              <span className="px-2 py-1 text-xs font-medium text-amber-700 bg-amber-100 rounded-full flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Sans programme
              </span>
            )}
          </div>
        </div>

        {/* Admin controls */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => patchMerchant({ no_contact: !merchant.no_contact })}
            disabled={savingField === 'no_contact'}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors border",
              merchant.no_contact
                ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
            )}
          >
            {savingField === 'no_contact' ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
            {merchant.no_contact ? 'Ne pas contacter' : 'Contacter OK'}
          </button>
          <div className="flex-1 relative">
            <StickyNote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Notes admin..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              onBlur={() => {
                if (adminNotes !== (merchant.admin_notes || '')) {
                  patchMerchant({ admin_notes: adminNotes });
                }
              }}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5167fc] focus:border-transparent"
            />
            {savingField === 'admin_notes' && <Loader2Icon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />}
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {userEmail ? (
            <a href={`mailto:${userEmail}`} className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors">
              <Mail className="w-4 h-4" /> Email
            </a>
          ) : (
            <div className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-400 bg-gray-100 rounded-xl cursor-not-allowed">
              <Mail className="w-4 h-4" /> Email
            </div>
          )}
          <a href={`tel:${merchant.phone}`} className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors">
            <PhoneCall className="w-4 h-4" /> Appeler
          </a>
        </div>

        {/* WhatsApp */}
        {merchant.phone && !merchant.no_contact && (
          <div className="mt-3">
            <button onClick={() => setWaOpen(!waOpen)} className="w-full flex items-center justify-between px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <span className="font-semibold text-sm">WhatsApp</span>
              </div>
              <ChevronDown className={cn("w-4 h-4 transition-transform", waOpen && "rotate-180")} />
            </button>
            {waOpen && (
              <div className="mt-2">
                <div className="flex gap-1 mb-2">
                  <button onClick={() => setWaTab('marketing')} className={cn("px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors", waTab === 'marketing' ? "bg-green-600 text-white" : "bg-green-50 text-green-700 hover:bg-green-100")}>Marketing</button>
                  <button onClick={() => setWaTab('tuto')} className={cn("px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors", waTab === 'tuto' ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100")}>Tuto / Explication</button>
                </div>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {(waTab === 'marketing' ? getWhatsAppMarketing(merchant.shop_name, stats.totalCustomers) : getWhatsAppTuto(merchant.shop_name)).map((msg, i) => (
                    <button
                      key={i}
                      onClick={() => openWhatsApp(merchant.phone, msg.text)}
                      className={cn("text-left px-3 py-2.5 rounded-xl border transition-colors group", waTab === 'marketing' ? "border-green-100 bg-green-50 hover:bg-green-100" : "border-blue-100 bg-blue-50 hover:bg-blue-100")}
                    >
                      <span className={cn("text-xs font-bold", waTab === 'marketing' ? "text-green-700" : "text-blue-700")}>{msg.label}</span>
                      <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5 group-hover:text-gray-700">{msg.text}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══════════ STATS & ONBOARDING ═══════════ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-6">
        <div>
          <SectionTitle icon={<TrendingUp className="w-4 h-4 text-[#5167fc]" />}>Activité</SectionTitle>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={<StatIcon icon={Users} color="brand" />} value={stats.totalCustomers} label="Clients inscrits" highlight={stats.totalCustomers === 0 ? 'red' : undefined} />
            <StatCard icon={<StatIcon icon={TrendingUp} color="green" />} value={stats.activeCustomers} label="Actifs (30j)" />
            <StatCard icon={<StatIcon icon={Clock} color="amber" />} value={stats.totalVisits} label="Visites totales" />
            <StatCard icon={<StatIcon icon={Gift} color="pink" />} value={stats.totalRedemptions} label="Recompenses" />
          </div>
        </div>

        <div>
          <SectionTitle icon={<Bell className="w-4 h-4 text-blue-600" />}>Push & Marketing</SectionTitle>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={<StatIcon icon={Bell} color="blue" />} value={stats.pushSubscribers} label="Abonnes push" />
            <StatCard icon={<StatIcon icon={Send} color="purple" />} value={stats.pushSent} label="Notifs envoyees" />
            <StatCard icon={<StatIcon icon={MessageCircle} color="emerald" />} value={stats.smsSent} label="SMS envoyes" />
            <StatCard icon={<StatIcon icon={TrendingUp} color="emerald" />} value={stats.weeklyScans} label="Scans (7j)" />
            <StatCard
              icon={<div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", merchant.pwa_installed_at ? "bg-green-100" : "bg-gray-50")}><Smartphone className={cn("w-4 h-4", merchant.pwa_installed_at ? "text-green-600" : "text-gray-400")} /></div>}
              value={merchant.pwa_installed_at ? new Date(merchant.pwa_installed_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—'}
              label={`PWA ${merchant.pwa_installed_at ? 'installée' : 'non installée'}`}
              highlight={merchant.pwa_installed_at ? 'green' : undefined}
            />
          </div>
        </div>

        <div>
          <SectionTitle icon={<Share2 className="w-4 h-4 text-violet-600" />}>Acquisition</SectionTitle>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={<StatIcon icon={Share2} color="violet" />} value={stats.totalReferrals} label="Parrainages" />
            <StatCard icon={<StatIcon icon={UserPlus} color="indigo" />} value={stats.welcomeVouchers} label="Vouchers bienvenue" />
            <StatCard icon={<StatIcon icon={Tag} color="amber" />} value={stats.offerVouchers} label="Vouchers promo" />
            <StatCard
              icon={<div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", stats.pendingPoints > 0 ? "bg-amber-100" : "bg-gray-50")}><Shield className={cn("w-4 h-4", stats.pendingPoints > 0 ? "text-amber-600" : "text-gray-400")} /></div>}
              value={stats.pendingPoints} label="Points en attente"
              highlight={stats.pendingPoints > 0 ? 'amber' : undefined}
            />
          </div>
        </div>

        {/* Dernière visite */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-[#5167fc]/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-[#5167fc]" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Dernière visite client</p>
            <p className="text-lg font-bold text-gray-900">
              {stats.lastVisitDate ? formatDate(stats.lastVisitDate) : 'Aucune visite'}
            </p>
          </div>
        </div>

        {/* Onboarding */}
        <div>
          <SectionTitle
            icon={<ListChecks className="w-4 h-4 text-[#5167fc]" />}
            badge={<span className="text-sm font-normal text-gray-500">{onboardingDone}/{onboardingItems.length}</span>}
          >Onboarding</SectionTitle>
          <div className="h-2 bg-gray-200/60 rounded-full mb-3 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#5167fc] to-violet-500 rounded-full transition-all" style={{ width: `${(onboardingDone / onboardingItems.length) * 100}%` }} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {onboardingItems.map((item) => (
              <div key={item.label} className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-sm", item.done ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-400")}>
                {item.done ? <Check className="w-4 h-4 flex-shrink-0" /> : <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />}
                <span className={item.done ? '' : 'line-through'}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* QR Code — collapsible */}
        <div>
          <button onClick={() => setQrOpen(!qrOpen)} className="w-full flex items-center justify-between text-left">
            <SectionTitle icon={<QrCode className="w-4 h-4 text-[#5167fc]" />}>QR Code de scan</SectionTitle>
            <ChevronDown className={cn("w-5 h-5 text-gray-400 transition-transform", qrOpen && "rotate-180")} />
          </button>
          {qrOpen && (
            <div className="mt-3 flex flex-col sm:flex-row gap-4 items-start">
              <div className="flex-shrink-0">
                {qrCodeUrl ? (
                  <div className="p-3 bg-white border-2 border-gray-200 rounded-xl">
                    <img src={qrCodeUrl} alt={`QR Code pour ${merchant.shop_name}`} className="w-36 h-36" />
                  </div>
                ) : (
                  <div className="w-36 h-36 bg-gray-100 rounded-xl flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#5167fc]" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 mb-2">Lien de scan :</p>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <code className="text-sm text-[#5167fc] font-mono truncate flex-1">{getScanUrl(merchant.scan_code)}</code>
                  <button onClick={handleCopyLink} className="flex-shrink-0 p-2 hover:bg-gray-200 rounded-lg transition-colors" title="Copier">
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-600" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Code : <span className="font-mono font-medium">{merchant.scan_code}</span></p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ═══════════ LIENS & RÉSEAUX ═══════════ */}
      {(merchant.slug || merchant.instagram_url || merchant.facebook_url || merchant.tiktok_url || merchant.snapchat_url || merchant.booking_url || merchant.review_link || merchant.deposit_link) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <SectionTitle icon={<ExternalLink className="w-4 h-4 text-[#5167fc]" />}>Liens & Réseaux</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {merchant.slug && (
              <a href={`/p/${merchant.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#5167fc]/30 bg-[#5167fc]/5 hover:bg-[#5167fc]/10 text-sm text-[#5167fc] font-medium transition-colors">
                <Share2 className="w-4 h-4 flex-shrink-0" /><span className="truncate">Page programme</span>
              </a>
            )}
            {merchant.instagram_url && (
              <a href={merchant.instagram_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-lg border border-pink-200 bg-pink-50 hover:bg-pink-100 text-sm text-gray-700 hover:text-pink-600 transition-colors">
                <svg className="w-4 h-4 flex-shrink-0 text-pink-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                <span className="truncate">@{extractPseudo(merchant.instagram_url)}</span>
              </a>
            )}
            {merchant.facebook_url && (
              <a href={merchant.facebook_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-sm text-gray-700 hover:text-blue-600 transition-colors">
                <svg className="w-4 h-4 flex-shrink-0 text-blue-600" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                <span className="truncate">{extractPseudo(merchant.facebook_url)}</span>
              </a>
            )}
            {merchant.tiktok_url && (
              <a href={merchant.tiktok_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 text-sm text-gray-700 hover:text-gray-900 transition-colors">
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" /></svg>
                <span className="truncate">@{extractPseudo(merchant.tiktok_url)}</span>
              </a>
            )}
            {merchant.snapchat_url && (
              <a href={merchant.snapchat_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#FFFC00] bg-[#FFFC00] hover:bg-[#e6e300] text-sm text-gray-900 transition-colors">
                <svg className="w-4 h-4 flex-shrink-0 text-gray-900" viewBox="0 0 24 24" fill="currentColor"><path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12.953-.268.18-.088.33-.12.48-.12.36 0 .659.211.659.51a.685.685 0 01-.315.614c-.21.12-1.11.57-1.725.676-.18.03-.36.074-.54.074-.18 0-.36-.03-.54-.074a4.14 4.14 0 00-.315-.044c-.209 0-.375.06-.504.18-.09.088-.15.195-.195.315-.045.12-.06.255-.06.39 0 .24.015.465.045.69.105.63.33 1.065.614 1.395.24.27.54.48.87.63.27.12.57.21.87.255.12.015.24.03.36.06a.685.685 0 01.555.66c0 .33-.24.63-.735.795-.57.195-1.32.3-2.1.33-.24.015-.39.21-.54.45-.195.315-.42.69-1.005.69-.06 0-.12 0-.195-.015-.42-.045-.765-.18-1.17-.33-.6-.21-1.275-.45-2.34-.45s-1.74.24-2.34.45c-.405.15-.75.285-1.17.33-.075.015-.135.015-.195.015-.585 0-.81-.375-1.005-.69-.15-.24-.3-.435-.54-.45-.78-.03-1.53-.135-2.1-.33C1.32 16.5 1.08 16.2 1.08 15.87c0-.33.21-.6.555-.66.12-.03.24-.045.36-.06.3-.045.6-.135.87-.255.33-.15.63-.36.87-.63.285-.33.51-.765.614-1.395.03-.225.045-.45.045-.69 0-.135-.015-.27-.06-.39a.753.753 0 00-.195-.315c-.13-.12-.295-.18-.504-.18a4.14 4.14 0 00-.315.044c-.18.044-.36.074-.54.074s-.36-.044-.54-.074c-.615-.106-1.515-.556-1.725-.676A.685.685 0 01.2 10.007c0-.3.3-.51.659-.51.15 0 .3.032.48.12.294.148.653.252.953.268.198 0 .326-.045.401-.09a6.21 6.21 0 01-.03-.51l-.003-.06c-.104-1.628-.23-3.654.299-4.847C4.647 1.07 8.004.793 8.994.793h.12z" /></svg>
                <span className="truncate">@{extractPseudo(merchant.snapchat_url)}</span>
              </a>
            )}
            {merchant.booking_url && (
              <a href={merchant.booking_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-sm text-gray-700 hover:text-[#5167fc] transition-colors">
                <Calendar className="w-4 h-4 flex-shrink-0" /><span className="truncate">Réservation</span>
              </a>
            )}
            {merchant.deposit_link && (
              <a
                href={merchant.deposit_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-sm text-emerald-700 transition-colors"
                title={merchant.deposit_link}
              >
                <CreditCard className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">
                  Acompte
                  {merchant.deposit_amount != null
                    ? ` · ${merchant.deposit_amount}€`
                    : merchant.deposit_percent != null
                      ? ` · ${merchant.deposit_percent}%`
                      : ''}
                </span>
              </a>
            )}
            {merchant.review_link && (
              <a href={merchant.review_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-sm text-gray-700 hover:text-[#5167fc] transition-colors">
                <Star className="w-4 h-4 flex-shrink-0" /><span className="truncate">Avis Google</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* ═══════════ PROGRAMME FIDÉLITÉ ═══════════ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-5">
        <SectionTitle icon={<Gift className="w-4 h-4 text-[#5167fc]" />}>Programme de fidélité</SectionTitle>

        <div className="flex flex-wrap gap-2">
          <FeatureBadge active={merchant.loyalty_mode === 'cagnotte'} icon={<Wallet className="w-3 h-3" />} label={merchant.loyalty_mode === 'cagnotte' ? 'Cagnotte' : 'Par visite'} />
          <FeatureBadge active={merchant.referral_program_enabled} icon={<Share2 className="w-3 h-3" />} label="Parrainage" />
          <FeatureBadge active={merchant.birthday_gift_enabled} icon={<Cake className="w-3 h-3" />} label="Anniversaire" />
          <FeatureBadge active={merchant.shield_enabled} icon={<Shield className="w-3 h-3" />} label="Shield" />
          <FeatureBadge active={merchant.welcome_offer_enabled} icon={<Gift className="w-3 h-3" />} label="Bienvenue" />
          <FeatureBadge active={merchant.auto_booking_enabled} icon={<CalendarDays className="w-3 h-3" />} label="Resa en ligne" />
          <FeatureBadge active={merchant.tier2_enabled} icon={<Zap className="w-3 h-3" />} label="Palier 2" />
          {merchant.double_days_enabled && (
            <FeatureBadge active icon={<Zap className="w-3 h-3" />} label={`Jours x2 : ${formatDoubleDays(merchant.double_days_of_week) || '—'}`} />
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className={cn("p-4 rounded-xl border", merchant.loyalty_mode === 'cagnotte' ? "bg-purple-50 border-purple-200" : "bg-[#5167fc]/5 border-[#5167fc]/10")}>
            <div className="flex items-center gap-2 mb-2">
              {merchant.loyalty_mode === 'cagnotte' ? <Wallet className="w-5 h-5 text-purple-600" /> : <Gift className="w-5 h-5 text-[#5167fc]" />}
              <span className="font-medium text-gray-900">Palier 1</span>
            </div>
            {merchant.loyalty_mode === 'cagnotte' ? (
              <>
                <p className="text-gray-700"><span className="font-semibold">{merchant.stamps_required} passages</span> → <span className="font-semibold">{merchant.cagnotte_percent ?? 0}%</span> cagnotte</p>
                <p className="text-gray-700 mt-1 text-sm">Reward : {merchant.reward_description || 'Non configuré'}</p>
              </>
            ) : (
              <p className="text-gray-700"><span className="font-semibold">{merchant.stamps_required} passages</span> → {merchant.reward_description || 'Non configuré'}</p>
            )}
          </div>

          {merchant.tier2_enabled && merchant.tier2_stamps_required ? (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                {merchant.loyalty_mode === 'cagnotte' ? <Wallet className="w-5 h-5 text-amber-600" /> : <Gift className="w-5 h-5 text-amber-600" />}
                <span className="font-medium text-gray-900">Palier 2</span>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">Actif</span>
              </div>
              {merchant.loyalty_mode === 'cagnotte' ? (
                <>
                  <p className="text-gray-700"><span className="font-semibold">{merchant.tier2_stamps_required} passages</span> → <span className="font-semibold">{merchant.cagnotte_tier2_percent ?? 0}%</span> cagnotte</p>
                  <p className="text-gray-700 mt-1 text-sm">Reward : {merchant.tier2_reward_description || 'Non configuré'}</p>
                </>
              ) : (
                <p className="text-gray-700"><span className="font-semibold">{merchant.tier2_stamps_required} passages</span> → {merchant.tier2_reward_description || 'Non configuré'}</p>
              )}
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-5 h-5 text-gray-400" />
                <span className="font-medium text-gray-500">Palier 2</span>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-500">Non activé</span>
              </div>
              <p className="text-gray-500 text-sm">Le commerçant n&apos;a pas activé le second palier.</p>
            </div>
          )}
        </div>

        {merchant.birthday_gift_enabled && (
          <div className="p-4 bg-pink-50 rounded-xl border border-pink-200">
            <div className="flex items-center gap-2 mb-1">
              <Cake className="w-4 h-4 text-pink-600" />
              <span className="font-medium text-gray-900 text-sm">Cadeau anniversaire</span>
            </div>
            <p className="text-gray-700 text-sm">{merchant.birthday_gift_description || 'Non configuré'}</p>
          </div>
        )}

        {merchant.referral_program_enabled && (merchant.referral_reward_referrer || merchant.referral_reward_referred) && (
          <div className="p-4 bg-violet-50 rounded-xl border border-violet-200">
            <div className="flex items-center gap-2 mb-3">
              <Share2 className="w-4 h-4 text-violet-600" />
              <span className="font-medium text-gray-900 text-sm">Récompenses parrainage</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {merchant.referral_reward_referrer && (
                <div className="flex items-start gap-2 p-2.5 bg-white rounded-lg">
                  <span className="text-xs font-semibold text-violet-600 uppercase tracking-wide mt-0.5">Parrain</span>
                  <span className="text-sm text-gray-700">{merchant.referral_reward_referrer}</span>
                </div>
              )}
              {merchant.referral_reward_referred && (
                <div className="flex items-start gap-2 p-2.5 bg-white rounded-lg">
                  <span className="text-xs font-semibold text-violet-600 uppercase tracking-wide mt-0.5">Filleul</span>
                  <span className="text-sm text-gray-700">{merchant.referral_reward_referred}</span>
                </div>
              )}
            </div>
            {stats.totalReferrals > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="text-center p-2 bg-white rounded-lg">
                  <p className="text-lg font-bold text-violet-700">{stats.totalReferrals}</p>
                  <p className="text-[10px] text-gray-500 font-medium">Total</p>
                </div>
                <div className="text-center p-2 bg-white rounded-lg">
                  <p className="text-lg font-bold text-amber-600">{stats.pendingReferrals}</p>
                  <p className="text-[10px] text-gray-500 font-medium">En cours</p>
                </div>
                <div className="text-center p-2 bg-white rounded-lg">
                  <p className="text-lg font-bold text-green-600">{stats.completedReferrals}</p>
                  <p className="text-[10px] text-gray-500 font-medium">Finalisés</p>
                </div>
              </div>
            )}
          </div>
        )}

        {merchant.welcome_offer_enabled && (
          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
            <div className="flex items-center gap-2 mb-1">
              <Gift className="w-4 h-4 text-indigo-600" />
              <span className="font-medium text-gray-900 text-sm">Offre de bienvenue</span>
            </div>
            <p className="text-sm text-gray-700">{merchant.welcome_offer_description || 'Non configuré'}</p>
            {merchant.welcome_referral_code && (
              <p className="text-xs text-gray-500 mt-1">Code : <span className="font-mono font-semibold text-indigo-700">{merchant.welcome_referral_code}</span></p>
            )}
          </div>
        )}

        {merchant.offer_active && merchant.offer_title && (
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-600" />
                <span className="font-medium text-amber-900 text-sm">Offre temporaire</span>
              </div>
              {merchant.offer_expires_at && (
                <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", new Date(merchant.offer_expires_at) < new Date() ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700")}>
                  {new Date(merchant.offer_expires_at) < new Date() ? "Expirée" : `Expire le ${formatDate(merchant.offer_expires_at)}`}
                </span>
              )}
            </div>
            <p className="font-semibold text-amber-800">{merchant.offer_title}</p>
            {merchant.offer_description && <p className="text-amber-700 text-sm mt-1">{merchant.offer_description}</p>}
          </div>
        )}

        {memberPrograms.length > 0 && (
          <div>
            <SectionTitle icon={<Users className="w-4 h-4 text-[#5167fc]" />}>Programmes d&apos;adhésion ({memberPrograms.length})</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2">
              {memberPrograms.map((program) => {
                const memberCount = program.member_cards?.[0]?.count || 0;
                return (
                  <div key={program.id} className={cn("p-4 rounded-xl border", program.is_active ? "bg-[#5167fc]/5 border-[#5167fc]/20" : "bg-gray-50 border-gray-200")}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-900">{program.name}</span>
                      <span className={cn("px-2 py-0.5 text-xs font-medium rounded-full", program.is_active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600")}>{program.is_active ? 'Actif' : 'Inactif'}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{program.benefit_label}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Durée: {program.duration_months >= 1 ? `${program.duration_months} mois` : `${Math.round(program.duration_months * 30)} jours`}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{memberCount} membre{memberCount > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ═══════════ VITRINE EN LIGNE ═══════════ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-5">
        <div>
          <SectionTitle
            icon={<Globe className="w-4 h-4 text-[#5167fc]" />}
            badge={<span className={cn("px-2 py-0.5 text-xs font-bold rounded-full", pageProPct === 100 ? "bg-green-100 text-green-700" : pageProPct >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700")}>{pageProPct}%</span>}
          >Vitrine en ligne</SectionTitle>
          <div className="h-2 bg-gray-200/60 rounded-full mb-3 overflow-hidden">
            <div className={cn("h-full rounded-full transition-all", pageProPct === 100 ? "bg-green-500" : pageProPct >= 50 ? "bg-amber-500" : "bg-red-400")} style={{ width: `${pageProPct}%` }} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {pageProItems.map((item) => (
              <div key={item.label} className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-sm", item.done ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-400")}>
                {item.done ? <Check className="w-4 h-4 flex-shrink-0" /> : <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />}
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <SectionTitle icon={<FileText className="w-4 h-4 text-violet-600" />}>Contenu</SectionTitle>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={<StatIcon icon={Scissors} color="violet" />} value={stats.servicesCount} label="Prestations" />
            <StatCard icon={<StatIcon icon={Image} color="cyan" />} value={stats.photosCount} label="Photos" />
            <StatCard icon={<StatIcon icon={CalendarDays} color="indigo" />} value={`${stats.planningBookingsCount} / ${stats.planningSlotsCount}`} label="Reservations / creneaux" highlight={stats.planningBookingsCount > 0 ? 'green' : undefined} />
            <StatCard
              icon={<div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", stats.pendingDepositsCount > 0 ? "bg-amber-100" : "bg-gray-50")}><Hourglass className={cn("w-4 h-4", stats.pendingDepositsCount > 0 ? "text-amber-600" : "text-gray-400")} /></div>}
              value={stats.pendingDepositsCount}
              label="Resas en attente d'acompte"
              highlight={stats.pendingDepositsCount > 0 ? 'amber' : undefined}
            />
            <StatCard
              icon={<div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", merchant.bio ? "bg-green-50" : "bg-gray-50")}><FileText className={cn("w-4 h-4", merchant.bio ? "text-green-600" : "text-gray-400")} /></div>}
              value={merchant.bio ? 'Oui' : '—'} label="Bio renseignée"
              highlight={merchant.bio ? 'green' : undefined}
            />
          </div>
        </div>

        {merchant.opening_hours && Object.values(merchant.opening_hours).some(v => v !== null) && (
          <div>
            <SectionTitle icon={<Clock className="w-4 h-4 text-amber-600" />}>Horaires</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, i) => {
                const key = String(i + 1 === 7 ? 0 : i + 1);
                const hours = merchant.opening_hours?.[key];
                return (
                  <div key={day} className={cn("px-3 py-2 rounded-lg text-sm", hours ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-400")}>
                    <span className="font-medium">{day}</span>{' '}
                    {hours ? `${hours.open}–${hours.close}` : 'Fermé'}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* ═══════════ EMAILS ENVOYÉS ═══════════ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <SectionTitle icon={<Mail className="w-4 h-4 text-[#5167fc]" />}>Emails envoyés ({emailTrackings.length})</SectionTitle>
        {emailTrackings.length > 0 ? (
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
            {emailTrackings.map((t, i) => {
              const label = EMAIL_LABELS[t.reminder_day] || `Code ${t.reminder_day}`;
              const date = new Date(t.sent_at).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
              });
              return (
                <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", t.reminder_day < 0 ? "bg-green-500" : "bg-amber-500")} />
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                  </div>
                  <span className="text-xs text-gray-500">{date}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-400">
            <Mail className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Aucun email envoyé</p>
          </div>
        )}
      </div>
    </div>
  );
}
