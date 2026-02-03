'use client';

import { forwardRef } from 'react';
import { Gift, Smartphone } from 'lucide-react';

interface FlyerTemplateProps {
  shopName: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  qrCodeUrl: string;
  rewardDescription: string;
  stampsRequired: number;
  scale?: number;
  // Tier 2
  tier2Enabled?: boolean;
  tier2StampsRequired?: number | null;
  tier2RewardDescription?: string | null;
}

export const FlyerTemplate = forwardRef<HTMLDivElement, FlyerTemplateProps>(
  (
    {
      shopName,
      primaryColor,
      secondaryColor,
      logoUrl,
      qrCodeUrl,
      rewardDescription,
      stampsRequired,
      scale = 1,
      tier2Enabled = false,
      tier2StampsRequired,
      tier2RewardDescription,
    },
    ref
  ) => {
    const width = 397 * scale;
    const height = 559 * scale;
    const hasTwoTiers = tier2Enabled && tier2StampsRequired && tier2RewardDescription;

    // Get the appropriate text for stamps
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
            bottom: `${60 * scale}px`,
            left: `${-20 * scale}px`,
            backgroundColor: 'white',
          }}
        />

        {/* Angled Banner - Top Right */}
        <div
          className="absolute flex items-center justify-center"
          style={{
            top: `${28 * scale}px`,
            right: `${-45 * scale}px`,
            width: `${180 * scale}px`,
            height: `${28 * scale}px`,
            backgroundColor: 'rgba(255,255,255,0.95)',
            transform: 'rotate(45deg)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
          }}
        >
          <span
            className="font-bold text-center"
            style={{
              fontSize: `${8 * scale}px`,
              color: primaryColor,
              letterSpacing: '0.02em',
            }}
          >
            Carte en 15s !
          </span>
        </div>

        {/* Content Container */}
        <div className="relative flex flex-col items-center justify-between h-full" style={{ padding: `${24 * scale}px` }}>
          {/* Top Section: Logo & Shop Name */}
          <div className="flex flex-col items-center text-center">
            {logoUrl ? (
              <div
                className="rounded-full overflow-hidden border-4 border-white/30 shadow-lg"
                style={{
                  width: `${56 * scale}px`,
                  height: `${56 * scale}px`,
                  marginBottom: `${10 * scale}px`,
                }}
              >
                <img
                  src={logoUrl}
                  alt={shopName}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div
                className="rounded-full flex items-center justify-center border-4 border-white/30 shadow-lg"
                style={{
                  width: `${56 * scale}px`,
                  height: `${56 * scale}px`,
                  marginBottom: `${10 * scale}px`,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                }}
              >
                <span
                  className="text-white font-black"
                  style={{ fontSize: `${24 * scale}px` }}
                >
                  {shopName[0]?.toUpperCase()}
                </span>
              </div>
            )}
            <h1
              className="text-white font-black tracking-tight leading-tight"
              style={{
                fontSize: `${20 * scale}px`,
                maxWidth: `${260 * scale}px`,
              }}
            >
              {shopName}
            </h1>
          </div>

          {/* REWARD SECTION */}
          <div
            className="w-full text-center"
            style={{
              padding: `${(hasTwoTiers ? 12 : 16) * scale}px ${(hasTwoTiers ? 12 : 18) * scale}px`,
              borderRadius: `${18 * scale}px`,
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
              /* TWO TIERS - Side by side */
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
              /* SINGLE TIER */
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

          {/* QR Code Card - Now BELOW reward */}
          <div
            className="relative"
            style={{
              padding: `${16 * scale}px`,
              borderRadius: `${18 * scale}px`,
              backgroundColor: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.3)',
            }}
          >
            {/* QR Code */}
            <img
              src={qrCodeUrl}
              alt="QR Code"
              style={{
                width: `${140 * scale}px`,
                height: `${140 * scale}px`,
                borderRadius: `${8 * scale}px`,
              }}
            />

            {/* Scan Instructions */}
            <div
              className="flex items-center justify-center gap-1 mt-3"
              style={{
                padding: `${8 * scale}px ${14 * scale}px`,
                borderRadius: `${10 * scale}px`,
                backgroundColor: 'rgba(255,255,255,0.9)',
              }}
            >
              <Smartphone
                style={{
                  width: `${14 * scale}px`,
                  height: `${14 * scale}px`,
                  color: primaryColor,
                }}
              />
              <span
                className="font-bold"
                style={{
                  fontSize: `${11 * scale}px`,
                  color: primaryColor,
                }}
              >
                Scannez-moi !
              </span>
            </div>
          </div>

          {/* Qarte Branding - Updated */}
          <div
            className="flex items-center justify-center gap-1"
            style={{ opacity: 0.8 }}
          >
            <span
              className="text-white font-medium"
              style={{ fontSize: `${8 * scale}px` }}
            >
              Propulsé par
            </span>
            <span
              className="text-white font-black"
              style={{ fontSize: `${10 * scale}px` }}
            >
              Qarte
            </span>
            <span
              className="text-white"
              style={{ fontSize: `${9 * scale}px` }}
            >
              avec
            </span>
            <span style={{ fontSize: `${9 * scale}px` }}>❤️</span>
            <span
              className="text-white font-medium"
              style={{ fontSize: `${8 * scale}px` }}
            >
              en France
            </span>
          </div>
        </div>
      </div>
    );
  }
);

FlyerTemplate.displayName = 'FlyerTemplate';

export default FlyerTemplate;
