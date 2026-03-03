'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
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
} from 'lucide-react';
import { Button } from '@/components/ui';
import { cn, generateQRCode, getScanUrl } from '@/lib/utils';
import { SHOP_TYPES } from '@/types';
import type { ShopType, MerchantCountry } from '@/types';

interface Merchant {
  id: string;
  user_id: string;
  shop_name: string;
  shop_address: string | null;
  phone: string;
  subscription_status: string;
  trial_ends_at: string | null;
  created_at: string;
  stamps_required: number;
  reward_description: string;
  loyalty_mode: 'visit' | 'article';
  scan_code: string;
  slug: string;
  shop_type: ShopType;
  country: MerchantCountry;
  secondary_color: string;
  shield_enabled: boolean;
  double_days_enabled: boolean;
  double_days_of_week: string;
  last_seen_at: string | null;
  // Tier 2 fields
  tier2_enabled: boolean;
  tier2_stamps_required: number | null;
  tier2_reward_description: string | null;
  logo_url: string | null;
  primary_color: string;
  // Social & booking fields
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  booking_url: string | null;
  review_link: string | null;
  // Referral
  referral_program_enabled: boolean;
  referral_reward_referrer: string | null;
  referral_reward_referred: string | null;
  // Birthday
  birthday_gift_enabled: boolean;
  birthday_gift_description: string | null;
  // Offer fields
  offer_active: boolean;
  offer_title: string | null;
  offer_description: string | null;
  offer_expires_at: string | null;
  offer_created_at: string | null;
  // Billing
  billing_interval: 'monthly' | 'annual';
  // Admin
  no_contact: boolean;
  admin_notes: string | null;
  // PWA
  pwa_installed_at: string | null;
}


interface Stats {
  totalCustomers: number;
  activeCustomers: number;
  totalVisits: number;
  totalRedemptions: number;
  pushSubscribers: number;
  pushSent: number;
  pendingPoints: number;
  weeklyScans: number;
  lastVisitDate: string | null;
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
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

// --- Health Score ---

function computeHealthScore(
  merchant: Merchant,
  totalCustomers: number,
  weeklyScans: number,
  lastVisitDate: string | null,
): number {
  let score = 0;
  if (merchant.reward_description) score += 15;
  if (merchant.logo_url) score += 10;
  if (merchant.instagram_url || merchant.facebook_url || merchant.tiktok_url) score += 5;
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
  if (merchant.tier2_enabled) score += 5;
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

export default function MerchantDetailPage() {
  const params = useParams();
  const merchantId = params.id as string;

  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalCustomers: 0,
    activeCustomers: 0,
    totalVisits: 0,
    totalRedemptions: 0,
    pushSubscribers: 0,
    pushSent: 0,
    pendingPoints: 0,
    weeklyScans: 0,
    lastVisitDate: null,
    totalReferrals: 0,
    pendingReferrals: 0,
    completedReferrals: 0,
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
        // H5: Single API call with service_role — bypasses RLS restrictions
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

  // Generate QR code when merchant is loaded
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
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getDaysRemaining = (trialEndsAt: string | null) => {
    if (!trialEndsAt) return null;
    const end = new Date(trialEndsAt);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getStatusBadge = (merchant: Merchant) => {
    switch (merchant.subscription_status) {
      case 'trial': {
        const daysLeft = getDaysRemaining(merchant.trial_ends_at);
        return (
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-100 rounded-full">
              En essai
            </span>
            {daysLeft !== null && (
              <span className={cn(
                "text-sm",
                daysLeft <= 3 ? "text-red-600 font-medium" : "text-gray-500"
              )}>
                {daysLeft <= 0 ? "Expiré" : `${daysLeft} jour${daysLeft > 1 ? 's' : ''} restant${daysLeft > 1 ? 's' : ''}`}
              </span>
            )}
          </div>
        );
      }
      case 'active':
        return (
          <span className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 rounded-full">
            Actif {merchant.billing_interval === 'annual' ? 'annuel' : 'mensuel'}
          </span>
        );
      case 'canceled':
        return (
          <span className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 rounded-full">
            Annulé
          </span>
        );
      default:
        return (
          <span className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-full">
            {merchant.subscription_status}
          </span>
        );
    }
  };

  const formatPhoneForWhatsApp = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    // Legacy local format → assume French
    if (cleaned.startsWith('0')) return '33' + cleaned.substring(1);
    // Already E.164 (33xxx, 32xxx, 41xxx, 352xxx...)
    return cleaned;
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

  const getWhatsAppMarketing = (name: string, customers: number): { label: string; text: string }[] => [
    { label: 'Aide config', text: `Hello ${name} ! C'est Elodie de Qarte. J'ai vu que votre programme n'etait pas encore finalise — on s'en occupe ensemble ? Ca prend 30 secondes, promis 😊` },
    { label: 'Relance douce', text: `Hello ${name} ! Elodie de Qarte. Votre compte est pret, il manque juste la recompense pour vos clients. Dites-moi ce que vous offrez d'habitude et je configure tout pour vous !` },
    { label: '1er scan', text: `Hello ${name} ! C'est Elodie de Qarte. Votre carte est prete ! Testez-la : scannez votre QR code, c'est 10 secondes et vous verrez exactement ce que vos clients voient 😊` },
    { label: 'Premier pas', text: `Hello ${name} ! Elodie de Qarte. Votre carte est superbe ! L'astuce : montrez le QR code a vos 3 prochains clients au moment de payer. C'est tout, on s'occupe du reste 😍` },
    { label: 'Challenge', text: `Hello ${name} ! Petit defi : montrez votre QR Qarte a 5 clients aujourd'hui. Vous allez voir, la reaction c'est toujours la meme : "ah trop bien !" 😄` },
    { label: 'Affichage QR', text: `Hello ${name} ! Elodie de Qarte. L'astuce qui change tout : collez le QR code pres de la caisse. Les clients le scannent tout seuls — vous n'avez plus rien a faire 📱` },
    { label: 'Fin essai', text: `Hello ${name} ! C'est Elodie. Votre essai Qarte se termine bientot${customers > 0 ? ` et vos ${customers} clients comptent sur leur carte` : ''}. Avec le code QARTE50 c'est 9€ au lieu de 19€ le premier mois. On continue ensemble ? 😊` },
    { label: 'Accompagnement', text: `Hello ${name} ! Elodie de Qarte. Comment ca se passe ? Des questions avant la fin de l'essai ? Je suis la, on peut meme s'appeler 2 min si vous voulez 📞` },
    { label: 'Relance expiree', text: `Hello ${name} ! C'est Elodie de Qarte. Votre essai est termine mais rien n'est perdu ! ${customers > 0 ? `Vos ${customers} clients gardent leur carte. ` : ''}Le code QARTE50 vous offre le premier mois a 9€. On relance ? 😊` },
    { label: 'Question ouverte', text: `Hello ${name} ! Elodie de Qarte. Est-ce qu'il y a eu un truc qui a coince pendant l'essai ? Vos retours m'aident beaucoup — et je peux surement debloquer ca 🙏` },
    { label: 'Prise de nouvelles', text: `Hello ${name} ! C'est Elodie de Qarte. Je prends des nouvelles — comment ca se passe au salon ? Un coup de main avec Qarte ? Je suis dispo 😊` },
    { label: 'Retention', text: `Hello ${name} ! C'est Elodie de Qarte. J'ai vu pour l'annulation — aucun souci ! Qu'est-ce qui vous a manque ? Vos retours m'aident vraiment a ameliorer Qarte 🙏` },
    { label: 'Bravo', text: `Hello ${name} ! C'est Elodie de Qarte. Bravo, deja ${customers} clients sur votre carte ! Vous savez que vous pouvez leur envoyer des notifications pour les faire revenir ? Je vous montre si vous voulez 🚀` },
    { label: 'Suivi', text: `Hello ${name} ! C'est Elodie de Qarte. Comment ca se passe avec la carte ? Vos clients sont contents ? Si vous avez des idees, je suis toute ouie 😊` },
    { label: 'Parrainage', text: `Hello ${name} ! Elodie de Qarte. Vous connaissez le parrainage ? Chaque client peut inviter un ami — les deux recoivent un cadeau. Ca s'active en 1 clic dans dashboard → Parrainage. C'est de l'acquisition gratuite ! 🤝` },
    { label: 'Message libre', text: `Hello ${name} ! C'est Elodie de Qarte. ` },
  ];

  const getWhatsAppTuto = (name: string): { label: string; text: string }[] => [
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
    { label: 'L\'abonnement', text: `Hello ${name} ! Qarte c'est 19€/mois sans engagement, clients illimites. Vous gerez tout depuis dashboard → Abonnement 💳` },
  ];


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
        <Link href="/admin/merchants">
          <Button>Retour à la liste</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between pt-10 lg:pt-0">
        <div className="flex items-center gap-4">
          <Link href="/admin/merchants">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </Link>
        </div>
      </div>

      {/* Info commerçant */}
      <div className="bg-white rounded-lg shadow-md border border-gray-100 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 font-bold text-xl sm:text-2xl text-white rounded-lg bg-[#5167fc] flex-shrink-0">
              {merchant.shop_name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{merchant.shop_name}</h1>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[#5167fc]/10 text-[#5167fc]">
                  {SHOP_TYPES[merchant.shop_type] || merchant.shop_type}
                </span>
                <span className="text-xs text-gray-500">
                  {{ FR: '🇫🇷', BE: '🇧🇪', CH: '🇨🇭', LU: '🇱🇺' }[merchant.country] || ''} {merchant.country}
                </span>
              </div>
              {merchant.shop_address && (
                <p className="text-gray-600 flex items-center gap-1 mt-1">
                  <MapPin className="w-4 h-4" />
                  {merchant.shop_address}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-4 mt-2 text-gray-500">
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {merchant.phone}
                </span>
                {userEmail && (
                  <button
                    onClick={handleCopyEmail}
                    className="flex items-center gap-1 hover:text-[#5167fc] transition-colors group"
                    title="Cliquer pour copier l'email"
                  >
                    <Mail className="w-4 h-4" />
                    <span>{userEmail}</span>
                    {emailCopied ? (
                      <Check className="w-3 h-3 text-green-600" />
                    ) : (
                      <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Inscrit le {formatDate(merchant.created_at)}
                </span>
                <span className="flex items-center gap-1 text-xs">
                  <Clock className="w-3.5 h-3.5" />
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
          <div className="flex flex-wrap items-center gap-2">
            {getStatusBadge(merchant)}
            <HealthDot score={computeHealthScore(merchant, stats.totalCustomers, stats.weeklyScans, stats.lastVisitDate)} />
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
            <span className={cn(
              "px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1",
              merchant.referral_program_enabled
                ? "text-violet-700 bg-violet-100"
                : "text-gray-500 bg-gray-100"
            )}>
              <Share2 className="w-3 h-3" />
              Parrainage {merchant.referral_program_enabled ? 'actif' : 'inactif'}
            </span>
            <span className={cn(
              "px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1",
              merchant.birthday_gift_enabled
                ? "text-pink-700 bg-pink-100"
                : "text-gray-500 bg-gray-100"
            )}>
              <Cake className="w-3 h-3" />
              Anniversaire {merchant.birthday_gift_enabled ? 'actif' : 'inactif'}
            </span>
            {stats.pendingPoints > 0 && (
              <span className="px-2 py-1 text-xs font-medium text-amber-700 bg-amber-100 rounded-full flex items-center gap-1">
                <Shield className="w-3 h-3" />
                {stats.pendingPoints} point{stats.pendingPoints > 1 ? 's' : ''} en attente
              </span>
            )}
            <span className={cn(
              "px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1",
              merchant.shield_enabled
                ? "text-green-700 bg-green-100"
                : "text-gray-500 bg-gray-100"
            )}>
              <Shield className="w-3 h-3" />
              Shield {merchant.shield_enabled ? 'actif' : 'inactif'}
            </span>
            {merchant.double_days_enabled && (
              <span className="px-2 py-1 text-xs font-medium text-amber-700 bg-amber-100 rounded-full flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Jours x2 : {(() => {
                  try {
                    const days = JSON.parse(merchant.double_days_of_week || '[]') as number[];
                    const labels = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
                    return days.map((d: number) => labels[d]).join(', ');
                  } catch { return '—'; }
                })()}
              </span>
            )}
          </div>
        </div>

        {/* Admin — Ne pas contacter + Notes */}
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
            {savingField === 'no_contact' ? (
              <Loader2Icon className="w-4 h-4 animate-spin" />
            ) : (
              <Ban className="w-4 h-4" />
            )}
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
            {savingField === 'admin_notes' && (
              <Loader2Icon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
            )}
          </div>
        </div>

        {/* Actions rapides */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          {userEmail ? (
            <a
              href={`mailto:${userEmail}`}
              className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
            >
              <Mail className="w-4 h-4" />
              Email
            </a>
          ) : (
            <div className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-400 bg-gray-100 rounded-xl cursor-not-allowed">
              <Mail className="w-4 h-4" />
              Email
            </div>
          )}
          <a
            href={`tel:${merchant.phone}`}
            className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
          >
            <PhoneCall className="w-4 h-4" />
            Appeler
          </a>
        </div>

        {/* WhatsApp — menu repliable */}
        {merchant.phone && !merchant.no_contact && (
          <div className="mt-4">
            <button
              onClick={() => setWaOpen(!waOpen)}
              className="w-full flex items-center justify-between px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors"
            >
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <span className="font-semibold text-sm">WhatsApp</span>
              </div>
              <ChevronDown className={cn("w-4 h-4 transition-transform", waOpen && "rotate-180")} />
            </button>
            {waOpen && (
              <div className="mt-2">
                <div className="flex gap-1 mb-2">
                  <button
                    onClick={() => setWaTab('marketing')}
                    className={cn("px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors", waTab === 'marketing' ? "bg-green-600 text-white" : "bg-green-50 text-green-700 hover:bg-green-100")}
                  >
                    Marketing
                  </button>
                  <button
                    onClick={() => setWaTab('tuto')}
                    className={cn("px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors", waTab === 'tuto' ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100")}
                  >
                    Tuto / Explication
                  </button>
                </div>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {(waTab === 'marketing'
                    ? getWhatsAppMarketing(merchant.shop_name, stats.totalCustomers)
                    : getWhatsAppTuto(merchant.shop_name)
                  ).map((msg, i) => (
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

        {/* Programme de fidélité */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {/* Palier 1 */}
          <div className="p-4 bg-[#5167fc]/5 rounded-lg border border-[#5167fc]/10">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-5 h-5 text-[#5167fc]" />
              <span className="font-medium text-gray-900">Palier 1</span>
            </div>
            <p className="text-gray-700">
              <span className="font-semibold">{merchant.stamps_required} passages</span> pour obtenir : {merchant.reward_description || 'Non configuré'}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[#5167fc]/10 text-[#5167fc]">
                Mode: Par visite
              </span>
            </div>
          </div>

          {/* Palier 2 */}
          {merchant.tier2_enabled && merchant.tier2_stamps_required && (
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-5 h-5 text-amber-600" />
                <span className="font-medium text-gray-900">Palier 2</span>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                  Actif
                </span>
              </div>
              <p className="text-gray-700">
                <span className="font-semibold">{merchant.tier2_stamps_required} passages</span> pour obtenir : {merchant.tier2_reward_description || 'Non configuré'}
              </p>
            </div>
          )}

          {/* Palier 2 non activé */}
          {!merchant.tier2_enabled && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-5 h-5 text-gray-400" />
                <span className="font-medium text-gray-500">Palier 2</span>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-500">
                  Non activé
                </span>
              </div>
              <p className="text-gray-500 text-sm">
                Le commerçant n'a pas activé le second palier de récompense.
              </p>
            </div>
          )}
        </div>

        {/* Cadeau anniversaire */}
        {merchant.birthday_gift_enabled && (
          <div className="mt-4 p-4 bg-pink-50 rounded-lg border border-pink-200">
            <div className="flex items-center gap-2 mb-2">
              <Cake className="w-5 h-5 text-pink-600" />
              <span className="font-medium text-gray-900">Cadeau anniversaire</span>
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-pink-100 text-pink-700">
                Actif
              </span>
            </div>
            <p className="text-gray-700 text-sm">
              {merchant.birthday_gift_description || 'Description non configurée'}
            </p>
          </div>
        )}

        {/* Parrainage */}
        {merchant.referral_program_enabled && (merchant.referral_reward_referrer || merchant.referral_reward_referred) && (
          <div className="mt-4 p-4 bg-violet-50 rounded-lg border border-violet-200">
            <div className="flex items-center gap-2 mb-3">
              <Share2 className="w-5 h-5 text-violet-600" />
              <span className="font-medium text-gray-900">Récompenses parrainage</span>
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-violet-100 text-violet-700">
                Actif
              </span>
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
          </div>
        )}

        {/* Stats parrainage */}
        {stats.totalReferrals > 0 && (
          <div className="mt-4 p-4 bg-violet-50/50 rounded-lg border border-violet-100">
            <div className="flex items-center gap-2 mb-3">
              <Share2 className="w-5 h-5 text-violet-600" />
              <span className="font-medium text-gray-900">Parrainages</span>
              <span className="text-xs text-gray-500">({stats.totalReferrals} au total)</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2.5 bg-white rounded-lg">
                <p className="text-xl font-bold text-violet-700">{stats.totalReferrals}</p>
                <p className="text-[11px] text-gray-500 font-medium">Total</p>
              </div>
              <div className="text-center p-2.5 bg-white rounded-lg">
                <p className="text-xl font-bold text-amber-600">{stats.pendingReferrals}</p>
                <p className="text-[11px] text-gray-500 font-medium">En cours</p>
              </div>
              <div className="text-center p-2.5 bg-white rounded-lg">
                <p className="text-xl font-bold text-green-600">{stats.completedReferrals}</p>
                <p className="text-[11px] text-gray-500 font-medium">Finalisés</p>
              </div>
            </div>
          </div>
        )}

        {/* Current Temporary Offer */}
        {merchant.offer_active && merchant.offer_title && (
          <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-amber-600" />
                <span className="font-medium text-amber-900">Offre temporaire en cours</span>
              </div>
              {merchant.offer_expires_at && (
                <span className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-full",
                  new Date(merchant.offer_expires_at) < new Date()
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                )}>
                  {new Date(merchant.offer_expires_at) < new Date()
                    ? "Expirée"
                    : `Expire le ${formatDate(merchant.offer_expires_at)}`}
                </span>
              )}
            </div>
            <p className="font-semibold text-amber-800">{merchant.offer_title}</p>
            {merchant.offer_description && (
              <p className="text-amber-700 text-sm mt-1">{merchant.offer_description}</p>
            )}
          </div>
        )}

        {/* Programmes d'adhésion */}
        {memberPrograms.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#5167fc]" />
              Programmes d&apos;adhésion ({memberPrograms.length})
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {memberPrograms.map((program) => {
                const memberCount = program.member_cards?.[0]?.count || 0;
                return (
                  <div
                    key={program.id}
                    className={cn(
                      "p-4 rounded-lg border",
                      program.is_active
                        ? "bg-[#5167fc]/5 border-[#5167fc]/20"
                        : "bg-gray-50 border-gray-200"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900">{program.name}</span>
                      <span className={cn(
                        "px-2 py-0.5 text-xs font-medium rounded-full",
                        program.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 text-gray-600"
                      )}>
                        {program.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{program.benefit_label}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Durée: {program.duration_months >= 1 ? `${program.duration_months} mois` : `${Math.round(program.duration_months * 30)} jours`}</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {memberCount} membre{memberCount > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Progression onboarding */}
        {(() => {
          const checklistItems = [
            { label: 'Programme configuré', done: !!merchant.reward_description },
            { label: 'Logo ajouté', done: !!merchant.logo_url },
            { label: 'Réseau social ajouté', done: !!(merchant.instagram_url || merchant.facebook_url || merchant.tiktok_url) },
            { label: 'QR code téléchargé', done: stats.totalVisits > 0 },
            { label: 'Premiers scans obtenus', done: stats.totalVisits >= 2 },
          ];
          const doneCount = checklistItems.filter(i => i.done).length;
          return (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-[#5167fc]" />
                Progression onboarding
                <span className="text-sm font-normal text-gray-500">
                  {doneCount}/{checklistItems.length}
                </span>
              </h3>
              <div className="h-2 bg-gray-200/60 rounded-full mb-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#5167fc] to-violet-500 rounded-full transition-all"
                  style={{ width: `${(doneCount / checklistItems.length) * 100}%` }}
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {checklistItems.map((item) => (
                  <div
                    key={item.label}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
                      item.done
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-50 text-gray-400"
                    )}
                  >
                    {item.done ? (
                      <Check className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                    )}
                    <span className={item.done ? '' : 'line-through'}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Liens & Réseaux */}
        {(merchant.slug || merchant.instagram_url || merchant.facebook_url || merchant.tiktok_url || merchant.booking_url || merchant.review_link) && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-[#5167fc]" />
              Liens & Réseaux
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {merchant.slug && (
                <a
                  href={`/p/${merchant.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#5167fc]/30 bg-[#5167fc]/5 hover:bg-[#5167fc]/10 text-sm text-[#5167fc] font-medium transition-colors"
                >
                  <Share2 className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">Page programme</span>
                </a>
              )}
              {merchant.instagram_url && (
                <a
                  href={merchant.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-sm text-gray-700 hover:text-[#5167fc] transition-colors"
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                  <span className="truncate">Instagram</span>
                </a>
              )}
              {merchant.facebook_url && (
                <a
                  href={merchant.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-sm text-gray-700 hover:text-[#5167fc] transition-colors"
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span className="truncate">Facebook</span>
                </a>
              )}
              {merchant.tiktok_url && (
                <a
                  href={merchant.tiktok_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-sm text-gray-700 hover:text-[#5167fc] transition-colors"
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                  </svg>
                  <span className="truncate">TikTok</span>
                </a>
              )}
              {merchant.booking_url && (
                <a
                  href={merchant.booking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-sm text-gray-700 hover:text-[#5167fc] transition-colors"
                >
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">Réservation</span>
                </a>
              )}
              {merchant.review_link && (
                <a
                  href={merchant.review_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-sm text-gray-700 hover:text-[#5167fc] transition-colors"
                >
                  <Star className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">Avis Google</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* QR Code Section — repliable */}
      <div className="bg-white rounded-lg shadow-md border border-gray-100">
        <button
          onClick={() => setQrOpen(!qrOpen)}
          className="w-full flex items-center justify-between p-6 text-left"
        >
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-[#5167fc]" />
            QR Code de scan
          </h3>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${qrOpen ? 'rotate-180' : ''}`} />
        </button>
        {qrOpen && (
          <div className="px-6 pb-6 flex flex-col sm:flex-row gap-6 items-start">
            {/* QR Code */}
            <div className="flex-shrink-0">
              {qrCodeUrl ? (
                <div className="p-3 bg-white border-2 border-gray-200 rounded-xl">
                  <img
                    src={qrCodeUrl}
                    alt={`QR Code pour ${merchant.shop_name}`}
                    className="w-40 h-40"
                  />
                </div>
              ) : (
                <div className="w-40 h-40 bg-gray-100 rounded-xl flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#5167fc]" />
                </div>
              )}
            </div>

            {/* Link Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-600 mb-3">
                Lien de scan client pour ce commerce :
              </p>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <code className="text-sm text-[#5167fc] font-mono truncate flex-1">
                  {getScanUrl(merchant.scan_code)}
                </code>
                <button
                  onClick={handleCopyLink}
                  className="flex-shrink-0 p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Copier le lien"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Code de scan : <span className="font-mono font-medium">{merchant.scan_code}</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Stats - Row 1 */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="p-5 bg-white rounded-lg shadow-md border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#5167fc]/10">
              <Users className="w-5 h-5 text-[#5167fc]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
              <p className="text-sm text-gray-500">Clients inscrits</p>
            </div>
          </div>
        </div>
        <div className="p-5 bg-white rounded-lg shadow-md border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-50">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.activeCustomers}</p>
              <p className="text-sm text-gray-500">Actifs (30j)</p>
            </div>
          </div>
        </div>
        <div className="p-5 bg-white rounded-lg shadow-md border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-50">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalVisits}</p>
              <p className="text-sm text-gray-500">Visites totales</p>
            </div>
          </div>
        </div>
        <div className="p-5 bg-white rounded-lg shadow-md border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-pink-50">
              <Gift className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalRedemptions}</p>
              <p className="text-sm text-gray-500">Récompenses</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats - Row 2: Push & Marketing */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
        <div className="p-5 bg-white rounded-lg shadow-md border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pushSubscribers}</p>
              <p className="text-sm text-gray-500">Abonnés push</p>
            </div>
          </div>
        </div>
        <div className="p-5 bg-white rounded-lg shadow-md border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-50">
              <Send className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pushSent}</p>
              <p className="text-sm text-gray-500">Notifs envoyées</p>
            </div>
          </div>
        </div>
        <div className={cn("p-5 rounded-lg shadow-md border", stats.pendingPoints > 0 ? "bg-amber-50 border-amber-200" : "bg-white border-gray-100")}>
          <div className="flex items-center gap-3">
            <div className={cn("flex items-center justify-center w-10 h-10 rounded-lg", stats.pendingPoints > 0 ? "bg-amber-100" : "bg-gray-50")}>
              <Shield className={cn("w-5 h-5", stats.pendingPoints > 0 ? "text-amber-600" : "text-gray-400")} />
            </div>
            <div>
              <p className={cn("text-2xl font-bold", stats.pendingPoints > 0 ? "text-amber-700" : "text-gray-900")}>{stats.pendingPoints}</p>
              <p className="text-sm text-gray-500">Points en attente</p>
            </div>
          </div>
        </div>
        <div className={cn("p-5 rounded-lg shadow-md border", merchant.pwa_installed_at ? "bg-green-50 border-green-200" : "bg-white border-gray-100")}>
          <div className="flex items-center gap-3">
            <div className={cn("flex items-center justify-center w-10 h-10 rounded-lg", merchant.pwa_installed_at ? "bg-green-100" : "bg-gray-50")}>
              <Smartphone className={cn("w-5 h-5", merchant.pwa_installed_at ? "text-green-600" : "text-gray-400")} />
            </div>
            <div>
              <p className={cn("text-2xl font-bold", merchant.pwa_installed_at ? "text-green-700" : "text-gray-900")}>
                {merchant.pwa_installed_at
                  ? new Date(merchant.pwa_installed_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                  : '—'}
              </p>
              <p className="text-sm text-gray-500">PWA Pro {merchant.pwa_installed_at ? 'Installée' : 'Non installée'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Activité */}
      {emailTrackings.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#5167fc]" />
            Activité ({emailTrackings.length})
          </h3>
          <div className="space-y-2">
            {emailTrackings.map((t, i) => {
              const labels: Record<number, string> = {
                [-100]: 'Premier scan',
                [-101]: 'Première récompense',
                [-102]: 'Upsell Tier 2',
                [-103]: 'QR code & kit promo',
                [-104]: 'Challenge complété',
                [-105]: 'QR téléchargé',
                [-108]: 'Kit réseaux téléchargé',
                [-106]: 'Script 1er client (config +2j)',
                [-107]: 'Relance 0 scan (config +4j)',
                [-110]: 'Relance inactif J+7',
                [-111]: 'Relance inactif J+14',
                [-112]: 'Relance inactif J+30',
                [-113]: 'Relance grace period',
                [-120]: 'Auto-suggestion récompense',
                [-200]: 'Email de bienvenue',
                [-201]: 'Trial expire J-1',
                [-203]: 'Trial expire J-3',
                [-211]: 'Trial expiré +1j',
                [-212]: 'Trial expiré +2j',
                [-301]: 'Rappel config programme J+1',
                [-302]: 'Rappel config programme J+2',
                [-303]: 'Rappel config programme J+3',
                [-305]: 'Check-in J+5',
              };
              const label = labels[t.reminder_day] || `Code ${t.reminder_day}`;
              const date = new Date(t.sent_at).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
              });
              return (
                <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      t.reminder_day < 0 ? "bg-green-500" : "bg-amber-500"
                    )} />
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                  </div>
                  <span className="text-xs text-gray-500">{date}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
