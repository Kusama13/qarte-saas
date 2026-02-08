'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CreditCard,
  Upload,
  Palette,
  Gift,
  ArrowRight,
  ArrowLeft,
  Check,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import { Button, Input, Textarea } from '@/components/ui';
import { getSupabase } from '@/lib/supabase';
import type { Merchant } from '@/types';

// Images beauté / bien-être
const UNSPLASH_IMAGES = [
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200', // Coiffeur
  'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=200', // Institut
  'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=200', // Onglerie
  'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=200', // Spa
  'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=200', // Massage
  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=200', // Barbier
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = getSupabase();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [merchant, setMerchant] = useState<Merchant | null>(null);

  const [formData, setFormData] = useState({
    logoUrl: '',
    primaryColor: '#654EDA',
    secondaryColor: '#9D8FE8',
    programName: '',
    welcomeMessage: '',
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
          programName: data.program_name || `Carte Fidélité ${data.shop_name}`,
          welcomeMessage: data.welcome_message || 'Bienvenue ! Cumulez vos passages et gagnez des récompenses.',
          stampsRequired: data.stamps_required || 10,
          rewardDescription: data.reward_description || '',
        });
      }
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

    setLoading(true);
    try {
      const { error } = await supabase
        .from('merchants')
        .update({
          logo_url: formData.logoUrl || null,
          primary_color: formData.primaryColor,
          secondary_color: formData.secondaryColor,
          program_name: formData.programName,
          welcome_message: formData.welcomeMessage,
          stamps_required: formData.stampsRequired,
          reward_description: formData.rewardDescription,
          onboarding_completed: true,
        })
        .eq('id', merchant.id);

      if (error) throw error;

      // Send social kit email if logo is set (fire and forget)
      if (formData.logoUrl && formData.rewardDescription) {
        fetch('/api/emails/social-kit', { method: 'POST' }).catch(() => {});
      }

      router.push('/dashboard/qr-download');
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Logo & Couleurs' },
    { number: 2, title: 'Programme' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-4 mx-auto max-w-7xl">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Qarte</span>
          </Link>

          <div className="flex items-center gap-2">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    currentStep >= step.number
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {currentStep > step.number ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    step.number
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 h-1 mx-2 rounded ${
                      currentStep > step.number ? 'bg-primary' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="px-4 py-8 mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {currentStep === 1
                  ? 'Personnalisez votre identité'
                  : 'Configurez votre programme'}
              </h1>
              <p className="mt-2 text-gray-600">
                {currentStep === 1
                  ? 'Ajoutez votre logo et choisissez vos couleurs pour une expérience personnalisée.'
                  : 'Définissez les règles de votre programme de fidélité.'}
              </p>
            </div>

            {currentStep === 1 && (
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
                        <p className="text-sm text-gray-500">
                          PNG, JPG (max 2MB)
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="label">Ou choisissez une image</label>
                      <div className="grid grid-cols-3 gap-2">
                        {UNSPLASH_IMAGES.map((url, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() =>
                              setFormData({ ...formData, logoUrl: url })
                            }
                            className={`relative h-16 overflow-hidden rounded-xl border-2 transition-all ${
                              formData.logoUrl === url
                                ? 'border-primary ring-2 ring-primary/20'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <img
                              src={url}
                              alt=""
                              className="object-cover w-full h-full"
                            />
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
                            setFormData({
                              ...formData,
                              primaryColor: e.target.value,
                            })
                          }
                          className="w-12 h-12 border-0 rounded-xl cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={formData.primaryColor}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              primaryColor: e.target.value,
                            })
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
                            setFormData({
                              ...formData,
                              secondaryColor: e.target.value,
                            })
                          }
                          className="w-12 h-12 border-0 rounded-xl cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={formData.secondaryColor}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              secondaryColor: e.target.value,
                            })
                          }
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
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
                      placeholder="Ex: Bienvenue ! Cumulez vos passages et gagnez des récompenses."
                      value={formData.welcomeMessage}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          welcomeMessage: e.target.value,
                        })
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
                          setFormData({
                            ...formData,
                            rewardDescription: e.target.value,
                          })
                        }
                        className="mt-3"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <div className="flex gap-4">
                {currentStep > 1 && (
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(currentStep - 1)}
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Retour
                  </Button>
                )}
                {currentStep < 2 ? (
                  <Button
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="flex-1"
                  >
                    Continuer
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSave}
                    loading={loading}
                    className="flex-1"
                    disabled={!formData.rewardDescription}
                  >
                    Générer mon QR code
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                )}
              </div>
              <Link
                href="/dashboard"
                className="text-center text-sm text-gray-500 hover:text-primary transition-colors"
              >
                Revenir au tableau de bord
              </Link>
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
                            {merchant?.shop_name || 'Votre Commerce'}
                          </span>
                        )}
                      </div>

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
                          {[...Array(Math.min(formData.stampsRequired, 12))].map(
                            (_, i) => (
                              <div
                                key={i}
                                className="w-5 h-5 rounded-full border-2"
                                style={{
                                  borderColor: formData.primaryColor,
                                  backgroundColor:
                                    i < 4 ? formData.primaryColor : 'transparent',
                                }}
                              />
                            )
                          )}
                        </div>

                        <p className="text-xs text-gray-500">
                          4 / {formData.stampsRequired} passages
                        </p>

                        {formData.rewardDescription && (
                          <div
                            className="mt-4 p-3 rounded-xl text-center w-full"
                            style={{
                              backgroundColor: `${formData.secondaryColor}20`,
                            }}
                          >
                            <p className="text-xs font-medium" style={{ color: formData.primaryColor }}>
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
      </main>
    </div>
  );
}
