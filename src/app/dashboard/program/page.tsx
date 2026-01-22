'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  Palette,
  Gift,
  Megaphone,
  Save,
  Loader2,
  Image as ImageIcon,
  Check,
  Star,
} from 'lucide-react';
import { Button, Input, Textarea } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import type { Merchant } from '@/types';

const UNSPLASH_IMAGES = [
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200',
  'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200',
  'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=200',
  'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=200',
];

export default function ProgramPage() {
  const router = useRouter();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  const [formData, setFormData] = useState({
    logoUrl: '',
    primaryColor: '#654EDA',
    secondaryColor: '#9D8FE8',
    programName: '',
    welcomeMessage: '',
    promoMessage: '',
    reviewLink: '',
    stampsRequired: 10,
    rewardDescription: '',
  });

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
          programName: data.program_name || '',
          welcomeMessage: data.welcome_message || '',
          promoMessage: data.promo_message || '',
          reviewLink: data.review_link || '',
          stampsRequired: data.stamps_required || 10,
          rewardDescription: data.reward_description || '',
        });
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
          program_name: formData.programName,
          welcome_message: formData.welcomeMessage,
          promo_message: formData.promoMessage || null,
          review_link: formData.reviewLink || null,
          stamps_required: formData.stampsRequired,
          reward_description: formData.rewardDescription,
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
                  {UNSPLASH_IMAGES.map((url, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setFormData({ ...formData, logoUrl: url })}
                      className={`relative h-20 overflow-hidden rounded-xl border-2 transition-all duration-300 transform active:scale-95 group/img ${
                        formData.logoUrl === url
                          ? 'border-indigo-600 ring-4 ring-indigo-500/10'
                          : 'border-white shadow-sm hover:border-indigo-200 hover:shadow-md'
                      }`}
                    >
                      <img src={url} alt="" className="object-cover w-full h-full transition-transform duration-500 group-hover/img:scale-110" />
                      {formData.logoUrl === url && (
                        <div className="absolute inset-0 flex items-center justify-center bg-indigo-600/10">
                          <div className="p-1 bg-white rounded-full shadow-sm">
                            <div className="w-2 h-2 rounded-full bg-indigo-600" />
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

            <div className="grid gap-6 sm:grid-cols-2">
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
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-200 ring-4 ring-indigo-50/50">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 leading-tight">Programme de fidélité</h3>
                <p className="text-sm font-medium text-gray-500">Personnalisez l'expérience client</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="group transition-all duration-200 focus-within:translate-x-1">
                <Input
                  label="Nom du programme"
                  placeholder="Ex: Carte Fidélité Mario Pizza"
                  value={formData.programName}
                  onChange={(e) =>
                    setFormData({ ...formData, programName: e.target.value })
                  }
                  className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/10"
                />
              </div>

              <div className="group transition-all duration-200 focus-within:translate-x-1">
                <Textarea
                  label="Message de bienvenue"
                  placeholder="Ex: Bienvenue ! Cumulez vos passages..."
                  value={formData.welcomeMessage}
                  onChange={(e) =>
                    setFormData({ ...formData, welcomeMessage: e.target.value })
                  }
                  maxLength={200}
                  showCount
                  className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/10"
                />
              </div>

              <div className="relative p-6 transition-all border bg-gradient-to-br from-emerald-50/80 to-teal-50/50 border-emerald-100/50 rounded-2xl group hover:shadow-md hover:shadow-emerald-100/30">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-1.5 h-6 rounded-full bg-emerald-500" />
                  <p className="font-bold text-emerald-900">Règle de récompense</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-emerald-800 font-medium mb-4">
                  <span>Après</span>
                  <div className="relative">
                    <Input
                      type="number"
                      min={2}
                      max={50}
                      value={formData.stampsRequired}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          stampsRequired: parseInt(e.target.value) || 10,
                        })
                      }
                      className="w-24 text-center font-bold text-emerald-700 bg-white border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                    />
                  </div>
                  <span>passages, obtenez :</span>
                </div>

                <div className="relative">
                  <Input
                    placeholder="Ex: 20% de réduction, 1 café offert..."
                    value={formData.rewardDescription}
                    onChange={(e) =>
                      setFormData({ ...formData, rewardDescription: e.target.value })
                    }
                    className="bg-white border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20 placeholder:text-emerald-300"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="p-1.5 rounded-full bg-emerald-100">
                      <Gift className="w-4 h-4 text-emerald-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-amber-50/40 via-white/80 to-orange-50/30 backdrop-blur-md border border-orange-100/50 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
            <h3 className="flex items-center gap-3 mb-6 text-lg font-semibold text-gray-900">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-tr from-orange-500 to-amber-400 rounded-xl shadow-lg shadow-orange-200/50">
                <Megaphone className="w-5 h-5 text-white" />
              </div>
              Message promotionnel (optionnel)
            </h3>

            <Input
              className="bg-white/60 border-orange-200/60 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all duration-300"
              placeholder="Ex: 🎉 2 croissants achetés = 1 offert jusqu'à dimanche"
              value={formData.promoMessage}
              onChange={(e) =>
                setFormData({ ...formData, promoMessage: e.target.value })
              }
              helperText="Ce message s'affichera en bannière sur la page client"
            />
          </div>

          <div className="p-6 bg-gradient-to-br from-amber-50/50 via-white/80 to-yellow-50/50 backdrop-blur-md border border-amber-100/50 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center gap-4 mb-5">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-white shadow-lg shadow-amber-200/40 group-hover:scale-105 group-hover:rotate-6 transition-all duration-300">
                <Star className="w-5 h-5 fill-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 leading-none mb-1">
                  Lien pour laisser un avis
                </h3>
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Recommandé</p>
              </div>
            </div>

            <Input
              type="url"
              className="bg-white/60 border-amber-200/50 focus:border-amber-400 focus:ring-amber-400/20 transition-all h-11"
              placeholder="Ex: https://g.page/r/votre-commerce/review"
              value={formData.reviewLink}
              onChange={(e) =>
                setFormData({ ...formData, reviewLink: e.target.value })
              }
              helperText="Redirigez vos clients vers Google ou TripAdvisor pour booster votre e-réputation"
            />
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-8">
            <p className="mb-4 text-sm font-medium text-gray-500 text-center">
              Aperçu en temps réel
            </p>
            <div className="flex justify-center">
              <div className="phone-mockup">
                <div className="phone-mockup-screen">
                  <div className="flex flex-col h-full">
                    <div
                      className="flex items-center justify-center h-16"
                      style={{ backgroundColor: formData.primaryColor }}
                    >
                      {formData.logoUrl ? (
                        <img
                          src={formData.logoUrl}
                          alt="Logo"
                          className="object-cover w-10 h-10 rounded-lg"
                        />
                      ) : (
                        <span className="text-lg font-bold text-white">
                          {merchant?.shop_name}
                        </span>
                      )}
                    </div>

                    {formData.promoMessage && (
                      <div
                        className="px-4 py-2 text-xs text-center text-white"
                        style={{ backgroundColor: formData.secondaryColor }}
                      >
                        {formData.promoMessage}
                      </div>
                    )}

                    <div
                      className="flex flex-col items-center flex-1 p-4"
                      style={{
                        background: `linear-gradient(180deg, ${formData.primaryColor}10 0%, white 100%)`,
                      }}
                    >
                      <p className="mb-2 text-sm font-medium text-center text-gray-900">
                        {formData.programName || 'Carte Fidélité'}
                      </p>
                      <p className="mb-4 text-xs text-center text-gray-600">
                        {formData.welcomeMessage || 'Bienvenue !'}
                      </p>

                      <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                        {[...Array(Math.min(formData.stampsRequired, 12))].map((_, i) => (
                          <div
                            key={i}
                            className="w-5 h-5 rounded-full border-2"
                            style={{
                              borderColor: formData.primaryColor,
                              backgroundColor:
                                i < 4 ? formData.primaryColor : 'transparent',
                            }}
                          />
                        ))}
                      </div>

                      <p className="text-xs text-gray-500">
                        4 / {formData.stampsRequired} passages
                      </p>

                      {formData.rewardDescription && (
                        <div
                          className="mt-4 p-3 rounded-xl text-center w-full"
                          style={{ backgroundColor: `${formData.secondaryColor}20` }}
                        >
                          <p
                            className="text-xs font-medium"
                            style={{ color: formData.primaryColor }}
                          >
                            Récompense : {formData.rewardDescription}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
