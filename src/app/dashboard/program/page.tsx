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
  Gift,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  Trophy,
} from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { MerchantSettingsForm, ProgramGuide, type LoyaltySettings } from '@/components/loyalty';
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
  { url: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=200', label: 'Épilation' },
  { url: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=200', label: 'Soins' },
  { url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200', label: 'Maquillage' },
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
  const [showGuide, setShowGuide] = useState(false);

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

  // Preview data for mockup (updated in real-time, not saved until save button)
  const [previewData, setPreviewData] = useState({
    stampsRequired: 10,
    rewardDescription: '',
    // Tier 2 preview
    tier2Enabled: false,
    tier2StampsRequired: 0,
    tier2RewardDescription: '',
  });

  // Track original stamps required for warning
  const [originalStampsRequired, setOriginalStampsRequired] = useState(10);
  const [showStampsWarning, setShowStampsWarning] = useState(false);
  const [tier2Error, setTier2Error] = useState('');

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
        setPreviewData({
          stampsRequired: data.stamps_required || 10,
          rewardDescription: data.reward_description || '',
          tier2Enabled: data.tier2_enabled || false,
          tier2StampsRequired: data.tier2_stamps_required || 0,
          tier2RewardDescription: data.tier2_reward_description || '',
        });
        setOriginalStampsRequired(data.stamps_required || 10);
      }
      setLoading(false);
    };

    fetchMerchant();
  }, [router]);

  // Sync tier2 changes to preview
  useEffect(() => {
    setPreviewData(prev => ({
      ...prev,
      tier2Enabled: formData.tier2Enabled,
      tier2StampsRequired: formData.tier2StampsRequired,
      tier2RewardDescription: formData.tier2RewardDescription,
    }));
  }, [formData.tier2Enabled, formData.tier2StampsRequired, formData.tier2RewardDescription]);

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

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  // Real-time preview updates AND formData (so main save button works)
  const handleLoyaltySettingsChange = (settings: LoyaltySettings) => {
    // Update preview (preserve tier2 fields)
    setPreviewData(prev => ({
      ...prev,
      stampsRequired: settings.stamps_required,
      rewardDescription: settings.reward_description,
    }));

    // Also update formData so the main save button uses current values
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

        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              Mon Programme
            </h1>
            <p className="mt-2 text-gray-500 font-medium">
              Personnalisez votre programme de fidélité
            </p>
          </div>
          <Button
            onClick={handleSave}
            loading={saving}
            disabled={saved}
            className={`
              transition-all duration-300 px-6 py-2.5 rounded-2xl font-bold flex items-center gap-2
              ${saved
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-600'
                : 'bg-white/60 backdrop-blur-md border border-white/40 text-indigo-600 shadow-lg shadow-indigo-200/40 hover:bg-white hover:scale-[1.02] active:scale-95'}
            `}
          >
            {saved ? (
              <>
                <Check className="w-5 h-5" />
                <span>Enregistré</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Enregistrer</span>
              </>
            )}
          </Button>
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
              <div className="grid grid-cols-5 gap-2">
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

            <div className="grid gap-6 sm:grid-cols-2 pt-4 border-t border-gray-100">
              <div className="space-y-2.5">
                <label className="label text-sm font-medium ml-1">Couleur principale</label>
                <div className="flex items-center gap-3 p-1.5 bg-white/50 rounded-xl border border-gray-200 focus-within:border-indigo-500/50 focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all duration-300">
                  <div className="relative w-11 h-11 rounded-lg overflow-hidden border border-gray-200/50 shadow-sm shrink-0">
                    <input
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="absolute -inset-2 w-[150%] h-[150%] cursor-pointer border-none bg-transparent"
                    />
                  </div>
                  <Input
                    type="text"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="border-none bg-transparent focus-visible:ring-0 shadow-none font-mono text-sm uppercase h-auto py-0"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="label text-sm font-medium ml-1">Couleur secondaire</label>
                <div className="flex items-center gap-3 p-1.5 bg-white/50 rounded-xl border border-gray-200 focus-within:border-indigo-500/50 focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all duration-300">
                  <div className="relative w-11 h-11 rounded-lg overflow-hidden border border-gray-200/50 shadow-sm shrink-0">
                    <input
                      type="color"
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                      className="absolute -inset-2 w-[150%] h-[150%] cursor-pointer border-none bg-transparent"
                    />
                  </div>
                  <Input
                    type="text"
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    className="border-none bg-transparent focus-visible:ring-0 shadow-none font-mono text-sm uppercase h-auto py-0"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 bg-gradient-to-br from-white via-white to-indigo-50/30 rounded-2xl shadow-lg shadow-indigo-200/50 border border-white/60 backdrop-blur-xl transition-all duration-300">
            <MerchantSettingsForm
              initialStampsRequired={formData.stampsRequired}
              initialRewardDescription={formData.rewardDescription}
              onOpenGuide={() => setShowGuide(true)}
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
          <div className="relative overflow-hidden p-6 md:p-8 bg-gradient-to-br from-white via-amber-50/30 to-yellow-50/40 border border-amber-200/60 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-500 group">
            {/* Decorative background element */}
            <div className="absolute -right-16 -top-16 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-400/20 transition-all duration-700" />

            <div className="relative space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-white shadow-lg shadow-amber-200 group-hover:scale-105 transition-all duration-300 shrink-0">
                  <Star className="w-6 h-6 fill-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    Boostez votre E-réputation
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Impact Prioritaire</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 px-1">
                  <label className="text-sm font-bold text-slate-700">Lien Google ou TripAdvisor</label>
                  <a href="https://support.google.com/business/answer/7035772" target="_blank" rel="noreferrer" className="text-[11px] text-slate-400 hover:text-amber-600 flex items-center gap-1 transition-colors font-medium">
                    Comment trouver mon lien ? <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="relative">
                  <Input
                    type="url"
                    className="bg-white border-2 border-amber-100/80 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 transition-all h-12 text-sm shadow-sm pr-10 rounded-xl w-full"
                    placeholder="https://g.page/r/votre-commerce/review"
                    value={formData.reviewLink}
                    onChange={(e) =>
                      setFormData({ ...formData, reviewLink: e.target.value })
                    }
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400">
                    <Star className="w-4 h-4 fill-current opacity-20" />
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed px-1 font-medium">
                  Une fois configuré, vos clients recevront automatiquement une invitation à noter leur expérience.
                </p>
              </div>

              {/* Tips */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-amber-100/60">
                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  <span>Répondez à chaque avis</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  <span>Demandez l&apos;avis oralement</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="hidden lg:block">
          <div className="sticky top-8">
            <p className="mb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
              Aperçu en temps réel
            </p>
            <div className="flex justify-center">
              <div className="relative w-[280px] h-[560px] rounded-[3rem] border-[8px] border-slate-900 shadow-2xl overflow-hidden ring-1 ring-slate-200">
                {/* Dynamic Gradient Background */}
                <div
                  className="absolute inset-0 transition-all duration-700"
                  style={{
                    background: `linear-gradient(180deg, ${formData.primaryColor}15 0%, ${formData.secondaryColor}08 50%, #f8fafc 100%)`
                  }}
                />
                {/* Decorative Blobs */}
                <div
                  className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-30 transition-colors duration-700"
                  style={{ backgroundColor: formData.primaryColor }}
                />
                <div
                  className="absolute top-20 -left-10 w-24 h-24 rounded-full blur-2xl opacity-20 transition-colors duration-700"
                  style={{ backgroundColor: formData.secondaryColor }}
                />

                <div className="h-full flex flex-col relative z-10">
                  {/* Header */}
                  <div className="pt-10 pb-6 px-6 text-center">
                    <div className="mx-auto w-12 h-12 rounded-2xl mb-3 shadow-lg flex items-center justify-center overflow-hidden bg-white border border-slate-100">
                      {formData.logoUrl ? (
                        <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-white text-base font-black"
                          style={{ background: `linear-gradient(135deg, ${formData.primaryColor}, ${formData.secondaryColor})` }}
                        >
                          {merchant?.shop_name?.[0] || 'Q'}
                        </div>
                      )}
                    </div>
                    <h3 className="text-slate-900 font-bold text-xs tracking-tight">{merchant?.shop_name}</h3>
                    {/* Color Palette Indicator */}
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <div
                        className="w-4 h-4 rounded-full shadow-md transition-colors duration-500 ring-2 ring-white"
                        style={{ backgroundColor: formData.primaryColor }}
                      />
                      <div
                        className="w-4 h-4 rounded-full shadow-md transition-colors duration-500 ring-2 ring-white"
                        style={{ backgroundColor: formData.secondaryColor }}
                      />
                    </div>
                  </div>

                  {/* Main Card Area */}
                  <div className="flex-1 px-4 space-y-4">
                    <div
                      className="bg-white/95 backdrop-blur-sm rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border-2 transition-colors duration-500"
                      style={{ borderColor: `${formData.primaryColor}20` }}
                    >
                      {/* Points Counter */}
                      <div className="text-center mb-6">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Total Points</p>
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-4xl font-black tracking-tighter" style={{ color: formData.primaryColor }}>12</span>
                          <span className="text-slate-300 text-lg font-bold">
                            / {formData.tier2Enabled ? (previewData.tier2StampsRequired || previewData.stampsRequired * 2) : previewData.stampsRequired}
                          </span>
                        </div>
                      </div>

                      {/* Tiered Progress Bar */}
                      <div className="relative pt-6 pb-2">
                        <div className="relative h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                          {/* Shimmering Fill */}
                          <div
                            className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
                            style={{
                              width: `${(12 / (formData.tier2Enabled ? (previewData.tier2StampsRequired || previewData.stampsRequired * 2) : previewData.stampsRequired)) * 100}%`,
                              background: `linear-gradient(90deg, ${formData.primaryColor}, ${formData.secondaryColor})`,
                              boxShadow: `0 2px 8px ${formData.primaryColor}40`
                            }}
                          >
                            <div className="w-full h-full animate-pulse opacity-40 bg-gradient-to-r from-transparent via-white to-transparent" />
                          </div>
                        </div>

                        {/* Tier 1 Marker */}
                        {(() => {
                          const max = formData.tier2Enabled ? (previewData.tier2StampsRequired || previewData.stampsRequired * 2) : previewData.stampsRequired;
                          const t1Pos = (previewData.stampsRequired / max) * 100;
                          const reached = 12 >= previewData.stampsRequired;
                          return (
                            <div className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center" style={{ left: `${t1Pos}%` }}>
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center -mt-1 shadow-md transition-transform duration-300 border-2 ${reached ? 'bg-white scale-110' : 'bg-slate-50 scale-100 opacity-80'}`}
                                   style={{ borderColor: reached ? '#F59E0B' : '#E2E8F0' }}>
                                <Gift size={12} className={reached ? 'text-amber-500' : 'text-slate-300'} />
                              </div>
                            </div>
                          );
                        })()}

                        {/* Tier 2 Marker */}
                        {formData.tier2Enabled && (
                          <div className="absolute top-1/2 -translate-y-1/2 right-0 flex flex-col items-center">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center -mt-1 shadow-md border-2 transition-transform duration-300 ${12 >= (previewData.tier2StampsRequired || previewData.stampsRequired * 2) ? 'bg-white scale-110' : 'bg-slate-50 scale-100 opacity-80'}`}
                                 style={{ borderColor: 12 >= (previewData.tier2StampsRequired || previewData.stampsRequired * 2) ? formData.secondaryColor : '#E2E8F0' }}>
                              <Trophy size={12} className={12 >= (previewData.tier2StampsRequired || previewData.stampsRequired * 2) ? 'text-violet-600' : 'text-slate-300'} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Milestone Labels */}
                      <div className="flex justify-between mt-1 px-1">
                        <span className="text-[8px] font-semibold text-slate-400">0</span>
                        {formData.tier2Enabled && (
                          <span className="text-[8px] font-semibold text-amber-500">{previewData.stampsRequired}</span>
                        )}
                        <span className="text-[8px] font-semibold text-slate-400">
                          {formData.tier2Enabled ? previewData.tier2StampsRequired : previewData.stampsRequired}
                        </span>
                      </div>

                      {/* Progress Text */}
                      <p className="mt-4 text-center text-[10px] font-medium text-slate-500">
                        {12 >= previewData.stampsRequired
                          ? (formData.tier2Enabled
                              ? `Palier 1 débloqué ! Encore ${(previewData.tier2StampsRequired || previewData.stampsRequired * 2) - 12} pts`
                              : 'Récompense débloquée !')
                          : `Plus que ${previewData.stampsRequired - 12} pts pour le palier 1`
                        }
                      </p>
                    </div>

                    {/* Reward Cards */}
                    <div className="space-y-2">
                      {/* Tier 1 Reward */}
                      <div
                        className={`backdrop-blur-md rounded-2xl p-3 border-2 flex items-center gap-3 transition-all duration-500 ${12 >= previewData.stampsRequired ? 'bg-amber-50/80' : 'bg-white/70'}`}
                        style={{
                          borderColor: 12 >= previewData.stampsRequired ? '#FCD34D' : `${formData.primaryColor}15`
                        }}
                      >
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-500"
                          style={{
                            backgroundColor: 12 >= previewData.stampsRequired ? '#FEF3C7' : `${formData.primaryColor}15`
                          }}
                        >
                          <Gift size={14} className={12 >= previewData.stampsRequired ? 'text-amber-500' : 'text-slate-400'} style={{ color: 12 >= previewData.stampsRequired ? undefined : formData.primaryColor }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Palier 1</p>
                          <p className="text-[10px] font-bold text-slate-800 truncate">
                            {previewData.rewardDescription || 'Votre récompense'}
                          </p>
                        </div>
                        {12 >= previewData.stampsRequired && (
                          <span className="text-[8px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">Prêt</span>
                        )}
                      </div>

                      {/* Tier 2 Reward (if enabled) */}
                      {formData.tier2Enabled && (
                        <div
                          className={`backdrop-blur-md rounded-2xl p-3 border-2 flex items-center gap-3 transition-all duration-500 ${12 >= (previewData.tier2StampsRequired || previewData.stampsRequired * 2) ? 'bg-violet-50/80' : 'bg-white/70'}`}
                          style={{
                            borderColor: 12 >= (previewData.tier2StampsRequired || previewData.stampsRequired * 2) ? '#C4B5FD' : `${formData.secondaryColor}15`
                          }}
                        >
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-500"
                            style={{
                              backgroundColor: 12 >= (previewData.tier2StampsRequired || previewData.stampsRequired * 2) ? '#EDE9FE' : `${formData.secondaryColor}15`
                            }}
                          >
                            <Trophy size={14} className={12 >= (previewData.tier2StampsRequired || previewData.stampsRequired * 2) ? 'text-violet-600' : 'text-slate-400'} style={{ color: 12 >= (previewData.tier2StampsRequired || previewData.stampsRequired * 2) ? undefined : formData.secondaryColor }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Palier 2</p>
                            <p className="text-[10px] font-bold text-slate-800 truncate">
                              {previewData.tier2RewardDescription || 'Récompense premium'}
                            </p>
                          </div>
                          {12 >= (previewData.tier2StampsRequired || previewData.stampsRequired * 2) && (
                            <span className="text-[8px] font-bold text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full">Prêt</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Branding */}
                  <div className="py-4 flex flex-col items-center gap-1 opacity-40">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 bg-indigo-600 rounded flex items-center justify-center">
                        <span className="text-white text-[5px] font-black italic">Q</span>
                      </div>
                      <span className="text-[9px] font-black tracking-tighter text-indigo-900">QARTE</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Program Guide Modal */}
      <ProgramGuide
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
      />

      {/* Sticky Save Button (All Screens) */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-72 z-50 p-3 lg:p-4 bg-white/70 backdrop-blur-xl border-t border-gray-100/50 shadow-lg shadow-gray-900/5">
        <div className="max-w-6xl mx-auto flex justify-center lg:justify-end">
          <Button
            onClick={handleSave}
            loading={saving}
            disabled={saved}
            className={`
              w-full lg:w-auto h-12 lg:h-10 px-6 rounded-xl font-semibold text-base lg:text-sm flex items-center justify-center gap-2 transition-all duration-300
              ${saved
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200/50'
                : 'bg-slate-800 text-white shadow-md hover:bg-slate-700 hover:shadow-lg lg:bg-slate-100 lg:text-slate-700 lg:border lg:border-slate-200 lg:hover:bg-slate-200 lg:hover:border-slate-300'}
            `}
          >
            {saved ? (
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
          </Button>
        </div>
      </div>

      {/* Spacer for sticky button */}
      <div className="h-20 lg:h-16" />
    </div>
  );
}
