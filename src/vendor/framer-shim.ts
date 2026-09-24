/**
 * Minimal Framer runtime shim so marketplace components can run outside Framer.
 * Only the APIs used by iPhone Duo Scroll are implemented.
 */

export function addPropertyControls(_component: unknown, _controls?: unknown): void {
  // no-op outside Framer
}

export const ControlType = {
  String: "string",
  Number: "number",
  Boolean: "boolean",
  Enum: "enum",
  Color: "color",
  Font: "font",
  Image: "image",
  ResponsiveImage: "responsiveimage",
  File: "file",
  ComponentInstance: "componentinstance",
  Array: "array",
  Object: "object",
  Transition: "transition",
  BoxShadow: "boxshadow",
  Border: "border",
  BorderRadius: "borderradius",
  Padding: "padding",
  Gap: "gap",
  EventHandler: "eventhandler",
} as const;

const canvasSymbol = Symbol("framer-render-target-canvas");

export const RenderTarget = {
  canvas: canvasSymbol as unknown as object,
  current(): unknown {
    // Not the Framer design canvas → enable live WebGL
    return null;
  },
};

export function useIsStaticRenderer(): boolean {
  return false;
}
