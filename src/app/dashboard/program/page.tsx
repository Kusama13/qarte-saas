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
  QrCode,
  Smartphone,
  Zap,
  Euro,
  Stamp,
  HelpCircle,
  X,
  Cake,
} from 'lucide-react';
import { Input } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { MerchantSettingsForm, type LoyaltySettings } from '@/components/loyalty';
import { compressLogo } from '@/lib/image-compression';
import { useMerchant } from '@/contexts/MerchantContext';
import type { Merchant } from '@/types';


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
    snapchatUrl: '',
    loyaltyMode: 'visit' as 'visit' | 'cagnotte',
    stampsRequired: 5,
    rewardDescription: '',
    // Cagnotte mode
    cagnottePercent: 10,
    cagnotteTier2Percent: 15,
    // 2nd tier reward
    tier2Enabled: false,
    tier2StampsRequired: 0,
    tier2RewardDescription: '',
    // Double stamp days
    doubleDaysEnabled: false,
    doubleDaysOfWeek: [] as number[],
    // Birthday gift
    birthdayGiftEnabled: false,
    birthdayGiftDescription: '',
  });

  // Track original values for warnings
  const [originalLoyaltyMode, setOriginalLoyaltyMode] = useState<'visit' | 'cagnotte'>('visit');
  const [originalStampsRequired, setOriginalStampsRequired] = useState(10);
  const [showStampsWarning, setShowStampsWarning] = useState(false);
  const [tier2Error, setTier2Error] = useState('');
  const [rewardError, setRewardError] = useState(false);
  const [socialOpen, setSocialOpen] = useState(searchParams.get('section') === 'social');
  const [doubleDaysOpen, setDoubleDaysOpen] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [birthdayOpen, setBirthdayOpen] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [pendingModeSwitch, setPendingModeSwitch] = useState<'visit' | 'cagnotte' | null>(null);
  const [modeHelp, setModeHelp] = useState<'visit' | 'cagnotte' | null>(null);
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
          snapchatUrl: data.snapchat_url || '',
          loyaltyMode: data.loyalty_mode || 'visit',
          stampsRequired: data.stamps_required || 5,
          rewardDescription: data.reward_description || '',
          cagnottePercent: data.cagnotte_percent || 10,
          cagnotteTier2Percent: data.cagnotte_tier2_percent || 15,
          tier2Enabled: data.tier2_enabled || false,
          tier2StampsRequired: data.tier2_stamps_required || 0,
          tier2RewardDescription: data.tier2_reward_description || '',
          doubleDaysEnabled: data.double_days_enabled || false,
          doubleDaysOfWeek: (() => { try { return JSON.parse(data.double_days_of_week || '[]'); } catch { return []; } })(),
          birthdayGiftEnabled: data.birthday_gift_enabled || false,
          birthdayGiftDescription: data.birthday_gift_description || '',
        });
        setOriginalLoyaltyMode(data.loyalty_mode || 'visit');
        setOriginalStampsRequired(data.stamps_required || 5);
        if (!data.reward_description && !data.cagnotte_percent) {
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

  const normalizeSocialUrl = (value: string, platform: 'instagram' | 'facebook' | 'tiktok' | 'snapchat') => {
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
      case 'snapchat': return `https://snapchat.com/add/${username}`;
    }
  };

  const handleSave = async () => {
    if (!merchant) return;
    if (formData.loyaltyMode !== 'cagnotte' && !formData.rewardDescription.trim()) {
      setRewardError(true);
      return;
    }
    setRewardError(false);

    // Validate stamps limits
    if (formData.stampsRequired < 1 || formData.stampsRequired > 15) {
      return;
    }

    // Validate tier 2
    if (formData.tier2Enabled) {
      if (formData.loyaltyMode !== 'cagnotte' && !formData.tier2RewardDescription.trim()) {
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
      if (formData.tier2StampsRequired > 30) {
        setTier2Error('Le palier 2 ne peut pas dépasser 30 passages');
        return;
      }
    }
    setTier2Error('');

    // Sanitize double days: if enabled but no day selected, disable silently
    const doubleDaysEnabled = formData.doubleDaysEnabled && formData.doubleDaysOfWeek.length > 0;

    setSaving(true);
    try {
      // Auto-generate reward_description for cagnotte mode (email compatibility)
      const isCagnotte = formData.loyaltyMode === 'cagnotte';
      const effectiveRewardDescription = isCagnotte
        ? `${formData.cagnottePercent}% sur votre cagnotte fidélité`
        : formData.rewardDescription.trim();

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
          snapchat_url: normalizeSocialUrl(formData.snapchatUrl, 'snapchat') || null,
          stamps_required: formData.stampsRequired,
          reward_description: effectiveRewardDescription,
          loyalty_mode: formData.loyaltyMode,
          cagnotte_percent: isCagnotte ? formData.cagnottePercent : null,
          cagnotte_tier2_percent: isCagnotte && formData.tier2Enabled ? formData.cagnotteTier2Percent : null,
          tier2_enabled: formData.tier2Enabled,
          tier2_stamps_required: formData.tier2Enabled ? formData.tier2StampsRequired : null,
          tier2_reward_description: isCagnotte
            ? (formData.tier2Enabled ? `${formData.cagnotteTier2Percent}% sur votre cagnotte fidélité` : null)
            : (formData.tier2Enabled ? formData.tier2RewardDescription.trim() : null),
          double_days_enabled: isCagnotte ? false : doubleDaysEnabled,
          double_days_of_week: isCagnotte ? '[]' : JSON.stringify(formData.doubleDaysOfWeek),
          birthday_gift_enabled: formData.birthdayGiftEnabled,
          birthday_gift_description: formData.birthdayGiftDescription.trim() || null,
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
          snapchat_url: normalizeSocialUrl(formData.snapchatUrl, 'snapchat') || null,
          stamps_required: formData.stampsRequired,
          reward_description: effectiveRewardDescription,
          loyalty_mode: formData.loyaltyMode,
          cagnotte_percent: isCagnotte ? formData.cagnottePercent : null,
          cagnotte_tier2_percent: isCagnotte && formData.tier2Enabled ? formData.cagnotteTier2Percent : null,
          tier2_enabled: formData.tier2Enabled,
          tier2_stamps_required: formData.tier2Enabled ? formData.tier2StampsRequired : null,
          tier2_reward_description: isCagnotte
            ? (formData.tier2Enabled ? `${formData.cagnotteTier2Percent}% sur votre cagnotte fidélité` : null)
            : (formData.tier2Enabled ? formData.tier2RewardDescription.trim() : null),
          double_days_enabled: isCagnotte ? false : doubleDaysEnabled,
          double_days_of_week: isCagnotte ? '[]' : JSON.stringify(formData.doubleDaysOfWeek),
          birthday_gift_enabled: formData.birthdayGiftEnabled,
          birthday_gift_description: formData.birthdayGiftDescription.trim() || null,
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
    if (settings.reward_description.trim()) setRewardError(false);

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
      <div className="mb-5 md:mb-10 p-4 md:p-6 rounded-2xl bg-[#4b0082]/[0.04] border border-[#4b0082]/[0.08]">
        <h1 className="text-xl md:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#4b0082] to-violet-600">
          Mon Programme
        </h1>
        <p className="mt-1 text-sm md:text-base text-gray-500 font-medium">
          Personnalise ton programme de fidélité
        </p>
      </div>

      {/* Programme Score */}
      {(() => {
        const scoreItems = [
          { done: !!formData.rewardDescription, pts: 25, label: 'Récompense' },
          { done: !!formData.logoUrl, pts: 20, label: 'Logo' },
          { done: !!(formData.instagramUrl || formData.facebookUrl || formData.tiktokUrl || formData.snapchatUrl), pts: 15, label: 'Réseaux sociaux' },
          { done: !!formData.reviewLink, pts: 10, label: 'Avis Google' },
          { done: !!merchant?.booking_url, pts: 10, label: 'Lien réservation' },
          { done: formData.tier2Enabled && (formData.loyaltyMode === 'cagnotte' || !!formData.tier2RewardDescription), pts: 5, label: '2ème palier' },
          ...(formData.loyaltyMode !== 'cagnotte' ? [{ done: formData.doubleDaysEnabled && formData.doubleDaysOfWeek.length > 0, pts: 5, label: 'Jours x2' }] : []),
        ];
        const score = scoreItems.reduce((sum, i) => sum + (i.done ? i.pts : 0), 0);
        const r = 17;
        const circumference = 2 * Math.PI * r;
        const offset = circumference - (score / 100) * circumference;
        const strokeColor = score < 50 ? '#f59e0b' : score < 80 ? '#7c3aed' : '#10b981';
        const message = score === 100
          ? 'Programme complet — tes clients vont adorer'
          : score >= 80
            ? 'Presque parfait !'
            : score >= 50
              ? 'Bon début, quelques ajouts feront la différence'
              : 'Ton programme peut faire beaucoup plus';

        return score < 100 ? (
          <div className="mb-4 md:mb-6 flex items-center gap-3 px-4 py-2.5 sticky top-12 lg:top-2 z-20 bg-violet-50/90 backdrop-blur-xl border border-violet-200/60 rounded-xl shadow-sm">
            <div className="flex-shrink-0 relative w-10 h-10">
              <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
                <circle cx="20" cy="20" r={r} fill="none" stroke="#f3f4f6" strokeWidth="3" />
                <circle
                  cx="20" cy="20" r={r} fill="none"
                  stroke={strokeColor} strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={circumference} strokeDashoffset={offset}
                  style={{ transition: 'stroke-dashoffset 700ms ease-out, stroke 300ms' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[11px] font-black" style={{ color: strokeColor }}>{score}%</span>
              </div>
            </div>
            <p className="text-sm font-semibold text-gray-700">{message}</p>
          </div>
        ) : null;
      })()}

      <div className="grid gap-3 md:gap-8">
        <div className="space-y-3 md:space-y-6">

          {/* Logo */}

          <div className="p-3 md:p-6 bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl shadow-indigo-100/40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 -mr-8 -mt-8 transition-transform duration-500 rounded-full bg-gradient-to-br from-indigo-50/50 to-violet-50/50 blur-3xl group-hover:scale-110" />

            <h3 className="relative flex items-center gap-2 md:gap-3 mb-3 md:mb-6 text-sm md:text-lg font-bold text-gray-900">
              <div className="flex items-center justify-center w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-200">
                <Upload className="w-3.5 h-3.5 md:w-5 md:h-5 text-white" />
              </div>
              Ajoute ton logo ou une image de ton activité
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
                    <span className="text-sm font-medium text-gray-700">Cliquez pour choisir une image</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Ambiance */}
          <div className="p-3 md:p-6 bg-white/60 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg shadow-indigo-100/50">
            <h3 className="flex items-center gap-2 md:gap-3 mb-3 md:mb-6 text-sm md:text-lg font-semibold text-gray-900">
              <div className="p-1.5 md:p-2.5 rounded-lg md:rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/30">
                <Palette className="w-3.5 h-3.5 md:w-5 md:h-5 text-white" />
              </div>
              Ambiance
            </h3>

            <div className="space-y-3 md:space-y-4">
              <label className="text-xs md:text-sm font-semibold tracking-wide text-gray-700 uppercase">Choisis l&apos;ambiance de ta carte</label>
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

          {/* ===== PROGRAMME ===== */}

          {/* Mode selector */}
          <div className="flex items-center gap-3 mt-4 mb-1">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-200 to-transparent" />
            <h2 className="text-sm md:text-base font-bold text-gray-500 uppercase tracking-wider">Mode de fidélité</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-200 to-transparent" />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { mode: 'visit' as const, label: 'Passages', desc: 'Après un nombre de visites défini, ton client reçoit un cadeau de ton choix', icon: <Stamp className="w-5 h-5" /> },
              { mode: 'cagnotte' as const, label: 'Cagnotte', desc: 'Les dépenses de ton client s\'accumulent sur une cagnotte fidélité', icon: <Euro className="w-5 h-5" /> },
            ].map(({ mode, label, desc, icon }) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  if (mode !== formData.loyaltyMode && !isFirstSetup && originalLoyaltyMode !== mode) {
                    setPendingModeSwitch(mode);
                    return;
                  }
                  setFormData({ ...formData, loyaltyMode: mode });
                }}
                className={`relative p-4 pb-10 rounded-2xl border-2 text-left transition-all duration-200 h-full ${
                  formData.loyaltyMode === mode
                    ? 'border-violet-500 bg-violet-50/60 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {formData.loyaltyMode === mode && (
                  <div className="absolute top-2 right-2">
                    <div className="p-0.5 bg-violet-600 rounded-full">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  </div>
                )}
                <div className={`p-2 rounded-xl w-fit mb-2 ${formData.loyaltyMode === mode ? 'bg-violet-100 text-violet-600' : 'bg-gray-100 text-gray-400'}`}>
                  {icon}
                </div>
                <h3 className={`font-bold text-sm ${formData.loyaltyMode === mode ? 'text-gray-900' : 'text-gray-600'}`}>{label}</h3>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    setModeHelp(mode);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                      e.preventDefault();
                      setModeHelp(mode);
                    }
                  }}
                  className="absolute bottom-2 right-2 p-1.5 rounded-full text-gray-300 hover:text-violet-500 hover:bg-violet-50 transition-colors cursor-pointer"
                  aria-label={`En savoir plus sur le mode ${label}`}
                >
                  <HelpCircle className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>

          {!isFirstSetup && formData.loyaltyMode !== originalLoyaltyMode && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong>Changement de mode.</strong> Les passages de tes clients sont conservés. En mode cagnotte, leur cumul EUR démarrera à 0.
              </p>
            </div>
          )}

          <div className="flex items-center gap-3 mb-1">
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
            {formData.loyaltyMode === 'cagnotte' ? (
              <>
                <MerchantSettingsForm
                  stampsRequired={formData.stampsRequired}
                  rewardDescription={`${formData.cagnottePercent}% sur votre cagnotte fidélité`}
                  shopType={merchant?.shop_type}
                  onChange={(v: LoyaltySettings) => {
                  setFormData(prev => ({ ...prev, stampsRequired: v.stamps_required }));
                  if (v.stamps_required > originalStampsRequired) setShowStampsWarning(true);
                  else setShowStampsWarning(false);
                }}
                  hiddenReward
                />
                <div className="space-y-2.5 mt-4">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-indigo-500" />
                    Pourcentage cagnotte
                  </label>
                  <div className="relative w-fit">
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      step={1}
                      value={formData.cagnottePercent}
                      onChange={(e) => setFormData({ ...formData, cagnottePercent: parseInt(e.target.value) || 0 })}
                      className="text-center font-bold text-lg h-12 border-2 w-[100px] pr-8"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-400 pointer-events-none">%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Suggestions :</span>
                    {[5, 10, 15, 20].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setFormData({ ...formData, cagnottePercent: n })}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${
                          formData.cagnottePercent === n
                            ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                            : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-indigo-50'
                        }`}
                      >
                        {n}%
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    Après {formData.stampsRequired} passages, la cliente reçoit {formData.cagnottePercent}% sur sa cagnotte fidélité
                  </p>
                </div>
              </>
            ) : (
              <>
                <MerchantSettingsForm
                  stampsRequired={formData.stampsRequired}
                  rewardDescription={formData.rewardDescription}
                  shopType={merchant?.shop_type}
                  onChange={handleLoyaltySettingsChange}
                />
                {rewardError && (
                  <p className="mt-2 text-sm text-red-600 font-medium">Veuillez entrer la r&eacute;compense avant d&apos;enregistrer</p>
                )}
              </>
            )}

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
                  <p className="text-[11px] md:text-xs text-gray-500">
                    {formData.loyaltyMode === 'cagnotte' ? 'Un taux de cagnotte plus élevé après plus de passages' : 'Les passages continuent de compter après le 1er palier'}
                  </p>
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
                    {formData.loyaltyMode === 'cagnotte' ? (
                      <span>
                        <strong>Comment ça marche :</strong> À {formData.stampsRequired} passages, la cliente reçoit {formData.cagnottePercent}% sur sa cagnotte fidélité.
                        Son cumul repart à zéro, ses passages continuent. À {formData.tier2StampsRequired || '?'} passages, elle reçoit {formData.cagnotteTier2Percent}% (taux plus élevé).
                      </span>
                    ) : (
                      <span>
                        <strong>Exemple :</strong> Le client débloque la 1ère récompense à {formData.stampsRequired} passages, puis continue
                        jusqu&apos;à {formData.tier2StampsRequired || '?'} passages pour la 2ème (cumul continu, sans remise à zéro).
                      </span>
                    )}
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
                    max={30}
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
                    {[15, 20, 30].map((n) => (
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

                {formData.loyaltyMode === 'cagnotte' ? (
                  <div className="space-y-2.5">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-violet-500" />
                      Pourcentage cagnotte palier 2
                    </label>
                    <div className="relative w-fit">
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        step={1}
                        value={formData.cagnotteTier2Percent}
                        onChange={(e) => setFormData({ ...formData, cagnotteTier2Percent: parseInt(e.target.value) || 0 })}
                        className="text-center font-bold text-lg h-12 border-2 w-[100px] pr-8"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-400 pointer-events-none">%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Suggestions :</span>
                      {[10, 15, 20, 25].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setFormData({ ...formData, cagnotteTier2Percent: n })}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${
                            formData.cagnotteTier2Percent === n
                              ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                              : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-indigo-50'
                          }`}
                        >
                          {n}%
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">
                      Après {formData.tier2StampsRequired || '?'} passages, la cagnotte passe à {formData.cagnotteTier2Percent}% (le cumul repart de zéro après le palier 1)
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Gift className="w-4 h-4 text-violet-500" />
                      Récompense offerte
                    </label>
                    <Input
                      type="text"
                      placeholder="Ex: Un menu offert, -30% sur ta commande..."
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
                )}
              </div>
            )}
          </div>

          {/* ═══════ GROUPE : MA VITRINE ═══════ */}
          <div className="bg-white/60 backdrop-blur-xl border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-3 md:px-5 pt-3 md:pt-4 pb-1">
              <p className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-[0.18em]">Compléter ma page</p>
            </div>
            <div className="divide-y divide-gray-100/80">

              {/* Réseaux sociaux */}
              <div id="social-section">
                <button
                  type="button"
                  onClick={() => setSocialOpen(!socialOpen)}
                  className="w-full p-3 md:p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-7 h-7 md:w-9 md:h-9 rounded-lg md:rounded-xl bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center">
                      <Instagram className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                    </div>
                    <h3 className="text-sm md:text-base font-bold text-gray-900">Réseaux sociaux</h3>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${socialOpen ? 'rotate-180' : ''}`} />
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
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-600">Snapchat</label>
                        <Input
                          type="text"
                          className="bg-white border border-gray-200 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 h-11 text-sm rounded-xl w-full"
                          placeholder="votre-pseudo ou lien complet"
                          value={formData.snapchatUrl}
                          onChange={(e) => setFormData({ ...formData, snapchatUrl: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Avis Google */}
              <div>
                <button
                  type="button"
                  onClick={() => setReviewsOpen(!reviewsOpen)}
                  className="w-full p-3 md:p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-7 h-7 md:w-9 md:h-9 rounded-lg md:rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                      <Star className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                    </div>
                    <h3 className="text-sm md:text-base font-bold text-gray-900">Avis Google</h3>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${reviewsOpen ? 'rotate-180' : ''}`} />
                </button>
                <div className={`grid transition-all duration-300 ease-in-out ${reviewsOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <div className="px-3 pb-3 md:px-5 md:pb-5 space-y-3">
                      <Input
                        type="url"
                        className="bg-white border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 h-11 text-sm rounded-xl w-full"
                        placeholder="https://g.page/r/votre-commerce/review"
                        value={formData.reviewLink}
                        onChange={(e) => setFormData({ ...formData, reviewLink: e.target.value })}
                      />
                      <p className="text-xs text-gray-500">
                        Après chaque récompense, tes clients verront une invitation à laisser un avis.
                      </p>
                    </div>
                  </div>
                </div>
              </div>



            </div>
          </div>

          {/* ═══════ GROUPE : BOOSTER MON PROGRAMME ═══════ */}
          <div className={`bg-white/60 backdrop-blur-xl border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden ${formData.loyaltyMode === 'cagnotte' ? 'hidden' : ''}`}>
            <div className="px-3 md:px-5 pt-3 md:pt-4 pb-1">
              <p className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-[0.18em]">Aller plus loin</p>
            </div>
            <div className="divide-y divide-gray-100/80">

              {/* Jours x2 */}
              <div>
                <button
                  type="button"
                  onClick={() => setDoubleDaysOpen(!doubleDaysOpen)}
                  className="w-full p-3 md:p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-7 h-7 md:w-9 md:h-9 rounded-lg md:rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                      <Zap className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-500" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-sm md:text-base font-bold text-gray-900">Jours x2</h3>
                      <p className="text-[11px] text-gray-400">Certains jours, chaque passage compte double</p>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${doubleDaysOpen ? 'rotate-180' : ''}`} />
                </button>
                <div className={`grid transition-all duration-300 ease-in-out ${doubleDaysOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <div className="px-3 md:px-5 pb-5 space-y-4">
                      <p className="text-xs text-gray-500 pt-1 border-t border-gray-100 pb-1">
                        Si tu as des jours creux, les points doubles peuvent inciter tes clients à revenir précisément ces jours-là.
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">Activer les jours x2</span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={formData.doubleDaysEnabled}
                          onClick={() => setFormData({ ...formData, doubleDaysEnabled: !formData.doubleDaysEnabled })}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 ${
                            formData.doubleDaysEnabled ? 'bg-amber-400' : 'bg-gray-200'
                          }`}
                        >
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${formData.doubleDaysEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>

                      {(() => {
                        const DAYS = [
                          { label: 'Lun', value: 1 },
                          { label: 'Mar', value: 2 },
                          { label: 'Mer', value: 3 },
                          { label: 'Jeu', value: 4 },
                          { label: 'Ven', value: 5 },
                          { label: 'Sam', value: 6 },
                          { label: 'Dim', value: 0 },
                        ];
                        const toggleDay = (day: number) => {
                          const current = formData.doubleDaysOfWeek;
                          const updated = current.includes(day) ? current.filter(d => d !== day) : [...current, day];
                          setFormData({ ...formData, doubleDaysOfWeek: updated });
                        };
                        const selectedDays = DAYS.filter(d => formData.doubleDaysOfWeek.includes(d.value));
                        return (
                          <div className={`space-y-3 ${!formData.doubleDaysEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
                            <div className="flex gap-1.5 flex-wrap">
                              {DAYS.map(day => {
                                const active = formData.doubleDaysOfWeek.includes(day.value);
                                return (
                                  <button
                                    key={day.value}
                                    type="button"
                                    onClick={() => toggleDay(day.value)}
                                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 border ${
                                      active
                                        ? 'bg-amber-400 border-amber-400 text-white shadow-sm'
                                        : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-600'
                                    }`}
                                  >
                                    {day.label}
                                  </button>
                                );
                              })}
                            </div>
                            {formData.doubleDaysEnabled && formData.doubleDaysOfWeek.length === 0 && (
                              <p className="text-xs text-amber-600 font-medium">Cochez au moins un jour</p>
                            )}
                            {selectedDays.length > 0 && (
                              <p className="text-xs text-gray-500">
                                <span className="font-semibold text-amber-600">{selectedDays.map(d => d.label).join(', ')}</span> — chaque scan = 2 tampons
                              </p>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cadeau anniversaire */}
              <div>
                <button
                  type="button"
                  onClick={() => setBirthdayOpen(!birthdayOpen)}
                  className="w-full p-3 md:p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-7 h-7 md:w-9 md:h-9 rounded-lg md:rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
                      <Cake className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-sm md:text-base font-bold text-gray-900">Cadeau anniversaire</h3>
                      <p className="text-[11px] text-gray-400">Envoi automatique le jour J</p>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${birthdayOpen ? 'rotate-180' : ''}`} />
                </button>
                <div className={`grid transition-all duration-300 ease-in-out ${birthdayOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <div className="px-3 pb-3 md:px-5 md:pb-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">Activer</span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={formData.birthdayGiftEnabled}
                          onClick={() => setFormData({ ...formData, birthdayGiftEnabled: !formData.birthdayGiftEnabled })}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 ${
                            formData.birthdayGiftEnabled ? 'bg-pink-500' : 'bg-gray-200'
                          }`}
                        >
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${formData.birthdayGiftEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                      {formData.birthdayGiftEnabled && (
                        <div className="space-y-2">
                          <textarea
                            value={formData.birthdayGiftDescription}
                            onChange={(e) => setFormData({ ...formData, birthdayGiftDescription: e.target.value })}
                            placeholder="Ex: Un brushing offert pour ton anniversaire !"
                            maxLength={200}
                            rows={2}
                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 resize-none"
                          />
                          <p className="text-xs text-gray-400">Valable 14 jours — tes clients le recoivent par notification</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Groupe Booster — mode cagnotte (réservation seule, sans jours x2) */}
          {formData.loyaltyMode === 'cagnotte' && (
          <div className="bg-white/60 backdrop-blur-xl border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-3 md:px-5 pt-3 md:pt-4 pb-1">
              <p className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-[0.18em]">Aller plus loin</p>
            </div>
            <div className="divide-y divide-gray-100/80">
              {/* Cadeau anniversaire (cagnotte) */}
              <div>
                <button
                  type="button"
                  onClick={() => setBirthdayOpen(!birthdayOpen)}
                  className="w-full p-3 md:p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-7 h-7 md:w-9 md:h-9 rounded-lg md:rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
                      <Cake className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-sm md:text-base font-bold text-gray-900">Cadeau anniversaire</h3>
                      <p className="text-[11px] text-gray-400">Envoi automatique le jour J</p>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${birthdayOpen ? 'rotate-180' : ''}`} />
                </button>
                <div className={`grid transition-all duration-300 ease-in-out ${birthdayOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <div className="px-3 pb-3 md:px-5 md:pb-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">Activer</span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={formData.birthdayGiftEnabled}
                          onClick={() => setFormData({ ...formData, birthdayGiftEnabled: !formData.birthdayGiftEnabled })}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 ${
                            formData.birthdayGiftEnabled ? 'bg-pink-500' : 'bg-gray-200'
                          }`}
                        >
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${formData.birthdayGiftEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                      {formData.birthdayGiftEnabled && (
                        <div className="space-y-2">
                          <textarea
                            value={formData.birthdayGiftDescription}
                            onChange={(e) => setFormData({ ...formData, birthdayGiftDescription: e.target.value })}
                            placeholder="Ex: Un brushing offert pour ton anniversaire !"
                            maxLength={200}
                            rows={2}
                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 resize-none"
                          />
                          <p className="text-xs text-gray-400">Valable 14 jours — tes clients le recoivent par notification</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
          )}

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
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'}
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
      {/* Mode switch confirmation modal */}
      {pendingModeSwitch && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 text-center animate-in zoom-in-95 duration-300">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200/50">
              <AlertTriangle className="w-7 h-7 text-white" />
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Changer de mode ?
            </h3>

            <p className="text-gray-500 text-sm mb-2 leading-relaxed">
              Passer en mode <strong>{pendingModeSwitch === 'cagnotte' ? 'Cagnotte' : 'Passages'}</strong> affectera l&apos;affichage pour tes clients existants.
            </p>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-5">
              <p className="text-xs text-amber-800 leading-relaxed">
                Les passages de tes clients sont <strong>conservés</strong>.
                {pendingModeSwitch === 'cagnotte'
                  ? ' Leur cumul en euros démarrera à 0 €.'
                  : ' Leur cumul en euros sera perdu.'}
              </p>
            </div>

            <button
              onClick={() => {
                setFormData({ ...formData, loyaltyMode: pendingModeSwitch });
                setPendingModeSwitch(null);
              }}
              className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200/50 hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Confirmer le changement
            </button>

            <button
              onClick={() => setPendingModeSwitch(null)}
              className="mt-3 w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Mode help modal */}
      {modeHelp && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setModeHelp(null)}>
          <div
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 sm:p-6 animate-in slide-in-from-bottom sm:zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-200/50">
                  {modeHelp === 'visit' ? <Stamp className="w-5 h-5 text-white" /> : <Euro className="w-5 h-5 text-white" />}
                </div>
                <h3 className="text-base font-bold text-gray-900">
                  {modeHelp === 'visit' ? 'Mode Passages' : 'Mode Cagnotte'}
                </h3>
              </div>
              <button
                onClick={() => setModeHelp(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm font-semibold text-violet-700 mb-3">Comment ça marche ?</p>

            <ul className="space-y-3 mb-5">
              {(modeHelp === 'visit' ? [
                { text: 'Chaque visite = 1 tampon sur la carte de ton client' },
                { text: 'Après X passages (ex : 10), il débloque un cadeau que tu définis' },
                { text: 'Exemples de cadeaux : un brushing offert, -30% sur une prestation, un soin gratuit' },
                { text: 'Simple et efficace — idéal si tes prestations ont des prix variés' },
              ] : [
                { text: 'Chaque visite, le montant dépensé par le client est enregistré' },
                { text: 'Après X passages, il reçoit un % de ses dépenses cumulées en réduction' },
                { text: 'Exemple : après 8 passages et 320 € dépensés, avec 10% de cagnotte → 32 € de réduction' },
                { text: 'Plus le client dépense, plus sa récompense est élevée — idéal pour encourager les gros paniers' },
              ]).map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-violet-600">{i + 1}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{item.text}</p>
                </li>
              ))}
            </ul>

            <button
              onClick={() => setModeHelp(null)}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200/50 hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Compris
            </button>
          </div>
        </div>
      )}

      {showTestModal && merchant && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 text-center animate-in zoom-in-95 duration-300">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200/50">
              <QrCode className="w-7 h-7 text-white" />
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Ton programme est en ligne !
            </h3>

            <p className="text-gray-500 text-sm mb-4 leading-relaxed">
              Découvre ce que tes clients verront en scannant ton QR code :
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
