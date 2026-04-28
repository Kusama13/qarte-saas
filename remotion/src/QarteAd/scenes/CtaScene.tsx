import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

export const CtaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Background gradient animation
  const bgShift = interpolate(frame, [0, 60], [0, 20]);

  // Logo entrance
  const logoScale = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 120 },
  });

  // Tagline
  const taglineSpring = spring({
    frame: frame - 8,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  // CTA button
  const ctaSpring = spring({
    frame: frame - 16,
    fps,
    config: { damping: 10, stiffness: 130 },
  });

  // URL
  const urlSpring = spring({
    frame: frame - 22,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  // Stats badges
  const stat1 = spring({
    frame: frame - 28,
    fps,
    config: { damping: 10, stiffness: 120 },
  });
  const stat2 = spring({
    frame: frame - 34,
    fps,
    config: { damping: 10, stiffness: 120 },
  });

  // Pulse animation on CTA
  const ctaPulse = interpolate(
    Math.sin(frame * 0.3),
    [-1, 1],
    [0.97, 1.03]
  );

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${135 + bgShift}deg, #4f46e5 0%, #7c3aed 40%, #a855f7 70%, #ec4899 100%)`,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Radial glow */}
      <div
        style={{
          position: "absolute",
          top: "40%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)",
        }}
      />

      {/* Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 48,
          zIndex: 1,
        }}
      >
        {/* Qarte Logo */}
        <div
          style={{
            transform: `scale(${logoScale})`,
            opacity: logoScale,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
          }}
        >
          {/* Logo mark */}
          <div
            style={{
              width: 140,
              height: 140,
              borderRadius: 36,
              background: "rgba(255,255,255,0.2)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "2px solid rgba(255,255,255,0.3)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: 80,
              fontWeight: 900,
              color: "#ffffff",
            }}
          >
            Q
          </div>

          {/* Logo text */}
          <div
            style={{
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: 96,
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: 4,
            }}
          >
            Qarte
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: 42,
            fontWeight: 600,
            color: "rgba(255,255,255,0.9)",
            textAlign: "center",
            lineHeight: 1.3,
            padding: "0 80px",
            transform: `translateY(${(1 - taglineSpring) * 30}px)`,
            opacity: taglineSpring,
          }}
        >
          Reservation + Fidelite + Vitrine
          {"\n"}pour ton salon
        </div>

        {/* CTA Button */}
        <div
          style={{
            transform: `scale(${ctaSpring * ctaPulse})`,
            opacity: ctaSpring,
          }}
        >
          <div
            style={{
              borderRadius: 60,
              padding: "28px 72px",
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: 42,
              fontWeight: 800,
              background: "linear-gradient(135deg, #ffffff, #f9fafb)",
              color: "#4f46e5",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            }}
          >
            Essai gratuit 7 jours
          </div>
        </div>

        {/* URL */}
        <div
          style={{
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: 36,
            fontWeight: 700,
            color: "rgba(255,255,255,0.95)",
            letterSpacing: 2,
            transform: `translateY(${(1 - urlSpring) * 20}px)`,
            opacity: urlSpring,
          }}
        >
          getqarte.com
        </div>

        {/* Stats */}
        <div
          style={{
            display: "flex",
            gap: 32,
            marginTop: 16,
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              borderRadius: 20,
              padding: "18px 36px",
              border: "1px solid rgba(255,255,255,0.2)",
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: 26,
              fontWeight: 600,
              color: "#ffffff",
              transform: `scale(${stat1})`,
              opacity: stat1,
            }}
          >
            800+ salons
          </div>
          <div
            style={{
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              borderRadius: 20,
              padding: "18px 36px",
              border: "1px solid rgba(255,255,255,0.2)",
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: 26,
              fontWeight: 600,
              color: "#ffffff",
              transform: `scale(${stat2})`,
              opacity: stat2,
            }}
          >
            24 EUR/mois
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
