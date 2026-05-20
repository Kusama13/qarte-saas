'use client';

import { Gift, Flower2, Trophy, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Merchant } from '@/types';

interface WelcomeBannerProps {
  merchant: Merchant;
  primaryColor: string;
  secondaryColor?: string | null;
}

function RewardBadge({
  icon: Icon,
  color,
  borderColor,
  label,
  reward,
  afterText,
}: {
  icon: LucideIcon;
  color: string;
  borderColor: string;
  label: string;
  reward: string;
  afterText: string;
}) {
  return (
    <div className="rounded-2xl p-4 border-2 bg-white shadow-sm" style={{ borderColor }}>
      <div className="flex items-center justify-center gap-1.5 mb-1.5">
        <Icon className="w-3.5 h-3.5" style={{ color }} />
        <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">{label}</span>
      </div>
      <p className="text-base font-extrabold" style={{ color }}>{reward}</p>
      <p className="text-xs font-bold mt-1 text-gray-500">{afterText}</p>
    </div>
  );
}

export default function WelcomeBanner({ merchant, primaryColor, secondaryColor }: WelcomeBannerProps) {
  const t = useTranslations('welcomeBanner');
  const isCagnotte = merchant.loyalty_mode === 'cagnotte';
  const gold = '#B8923D';
  // Tier 2 réellement visible : on n'affiche "Première / Deuxième" que dans ce cas.
  const showTier2 = !!(
    merchant.tier2_enabled
    && merchant.tier2_stamps_required
    && (merchant.tier2_reward_description || (isCagnotte && merchant.cagnotte_tier2_percent))
  );
  return (
    <div className="relative mb-4 overflow-hidden rounded-3xl shadow-lg border border-gray-100">
      {/* Logo/Image Section — bandeau couleur pleine */}
      <div
        className="h-40 flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || primaryColor})` }}
      >
        {merchant.logo_url ? (
          <img
            src={merchant.logo_url}
            alt={merchant.shop_name}
            className="w-28 h-28 rounded-2xl object-cover shadow-lg border-[3px] border-white"
          />
        ) : (
          <div className="w-28 h-28 rounded-2xl bg-white/15 border-[3px] border-white flex items-center justify-center">
            <span className="text-5xl font-black text-white">{merchant.shop_name[0]}</span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="relative bg-white pt-5 pb-5 px-6 text-center overflow-hidden">
        <Gift
          className="absolute -right-4 -bottom-4 w-24 h-24 opacity-[0.03]"
          style={{ color: primaryColor }}
        />

        <div className="relative z-10">
          <h2 className="text-xl font-black text-gray-900 tracking-tight mb-1">
            {t('welcomeAt')} <span style={{ color: primaryColor }}>{merchant.shop_name}</span>
          </h2>

          <div className="flex items-center justify-center gap-1.5 mb-4">
            <Flower2 className="w-3 h-3" style={{ color: primaryColor }} />
            <p className="text-xs font-semibold text-gray-500">
              {t('rewardLoyalty')}
            </p>
            <Flower2 className="w-3 h-3" style={{ color: primaryColor }} />
          </div>

          <div className="flex flex-col gap-2.5">
            <RewardBadge
              icon={Gift}
              color={primaryColor}
              borderColor={`${primaryColor}55`}
              label={t(showTier2 ? 'yourReward' : 'singleReward')}
              reward={
                isCagnotte
                  ? t('cagnotteReward', { percent: Number(merchant.cagnotte_percent || 0) })
                  : merchant.reward_description ?? ''
              }
              afterText={
                isCagnotte
                  ? t('afterVisitsCagnotte', { count: merchant.stamps_required })
                  : t('afterVisits', { count: merchant.stamps_required })
              }
            />

            {showTier2 && (
              <RewardBadge
                icon={Trophy}
                color={gold}
                borderColor={`${gold}99`}
                label={isCagnotte ? t('tier2Rate') : t('tier2Premium')}
                reward={
                  isCagnotte
                    ? t('cagnotteReward', { percent: Number(merchant.cagnotte_tier2_percent || 0) })
                    : merchant.tier2_reward_description ?? ''
                }
                afterText={t('afterVisits', { count: merchant.tier2_stamps_required ?? 0 })}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
