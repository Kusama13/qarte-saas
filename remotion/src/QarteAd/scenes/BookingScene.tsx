import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

const GlassCard: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <div
    style={{
      background: "rgba(255, 255, 255, 0.80)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderRadius: 32,
      border: "1px solid rgba(255,255,255,0.6)",
      boxShadow:
        "0 8px 40px rgba(79,70,229,0.12), 0 2px 8px rgba(0,0,0,0.04)",
      ...style,
    }}
  >
    {children}
  </div>
);

export const BookingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entry animation
  const enterOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Badge "Pilier 1" slide in
  const badgeSlide = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  // Title entrance
  const titleSpring = spring({
    frame: frame - 8,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  // Card slide up from bottom
  const cardSlide = spring({
    frame: frame - 15,
    fps,
    config: { damping: 14, stiffness: 80 },
  });

  // Commission badge pop
  const commissionPop = spring({
    frame: frame - 40,
    fps,
    config: { damping: 10, stiffness: 150 },
  });

  // Slot items stagger
  const slot1 = spring({
    frame: frame - 25,
    fps,
    config: { damping: 12, stiffness: 100 },
  });
  const slot2 = spring({
    frame: frame - 32,
    fps,
    config: { damping: 12, stiffness: 100 },
  });
  const slot3 = spring({
    frame: frame - 39,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  // Exit
  const exitOpacity = interpolate(frame, [105, 120], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const slots = [
    { time: "10:00", service: "Balayage", duration: "1h30", spring: slot1 },
    { time: "11:30", service: "Coupe femme", duration: "45min", spring: slot2 },
    {
      time: "14:00",
      service: "Couleur + Soin",
      duration: "2h00",
      spring: slot3,
    },
  ];

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(180deg, #f5f3ff 0%, #ede9fe 50%, #e0e7ff 100%)",
        justifyContent: "center",
        alignItems: "center",
        opacity: enterOpacity * exitOpacity,
      }}
    >
      {/* Pillar badge */}
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
            background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
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
          Reservation en ligne
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
        Tes clientes reservent{"\n"}
        <span
          style={{
            background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          24h/24
        </span>
      </div>

      {/* Booking mockup card */}
      <div
        style={{
          position: "absolute",
          top: 520,
          width: 860,
          transform: `translateY(${(1 - cardSlide) * 300}px)`,
          opacity: cardSlide,
        }}
      >
        <GlassCard style={{ padding: 48 }}>
          {/* Card header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 36,
            }}
          >
            <div
              style={{
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: 32,
                fontWeight: 700,
                color: "#111827",
              }}
            >
              Aujourd'hui
            </div>
            <div
              style={{
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: 26,
                color: "#6b7280",
              }}
            >
              3 rendez-vous
            </div>
          </div>

          {/* Slot list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {slots.map((slot, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 24,
                  padding: "24px 28px",
                  background:
                    i === 0
                      ? "linear-gradient(135deg, rgba(79,70,229,0.08), rgba(124,58,237,0.08))"
                      : "rgba(249,250,251,0.8)",
                  borderRadius: 20,
                  border:
                    i === 0
                      ? "1px solid rgba(79,70,229,0.2)"
                      : "1px solid rgba(229,231,235,0.6)",
                  transform: `translateX(${(1 - slot.spring) * 200}px)`,
                  opacity: slot.spring,
                }}
              >
                {/* Time */}
                <div
                  style={{
                    fontFamily: "Arial, Helvetica, sans-serif",
                    fontSize: 34,
                    fontWeight: 800,
                    color: "#4f46e5",
                    minWidth: 110,
                  }}
                >
                  {slot.time}
                </div>

                {/* Divider */}
                <div
                  style={{
                    width: 3,
                    height: 48,
                    borderRadius: 2,
                    background:
                      "linear-gradient(180deg, #4f46e5, #7c3aed)",
                  }}
                />

                {/* Service info */}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontFamily: "Arial, Helvetica, sans-serif",
                      fontSize: 30,
                      fontWeight: 700,
                      color: "#111827",
                    }}
                  >
                    {slot.service}
                  </div>
                  <div
                    style={{
                      fontFamily: "Arial, Helvetica, sans-serif",
                      fontSize: 24,
                      color: "#6b7280",
                      marginTop: 4,
                    }}
                  >
                    {slot.duration}
                  </div>
                </div>

                {/* Status dot */}
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background:
                      i === 0
                        ? "#10b981"
                        : i === 1
                          ? "#f59e0b"
                          : "#6b7280",
                  }}
                />
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* 0% commission badge */}
      <div
        style={{
          position: "absolute",
          bottom: 260,
          transform: `scale(${commissionPop})`,
          opacity: commissionPop,
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #f43f5e, #ec4899)",
            borderRadius: 50,
            padding: "18px 48px",
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: 36,
            fontWeight: 800,
            color: "#ffffff",
            boxShadow: "0 4px 20px rgba(244,63,94,0.3)",
          }}
        >
          0% commission
        </div>
      </div>
    </AbsoluteFill>
  );
};
