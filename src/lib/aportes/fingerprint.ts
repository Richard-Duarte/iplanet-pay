export type DeviceFingerprint = {
  userAgent: string;
  language: string;
  languages: readonly string[];
  platform: string;
  timezone: string;
  screen: { width: number; height: number; pixelRatio: number };
  hardwareConcurrency: number | null;
  deviceMemory: number | null;
  maxTouchPoints: number;
  cookieEnabled: boolean;
  canvasHash: string | null;
};

async function sha256Hex(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function collectDeviceFingerprint(): Promise<DeviceFingerprint> {
  let canvasHash: string | null = null;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 240;
    canvas.height = 48;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.textBaseline = "top";
      ctx.font = "16px Arial";
      ctx.fillStyle = "#111";
      ctx.fillText("iplanet-pay-aporte", 2, 2);
      canvasHash = await sha256Hex(canvas.toDataURL());
    }
  } catch {
    canvasHash = null;
  }

  const nav = navigator as Navigator & { deviceMemory?: number };

  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    languages: navigator.languages ? [...navigator.languages] : [],
    platform: navigator.platform,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "",
    screen: {
      width: window.screen.width,
      height: window.screen.height,
      pixelRatio: window.devicePixelRatio,
    },
    hardwareConcurrency: navigator.hardwareConcurrency ?? null,
    deviceMemory: nav.deviceMemory ?? null,
    maxTouchPoints: navigator.maxTouchPoints ?? 0,
    cookieEnabled: navigator.cookieEnabled,
    canvasHash,
  };
}
