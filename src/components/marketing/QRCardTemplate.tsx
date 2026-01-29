'use client';

import { forwardRef } from 'react';
import { Smartphone } from 'lucide-react';

interface QRCardTemplateProps {
  businessName: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  qrCodeUrl: string;
  menuUrl: string;
  scale?: number;
}

export const QRCardTemplate = forwardRef<HTMLDivElement, QRCardTemplateProps>(
  (
    {
      businessName,
      primaryColor,
      secondaryColor,
      logoUrl,
      qrCodeUrl,
      menuUrl,
      scale = 1,
    },
    ref
  ) => {
    const width = 350 * scale;
    const height = 450 * scale;

    // Truncate URL for display
    const displayUrl = menuUrl.length > 35
      ? menuUrl.substring(0, 35) + '...'
      : menuUrl;

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
            width: `${100 * scale}px`,
            height: `${100 * scale}px`,
            top: `${-25 * scale}px`,
            right: `${-25 * scale}px`,
            backgroundColor: 'white',
          }}
        />
        <div
          className="absolute rounded-full opacity-10"
          style={{
            width: `${60 * scale}px`,
            height: `${60 * scale}px`,
            bottom: `${40 * scale}px`,
            left: `${-15 * scale}px`,
            backgroundColor: 'white',
          }}
        />

        {/* Content Container */}
        <div
          className="relative flex flex-col items-center justify-between h-full"
          style={{ padding: `${24 * scale}px` }}
        >
          {/* Top Section: Logo & Business Name */}
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
                  alt={businessName}
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
                  {businessName[0]?.toUpperCase() || 'Q'}
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
              {businessName || 'Mon Restaurant'}
            </h1>
          </div>

          {/* Menu Title */}
          <div
            className="w-full text-center"
            style={{
              padding: `${12 * scale}px ${16 * scale}px`,
              borderRadius: `${14 * scale}px`,
              backgroundColor: 'rgba(255,255,255,0.95)',
              boxShadow: '0 10px 30px -10px rgba(0,0,0,0.2)',
            }}
          >
            <span
              className="font-bold uppercase tracking-wider"
              style={{ fontSize: `${11 * scale}px`, color: primaryColor }}
            >
              Notre Menu
            </span>
            <p
              className="font-medium"
              style={{
                fontSize: `${10 * scale}px`,
                color: '#666',
                marginTop: `${4 * scale}px`,
              }}
            >
              Scannez pour decouvrir
            </p>
          </div>

          {/* QR Code Card */}
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
            <img
              src={qrCodeUrl}
              alt="QR Code Menu"
              style={{
                width: `${160 * scale}px`,
                height: `${160 * scale}px`,
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

          {/* URL Display */}
          <div
            style={{
              padding: `${6 * scale}px ${12 * scale}px`,
              borderRadius: `${8 * scale}px`,
              backgroundColor: 'rgba(255,255,255,0.15)',
            }}
          >
            <span
              className="font-medium"
              style={{
                fontSize: `${9 * scale}px`,
                color: 'rgba(255,255,255,0.9)',
              }}
            >
              {displayUrl}
            </span>
          </div>
        </div>
      </div>
    );
  }
);

QRCardTemplate.displayName = 'QRCardTemplate';

export default QRCardTemplate;
