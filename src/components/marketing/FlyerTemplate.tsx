'use client';

import { forwardRef } from 'react';
import { Gift, Smartphone, QrCode } from 'lucide-react';

interface FlyerTemplateProps {
  shopName: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  qrCodeUrl: string;
  rewardDescription: string;
  stampsRequired: number;
  scale?: number;
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
    },
    ref
  ) => {
    // A6 dimensions in pixels at 96 DPI (approximately)
    // A6 = 105mm x 148mm = ~397px x 559px at 96 DPI
    // We'll use a scale factor for the preview
    const width = 397 * scale;
    const height = 559 * scale;

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

        {/* Content Container */}
        <div className="relative flex flex-col items-center justify-between h-full" style={{ padding: `${24 * scale}px` }}>
          {/* Top Section: Logo & Shop Name */}
          <div className="flex flex-col items-center text-center">
            {logoUrl ? (
              <div
                className="rounded-full overflow-hidden border-4 border-white/30 shadow-lg"
                style={{
                  width: `${64 * scale}px`,
                  height: `${64 * scale}px`,
                  marginBottom: `${12 * scale}px`,
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
                  width: `${64 * scale}px`,
                  height: `${64 * scale}px`,
                  marginBottom: `${12 * scale}px`,
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
              className="text-white/80 font-medium mt-1"
              style={{ fontSize: `${11 * scale}px` }}
            >
              Programme de fidélité
            </p>
          </div>

          {/* QR Code Card - Glassmorphism Style */}
          <div
            className="relative"
            style={{
              padding: `${20 * scale}px`,
              borderRadius: `${20 * scale}px`,
              backgroundColor: 'rgba(255,255,255,0.95)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            }}
          >
            {/* QR Icon Badge */}
            <div
              className="absolute flex items-center justify-center"
              style={{
                top: `${-12 * scale}px`,
                left: '50%',
                transform: 'translateX(-50%)',
                width: `${32 * scale}px`,
                height: `${32 * scale}px`,
                borderRadius: `${10 * scale}px`,
                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
              <QrCode
                className="text-white"
                style={{
                  width: `${18 * scale}px`,
                  height: `${18 * scale}px`,
                }}
              />
            </div>

            {/* QR Code */}
            <img
              src={qrCodeUrl}
              alt="QR Code"
              style={{
                width: `${160 * scale}px`,
                height: `${160 * scale}px`,
              }}
            />

            {/* Scan Instructions */}
            <div
              className="flex items-center justify-center gap-1 mt-3"
              style={{
                padding: `${8 * scale}px ${16 * scale}px`,
                borderRadius: `${12 * scale}px`,
                backgroundColor: `${primaryColor}10`,
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

          {/* Bottom Section: Reward Info */}
          <div className="w-full">
            {/* Reward Badge */}
            <div
              className="w-full text-center"
              style={{
                padding: `${14 * scale}px ${16 * scale}px`,
                borderRadius: `${16 * scale}px`,
                backgroundColor: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.3)',
              }}
            >
              <div
                className="flex items-center justify-center gap-2 mb-1"
              >
                <Gift
                  className="text-white"
                  style={{
                    width: `${16 * scale}px`,
                    height: `${16 * scale}px`,
                  }}
                />
                <span
                  className="text-white font-bold uppercase tracking-wider"
                  style={{ fontSize: `${9 * scale}px` }}
                >
                  Votre récompense
                </span>
              </div>
              <p
                className="text-white font-black leading-tight"
                style={{
                  fontSize: `${15 * scale}px`,
                  maxWidth: `${280 * scale}px`,
                  margin: '0 auto',
                }}
              >
                {rewardDescription}
              </p>
              <p
                className="text-white/70 font-medium mt-1"
                style={{ fontSize: `${10 * scale}px` }}
              >
                Après {stampsRequired} passages
              </p>
            </div>

            {/* Qarte Branding */}
            <div
              className="flex items-center justify-center gap-1 mt-3"
              style={{ opacity: 0.6 }}
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
                QARTE
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

FlyerTemplate.displayName = 'FlyerTemplate';

export default FlyerTemplate;
