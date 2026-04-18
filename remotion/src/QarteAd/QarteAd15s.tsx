import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { HookScene } from "./scenes/HookScene";
import { BookingScene } from "./scenes/BookingScene";
import { LoyaltyScene } from "./scenes/LoyaltyScene";
import { StorefrontScene } from "./scenes/StorefrontScene";
import { CtaScene } from "./scenes/CtaScene";

// 15s ad at 30fps = 450 frames
// Scene 1: 0-3s   (frames 0-89)    — Hook
// Scene 2: 3-7s   (frames 90-209)  — Booking
// Scene 3: 7-10s  (frames 210-299) — Loyalty
// Scene 4: 10-13s (frames 300-389) — Storefront
// Scene 5: 13-15s (frames 390-449) — CTA

export const QarteAd15s: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#ffffff" }}>
      <Sequence from={0} durationInFrames={90}>
        <HookScene />
      </Sequence>

      <Sequence from={90} durationInFrames={120}>
        <BookingScene />
      </Sequence>

      <Sequence from={210} durationInFrames={90}>
        <LoyaltyScene />
      </Sequence>

      <Sequence from={300} durationInFrames={90}>
        <StorefrontScene />
      </Sequence>

      <Sequence from={390} durationInFrames={60}>
        <CtaScene />
      </Sequence>
    </AbsoluteFill>
  );
};
