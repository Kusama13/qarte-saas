'use client';

import { useState, useEffect } from 'react';
import { Star, X, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ReviewCardProps {
  reviewLink: string;
  shopName: string;
  merchantId: string;
}

const REVIEW_DISMISSED_KEY = 'qarte_review_card_dismissed_';

export default function ReviewCard({ reviewLink, shopName, merchantId }: ReviewCardProps) {
  const t = useTranslations('reviewCard');
  const [dismissed, setDismissed] = useState(true); // hidden by default until check

  useEffect(() => {
    const stored = localStorage.getItem(`${REVIEW_DISMISSED_KEY}${merchantId}`);
    if (stored) {
      const days = (Date.now() - parseInt(stored)) / (1000 * 60 * 60 * 24);
      setDismissed(days < 90);
    } else {
      setDismissed(false);
    }
  }, [merchantId]);

  const handleDismiss = () => {
    localStorage.setItem(`${REVIEW_DISMISSED_KEY}${merchantId}`, Date.now().toString());
    setDismissed(true);
  };

  const handleReview = () => {
    localStorage.setItem(`${REVIEW_DISMISSED_KEY}${merchantId}`, Date.now().toString());
    window.open(reviewLink, '_blank', 'noopener,noreferrer');
  };

  if (dismissed) return null;

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-amber-100 bg-white">
      <div className="px-4 py-3 flex items-center gap-3">
        {/* Stars icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
          <div className="flex items-center gap-px">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-2 h-2 text-amber-400 fill-amber-400" />
            ))}
          </div>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-gray-900 leading-tight">
            {t('leaveReview')}
          </p>
          <p className="text-[11px] text-gray-400 leading-tight mt-0.5">
            {t('helpsALot')}
          </p>
        </div>

        {/* CTA button */}
        <button
          onClick={handleReview}
          className="flex-shrink-0 flex items-center gap-1 px-3 h-8 rounded-lg text-white text-[11px] font-semibold active:scale-[0.97] transition-all"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
        >
          {t('review')}
          <ChevronRight className="w-3 h-3" />
        </button>

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-all"
          aria-label={t('close')}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
