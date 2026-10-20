"use client";

import { useSyncExternalStore } from "react";

/** Live result of a CSS media query. False during the server render. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (notify) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", notify);
      return () => media.removeEventListener("change", notify);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** The one breakpoint of the app: the desktop layout starts at 760px. */
export const useIsDesktop = (): boolean => useMediaQuery("(min-width: 760px)");
