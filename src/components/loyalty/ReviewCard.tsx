'use client';

import { useState, useEffect } from 'react';
import { Star, ChevronRight } from 'lucide-react';

interface ReviewCardProps {
  reviewLink: string;
  shopName: string;
  merchantId: string;
}

const REVIEW_DISMISSED_KEY = 'qarte_review_card_dismissed_';

export default function ReviewCard({ reviewLink, shopName, merchantId }: ReviewCardProps) {
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
    <div className="w-full rounded-2xl overflow-hidden border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-amber-50/50">
      <div className="px-5 py-5 flex flex-col items-center text-center gap-3">
        {/* Stars */}
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
          ))}
        </div>

        {/* Message */}
        <p className="text-sm font-bold text-gray-900 leading-snug">
          Un avis, c&apos;est la meilleure façon de nous soutenir
        </p>

        {/* CTA */}
        <button
          onClick={handleReview}
          className="w-full flex items-center justify-center gap-2 h-10 rounded-xl text-white text-xs font-semibold shadow-md shadow-amber-200/50 active:scale-[0.97] transition-all"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
        >
          Laisser un avis
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          className="text-xs text-gray-400 hover:text-gray-500 transition-colors"
        >
          J&apos;ai déjà laissé un avis
        </button>
      </div>
    </div>
  );
}
