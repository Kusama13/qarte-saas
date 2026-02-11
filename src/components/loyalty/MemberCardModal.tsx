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
  const isActive = new Date(memberCard.valid_until) > new Date();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="py-2">
        {/* Credit Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 25 }}
          className="relative w-full mx-auto overflow-hidden rounded-2xl shadow-2xl"
          style={{ aspectRatio: '1.58/1' }}
        >
          {/* Base gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900" />

          {/* Mesh gradient — gold ambient glow */}
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse at 20% 15%, rgba(251,191,36,0.1) 0%, transparent 50%), radial-gradient(ellipse at 85% 85%, rgba(251,191,36,0.07) 0%, transparent 50%)'
          }} />

          {/* Gold foil dot texture */}
          <div className="absolute inset-0" style={{
            opacity: 0.03,
            backgroundImage: 'radial-gradient(circle, rgba(251,191,36,1) 0.5px, transparent 0.5px)',
            backgroundSize: '14px 14px'
          }} />

          {/* Q Watermark — large centered */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none">
            <span className="text-[100px] font-black italic leading-none" style={{ color: 'rgba(251,191,36,0.03)' }}>Q</span>
          </div>

          {/* Animated Shine Sweep */}
          <motion.div
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 4, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12"
          />

          {/* Card Content */}
          <div className="relative h-full p-5 flex flex-col justify-between">
            {/* Top: Crown + Program + Status */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
                  <Crown className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-amber-400/90 text-[10px] font-bold uppercase" style={{ letterSpacing: '0.15em' }}>
                    {memberCard.program?.name || 'Programme VIP'}
                  </p>
                  <p className="text-white/40 text-[9px] font-medium mt-0.5">
                    {merchant.shop_name}
                  </p>
                </div>
              </div>

              <div className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  : 'bg-red-500/15 text-red-400 border border-red-500/20'
              }`}>
                {isActive ? 'Actif' : 'Expiré'}
              </div>
            </div>

            {/* Center: Benefit — prominent, centered */}
            <div className="text-center px-2">
              <p className="text-amber-500/50 text-[7px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.2em' }}>Votre avantage</p>
              <p className="text-amber-100 text-sm font-bold leading-snug">
                {memberCard.program?.benefit_label}
              </p>
            </div>

            {/* Bottom: Name + Expiry */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-white/30 text-[7px] font-medium uppercase mb-0.5" style={{ letterSpacing: '0.15em' }}>Titulaire</p>
                <p className="text-white/90 text-xs font-bold tracking-wide uppercase">
                  {customerFirstName} {customerLastName}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white/30 text-[7px] font-medium uppercase mb-0.5" style={{ letterSpacing: '0.15em' }}>Expire le</p>
                <p className="text-white/90 text-xs font-bold tracking-wider font-mono">
                  {new Date(memberCard.valid_until).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Border overlay */}
          <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ border: '1px solid rgba(251,191,36,0.1)' }} />
        </motion.div>

        {/* Reference */}
        <div className="mt-3 text-center">
          <p className="text-[10px] text-gray-400 font-medium tracking-wider font-mono">
            {memberCard.id.slice(0, 8).toUpperCase()}
          </p>
        </div>
      </div>
    </Modal>
  );
}
