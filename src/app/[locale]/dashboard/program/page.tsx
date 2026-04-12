'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useDashboardSave } from '@/hooks/useDashboardSave';
import {
  Save,
  Loader2,
  Check,
  Sparkles,
  Smartphone,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { type LoyaltySettings } from '@/components/loyalty';
import { useMerchant } from '@/contexts/MerchantContext';
import { useTranslations } from 'next-intl';
import type { Merchant } from '@/types';
import type { ProgramFormData } from './types';
import { CardPreview } from './CardPreview';
import { LoyaltyModeSection } from './LoyaltyModeSection';
import { ExtrasSection } from './ExtrasSection';


export default function ProgramPage() {
  const t = useTranslations('program');
  const router = useRouter();
  const { refetch: refetchMerchantContext } = useMerchant();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);
  const { saving, saved, save } = useDashboardSave();
  const [isFirstSetup, setIsFirstSetup] = useState(false);

  // Main form data (saved to DB)
  const [formData, setFormData] = useState<ProgramFormData>({
    logoUrl: '',
    primaryColor: '#654EDA',
    secondaryColor: '#9D8FE8',
    reviewLink: '',
    loyaltyMode: 'visit',
    stampsRequired: 5,
    rewardDescription: '',
    // Cagnotte mode
    cagnottePercent: 10,
    cagnotteTier2Percent: 15,
    // 2nd tier reward
    tier2Enabled: false,
    tier2StampsRequired: 0,
    tier2RewardDescription: '',
    // Duo offer
    duoOfferEnabled: false,
    duoOfferDescription: '',
    // Double stamp days
    doubleDaysEnabled: false,
    doubleDaysOfWeek: [],
    // Birthday gift
    birthdayGiftEnabled: false,
    birthdayGiftDescription: '',
    // Referral
    referralEnabled: false,
    referralRewardReferred: '',
    referralRewardReferrer: '',
  });

  // Track original values for warnings
  const [originalLoyaltyMode, setOriginalLoyaltyMode] = useState<'visit' | 'cagnotte'>('visit');
  const [originalStampsRequired, setOriginalStampsRequired] = useState(10);
  const [showStampsWarning, setShowStampsWarning] = useState(false);
  const [tier2Error, setTier2Error] = useState('');
  const [rewardError, setRewardError] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
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
          loyaltyMode: data.loyalty_mode || 'visit',
          stampsRequired: data.stamps_required || 5,
          rewardDescription: data.reward_description || '',
          cagnottePercent: data.cagnotte_percent || 10,
          cagnotteTier2Percent: data.cagnotte_tier2_percent || 15,
          tier2Enabled: data.tier2_enabled || false,
          tier2StampsRequired: data.tier2_stamps_required || 0,
          tier2RewardDescription: data.tier2_reward_description || '',
          duoOfferEnabled: data.duo_offer_enabled || false,
          duoOfferDescription: data.duo_offer_description || '',
          doubleDaysEnabled: data.double_days_enabled || false,
          doubleDaysOfWeek: (() => { try { return JSON.parse(data.double_days_of_week || '[]'); } catch { return []; } })(),
          birthdayGiftEnabled: data.birthday_gift_enabled || false,
          birthdayGiftDescription: data.birthday_gift_description || '',
          referralEnabled: data.referral_program_enabled || false,
          referralRewardReferred: data.referral_reward_referred || '',
          referralRewardReferrer: data.referral_reward_referrer || '',
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

  const normalizeUrl = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
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
        setTier2Error(t('tier2ErrorReward'));
        return;
      }
      if (!formData.tier2StampsRequired || formData.tier2StampsRequired <= 0) {
        setTier2Error(t('tier2ErrorStamps'));
        return;
      }
      if (formData.tier2StampsRequired <= formData.stampsRequired) {
        setTier2Error(t('tier2ErrorMin', { stamps: formData.stampsRequired }));
        return;
      }
      if (formData.tier2StampsRequired > 30) {
        setTier2Error(t('tier2ErrorMax'));
        return;
      }
    }
    setTier2Error('');

    // Validate double days: if enabled, at least one day must be selected
    if (formData.doubleDaysEnabled && formData.doubleDaysOfWeek.length === 0) {
      return; // ExtrasSection already shows the warning
    }
    const doubleDaysEnabled = formData.doubleDaysEnabled;

    save(async () => {
      // Auto-generate reward_description for cagnotte mode (email compatibility)
      const isCagnotte = formData.loyaltyMode === 'cagnotte';
      const effectiveRewardDescription = isCagnotte
        ? t('cagnotteRewardDesc', { percent: formData.cagnottePercent })
        : formData.rewardDescription.trim();

      const { error } = await supabase
        .from('merchants')
        .update({
          logo_url: formData.logoUrl || null,
          primary_color: formData.primaryColor,
          secondary_color: formData.secondaryColor,
          review_link: normalizeUrl(formData.reviewLink) || null,
          stamps_required: formData.stampsRequired,
          reward_description: effectiveRewardDescription,
          loyalty_mode: formData.loyaltyMode,
          cagnotte_percent: isCagnotte ? formData.cagnottePercent : null,
          cagnotte_tier2_percent: isCagnotte && formData.tier2Enabled ? formData.cagnotteTier2Percent : null,
          tier2_enabled: formData.tier2Enabled,
          tier2_stamps_required: formData.tier2Enabled ? formData.tier2StampsRequired : null,
          tier2_reward_description: isCagnotte
            ? (formData.tier2Enabled ? t('cagnotteRewardDesc', { percent: formData.cagnotteTier2Percent }) : null)
            : (formData.tier2Enabled ? formData.tier2RewardDescription.trim() : null),
          duo_offer_enabled: formData.duoOfferEnabled,
          duo_offer_description: formData.duoOfferEnabled ? formData.duoOfferDescription.trim() || null : null,
          double_days_enabled: isCagnotte ? false : doubleDaysEnabled,
          double_days_of_week: isCagnotte ? '[]' : JSON.stringify(formData.doubleDaysOfWeek),
          birthday_gift_enabled: formData.birthdayGiftEnabled,
          birthday_gift_description: formData.birthdayGiftDescription.trim() || null,
          referral_program_enabled: formData.referralEnabled,
          referral_reward_referred: formData.referralEnabled ? formData.referralRewardReferred.trim() || null : null,
          referral_reward_referrer: formData.referralEnabled ? formData.referralRewardReferrer.trim() || null : null,
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
          stamps_required: formData.stampsRequired,
          reward_description: effectiveRewardDescription,
          loyalty_mode: formData.loyaltyMode,
          cagnotte_percent: isCagnotte ? formData.cagnottePercent : null,
          cagnotte_tier2_percent: isCagnotte && formData.tier2Enabled ? formData.cagnotteTier2Percent : null,
          tier2_enabled: formData.tier2Enabled,
          tier2_stamps_required: formData.tier2Enabled ? formData.tier2StampsRequired : null,
          tier2_reward_description: isCagnotte
            ? (formData.tier2Enabled ? t('cagnotteRewardDesc', { percent: formData.cagnotteTier2Percent }) : null)
            : (formData.tier2Enabled ? formData.tier2RewardDescription.trim() : null),
          duo_offer_enabled: formData.duoOfferEnabled,
          duo_offer_description: formData.duoOfferEnabled ? formData.duoOfferDescription.trim() || null : null,
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
        setShowTestModal(true);
        throw new Error('first-setup'); // Skip saved flash, show modal instead
      }
    });
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
    <div className="max-w-3xl mx-auto md:pb-20">
      <div className="mb-5 md:mb-10 p-4 md:p-6 rounded-2xl bg-[#4b0082]/[0.04] border border-[#4b0082]/[0.08]">
        <h1 className="text-xl md:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#4b0082] to-violet-600">
          {t('title')}
        </h1>
        <p className="mt-1 text-sm md:text-base text-gray-500 font-medium">
          {t('subtitle')}
        </p>
      </div>

      <div className="grid gap-3 md:gap-8">
        <div className="space-y-3 md:space-y-6">

          {/* Logo & Ambiance reminder */}
          <CardPreview
            formData={formData}
            onNavigateToPersonalize={() => router.push('/dashboard/personalize?from=program')}
          />

          <LoyaltyModeSection
            formData={formData}
            setFormData={setFormData}
            isFirstSetup={isFirstSetup}
            originalLoyaltyMode={originalLoyaltyMode}
            originalStampsRequired={originalStampsRequired}
            showStampsWarning={showStampsWarning}
            setShowStampsWarning={setShowStampsWarning}
            rewardError={rewardError}
            setRewardError={setRewardError}
            tier2Error={tier2Error}
            setTier2Error={setTier2Error}
            shopType={merchant?.shop_type}
            handleLoyaltySettingsChange={handleLoyaltySettingsChange}
          />

          <ExtrasSection
            formData={formData}
            setFormData={setFormData}
          />


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
                <span>{t('saved')}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{t('save')}</span>
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
              <Sparkles className="w-7 h-7 text-white" />
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {t('modalTitle')}
            </h3>

            <p className="text-gray-500 text-sm mb-4 leading-relaxed">
              {t('modalDesc')}
            </p>

            <div className="text-left space-y-2 mb-5 px-1">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <span className="text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: t.raw('modalBenefit1') }} />
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <span className="text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: t.raw('modalBenefit2') }} />
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <span className="text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: t.raw('modalBenefit3') }} />
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
              {t('viewClientJourney')}
            </a>

            <button
              onClick={() => {
                setShowTestModal(false);
                router.push('/dashboard/qr-download');
              }}
              className="mt-3 w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
            >
              {t('later')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
