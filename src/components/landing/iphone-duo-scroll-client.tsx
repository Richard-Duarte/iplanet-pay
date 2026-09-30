"use client";

import dynamic from "next/dynamic";
import { useMemo, type ComponentType, type CSSProperties } from "react";

export type DuoScrollImage = { src: string; srcSet?: string };

/** Raw controller from the bundled Framer / Three scene. */
export type DuoSceneController = {
  update: (
    progress: number,
    size: number,
    options: Record<string, unknown>,
    blur: number,
    reflection: number,
    isVisible: boolean,
  ) => void;
  dispose: () => void;
};

export type IphoneDuoScrollProps = {
  interactionMode?: "scroll" | "drag";
  scrollLength?: number;
  /** 0–1 controlled fold; parent owns sticky scroll when set */
  foldProgress?: number;
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
  onSceneReady?: (controller: DuoSceneController) => void;
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

/** Build displayOptions object expected by the vendor update() call. */
export function useDuoDisplayOptions(
  props: Pick<
    IphoneDuoScrollProps,
    "screen" | "innerImage" | "outerImage" | "imageFit" | "lockScreenUI"
  >,
) {
  return useMemo(
    () => ({
      screen: props.screen ?? "custom",
      clockMode: "static" as const,
      timeFormat: "auto" as const,
      clockColor: "#FFFFFF",
      timeFont: { fontFamily: "Inter", fontSize: "320px", fontWeight: 300 },
      dateFont: { fontFamily: "Inter", fontSize: "29px", fontWeight: 700 },
      timeOffsetY: 0,
      showClock: props.lockScreenUI?.showClock ?? false,
      showWifi: props.lockScreenUI?.showWifi ?? false,
      showQuickActions: props.lockScreenUI?.showQuickActions ?? false,
      innerImageSrc: props.innerImage?.src ?? "",
      outerImageSrc: props.outerImage?.src ?? "",
      imageFit: props.imageFit ?? "cover",
    }),
    [
      props.screen,
      props.innerImage?.src,
      props.outerImage?.src,
      props.imageFit,
      props.lockScreenUI?.showClock,
      props.lockScreenUI?.showWifi,
      props.lockScreenUI?.showQuickActions,
    ],
  );
}
