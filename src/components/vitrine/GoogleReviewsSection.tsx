'use client';

import { Star, Quote, ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { GoogleReviewsData } from '@/lib/google-places';
import { GoogleGlyph } from '@/components/icons/GoogleGlyph';

const GOLD = '#B8860B';

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  const full = Math.round(value);
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={i <= full ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
        />
      ))}
    </span>
  );
}

export default function GoogleReviewsSection({
  data,
  accent,
  accent2,
  fallbackLink,
}: {
  data: GoogleReviewsData;
  accent: string;
  accent2: string;
  fallbackLink?: string | null;
}) {
  const t = useTranslations('googleReviews');
  const p = accent;
  const s = accent2 || accent;
  const link = data.mapsUri || fallbackLink || null;
  // On affiche les 3 avis les plus pertinents ; le reste via « voir tout » sur Google.
  const reviews = data.reviews.filter((r) => r.text.trim().length > 0).slice(0, 3);

  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-black/[0.06] shadow-[0_1px_2px_rgba(15,10,40,0.04),0_8px_24px_rgba(15,10,40,0.05)]">
      {/* ── Note (héros) ── */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-3.5">
          <span className="text-[40px] leading-none font-black" style={{ color: GOLD }}>
            {data.rating.toFixed(1).replace('.', ',')}
          </span>
          <div className="min-w-0">
            <Stars value={data.rating} size={18} />
            <p className="text-[12.5px] text-gray-600 mt-1 flex items-center gap-1.5">
              <GoogleGlyph size={14} />
              <span>{t('basedOn', { count: data.ratingCount })}</span>
            </p>
          </div>
        </div>
        <p className="text-[11px] text-gray-400 mt-2.5">{t('verified')}</p>
      </div>

      {/* ── Avis (témoignages) ── */}
      {reviews.length > 0 && (
        <div className="px-5 pb-4 space-y-2.5">
          {reviews.map((r, i) => (
            <div key={i} className="rounded-xl bg-white border border-black/[0.07] p-3.5 shadow-[0_1px_2px_rgba(15,10,40,0.03)]">
              <div className="flex items-center gap-2.5 mb-2">
                {r.authorPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.authorPhoto} alt="" loading="lazy" referrerPolicy="no-referrer" className="w-8 h-8 rounded-full object-cover shrink-0" />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] font-bold shrink-0"
                    style={{ background: `linear-gradient(135deg, ${p}, ${s})` }}
                  >
                    {r.author.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-semibold text-gray-900 truncate">{r.author}</p>
                  <div className="flex items-center gap-1.5">
                    <Stars value={r.rating} size={11} />
                    {r.relativeTime && <span className="text-[10px] text-gray-400">{r.relativeTime}</span>}
                  </div>
                </div>
                <Quote className="w-5 h-5 shrink-0 self-start" style={{ color: p, opacity: 0.4 }} />
              </div>
              <p className="text-[12.5px] text-gray-600 leading-relaxed whitespace-pre-line">{r.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── CTA voir tout (attribution Google obligatoire) ── */}
      {link && (
        <div className="px-5 pb-5">
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-semibold text-gray-800 hover:opacity-90 active:scale-[0.99] transition-all"
            style={{ backgroundColor: `${p}12` }}
          >
            <GoogleGlyph size={15} />
            {t('seeAll')}
            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
          </a>
        </div>
      )}
    </div>
  );
}
