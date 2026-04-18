import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Background gradient rotation
  const bgRotation = interpolate(frame, [0, 90], [0, 15]);

  // Text line 1 entrance
  const line1Scale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });
  const line1Opacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Text line 2 entrance (delayed)
  const line2Scale = spring({
    frame: frame - 10,
    fps,
    config: { damping: 12, stiffness: 100 },
  });
  const line2Opacity = interpolate(frame, [10, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Frustrated emoji bounce
  const emojiFrame = frame - 20;
  const emojiScale = spring({
    frame: emojiFrame,
    fps,
    config: { damping: 8, stiffness: 150 },
  });
  const emojiOpacity = interpolate(frame, [20, 28], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Subtle shake on emoji
  const emojiShake =
    emojiFrame > 0
      ? Math.sin(emojiFrame * 0.8) *
        interpolate(emojiFrame, [0, 30], [6, 0], {
          extrapolateRight: "clamp",
        })
      : 0;

  // DM notification badges floating in
  const badge1Y = spring({
    frame: frame - 35,
    fps,
    config: { damping: 10, stiffness: 80 },
  });
  const badge2Y = spring({
    frame: frame - 45,
    fps,
    config: { damping: 10, stiffness: 80 },
  });
  const badge3Y = spring({
    frame: frame - 55,
    fps,
    config: { damping: 10, stiffness: 80 },
  });

  const badgeOpacity1 = interpolate(frame, [35, 42], [0, 1], {
    extrapolateRight: "clamp",
  });
  const badgeOpacity2 = interpolate(frame, [45, 52], [0, 1], {
    extrapolateRight: "clamp",
  });
  const badgeOpacity3 = interpolate(frame, [55, 62], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Exit fade
  const exitOpacity = interpolate(frame, [75, 90], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${135 + bgRotation}deg, #f5f3ff 0%, #ede9fe 30%, #fce7f3 70%, #fdf2f8 100%)`,
        justifyContent: "center",
        alignItems: "center",
        opacity: exitOpacity,
      }}
    >
      {/* Decorative circles */}
      <div
        style={{
          position: "absolute",
          top: 200,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 300,
          left: -80,
          width: 300,
          height: 300,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(244,63,94,0.08) 0%, transparent 70%)",
        }}
      />

      {/* Main content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 40,
          padding: "0 60px",
        }}
      >
        {/* Hook text */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: 72,
              fontWeight: 800,
              color: "#111827",
              textAlign: "center",
              lineHeight: 1.15,
              transform: `scale(${line1Scale})`,
              opacity: line1Opacity,
            }}
          >
            Tu geres encore
          </div>
          <div
            style={{
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: 72,
              fontWeight: 800,
              color: "#111827",
              textAlign: "center",
              lineHeight: 1.15,
              transform: `scale(${line2Scale})`,
              opacity: line2Opacity,
            }}
          >
            tes resas{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              en DM
            </span>{" "}
            ?
          </div>
        </div>

        {/* Frustrated emoji */}
        <div
          style={{
            fontSize: 120,
            transform: `scale(${emojiScale}) rotate(${emojiShake}deg)`,
            opacity: emojiOpacity,
          }}
        >
          😩
        </div>

        {/* Floating DM notification badges */}
        <div
          style={{
            position: "absolute",
            top: 380,
            right: 80,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {[
            {
              text: '"Dispo demain 14h ?"',
              y: badge1Y,
              opacity: badgeOpacity1,
            },
            {
              text: '"Je veux un rdv svp"',
              y: badge2Y,
              opacity: badgeOpacity2,
            },
            {
              text: '"C possible samedi ?"',
              y: badge3Y,
              opacity: badgeOpacity3,
            },
          ].map((badge, i) => (
            <div
              key={i}
              style={{
                background: "rgba(255,255,255,0.85)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                borderRadius: 20,
                padding: "16px 28px",
                boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                border: "1px solid rgba(255,255,255,0.6)",
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: 28,
                color: "#374151",
                opacity: badge.opacity,
                transform: `translateY(${(1 - badge.y) * 40}px)`,
              }}
            >
              {badge.text}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
