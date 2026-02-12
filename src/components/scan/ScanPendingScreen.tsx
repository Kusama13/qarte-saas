'use client';

import Link from 'next/link';
import { CreditCard, Hourglass, Shield } from 'lucide-react';
import type { Merchant, LoyaltyCard } from '@/types';
import TierProgressDisplay from './TierProgressDisplay';

interface ScanPendingScreenProps {
  merchant: Merchant;
  loyaltyCard: LoyaltyCard;
  tier1Redeemed: boolean;
  pendingStamps: number;
  primaryColor: string;
  secondaryColor?: string | null;
}

export default function ScanPendingScreen({
  merchant,
  loyaltyCard,
  tier1Redeemed,
  pendingStamps,
  primaryColor,
  secondaryColor,
}: ScanPendingScreenProps) {
  return (
    <div className="animate-fade-in">
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-8 overflow-hidden text-center">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-amber-50">
          <Hourglass className="w-10 h-10 text-amber-600 animate-pulse" />
        </div>

        <h2 className="text-2xl font-black text-gray-900 mb-2">
          Passage en cours de vérification
        </h2>
        <p className="text-gray-500 mb-6">
          Pour votre sécurité, ce passage doit être validé par votre commerçant.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8 text-left">
          <p className="text-sm text-amber-900 leading-relaxed">
            Notre système a détecté plusieurs passages aujourd&apos;hui. Cette mesure protège votre compte contre les utilisations frauduleuses. Votre passage sera validé dès confirmation par le commerçant.
          </p>
        </div>

        <TierProgressDisplay
          merchant={merchant}
          stamps={loyaltyCard.current_stamps}
          tier1Redeemed={tier1Redeemed}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          pendingStamps={pendingStamps}
        />

        <Link
          href={`/customer/card/${merchant.id}`}
          className="w-full h-14 rounded-2xl font-bold border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2"
        >
          <CreditCard className="w-5 h-5" />
          Voir ma carte complète
        </Link>

        <div className="flex items-center justify-center gap-2 mt-6">
          <Shield className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">
            Protégé par Qarte Shield
          </span>
        </div>
      </div>
    </div>
  );
}
