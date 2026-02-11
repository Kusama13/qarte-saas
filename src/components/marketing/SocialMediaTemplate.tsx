'use client';

import { forwardRef } from 'react';
import { Gift, Sparkles } from 'lucide-react';

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
    },
    ref
  ) => {
    // 4:5 ratio (Instagram portrait)
    const width = 400 * scale;
    const height = 500 * scale;
    const hasTwoTiers = tier2Enabled && tier2StampsRequired && tier2RewardDescription;

    const getStampsText = (stamps: number) => {
      return `${stamps} passage${stamps > 1 ? 's' : ''}`;
    };

    return (
      <div
        ref={ref}
        className="relative overflow-hidden"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Background Gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
          }}
        />

        {/* Decorative Elements */}
        <div
          className="absolute rounded-full opacity-20"
          style={{
            width: `${120 * scale}px`,
            height: `${120 * scale}px`,
            top: `${-30 * scale}px`,
            right: `${-30 * scale}px`,
            backgroundColor: 'white',
          }}
        />
        <div
          className="absolute rounded-full opacity-10"
          style={{
            width: `${80 * scale}px`,
            height: `${80 * scale}px`,
            bottom: `${80 * scale}px`,
            left: `${-20 * scale}px`,
            backgroundColor: 'white',
          }}
        />
        <div
          className="absolute rounded-full opacity-15"
          style={{
            width: `${50 * scale}px`,
            height: `${50 * scale}px`,
            top: `${200 * scale}px`,
            right: `${-10 * scale}px`,
            backgroundColor: 'white',
          }}
        />

        {/* Content Container */}
        <div
          className="relative flex flex-col items-center justify-between h-full"
          style={{ padding: `${28 * scale}px ${24 * scale}px` }}
        >
          {/* Top: Logo & Shop Name */}
          <div className="flex flex-col items-center text-center">
            {logoUrl ? (
              <div
                className="rounded-full overflow-hidden border-4 border-white/30 shadow-lg"
                style={{
                  width: `${64 * scale}px`,
                  height: `${64 * scale}px`,
                  marginBottom: `${10 * scale}px`,
                }}
              >
                <img
                  src={logoUrl}
                  alt={shopName}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
              </div>
            ) : (
              <div
                className="rounded-full flex items-center justify-center border-4 border-white/30 shadow-lg"
                style={{
                  width: `${64 * scale}px`,
                  height: `${64 * scale}px`,
                  marginBottom: `${10 * scale}px`,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                }}
              >
                <span
                  className="text-white font-black"
                  style={{ fontSize: `${28 * scale}px` }}
                >
                  {shopName[0]?.toUpperCase()}
                </span>
              </div>
            )}
            <h1
              className="text-white font-black tracking-tight leading-tight"
              style={{
                fontSize: `${22 * scale}px`,
                maxWidth: `${280 * scale}px`,
              }}
            >
              {shopName}
            </h1>
            <p
              className="text-white/70 font-medium uppercase tracking-widest"
              style={{
                fontSize: `${8 * scale}px`,
                marginTop: `${6 * scale}px`,
              }}
            >
              Programme de fidélité
            </p>
          </div>

          {/* Center: Reward Card */}
          <div
            className="w-full text-center"
            style={{
              padding: `${(hasTwoTiers ? 14 : 20) * scale}px ${(hasTwoTiers ? 14 : 20) * scale}px`,
              borderRadius: `${20 * scale}px`,
              backgroundColor: 'rgba(255,255,255,0.95)',
              boxShadow: '0 15px 40px -10px rgba(0,0,0,0.2)',
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Gift
                style={{
                  width: `${(hasTwoTiers ? 16 : 20) * scale}px`,
                  height: `${(hasTwoTiers ? 16 : 20) * scale}px`,
                  color: primaryColor,
                }}
              />
              <span
                className="font-bold uppercase tracking-wider"
                style={{ fontSize: `${(hasTwoTiers ? 9 : 10) * scale}px`, color: primaryColor }}
              >
                {hasTwoTiers ? 'Vos récompenses' : 'Votre récompense'}
              </span>
            </div>

            {hasTwoTiers ? (
              <div className="flex gap-2" style={{ gap: `${8 * scale}px` }}>
                {/* Tier 1 */}
                <div
                  className="flex-1 text-center"
                  style={{
                    padding: `${10 * scale}px ${8 * scale}px`,
                    borderRadius: `${12 * scale}px`,
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    border: `2px solid ${primaryColor}`,
                  }}
                >
                  <span
                    className="font-bold uppercase tracking-wide"
                    style={{ fontSize: `${7 * scale}px`, color: primaryColor }}
                  >
                    Palier 1
                  </span>
                  <p
                    className="font-black leading-tight"
                    style={{
                      fontSize: `${12 * scale}px`,
                      color: '#1a1a2e',
                      marginTop: `${4 * scale}px`,
                      marginBottom: `${4 * scale}px`,
                    }}
                  >
                    {rewardDescription}
                  </p>
                  <p
                    className="font-bold"
                    style={{ fontSize: `${9 * scale}px`, color: primaryColor }}
                  >
                    {getStampsText(stampsRequired)}
                  </p>
                </div>

                {/* Tier 2 */}
                <div
                  className="flex-1 text-center"
                  style={{
                    padding: `${10 * scale}px ${8 * scale}px`,
                    borderRadius: `${12 * scale}px`,
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    border: `2px solid #f59e0b`,
                  }}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span
                      className="font-bold uppercase tracking-wide"
                      style={{ fontSize: `${7 * scale}px`, color: '#f59e0b' }}
                    >
                      Palier 2
                    </span>
                    <span style={{ fontSize: `${8 * scale}px` }}>⭐</span>
                  </div>
                  <p
                    className="font-black leading-tight"
                    style={{
                      fontSize: `${12 * scale}px`,
                      color: '#1a1a2e',
                      marginTop: `${4 * scale}px`,
                      marginBottom: `${4 * scale}px`,
                    }}
                  >
                    {tier2RewardDescription}
                  </p>
                  <p
                    className="font-bold"
                    style={{ fontSize: `${9 * scale}px`, color: '#f59e0b' }}
                  >
                    {getStampsText(tier2StampsRequired!)}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <p
                  className="font-black leading-tight"
                  style={{
                    fontSize: `${18 * scale}px`,
                    color: '#1a1a2e',
                    maxWidth: `${280 * scale}px`,
                    margin: '0 auto',
                  }}
                >
                  {rewardDescription}
                </p>
                <p
                  className="font-bold mt-2"
                  style={{
                    fontSize: `${12 * scale}px`,
                    color: primaryColor,
                  }}
                >
                  Après {getStampsText(stampsRequired)}
                </p>
              </>
            )}
          </div>

          {/* Bottom: CTA Message */}
          <div className="flex flex-col items-center">
            <div
              className="relative text-center"
              style={{
                padding: `${14 * scale}px ${20 * scale}px`,
                borderRadius: `${16 * scale}px`,
                backgroundColor: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.3)',
              }}
            >
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Sparkles
                  style={{
                    width: `${14 * scale}px`,
                    height: `${14 * scale}px`,
                    color: 'white',
                  }}
                />
                <span
                  className="text-white font-bold"
                  style={{ fontSize: `${11 * scale}px` }}
                >
                  Comment ça marche ?
                </span>
              </div>
              <p
                className="text-white/90 font-medium leading-snug"
                style={{
                  fontSize: `${10 * scale}px`,
                  maxWidth: `${260 * scale}px`,
                }}
              >
                Lors de votre prochain rendez-vous,
                <br />
                demandez à scanner le QR code en caisse !
              </p>
            </div>

            {/* Qarte Branding */}
            <div
              className="flex items-center justify-center mt-3"
              style={{
                padding: `${3 * scale}px ${10 * scale}px`,
                borderRadius: `${20 * scale}px`,
                backgroundColor: 'rgba(255,255,255,0.9)',
              }}
            >
              <span
                className="font-medium"
                style={{ fontSize: `${8 * scale}px`, color: '#9ca3af' }}
              >
                Propulsé par&nbsp;
              </span>
              <span
                className="font-black"
                style={{ fontSize: `${10 * scale}px`, color: '#4b5563' }}
              >
                getqarte.com
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

SocialMediaTemplate.displayName = 'SocialMediaTemplate';

export default SocialMediaTemplate;
