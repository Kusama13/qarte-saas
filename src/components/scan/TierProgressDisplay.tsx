'use client';

import type { Merchant, LoyaltyCard } from '@/types';

interface TierProgressDisplayProps {
  merchant: Merchant;
  stamps: number;
  tier1Redeemed: boolean;
  primaryColor: string;
  secondaryColor?: string | null;
  pendingStamps?: number;
  label?: string;
}

function getTierTarget(merchant: Merchant, stamps: number, tier1Redeemed: boolean) {
  const tier2On = merchant.tier2_enabled && merchant.tier2_stamps_required;
  const tier1Done = tier1Redeemed || stamps >= (merchant.stamps_required || 10);
  const target = tier2On && tier1Done
    ? merchant.tier2_stamps_required!
    : (merchant.stamps_required || 10);
  const tierLabel = tier2On && tier1Done ? ' · Palier 2' : tier2On ? ' · Palier 1' : '';
  return { target, tierLabel, tier2On, tier1Done };
}

function getProgressGradient(tier2On: boolean | number | null | undefined, tier1Done: boolean, primaryColor: string, secondaryColor?: string | null) {
  if (tier2On && tier1Done) return 'linear-gradient(90deg, #8b5cf6, #a78bfa)';
  return `linear-gradient(90deg, ${primaryColor}, ${secondaryColor || primaryColor})`;
}

export default function TierProgressDisplay({
  merchant,
  stamps,
  tier1Redeemed,
  primaryColor,
  secondaryColor,
  pendingStamps,
  label = 'Passages confirmés',
}: TierProgressDisplayProps) {
  const { target, tierLabel, tier2On, tier1Done } = getTierTarget(merchant, stamps, tier1Redeemed);

  return (
    <>
      <div className="mb-8">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-5xl font-black" style={{ color: primaryColor }}>{stamps}</span>
          <span className="text-xl font-bold text-gray-300">/{target}</span>
        </div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
          {label}{tierLabel}
        </p>
        {pendingStamps !== undefined && pendingStamps > 0 && (
          <div className="mt-3 inline-flex px-3 py-1.5 bg-amber-100 rounded-full">
            <span className="text-sm font-bold text-amber-700">
              + {pendingStamps} en attente
            </span>
          </div>
        )}
      </div>

      <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden mb-6">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(100, (stamps / target) * 100)}%`,
            background: getProgressGradient(tier2On, tier1Done, primaryColor, secondaryColor),
          }}
        />
      </div>
    </>
  );
}

export { getTierTarget, getProgressGradient };
