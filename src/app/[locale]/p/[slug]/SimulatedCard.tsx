'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Gift } from 'lucide-react';
import { useInView } from '@/hooks/useInView';
import { sparkleSubtle } from '@/lib/sparkles';
import { useTranslations } from 'next-intl';

function getGridCols(total: number): string {
  if (total <= 3) return 'grid-cols-3';
  if (total <= 4) return 'grid-cols-4';
  if (total <= 5) return 'grid-cols-5';
  if (total === 6) return 'grid-cols-3';
  if (total === 7) return 'grid-cols-4';
  if (total === 8) return 'grid-cols-4';
  if (total === 9) return 'grid-cols-5';
  if (total === 10) return 'grid-cols-5';
  if (total === 11) return 'grid-cols-4';
  if (total === 12) return 'grid-cols-4';
  return 'grid-cols-5';
}

interface SimulatedCardProps {
  stampsRequired: number;
  rewardDescription: string;
  primaryColor: string;
  secondaryColor: string;
}

export default function SimulatedCard({
  stampsRequired,
  rewardDescription,
  primaryColor: p,
  secondaryColor: s,
}: SimulatedCardProps) {
  const t = useTranslations('simulatedCard');
  // Cap visual stamps at 10 for readability
  const displayStamps = Math.min(stampsRequired, 10);
  const [filled, setFilled] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'filling' | 'celebrating' | 'done'>('idle');
  const { ref: viewRef, isInView } = useInView();
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  // Start filling when in view
  useEffect(() => {
    if (isInView && phase === 'idle') {
      timeoutRef.current = setTimeout(() => setPhase('filling'), 400);
    }
    return cleanup;
  }, [isInView, phase, cleanup]);

  // Fill stamps one by one
  useEffect(() => {
    if (phase !== 'filling') return;

    intervalRef.current = setInterval(() => {
      setFilled((prev) => {
        const next = prev + 1;
        if (next >= displayStamps) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          // Small pause before celebration
          timeoutRef.current = setTimeout(() => setPhase('celebrating'), 200);
        }
        return next;
      });
    }, 280);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase, displayStamps]);

  // Celebration → done → auto-replay
  useEffect(() => {
    if (phase !== 'celebrating') return;

    // Fire sparkles from the component center
    if (containerRef.current) {
      sparkleSubtle([p, s, '#FFD700', '#FFFFFF'].filter(Boolean));
    }

    timeoutRef.current = setTimeout(() => setPhase('done'), 600);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [phase, p, s]);


  // Cleanup on unmount
  useEffect(() => cleanup, [cleanup]);

  const showReward = phase === 'celebrating' || phase === 'done';

  return (
    <div ref={viewRef}>
      <div
        ref={containerRef}
        className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.06)] overflow-hidden"
      >
        {/* Stamp grid */}
        <div className={`grid ${getGridCols(displayStamps)} gap-2.5 mb-4`}>
          {Array.from({ length: displayStamps }).map((_, i) => {
            const isLast = i === displayStamps - 1;
            const isFilled = i < filled;

            return (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={
                  isFilled
                    ? { scale: 1, opacity: 1 }
                    : { scale: 0, opacity: 0 }
                }
                transition={
                  isFilled
                    ? { type: 'spring', stiffness: isLast ? 350 : 400, damping: isLast ? 10 : 14 }
                    : { duration: 0 }
                }
                className={`aspect-square rounded-xl flex items-center justify-center transition-colors duration-200 ${
                  isFilled
                    ? 'text-white shadow-md'
                    : isLast
                      ? 'bg-gray-50 border-2 border-dashed text-gray-300'
                      : 'bg-gray-50 text-gray-200 border border-gray-100'
                }`}
                style={{
                  backgroundColor: isFilled ? p : undefined,
                  borderColor: isLast && !isFilled ? `${p}40` : undefined,
                }}
              >
                {(() => {
                  const big = displayStamps <= 6;
                  const filledSize = big ? 'w-7 h-7' : 'w-5 h-5';
                  const emptySize = big ? 'w-6 h-6' : 'w-4 h-4';
                  if (isLast) {
                    return isFilled ? (
                      <Gift className={filledSize} />
                    ) : (
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        <Gift className={emptySize} style={{ color: `${p}60` }} />
                      </motion.div>
                    );
                  }
                  return <Heart className={isFilled ? filledSize : emptySize} />;
                })()}
              </motion.div>
            );
          })}
        </div>

        {/* Reward banner — slides up on celebration */}
        <AnimatePresence>
          {showReward && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ type: 'spring', damping: 22, stiffness: 280 }}
              className="relative rounded-xl overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${p}, ${s})`,
                boxShadow: `0 4px 24px ${p}40`,
              }}
            >
              {/* Shimmer sweep */}
              <motion.div
                animate={{ x: ['-150%', '200%'] }}
                transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12 pointer-events-none"
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_40%,rgba(255,255,255,0.16),transparent_60%)] pointer-events-none" />

              <div className="relative px-5 pt-4 pb-5">
                <p className="text-[10px] font-bold text-white/55 mb-1.5 uppercase tracking-widest">
                  {t('afterVisits', { count: stampsRequired })}
                </p>
                <p className="text-[18px] font-black text-white leading-snug tracking-tight">
                  {rewardDescription || t('defaultReward')}
                </p>
                <p className="text-[11px] text-white/60 mt-1.5 font-medium">
                  {t('freeForYou')}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
