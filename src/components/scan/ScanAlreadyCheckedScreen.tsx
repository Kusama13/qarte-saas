'use client';

import { Link } from '@/i18n/navigation';
import { AlertCircle, CreditCard } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Merchant, LoyaltyCard } from '@/types';
import TierProgressDisplay from './TierProgressDisplay';

interface ScanAlreadyCheckedScreenProps {
  merchant: Merchant;
  loyaltyCard: LoyaltyCard | null;
  tier1Redeemed: boolean;
  primaryColor: string;
  secondaryColor?: string | null;
}

export default function ScanAlreadyCheckedScreen({
  merchant,
  loyaltyCard,
  tier1Redeemed,
  primaryColor,
  secondaryColor,
}: ScanAlreadyCheckedScreenProps) {
  const t = useTranslations('scanAlready');
  return (
    <div className="animate-fade-in">
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-8 overflow-hidden text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-3xl bg-amber-100">
          <AlertCircle className="w-10 h-10 text-amber-600" />
        </div>

        <h2 className="text-2xl font-black text-gray-900 mb-2">{t('title')}</h2>
        <p className="text-gray-500 mb-8">{t('message')}</p>

        <TierProgressDisplay
          merchant={merchant}
          stamps={loyaltyCard?.current_stamps || 0}
          tier1Redeemed={tier1Redeemed}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          label={t('stampsAccumulated')}
        />

        <Link
          href={`/customer/card/${merchant.id}`}
          className="w-full h-14 rounded-2xl font-bold border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2"
        >
          <CreditCard className="w-5 h-5" />
          {t('viewFullCard')}
        </Link>
      </div>
    </div>
  );
}
