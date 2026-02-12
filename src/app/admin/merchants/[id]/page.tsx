'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Store,
  Phone,
  Calendar,
  Gift,
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
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { Button } from '@/components/ui';
import { cn, generateQRCode, getScanUrl } from '@/lib/utils';

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
  // Offer fields
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

export default function MerchantDetailPage() {
  const params = useParams();
  const supabase = getSupabase();
  const merchantId = params.id as string;

  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalCustomers: 0,
    activeCustomers: 0,
    totalVisits: 0,
    totalRedemptions: 0,
    pushSubscribers: 0,
    pushSent: 0,
  });
  const [memberPrograms, setMemberPrograms] = useState<MemberProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [emailTrackings, setEmailTrackings] = useState<{ reminder_day: number; sent_at: string }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupérer le commerçant
        const { data: merchantData, error: merchantError } = await supabase
          .from('merchants')
          .select('*')
          .eq('id', merchantId)
          .single();

        if (merchantError) throw merchantError;
        setMerchant(merchantData);

        // Récupérer les stats - count loyalty cards (customers is global, no merchant_id)
        const { count: totalCustomers } = await supabase
          .from('loyalty_cards')
          .select('*', { count: 'exact', head: true })
          .eq('merchant_id', merchantId);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { count: activeCustomers } = await supabase
          .from('loyalty_cards')
          .select('*', { count: 'exact', head: true })
          .eq('merchant_id', merchantId)
          .gte('last_visit_date', thirtyDaysAgo.toISOString().split('T')[0]);

        const { count: totalVisits } = await supabase
          .from('visits')
          .select('*', { count: 'exact', head: true })
          .eq('merchant_id', merchantId);

        const { count: totalRedemptions } = await supabase
          .from('redemptions')
          .select('*', { count: 'exact', head: true })
          .eq('merchant_id', merchantId);

        // Get push stats and email via admin API (uses service role to bypass RLS)
        let pushSubscribers = 0;
        let pushSentCount = 0;
        try {
          const pushStatsRes = await fetch(`/api/admin/merchants/${merchantId}`);
          if (pushStatsRes.ok) {
            const pushStats = await pushStatsRes.json();
            pushSubscribers = pushStats.pushSubscribers || 0;
            pushSentCount = pushStats.pushSent || 0;
            if (pushStats.userEmail) {
              setUserEmail(pushStats.userEmail);
            }
          }
        } catch (e) {
          console.error('Error fetching push stats:', e);
        }

        // Get member programs for this merchant
        const { data: programs } = await supabase
          .from('member_programs')
          .select('*, member_cards(count)')
          .eq('merchant_id', merchantId)
          .order('created_at', { ascending: false });

        setMemberPrograms(programs || []);

        // Fetch email tracking
        const { data: trackings } = await supabase
          .from('pending_email_tracking')
          .select('reminder_day, sent_at')
          .eq('merchant_id', merchantId)
          .order('sent_at', { ascending: false });
        setEmailTrackings(trackings || []);

        setStats({
          totalCustomers: totalCustomers || 0,
          activeCustomers: activeCustomers || 0,
          totalVisits: totalVisits || 0,
          totalRedemptions: totalRedemptions || 0,
          pushSubscribers,
          pushSent: pushSentCount || 0,
        });
      } catch (error) {
        console.error('Error fetching merchant data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [merchantId, supabase]);

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
            Abonné actif
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

  const openWhatsApp = (phone: string, name?: string) => {
    const formattedPhone = formatPhoneForWhatsApp(phone);
    const message = encodeURIComponent(name ? `Bonjour ${name}, ` : 'Bonjour, ');
    window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank');
  };


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
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{merchant.shop_name}</h1>
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
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {getStatusBadge(merchant)}
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

        {/* Actions rapides */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <button
            onClick={() => openWhatsApp(merchant.phone, merchant.shop_name)}
            className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">WhatsApp</span>
            <span className="sm:hidden">WA</span>
          </button>
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

        {/* Liens & Réseaux */}
        {(merchant.instagram_url || merchant.facebook_url || merchant.tiktok_url || merchant.booking_url || merchant.review_link) && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-[#5167fc]" />
              Liens & Réseaux
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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

      {/* QR Code Section */}
      <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <QrCode className="w-5 h-5 text-[#5167fc]" />
          QR Code de scan
        </h3>
        <div className="flex flex-col sm:flex-row gap-6 items-start">
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
      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3">
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
      </div>

      {/* Emails envoyés */}
      {emailTrackings.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#5167fc]" />
            Emails envoyés ({emailTrackings.length})
          </h3>
          <div className="space-y-2">
            {emailTrackings.map((t, i) => {
              const labels: Record<number, string> = {
                1: 'Rappel programme J+1',
                2: 'Rappel programme J+2',
                3: 'Rappel programme J+3',
                5: 'Check-in J+5',
                7: 'Inactif J+7',
                14: 'Inactif J+14',
                30: 'Inactif J+30',
                [-100]: 'Premier scan',
                [-101]: 'Première récompense',
                [-102]: 'Upsell Tier 2',
                [-103]: 'QR code & kit promo',
                [-104]: 'Social kit (ancien)',
                [-105]: 'QR téléchargé',
                [-106]: 'Script verbal J+2',
                [-107]: 'Check-in J+4',
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
