"use client";

import { cn } from "cn";
import { useCallback, useEffect, useRef, type ReactNode } from "react";

/** How far, in pixels, the content takes to fade out at an edge. */
const EDGE = 28;

/**
 * A scrolling box whose top and bottom edges fade out while there is more to scroll, so content never meets a hard line.
 * The fade grows with the distance scrolled, up to `EDGE`, so a box at rest has none at the top.
 */
export function ScrollFade({ className, children }: { className?: string; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const update = useCallback(() => {
    const el = box.current;
    if (!el) return;
    el.style.setProperty("--fade-top", `${Math.min(el.scrollTop, EDGE)}px`);
    el.style.setProperty("--fade-bottom", `${Math.max(0, Math.min(el.scrollHeight - el.clientHeight - el.scrollTop, EDGE))}px`);
  }, []);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    update();
    // The content changes height when a title loads or a season is picked, so measure again then.
    const observer = new ResizeObserver(update);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    return () => observer.disconnect();
  }, [update]);
  return (
    <div ref={box} onScroll={update} className={cn("[mask-image:linear-gradient(to_bottom,transparent,#000_var(--fade-top,0px),#000_calc(100%-var(--fade-bottom,0px)),transparent)]", className)}>
      {children}
    </div>
  );
}
