'use client';

import { Bell, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Subscriber } from './types';

interface SubscriberRingProps {
  subscriberCount: number | null;
  subscribers: Subscriber[];
  loadingCount: boolean;
}

export default function SubscriberRing({ subscriberCount, subscribers, loadingCount }: SubscriberRingProps) {
  const [showSubscriberList, setShowSubscriberList] = useState(false);
  const t = useTranslations('marketing.subscriberRing');

  const count = subscriberCount ?? 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
          {loadingCount ? (
            <div className="w-6 h-6 bg-gray-100 rounded animate-pulse" />
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold text-indigo-600 leading-none">{count}</span>
              <Bell className="w-3 h-3 text-indigo-400 mt-0.5" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900">{t('pushSubscribers')}</p>
          <p className="text-xs text-gray-500 mt-0.5">{t('pushSubscribersDesc')}</p>
          {count > 0 && !loadingCount && (
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
                    <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-semibold text-xs">
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
