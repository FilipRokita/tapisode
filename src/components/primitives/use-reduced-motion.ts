"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

const subscribe = (notify: () => void) => {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};

/** True when the visitor asked for less motion. Live: it follows a change in the system setting. */
export const useReducedMotion = (): boolean => useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);

/** The same answer for code that runs outside React, such as an event handler. */
export const prefersReducedMotion = (): boolean => typeof window !== "undefined" && window.matchMedia(QUERY).matches;
