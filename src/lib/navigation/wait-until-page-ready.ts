const MAX_READY_MS = 3_200;
const MIN_VISIBLE_MS = 650;

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

export async function waitUntilPageReady(
  root: HTMLElement | null,
  options?: { imageCap?: number; minVisibleMs?: number },
) {
  const started = performance.now();
  const imageCap = options?.imageCap ?? 12;
  const minVisibleMs = options?.minVisibleMs ?? MIN_VISIBLE_MS;

  await nextFrame();
  await nextFrame();

  const elapsed = () => performance.now() - started;
  const remaining = () => Math.max(0, MAX_READY_MS - elapsed());

  await waitForFonts(Math.min(900, remaining()));
  if (root) {
    await waitForImages(root, Math.min(900, remaining()), imageCap);
  }

  const minLeft = minVisibleMs - elapsed();
  if (minLeft > 0) await delay(minLeft);
}
