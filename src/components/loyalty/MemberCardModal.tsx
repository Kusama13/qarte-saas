'use client';

import { Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { Modal } from '@/components/ui';
import type { Merchant, MemberCard } from '@/types';

interface MemberCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberCard: MemberCard;
  merchant: Merchant;
  customerFirstName?: string;
  customerLastName?: string | null;
}

export default function MemberCardModal({
  isOpen,
  onClose,
  memberCard,
  merchant,
  customerFirstName,
  customerLastName,
}: MemberCardModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="py-2">
        {/* Credit Card Container */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, rotateY: -10 }}
          animate={{ scale: 1, opacity: 1, rotateY: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="relative w-full mx-auto overflow-hidden rounded-2xl shadow-2xl"
          style={{ aspectRatio: '1.58/1' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-amber-950" />

          {/* Holographic Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 2px,
                rgba(251,191,36,0.3) 2px,
                rgba(251,191,36,0.3) 4px
              )`
            }} />
          </div>

          {/* Animated Shine Sweep */}
          <motion.div
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
          />

          {/* Card Content */}
          <div className="relative h-full p-5 flex flex-col justify-between">
            {/* Top: Crown + Program */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <Crown className="w-5 h-5 text-white drop-shadow-sm" />
                </div>
                <div>
                  <p className="text-amber-400 text-[10px] font-bold uppercase tracking-widest">
                    {memberCard.program?.name || 'Programme VIP'}
                  </p>
                  <p className="text-white/60 text-[9px] font-medium mt-0.5">
                    {merchant.shop_name}
                  </p>
                </div>
              </div>

              <div className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                new Date(memberCard.valid_until) > new Date()
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {new Date(memberCard.valid_until) > new Date() ? 'Actif' : 'Expiré'}
              </div>
            </div>

            {/* Middle: Benefit */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-amber-400/70 text-[8px] font-semibold uppercase tracking-wider mb-1">Avantage</p>
                <div className="inline-block px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 rounded-lg">
                  <p className="text-amber-100 text-xs font-bold truncate max-w-[140px]">
                    {memberCard.program?.benefit_label}
                  </p>
                </div>
              </div>

              <div className="w-11 h-11 rounded-xl border border-amber-500/20 flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-white/5 to-transparent shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]">
                <span className="text-2xl font-bold text-amber-500/20 select-none">Q</span>
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 via-transparent to-amber-200/5 pointer-events-none" />
              </div>
            </div>

            {/* Bottom: Customer + Expiry */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-white/40 text-[8px] font-medium uppercase tracking-wider mb-1">Titulaire</p>
                <p className="text-white text-sm font-bold tracking-wide uppercase">
                  {customerFirstName} {customerLastName}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white/40 text-[8px] font-medium uppercase tracking-wider mb-1">Valable jusqu&apos;au</p>
                <p className="text-white text-sm font-bold tracking-wider font-mono">
                  {new Date(memberCard.valid_until).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="absolute inset-0 rounded-2xl border border-amber-500/20 pointer-events-none" />
        </motion.div>

        <div className="mt-4 text-center">
          <p className="text-[10px] text-gray-400 font-medium tracking-wider">
            REF: {memberCard.id.slice(0, 8).toUpperCase()}
          </p>
        </div>
      </div>
    </Modal>
  );
}
