import { lazy, ComponentType } from "react";

/**
 * Enhanced React lazy loading with automatic retry & recovery for stale deployment chunks.
 * If a user is on an older version and a new build changes chunk hashes, this recovers gracefully.
 */
export function lazyWithRetry<T extends ComponentType<Record<string, unknown>> | ComponentType<object>>(
  componentImport: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    const pageHasBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem("foceye_chunk_refresh") || "false"
    );

    try {
      const component = await componentImport();
      window.sessionStorage.setItem("foceye_chunk_refresh", "false");
      return component;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn("[FOCEYE] Dynamic import chunk error, attempting recovery:", msg);

      if (!pageHasBeenForceRefreshed) {
        // Mark that we tried reloading to avoid infinite reload loop
        window.sessionStorage.setItem("foceye_chunk_refresh", "true");
        window.location.reload();
        return new Promise<{ default: T }>(() => {
          // reload pending
        });
      }

      // If already refreshed and still failing, propagate error to ErrorBoundary
      window.sessionStorage.setItem("foceye_chunk_refresh", "false");
      throw error;
    }
  });
}
