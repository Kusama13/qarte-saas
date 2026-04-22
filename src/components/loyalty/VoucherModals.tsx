'use client';

import { Check, Gift, Cake, Loader2, PartyPopper, Sparkles } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toBCP47 } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { Merchant } from '@/types';

interface SelectedVoucher {
  id: string;
  rewardDescription: string;
  source: string | null;
  expiresAt: string | null;
}

interface CelebrationData {
  rewardDescription: string;
  customerName: string | null;
  bonusStampAdded: boolean;
  isBirthday: boolean;
}

interface VoucherModalsProps {
  merchant: Merchant;
  customerFirstName?: string | null;
  // Detail modal
  showDetail: boolean;
  selectedVoucher: SelectedVoucher | null;
  usingVoucherId: string | null;
  onUseVoucher: (voucherId: string) => void;
  onCloseDetail: () => void;
  // Celebration modal
  showCelebration: boolean;
  celebrationData: CelebrationData | null;
  onCloseCelebration: () => void;
}

export default function VoucherModals({
  merchant,
  customerFirstName,
  showDetail,
  selectedVoucher,
  usingVoucherId,
  onUseVoucher,
  onCloseDetail,
  showCelebration,
  celebrationData,
  onCloseCelebration,
}: VoucherModalsProps) {
  const t = useTranslations('voucherModals');
  const locale = useLocale();
  return (
    <>
      {/* Voucher Detail Modal */}
      <AnimatePresence>
        {showDetail && selectedVoucher && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={onCloseDetail}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 max-w-sm w-full text-center overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="inline-flex items-center justify-center w-20 h-20 mb-5 rounded-3xl"
                style={{ backgroundColor: selectedVoucher.source === 'birthday' ? '#fce7f3' : `${merchant.primary_color}15` }}
              >
                {selectedVoucher.source === 'birthday'
                  ? <Cake className="w-10 h-10 text-pink-500" />
                  : <Gift className="w-10 h-10" style={{ color: merchant.primary_color }} />
                }
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-black text-gray-900 mb-2"
              >
                {selectedVoucher.source === 'birthday'
                  ? t('happyBirthday', { name: customerFirstName ? ` ${customerFirstName}` : '' })
                  : t('yourReward')
                }
              </motion.h2>

              {/* Birthday message */}
              {selectedVoucher.source === 'birthday' && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-gray-500 mb-4 text-sm"
                >
                  {t('birthdayWish', { name: merchant.shop_name })}
                </motion.p>
              )}

              {/* Reward block */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="rounded-2xl p-4 mb-4"
                style={{ backgroundColor: selectedVoucher.source === 'birthday' ? '#fdf2f8' : `${merchant.primary_color}10` }}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Gift className="w-4 h-4" style={{ color: selectedVoucher.source === 'birthday' ? '#ec4899' : merchant.primary_color }} />
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('yourGift')}</span>
                </div>
                <p className="font-bold text-lg" style={{ color: selectedVoucher.source === 'birthday' ? '#be185d' : merchant.primary_color }}>
                  {selectedVoucher.rewardDescription}
                </p>
              </motion.div>

              {/* Expiration */}
              {selectedVoucher.expiresAt && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-xs text-gray-500 mb-3"
                >
                  {t('validUntil', { date: new Date(selectedVoucher.expiresAt).toLocaleDateString(toBCP47(locale), { day: 'numeric', month: 'long', year: 'numeric' }) })}
                </motion.p>
              )}

              {/* Instructions */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="text-sm text-gray-500 mb-6"
              >
                {t('showMessage', { name: merchant.shop_name })}
              </motion.p>

              {/* Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-2.5"
              >
                <button
                  onClick={() => onUseVoucher(selectedVoucher.id)}
                  disabled={usingVoucherId === selectedVoucher.id}
                  className="w-full h-13 py-3.5 text-base font-bold rounded-2xl text-white shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg, ${merchant.primary_color}, ${merchant.secondary_color || merchant.primary_color})` }}
                >
                  {usingVoucherId === selectedVoucher.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      {t('useNow')}
                    </>
                  )}
                </button>
                <button
                  onClick={onCloseDetail}
                  className="w-full py-3 text-sm font-semibold text-gray-500 rounded-2xl bg-gray-100 hover:bg-gray-200 active:scale-[0.98] transition-all"
                >
                  {t('later')}
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voucher Celebration Modal */}
      <AnimatePresence>
        {showCelebration && celebrationData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={onCloseCelebration}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 max-w-sm w-full text-center overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-3xl"
                style={{ backgroundColor: celebrationData.isBirthday ? '#fce7f3' : `${merchant.primary_color}15` }}
              >
                {celebrationData.isBirthday
                  ? <Cake className="w-10 h-10 text-pink-500" />
                  : <PartyPopper className="w-10 h-10" style={{ color: merchant.primary_color }} />
                }
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-black text-gray-900 mb-2"
              >
                {celebrationData.isBirthday
                  ? t('happyBirthdayCelebration', { name: celebrationData.customerName ? ` ${celebrationData.customerName}` : '' })
                  : t('congratulations', { name: celebrationData.customerName ? ` ${celebrationData.customerName}` : '' })
                }
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-500 mb-4"
              >
                {celebrationData.isBirthday
                  ? t('birthdayActivated')
                  : t('rewardActivated')
                }
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="rounded-2xl p-4 mb-4"
                style={{ backgroundColor: celebrationData.isBirthday ? '#fdf2f8' : `${merchant.primary_color}10` }}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Gift className="w-4 h-4" style={{ color: celebrationData.isBirthday ? '#ec4899' : merchant.primary_color }} />
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('yourGift')}</span>
                </div>
                <p className="font-bold text-lg" style={{ color: celebrationData.isBirthday ? '#be185d' : merchant.primary_color }}>
                  {celebrationData.rewardDescription}
                </p>
              </motion.div>

              {celebrationData.bonusStampAdded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex items-center justify-center gap-2 mb-4 text-sm text-gray-500"
                >
                  <Sparkles className="w-4 h-4" style={{ color: merchant.primary_color }} />
                  <span>{t('bonusStampAdded')}</span>
                </motion.div>
              )}

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-sm text-gray-500 mb-6"
              >
                {t('showConfirmation', { name: merchant.shop_name })}
              </motion.p>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                whileTap={{ scale: 0.95 }}
                onClick={onCloseCelebration}
                className="w-full h-14 text-lg font-bold rounded-2xl text-white shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                style={{ background: `linear-gradient(135deg, ${merchant.primary_color}, ${merchant.secondary_color || merchant.primary_color})` }}
              >
                <Check className="w-5 h-5" />
                {t('thankYou')}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
