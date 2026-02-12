'use client';

import { useState, useEffect } from 'react';
import { Star, ChevronRight, X } from 'lucide-react';

interface ReviewPromptProps {
  merchantId: string;
  shopName: string;
  reviewLink: string;
}

export default function ReviewPrompt({ merchantId, shopName, reviewLink }: ReviewPromptProps) {
  const [permanentlyHidden, setPermanentlyHidden] = useState(false);

  useEffect(() => {
    const hidden = localStorage.getItem(`qarte_review_hidden_${merchantId}`);
    if (hidden === 'true') {
      setPermanentlyHidden(true);
    }
  }, [merchantId]);

  if (!reviewLink || reviewLink.trim() === '' || permanentlyHidden) return null;

  return (
    <div className="mt-2 mb-4">
      <div
        className="relative rounded-2xl p-4 overflow-hidden bg-white/70 backdrop-blur-sm shadow-lg shadow-gray-200/50 border border-gray-100/80"
      >
        {/* Dismiss */}
        <button
          onClick={(e) => {
            e.preventDefault();
            localStorage.setItem(`qarte_review_hidden_${merchantId}`, 'true');
            setPermanentlyHidden(true);
          }}
          className="absolute top-2.5 right-2.5 p-1 text-amber-300 hover:text-amber-500 transition-colors rounded-full hover:bg-amber-100/50"
          aria-label="Masquer"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-3.5">
          {/* 5 stars — visual anchor */}
          <div className="shrink-0">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-800 leading-tight">Votre avis compte</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Partagez votre expérience</p>
          </div>

          {/* CTA button */}
          <a
            href={reviewLink}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold shadow-sm shadow-amber-200/50 hover:bg-amber-600 active:scale-95 transition-all"
          >
            J&apos;y vais
            <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
