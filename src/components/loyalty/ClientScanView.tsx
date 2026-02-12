'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Gift,
  Undo2,
  Plus,
  Minus,
  Sparkles,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { sparkleMedium } from '@/lib/sparkles';
import type { Merchant, LoyaltyCard, Customer } from '@/types';

interface ClientScanViewProps {
  merchant: Merchant;
  card: LoyaltyCard;
  customer: Customer;
  onCheckin: (points: number) => Promise<{ success: boolean; newStamps: number; voucherCreated?: boolean }>;
  onUndo?: () => Promise<boolean>;
}

export function ClientScanView({
  merchant,
  card,
  customer,
  onCheckin,
  onUndo,
}: ClientScanViewProps) {
  const [currentStamps, setCurrentStamps] = useState(card.current_stamps);
  const [quantity, setQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkinSuccess, setCheckinSuccess] = useState(false);
  const [voucherUnlocked, setVoucherUnlocked] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [undoTimer, setUndoTimer] = useState(0);
  const [lastCheckinPoints, setLastCheckinPoints] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Use card's stamps_target for grandfathering, fallback to merchant's current setting
  const stampsTarget = card.stamps_target || merchant.stamps_required;

  // Undo timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (canUndo && undoTimer > 0) {
      interval = setInterval(() => {
        setUndoTimer((prev) => {
          if (prev <= 1) {
            setCanUndo(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [canUndo, undoTimer]);

  const triggerSparkles = useCallback(() => {
    const colors = [merchant.primary_color, merchant.secondary_color || '#FFD700', '#FFB6C1', '#FFFFFF'];
    sparkleMedium(colors);
  }, [merchant.primary_color, merchant.secondary_color]);

  const handleCheckin = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    setError(null);

    const pointsToAdd = 1;

    try {
      const result = await onCheckin(pointsToAdd);

      if (result.success) {
        setCurrentStamps(result.newStamps);
        setLastCheckinPoints(pointsToAdd);
        setCheckinSuccess(true);

        if (result.voucherCreated) {
          setVoucherUnlocked(true);
          triggerSparkles();
        }

        // Start undo timer
        setCanUndo(true);
        setUndoTimer(8);

        // Reset quantity for article mode
        setQuantity(1);
      } else {
        setError('Une erreur est survenue. Veuillez réessayer.');
      }
    } catch (err) {
      console.error('Checkin error:', err);
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUndo = async () => {
    if (!canUndo || !onUndo) return;

    setIsProcessing(true);
    try {
      const success = await onUndo();
      if (success) {
        setCurrentStamps((prev) => Math.max(0, prev - lastCheckinPoints));
        setCanUndo(false);
        setUndoTimer(0);
        setCheckinSuccess(false);
        setVoucherUnlocked(false);
      }
    } catch (err) {
      console.error('Undo error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const progress = Math.min(100, (currentStamps / stampsTarget) * 100);
  const remaining = Math.max(0, stampsTarget - currentStamps);

  return (
    <div className="space-y-6">
      {/* Progress Section */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
        {/* Customer Info */}
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl"
            style={{ backgroundColor: merchant.primary_color }}
          >
            {customer.first_name[0]}
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg">
              {customer.first_name} {customer.last_name || ''}
            </p>
            <p className="text-sm text-gray-500">{customer.phone_number}</p>
          </div>
        </div>

        {/* Points Display */}
        <div className="text-center mb-6">
          <div className="flex items-baseline justify-center gap-1">
            <motion.span
              key={currentStamps}
              initial={{ scale: 1.2, color: merchant.primary_color }}
              animate={{ scale: 1, color: '#111827' }}
              className="text-5xl font-black"
            >
              {currentStamps}
            </motion.span>
            <span className="text-2xl font-bold text-gray-300">/{stampsTarget}</span>
          </div>
          <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">
            Passages
          </p>
        </div>

        {/* Progress Bar */}
        <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden mb-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${merchant.primary_color}, ${merchant.secondary_color || merchant.primary_color})`,
            }}
          />
        </div>

        {/* Remaining Text */}
        <p className="text-center text-sm text-gray-600">
          {remaining > 0 ? (
            <>
              Plus que <span className="font-bold" style={{ color: merchant.primary_color }}>{remaining}</span>{' '}
              passage{remaining > 1 ? 's' : ''} pour votre cadeau !
            </>
          ) : (
            <span className="font-bold text-green-600">Cadeau disponible !</span>
          )}
        </p>
      </div>

      {/* Voucher Unlocked Banner */}
      <AnimatePresence>
        {voucherUnlocked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl p-6 text-white text-center shadow-xl shadow-green-200"
          >
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Gift className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">
              Bravo ! Vous avez débloqué :
            </h3>
            <p className="text-lg font-medium opacity-90">
              {merchant.reward_description}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm opacity-80">Un bon a été créé dans votre espace</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkin Section */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-4 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Checkin Button */}
        {!checkinSuccess ? (
          <Button
            onClick={handleCheckin}
            disabled={isProcessing}
            className="w-full h-16 rounded-2xl text-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
            style={{
              background: `linear-gradient(135deg, ${merchant.primary_color}, ${merchant.secondary_color || merchant.primary_color})`,
            }}
          >
            {isProcessing ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Plus className="w-6 h-6 mr-2" />
                Valider le passage
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-4">
            {/* Success State */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-6 rounded-2xl bg-green-50 border border-green-100 text-center"
            >
              <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Check className="w-8 h-8 text-white" />
              </div>
              <p className="font-bold text-green-800 text-lg">
                +{lastCheckinPoints} point{lastCheckinPoints > 1 ? 's' : ''} ajouté{lastCheckinPoints > 1 ? 's' : ''} !
              </p>
            </motion.div>

            {/* Undo Button */}
            {canUndo && onUndo && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleUndo}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700 font-medium"
              >
                <Undo2 className="w-5 h-5" />
                Annuler ({undoTimer}s)
              </motion.button>
            )}
          </div>
        )}
      </div>

      {/* Reward Preview */}
      <div
        className="rounded-3xl border p-5 flex items-center gap-4"
        style={{
          backgroundColor: `${merchant.primary_color}05`,
          borderColor: `${merchant.primary_color}15`,
        }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${merchant.primary_color}15` }}
        >
          <Gift className="w-6 h-6" style={{ color: merchant.primary_color }} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
            À {stampsTarget} passages
          </p>
          <p className="font-bold text-gray-900">{merchant.reward_description}</p>
        </div>
      </div>
    </div>
  );
}

export default ClientScanView;
