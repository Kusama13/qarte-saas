'use client';

import { forwardRef } from 'react';
import { useTranslations } from 'next-intl';
import { MONTH_LABELS_FR } from '@/lib/utils';

interface ContestWinnerStoryProps {
  shopName: string;
  primaryColor: string;
  secondaryColor: string;
  winnerName: string;
  prizeDescription: string;
  contestMonth: string;
  scale?: number;
}

export const ContestWinnerStory = forwardRef<HTMLDivElement, ContestWinnerStoryProps>(
  ({ shopName, primaryColor, secondaryColor, winnerName, prizeDescription, contestMonth, scale = 1 }, ref) => {
    const t = useTranslations('contestStory');
    const s = scale;
    const width = 400 * s;
    const height = 500 * s;

    const [year, month] = contestMonth.split('-');
    const monthLabel = MONTH_LABELS_FR[month] || month;
    const monthDisplay = `${monthLabel} ${year}`;

    return (
      <div
        ref={ref}
        className="relative overflow-hidden"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: `linear-gradient(160deg, ${primaryColor} 0%, ${secondaryColor} 40%, ${primaryColor} 70%, ${secondaryColor} 100%)`,
          clipPath: 'inset(0px)',
        }}
      >
        {/* Ambient glow top-right */}
        <div style={{
          position: 'absolute', width: `${280 * s}px`, height: `${280 * s}px`,
          top: `${-80 * s}px`, right: `${-80 * s}px`, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', width: `${200 * s}px`, height: `${200 * s}px`,
          bottom: `${-40 * s}px`, left: `${-60 * s}px`, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
        }} />

        {/* Gold shimmer lines */}
        <div style={{
          position: 'absolute', top: `${105 * s}px`, left: 0, right: 0,
          height: `${1 * s}px`,
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,215,0,0.3) 30%, rgba(255,215,0,0.5) 50%, rgba(255,215,0,0.3) 70%, transparent 100%)',
        }} />
        <div style={{
          position: 'absolute', bottom: `${100 * s}px`, left: 0, right: 0,
          height: `${1 * s}px`,
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,215,0,0.2) 30%, rgba(255,215,0,0.4) 50%, rgba(255,215,0,0.2) 70%, transparent 100%)',
        }} />

        {/* Star sparkles */}
        {[
          { top: 20, left: 25, size: 12, opacity: 0.7 },
          { top: 60, right: 20, size: 9, opacity: 0.5 },
          { top: 410, left: 30, size: 10, opacity: 0.6 },
          { top: 450, right: 35, size: 7, opacity: 0.4 },
          { top: 220, left: 10, size: 6, opacity: 0.3 },
          { top: 145, right: 12, size: 8, opacity: 0.45 },
          { top: 330, right: 18, size: 11, opacity: 0.55 },
          { top: 370, left: 15, size: 5, opacity: 0.35 },
          { top: 260, right: 30, size: 7, opacity: 0.4 },
        ].map((star, i) => (
          <svg
            key={i}
            style={{
              position: 'absolute',
              top: `${star.top * s}px`,
              ...('left' in star && star.left !== undefined ? { left: `${star.left * s}px` } : {}),
              ...('right' in star && star.right !== undefined ? { right: `${star.right * s}px` } : {}),
              width: `${star.size * s}px`,
              height: `${star.size * s}px`,
              opacity: star.opacity,
            }}
            viewBox="0 0 24 24" fill="rgba(255,215,0,0.9)"
          >
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" />
          </svg>
        ))}

        {/* Content */}
        <div
          className="relative flex flex-col items-center justify-between h-full"
          style={{ padding: `${28 * s}px ${24 * s}px ${18 * s}px` }}
        >
          {/* Top ornament */}
          <div style={{
            width: `${60 * s}px`, height: `${2 * s}px`,
            background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.6), transparent)',
            borderRadius: `${1 * s}px`,
            marginBottom: `${10 * s}px`,
          }} />

          {/* Shop name */}
          <h1 className="text-white text-center leading-none"
            style={{
              fontSize: `${28 * s}px`, maxWidth: `${320 * s}px`,
              fontFamily: 'var(--font-display), Georgia, serif',
              fontWeight: 700, fontStyle: 'italic',
              textShadow: `0 ${2 * s}px ${12 * s}px rgba(0,0,0,0.3)`,
              marginBottom: `${6 * s}px`,
            }}>
            {shopName}
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: `${9 * s}px`, fontWeight: 700,
            color: 'rgba(255,215,0,0.8)',
            letterSpacing: `${3 * s}px`, textTransform: 'uppercase',
            marginBottom: `${12 * s}px`,
          }}>
            {t('label')}
          </p>

          {/* Trophy with glow */}
          <div style={{
            position: 'relative',
            width: `${68 * s}px`, height: `${68 * s}px`,
            marginBottom: `${12 * s}px`,
          }}>
            <div style={{
              position: 'absolute', inset: `${-10 * s}px`,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,215,0,0.2) 0%, transparent 70%)',
            }} />
            <div style={{
              position: 'absolute', inset: 0,
              borderRadius: '50%',
              border: `${1.5 * s}px solid rgba(255,215,0,0.35)`,
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: `${34 * s}px`, filter: `drop-shadow(0 ${2 * s}px ${6 * s}px rgba(0,0,0,0.2))` }}>🏆</span>
            </div>
          </div>

          {/* Winner card — premium frosted */}
          <div style={{
            width: '100%',
            padding: `${22 * s}px ${20 * s}px`,
            borderRadius: `${22 * s}px`,
            background: 'rgba(255,255,255,0.12)',
            border: `${1.5 * s}px solid rgba(255,215,0,0.25)`,
            boxShadow: `0 ${8 * s}px ${32 * s}px rgba(0,0,0,0.15), inset 0 ${1 * s}px ${0}px rgba(255,255,255,0.15)`,
            textAlign: 'center',
          }}>
            {/* Winner name — big hero */}
            <p className="text-white" style={{
              fontSize: `${34 * s}px`, fontWeight: 800,
              fontFamily: 'var(--font-display), Georgia, serif',
              fontStyle: 'italic',
              lineHeight: 1.1,
              textShadow: `0 ${1 * s}px ${4 * s}px rgba(0,0,0,0.2)`,
              marginBottom: `${14 * s}px`,
            }}>
              {winnerName}
            </p>

            {/* Gold divider */}
            <div style={{
              width: `${50 * s}px`, height: `${1.5 * s}px`,
              background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.5), transparent)',
              margin: `0 auto ${12 * s}px`,
            }} />

            {/* Prize won */}
            <p style={{
              fontSize: `${9 * s}px`, fontWeight: 800,
              color: 'rgba(255,215,0,0.7)',
              textTransform: 'uppercase',
              letterSpacing: `${2 * s}px`,
              marginBottom: `${6 * s}px`,
            }}>
              {t('won')}
            </p>
            <p className="text-white" style={{
              fontSize: `${17 * s}px`, fontWeight: 700,
              lineHeight: 1.3,
              marginBottom: `${12 * s}px`,
            }}>
              {prizeDescription}
            </p>

            {/* Month badge */}
            <div style={{
              padding: `${5 * s}px ${14 * s}px`,
              borderRadius: `${10 * s}px`,
              background: 'rgba(255,215,0,0.12)',
              border: `${1 * s}px solid rgba(255,215,0,0.25)`,
              display: 'inline-block',
            }}>
              <p style={{
                fontSize: `${10 * s}px`, fontWeight: 700,
                color: 'rgba(255,215,0,0.85)',
                letterSpacing: `${0.5 * s}px`,
              }}>
                {monthDisplay}
              </p>
            </div>
          </div>

          {/* CTA */}
          <div style={{
            marginTop: `${14 * s}px`,
            padding: `${8 * s}px ${28 * s}px`,
            borderRadius: `${12 * s}px`,
            background: 'rgba(255,255,255,0.15)',
            border: `${1 * s}px solid rgba(255,255,255,0.25)`,
          }}>
            <p className="text-white" style={{
              fontSize: `${12 * s}px`, fontWeight: 700,
              letterSpacing: `${0.5 * s}px`,
            }}>
              {t('cta')}
            </p>
          </div>

          {/* Branding */}
          <div className="flex items-center justify-end w-full" style={{ marginTop: `${10 * s}px` }}>
            <span style={{
              padding: `${2 * s}px ${8 * s}px`,
              borderRadius: `${8 * s}px`,
              background: 'rgba(255,255,255,0.85)',
              fontSize: `${7 * s}px`,
              lineHeight: 1,
            }}>
              <span style={{ fontWeight: 500, color: '#9ca3af' }}>
                {t('poweredBy')}&nbsp;
              </span>
              <span style={{ fontWeight: 800, color: '#6b7280' }}>
                getqarte.com
              </span>
            </span>
          </div>
        </div>
      </div>
    );
  }
);

ContestWinnerStory.displayName = 'ContestWinnerStory';

export default ContestWinnerStory;
