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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mon Programme</h1>
          <p className="mt-1 text-gray-600">
            Personnalisez votre programme de fidélité
          </p>
        </div>
        <Button onClick={handleSave} loading={saving} disabled={saved}>
          {saved ? (
            <>
              <Check className="w-5 h-5 mr-2" />
              Enregistré
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Enregistrer
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="p-6 bg-white rounded-2xl shadow-sm">
            <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-900">
              <Upload className="w-5 h-5 text-primary" />
              Logo
            </h3>

            <div className="space-y-4">
              <div>
                <label className="label">Télécharger votre logo</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center justify-center w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary transition-colors">
                    {uploading ? (
                      <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                    ) : formData.logoUrl ? (
                      <img
                        src={formData.logoUrl}
                        alt="Logo"
                        className="object-cover w-full h-full rounded-xl"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                  <p className="text-sm text-gray-500">PNG, JPG (max 2MB)</p>
                </div>
              </div>

              <div>
                <label className="label">Ou choisissez une image</label>
                <div className="grid grid-cols-3 gap-2">
                  {UNSPLASH_IMAGES.map((url, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setFormData({ ...formData, logoUrl: url })}
                      className={`relative h-16 overflow-hidden rounded-xl border-2 transition-all ${
                        formData.logoUrl === url
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img src={url} alt="" className="object-cover w-full h-full" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-2xl shadow-sm">
            <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-900">
              <Palette className="w-5 h-5 text-primary" />
              Couleurs
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Couleur principale</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) =>
                      setFormData({ ...formData, primaryColor: e.target.value })
                    }
                    className="w-12 h-12 border-0 rounded-xl cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={formData.primaryColor}
                    onChange={(e) =>
                      setFormData({ ...formData, primaryColor: e.target.value })
                    }
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <label className="label">Couleur secondaire</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.secondaryColor}
                    onChange={(e) =>
                      setFormData({ ...formData, secondaryColor: e.target.value })
                    }
                    className="w-12 h-12 border-0 rounded-xl cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={formData.secondaryColor}
                    onChange={(e) =>
                      setFormData({ ...formData, secondaryColor: e.target.value })
                    }
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-2xl shadow-sm">
            <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-900">
              <Gift className="w-5 h-5 text-primary" />
              Programme de fidélité
            </h3>

            <div className="space-y-4">
              <Input
                label="Nom du programme"
                placeholder="Ex: Carte Fidélité Mario Pizza"
                value={formData.programName}
                onChange={(e) =>
                  setFormData({ ...formData, programName: e.target.value })
                }
              />

              <Textarea
                label="Message de bienvenue"
                placeholder="Ex: Bienvenue ! Cumulez vos passages..."
                value={formData.welcomeMessage}
                onChange={(e) =>
                  setFormData({ ...formData, welcomeMessage: e.target.value })
                }
                maxLength={200}
                showCount
              />

              <div className="p-4 rounded-xl bg-gray-50">
                <p className="mb-4 font-medium text-gray-900">
                  Règle de récompense
                </p>
                <div className="flex flex-wrap items-center gap-2 text-gray-700">
                  <span>Après</span>
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
                    className="w-20 text-center"
                  />
                  <span>passages, obtenez</span>
                </div>
                <Input
                  placeholder="Ex: 20% de réduction, 1 café offert..."
                  value={formData.rewardDescription}
                  onChange={(e) =>
                    setFormData({ ...formData, rewardDescription: e.target.value })
                  }
                  className="mt-3"
                />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-2xl shadow-sm">
            <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-900">
              <Megaphone className="w-5 h-5 text-primary" />
              Message promotionnel (optionnel)
            </h3>

            <Input
              placeholder="Ex: 🎉 2 croissants achetés = 1 offert jusqu'à dimanche"
              value={formData.promoMessage}
              onChange={(e) =>
                setFormData({ ...formData, promoMessage: e.target.value })
              }
              helperText="Ce message s'affichera en bannière sur la page client"
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
