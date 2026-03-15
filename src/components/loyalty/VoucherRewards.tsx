'use client';

import { Gift, Eye } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import type { Merchant, Voucher } from '@/types';

interface VoucherRewardsProps {
  vouchers: Voucher[];
  merchant: Merchant;
  onSelectVoucher: (voucher: { id: string; rewardDescription: string; source: string | null; expiresAt: string | null }) => void;
}

export default function VoucherRewards({ vouchers, merchant, onSelectVoucher }: VoucherRewardsProps) {
  const t = useTranslations('voucherRewards');
  const unusedVouchers = vouchers.filter(v => !v.is_used);
  if (unusedVouchers.length === 0) return null;

  // Group by reward_description
  const groups = unusedVouchers.reduce((acc, v) => {
    const key = v.reward_description;
    if (!acc[key]) acc[key] = [];
    acc[key].push(v);
    return acc;
  }, {} as Record<string, Voucher[]>);

  const gradient = `linear-gradient(135deg, ${merchant.primary_color}, ${merchant.secondary_color || merchant.primary_color})`;

  return (
    <>
      {Object.entries(groups).map(([desc, group]) => (
        <motion.div
          key={desc}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="mb-4 rounded-2xl overflow-hidden shadow-lg shadow-black/5"
        >
          <div className="relative p-5 overflow-hidden" style={{ background: gradient }}>
            {/* Shimmer sweep */}
            <motion.div
              animate={{ x: ['-150%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none"
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent)] pointer-events-none" />

            <div className="relative flex items-center gap-4">
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shrink-0"
              >
                <Gift className="w-7 h-7 text-white" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-1">
                  {group[0].source === 'birthday' ? t('birthdayGift') : t('referral')}{group.length > 1 ? t('availableCount', { count: group.length }) : ''}
                </p>
                <p className="text-white text-base font-black leading-snug line-clamp-2">
                  {desc}
                </p>
                {group[0].expires_at && (
                  <p className="text-white/50 text-[10px] mt-1">
                    {t('expiresOn', { date: new Date(group[0].expires_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) })}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => onSelectVoucher({
                id: group[0].id,
                rewardDescription: desc,
                source: group[0].source || null,
                expiresAt: group[0].expires_at || null,
              })}
              className="relative mt-4 w-full py-2.5 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white font-bold text-sm hover:bg-white/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              {t('view')}
            </button>
          </div>
        </motion.div>
      ))}
    </>
  );
}
