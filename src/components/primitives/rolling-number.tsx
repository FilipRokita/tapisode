"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useReducedMotion } from "./use-reduced-motion";

const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

/**
 * Text that rolls when it changes: the old value slides up out of a clipped line, then the new one slides up in
 * (180ms hold, then 0.4s). Without motion it just changes.
 */
export function RollingNumber({ value, className }: { value: string; className?: string }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(value);
  const inner = useRef<HTMLSpanElement>(null);
  const settled = useRef(true);

  // Out: slide the old text away, then swap it.
  useEffect(() => {
    if (reduced || shown === value) return;
    inner.current?.animate([{ transform: "none" }, { transform: "translateY(-100%)" }], { duration: 180, easing: EASE, fill: "forwards" });
    const timer = setTimeout(() => {
      settled.current = false;
      setShown(value);
    }, 180);
    return () => clearTimeout(timer);
  }, [value, shown, reduced]);

  // In: the new text rises from below.
  useLayoutEffect(() => {
    if (settled.current) return;
    settled.current = true;
    const node = inner.current;
    node?.getAnimations().forEach((a) => a.cancel());
    node?.animate([{ transform: "translateY(100%)" }, { transform: "none" }], { duration: 400, easing: EASE });
  }, [shown]);

  return (
    <span className={`relative inline-block h-[1.25em] overflow-hidden align-bottom ${className ?? ""}`}>
      <span ref={inner} className="block">
        {reduced ? value : shown}
      </span>
    </span>
  );
}
