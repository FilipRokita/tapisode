"use client";

import { useEffect, useState } from "react";
import { prefersReducedMotion } from "./use-reduced-motion";

/** Counts from 0 up to `target` (ease-out cubic). Under reduced motion it shows the final value at once. */
export function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const still = prefersReducedMotion();
    const start = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const p = still ? 1 : Math.min(1, (now - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return value;
}
