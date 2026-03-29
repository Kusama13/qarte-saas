'use client';

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import {
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { Input } from '@/components/ui';
import { useTranslations } from 'next-intl';
import type { Merchant } from '@/types';

export interface WelcomeSectionHandle {
  save: () => Promise<void>;
}

interface WelcomeSectionProps {
  merchant: Merchant;
  refetch: () => Promise<void>;
  onShowHelp?: () => void;
}

const WelcomeSection = forwardRef<WelcomeSectionHandle, WelcomeSectionProps>(function WelcomeSection({ merchant, refetch, onShowHelp }, ref) {
  const t = useTranslations('publicPage');
  const [welcomeEnabled, setWelcomeEnabled] = useState(false);
  const [welcomeDescription, setWelcomeDescription] = useState('');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    setWelcomeEnabled(merchant.welcome_offer_enabled || false);
    setWelcomeDescription(merchant.welcome_offer_description || '');
  }, [merchant]);

  const save = async () => {
    if (welcomeEnabled && !welcomeDescription.trim()) throw new Error(t('welcomeDescRequired'));

    setSaveError('');
    const res = await fetch('/api/merchants/referral-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant_id: merchant.id,
        referral_program_enabled: merchant.referral_program_enabled,
        referral_reward_referrer: merchant.referral_reward_referrer,
        referral_reward_referred: merchant.referral_reward_referred,
        welcome_offer_enabled: welcomeEnabled,
        welcome_offer_description: welcomeEnabled ? welcomeDescription.trim() : null,
      }),
    });

    if (!res.ok) {
      setSaveError(t('welcomeSaveError'));
      throw new Error('save failed');
    }

    refetch().catch(() => {});
  };

  useImperativeHandle(ref, () => ({ save }));

  return (
    <div className="pb-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-500" />
          <span className="text-sm font-semibold text-gray-700">{t('welcomeOfferLabel')}</span>
          {welcomeEnabled && onShowHelp && (
            <button
              onClick={onShowHelp}
              className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          role="switch"
          aria-checked={welcomeEnabled}
          onClick={() => setWelcomeEnabled(!welcomeEnabled)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
            welcomeEnabled ? 'bg-violet-600' : 'bg-gray-200'
          }`}
        >
          <span className={`pointer-events-none absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform ${welcomeEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
      </div>

      {welcomeEnabled && (
        <div className="space-y-3 mt-3">
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
              {t('welcomeDescLabel')} <span className="text-red-400">*</span>
            </label>
            <Input
              placeholder={t('welcomeDescPlaceholder')}
              value={welcomeDescription}
              onChange={(e) => setWelcomeDescription(e.target.value)}
              className="h-10 text-sm"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[t('welcomeSugg1'), t('welcomeSugg2'), t('welcomeSugg3')].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setWelcomeDescription(s)}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {saveError && (
        <div className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{saveError}</div>
      )}
    </div>
  );
});

export default WelcomeSection;
