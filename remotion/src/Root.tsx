import React from "react";
import { Composition } from "remotion";
import { QarteAd15s } from "./QarteAd/QarteAd15s";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="QarteAd15s"
        component={QarteAd15s}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
