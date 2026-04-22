'use client';

import { forwardRef } from 'react';
import { useTranslations } from 'next-intl';
import { MONTH_LABELS_FR } from '@/lib/utils';

interface ContestAnnouncementStoryProps {
  shopName: string;
  primaryColor: string;
  secondaryColor: string;
  prizeDescription: string;
  contestMonth: string;
  scale?: number;
}

export const ContestAnnouncementStory = forwardRef<HTMLDivElement, ContestAnnouncementStoryProps>(
  ({ shopName, primaryColor, secondaryColor, prizeDescription, contestMonth, scale = 1 }, ref) => {
    const t = useTranslations('contestAnnounce');
    const s = scale;
    const width = 400 * s;
    const height = 500 * s;

    const [year, month] = contestMonth.split('-');
    const monthLabel = MONTH_LABELS_FR[month] || month;
    const lastDay = new Date(Number(year), Number(month), 0).getDate();
    const dateRange = `Du 1er au ${lastDay} ${monthLabel.toLowerCase()}`;

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
        {/* Ambient glow bottom-left */}
        <div style={{
          position: 'absolute', width: `${200 * s}px`, height: `${200 * s}px`,
          bottom: `${-40 * s}px`, left: `${-60 * s}px`, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
        }} />

        {/* Gold shimmer line across */}
        <div style={{
          position: 'absolute', top: `${120 * s}px`, left: 0, right: 0,
          height: `${1 * s}px`,
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,215,0,0.3) 30%, rgba(255,215,0,0.5) 50%, rgba(255,215,0,0.3) 70%, transparent 100%)',
        }} />
        <div style={{
          position: 'absolute', bottom: `${110 * s}px`, left: 0, right: 0,
          height: `${1 * s}px`,
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,215,0,0.2) 30%, rgba(255,215,0,0.4) 50%, rgba(255,215,0,0.2) 70%, transparent 100%)',
        }} />

        {/* Star sparkles — 4-point stars */}
        {[
          { top: 25, left: 30, size: 12, opacity: 0.7 },
          { top: 70, right: 25, size: 8, opacity: 0.5 },
          { top: 400, left: 35, size: 10, opacity: 0.6 },
          { top: 440, right: 40, size: 7, opacity: 0.4 },
          { top: 200, left: 12, size: 6, opacity: 0.3 },
          { top: 160, right: 15, size: 9, opacity: 0.5 },
          { top: 310, right: 20, size: 11, opacity: 0.6 },
          { top: 350, left: 18, size: 5, opacity: 0.35 },
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
          {/* Top ornament line */}
          <div style={{
            width: `${60 * s}px`, height: `${2 * s}px`,
            background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.6), transparent)',
            borderRadius: `${1 * s}px`,
            marginBottom: `${10 * s}px`,
          }} />

          {/* Shop name — luxe serif */}
          <h1 className="text-white text-center leading-none"
            style={{
              fontSize: `${30 * s}px`, maxWidth: `${320 * s}px`,
              fontFamily: 'var(--font-display), Georgia, serif',
              fontWeight: 700, fontStyle: 'italic',
              textShadow: `0 ${2 * s}px ${12 * s}px rgba(0,0,0,0.3)`,
              marginBottom: `${6 * s}px`,
            }}>
            {shopName}
          </h1>

          {/* Subtitle — uppercase tracked */}
          <p style={{
            fontSize: `${9 * s}px`, fontWeight: 700,
            color: 'rgba(255,215,0,0.8)',
            letterSpacing: `${3 * s}px`, textTransform: 'uppercase',
            marginBottom: `${14 * s}px`,
          }}>
            {t('label')}
          </p>

          {/* Central gift — glowing circle */}
          <div style={{
            position: 'relative',
            width: `${72 * s}px`, height: `${72 * s}px`,
            marginBottom: `${14 * s}px`,
          }}>
            {/* Outer glow ring */}
            <div style={{
              position: 'absolute', inset: `${-8 * s}px`,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,215,0,0.15) 0%, transparent 70%)',
            }} />
            {/* Inner ring */}
            <div style={{
              position: 'absolute', inset: 0,
              borderRadius: '50%',
              border: `${1.5 * s}px solid rgba(255,215,0,0.35)`,
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: `${36 * s}px`, filter: `drop-shadow(0 ${2 * s}px ${6 * s}px rgba(0,0,0,0.2))` }}>🎁</span>
            </div>
          </div>

          {/* Prize card — premium frosted glass with gold border */}
          <div style={{
            width: '100%',
            padding: `${24 * s}px ${22 * s}px`,
            borderRadius: `${22 * s}px`,
            background: 'rgba(255,255,255,0.12)',
            border: `${1.5 * s}px solid rgba(255,215,0,0.25)`,
            boxShadow: `0 ${8 * s}px ${32 * s}px rgba(0,0,0,0.15), inset 0 ${1 * s}px ${0}px rgba(255,255,255,0.15)`,
            textAlign: 'center',
          }}>
            {/* "A gagner" label */}
            <p style={{
              fontSize: `${9 * s}px`, fontWeight: 800,
              color: 'rgba(255,215,0,0.7)',
              textTransform: 'uppercase',
              letterSpacing: `${2.5 * s}px`,
              marginBottom: `${8 * s}px`,
            }}>
              {t('toWin')}
            </p>

            {/* Prize — hero text */}
            <p className="text-white" style={{
              fontSize: `${24 * s}px`, fontWeight: 800,
              fontFamily: 'var(--font-display), Georgia, serif',
              fontStyle: 'italic',
              lineHeight: 1.15,
              textShadow: `0 ${1 * s}px ${4 * s}px rgba(0,0,0,0.2)`,
              marginBottom: `${16 * s}px`,
            }}>
              {prizeDescription}
            </p>

            {/* Gold divider */}
            <div style={{
              width: `${50 * s}px`, height: `${1.5 * s}px`,
              background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.5), transparent)',
              margin: `0 auto ${14 * s}px`,
            }} />

            {/* How to participate */}
            <p style={{
              fontSize: `${11 * s}px`, fontWeight: 500,
              color: 'rgba(255,255,255,0.75)',
              lineHeight: 1.5,
              marginBottom: `${12 * s}px`,
            }}>
              {t('howTo')}
            </p>

            {/* Date range — prominent */}
            <div style={{
              padding: `${6 * s}px ${16 * s}px`,
              borderRadius: `${10 * s}px`,
              background: 'rgba(255,215,0,0.12)',
              border: `${1 * s}px solid rgba(255,215,0,0.25)`,
              display: 'inline-block',
            }}>
              <p style={{
                fontSize: `${11 * s}px`, fontWeight: 700,
                color: 'rgba(255,215,0,0.9)',
                letterSpacing: `${0.5 * s}px`,
              }}>
                {dateRange}
              </p>
            </div>
          </div>

          {/* CTA button style */}
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

ContestAnnouncementStory.displayName = 'ContestAnnouncementStory';

export default ContestAnnouncementStory;
