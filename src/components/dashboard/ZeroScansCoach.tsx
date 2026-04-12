'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Globe, CalendarDays, Heart, ArrowDown } from 'lucide-react';
import type { Merchant } from '@/types';

interface ZeroScansCoachProps {
  merchant: Merchant;
}

export default function ZeroScansCoach({ merchant }: ZeroScansCoachProps) {
  const t = useTranslations('zeroScans');
  const trialEnd = new Date(merchant.trial_ends_at);
  const now = new Date();
  const daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-[#4b0082]">
        {t('title')}
      </p>

      {/* Step 1 — Vitrine */}
      <Link
        href="/dashboard/public-page"
        className="flex items-start gap-3 p-3 rounded-xl bg-indigo-50/60 border border-indigo-100/60 hover:bg-indigo-50 transition-colors"
      >
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0 mt-0.5">
          <Globe className="w-3.5 h-3.5" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{t('step1Title')}</p>
          <p className="text-xs text-gray-500">{t('step1Desc')}</p>
        </div>
      </Link>

      <div className="flex justify-center">
        <ArrowDown className="w-3.5 h-3.5 text-gray-300" />
      </div>

      {/* Step 2 — Planning */}
      <Link
        href="/dashboard/planning"
        className="flex items-start gap-3 p-3 rounded-xl bg-cyan-50/60 border border-cyan-100/60 hover:bg-cyan-50 transition-colors"
      >
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-cyan-600 text-white text-xs font-bold shrink-0 mt-0.5">
          <CalendarDays className="w-3.5 h-3.5" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{t('step2Title')}</p>
          <p className="text-xs text-gray-500">{t('step2Desc')}</p>
        </div>
      </Link>

      <div className="flex justify-center">
        <ArrowDown className="w-3.5 h-3.5 text-gray-300" />
      </div>

      {/* Step 3 — Auto loyalty */}
      <div className="flex items-start gap-3 p-3 rounded-xl bg-violet-50/60 border border-violet-100/60">
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-violet-600 text-white text-xs font-bold shrink-0 mt-0.5">
          <Heart className="w-3.5 h-3.5" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{t('step3Title')}</p>
          <p className="text-xs text-gray-500">{t('step3Desc')}</p>
        </div>
      </div>

      {/* Trial urgency */}
      {merchant.subscription_status === 'trial' && daysRemaining <= 5 && (
        <p className="text-xs text-center text-gray-400 pt-1">
          {t('trialDay', { current: 7 - daysRemaining })}
        </p>
      )}
    </div>
  );
}
