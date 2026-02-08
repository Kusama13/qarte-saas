'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  ExternalLink,
} from 'lucide-react';
import { Input } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { MerchantSettingsForm, type LoyaltySettings } from '@/components/loyalty';
import { compressLogo } from '@/lib/image-compression';
import type { Merchant } from '@/types';

// Images par type de commerce (beauté / bien-être)
const BUSINESS_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200', label: 'Coiffeur' },
  { url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=200', label: 'Barbier' },
  { url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=200', label: 'Institut' },
  { url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=200', label: 'Onglerie' },
  { url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=200', label: 'Spa' },
  { url: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=200', label: 'Massage' },
];


// 10 palettes de couleurs inspirées des commerces
const COLOR_PALETTES = [
  { primary: '#1e293b', secondary: '#475569', name: 'Élégant', icon: '✂️' },
  { primary: '#dc2626', secondary: '#f97316', name: 'Gourmand', icon: '🍕' },
  { primary: '#059669', secondary: '#10b981', name: 'Nature', icon: '🌿' },
  { primary: '#7c3aed', secondary: '#a78bfa', name: 'Moderne', icon: '💜' },
  { primary: '#db2777', secondary: '#f472b6', name: 'Glamour', icon: '💅' },
  { primary: '#ea580c', secondary: '#fb923c', name: 'Chaleureux', icon: '🥐' },
  { primary: '#0891b2', secondary: '#22d3ee', name: 'Frais', icon: '💎' },
  { primary: '#4f46e5', secondary: '#818cf8', name: 'Premium', icon: '⭐' },
  { primary: '#16a34a', secondary: '#4ade80', name: 'Bio', icon: '🥗' },
  { primary: '#0f172a', secondary: '#334155', name: 'Luxe', icon: '🖤' },
];

export default function ProgramPage() {
  const router = useRouter();
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
    stampsRequired: 10,
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

  // Prefetch preview page for faster navigation after first save
  useEffect(() => {
    if (merchant?.id) router.prefetch(`/customer/card/${merchant.id}?preview=true&onboarding=true`);
  }, [router, merchant?.id]);

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
          stampsRequired: data.stamps_required || 10,
          rewardDescription: data.reward_description || '',
          tier2Enabled: data.tier2_enabled || false,
          tier2StampsRequired: data.tier2_stamps_required || 0,
          tier2RewardDescription: data.tier2_reward_description || '',
        });
        setOriginalStampsRequired(data.stamps_required || 10);
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

  const handleSave = async () => {
    if (!merchant) return;

    // Validate tier 2 stamps
    if (formData.tier2Enabled) {
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
          review_link: formData.reviewLink || null,
          stamps_required: formData.stampsRequired,
          reward_description: formData.rewardDescription,
          loyalty_mode: 'visit',
          product_name: null,
          max_quantity_per_scan: 1,
          tier2_enabled: formData.tier2Enabled,
          tier2_stamps_required: formData.tier2Enabled ? formData.tier2StampsRequired : null,
          tier2_reward_description: formData.tier2Enabled ? formData.tier2RewardDescription : null,
        })
        .eq('id', merchant.id);

      if (error) throw error;

      if (isFirstSetup) {
        // Update merchant cache so QR page loads instantly with fresh data
        try {
          const updatedMerchant = {
            ...merchant,
            logo_url: formData.logoUrl || null,
            primary_color: formData.primaryColor,
            secondary_color: formData.secondaryColor,
            review_link: formData.reviewLink || null,
            stamps_required: formData.stampsRequired,
            reward_description: formData.rewardDescription,
            loyalty_mode: 'visit',
            tier2_enabled: formData.tier2Enabled,
            tier2_stamps_required: formData.tier2Enabled ? formData.tier2StampsRequired : null,
            tier2_reward_description: formData.tier2Enabled ? formData.tier2RewardDescription : null,
          };
          localStorage.setItem('qarte_merchant_cache', JSON.stringify({
            data: updatedMerchant,
            timestamp: Date.now(),
          }));
        } catch {}
        router.push(`/customer/card/${merchant.id}?preview=true&onboarding=true`);
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
    <div className="max-w-6xl mx-auto">
      <div className="relative overflow-hidden mb-10 p-8 rounded-3xl bg-white/70 backdrop-blur-md border border-white/20 shadow-xl shadow-indigo-200/30">
        {/* Animated Gradient Background Blobs */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />

        <div className="relative">
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
            Mon Programme
          </h1>
          <p className="mt-2 text-gray-500 font-medium">
            Personnalisez votre programme de fidélité
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="p-6 bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl shadow-indigo-100/40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 -mr-8 -mt-8 transition-transform duration-500 rounded-full bg-gradient-to-br from-indigo-50/50 to-violet-50/50 blur-3xl group-hover:scale-110" />

            <h3 className="relative flex items-center gap-3 mb-6 text-lg font-bold text-gray-900">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-200">
                <Upload className="w-5 h-5 text-white" />
              </div>
              Logo du Programme
            </h3>

            <div className="relative space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-semibold tracking-wide text-gray-700 uppercase">Télécharger votre logo</label>
                <div className="flex items-center gap-5 p-4 transition-all border border-indigo-50 rounded-2xl bg-indigo-50/30 hover:bg-indigo-50/50">
                  <label className="relative flex items-center justify-center w-20 h-20 transition-all duration-300 bg-white border-2 border-dashed border-indigo-200 shadow-sm rounded-2xl cursor-pointer hover:border-indigo-500 hover:shadow-md group/upload">
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

              <div className="space-y-3">
                <label className="text-sm font-semibold tracking-wide text-gray-700 uppercase">Ou choisissez une image</label>
                <div className="grid grid-cols-3 gap-3">
                  {BUSINESS_IMAGES.map((image, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setFormData({ ...formData, logoUrl: image.url })}
                      className={`relative h-20 overflow-hidden rounded-xl border-2 transition-all duration-300 transform active:scale-95 group/img ${
                        formData.logoUrl === image.url
                          ? 'border-indigo-600 ring-4 ring-indigo-500/10'
                          : 'border-white shadow-sm hover:border-indigo-200 hover:shadow-md'
                      }`}
                    >
                      <img src={image.url} alt={image.label} className="object-cover w-full h-full transition-transform duration-500 group-hover/img:scale-110" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                        <span className="text-[9px] font-bold text-white">{image.label}</span>
                      </div>
                      {formData.logoUrl === image.url && (
                        <div className="absolute top-1.5 right-1.5">
                          <div className="p-0.5 bg-indigo-600 rounded-full shadow-sm">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white/60 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg shadow-indigo-100/50">
            <h3 className="flex items-center gap-3 mb-6 text-lg font-semibold text-gray-900">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/30">
                <Palette className="w-5 h-5 text-white" />
              </div>
              Couleurs
            </h3>

            <div className="space-y-4">
              <label className="text-sm font-semibold tracking-wide text-gray-700 uppercase">Palettes suggérées</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {COLOR_PALETTES.map((palette, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setFormData({ ...formData, primaryColor: palette.primary, secondaryColor: palette.secondary })}
                    className={`relative p-2 rounded-xl border-2 transition-all duration-300 group/palette ${
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

          <div className="p-8 bg-gradient-to-br from-white via-white to-indigo-50/30 rounded-2xl shadow-lg shadow-indigo-200/50 border border-white/60 backdrop-blur-xl transition-all duration-300">
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
          <div className="p-6 bg-gradient-to-br from-white via-white to-violet-50/30 rounded-2xl shadow-lg shadow-violet-200/30 border border-violet-100/50 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 shadow-lg shadow-violet-200">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">2ème Palier de Récompense</h3>
                  <p className="text-xs text-gray-500">Les points se cumulent sans remise à zéro</p>
                </div>
              </div>
              <button
                type="button"
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

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Nombre de passages pour le 2ème palier
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
                    className={`bg-white ${tier2Error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-violet-200 focus:border-violet-500 focus:ring-violet-500/20'}`}
                  />
                  {tier2Error ? (
                    <p className="text-xs text-red-500 font-medium">{tier2Error}</p>
                  ) : (
                    <p className="text-xs text-gray-500">
                      Doit être supérieur au 1er palier ({formData.stampsRequired})
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Récompense du 2ème palier
                  </label>
                  <Input
                    type="text"
                    placeholder="Ex: Un menu offert, -30% sur votre commande..."
                    value={formData.tier2RewardDescription}
                    onChange={(e) => setFormData({ ...formData, tier2RewardDescription: e.target.value })}
                    className="bg-white border-violet-200 focus:border-violet-500 focus:ring-violet-500/20"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Review Link Section */}
          <div className="p-5 bg-white/80 backdrop-blur-xl border border-amber-100 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-400 flex items-center justify-center shadow-md">
                <Star className="w-5 h-5 text-white fill-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Avis Google</h3>
            </div>

            <div className="space-y-3">
              <Input
                type="url"
                className="bg-white border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 h-11 text-sm rounded-xl w-full"
                placeholder="https://g.page/r/votre-commerce/review"
                value={formData.reviewLink}
                onChange={(e) =>
                  setFormData({ ...formData, reviewLink: e.target.value })
                }
              />
              <p className="text-xs text-gray-500">
                Ce lien apparaîtra sur la carte de fidélité de vos clients.
              </p>
            </div>
          </div>

        </div>

        {merchant && (
          <div className="lg:block">
            <div className="sticky top-8">
              <a
                href={`/customer/card/${merchant.id}?preview=true`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 p-4 lg:p-6 bg-white/80 backdrop-blur-xl border border-indigo-100 rounded-2xl shadow-lg shadow-indigo-100/40 hover:shadow-xl hover:border-indigo-200 transition-all duration-300 group"
              >
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <ExternalLink className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Voir la carte client</p>
                  <p className="text-xs text-gray-500">Aperçu réel de ce que voient vos clients</p>
                </div>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Save Button (All Screens) */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-72 z-50 p-3 lg:p-4 bg-white/70 backdrop-blur-xl border-t border-gray-100/50 shadow-lg shadow-gray-900/5">
        <div className="max-w-6xl mx-auto flex justify-center lg:justify-end">
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className={`
              w-full lg:w-auto h-12 lg:h-10 px-6 rounded-xl font-semibold text-base lg:text-sm inline-flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
              ${saved
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200/50'
                : 'bg-gradient-to-r from-pink-500 to-indigo-500 text-white shadow-md shadow-pink-200/50 hover:from-pink-600 hover:to-indigo-600 hover:shadow-lg'}
            `}
          >
            {saving ? (
              <Loader2 className="w-5 h-5 lg:w-4 lg:h-4 animate-spin" />
            ) : saved ? (
              <>
                <Check className="w-5 h-5 lg:w-4 lg:h-4" />
                <span>Enregistré !</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5 lg:w-4 lg:h-4" />
                <span>Enregistrer</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Spacer for sticky button */}
      <div className="h-20 lg:h-16" />
    </div>
  );
}
