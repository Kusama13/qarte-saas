'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { QrCode, MessageSquare, UserPlus } from 'lucide-react';
import { getScriptForShopType } from '@/lib/scripts';
import type { Merchant } from '@/types';

interface ZeroScansCoachProps {
  merchant: Merchant;
}

export default function ZeroScansCoach({ merchant }: ZeroScansCoachProps) {
  const t = useTranslations('zeroScans');
  const script = getScriptForShopType(merchant.shop_type);
  const trialEnd = new Date(merchant.trial_ends_at);
  const now = new Date();
  const daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-[#4b0082]">
        {t('title')}
      </p>

      {/* Step 1 — Test yourself */}
      <Link
        href="/dashboard/qr-download"
        className="flex items-start gap-3 p-3 rounded-xl bg-indigo-50/60 border border-indigo-100/60 hover:bg-indigo-50 transition-colors"
      >
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#4b0082] text-white text-xs font-bold shrink-0 mt-0.5">
          <QrCode className="w-3.5 h-3.5" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{t('step1Title')}</p>
          <p className="text-xs text-gray-500">{t('step1Desc')}</p>
        </div>
      </Link>

      {/* Step 2 — Script */}
      <div className="flex items-start gap-3 p-3 rounded-xl bg-violet-50/60 border border-violet-100/60">
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#4b0082] text-white text-xs font-bold shrink-0 mt-0.5">
          <MessageSquare className="w-3.5 h-3.5" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{t('step2Title')}</p>
          <p className="text-xs text-gray-600 italic mt-1">
            &quot;{script}&quot;
          </p>
        </div>
      </div>

      {/* Step 3 — Start with one */}
      <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/60 border border-emerald-100/60">
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-bold shrink-0 mt-0.5">
          <UserPlus className="w-3.5 h-3.5" />
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
