import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

export const StorefrontScene: React.FC = () => {
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

  // Browser window card
  const cardSlide = spring({
    frame: frame - 12,
    fps,
    config: { damping: 14, stiffness: 80 },
  });

  // Google result pop
  const googlePop = spring({
    frame: frame - 45,
    fps,
    config: { damping: 10, stiffness: 130 },
  });

  // Star rating animation
  const starsScale = spring({
    frame: frame - 55,
    fps,
    config: { damping: 8, stiffness: 150 },
  });

  // Exit
  const exitOpacity = interpolate(frame, [75, 90], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(180deg, #ecfdf5 0%, #d1fae5 50%, #f0fdf4 100%)",
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
            background: "linear-gradient(135deg, #059669, #10b981)",
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
          Vitrine en ligne
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
        Visible sur{"\n"}
        <span
          style={{
            background: "linear-gradient(135deg, #059669, #10b981)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Google
        </span>
      </div>

      {/* Browser mockup */}
      <div
        style={{
          position: "absolute",
          top: 500,
          width: 880,
          transform: `translateY(${(1 - cardSlide) * 300}px)`,
          opacity: cardSlide,
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: 28,
            overflow: "hidden",
            boxShadow: "0 12px 48px rgba(0,0,0,0.1)",
            border: "1px solid rgba(229,231,235,0.8)",
          }}
        >
          {/* Browser bar */}
          <div
            style={{
              background: "#f3f4f6",
              padding: "16px 24px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", gap: 8 }}>
              {["#ef4444", "#f59e0b", "#22c55e"].map((c, i) => (
                <div
                  key={i}
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: c,
                  }}
                />
              ))}
            </div>
            <div
              style={{
                flex: 1,
                background: "#ffffff",
                borderRadius: 10,
                padding: "8px 20px",
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: 20,
                color: "#9ca3af",
              }}
            >
              getqarte.com/p/studio-beaute
            </div>
          </div>

          {/* Page content */}
          <div style={{ padding: 40 }}>
            {/* Salon header */}
            <div
              style={{
                display: "flex",
                gap: 24,
                alignItems: "center",
                marginBottom: 32,
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 20,
                  background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontSize: 36,
                  fontWeight: 900,
                  color: "#ffffff",
                }}
              >
                SB
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "Arial, Helvetica, sans-serif",
                    fontSize: 34,
                    fontWeight: 800,
                    color: "#111827",
                  }}
                >
                  Studio Beaute
                </div>
                <div
                  style={{
                    fontFamily: "Arial, Helvetica, sans-serif",
                    fontSize: 22,
                    color: "#6b7280",
                    marginTop: 4,
                  }}
                >
                  Institut de beaute - Paris 11e
                </div>
              </div>
            </div>

            {/* Services preview */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { name: "Soin visage complet", price: "65 EUR", dur: "1h00" },
                { name: "Manucure semi-permanent", price: "42 EUR", dur: "45min" },
                { name: "Epilation complete", price: "55 EUR", dur: "1h15" },
              ].map((service, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "18px 24px",
                    background: "#f9fafb",
                    borderRadius: 16,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: "Arial, Helvetica, sans-serif",
                        fontSize: 26,
                        fontWeight: 600,
                        color: "#111827",
                      }}
                    >
                      {service.name}
                    </div>
                    <div
                      style={{
                        fontFamily: "Arial, Helvetica, sans-serif",
                        fontSize: 20,
                        color: "#9ca3af",
                        marginTop: 2,
                      }}
                    >
                      {service.dur}
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: "Arial, Helvetica, sans-serif",
                      fontSize: 26,
                      fontWeight: 700,
                      color: "#4f46e5",
                    }}
                  >
                    {service.price}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Google search result floating */}
      <div
        style={{
          position: "absolute",
          bottom: 200,
          width: 780,
          transform: `scale(${googlePop}) translateY(${(1 - googlePop) * 40}px)`,
          opacity: googlePop,
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderRadius: 20,
            padding: "24px 32px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
            border: "1px solid rgba(229,231,235,0.6)",
          }}
        >
          <div
            style={{
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: 20,
              color: "#059669",
              marginBottom: 4,
            }}
          >
            getqarte.com/p/studio-beaute
          </div>
          <div
            style={{
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: 28,
              fontWeight: 700,
              color: "#1a0dab",
              marginBottom: 8,
            }}
          >
            Studio Beaute - Institut Paris 11e
          </div>
          {/* Stars */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              transform: `scale(${starsScale})`,
            }}
          >
            {[1, 2, 3, 4, 5].map((_, i) => (
              <span
                key={i}
                style={{
                  color: i < 5 ? "#f59e0b" : "#d1d5db",
                  fontSize: 24,
                }}
              >
                ★
              </span>
            ))}
            <span
              style={{
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: 22,
                color: "#6b7280",
                marginLeft: 4,
              }}
            >
              4.9 (127 avis)
            </span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
