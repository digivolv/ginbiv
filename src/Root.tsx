import React from "react";
import { Composition } from "remotion";
import { ELScene } from "./ELScene";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ELSculpture"
        component={ELScene}
        durationInFrames={300}
        fps={30}
        width={1280}
        height={720}
      />
    </>
  );
};
