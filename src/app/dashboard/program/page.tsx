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
  ChevronRight,
  X,
  Gift,
  Footprints,
  Coffee,
  Pizza,
  ShoppingBag,
  AlertTriangle,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { MerchantSettingsForm, ProgramGuide, type LoyaltySettings } from '@/components/loyalty';
import type { Merchant, LoyaltyMode } from '@/types';

// Images par type de commerce
const BUSINESS_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=200', label: 'Coiffeur' },
  { url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200', label: 'Restaurant' },
  { url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200', label: 'Café' },
  { url: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=200', label: 'Boulangerie' },
  { url: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=200', label: 'Fleuriste' },
  { url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=200', label: 'Onglerie' },
  { url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=200', label: 'Épicerie' },
  { url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200', label: 'Boutique' },
  { url: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=200', label: 'Spa' },
];

// Get icon based on loyalty mode and product name
const getLoyaltyIcon = (loyaltyMode: string, productName: string) => {
  if (loyaltyMode === 'visit') {
    return Footprints; // Walking person for visits
  }
  const name = (productName || '').toLowerCase();
  if (name.includes('café') || name.includes('cafe') || name.includes('coffee')) {
    return Coffee;
  }
  if (name.includes('pizza') || name.includes('burger') || name.includes('sandwich')) {
    return Pizza;
  }
  return ShoppingBag;
};

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
    loyaltyMode: 'visit' as LoyaltyMode,
    productName: '',
    maxQuantityPerScan: 5,
  });

  // Preview data for mockup (updated in real-time, not saved until save button)
  const [previewData, setPreviewData] = useState({
    stampsRequired: 10,
    rewardDescription: '',
    loyaltyMode: 'visit' as LoyaltyMode,
    productName: '',
  });

  // Track original stamps required for warning
  const [originalStampsRequired, setOriginalStampsRequired] = useState(10);
  const [showStampsWarning, setShowStampsWarning] = useState(false);

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
          loyaltyMode: data.loyalty_mode || 'visit',
          productName: data.product_name || '',
          maxQuantityPerScan: data.max_quantity_per_scan || 5,
        });
        setPreviewData({
          stampsRequired: data.stamps_required || 10,
          rewardDescription: data.reward_description || '',
          loyaltyMode: data.loyalty_mode || 'visit',
          productName: data.product_name || '',
        });
        setOriginalStampsRequired(data.stamps_required || 10);
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
      const fileExt = file.name.split('.').pop();
      const fileName = `${merchant?.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, file);

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
          loyalty_mode: formData.loyaltyMode,
          product_name: formData.loyaltyMode === 'article' ? formData.productName : null,
          max_quantity_per_scan: formData.loyaltyMode === 'article' ? formData.maxQuantityPerScan : 1,
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
    // Update preview
    setPreviewData({
      loyaltyMode: settings.loyalty_mode,
      productName: settings.product_name || '',
      stampsRequired: settings.stamps_required,
      rewardDescription: settings.reward_description,
    });

    // Also update formData so the main save button uses current values
    setFormData(prev => ({
      ...prev,
      loyaltyMode: settings.loyalty_mode,
      productName: settings.product_name || '',
      maxQuantityPerScan: settings.max_quantity_per_scan,
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
              initialMode={formData.loyaltyMode}
              initialProductName={formData.productName}
              initialMaxQuantity={formData.maxQuantityPerScan}
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

          {/* Review Link Section */}
          <div className="relative overflow-hidden p-8 bg-gradient-to-br from-white via-amber-50/30 to-yellow-50/40 border border-amber-200/60 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-500 group">
            {/* Decorative element */}
            <div className="absolute -right-16 -top-16 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-400/20 transition-all duration-700" />

            <div className="relative flex flex-col lg:flex-row gap-10">
              <div className="flex-1 space-y-6">
                <div className="flex items-center gap-5">
                  <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-white shadow-xl shadow-amber-200 group-hover:scale-105 group-hover:rotate-3 transition-all duration-300">
                    <Star className="w-7 h-7 fill-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                      Boostez votre E-réputation
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Impact Prioritaire</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-sm font-bold text-slate-700">Lien Google ou TripAdvisor</label>
                    <a href="https://support.google.com/business/answer/7035772" target="_blank" rel="noreferrer" className="text-[11px] text-slate-400 hover:text-amber-600 flex items-center gap-1 transition-colors">
                      Comment trouver mon lien ? <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="relative">
                    <Input
                      type="url"
                      className="bg-white border-2 border-amber-100/80 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 transition-all h-14 text-base shadow-sm pr-12 rounded-xl"
                      placeholder="https://g.page/r/votre-commerce/review"
                      value={formData.reviewLink}
                      onChange={(e) =>
                        setFormData({ ...formData, reviewLink: e.target.value })
                      }
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-400">
                      <Star className="w-5 h-5 fill-current opacity-20" />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed px-1 font-medium">
                    Une fois configuré, vos clients recevront automatiquement une invitation à noter leur expérience.
                  </p>
                </div>
              </div>

              <div className="w-full lg:w-72 flex flex-col gap-5">
                <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-amber-200/50 shadow-lg shadow-amber-100/20 relative group-hover:-translate-y-1 transition-transform duration-500">
                  <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 px-2 py-1 rounded-md border border-amber-100 inline-block mb-4">
                    Aperçu Client
                  </span>
                  <div className="text-center">
                    <p className="text-xs font-bold text-slate-800 mb-3">Voulez-vous nous aider ?</p>
                    <div className="flex justify-center gap-1.5 mb-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                    <div className="h-8 w-full bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg flex items-center justify-center text-[10px] font-black text-white shadow-md shadow-amber-200 tracking-wider">
                      DONNER MON AVIS
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 px-2">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    <span className="text-[11px] text-slate-600 font-medium">Répondez à chaque avis reçu</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    <span className="text-[11px] text-slate-600 font-medium">Demandez l&apos;avis oralement</span>
                  </div>
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
              <div className="relative w-[280px] h-[560px] bg-white rounded-[3rem] border-[8px] border-slate-900 shadow-2xl overflow-hidden ring-1 ring-slate-200">
                <div className="h-full flex flex-col bg-slate-50/50">
                  {/* Header: Gradient + Pattern + Logo */}
                  <div
                    className="relative pt-6 pb-6 px-6 overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${formData.primaryColor}, ${formData.secondaryColor})` }}
                  >
                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
                    <div className="relative flex flex-col items-center">
                      <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-lg mb-2 overflow-hidden">
                        {formData.logoUrl ? (
                          <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl font-black text-white">{merchant?.shop_name?.[0] || 'Q'}</span>
                        )}
                      </div>
                      <h3 className="text-white font-bold text-sm tracking-tight">{merchant?.shop_name}</h3>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 px-3 -mt-4 z-10">
                    {/* Review Banner (compact) */}
                    {formData.reviewLink && (
                      <div className="mb-2 bg-amber-50 rounded-xl px-3 py-2 border border-amber-100 flex items-center gap-2">
                        <Star size={14} className="text-amber-500 fill-amber-500 flex-shrink-0" />
                        <p className="text-[10px] font-semibold text-amber-700 flex-1">Votre avis compte !</p>
                        <button className="p-0.5 hover:bg-amber-100 rounded transition-colors">
                          <X size={12} className="text-amber-400" />
                        </button>
                      </div>
                    )}

                    {/* Points Card */}
                    <div className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-slate-100/50 flex flex-col items-center">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                        {(() => {
                          const LoyaltyIcon = getLoyaltyIcon(previewData.loyaltyMode, previewData.productName);
                          return <LoyaltyIcon className="w-3 h-3" />;
                        })()}
                        {previewData.loyaltyMode === 'visit' ? 'Passages cumulés' : `${previewData.productName || 'Articles'} cumulés`}
                      </p>

                      <div className="flex items-baseline gap-1 mb-3">
                        <span className="text-3xl font-black tracking-tighter" style={{ color: formData.primaryColor }}>4</span>
                        <span className="text-slate-300 text-base font-bold">/{previewData.stampsRequired}</span>
                      </div>

                      {/* Stamp Circles Grid */}
                      <div className="grid grid-cols-5 gap-1.5 mb-3 w-full">
                        {Array.from({ length: Math.min(previewData.stampsRequired, 10) }).map((_, i) => {
                          const isFilled = i < 4;
                          const LoyaltyIcon = getLoyaltyIcon(previewData.loyaltyMode, previewData.productName);
                          return (
                            <div
                              key={i}
                              className={`aspect-square rounded-full flex items-center justify-center transition-all ${
                                isFilled ? 'shadow-sm' : 'border border-dashed border-slate-200'
                              }`}
                              style={{
                                backgroundColor: isFilled ? formData.primaryColor : 'transparent',
                              }}
                            >
                              <LoyaltyIcon
                                className="w-1/2 h-1/2"
                                style={{ color: isFilled ? '#fff' : '#D1D5DB' }}
                              />
                            </div>
                          );
                        })}
                      </div>

                      {/* Small Progress Bar */}
                      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mb-3">
                        <div
                          className="h-full transition-all duration-700 ease-out"
                          style={{
                            width: `${Math.min((4 / previewData.stampsRequired) * 100, 100)}%`,
                            background: `linear-gradient(to right, ${formData.primaryColor}, ${formData.secondaryColor})`
                          }}
                        />
                      </div>

                      <div
                        className="px-3 py-1.5 rounded-full text-[10px] font-semibold text-center"
                        style={{ backgroundColor: `${formData.primaryColor}10`, color: formData.primaryColor }}
                      >
                        Plus que {Math.max(previewData.stampsRequired - 4, 0)} pour la récompense !
                      </div>
                    </div>

                    {/* Reward Card */}
                    <div className="mt-2 bg-white rounded-xl p-2.5 shadow-sm border border-slate-100 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${formData.secondaryColor}15` }}>
                        <Gift size={14} style={{ color: formData.secondaryColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Récompense</p>
                        <p className="text-[10px] font-bold text-slate-800 truncate leading-tight">
                          {previewData.rewardDescription || 'Chargement...'}
                        </p>
                      </div>
                      <ChevronRight size={12} className="text-slate-300" />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="py-2 flex flex-col items-center gap-1 opacity-60">
                    <div className="flex items-center gap-1">
                      <span className="text-[8px] font-medium text-slate-500">Créé avec</span>
                      <span className="text-[8px]">❤️</span>
                      <span className="text-[8px] font-medium text-slate-500">en France</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 bg-gradient-to-br from-indigo-600 to-violet-600 rounded flex items-center justify-center">
                        <span className="text-white text-[6px] font-black italic">Q</span>
                      </div>
                      <span className="text-[10px] font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                        QARTE
                      </span>
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

      {/* Sticky Save Button (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden z-50 p-4 bg-white/80 backdrop-blur-xl border-t border-gray-100 shadow-2xl shadow-gray-900/10">
        <Button
          onClick={handleSave}
          loading={saving}
          disabled={saved}
          className={`
            w-full h-14 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300
            ${saved
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
              : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200 hover:shadow-xl'}
          `}
        >
          {saved ? (
            <>
              <Check className="w-6 h-6" />
              <span>Enregistré !</span>
            </>
          ) : (
            <>
              <Save className="w-6 h-6" />
              <span>Enregistrer les modifications</span>
            </>
          )}
        </Button>
      </div>

      {/* Spacer for sticky button on mobile */}
      <div className="h-24 lg:hidden" />
    </div>
  );
}
