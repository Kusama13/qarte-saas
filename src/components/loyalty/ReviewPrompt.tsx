'use client';

import { useState, useEffect } from 'react';
import { Star, ChevronRight, X } from 'lucide-react';

interface ReviewPromptProps {
  merchantId: string;
  shopName: string;
  reviewLink: string;
}

export default function ReviewPrompt({ merchantId, shopName, reviewLink }: ReviewPromptProps) {
  const [dismissed, setDismissed] = useState(false);
  const [permanentlyHidden, setPermanentlyHidden] = useState(false);

  useEffect(() => {
    const hidden = localStorage.getItem(`qarte_review_hidden_${merchantId}`);
    if (hidden === 'true') {
      setPermanentlyHidden(true);
    }
  }, [merchantId]);

  if (!reviewLink || reviewLink.trim() === '' || dismissed || permanentlyHidden) return null;

  return (
    <div className="mt-8 px-4">
      <div className="relative group bg-white/90 backdrop-blur-sm rounded-2xl py-5 px-6 shadow-sm border border-gray-100/80">
        <button
          onClick={(e) => {
            e.preventDefault();
            localStorage.setItem(`qarte_review_hidden_${merchantId}`, 'true');
            setPermanentlyHidden(true);
          }}
          className="absolute top-2 right-2 p-1.5 text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full hover:bg-gray-100"
          aria-label="Masquer"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <p className="text-[10px] uppercase tracking-[0.15em] text-gray-400 font-semibold mb-2">
            {shopName} vous remercie
          </p>

          <div className="flex items-center justify-center gap-3 mb-3 w-full max-w-[200px]">
            <div className="h-px flex-1 bg-gray-200" />
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <a
            href={reviewLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors duration-200 group/link"
          >
            Laisser un avis
            <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/link:translate-x-0.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
