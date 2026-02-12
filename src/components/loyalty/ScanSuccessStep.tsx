'use client';

import { useEffect, useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CreditCard, Gift, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sparkle, sparkleGrand, sparkleMedium, sparkleSubtle } from '@/lib/sparkles';
import type { Merchant, LoyaltyCard, Customer } from '@/types';

interface ScanSuccessStepProps {
  merchant: Merchant;
  loyaltyCard: LoyaltyCard;
  customer: Customer | null;
  lastCheckinPoints: number;
  previousStamps: number;
  tier1Redeemed: boolean;
  tier2Redeemed: boolean;
}

// --- Animated SVG Checkmark ---
function AnimatedCheckmark({ color, size = 96 }: { color: string; size?: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 52 52"
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Filled circle */}
      <motion.circle
        cx="26" cy="26" r="25"
        fill={color}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, ease: [0.175, 0.885, 0.32, 1.275] }}
        style={{ transformOrigin: 'center' }}
      />
      {/* White checkmark */}
      <motion.path
        d="M15 27 L23 35 L38 18"
        fill="none"
        stroke="#ffffff"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.4, ease: 'easeOut' }}
      />
    </motion.svg>
  );
}

// --- Contextual celebration messages (Proposal C) ---
function getCelebrationMessage(
  currentStamps: number,
  previousStamps: number,
  stampsRequired: number,
  customerName?: string,
): { title: string; subtitle: string; emoji: string } {
  const remaining = stampsRequired - currentStamps;

  // First scan ever
  if (previousStamps === 0) {
    return {
      title: 'Bienvenue dans la famille !',
      subtitle: `Votre carte est lanc\u00e9e${customerName ? `, ${customerName}` : ''} !`,
      emoji: '\ud83c\udf89',
    };
  }

  // Almost there (1-2 remaining)
  if (remaining > 0 && remaining <= 2) {
    return {
      title: `Plus que ${remaining} passage${remaining > 1 ? 's' : ''} !`,
      subtitle: 'Votre r\u00e9compense est toute proche !',
      emoji: '\ud83d\udd25',
    };
  }

  // Exact mid-way
  if (currentStamps === Math.ceil(stampsRequired / 2)) {
    return {
      title: 'D\u00e9j\u00e0 \u00e0 mi-chemin !',
      subtitle: 'Continuez comme \u00e7a !',
      emoji: '\u2b50',
    };
  }

  // Default
  return {
    title: 'Passage valid\u00e9 !',
    subtitle: `Merci${customerName ? ` ${customerName}` : ''} !`,
    emoji: '\u2728',
  };
}

export default function ScanSuccessStep({
  merchant,
  loyaltyCard,
  customer,
  lastCheckinPoints,
  previousStamps,
  tier1Redeemed,
  tier2Redeemed,
}: ScanSuccessStepProps) {
  const router = useRouter();
  const primaryColor = merchant.primary_color;
  const secondaryColor = merchant.secondary_color;
  const currentStamps = loyaltyCard.current_stamps;
  const stampsRequired = merchant.stamps_required || 10;

  const [showContent, setShowContent] = useState(false);
  const [displayedStamps, setDisplayedStamps] = useState(previousStamps);

  const celebration = getCelebrationMessage(
    currentStamps,
    previousStamps,
    stampsRequired,
    customer?.first_name,
  );

  // Active tier target
  const tier2On = merchant.tier2_enabled && merchant.tier2_stamps_required;
  const tier1Done = tier1Redeemed || currentStamps >= stampsRequired;
  const displayTarget = tier2On && tier1Done
    ? merchant.tier2_stamps_required!
    : stampsRequired;

  // Sparkle intensity varies by context
  const triggerSparkles = useCallback(() => {
    const colors = [primaryColor, secondaryColor || '#FFD700', '#FFB6C1', '#FFFFFF'];
    const remaining = stampsRequired - currentStamps;

    if (previousStamps === 0) {
      sparkleGrand(colors);
    } else if (remaining > 0 && remaining <= 2) {
      sparkleMedium(colors);
    } else if (currentStamps === Math.ceil(stampsRequired / 2)) {
      sparkleSubtle(colors);
    } else {
      sparkleSubtle(colors);
    }
  }, [primaryColor, secondaryColor, previousStamps, currentStamps, stampsRequired]);

  // Animation timeline
  useEffect(() => {
    // 0.4s — haptic vibration
    const t0 = setTimeout(() => {
      if ('vibrate' in navigator) navigator.vibrate(200);
    }, 400);

    // 0.6s — reveal content + sparkles
    const t1 = setTimeout(() => {
      setShowContent(true);
      triggerSparkles();
    }, 600);

    // 1.1s — animate counter old → new
    const t2 = setTimeout(() => {
      setDisplayedStamps(currentStamps);
    }, 1100);

    // 3s — auto-redirect to card page
    const t3 = setTimeout(() => {
      router.replace(`/customer/card/${merchant.id}?scan_success=1&points=${lastCheckinPoints}`);
    }, 3000);

    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const progressPct = Math.min(100, (displayedStamps / displayTarget) * 100);
  const prevProgressPct = Math.min(100, (previousStamps / displayTarget) * 100);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] py-8">

      {/* === Animated Checkmark with glow + countdown ring === */}
      <div className="relative mb-8" style={{ width: 120, height: 120 }}>
        {/* Outer glow rings */}
        <motion.div
          className="absolute rounded-full"
          style={{ backgroundColor: `${primaryColor}20`, inset: 12 }}
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.8, 1.5] }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{ backgroundColor: `${primaryColor}10`, inset: 12 }}
          initial={{ scale: 0 }}
          animate={{ scale: [0, 2.2, 2] }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />

        {/* Countdown ring (fills over 3s) */}
        <svg
          className="absolute inset-0"
          width="120"
          height="120"
          viewBox="0 0 120 120"
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* Track */}
          <circle cx="60" cy="60" r="56" fill="none" stroke={`${primaryColor}15`} strokeWidth="3" />
          {/* Progress */}
          <motion.circle
            cx="60" cy="60" r="56"
            fill="none"
            stroke={primaryColor}
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 3, ease: 'linear' }}
            style={{ opacity: 0.4 }}
          />
        </svg>

        {/* Checkmark centered */}
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatedCheckmark color={primaryColor} />
        </div>

        {/* +1 flying up */}
        <motion.div
          className="absolute font-black text-2xl"
          style={{ color: primaryColor, right: -4, top: 8 }}
          initial={{ opacity: 0, y: 20, scale: 0.3 }}
          animate={{
            opacity: [0, 1, 1, 0],
            y: [20, 0, -15, -35],
            scale: [0.3, 1.3, 1.1, 0.8],
          }}
          transition={{
            duration: 1.6,
            delay: 0.5,
            times: [0, 0.25, 0.65, 1],
          }}
        >
          +{lastCheckinPoints}
        </motion.div>
      </div>

      {/* === Content: message + counter + progress === */}
      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="text-center w-full"
          >
            <p className="text-3xl mb-2">{celebration.emoji}</p>
            <h2 className="text-2xl font-black text-gray-900 mb-1">
              {celebration.title}
            </h2>
            <p className="text-gray-500 mb-8">{celebration.subtitle}</p>

            {/* Score card */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 mx-auto max-w-sm">
              {/* Animated counter */}
              <div className="flex items-baseline justify-center gap-1 mb-1">
                <motion.span
                  key={displayedStamps}
                  initial={{ scale: 1.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 14 }}
                  className="text-5xl font-black"
                  style={{ color: primaryColor }}
                >
                  {displayedStamps}
                </motion.span>
                <span className="text-xl font-bold text-gray-300">/{displayTarget}</span>
              </div>

              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-5">
                Passages cumulés{tier2On && tier1Done ? ' · Palier 2' : tier2On ? ' · Palier 1' : ''}
              </p>

              {/* Progress bar that animates forward */}
              <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: `${prevProgressPct}%` }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                  style={{
                    background: tier2On && tier1Done
                      ? 'linear-gradient(90deg, #8b5cf6, #a78bfa)'
                      : `linear-gradient(90deg, ${primaryColor}, ${secondaryColor || primaryColor})`
                  }}
                />
              </div>

              {/* Reward proximity hint */}
              {currentStamps < displayTarget && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-4 flex items-center justify-center gap-2 text-sm"
                >
                  {tier2On && tier1Done ? (
                    <Trophy className="w-4 h-4 text-violet-500" />
                  ) : (
                    <Gift className="w-4 h-4" style={{ color: primaryColor }} />
                  )}
                  <span className="text-gray-500">
                    <strong style={{ color: tier2On && tier1Done ? '#8b5cf6' : primaryColor }}>
                      {displayTarget - currentStamps}
                    </strong>{' '}
                    passage{displayTarget - currentStamps > 1 ? 's' : ''} avant votre récompense
                  </span>
                </motion.div>
              )}
            </div>

            {/* Link — fallback if auto-redirect feels slow */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <Link
                href={`/customer/card/${merchant.id}`}
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                Voir ma carte complète
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
