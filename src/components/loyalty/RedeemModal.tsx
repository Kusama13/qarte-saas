'use client';

import { Check, Gift, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button, Modal } from '@/components/ui';

interface RedeemModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier: 1 | 2;
  tier2Enabled: boolean | number | null;
  rewardDescription: string;
  tier2Reward: string;
  success: boolean;
  redeeming: boolean;
  merchantColor: string;
  onRedeem: (tier: 1 | 2) => void;
  onDone: () => void;
}

function getModalTitle(success: boolean, tier: 1 | 2): string {
  if (success) return tier === 2 ? 'Privilège Débloqué !' : 'Cadeau Validé !';
  return tier === 2 ? 'Privilège Débloqué !' : 'Cadeau Validé !';
}

function getModalDescription(success: boolean, tier: 1 | 2, tier2Enabled: boolean | number | null): string {
  if (!success) return 'Présentez ce coupon digital au commerçant pour profiter de votre offre.';
  if (tier === 2 || !tier2Enabled) return 'Votre fidélité a été récompensée. À très bientôt !';
  return 'Vos points sont préservés. Le palier 2 vous attend !';
}

export default function RedeemModal({
  isOpen,
  onClose,
  tier,
  tier2Enabled,
  rewardDescription,
  tier2Reward,
  success,
  redeeming,
  merchantColor,
  onRedeem,
  onDone,
}: RedeemModalProps) {
  const TierIcon = tier === 2 ? Trophy : Gift;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !success && onClose()}
      title={success ? "Félicitations !" : `Récompense ${tier2Enabled ? `Palier ${tier}` : ''}`}
    >
      <div className="relative overflow-hidden rounded-2xl p-1">
        {/* Ambient Background Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-white/40"
              animate={{
                y: [0, -100],
                x: [0, Math.sin(i) * 50],
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{
                duration: 3 + i,
                repeat: Infinity,
                delay: i * 0.5,
                ease: "easeOut"
              }}
              style={{
                left: `${15 + i * 15}%`,
                bottom: "-10%",
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative z-10 p-6 rounded-xl border border-white/40 backdrop-blur-xl shadow-2xl overflow-hidden
            ${tier === 2
              ? 'bg-gradient-to-br from-violet-500/10 via-white/80 to-amber-500/10'
              : 'bg-white/80'
            }`}
        >
          {/* Animated Shine Effect */}
          <motion.div
            initial={{ x: "-150%" }}
            animate={{ x: "200%" }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", repeatDelay: 2 }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 pointer-events-none"
          />

          <div className="text-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: [0.8, 1.1, 1], rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.5, type: "spring" }}
              className="relative inline-block mb-6"
            >
              {/* Glow Ring */}
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className={`absolute inset-0 rounded-full blur-xl ${tier === 2 ? 'bg-violet-400' : ''}`}
                style={{ backgroundColor: tier !== 2 ? `${merchantColor}40` : undefined }}
              />

              <div className={`relative flex items-center justify-center w-20 h-20 rounded-2xl shadow-lg
                ${tier === 2 ? 'bg-gradient-to-br from-violet-600 to-indigo-600' : 'border border-white/20'}`}
                style={{ backgroundColor: tier !== 2 ? merchantColor : undefined }}
              >
                {success ? (
                  <Check className="w-10 h-10 text-white" />
                ) : (
                  <TierIcon className="w-10 h-10 text-white" />
                )}
              </div>
            </motion.div>

            <div className="space-y-2 mb-8">
              <h3 className={`text-2xl font-black tracking-tight ${tier === 2 ? 'text-violet-900' : 'text-gray-900'}`}>
                {success
                  ? getModalTitle(success, tier)
                  : (tier === 2 ? tier2Reward : rewardDescription)
                }
              </h3>
              <p className="text-gray-600 font-medium px-4 leading-relaxed">
                {getModalDescription(success, tier, tier2Enabled)}
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => success ? onDone() : onRedeem(tier)}
                loading={redeeming}
                className={`w-full h-14 text-lg font-bold rounded-xl transition-all duration-300 transform active:scale-95 shadow-xl hover:shadow-2xl hover:-translate-y-0.5
                  ${tier === 2 ? 'bg-gradient-to-r from-violet-600 to-indigo-600 border-none' : ''}`}
                style={{ backgroundColor: tier !== 2 ? merchantColor : undefined }}
              >
                {success ? 'Fermer' : 'Valider maintenant'}
              </Button>

              {!success && (
                <button
                  onClick={onClose}
                  className="w-full py-2 text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Plus tard
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </Modal>
  );
}
