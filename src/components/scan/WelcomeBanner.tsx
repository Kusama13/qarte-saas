'use client';

import { Gift, Flower2, Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Merchant } from '@/types';

interface WelcomeBannerProps {
  merchant: Merchant;
  primaryColor: string;
  secondaryColor?: string | null;
}

export default function WelcomeBanner({ merchant, primaryColor, secondaryColor }: WelcomeBannerProps) {
  const t = useTranslations('welcomeBanner');
  const isCagnotte = merchant.loyalty_mode === 'cagnotte';
  const tier2Color = secondaryColor || primaryColor;
  return (
    <div className="relative mb-4 overflow-hidden rounded-3xl shadow-lg border border-gray-100">
      {/* Logo/Image Section */}
      <div
        className="relative h-40 flex items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${primaryColor}30, ${secondaryColor || primaryColor}40)` }}
      >
        {merchant.logo_url ? (
          <img
            src={merchant.logo_url}
            alt={merchant.shop_name}
            className="w-28 h-28 rounded-2xl object-cover shadow-lg border-[3px] border-white"
          />
        ) : (
          <div
            className="w-28 h-28 rounded-2xl flex items-center justify-center shadow-lg border-[3px] border-white"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || primaryColor})` }}
          >
            <span className="text-5xl font-black text-white">{merchant.shop_name[0]}</span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="relative bg-white pt-5 pb-4 px-6 text-center overflow-hidden">
        <Gift
          className="absolute -right-4 -bottom-4 w-24 h-24 opacity-[0.03]"
          style={{ color: primaryColor }}
        />

        <div className="relative z-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1.5">
            {t('welcomeAt')} <span style={{ color: primaryColor }}>{merchant.shop_name}</span>
          </h2>

          <div className="flex items-center justify-center gap-2 mb-4">
            <Flower2 className="w-4 h-4" style={{ color: primaryColor }} />
            <p className="text-lg font-extrabold text-gray-900 tracking-tight">
              {t('rewardLoyalty')}
            </p>
            <Flower2 className="w-4 h-4" style={{ color: primaryColor }} />
          </div>

          {/* Reward Badges */}
          <div className="flex flex-col gap-2.5">
            <div
              className="rounded-2xl p-3.5 border-2 shadow-md"
              style={{ backgroundColor: `${primaryColor}10`, borderColor: `${primaryColor}25` }}
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <Gift className="w-4 h-4" style={{ color: primaryColor }} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {t('yourReward')}
                </span>
              </div>
              <p className="text-base font-extrabold text-gray-900 text-center">
                {isCagnotte ? t('cagnotteReward', { percent: Number(merchant.cagnotte_percent || 0) }) : merchant.reward_description}
              </p>
              <p className="text-xs font-bold text-center mt-1" style={{ color: primaryColor }}>
                {isCagnotte
                  ? t('afterVisitsCagnotte', { count: merchant.stamps_required })
                  : t('afterVisits', { count: merchant.stamps_required })}
              </p>
            </div>

            {merchant.tier2_enabled && merchant.tier2_stamps_required && (merchant.tier2_reward_description || (isCagnotte && merchant.cagnotte_tier2_percent)) && (
              <div
                className="rounded-2xl p-3.5 border-2 shadow-md"
                style={{ backgroundColor: `${tier2Color}10`, borderColor: `${tier2Color}25` }}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Trophy className="w-4 h-4" style={{ color: tier2Color }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    {isCagnotte ? t('tier2Rate') : t('tier2Premium')}
                  </span>
                </div>
                <p className="text-base font-extrabold text-gray-900 text-center">
                  {isCagnotte ? t('cagnotteReward', { percent: Number(merchant.cagnotte_tier2_percent || 0) }) : merchant.tier2_reward_description}
                </p>
                <p className="text-xs font-bold text-center mt-1" style={{ color: tier2Color }}>
                  {t('afterVisits', { count: merchant.tier2_stamps_required })}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
