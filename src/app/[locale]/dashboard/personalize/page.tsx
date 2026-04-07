'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Camera, Check, ArrowRight, Loader2, Palette, ArrowLeft } from 'lucide-react';
import { useMerchant } from '@/contexts/MerchantContext';
import { getSupabase } from '@/lib/supabase';
import { compressLogo } from '@/lib/image-compression';
import { useTranslations } from 'next-intl';

const COLOR_PALETTES = [
  // Row 1
  { primary: '#1e293b', secondary: '#475569', name: 'Elegant' },
  { primary: '#db2777', secondary: '#f472b6', name: 'Glamour' },
  { primary: '#7c3aed', secondary: '#a78bfa', name: 'Moderne' },
  { primary: '#059669', secondary: '#10b981', name: 'Zen' },
  // Row 2
  { primary: '#92704f', secondary: '#c8a97e', name: 'Sable' },
  { primary: '#b45309', secondary: '#f59e0b', name: 'Dore' },
  { primary: '#0369a1', secondary: '#38bdf8', name: 'Ocean' },
  { primary: '#dc2626', secondary: '#f87171', name: 'Passion' },
  // Row 3
  { primary: '#0f766e', secondary: '#5eead4', name: 'Menthe' },
  { primary: '#4338ca', secondary: '#818cf8', name: 'Indigo' },
  { primary: '#c2410c', secondary: '#fb923c', name: 'Terracotta' },
  { primary: '#171717', secondary: '#404040', name: 'Noir' },
];

function PersonalizeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const supabase = getSupabase();
  const { merchant, loading, refetch } = useMerchant();
  const t = useTranslations('personalize');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#654EDA');
  const [secondaryColor, setSecondaryColor] = useState('#9D8FE8');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Init from existing merchant data (in case of re-visit)
  useEffect(() => {
    if (merchant) {
      if (merchant.logo_url) setLogoUrl(merchant.logo_url);
      if (merchant.primary_color) setPrimaryColor(merchant.primary_color);
      if (merchant.secondary_color) setSecondaryColor(merchant.secondary_color);
    }
  }, [merchant]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !merchant) return;

    setUploading(true);
    try {
      const compressedFile = await compressLogo(file);
      const fileExt = file.name.split('.').pop();
      const fileName = `${merchant.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, compressedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName);

      setLogoUrl(publicUrl);
    } catch (error) {
      console.error('Error uploading logo:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleContinue = async () => {
    if (!merchant) return;
    setSaving(true);

    try {
      const { error: updateError } = await supabase.from('merchants').update({
        logo_url: logoUrl || null,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
      }).eq('id', merchant.id);

      if (updateError) throw updateError;

      refetch().catch(() => {});
      if (from === 'program') {
        router.push('/dashboard/program');
      } else if (from === 'public-page') {
        router.push('/dashboard/public-page');
      } else {
        router.push('/dashboard/program');
      }
    } catch (error) {
      console.error('Error saving:', error);
      setSaving(false);
    }
  };

  if (loading || !merchant) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12 max-w-md mx-auto">
      {/* Back button when coming from another page */}
      {from && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => router.push(from === 'program' ? '/dashboard/program' : '/dashboard/public-page')}
          className="self-start mb-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('back')}
        </motion.button>
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
          {from ? t('titleEdit') : t('titleAdd')}{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">{t('titleHighlight')}</span>
        </h1>
        <p className="text-gray-500 mt-2 text-sm">
          {from ? t('subtitleEdit') : t('subtitleAdd')}
        </p>
      </motion.div>

      {/* Logo upload */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-full mb-6"
      >
        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3 block">
          {t('logoLabel')}
        </label>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border-2 border-dashed border-gray-200 hover:border-indigo-300 transition-all group"
        >
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
            {uploading ? (
              <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
            ) : logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <Camera className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
            )}
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-800">
              {logoUrl ? t('changeLogo') : t('addLogo')}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {logoUrl ? t('changeLogoHint') : t('addLogoHint')}
            </p>
          </div>
          {logoUrl && (
            <div className="ml-auto">
              <div className="p-1 bg-emerald-500 rounded-full">
                <Check className="w-3 h-3 text-white" />
              </div>
            </div>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </motion.div>

      {/* Color palettes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full mb-8"
      >
        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5" />
          {t('ambianceLabel')}
        </label>
        <div className="grid grid-cols-4 gap-2">
          {COLOR_PALETTES.map((palette, index) => {
            const selected = primaryColor === palette.primary && secondaryColor === palette.secondary;
            return (
              <button
                key={index}
                type="button"
                onClick={() => {
                  setPrimaryColor(palette.primary);
                  setSecondaryColor(palette.secondary);
                }}
                className={`relative p-2.5 rounded-xl border-2 transition-all duration-200 ${
                  selected
                    ? 'border-indigo-600 ring-4 ring-indigo-500/10 shadow-lg'
                    : 'border-gray-100 hover:border-indigo-200 hover:shadow-md'
                }`}
              >
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex gap-0.5">
                    <div className="w-5 h-5 rounded-l-md" style={{ backgroundColor: palette.primary }} />
                    <div className="w-5 h-5 rounded-r-md" style={{ backgroundColor: palette.secondary }} />
                  </div>
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wide">{palette.name}</span>
                </div>
                {selected && (
                  <div className="absolute -top-1 -right-1">
                    <div className="p-0.5 bg-indigo-600 rounded-full shadow-sm">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="w-full space-y-3"
      >
        <button
          onClick={handleContinue}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold shadow-lg shadow-indigo-200/50 hover:shadow-xl hover:shadow-indigo-200/60 transition-all disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : from ? (
            <>
              <Check className="w-5 h-5" />
              {t('save')}
            </>
          ) : (
            <>
              {t('continue')}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}

export default function PersonalizePage() {
  return (
    <Suspense fallback={
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    }>
      <PersonalizeContent />
    </Suspense>
  );
}
