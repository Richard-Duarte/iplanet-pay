"use client";

import dynamic from "next/dynamic";
import type { ComponentType, CSSProperties } from "react";

export type DuoScrollImage = { src: string; srcSet?: string };

export type IphoneDuoScrollProps = {
  interactionMode?: "scroll" | "drag";
  scrollLength?: number;
  reverseAnimation?: boolean;
  phoneSize?: number;
  phoneFinish?: "star-white" | "night-sky";
  background?: string;
  screen?: "wallpaper" | "launcher" | "custom";
  imageFit?: "cover" | "contain";
  innerImage?: DuoScrollImage;
  outerImage?: DuoScrollImage;
  screenBlur?: number;
  screenReflection?: number;
  clockMode?: "static" | "live";
  lockScreenUI?: {
    showClock?: boolean;
    showWifi?: boolean;
    showQuickActions?: boolean;
  };
  loaderColor?: string;
  loaderOpacity?: number;
  loaderStyle?: "fold" | "spinner";
  style?: CSSProperties;
};

const IphoneDuoScroll = dynamic(
  () =>
    import("@/vendor/iphone-duo-scroll/iphone_duo_scroll.js").then(
      (mod) => mod.default as ComponentType<IphoneDuoScrollProps>,
    ),
  {
    ssr: false,
    loading: () => (
      <div
        role="status"
        aria-label="Carregando iPhone Duo"
        style={{
          width: "100%",
          height: "100vh",
          minHeight: 480,
          display: "grid",
          placeItems: "center",
          background: "#ffffff",
          color: "#858580",
        }}
      >
        <div
          aria-hidden
          style={{
            width: 48,
            height: 40,
            display: "flex",
            perspective: 140,
            opacity: 0.5,
          }}
        >
          <span
            style={{
              width: 24,
              height: 40,
              border: "1.5px solid currentColor",
              borderRadius: "7px 1px 1px 7px",
              background: "currentColor",
              opacity: 0.28,
            }}
          />
          <span
            style={{
              width: 24,
              height: 40,
              border: "1.5px solid currentColor",
              borderRadius: "1px 7px 7px 1px",
              background: "currentColor",
              opacity: 0.6,
            }}
          />
        </div>
      </div>
    ),
  },
);

export function IphoneDuoScrollClient(props: IphoneDuoScrollProps) {
  return <IphoneDuoScroll {...props} />;
}
