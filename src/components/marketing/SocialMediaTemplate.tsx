'use client';

import { forwardRef } from 'react';
import { useTranslations } from 'next-intl';

interface SocialMediaTemplateProps {
  shopName: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  rewardDescription: string;
  stampsRequired: number;
  scale?: number;
  // Tier 2
  tier2Enabled?: boolean;
  tier2StampsRequired?: number | null;
  tier2RewardDescription?: string | null;
  // Cagnotte
  loyaltyMode?: 'visit' | 'cagnotte';
  cagnottePercent?: number | null;
  cagnotteTier2Percent?: number | null;
}

export const SocialMediaTemplate = forwardRef<HTMLDivElement, SocialMediaTemplateProps>(
  (
    {
      shopName,
      primaryColor,
      secondaryColor,
      logoUrl,
      rewardDescription,
      stampsRequired,
      scale = 1,
      tier2Enabled = false,
      tier2StampsRequired,
      tier2RewardDescription,
      loyaltyMode = 'visit',
      cagnottePercent,
      cagnotteTier2Percent,
    },
    ref
  ) => {
    const t = useTranslations('socialMediaTemplate');

    const width = 400 * scale;
    const height = 500 * scale;
    const s = scale; // shorthand
    const isCagnotte = loyaltyMode === 'cagnotte';
    const hasTwoTiers = tier2Enabled && tier2StampsRequired && (tier2RewardDescription || (isCagnotte && cagnotteTier2Percent));
    const displayReward = isCagnotte ? t('cagnotteReward', { percent: Number(cagnottePercent || 0) }) : rewardDescription;
    const displayTier2Reward = isCagnotte ? t('cagnotteReward', { percent: Number(cagnotteTier2Percent || 0) }) : tier2RewardDescription;

    // Show up to 8 stamps for visual, fill some
    const stampsToShow = Math.min(stampsRequired, 8);
    const filledStamps = Math.max(Math.floor(stampsToShow * 0.6), 1);

    return (
      <div
        ref={ref}
        className="relative overflow-hidden"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: `linear-gradient(145deg, ${primaryColor} 0%, ${secondaryColor} 50%, ${primaryColor} 100%)`,
          clipPath: 'inset(0px)',
        }}
      >

        {/* Decorative circles */}
        <div style={{
          position: 'absolute', width: `${140 * s}px`, height: `${140 * s}px`,
          top: `${-40 * s}px`, right: `${-40 * s}px`, borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
        }} />
        <div style={{
          position: 'absolute', width: `${100 * s}px`, height: `${100 * s}px`,
          bottom: `${60 * s}px`, left: `${-30 * s}px`, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
        }} />
        <div style={{
          position: 'absolute', width: `${60 * s}px`, height: `${60 * s}px`,
          top: `${180 * s}px`, right: `${-15 * s}px`, borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
        }} />

        {/* Sparkle decorations */}
        {[
          { top: 35, left: 30, size: 4 },
          { top: 90, right: 35, size: 3 },
          { top: 380, left: 45, size: 3.5 },
          { top: 450, right: 50, size: 2.5 },
          { top: 240, left: 20, size: 2 },
        ].map((spark, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: `${spark.top * s}px`,
              ...(spark.left !== undefined ? { left: `${spark.left * s}px` } : {}),
              ...(spark.right !== undefined ? { right: `${spark.right * s}px` } : {}),
              width: `${spark.size * s}px`,
              height: `${spark.size * s}px`,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.5)',
            }}
          />
        ))}

        {/* Content */}
        <div
          className="relative flex flex-col items-center justify-between h-full"
          style={{ padding: `${32 * s}px ${28 * s}px ${20 * s}px` }}
        >

          {/* ===== TOP: Shop Name ===== */}
          <div className="flex flex-col items-center text-center" style={{ marginBottom: `${20 * s}px` }}>
            <h1 className="text-white leading-none"
              style={{
                fontSize: `${30 * s}px`, maxWidth: `${300 * s}px`,
                fontFamily: 'var(--font-display), Georgia, serif',
                fontWeight: 700, fontStyle: 'italic',
              }}>
              {shopName}
            </h1>
          </div>

          {/* ===== CENTER: Frosted card with stamps + reward ===== */}
          <div style={{
            width: '100%',
            padding: `${20 * s}px`,
            borderRadius: `${20 * s}px`,
            background: 'rgba(255,255,255,0.18)',
            border: `${1 * s}px solid rgba(255,255,255,0.3)`,
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          }}>

            {/* Stamps row */}
            <div className="flex items-center justify-center"
              style={{ gap: `${6 * s}px`, marginBottom: `${16 * s}px` }}>
              {Array.from({ length: stampsToShow }).map((_, i) => (
                <div key={i} style={{
                  width: `${28 * s}px`, height: `${28 * s}px`, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  ...(i < filledStamps
                    ? {
                        background: 'rgba(255,255,255,0.95)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      }
                    : {
                        border: `${2 * s}px dashed rgba(255,255,255,0.4)`,
                      }
                  ),
                }}>
                  {i < filledStamps && (
                    <svg width={`${14 * s}px`} height={`${14 * s}px`} viewBox="0 0 24 24"
                      fill="none" stroke={primaryColor} strokeWidth="3"
                      strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              ))}
            </div>

            {/* Label */}
            <p className="text-center" style={{
              fontSize: `${9 * s}px`, color: 'rgba(255,255,255,0.6)',
              fontWeight: 700, letterSpacing: `${1.5 * s}px`,
              textTransform: 'uppercase' as const,
              marginBottom: `${12 * s}px`,
            }}>
              {t('loyaltyProgram')}
            </p>

            {/* Divider */}
            <div style={{
              width: `${40 * s}px`, height: `${1 * s}px`, margin: `0 auto ${14 * s}px`,
              background: 'rgba(255,255,255,0.25)',
            }} />

            {hasTwoTiers ? (
              /* Two-tier rewards */
              <div className="flex" style={{ gap: `${8 * s}px` }}>
                {/* Tier 1 */}
                <div className="flex-1 text-center" style={{
                  padding: `${12 * s}px ${8 * s}px`,
                  borderRadius: `${14 * s}px`,
                  background: 'rgba(255,255,255,0.9)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                }}>
                  <span style={{
                    fontSize: `${7 * s}px`, fontWeight: 800, textTransform: 'uppercase' as const,
                    letterSpacing: `${1 * s}px`, color: primaryColor,
                  }}>
                    {t('tier1')}
                  </span>
                  <p style={{
                    fontSize: `${13 * s}px`, fontWeight: 900, color: '#1a1a2e',
                    lineHeight: 1.2, margin: `${4 * s}px 0`,
                  }}>
                    {displayReward}
                  </p>
                  <p style={{ fontSize: `${9 * s}px`, fontWeight: 700, color: primaryColor }}>
                    {t('visits', { count: stampsRequired })}
                  </p>
                </div>

                {/* Tier 2 */}
                <div className="flex-1 text-center" style={{
                  padding: `${12 * s}px ${8 * s}px`,
                  borderRadius: `${14 * s}px`,
                  background: 'rgba(255,255,255,0.9)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  border: `${2 * s}px solid #f59e0b`,
                }}>
                  <span style={{
                    fontSize: `${7 * s}px`, fontWeight: 800, textTransform: 'uppercase' as const,
                    letterSpacing: `${1 * s}px`, color: '#f59e0b',
                  }}>
                    {t('tier2')} &#11088;
                  </span>
                  <p style={{
                    fontSize: `${13 * s}px`, fontWeight: 900, color: '#1a1a2e',
                    lineHeight: 1.2, margin: `${4 * s}px 0`,
                  }}>
                    {displayTier2Reward}
                  </p>
                  <p style={{ fontSize: `${9 * s}px`, fontWeight: 700, color: '#f59e0b' }}>
                    {t('visits', { count: tier2StampsRequired! })}
                  </p>
                </div>
              </div>
            ) : (
              /* Single reward — big text */
              <div className="text-center" style={{
                padding: `${14 * s}px`,
                borderRadius: `${16 * s}px`,
                background: 'rgba(255,255,255,0.9)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              }}>
                <p style={{
                  fontSize: `${20 * s}px`, fontWeight: 900, color: '#1a1a2e',
                  lineHeight: 1.2, maxWidth: `${260 * s}px`, margin: '0 auto',
                }}>
                  {displayReward}
                </p>
                <p style={{
                  fontSize: `${11 * s}px`, fontWeight: 700, color: primaryColor,
                  marginTop: `${6 * s}px`,
                }}>
                  {t('after', { visits: t('visits', { count: stampsRequired }) })}
                </p>
              </div>
            )}
          </div>

          {/* ===== CTA text — sits just below the card ===== */}
          <div className="text-center" style={{ marginTop: `${14 * s}px` }}>
            <p className="text-white font-bold" style={{
              fontSize: `${14 * s}px`, letterSpacing: `${0.3 * s}px`,
            }}>
              {t('ctaLine1')}
            </p>
            <p style={{
              fontSize: `${11 * s}px`, fontWeight: 500,
              color: 'rgba(255,255,255,0.7)', marginTop: `${3 * s}px`,
            }}>
              {t('ctaLine2')}
            </p>
          </div>

          {/* ===== Qarte branding — stays at bottom ===== */}
          <span style={{
            display: 'inline-block',
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
    );
  }
);

SocialMediaTemplate.displayName = 'SocialMediaTemplate';

export default SocialMediaTemplate;
