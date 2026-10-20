"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "./use-reduced-motion";

/** An integer that counts toward `target` instead of jumping (ease-out cubic). Under reduced motion it jumps. */
export function useAnimatedNumber(target: number, duration = 620): number {
  const [shown, setShown] = useState(target);
  const from = useRef(target);
  const shownRef = useRef(target);

  useEffect(() => {
    shownRef.current = shown;
  });

  useEffect(() => {
    if (prefersReducedMotion()) {
      from.current = target;
      const frame = requestAnimationFrame(() => setShown(target));
      return () => cancelAnimationFrame(frame);
    }
    const start = performance.now();
    const origin = shownRef.current;
    from.current = origin;
    let frame = requestAnimationFrame(function tick(now) {
      const p = Math.min(1, (now - start) / duration);
      setShown(Math.round(origin + (target - origin) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return shown;
}
