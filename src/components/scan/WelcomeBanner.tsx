'use client';

import { Gift, Sparkles, Trophy } from 'lucide-react';
import type { Merchant } from '@/types';

interface WelcomeBannerProps {
  merchant: Merchant;
  primaryColor: string;
  secondaryColor?: string | null;
}

export default function WelcomeBanner({ merchant, primaryColor, secondaryColor }: WelcomeBannerProps) {
  return (
    <div className="relative mb-4 overflow-hidden rounded-3xl shadow-xl border border-gray-100">
      {/* Logo/Image Section */}
      <div
        className="relative h-40 flex items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${primaryColor}30, ${secondaryColor || primaryColor}40)` }}
      >
        <div
          className="absolute -top-12 -right-12 w-36 h-36 rounded-full opacity-30"
          style={{ background: `radial-gradient(circle, ${primaryColor}, transparent)` }}
        />
        <div
          className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full opacity-25"
          style={{ background: `radial-gradient(circle, ${secondaryColor || primaryColor}, transparent)` }}
        />

        {merchant.logo_url ? (
          <div className="relative">
            <div
              className="absolute -inset-3 rounded-2xl blur-xl opacity-40"
              style={{ backgroundColor: primaryColor }}
            />
            <img
              src={merchant.logo_url}
              alt={merchant.shop_name}
              className="relative w-28 h-28 rounded-2xl object-cover shadow-2xl border-3 border-white/90"
            />
          </div>
        ) : (
          <div className="relative">
            <div
              className="absolute -inset-3 rounded-full blur-xl opacity-40"
              style={{ backgroundColor: primaryColor }}
            />
            <div
              className="relative w-28 h-28 rounded-full flex items-center justify-center shadow-2xl border-3 border-white/90"
              style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || primaryColor})` }}
            >
              <span className="text-5xl font-black text-white drop-shadow-lg">{merchant.shop_name[0]}</span>
            </div>
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
            Bienvenue chez <span style={{ color: primaryColor }}>{merchant.shop_name}</span>
          </h2>

          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-4 h-4" style={{ color: primaryColor }} />
            <p className="text-lg font-extrabold text-gray-900 tracking-tight">
              Nous récompensons votre fidélité
            </p>
            <Sparkles className="w-4 h-4" style={{ color: primaryColor }} />
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
                  Votre récompense
                </span>
              </div>
              <p className="text-base font-extrabold text-gray-900 text-center">
                {merchant.reward_description}
              </p>
              <p className="text-xs font-bold text-center mt-1" style={{ color: primaryColor }}>
                Après {merchant.stamps_required} passage{merchant.stamps_required > 1 ? 's' : ''}
              </p>
            </div>

            {merchant.tier2_enabled && merchant.tier2_stamps_required && merchant.tier2_reward_description && (
              <div className="rounded-2xl p-3.5 border-2 border-amber-200 bg-amber-50/60 shadow-md">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
                    Palier 2 — Récompense
                  </span>
                </div>
                <p className="text-base font-extrabold text-gray-900 text-center">
                  {merchant.tier2_reward_description}
                </p>
                <p className="text-xs font-bold text-center mt-1 text-amber-600">
                  Après {merchant.tier2_stamps_required} passage{merchant.tier2_stamps_required > 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
