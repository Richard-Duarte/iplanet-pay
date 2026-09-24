import type { ComponentType, CSSProperties } from "react";

export type DuoScrollProps = {
  interactionMode?: "scroll" | "drag";
  scrollLength?: number;
  reverseAnimation?: boolean;
  phoneSize?: number;
  phoneFinish?: string;
  background?: string;
  screen?: string;
  imageFit?: string;
  innerImage?: { src: string };
  outerImage?: { src: string };
  screenBlur?: number;
  screenReflection?: number;
  clockMode?: string;
  lockScreenUI?: {
    showClock?: boolean;
    showWifi?: boolean;
    showQuickActions?: boolean;
  };
  loaderColor?: string;
  loaderOpacity?: number;
  loaderStyle?: string;
  style?: CSSProperties;
  [key: string]: unknown;
};

declare const IphoneDuoScroll: ComponentType<DuoScrollProps>;
export default IphoneDuoScroll;
