import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

const Stamp: React.FC<{
  filled: boolean;
  index: number;
  frame: number;
  fps: number;
}> = ({ filled, index, frame, fps }) => {
  const stampSpring = spring({
    frame: frame - 20 - index * 3,
    fps,
    config: { damping: 10, stiffness: 150 },
  });

  return (
    <div
      style={{
        width: 80,
        height: 80,
        borderRadius: 20,
        background: filled
          ? "linear-gradient(135deg, #4f46e5, #7c3aed)"
          : "rgba(229,231,235,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        transform: `scale(${stampSpring})`,
        opacity: stampSpring,
        border: filled
          ? "none"
          : "2px dashed rgba(156,163,175,0.5)",
      }}
    >
      {filled && (
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <path
            d="M20 6L9 17L4 12"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
};

export const LoyaltyScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entry
  const enterOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Badge
  const badgeSlide = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  // Title
  const titleSpring = spring({
    frame: frame - 6,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  // Card
  const cardSlide = spring({
    frame: frame - 12,
    fps,
    config: { damping: 14, stiffness: 80 },
  });

  // Auto badge
  const autoBadge = spring({
    frame: frame - 50,
    fps,
    config: { damping: 10, stiffness: 150 },
  });

  // Exit
  const exitOpacity = interpolate(frame, [75, 90], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const stamps = [true, true, true, true, true, true, true, false, false, false];

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(180deg, #fdf2f8 0%, #fce7f3 50%, #f5f3ff 100%)",
        justifyContent: "center",
        alignItems: "center",
        opacity: enterOpacity * exitOpacity,
      }}
    >
      {/* Badge */}
      <div
        style={{
          position: "absolute",
          top: 180,
          transform: `translateX(${(1 - badgeSlide) * -200}px)`,
          opacity: badgeSlide,
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #f43f5e, #ec4899)",
            borderRadius: 50,
            padding: "14px 40px",
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: 28,
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          Programme fidélité
        </div>
      </div>

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 280,
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: 64,
          fontWeight: 800,
          color: "#111827",
          textAlign: "center",
          lineHeight: 1.2,
          padding: "0 60px",
          transform: `scale(${titleSpring})`,
          opacity: titleSpring,
        }}
      >
        Carte de fidelite{"\n"}
        <span
          style={{
            background: "linear-gradient(135deg, #f43f5e, #ec4899)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          automatique
        </span>
      </div>

      {/* Loyalty card mockup */}
      <div
        style={{
          position: "absolute",
          top: 520,
          width: 860,
          transform: `translateY(${(1 - cardSlide) * 300}px)`,
          opacity: cardSlide,
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
            borderRadius: 36,
            padding: 48,
            boxShadow: "0 12px 48px rgba(79,70,229,0.3)",
          }}
        >
          {/* Card header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 40,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontSize: 36,
                  fontWeight: 800,
                  color: "#ffffff",
                }}
              >
                Studio Beaute
              </div>
              <div
                style={{
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontSize: 24,
                  color: "rgba(255,255,255,0.7)",
                  marginTop: 4,
                }}
              >
                7 / 10 tampons
              </div>
            </div>
            {/* Qarte logo mark */}
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: 36,
                fontWeight: 900,
                color: "#ffffff",
              }}
            >
              Q
            </div>
          </div>

          {/* Stamps grid */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              justifyContent: "center",
            }}
          >
            {stamps.map((filled, i) => (
              <Stamp
                key={i}
                filled={filled}
                index={i}
                frame={frame}
                fps={fps}
              />
            ))}
          </div>

          {/* Reward text */}
          <div
            style={{
              marginTop: 32,
              textAlign: "center",
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: 26,
              color: "rgba(255,255,255,0.8)",
            }}
          >
            Recompense : Brushing offert
          </div>
        </div>
      </div>

      {/* Auto badge */}
      <div
        style={{
          position: "absolute",
          bottom: 240,
          transform: `scale(${autoBadge})`,
          opacity: autoBadge,
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderRadius: 50,
            padding: "18px 44px",
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: 30,
            fontWeight: 700,
            color: "#111827",
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
            border: "1px solid rgba(255,255,255,0.6)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ color: "#10b981", fontSize: 36 }}>&#10003;</span>
          Reservation = carte fidelite
        </div>
      </div>
    </AbsoluteFill>
  );
};
