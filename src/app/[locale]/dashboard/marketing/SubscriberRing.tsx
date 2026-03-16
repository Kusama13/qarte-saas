'use client';

import { Bell, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AUTOMATION_UNLOCK_THRESHOLD } from './types';
import type { Subscriber } from './types';

const RING_SIZE = 80;
const RING_STROKE = 6;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

interface SubscriberRingProps {
  subscriberCount: number | null;
  subscribers: Subscriber[];
  loadingCount: boolean;
}

export default function SubscriberRing({ subscriberCount, subscribers, loadingCount }: SubscriberRingProps) {
  const [showSubscriberList, setShowSubscriberList] = useState(false);
  const t = useTranslations('marketing.subscriberRing');

  const automationsUnlocked = (subscriberCount ?? 0) >= AUTOMATION_UNLOCK_THRESHOLD;
  const subscriberProgress = Math.min((subscriberCount ?? 0) / AUTOMATION_UNLOCK_THRESHOLD, 1);
  const ringOffset = RING_CIRCUMFERENCE - subscriberProgress * RING_CIRCUMFERENCE;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
      <div className="flex items-center gap-4">
        {/* SVG Ring */}
        <div className="relative flex-shrink-0" style={{ width: RING_SIZE, height: RING_SIZE }}>
          <svg width={RING_SIZE} height={RING_SIZE} className="-rotate-90" role="img" aria-label={t('ringAriaLabel', { count: subscriberCount ?? 0, threshold: AUTOMATION_UNLOCK_THRESHOLD })}>
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              stroke="#f3f4f6"
              strokeWidth={RING_STROKE}
            />
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              stroke={automationsUnlocked ? '#22c55e' : '#6366f1'}
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={ringOffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {loadingCount ? (
              <div className="w-6 h-6 bg-gray-100 rounded animate-pulse" />
            ) : (
              <>
                <span className="text-xl font-black text-gray-900 leading-none">{subscriberCount ?? 0}</span>
                <Bell className="w-3 h-3 text-gray-400 mt-0.5" />
              </>
            )}
          </div>
        </div>

        {/* Text + progress bar */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900">{t('pushSubscribers')}</p>
          {!loadingCount && (
            <>
              {automationsUnlocked ? (
                <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {t('automationsUnlocked')}
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-0.5">
                  {t.rich('subscribersNeeded', {
                    count: AUTOMATION_UNLOCK_THRESHOLD - (subscriberCount ?? 0),
                    bold: (chunks) => <span className="font-bold text-indigo-600">{chunks}</span>,
                  })}
                </p>
              )}
              <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${subscriberProgress * 100}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className={`h-full rounded-full ${automationsUnlocked ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                />
              </div>
            </>
          )}
          {subscriberCount !== null && subscriberCount > 0 && !loadingCount && (
            <button
              onClick={() => setShowSubscriberList(!showSubscriberList)}
              className="mt-2 flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              {showSubscriberList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showSubscriberList ? t('hideList') : t('showList')}
            </button>
          )}
        </div>
      </div>

      {/* Subscriber List (collapsible) */}
      <AnimatePresence>
        {showSubscriberList && subscribers.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid gap-2 max-h-64 overflow-y-auto">
                {subscribers.map((subscriber) => (
                  <div key={subscriber.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-xs">
                      {subscriber.first_name?.charAt(0) || '?'}
                    </div>
                    <p className="font-medium text-gray-900 text-sm truncate flex-1">
                      {subscriber.first_name} {subscriber.last_name}
                    </p>
                    <Bell className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
