import {
  ADMIN_PREFETCH_ROUTES,
  CLIENTE_PREFETCH_ROUTES,
} from "@/lib/navigation/prefetch-routes";

export type ShellVariant = "cliente" | "admin";

const STORAGE_KEY = "ipay-shell-warm";

export function shellVariantForPath(path: string): ShellVariant {
  return path.startsWith("/admin") ? "admin" : "cliente";
}

export function routesForShell(variant: ShellVariant): readonly string[] {
  return variant === "admin" ? ADMIN_PREFETCH_ROUTES : CLIENTE_PREFETCH_ROUTES;
}

export function markShellWarm(variant: ShellVariant) {
  try {
    sessionStorage.setItem(STORAGE_KEY, variant);
  } catch {
    /* private mode */
  }
}

export function isShellWarm(variant: ShellVariant): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === variant;
  } catch {
    return false;
  }
}

export async function warmRoutes(
  prefetch: (href: string) => void | Promise<void>,
  routes: readonly string[],
  timeoutMs = 8_000,
) {
  const work = Promise.all(
    routes.map(async (href) => {
      try {
        await Promise.resolve(prefetch(href));
      } catch {
        /* route can still load on visit */
      }
    }),
  );
  await Promise.race([
    work,
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, timeoutMs);
    }),
  ]);
}
