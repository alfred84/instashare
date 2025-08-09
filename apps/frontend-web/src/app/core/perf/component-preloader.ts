import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { Router, Route } from '@angular/router';

/**
 * Preloads standalone route components (loadComponent) when routes have data.preload === true.
 * Runs only in the browser and after bootstrap to avoid blocking initial render.
 */
export function preloadStandaloneComponents(router = inject(Router), platformId = inject(PLATFORM_ID)) {
  return () => {
    if (!isPlatformBrowser(platformId)) return;

    // Use idle callback when available; fallback to a short timeout
    const schedule = (fn: () => void) => {
      const w = globalThis as { requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number };
      if (typeof w.requestIdleCallback === 'function') {
        w.requestIdleCallback(fn, { timeout: 2000 });
      } else {
        setTimeout(fn, 300);
      }
    };

    schedule(() => {
      const routes: Route[] = router.config;
      type LoadableRoute = Route & { loadComponent?: () => Promise<unknown>; data?: { preload?: boolean } };
      const candidates = (routes as LoadableRoute[]).filter(
        (r) => !!r.loadComponent && !!r.data?.preload
      );
      for (const r of candidates) {
        try {
          const loader = r.loadComponent;
          if (typeof loader === 'function') {
            const res = loader();
            void Promise.resolve(res as unknown).catch(() => undefined);
          }
        } catch {
          // ignore preload errors; normal navigation will load as needed
        }
      }
    });
  };
}
