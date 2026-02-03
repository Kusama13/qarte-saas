'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  Trash2,
  AlertTriangle,
  QrCode,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
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
  const router = useRouter();
  const supabase = createClientComponentClient();
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const handleDelete = async () => {
    if (deleteConfirmText !== 'SUPPRIMER') return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/merchants/${merchantId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      router.push('/admin/merchants');
    } catch (error) {
      console.error('Delete error:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

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

        // Get push stats via admin API (uses service role to bypass RLS)
        let pushSubscribers = 0;
        let pushSentCount = 0;
        try {
          const pushStatsRes = await fetch(`/api/admin/merchants/${merchantId}`);
          if (pushStatsRes.ok) {
            const pushStats = await pushStatsRes.json();
            pushSubscribers = pushStats.pushSubscribers || 0;
            pushSentCount = pushStats.pushSent || 0;
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
      case 'cancelled':
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
      <div className="flex items-start justify-between">
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
      <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-16 h-16 font-bold text-2xl text-white rounded-lg bg-[#5167fc]">
              {merchant.shop_name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{merchant.shop_name}</h1>
              {merchant.shop_address && (
                <p className="text-gray-600 flex items-center gap-1 mt-1">
                  <MapPin className="w-4 h-4" />
                  {merchant.shop_address}
                </p>
              )}
              <div className="flex items-center gap-4 mt-2 text-gray-500">
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {merchant.phone}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Inscrit le {formatDate(merchant.created_at)}
                </span>
              </div>
            </div>
          </div>
          {getStatusBadge(merchant)}
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
              <span className="font-semibold">{merchant.stamps_required} {merchant.loyalty_mode === 'article' ? 'articles' : 'passages'}</span> pour obtenir : {merchant.reward_description || 'Non configuré'}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[#5167fc]/10 text-[#5167fc]">
                Mode: {merchant.loyalty_mode === 'article' ? 'Par article' : 'Par visite'}
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
                <span className="font-semibold">{merchant.tier2_stamps_required} {merchant.loyalty_mode === 'article' ? 'articles' : 'passages'}</span> pour obtenir : {merchant.tier2_reward_description || 'Non configuré'}
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
              <a
                href={getScanUrl(merchant.scan_code)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 p-2 hover:bg-gray-200 rounded-lg transition-colors"
                title="Ouvrir le lien"
              >
                <ExternalLink className="w-4 h-4 text-gray-600" />
              </a>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Code de scan : <span className="font-mono font-medium">{merchant.scan_code}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Stats - Row 1 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
      <div className="grid gap-4 sm:grid-cols-3">
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

      {/* Zone Danger */}
      <div className="p-6 bg-red-50 rounded-lg border border-red-200">
        <h3 className="text-lg font-semibold text-red-800 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Zone Danger
        </h3>
        <p className="text-red-700 mt-2 mb-4">
          Supprimer ce commerçant effacera définitivement toutes ses données : clients, visites, récompenses, notifications push, etc.
        </p>
        <Button
          variant="outline"
          className="border-red-300 text-red-700 hover:bg-red-100"
          onClick={() => setShowDeleteModal(true)}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Supprimer ce commerçant
        </Button>
      </div>

      {/* Modal de confirmation */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Supprimer {merchant.shop_name} ?</h3>
                <p className="text-sm text-gray-500">Cette action est irréversible</p>
              </div>
            </div>

            <div className="mb-4 p-3 bg-red-50 rounded-lg text-sm text-red-800">
              <p className="font-medium mb-1">Données qui seront supprimées :</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>{stats.totalCustomers} clients</li>
                <li>{stats.totalVisits} visites</li>
                <li>{stats.totalRedemptions} récompenses</li>
                <li>{stats.pushSubscribers} abonnés push</li>
                <li>Toutes les notifications et historiques</li>
              </ul>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tapez <span className="font-bold text-red-600">SUPPRIMER</span> pour confirmer
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="SUPPRIMER"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                disabled={deleting}
              >
                Annuler
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={handleDelete}
                disabled={deleteConfirmText !== 'SUPPRIMER' || deleting}
              >
                {deleting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Suppression...
                  </span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
