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
    <div className="w-full rounded-2xl overflow-hidden border border-amber-200/60 bg-gradient-to-br from-amber-50/70 via-white to-white shadow-sm shadow-amber-100/50">
      <div className="px-4 py-3.5 flex items-center gap-3">
        {/* Star chip */}
        <div className="flex-shrink-0 w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200/50 flex items-center justify-center">
          <Star className="w-5 h-5 text-amber-500 fill-amber-400" strokeWidth={1.5} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 leading-tight">
            {t('leaveReview')}
          </p>
          <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
            {t('helpsALot')}
          </p>
        </div>

        {/* CTA button */}
        <button
          onClick={handleReview}
          className="flex-shrink-0 flex items-center gap-1 px-3.5 h-9 rounded-xl text-white text-xs font-semibold active:scale-[0.97] hover:shadow-md transition-all"
          style={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)',
          }}
        >
          {t('review')}
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
          aria-label={t('close')}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
