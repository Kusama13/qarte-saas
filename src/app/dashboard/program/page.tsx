'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Upload,
  Palette,
  Save,
  Loader2,
  Image as ImageIcon,
  Check,
  Star,
  AlertTriangle,
  Sparkles,
  Trophy,
  Gift,
  Target,
  ChevronDown,
  Instagram,
  CalendarDays,
  Globe,
  QrCode,
  Smartphone,
  TrendingUp,
  Users as UsersIcon,
} from 'lucide-react';
import { Input } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { MerchantSettingsForm, type LoyaltySettings } from '@/components/loyalty';
import { compressLogo } from '@/lib/image-compression';
import { useMerchant } from '@/contexts/MerchantContext';
import type { Merchant } from '@/types';


const SHOP_TYPE_LABELS: Record<string, string> = {
  coiffeur: 'salons de coiffure',
  barbier: 'barber shops',
  institut_beaute: 'instituts de beauté',
  onglerie: 'nail bars',
  spa: 'spas et centres bien-être',
  estheticienne: 'esthéticiennes',
  tatouage: 'studios de tatouage',
  autre: 'commerces',
};

// 6 palettes mobile (3x2) + 4 desktop-only (2x5)
const COLOR_PALETTES = [
  { primary: '#1e293b', secondary: '#475569', name: 'Élégant', icon: '✂️' },
  { primary: '#db2777', secondary: '#f472b6', name: 'Glamour', icon: '💅' },
  { primary: '#7c3aed', secondary: '#a78bfa', name: 'Moderne', icon: '💜', desktopOnly: true },
  { primary: '#059669', secondary: '#10b981', name: 'Zen', icon: '🧘' },
  { primary: '#92704f', secondary: '#c8a97e', name: 'Sable', icon: '🏖️' },
  { primary: '#b45309', secondary: '#f59e0b', name: 'Doré', icon: '👑' },
  { primary: '#0891b2', secondary: '#22d3ee', name: 'Frais', icon: '💎', desktopOnly: true },
  { primary: '#0f766e', secondary: '#2dd4bf', name: 'Menthe', icon: '🍃', desktopOnly: true },
  { primary: '#6d28d9', secondary: '#c084fc', name: 'Orchidée', icon: '🪻' },
  { primary: '#be185d', secondary: '#fb7185', name: 'Corail', icon: '🌺', desktopOnly: true },
];

// Suggestions récompenses palier 2 (plus premium que palier 1)
const TIER2_REWARD_SUGGESTIONS: Record<string, string[]> = {
  coiffeur: [
    '1 couleur complète offerte',
    '1 soin + coupe offerts',
    '1 balayage offert',
    '-30% sur une prestation au choix',
  ],
  barbier: [
    '1 forfait complet offert',
    '1 soin barbe + coupe offerts',
    '1 coloration barbe offerte',
    '-30% sur une prestation',
  ],
  institut_beaute: [
    '1 soin complet offert',
    '1 forfait visage + corps',
    '1 soin anti-âge offert',
    '-30% sur une prestation au choix',
  ],
  onglerie: [
    '1 pose + nail art offerts',
    '1 manucure + pédicure offertes',
    '1 forfait spa mains + pieds',
    '-30% sur le prochain rdv',
  ],
  spa: [
    '1 massage 1h offert',
    '1 forfait détente complet',
    '1 rituel duo offert',
    '-30% sur un soin premium',
  ],
  estheticienne: [
    '1 soin complet offert',
    '1 forfait visage premium',
    '1 soin anti-âge offert',
    '-30% sur une prestation au choix',
  ],
  tatouage: [
    '1 retouche complète offerte',
    '1 piercing offert',
    '-20% sur le prochain tatouage',
    '1 consultation design offerte',
  ],
  autre: [
    '1 prestation premium offerte',
    '1 forfait complet offert',
    'Un cadeau VIP',
    '-30% sur le prochain passage',
  ],
};

export default function ProgramPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refetch: refetchMerchantContext } = useMerchant();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isFirstSetup, setIsFirstSetup] = useState(false);

  // Main form data (saved to DB)
  const [formData, setFormData] = useState({
    logoUrl: '',
    primaryColor: '#654EDA',
    secondaryColor: '#9D8FE8',
    reviewLink: '',
    instagramUrl: '',
    facebookUrl: '',
    tiktokUrl: '',
    bookingUrl: '',
    stampsRequired: 5,
    rewardDescription: '',
    // 2nd tier reward
    tier2Enabled: false,
    tier2StampsRequired: 0,
    tier2RewardDescription: '',
  });

  // Track original stamps required for warning
  const [originalStampsRequired, setOriginalStampsRequired] = useState(10);
  const [showStampsWarning, setShowStampsWarning] = useState(false);
  const [tier2Error, setTier2Error] = useState('');
  const [socialOpen, setSocialOpen] = useState(searchParams.get('section') === 'social');
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);

  // Auto-scroll to social section when coming from onboarding checklist
  useEffect(() => {
    if (searchParams.get('section') === 'social' && !loading) {
      requestAnimationFrame(() => {
        document.getElementById('social-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  }, [searchParams, loading]);

  useEffect(() => {
    const fetchMerchant = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/merchant');
        return;
      }

      const { data } = await supabase
        .from('merchants')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setMerchant(data);
        setFormData({
          logoUrl: data.logo_url || '',
          primaryColor: data.primary_color || '#654EDA',
          secondaryColor: data.secondary_color || '#9D8FE8',
          reviewLink: data.review_link || '',
          instagramUrl: data.instagram_url || '',
          facebookUrl: data.facebook_url || '',
          tiktokUrl: data.tiktok_url || '',
          bookingUrl: data.booking_url || '',
          stampsRequired: data.stamps_required || 5,
          rewardDescription: data.reward_description || '',
          tier2Enabled: data.tier2_enabled || false,
          tier2StampsRequired: data.tier2_stamps_required || 0,
          tier2RewardDescription: data.tier2_reward_description || '',
        });
        setOriginalStampsRequired(data.stamps_required || 5);
        if (!data.reward_description) {
          setIsFirstSetup(true);
        }
      }
      setLoading(false);
    };

    fetchMerchant();
  }, [router]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Compress logo before upload
      const compressedFile = await compressLogo(file);

      const fileExt = file.name.split('.').pop();
      const fileName = `${merchant?.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, compressedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName);

      setFormData({ ...formData, logoUrl: publicUrl });
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };

  const normalizeUrl = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const normalizeSocialUrl = (value: string, platform: 'instagram' | 'facebook' | 'tiktok') => {
    const trimmed = value.trim();
    if (!trimmed) return '';
    // Already a URL
    if (/^https?:\/\//i.test(trimmed) || trimmed.includes('.com') || trimmed.includes('.fr')) {
      return normalizeUrl(trimmed);
    }
    // Username → build URL
    const username = trimmed.replace(/^@/, '');
    switch (platform) {
      case 'instagram': return `https://instagram.com/${username}`;
      case 'facebook': return `https://facebook.com/${username}`;
      case 'tiktok': return `https://tiktok.com/@${username}`;
    }
  };

  const handleSave = async () => {
    if (!merchant) return;
    if (!formData.rewardDescription.trim()) return;

    // Validate tier 2
    if (formData.tier2Enabled) {
      if (!formData.tier2RewardDescription.trim()) {
        setTier2Error('Veuillez entrer la récompense du palier 2');
        return;
      }
      if (!formData.tier2StampsRequired || formData.tier2StampsRequired <= 0) {
        setTier2Error('Veuillez entrer le nombre de passages requis pour le palier 2');
        return;
      }
      if (formData.tier2StampsRequired <= formData.stampsRequired) {
        setTier2Error(`Le palier 2 doit être supérieur au palier 1 (${formData.stampsRequired})`);
        return;
      }
    }
    setTier2Error('');

    setSaving(true);
    try {
      const { error } = await supabase
        .from('merchants')
        .update({
          logo_url: formData.logoUrl || null,
          primary_color: formData.primaryColor,
          secondary_color: formData.secondaryColor,
          review_link: normalizeUrl(formData.reviewLink) || null,
          instagram_url: normalizeSocialUrl(formData.instagramUrl, 'instagram') || null,
          facebook_url: normalizeSocialUrl(formData.facebookUrl, 'facebook') || null,
          tiktok_url: normalizeSocialUrl(formData.tiktokUrl, 'tiktok') || null,
          booking_url: normalizeUrl(formData.bookingUrl) || null,
          stamps_required: formData.stampsRequired,
          reward_description: formData.rewardDescription.trim(),
          loyalty_mode: 'visit',
          product_name: null,
          max_quantity_per_scan: 1,
          tier2_enabled: formData.tier2Enabled,
          tier2_stamps_required: formData.tier2Enabled ? formData.tier2StampsRequired : null,
          tier2_reward_description: formData.tier2Enabled ? formData.tier2RewardDescription.trim() : null,
        })
        .eq('id', merchant.id);

      if (error) throw error;

      // Update merchant cache so preview page loads with fresh data
      try {
        const updatedMerchant = {
          ...merchant,
          logo_url: formData.logoUrl || null,
          primary_color: formData.primaryColor,
          secondary_color: formData.secondaryColor,
          review_link: normalizeUrl(formData.reviewLink) || null,
          instagram_url: normalizeSocialUrl(formData.instagramUrl, 'instagram') || null,
          facebook_url: normalizeSocialUrl(formData.facebookUrl, 'facebook') || null,
          tiktok_url: normalizeSocialUrl(formData.tiktokUrl, 'tiktok') || null,
          booking_url: normalizeUrl(formData.bookingUrl) || null,
          stamps_required: formData.stampsRequired,
          reward_description: formData.rewardDescription.trim(),
          loyalty_mode: 'visit',
          tier2_enabled: formData.tier2Enabled,
          tier2_stamps_required: formData.tier2Enabled ? formData.tier2StampsRequired : null,
          tier2_reward_description: formData.tier2Enabled ? formData.tier2RewardDescription.trim() : null,
        };
        const { stripe_subscription_id, stripe_customer_id, scan_code, user_id, ...safeMerchant } = updatedMerchant;
        localStorage.setItem('qarte_merchant_cache', JSON.stringify({
          data: safeMerchant,
          timestamp: Date.now(),
          version: 1,
        }));
      } catch {}

      // Refresh MerchantContext so other pages (QR download, checklist) see updated data
      refetchMerchantContext();

      if (isFirstSetup) {
        // QR code email handled by cron morning (next day, more relevant timing)
        setShowTestModal(true);
        setSaving(false);
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleLoyaltySettingsChange = (settings: LoyaltySettings) => {
    setFormData(prev => ({
      ...prev,
      stampsRequired: settings.stamps_required,
      rewardDescription: settings.reward_description,
    }));

    // Show warning if stamps required increased
    if (settings.stamps_required > originalStampsRequired) {
      setShowStampsWarning(true);
    } else {
      setShowStampsWarning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Incentive banner */}
      <div className="mb-5 md:mb-8 p-4 md:p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-md">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">
              <span className="text-amber-600">1 client sur 3</span> ne revient jamais sans programme de fidélité
            </p>
            <p className="mt-1 text-xs text-gray-500 leading-relaxed">
              Des centaines de <strong className="text-gray-700">{SHOP_TYPE_LABELS[merchant?.shop_type || 'autre']}</strong> fidélisent déjà leurs clients avec <strong className="text-gray-700">Qarte</strong>.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-5 md:mb-10 p-4 md:p-6 rounded-2xl bg-[#4b0082]/[0.04] border border-[#4b0082]/[0.08]">
        <h1 className="text-xl md:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#4b0082] to-violet-600">
          Mon Programme
        </h1>
        <p className="mt-1 text-sm md:text-base text-gray-500 font-medium">
          Personnalisez votre programme de fidélité
        </p>
      </div>

      <div className="grid gap-3 md:gap-8">
        <div className="space-y-3 md:space-y-6">
          <div className="p-3 md:p-6 bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl shadow-indigo-100/40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 -mr-8 -mt-8 transition-transform duration-500 rounded-full bg-gradient-to-br from-indigo-50/50 to-violet-50/50 blur-3xl group-hover:scale-110" />

            <h3 className="relative flex items-center gap-2 md:gap-3 mb-3 md:mb-6 text-sm md:text-lg font-bold text-gray-900">
              <div className="flex items-center justify-center w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-200">
                <Upload className="w-3.5 h-3.5 md:w-5 md:h-5 text-white" />
              </div>
              Téléchargez votre logo ou une image de votre activité
            </h3>

            <div className="relative space-y-4 md:space-y-6">
              <div className="space-y-2 md:space-y-3">
                <div className="flex items-center gap-3 md:gap-5 p-3 md:p-4 transition-all border border-indigo-50 rounded-xl md:rounded-2xl bg-indigo-50/30 hover:bg-indigo-50/50">
                  <label className="relative flex items-center justify-center w-16 h-16 md:w-20 md:h-20 transition-all duration-300 bg-white border-2 border-dashed border-indigo-200 shadow-sm rounded-xl md:rounded-2xl cursor-pointer hover:border-indigo-500 hover:shadow-md group/upload">
                    {uploading ? (
                      <Loader2 className="w-7 h-7 text-indigo-500 animate-spin" />
                    ) : formData.logoUrl ? (
                      <div className="relative w-full h-full p-1">
                        <img
                          src={formData.logoUrl}
                          alt="Logo"
                          className="object-cover w-full h-full shadow-inner rounded-xl"
                        />
                        <div className="absolute inset-0 transition-opacity bg-black/10 opacity-0 group-hover/upload:opacity-100 rounded-xl flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <ImageIcon className="w-6 h-6 text-indigo-300 group-hover/upload:text-indigo-500 transition-colors" />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700">Format Recommandé</span>
                    <p className="text-xs text-gray-500">PNG, JPG ou SVG (max 2MB)</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="p-3 md:p-6 bg-white/60 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg shadow-indigo-100/50">
            <h3 className="flex items-center gap-2 md:gap-3 mb-3 md:mb-6 text-sm md:text-lg font-semibold text-gray-900">
              <div className="p-1.5 md:p-2.5 rounded-lg md:rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/30">
                <Palette className="w-3.5 h-3.5 md:w-5 md:h-5 text-white" />
              </div>
              Ambiance
            </h3>

            <div className="space-y-3 md:space-y-4">
              <label className="text-xs md:text-sm font-semibold tracking-wide text-gray-700 uppercase">Choisissez l&apos;ambiance de votre carte</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 md:gap-2">
                {COLOR_PALETTES.map((palette, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setFormData({ ...formData, primaryColor: palette.primary, secondaryColor: palette.secondary })}
                    className={`relative p-2 rounded-xl border-2 transition-all duration-300 group/palette ${
                      'desktopOnly' in palette && palette.desktopOnly ? 'hidden sm:block' : ''
                    } ${
                      formData.primaryColor === palette.primary && formData.secondaryColor === palette.secondary
                        ? 'border-indigo-600 ring-4 ring-indigo-500/10 shadow-lg'
                        : 'border-gray-100 hover:border-indigo-200 hover:shadow-md'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="flex gap-0.5">
                        <div className="w-5 h-5 rounded-l-md" style={{ backgroundColor: palette.primary }} />
                        <div className="w-5 h-5 rounded-r-md" style={{ backgroundColor: palette.secondary }} />
                      </div>
                      <span className="text-sm">{palette.icon}</span>
                      <span className="text-[8px] font-bold text-gray-500 uppercase tracking-wide">{palette.name}</span>
                    </div>
                    {formData.primaryColor === palette.primary && formData.secondaryColor === palette.secondary && (
                      <div className="absolute -top-1 -right-1">
                        <div className="p-0.5 bg-indigo-600 rounded-full shadow-sm">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

          </div>

          <div className="flex items-center gap-3 mt-4 mb-1">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-200 to-transparent" />
            <h2 className="text-sm md:text-base font-bold text-gray-500 uppercase tracking-wider">Récompenses</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-200 to-transparent" />
          </div>

          <div className="p-3 md:p-6 bg-gradient-to-br from-white via-white to-indigo-50/30 rounded-2xl shadow-lg shadow-indigo-200/50 border border-indigo-100/50 backdrop-blur-xl transition-all duration-300">
            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <div className="p-1.5 md:p-2.5 rounded-lg md:rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 shadow-lg shadow-indigo-200">
                <Gift className="w-3.5 h-3.5 md:w-5 md:h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm md:text-lg font-bold text-gray-900">1er Palier</h3>
                <p className="text-[11px] md:text-xs text-gray-500">Soyez généreux, nous conseillons 5 passages</p>
              </div>
            </div>
            <MerchantSettingsForm
              initialStampsRequired={formData.stampsRequired}
              initialRewardDescription={formData.rewardDescription}
              shopType={merchant?.shop_type}
              onChange={handleLoyaltySettingsChange}
            />

            {/* Warning when increasing stamps required */}
            {showStampsWarning && (
              <div className="mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-800 text-sm">Attention</p>
                  <p className="text-amber-700 text-sm mt-1">
                    Augmenter le nombre requis ne s&apos;appliquera qu&apos;aux <strong>nouveaux clients</strong>.
                    Les clients existants garderont leur objectif actuel.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 2nd Tier Reward Section */}
          <div className="p-3 md:p-6 bg-gradient-to-br from-white via-white to-violet-50/30 rounded-2xl shadow-lg shadow-violet-200/30 border border-violet-100/50 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3 md:mb-6">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="p-1.5 md:p-2.5 rounded-lg md:rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 shadow-lg shadow-violet-200">
                  <Trophy className="w-3.5 h-3.5 md:w-5 md:h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm md:text-lg font-bold text-gray-900">2ème Palier <span className="text-gray-400 font-medium text-xs md:text-sm">(facultatif)</span></h3>
                  <p className="text-[11px] md:text-xs text-gray-500">Points cumulés sans remise à zéro</p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={formData.tier2Enabled}
                aria-label="Activer ou désactiver le 2ème palier de récompense"
                onClick={() => setFormData({ ...formData, tier2Enabled: !formData.tier2Enabled })}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 ${
                  formData.tier2Enabled ? 'bg-violet-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                    formData.tier2Enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {formData.tier2Enabled && (
              <div className="space-y-5 pt-4 border-t border-violet-100">
                <div className="p-4 rounded-xl bg-violet-50/50 border border-violet-100">
                  <p className="text-sm text-violet-700 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Exemple :</strong> Si le 1er palier est à {formData.stampsRequired} points et le 2ème à {formData.tier2StampsRequired || '?'} points,
                      le client débloque la 1ère récompense à {formData.stampsRequired} pts puis la 2ème à {formData.tier2StampsRequired || '?'} pts (cumul continu).
                    </span>
                  </p>
                </div>

                <div className="space-y-2.5">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Target className="w-4 h-4 text-violet-500" />
                    Nombre de passages requis
                  </label>
                  <Input
                    type="number"
                    min={1}
                    placeholder={`Ex: ${formData.stampsRequired * 2}`}
                    value={formData.tier2StampsRequired || ''}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        tier2StampsRequired: parseInt(e.target.value) || 0
                      });
                      setTier2Error('');
                    }}
                    className={`text-center font-bold text-lg h-12 border-2 max-w-[120px] ${tier2Error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Suggestions :</span>
                    {[10, 15, 20].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => { setFormData({ ...formData, tier2StampsRequired: n }); setTier2Error(''); }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${
                          formData.tier2StampsRequired === n
                            ? 'bg-violet-100 border-violet-300 text-violet-700'
                            : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-600'
                        }`}
                      >
                        {n} passages
                      </button>
                    ))}
                  </div>
                  {tier2Error ? (
                    <p className="text-xs text-red-500 font-medium">{tier2Error}</p>
                  ) : (
                    <p className="text-xs text-gray-500">
                      Doit être supérieur au 1er palier ({formData.stampsRequired})
                    </p>
                  )}
                </div>

                <div className="space-y-2.5">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Gift className="w-4 h-4 text-violet-500" />
                    Récompense offerte
                  </label>
                  <Input
                    type="text"
                    placeholder="Ex: Un menu offert, -30% sur votre commande..."
                    value={formData.tier2RewardDescription}
                    onChange={(e) => setFormData({ ...formData, tier2RewardDescription: e.target.value })}
                    className="h-11"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {(TIER2_REWARD_SUGGESTIONS[merchant?.shop_type || 'autre'] || TIER2_REWARD_SUGGESTIONS.autre).map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setFormData({ ...formData, tier2RewardDescription: suggestion })}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${
                          formData.tier2RewardDescription === suggestion
                            ? 'bg-violet-100 border-violet-300 text-violet-700'
                            : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-600'
                        }`}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Vos réseaux sociaux — Collapsible */}
          <div id="social-section" className="bg-white/80 backdrop-blur-xl border border-pink-100 rounded-2xl shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setSocialOpen(!socialOpen)}
              className="w-full p-3 md:p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center shadow-md">
                  <Instagram className="w-3.5 h-3.5 md:w-5 md:h-5 text-white" />
                </div>
                <h3 className="text-sm md:text-lg font-bold text-gray-900">Vos réseaux sociaux <span className="text-gray-400 font-medium text-xs md:text-sm">(facultatif)</span></h3>
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${socialOpen ? 'rotate-180' : ''}`} />
            </button>

            <div className={`grid transition-all duration-300 ease-in-out ${socialOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
              <div className="overflow-hidden">
                <div className="px-3 pb-3 md:px-5 md:pb-5 space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-600">Instagram</label>
                    <Input
                      type="text"
                      className="bg-white border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 h-11 text-sm rounded-xl w-full"
                      placeholder="@votre-commerce ou lien complet"
                      value={formData.instagramUrl}
                      onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-600">Facebook</label>
                    <Input
                      type="text"
                      className="bg-white border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 h-11 text-sm rounded-xl w-full"
                      placeholder="votre-page ou lien complet"
                      value={formData.facebookUrl}
                      onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-600">TikTok</label>
                    <Input
                      type="text"
                      className="bg-white border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20 h-11 text-sm rounded-xl w-full"
                      placeholder="@votre-commerce ou lien complet"
                      value={formData.tiktokUrl}
                      onChange={(e) => setFormData({ ...formData, tiktokUrl: e.target.value })}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Vos réseaux seront affichés sur la carte de fidélité de vos clients.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Avis Google — Collapsible */}
          <div className="bg-white/80 backdrop-blur-xl border border-amber-100 rounded-2xl shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setReviewsOpen(!reviewsOpen)}
              className="w-full p-3 md:p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md">
                  <Star className="w-3.5 h-3.5 md:w-5 md:h-5 text-white" />
                </div>
                <h3 className="text-sm md:text-lg font-bold text-gray-900">Avis Google <span className="text-gray-400 font-medium text-xs md:text-sm">(facultatif)</span></h3>
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${reviewsOpen ? 'rotate-180' : ''}`} />
            </button>

            <div className={`grid transition-all duration-300 ease-in-out ${reviewsOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
              <div className="overflow-hidden">
                <div className="px-3 pb-3 md:px-5 md:pb-5 space-y-3">
                  <div className="space-y-1.5">
                    <Input
                      type="url"
                      className="bg-white border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 h-11 text-sm rounded-xl w-full"
                      placeholder="https://g.page/r/votre-commerce/review"
                      value={formData.reviewLink}
                      onChange={(e) => setFormData({ ...formData, reviewLink: e.target.value })}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Après chaque récompense ou bon utilisé, vos clients verront automatiquement une invitation à laisser un avis Google.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Lien de réservation — Collapsible */}
          <div className="bg-white/80 backdrop-blur-xl border border-indigo-100 rounded-2xl shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setBookingOpen(!bookingOpen)}
              className="w-full p-3 md:p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center shadow-md">
                  <CalendarDays className="w-3.5 h-3.5 md:w-5 md:h-5 text-white" />
                </div>
                <h3 className="text-sm md:text-lg font-bold text-gray-900">Votre lien de réservation <span className="text-gray-400 font-medium text-xs md:text-sm">(facultatif)</span></h3>
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${bookingOpen ? 'rotate-180' : ''}`} />
            </button>

            <div className={`grid transition-all duration-300 ease-in-out ${bookingOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
              <div className="overflow-hidden">
                <div className="px-3 pb-3 md:px-5 md:pb-5 space-y-3">
                  <div className="space-y-1.5">
                    <Input
                      type="url"
                      className="bg-white border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 h-11 text-sm rounded-xl w-full"
                      placeholder="https://planity.com/votre-salon"
                      value={formData.bookingUrl}
                      onChange={(e) => setFormData({ ...formData, bookingUrl: e.target.value })}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Vos clients pourront réserver directement depuis leur carte.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Save Button — inline on mobile, sticky on desktop */}
      <div className="mt-6 md:mt-0 md:fixed md:bottom-0 md:left-0 md:right-0 lg:left-72 md:z-50 md:p-4 md:bg-white/70 md:backdrop-blur-xl md:border-t md:border-gray-100/50 md:shadow-lg md:shadow-gray-900/5">
        <div className="max-w-3xl mx-auto flex justify-center lg:justify-end">
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className={`
              w-full md:w-auto h-11 md:h-10 px-6 rounded-xl font-semibold text-sm inline-flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
              ${saved
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200/50'
                : 'bg-gradient-to-r from-pink-500 to-indigo-500 text-white shadow-md shadow-pink-200/50 hover:from-pink-600 hover:to-indigo-600 hover:shadow-lg'}
            `}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <>
                <Check className="w-4 h-4" />
                <span>Enregistré !</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Enregistrer</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Spacer for sticky button (desktop only) */}
      <div className="hidden md:block h-16" />

      {/* Test Scan Modal — shown after first program save */}
      {showTestModal && merchant && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 text-center animate-in zoom-in-95 duration-300">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200/50">
              <QrCode className="w-7 h-7 text-white" />
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Votre programme est en ligne !
            </h3>

            <p className="text-gray-500 text-sm mb-4 leading-relaxed">
              Découvrez ce que vos clients verront en scannant votre QR code :
            </p>

            <div className="text-left space-y-2 mb-5 px-1">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <span className="text-sm text-gray-700">Carte de fidélité <strong>sans appli</strong></span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <span className="text-sm text-gray-700">Rappels <strong>automatiques</strong> pour les faire revenir</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <span className="text-sm text-gray-700">Parrainage intégré = <strong>nouveaux clients gratuits</strong></span>
              </div>
            </div>

            <a
              href={`/scan/${merchant.scan_code}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                // Track preview step as done for onboarding checklist
                fetch('/api/onboarding/status', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ step: 'preview' }),
                }).catch(() => {});
              }}
              className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200/50 hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Smartphone className="w-5 h-5" />
              Voir le parcours client
            </a>

            <button
              onClick={() => {
                setShowTestModal(false);
                router.push('/dashboard/qr-download');
              }}
              className="mt-3 w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
            >
              Plus tard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
