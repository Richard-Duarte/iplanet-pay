const MAX_READY_MS = 12_000;
const MIN_VISIBLE_MS = 650;

/** Heavy landing files that must be in cache before the overlay lifts. */
export const LANDING_PRELOAD_URLS = [
  "/images/duo-scroll/step-1-outer.png",
  "/images/duo-scroll/step-1-inner.png",
  "/images/duo-scroll/step-2-outer.png",
  "/images/duo-scroll/step-2-inner.png",
  "/images/duo-scroll/step-3-outer.png",
  "/images/duo-scroll/step-3-inner.png",
  "/images/iphone-18-pro-max-unboxing.png",
  "/vendor/iphone-duo-scroll/duo_model.zip",
  "/models/iphone-18-pro-max/source/apple_iphone_18_pro_max_burgundy.glb",
] as const;

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function nextFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

async function waitForFonts(timeoutMs: number) {
  if (!document.fonts?.ready) return;
  await Promise.race([document.fonts.ready, delay(timeoutMs)]);
}

async function waitForImages(
  root: HTMLElement,
  timeoutMs: number,
  maxImages = 12,
) {
  const imgs = Array.from(root.querySelectorAll("img")).slice(0, maxImages);
  if (imgs.length === 0) return;

  await Promise.race([
    Promise.all(
      imgs.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) {
              resolve();
              return;
            }
            const done = () => resolve();
            img.addEventListener("load", done, { once: true });
            img.addEventListener("error", done, { once: true });
          }),
      ),
    ),
    delay(timeoutMs),
  ]);
}

function promoteLazyImages(root: HTMLElement) {
  for (const img of root.querySelectorAll("img")) {
    if (img.loading === "lazy") img.loading = "eager";
  }
}

async function preloadUrls(urls: readonly string[], timeoutMs: number) {
  if (urls.length === 0 || timeoutMs <= 0) return;
  await Promise.race([
    Promise.all(
      urls.map(async (url) => {
        try {
          const res = await fetch(url, { cache: "force-cache" });
          if (!res.ok) return;
          await res.blob();
        } catch {
          /* asset can still load later */
        }
      }),
    ),
    delay(timeoutMs),
  ]);
}

async function waitForSelector(selector: string, minCount: number, timeoutMs: number) {
  if (timeoutMs <= 0) return;
  const started = performance.now();
  while (performance.now() - started < timeoutMs) {
    if (document.querySelectorAll(selector).length >= minCount) return;
    await delay(80);
  }
}

export async function waitUntilPageReady(
  root: HTMLElement | null,
  options?: {
    imageCap?: number;
    minVisibleMs?: number;
    maxReadyMs?: number;
    preloadUrls?: readonly string[];
    waitFor?: { selector: string; minCount: number }[];
  },
) {
  const started = performance.now();
  const imageCap = options?.imageCap ?? 48;
  const minVisibleMs = options?.minVisibleMs ?? MIN_VISIBLE_MS;
  const maxReadyMs = options?.maxReadyMs ?? MAX_READY_MS;

  await nextFrame();
  await nextFrame();

  const elapsed = () => performance.now() - started;
  const remaining = () => Math.max(0, maxReadyMs - elapsed());

  if (root) promoteLazyImages(root);

  await Promise.all([
    waitForFonts(Math.min(1_200, remaining())),
    preloadUrls(options?.preloadUrls ?? [], remaining()),
    root ? waitForImages(root, remaining(), imageCap) : Promise.resolve(),
    ...(options?.waitFor ?? []).map((item) =>
      waitForSelector(item.selector, item.minCount, remaining()),
    ),
  ]);

  const minLeft = minVisibleMs - elapsed();
  if (minLeft > 0) await delay(minLeft);
}
