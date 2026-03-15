'use client';

import Link from 'next/link';
import { ArrowLeft, Crown, CalendarDays, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Merchant, MemberCard } from '@/types';

interface CardHeaderProps {
  merchant: Merchant;
  memberCard: MemberCard | null;
  isMemberCardActive: boolean;
  isPreview: boolean;
  isDemo: boolean;
  merchantId: string;
  onShowMemberCard: () => void;
  hideBackButton?: boolean;
}

export default function CardHeader({
  merchant,
  memberCard,
  isMemberCardActive,
  isPreview,
  isDemo,
  merchantId,
  onShowMemberCard,
  hideBackButton = false,
}: CardHeaderProps) {
  return (
    <header className="relative w-full overflow-hidden">
      <div className="relative mx-auto lg:max-w-lg lg:mt-4 lg:rounded-3xl overflow-hidden">
        {/* Full gradient background */}
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(160deg, ${merchant.primary_color}, ${merchant.secondary_color || merchant.primary_color})` }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent)]" />

        {/* Back button */}
        {!hideBackButton && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 left-4 z-20"
          >
            <Link
              href={isDemo ? '/' : isPreview ? '/dashboard/program' : '/customer/cards'}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 transition-all hover:bg-white/30 active:scale-90"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
          </motion.div>
        )}

        {/* Centered content */}
        <div className="relative flex flex-col items-center pt-10 pb-10 px-5">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-[100px] h-[100px] rounded-[1.75rem] p-1.5 bg-white/90 shadow-2xl border border-white/60 flex items-center justify-center overflow-hidden mb-2.5"
          >
            {merchant.logo_url ? (
              <img
                src={merchant.logo_url}
                alt={merchant.shop_name}
                className="w-full h-full object-cover rounded-[1.25rem]"
              />
            ) : (
              <div
                className="w-full h-full rounded-[1.25rem] flex items-center justify-center text-white text-4xl font-black"
                style={{ background: `linear-gradient(135deg, ${merchant.primary_color}cc, ${merchant.secondary_color || merchant.primary_color})` }}
              >
                {merchant.shop_name[0]}
              </div>
            )}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-lg font-black tracking-tight text-white text-center leading-tight mb-1.5"
          >
            {merchant.shop_name}
          </motion.h1>

          {(memberCard && isMemberCardActive || merchant.booking_url?.trim() || (merchant.slug && merchant.show_public_page_on_card)) && (
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {memberCard && isMemberCardActive && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={onShowMemberCard}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all"
                >
                  <Crown className="w-3 h-3 text-amber-300" />
                  <span className="text-[11px] font-bold text-white/90 uppercase tracking-wider">Membre VIP</span>
                </motion.button>
              )}
              {merchant.booking_url && merchant.booking_url.trim() !== '' && (
                <motion.a
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  href={merchant.booking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all active:scale-95"
                >
                  <CalendarDays className="w-3 h-3 text-white" />
                  <span className="text-[11px] font-bold text-white/90 uppercase tracking-wider">Réserver</span>
                </motion.a>
              )}
              {merchant.slug && merchant.show_public_page_on_card && (
                <motion.a
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  href={`/p/${merchant.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all active:scale-95"
                >
                  <Info className="w-3 h-3 text-white" />
                  <span className="text-[11px] font-bold text-white/90 uppercase tracking-wider">Infos</span>
                </motion.a>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
